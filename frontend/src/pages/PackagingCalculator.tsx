import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { CostSettings, Packaging, Recipe, SaleQuoteCost, StickerSettings, Supply } from '@dessert-cost/shared';
import type { PackagingFormValues, QuoteFormValues } from '../types/packaging-form';
import { emptyPackagingForm, packagingInputFromForm, packagingToForm } from '../utils/packaging-form';
import { parseDecimal, validateDecimalField } from '../utils/ingredient-form';
import { calculateProductionCost, calculateSaleQuoteCost } from '../domain/costs';
import { listSupplies } from '../services/supplies';
import { listRecipes } from '../services/recipes';
import { getCostSettings } from '../services/settings';
import { deletePackaging, getStickerSettings, listPackaging, savePackaging, saveStickerSettings } from '../services/packaging';
import SalePriceCalculator from '../components/SalePriceCalculator';
import SearchableSelect from '../components/SearchableSelect';
import CatalogPicker from '../components/CatalogPicker';
import { RecordDetails, EditorStatus } from '../components/RecordDetails';
import { useNavigationGuard, useUnsavedChanges } from '../components/UnsavedChanges';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Pencil, Package, Calculator } from 'lucide-react';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

interface StickerFormValues { name: string; purchaseQuantity: string; purchasePrice: string }
interface QuoteView { cost: SaleQuoteCost; recipeName: string; packagingName: string }

