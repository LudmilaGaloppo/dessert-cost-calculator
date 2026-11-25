import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { calculateIngredientForm, emptyIngredientForm, exampleIngredientForm, supplyInputFromForm, validateDecimalField } from '../utils/ingredient-form';
import { deleteSupply, listSupplies, saveSupply } from '../services/supplies';
import type { IngredientFormValues, IngredientFormResult } from '../types/ingredient-form';
import type { Supply } from '@dessert-cost/shared';
import CatalogPicker from '../components/CatalogPicker';
import { RecordDetails, EditorStatus } from '../components/RecordDetails';
import { useUnsavedChanges } from '../components/UnsavedChanges';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Pencil } from 'lucide-react';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

/** Renderiza las unidades disponibles en los selectores de compra y uso. */
function UnitOptions() {
  return <><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option><option value="unit">Unidades</option></>;
}

/** Presenta el mensaje de validación junto al campo al que pertenece. */
function FieldMessage({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra los campos, envía el cálculo y presenta su resultado o un mensaje de error. */
export default function IngredientCalculator() {
  // register conecta los inputs; handleSubmit valida; reset carga o limpia el formulario.
  const { register, handleSubmit, reset, getValues, trigger, setError, clearErrors, formState: { errors, isDirty } } = useForm<IngredientFormValues>({ defaultValues: emptyIngredientForm });
  const [result, setResult] = useState<IngredientFormResult | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [selectedSupplyId, setSelectedSupplyId] = useState('');
  const [isEditingSupply, setIsEditingSupply] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  // useRef bloquea un segundo guardado inmediatamente, incluso antes del próximo render.
  const savingRequest = useRef(false);
  const confirmDiscard = useUnsavedChanges(isDirty, 'Insumo y cálculo', isSaving);
  const selectedSupply = supplies.find((supply) => supply.id === selectedSupplyId);
  const isReadingSupply = Boolean(selectedSupply) && !isEditingSupply;

  // La carga inicial se cancela al desmontar la pantalla para evitar respuestas tardías.
  useEffect(function loadInitialCatalog() {
    const controller = new AbortController();
    void refreshCatalog(controller.signal);
    /** Cancela la petición pendiente cuando React desmonta la pantalla. */
    return function cancelCatalogLoad() { controller.abort(); };
  }, []);

  /** Lee nuevamente los insumos guardados y muestra un error recuperable si la API no responde. */
  async function refreshCatalog(signal?: AbortSignal) {
    setIsLoading(true);
    setCatalogError('');
    try {
      const data = await listSupplies(signal);
      if (!signal?.aborted) setSupplies(data);
    } catch (error) {
      if (!signal?.aborted) setCatalogError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }

  /** Reintenta la lectura del catálogo desde el botón de actualización. */
  function handleRefresh() { void refreshCatalog(); }

  /** Retira el resultado y los mensajes anteriores al editar un campo. */
  function clearCalculation() {
    setResult(null);
    clearErrors('root');
    setSaveMessage('');
  }

  /** Calcula con los valores que validó React Hook Form y muestra errores de unidades incompatibles. */
  function onCalculate(values: IngredientFormValues) {
    try {
      setResult(calculateIngredientForm(values));
      clearErrors('root');
    } catch (cause) {
      setResult(null);
      setError('root.calculation', { message: cause instanceof Error ? cause.message : 'No pudimos calcular el costo. Revisá los datos.' });
    }
  }

  /** Guarda o actualiza únicamente el insumo; la cantidad usada pertenece al cálculo, no al catálogo. */
  async function handleSaveSupply() {
    if (savingRequest.current) return;
    savingRequest.current = true;
    setSaveMessage('');
    setCatalogError('');
    try {
      if (!await trigger(['name', 'purchaseQuantity', 'purchasePrice', 'purchaseUnit'], { shouldFocus: true })) return;
      setIsSaving(true);
      const saved = await saveSupply(supplyInputFromForm(getValues()), selectedSupplyId || undefined);
      setSupplies((current) => [...current.filter((supply) => supply.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      reset({ ...getValues(), name: saved.name, purchaseQuantity: String(saved.purchaseQuantity), purchasePrice: String(saved.purchasePrice), purchaseUnit: saved.purchaseUnit });
      setSelectedSupplyId(saved.id);
      setIsEditingSupply(false);
      setResult(null);
      setSaveMessage('Insumo guardado. Ya está disponible en tu catálogo.');
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No se pudo guardar el insumo.');
    } finally { savingRequest.current = false; setIsSaving(false); }
  }

  /** Pide confirmación y elimina el insumo seleccionado si ninguna receta lo utiliza. */
  async function handleDeleteSupply() {
    const selected = supplies.find((supply) => supply.id === selectedSupplyId);
    if (!selected || savingRequest.current) return;
    if (!window.confirm(`¿Eliminar “${selected.name}” del catálogo? Esta acción no se puede deshacer.`)) return;
    savingRequest.current = true;
    setIsSaving(true);
    setCatalogError('');
    setSaveMessage('');
    try {
      await deleteSupply(selected.id);
      setSupplies((current) => current.filter((supply) => supply.id !== selected.id));
      handleReset();
      setSaveMessage(`Se eliminó “${selected.name}” del catálogo.`);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'No se pudo eliminar el insumo.');
    } finally { savingRequest.current = false; setIsSaving(false); }
  }

  /** Carga la compra elegida desde MongoDB y conserva la cantidad de uso que se estaba editando. */
  function handleLoadSupply(id: string) {
    const supply = supplies.find((item) => item.id === id);
    if (!supply) { handleReset(); return; }
    reset({ ...getValues(), name: supply.name, purchaseQuantity: String(supply.purchaseQuantity), purchasePrice: String(supply.purchasePrice), purchaseUnit: supply.purchaseUnit });
    setSelectedSupplyId(supply.id);
    setIsEditingSupply(false);
    clearCalculation();
  }

  /** Carga el ejemplo conocido de harina y muestra su costo de $900 para explorar el formulario. */
  function handleExample() {
    reset(exampleIngredientForm);
    setSelectedSupplyId('');
    setIsEditingSupply(true);
    setResult(calculateIngredientForm(exampleIngredientForm));
    setSaveMessage('');
  }

  /** Vacía los campos y limpia los mensajes para comenzar otro cálculo. */
  function handleReset() {
    reset(emptyIngredientForm);
    setSelectedSupplyId('');
    setIsEditingSupply(true);
    setResult(null);
    setSaveMessage('');
  }

  /** Recupera el insumo guardado o limpia el nuevo registro después de confirmar el descarte. */
  function cancelEdit() {
    confirmDiscard(() => { if (selectedSupply) handleLoadSupply(selectedSupply.id); else handleReset(); });
  }

  return <main id="main" tabIndex={-1}>
    <div className="page-heading"><p className="eyebrow">TU CATÁLOGO</p><h1>Calculá lo que usás.</h1><p>Guardá tus compras y conocé cuánto aporta cada ingrediente a tu receta.</p></div>
    <CatalogPicker title="Insumos" label="Buscar un insumo" createLabel="Nuevo insumo" id="savedSupply" value={selectedSupplyId}
      options={supplies.map((supply) => ({ value: supply.id, label: supply.name }))} loading={isLoading} disabled={isSaving}
      onSelect={(id) => confirmDiscard(() => handleLoadSupply(id))} onCreate={() => confirmDiscard(handleReset)} onRefresh={handleRefresh} />
    {catalogError && <p className="error-message" role="alert">{catalogError}</p>}
    <div className="calculator-layout">
      <form className="form-card" onSubmit={handleSubmit(onCalculate)} onChange={clearCalculation} noValidate aria-label="Calcular costo de un ingrediente">
        <fieldset className="form-controls" disabled={isSaving || isLoading}>
          <div className="card-heading"><h2>{selectedSupply ? 'Datos del insumo' : 'Nuevo insumo'}</h2>
            {isReadingSupply && <Button type="button" variant="outline" onClick={() => setIsEditingSupply(true)}><Pencil aria-hidden="true" />Editar</Button>}
          </div>
          <EditorStatus editing={!isReadingSupply} saved={Boolean(selectedSupply)} dirty={isDirty && !isReadingSupply} />
          {isReadingSupply && selectedSupply ? <RecordDetails items={[
            { label: 'Nombre del insumo', value: selectedSupply.name },
            { label: 'Cantidad comprada', value: decimal.format(selectedSupply.purchaseQuantity) + ' ' + selectedSupply.purchaseUnit },
            { label: 'Precio total de compra', value: pesos.format(selectedSupply.purchasePrice) },
          ]} /> : <>
            <label className="field">Nombre del insumo<Input {...register('name', { required: 'Ingresá el nombre del insumo.', maxLength: { value: 120, message: 'Usá hasta 120 caracteres.' } })} placeholder="Por ejemplo, harina 0000" aria-invalid={Boolean(errors.name)} aria-describedby="name-error" /><FieldMessage id="name-error" message={errors.name?.message} /></label>
            <div className="field-row price-field">
              <label className="field">Cantidad comprada<Input {...register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad comprada', true) })} inputMode="decimal" placeholder="2,5" aria-invalid={Boolean(errors.purchaseQuantity)} aria-describedby="purchase-quantity-error" /><FieldMessage id="purchase-quantity-error" message={errors.purchaseQuantity?.message} /></label>
              <label className="field">Unidad de compra<NativeSelect {...register('purchaseUnit')}><UnitOptions /></NativeSelect></label>
            </div>
            <label className="field price-field">Precio total de compra (ARS)<Input {...register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio de compra') })} inputMode="decimal" placeholder="6000" aria-invalid={Boolean(errors.purchasePrice)} aria-describedby="purchase-price-error" /><FieldMessage id="purchase-price-error" message={errors.purchasePrice?.message} /></label>
            <div className="form-actions editor-actions"><Button type="button" onClick={handleSaveSupply}>{isSaving ? 'Guardando…' : selectedSupply ? 'Guardar cambios' : 'Guardar insumo'}</Button><Button type="button" variant="outline" onClick={cancelEdit}>Cancelar</Button>
              {selectedSupply && <Button type="button" variant="destructive" onClick={handleDeleteSupply}>Eliminar insumo</Button>}
            </div>
          </>}
          {saveMessage && <p className="save-message" role="status">{saveMessage}</p>}
          <section className="nested-card" aria-labelledby="ingredient-use-heading">
            <div className="card-heading"><h2 id="ingredient-use-heading">Probá una cantidad</h2><Button type="button" variant="ghost" onClick={() => confirmDiscard(handleExample)}>Cargar ejemplo</Button></div>
            <p className="section-help">Este cálculo no modifica la compra guardada.</p>
            <div className="field-row">
              <label className="field">Cantidad utilizada<Input {...register('usedQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad utilizada') })} inputMode="decimal" placeholder="375" aria-invalid={Boolean(errors.usedQuantity)} aria-describedby="used-quantity-error" /><FieldMessage id="used-quantity-error" message={errors.usedQuantity?.message} /></label>
              <label className="field">Unidad de uso<NativeSelect {...register('usedUnit')}><UnitOptions /></NativeSelect></label>
            </div>
            <p className="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
            {errors.root?.calculation && <p className="error-message" role="alert">{errors.root.calculation.message}</p>}
            <Button type="submit">Calcular costo</Button>
          </section>
        </fieldset>
      </form>
      <aside className="result-column" aria-label="Resultado del cálculo">
        <section className="result-card" aria-live="polite" aria-atomic="true"><p className="eyebrow">COSTO EN TU RECETA</p>
          {result ? <><h2 className="result-amount">{pesos.format(result.cost)}</h2><p className="result-description">{decimal.format(result.usedQuantity)} {result.usedUnit === 'unit' ? 'unidades' : result.usedUnit} de {result.name}</p>
            <dl className="result-breakdown"><div><dt>Compra de referencia</dt><dd>{decimal.format(result.purchaseQuantity)} {result.purchaseUnit}</dd></div><div><dt>Precio de esa compra</dt><dd>{pesos.format(result.purchasePrice)}</dd></div></dl>
            <p className="result-footnote">Importe proporcional a la cantidad utilizada.</p>
          </> : <><h2 className="result-placeholder">Cada ingrediente cuenta.</h2><p className="result-description">Elegí un insumo, ingresá cuánto vas a usar y calculá su costo.</p></>}
        </section>
        <section className="scope-note"><h2>De la compra a la receta</h2><p>Guardá aquí tus insumos y sus precios. En Recetas podés combinarlos y sumar trabajo y energía.</p></section>
      </aside>
    </div>
    <footer className="page-footer">Hecho para entender tus costos, receta a receta.</footer>
  </main>;
}
