import type { ReactNode } from 'react';
import { Badge } from './ui/badge';

export interface RecordDetail { label: string; value: ReactNode }

/** Presenta datos guardados como texto seleccionable, con etiquetas y valores de distinta jerarquía. */
export function RecordDetails({ items }: { items: readonly RecordDetail[] }) {
  return <dl className="record-details">{items.map(({ label, value }) => <div key={label}>
    <dt>{label}</dt><dd>{value === null || value === undefined || value === '' ? <Badge variant="secondary">Pendiente</Badge> : value}</dd>
  </div>)}</dl>;
}

/** Identifica lectura, edición y creación con la misma presentación en todos los editores. */
export function EditorStatus({ editing, saved, dirty = false }: { editing: boolean; saved: boolean; dirty?: boolean }) {
  return <div className="editor-status" role="status"><Badge variant={editing ? 'secondary' : 'outline'}>{editing ? saved ? 'Editando' : 'Nuevo registro' : 'Guardado'}</Badge>
    <span>{dirty ? 'Cambios sin guardar' : editing ? 'Completá los datos y guardá.' : 'Datos guardados · elegí Editar para modificarlos.'}</span>
  </div>;
}