/** Presenta un error de React Hook Form junto al campo correspondiente. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra envases, stickers y el costo de una cantidad de cookies. */
export default function PackagingCalculator() {
  const packagingForm = useForm<PackagingFormValues>({ defaultValues: emptyPackagingForm() });
  const stickerForm = useForm<StickerFormValues>({ defaultValues: { name: '', purchaseQuantity: '', purchasePrice: '' } });
  const quoteForm = useForm<QuoteFormValues>({ defaultValues: { recipeId: '', packagingId: '', requestedUnits: '' } });
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [settings, setSettings] = useState<CostSettings>({ hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null });
  const [stickers, setStickers] = useState<StickerSettings>({ name: null, purchaseQuantity: null, purchasePrice: null });
  const [selectedPackagingId, setSelectedPackagingId] = useState('');
  const [isEditingPackaging, setIsEditingPackaging] = useState(true);
  const [isEditingStickers, setIsEditingStickers] = useState(true);
  const [result, setResult] = useState<QuoteView | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const requestInProgress = useRef(false);
  const isReadingPackaging = Boolean(selectedPackagingId) && !isEditingPackaging;
  const selectedPackaging = packaging.find((item) => item.id === selectedPackagingId);
  const confirmPackagingDiscard = useUnsavedChanges(packagingForm.formState.isDirty, 'Envase', busy);
  const confirmStickerDiscard = useUnsavedChanges(stickerForm.formState.isDirty, 'Stickers', busy);
  useUnsavedChanges(quoteForm.formState.isDirty || result !== null, 'Simulación de venta', busy);
  const { requestDiscard } = useNavigationGuard();

  // Cancela la carga si la persona cambia de sección antes de recibir los datos.
  useEffect(function loadInitialData() {
    const controller = new AbortController();
    void refreshData(controller.signal);
    return () => controller.abort();
  }, []);

  /** Recupera todos los datos necesarios para administrar y cotizar packaging. */
  async function refreshData(signal?: AbortSignal) {
    setLoading(true); setError(''); setResult(null);
    try {
      const [savedPackaging, savedRecipes, savedSupplies, costSettings, stickerSettings] = await Promise.all([
        listPackaging(signal), listRecipes(signal), listSupplies(signal), getCostSettings(signal), getStickerSettings(signal),
      ]);
      if (signal?.aborted) return;
      setPackaging(savedPackaging); setRecipes(savedRecipes); setSupplies(savedSupplies); setSettings(costSettings); setStickers(stickerSettings);
      setIsEditingStickers(stickerSettings.name === null);
      stickerForm.reset({ name: stickerSettings.name ?? '', purchaseQuantity: stickerSettings.purchaseQuantity === null ? '' : String(stickerSettings.purchaseQuantity), purchasePrice: stickerSettings.purchasePrice === null ? '' : String(stickerSettings.purchasePrice) });
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }

  /** Limpia mensajes y resultados que quedaron desactualizados por una edición. */
  function clearFeedback() { setResult(null); setError(''); setMessage(''); }

  /** Limpia avisos del catálogo sin descartar una simulación basada en datos todavía vigentes. */
  function clearMessages() { setError(''); setMessage(''); }

  /** Prepara el formulario para crear otro envase. */
  function newPackaging() { packagingForm.reset(emptyPackagingForm()); setSelectedPackagingId(''); setIsEditingPackaging(true); clearMessages(); }

  /** Carga el envase seleccionado en el formulario de edición. */
  function loadPackaging(id: string) {
    const selected = packaging.find((item) => item.id === id);
    if (!selected) { newPackaging(); return; }
    packagingForm.reset(packagingToForm(selected)); setSelectedPackagingId(selected.id); setIsEditingPackaging(false); clearMessages();
  }

  /** Restaura los datos del envase guardado o el formulario inicial después de confirmar. */
  function cancelPackaging() { confirmPackagingDiscard(() => selectedPackagingId ? loadPackaging(selectedPackagingId) : newPackaging()); }

  /** Restaura la compra de stickers sin modificar el registro persistido. */
  function cancelStickers() {
    confirmStickerDiscard(() => {
      stickerForm.reset({ name: stickers.name ?? '', purchaseQuantity: stickers.purchaseQuantity === null ? '' : String(stickers.purchaseQuantity), purchasePrice: stickers.purchasePrice === null ? '' : String(stickers.purchasePrice) });
      setIsEditingStickers(stickers.name === null); clearMessages();
    });
  }

  /** Guarda o actualiza los datos de compra y capacidad del envase. */
  async function submitPackaging(values: PackagingFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const saved = await savePackaging(packagingInputFromForm(values), selectedPackagingId || undefined);
      setPackaging((previous) => [...previous.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedPackagingId(saved.id); packagingForm.reset(packagingToForm(saved));
      setIsEditingPackaging(false);
      setMessage('Envase guardado. Ya está disponible para cotizar.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar el envase.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Pide confirmación y elimina el envase seleccionado del catálogo. */
  async function handleDeletePackaging() {
    const selected = packaging.find((item) => item.id === selectedPackagingId);
    if (!selected || requestInProgress.current) return;
    if (!window.confirm(`¿Eliminar el envase “${selected.name}”? Esta acción no se puede deshacer.`)) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      await deletePackaging(selected.id);
      setPackaging((current) => current.filter((item) => item.id !== selected.id));
      if (quoteForm.getValues('packagingId') === selected.id) quoteForm.setValue('packagingId', '');
      newPackaging();
      setMessage(`Se eliminó el envase “${selected.name}”.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el envase.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Guarda la compra compartida de stickers sin duplicarla en cada envase. */
  async function submitStickers(values: StickerFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const name = values.name.trim();
      if (!name) throw new Error('Ingresá el nombre del sticker.');
      const purchaseQuantity = parseDecimal(values.purchaseQuantity, 'la cantidad de stickers');
      const purchasePrice = parseDecimal(values.purchasePrice, 'el precio de los stickers');
      if (!Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) throw new Error('La cantidad de stickers debe ser un entero mayor que cero.');
      if (purchasePrice < 0) throw new Error('El precio de los stickers no puede ser negativo.');
      const saved = await saveStickerSettings(name, purchaseQuantity, purchasePrice);
      setStickers(saved); stickerForm.reset({ name: saved.name ?? '', purchaseQuantity: String(saved.purchaseQuantity), purchasePrice: String(saved.purchasePrice) });
      setIsEditingStickers(false);
      setMessage('Compra de stickers actualizada.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los stickers.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Relee precios vigentes y calcula productos, envases y stickers de la cotización. */
  async function calculateQuote(values: QuoteFormValues) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearFeedback();
    try {
      const [currentPackaging, currentRecipes, currentSupplies, currentSettings, currentStickers] = await Promise.all([
        listPackaging(), listRecipes(), listSupplies(), getCostSettings(), getStickerSettings(),
      ]);
      const recipe = currentRecipes.find((item) => item.id === values.recipeId);
      const selected = currentPackaging.find((item) => item.id === values.packagingId);
      if (!recipe) throw new Error('Elegí una receta guardada.');
      if (!selected) throw new Error('Elegí un envase guardado.');
      const requestedUnits = parseDecimal(values.requestedUnits, 'la cantidad de cookies');
      const production = calculateProductionCost(recipe, currentSupplies, currentSettings);
      const cost = calculateSaleQuoteCost(recipe, production, selected, currentStickers, requestedUnits);
      setPackaging(currentPackaging); setRecipes(currentRecipes); setSupplies(currentSupplies); setSettings(currentSettings); setStickers(currentStickers);
      setResult({ cost, recipeName: recipe.name, packagingName: selected.name });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo calcular la cotización.'); }
    finally { requestInProgress.current = false; setBusy(false); }
  }

  return <main id="main" tabIndex={-1}>
    <div className="page-heading"><p className="eyebrow">PACKAGING Y VENTA</p><h1>Una presentación, tu precio.</h1><p>Elegí cómo vas a vender tus cookies y conocé cuánto queda para vos.</p></div>
    <Tabs defaultValue="sale" className="packaging-tabs">
      <TabsList aria-label="Tareas de packaging"><TabsTrigger value="sale"><Calculator aria-hidden="true" />Calcular una venta</TabsTrigger><TabsTrigger value="catalog"><Package aria-hidden="true" />Envases y stickers</TabsTrigger></TabsList>
      {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="save-message" role="status">{message}</p>}
      <TabsContent value="sale" keepMounted>
        <ol className="sale-steps" aria-label="Pasos para calcular una venta"><li><span>1</span>Receta</li><li><span>2</span>Presentación</li><li><span>3</span>Cantidad</li><li><span>4</span>Precio y ganancia</li></ol>
        <div className="calculator-layout sale-layout">
          <form className="form-card" onSubmit={quoteForm.handleSubmit(calculateQuote)} onChange={clearFeedback} noValidate aria-label="Calcular una venta"><fieldset className="form-controls" disabled={busy || loading}>
            <div className="card-heading"><h2>Armá tu venta</h2></div><p className="section-help">Los importes corresponden a toda la cantidad que elijas, con sus envases y stickers.</p>
            <input type="hidden" {...quoteForm.register('recipeId', { required: 'Elegí una receta.' })} />
            <label className="field" htmlFor="quote-recipe">1. Receta<SearchableSelect id="quote-recipe" value={quoteForm.watch('recipeId')} onChange={(value) => { quoteForm.setValue('recipeId', value, { shouldValidate: true, shouldDirty: true }); clearFeedback(); }} placeholder="Buscá una receta guardada" invalid={Boolean(quoteForm.formState.errors.recipeId)} describedBy="quote-recipe-error" options={recipes.map((recipe) => ({ value: recipe.id, label: recipe.name }))} /><FieldError id="quote-recipe-error" message={quoteForm.formState.errors.recipeId?.message} /></label>
            <input type="hidden" {...quoteForm.register('packagingId', { required: 'Elegí una presentación.' })} />
            <label className="field price-field" htmlFor="quote-packaging">2. Presentación<SearchableSelect id="quote-packaging" value={quoteForm.watch('packagingId')} onChange={(value) => { quoteForm.setValue('packagingId', value, { shouldValidate: true, shouldDirty: true }); clearFeedback(); }} placeholder="Buscá una bolsa o caja" invalid={Boolean(quoteForm.formState.errors.packagingId)} describedBy="quote-packaging-error" options={packaging.map((item) => ({ value: item.id, label: item.name, searchText: item.kind }))} /><FieldError id="quote-packaging-error" message={quoteForm.formState.errors.packagingId?.message} /></label>
            <label className="field price-field">3. Cantidad de cookies<Input {...quoteForm.register('requestedUnits', { validate: (value) => validateDecimalField(value, 'la cantidad de cookies', true) })} inputMode="numeric" placeholder="Por ejemplo, 6" aria-invalid={Boolean(quoteForm.formState.errors.requestedUnits)} aria-describedby="quote-units-error" /><FieldError id="quote-units-error" message={quoteForm.formState.errors.requestedUnits?.message} /></label>
            <Button type="submit" className="save-button">{busy ? 'Calculando…' : 'Calcular costo de la venta'}</Button>
            {!loading && (!recipes.length || !packaging.length) && <p className="pending-cost">Para cotizar necesitás una receta guardada y un envase. Agregá tus envases en «Envases y stickers».</p>}
          </fieldset></form>
          <section className="result-card" aria-live="polite"><p className="eyebrow">COSTO DE ESTA VENTA</p>{result ? <><h2 className="result-amount">{pesos.format(result.cost.quotedCost)}</h2><p className="result-description">{result.cost.requestedUnits} cookies de {result.recipeName} · {result.packagingName}</p>
            <dl className="result-breakdown"><div><dt>Productos, incluido tu trabajo</dt><dd>{pesos.format(result.cost.productsCost)}</dd></div><div><dt>{result.cost.packageCount} envase(s)</dt><dd>{pesos.format(result.cost.containersCost)}</dd></div><div><dt>{result.cost.stickerCount} sticker(s)</dt><dd>{result.cost.stickerCost === null ? 'Pendiente' : pesos.format(result.cost.stickerCost)}</dd></div><div><dt>Packaging total</dt><dd>{pesos.format(result.cost.packagingCost)}</dd></div></dl>
            {result.cost.isPartial && <p className="pending-cost" role="status">Falta completar: {result.cost.missingInputs.join(' y ')}. El costo es parcial.</p>}<p className="result-footnote">Ahora elegí un precio para conocer tu ganancia total, incluida la remuneración por tu trabajo.</p>
          </> : <><h2 className="result-placeholder">De tu receta a la venta.</h2><p className="result-description">Completá receta, presentación y cantidad para pasar al precio y la ganancia.</p></>}</section>
        </div>
        {result && <SalePriceCalculator cost={result.cost} />}
        <section className="scope-note"><h2>El packaging de cada venta</h2><p>Una bolsa y sus stickers por cookie individual. Una caja y sus stickers para cualquier cantidad que no supere su capacidad.</p></section>
      </TabsContent>
      <TabsContent value="catalog" keepMounted>
        <CatalogPicker title="Envases" label="Buscar un envase" createLabel="Nuevo envase" id="saved-packaging" value={selectedPackagingId}
          options={packaging.map((item) => ({ value: item.id, label: item.name, searchText: item.kind }))} loading={loading} disabled={busy}
          onSelect={(id) => confirmPackagingDiscard(() => loadPackaging(id))} onCreate={() => confirmPackagingDiscard(newPackaging)} onRefresh={() => requestDiscard(() => void refreshData())} />
        <div className="calculator-layout">
          <form className="form-card" aria-label="Editar envase" onSubmit={packagingForm.handleSubmit(submitPackaging)} onChange={clearMessages} noValidate><fieldset className="form-controls" disabled={busy || loading}>
            <div className="card-heading"><h2>{selectedPackagingId ? 'Datos del envase' : 'Nuevo envase'}</h2>{isReadingPackaging && <Button type="button" variant="outline" onClick={() => setIsEditingPackaging(true)}><Pencil aria-hidden="true" />Editar</Button>}</div>
            <EditorStatus editing={!isReadingPackaging} saved={Boolean(selectedPackagingId)} dirty={packagingForm.formState.isDirty} />
            {isReadingPackaging && selectedPackaging ? <RecordDetails items={[
              { label: 'Nombre del envase', value: selectedPackaging.name },
              { label: 'Tipo', value: selectedPackaging.kind === 'box' ? 'Caja' : 'Individual' },
              { label: 'Capacidad', value: selectedPackaging.capacity + ' cookies' },
              { label: 'Cantidad comprada', value: selectedPackaging.purchaseQuantity + ' envases' },
              { label: 'Precio total de compra', value: pesos.format(selectedPackaging.purchasePrice) },
              { label: 'Stickers por envase', value: selectedPackaging.stickersPerPackage },
            ]} /> : <>
              <label className="field">Nombre del envase<Input {...packagingForm.register('name', { required: 'Ingresá el nombre del envase.' })} placeholder="Caja con visor 25 × 20 × 8 cm" aria-invalid={Boolean(packagingForm.formState.errors.name)} aria-describedby="packaging-name-error" /><FieldError id="packaging-name-error" message={packagingForm.formState.errors.name?.message} /></label>
              <div className="field-row price-field"><label className="field">Tipo<NativeSelect {...packagingForm.register('kind')}><option value="individual">Individual</option><option value="box">Caja</option></NativeSelect></label><label className="field">Capacidad en cookies<Input {...packagingForm.register('capacity', { validate: (value) => validateDecimalField(value, 'la capacidad', true) })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.capacity)} aria-describedby="capacity-error" /><FieldError id="capacity-error" message={packagingForm.formState.errors.capacity?.message} /></label></div>
              <div className="field-row price-field"><label className="field">Cantidad comprada<Input {...packagingForm.register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad comprada', true) })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.purchaseQuantity)} aria-describedby="packaging-quantity-error" /><FieldError id="packaging-quantity-error" message={packagingForm.formState.errors.purchaseQuantity?.message} /></label><label className="field">Precio total (ARS)<Input {...packagingForm.register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio total') })} inputMode="decimal" aria-invalid={Boolean(packagingForm.formState.errors.purchasePrice)} aria-describedby="packaging-price-error" /><FieldError id="packaging-price-error" message={packagingForm.formState.errors.purchasePrice?.message} /></label></div>
              <label className="field price-field">Stickers por envase<Input {...packagingForm.register('stickersPerPackage', { validate: (value) => validateDecimalField(value, 'los stickers por envase') })} inputMode="numeric" aria-invalid={Boolean(packagingForm.formState.errors.stickersPerPackage)} aria-describedby="stickers-per-package-error" /><FieldError id="stickers-per-package-error" message={packagingForm.formState.errors.stickersPerPackage?.message} /></label>
              <div className="form-actions editor-actions"><Button type="submit">{selectedPackagingId ? 'Guardar cambios' : 'Guardar envase'}</Button><Button type="button" variant="outline" onClick={cancelPackaging}>Cancelar</Button>{selectedPackagingId && <Button type="button" variant="destructive" onClick={handleDeletePackaging}>Eliminar envase</Button>}</div>
            </>}
          </fieldset></form>
          <form className="form-card" aria-label="Compra de stickers" onSubmit={stickerForm.handleSubmit(submitStickers)} onChange={clearMessages} noValidate><fieldset className="form-controls" disabled={busy || loading}>
            <div className="card-heading"><h2>Compra de stickers</h2>{!isEditingStickers && <Button type="button" variant="outline" aria-label="Editar stickers" onClick={() => setIsEditingStickers(true)}><Pencil aria-hidden="true" />Editar</Button>}</div>
            <p className="section-help">Una compra compartida para todos los envases que usan estos stickers.</p><EditorStatus editing={isEditingStickers} saved={stickers.name !== null} dirty={stickerForm.formState.isDirty} />
            {!isEditingStickers ? <RecordDetails items={[{ label: 'Nombre del sticker', value: stickers.name }, { label: 'Cantidad comprada', value: stickers.purchaseQuantity }, { label: 'Precio total de compra', value: stickers.purchasePrice === null ? null : pesos.format(stickers.purchasePrice) }]} /> : <>
              <label className="field">Nombre del sticker<Input {...stickerForm.register('name', { required: 'Ingresá el nombre.' })} aria-invalid={Boolean(stickerForm.formState.errors.name)} aria-describedby="sticker-name-error" /><FieldError id="sticker-name-error" message={stickerForm.formState.errors.name?.message} /></label>
              <div className="field-row price-field"><label className="field">Cantidad comprada<Input {...stickerForm.register('purchaseQuantity', { validate: (value) => validateDecimalField(value, 'la cantidad de stickers', true) })} inputMode="numeric" aria-invalid={Boolean(stickerForm.formState.errors.purchaseQuantity)} aria-describedby="sticker-quantity-error" /><FieldError id="sticker-quantity-error" message={stickerForm.formState.errors.purchaseQuantity?.message} /></label><label className="field">Precio total (ARS)<Input {...stickerForm.register('purchasePrice', { validate: (value) => validateDecimalField(value, 'el precio de los stickers') })} inputMode="decimal" aria-invalid={Boolean(stickerForm.formState.errors.purchasePrice)} aria-describedby="sticker-price-error" /><FieldError id="sticker-price-error" message={stickerForm.formState.errors.purchasePrice?.message} /></label></div>
              <div className="form-actions editor-actions"><Button type="submit">Guardar cambios</Button><Button type="button" variant="outline" onClick={cancelStickers}>Cancelar</Button></div>
            </>}
          </fieldset></form>
        </div>
      </TabsContent>
    </Tabs>
  </main>;
}
