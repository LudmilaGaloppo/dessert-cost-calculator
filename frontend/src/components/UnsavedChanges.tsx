import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';

interface FormState { dirty: boolean; busy: boolean; label: string }
interface ChangesContextValue {
  setForm(id: string, state: FormState | null): void;
  requestDiscard(action: () => void, dirty?: boolean): void;
  busy: boolean;
}
const ChangesContext = createContext<ChangesContextValue | null>(null);

/** Protege la navegación y el cierre de pestaña, y confirma antes de descartar formularios modificados. */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<Record<string, FormState>>({});
  const [pending, setPending] = useState<{ action: () => void } | null>(null);
  const states = Object.values(forms);
  const dirty = states.some((state) => state.dirty);
  const busy = states.some((state) => state.busy);

  /** Registra el estado de cada formulario sin conservar los valores ingresados. */
  const setForm = useCallback((id: string, state: FormState | null) => {
    setForms((previous) => {
      const next = { ...previous };
      if (state) next[id] = state;
      else delete next[id];
      return next;
    });
  }, []);

  /** Ejecuta una transición o espera la decisión si se perderían cambios; bloquea durante guardados. */
  const requestDiscard = useCallback((action: () => void, localDirty = dirty) => {
    if (busy) return;
    if (localDirty) setPending({ action });
    else action();
  }, [dirty, busy]);

  useEffect(function protectTabClose() {
    if (!dirty && !busy) return;
    /** Activa la confirmación nativa cuando se recarga o cierra la pestaña. */
    function beforeUnload(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ''; }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, busy]);

  const value = useMemo(() => ({ setForm, requestDiscard, busy }), [setForm, requestDiscard, busy]);
  return <ChangesContext.Provider value={value}>{children}
    <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
        <AlertDialogDescription>Tenés datos sin guardar. Si continuás, se perderán los cambios del formulario que vas a dejar.</AlertDialogDescription>
      </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Seguir editando</AlertDialogCancel>
        <AlertDialogAction onClick={() => { const action = pending?.action; setPending(null); action?.(); }}>Descartar cambios</AlertDialogAction>
      </AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </ChangesContext.Provider>;
}

/** Obtiene la protección compartida de navegación dentro de su proveedor. */
export function useNavigationGuard() {
  const context = useContext(ChangesContext);
  if (!context) throw new Error('Falta UnsavedChangesProvider.');
  return context;
}

/** Comunica cambios y operaciones pendientes; devuelve una confirmación para reemplazar este formulario. */
export function useUnsavedChanges(dirty: boolean, label: string, busy = false) {
  const id = useId();
  const { setForm, requestDiscard } = useNavigationGuard();
  useEffect(function registerChanges() {
    setForm(id, { dirty, label, busy });
    return () => setForm(id, null);
  }, [id, dirty, label, busy, setForm]);
  return (action: () => void) => requestDiscard(action, dirty);
}
