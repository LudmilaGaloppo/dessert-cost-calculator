import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { CostSettings, ProductionCost, Recipe, Supply } from '@dessert-cost/shared';
import type { RecipeFormValues } from '../types/recipe-form';
import { emptyRecipeForm, recipeInputFromForm, recipeToForm } from '../utils/recipe-form';
import { validateDecimalField } from '../utils/ingredient-form';
import { calculateProductionCost } from '../domain/costs';
import { listSupplies } from '../services/supplies';
import { deleteRecipe, listRecipes, saveRecipe } from '../services/recipes';
import { getCostSettings, saveEnergySettings, saveHourlyRate } from '../services/settings';
import { parseDecimal } from '../utils/ingredient-form';
import SearchableSelect from '../components/SearchableSelect';
import CatalogPicker from '../components/CatalogPicker';
import { RecordDetails, EditorStatus } from '../components/RecordDetails';
import { useNavigationGuard, useUnsavedChanges } from '../components/UnsavedChanges';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Pencil, Plus } from 'lucide-react';

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const decimal = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 6 });

/** Ofrece las unidades disponibles para cantidades y rendimiento. */
function UnitOptions() {
  return <><option value="g">Gramos (g)</option><option value="kg">Kilogramos (kg)</option><option value="ml">Mililitros (ml)</option><option value="l">Litros (l)</option><option value="unit">Unidades</option></>;
}

/** Muestra errores de validación junto al campo correspondiente. */
function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <span id={id} className="field-error" role="alert">{message}</span> : null;
}

/** Administra recetas con varias filas y calcula con precios recién consultados. */
export default function RecipeEditor() {
  const { register, control, handleSubmit, reset, clearErrors, setValue, watch, formState: { errors, isDirty } } = useForm<RecipeFormValues>({ defaultValues: emptyRecipeForm() });
  const { register: registerSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, formState: { errors: settingsErrors, isDirty: hourlyRateDirty } } = useForm<{ hourlyRate: string }>({ defaultValues: { hourlyRate: '' } });
  const energyForm = useForm<{ gasDailyAverage: string; electricityDailyAverage: string }>({ defaultValues: { gasDailyAverage: '', electricityDailyAverage: '' } });
  // useFieldArray mantiene un ID estable por fila aunque se agreguen o quiten ingredientes.
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' });
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isEditingRecipe, setIsEditingRecipe] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<CostSettings>({ hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null });
  const [isEditingHourlyRate, setIsEditingHourlyRate] = useState(true);
  const [isEditingEnergy, setIsEditingEnergy] = useState(true);
  const [result, setResult] = useState<ProductionCost | null>(null);
  const requestInProgress = useRef(false);
  const isReadingRecipe = Boolean(selectedId) && !isEditingRecipe;
  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedId);
  const confirmRecipeDiscard = useUnsavedChanges(isDirty, 'Receta', busy);
  const confirmHourlyDiscard = useUnsavedChanges(hourlyRateDirty, 'Tarifa por hora', busy);
  const confirmEnergyDiscard = useUnsavedChanges(energyForm.formState.isDirty, 'Energía', busy);
  const { requestDiscard } = useNavigationGuard();

  // Cancela la consulta si se cambia de sección antes de recibir la respuesta.
  useEffect(function loadInitialData() {
    const controller = new AbortController();
    void refreshData(controller.signal);
    return () => controller.abort();
  }, []);

  /** Carga catálogo y recetas; un fallo conserva el formulario para reintentar. */
  async function refreshData(signal?: AbortSignal) {
    setLoading(true); setError(''); setResult(null);
    try {
      const [currentSupplies, currentRecipes, currentSettings] = await Promise.all([listSupplies(signal), listRecipes(signal), getCostSettings(signal)]);
      if (signal?.aborted) return;
      setSupplies(currentSupplies); setRecipes(currentRecipes); setSettings(currentSettings);
      setIsEditingHourlyRate(currentSettings.hourlyRate === null);
      setIsEditingEnergy(currentSettings.gasDailyAverage === null || currentSettings.electricityDailyAverage === null);
      resetSettings({ hourlyRate: currentSettings.hourlyRate === null ? '' : String(currentSettings.hourlyRate) });
      energyForm.reset({ gasDailyAverage: currentSettings.gasDailyAverage === null ? '' : String(currentSettings.gasDailyAverage), electricityDailyAverage: currentSettings.electricityDailyAverage === null ? '' : String(currentSettings.electricityDailyAverage) });
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }

  /** Invalida el subtotal cuando cambian los datos del formulario. */
  function clearResult() { setResult(null); setMessage(''); setError(''); }

  /** Prepara un formulario vacío sin modificar recetas guardadas. */
  function newRecipe() { reset(emptyRecipeForm()); setSelectedId(''); setIsEditingRecipe(true); clearResult(); }

  /** Carga la receta seleccionada para editarla. */
  function loadRecipe(id: string) {
    const recipe = recipes.find((item) => item.id === id);
    if (!recipe) { newRecipe(); return; }
    reset(recipeToForm(recipe)); setSelectedId(recipe.id); setIsEditingRecipe(false); clearResult();
  }

  /** Restaura la receta guardada o el formulario inicial sin escribir en la base de datos. */
  function cancelRecipe() { confirmRecipeDiscard(() => selectedId ? loadRecipe(selectedId) : newRecipe()); }

  /** Restaura la tarifa persistida y vuelve a lectura cuando ya estaba configurada. */
  function cancelHourlyRate() {
    confirmHourlyDiscard(() => { resetSettings({ hourlyRate: settings.hourlyRate === null ? '' : String(settings.hourlyRate) }); setIsEditingHourlyRate(settings.hourlyRate === null); clearResult(); });
  }

  /** Restaura ambos promedios diarios y conserva como pendientes los datos no configurados. */
  function cancelEnergy() {
    confirmEnergyDiscard(() => {
      energyForm.reset({ gasDailyAverage: settings.gasDailyAverage === null ? '' : String(settings.gasDailyAverage), electricityDailyAverage: settings.electricityDailyAverage === null ? '' : String(settings.electricityDailyAverage) });
      setIsEditingEnergy(settings.gasDailyAverage === null || settings.electricityDailyAverage === null); clearResult();
    });
  }

  /** Agrega una fila vacía al formulario. */
  function addIngredient() { append({ supplyId: '', quantity: '', unit: 'g' }); clearResult(); }

  /** Quita una fila y descarta el subtotal anterior. */
  function removeIngredient(index: number) { remove(index); clearResult(); }

  /** Valida y guarda la tarifa compartida por todas las recetas. */
  async function updateHourlyRate(values: { hourlyRate: string }) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      const value = parseDecimal(values.hourlyRate, 'el valor de la hora');
      if (value < 0) throw new Error('El valor de la hora debe ser un número no negativo.');
      const saved = await saveHourlyRate(value);
      setSettings(saved); resetSettings({ hourlyRate: String(saved.hourlyRate) });
      setIsEditingHourlyRate(false);
      setMessage('Valor de la hora actualizado. Volvé a calcular la receta.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el valor de la hora.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Guarda los promedios diarios usados para estimar gas y electricidad. */
  async function updateEnergySettings(values: { gasDailyAverage: string; electricityDailyAverage: string }) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      const gasDailyAverage = parseDecimal(values.gasDailyAverage, 'el promedio diario de gas');
      const electricityDailyAverage = parseDecimal(values.electricityDailyAverage, 'el promedio diario de electricidad');
      if (gasDailyAverage <= 0 || electricityDailyAverage <= 0) throw new Error('Los promedios diarios deben ser mayores que cero.');
      const saved = await saveEnergySettings(gasDailyAverage, electricityDailyAverage);
      setSettings(saved);
      energyForm.reset({ gasDailyAverage: String(saved.gasDailyAverage), electricityDailyAverage: String(saved.electricityDailyAverage) });
      setIsEditingEnergy(false);
      setMessage('Promedios de energía actualizados. Volvé a calcular la receta.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron guardar los promedios de energía.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Valida, calcula y opcionalmente persiste la receta. */
  async function processRecipe(values: RecipeFormValues, persist: boolean) {
    if (requestInProgress.current) return;
    requestInProgress.current = true; setBusy(true); clearResult(); clearErrors();
    try {
      const currentSupplies = await listSupplies();
      setSupplies(currentSupplies);
      const input = recipeInputFromForm(values, currentSupplies);
      const calculated = calculateProductionCost(input, currentSupplies, settings);
      if (persist) {
        const saved = await saveRecipe(input, selectedId || undefined);
        setRecipes((previous) => [...previous.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedId(saved.id); reset(recipeToForm(saved));
        setIsEditingRecipe(false);
        setMessage('Receta guardada. Podés recuperarla desde la lista.');
      }
      setResult(calculated);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo procesar la receta.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  /** Calcula el subtotal sin guardar la receta. */
  async function calculate(values: RecipeFormValues) { await processRecipe(values, false); }

  /** Guarda o actualiza la receta y muestra su subtotal. */
  async function save(values: RecipeFormValues) { await processRecipe(values, true); }

  /** Pide confirmación y elimina la receta seleccionada sin borrar sus insumos. */
  async function handleDeleteRecipe() {
    const selected = recipes.find((recipe) => recipe.id === selectedId);
    if (!selected || requestInProgress.current) return;
    if (!window.confirm(`¿Eliminar la receta “${selected.name}”? Los insumos del catálogo se conservarán.`)) return;
    requestInProgress.current = true; setBusy(true); setError(''); setMessage(''); setResult(null);
    try {
      await deleteRecipe(selected.id);
      setRecipes((current) => current.filter((recipe) => recipe.id !== selected.id));
      newRecipe();
      setMessage(`Se eliminó la receta “${selected.name}”.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la receta.');
    } finally { requestInProgress.current = false; setBusy(false); }
  }

  return <main id="main" tabIndex={-1}>
    <div className="page-heading"><p className="eyebrow">TUS RECETAS</p><h1>El costo de cada tanda.</h1><p>Combiná tus insumos y dale valor a cada ingrediente y a tu tiempo.</p></div>
    <CatalogPicker title="Recetas" label="Buscar una receta" createLabel="Nueva receta" id="saved-recipe" value={selectedId}
      options={recipes.map((recipe) => ({ value: recipe.id, label: recipe.name }))} loading={loading} disabled={busy}
      onSelect={(id) => confirmRecipeDiscard(() => loadRecipe(id))} onCreate={() => confirmRecipeDiscard(newRecipe)} onRefresh={() => requestDiscard(() => void refreshData())} />
    {!loading && !supplies.length && <p className="pending-cost">Primero guardá tus compras en Insumos para poder armar una receta.</p>}
    {error && <p className="error-message" role="alert">{error}</p>}{message && <p className="save-message" role="status">{message}</p>}
    <div className="calculator-layout">
      <form className="form-card" onSubmit={handleSubmit(save)} onChange={clearResult} noValidate aria-label="Editar receta">
        <fieldset className="form-controls" disabled={busy || loading}>
          <div className="card-heading"><h2>{selectedId ? 'Datos de la receta' : 'Nueva receta'}</h2>{isReadingRecipe && <Button type="button" variant="outline" onClick={() => setIsEditingRecipe(true)}><Pencil aria-hidden="true" />Editar</Button>}</div>
          <EditorStatus editing={!isReadingRecipe} saved={Boolean(selectedId)} dirty={isDirty} />
          {isReadingRecipe && selectedRecipe ? <>
            <RecordDetails items={[
              { label: 'Nombre de la receta', value: selectedRecipe.name },
              { label: 'Rendimiento de la tanda', value: decimal.format(selectedRecipe.yieldQuantity) + ' ' + (selectedRecipe.yieldUnit === 'unit' ? 'unidades' : selectedRecipe.yieldUnit) },
              { label: 'Horas de trabajo', value: selectedRecipe.workingHours === null ? null : decimal.format(selectedRecipe.workingHours) + ' h' },
              { label: 'Horno a gas', value: selectedRecipe.gasOvenMinutes === null ? null : decimal.format(selectedRecipe.gasOvenMinutes) + ' min' },
              { label: 'Batidora', value: selectedRecipe.electricMixerMinutes === null ? null : decimal.format(selectedRecipe.electricMixerMinutes) + ' min' },
            ]} />
            <section className="nested-card"><h3>Ingredientes</h3><dl className="ingredient-list">{selectedRecipe.ingredients.map((item, index) => <div key={index}><dt>{supplies.find((supply) => supply.id === item.supplyId)?.name ?? 'Insumo no disponible'}</dt><dd>{decimal.format(item.quantity)} {item.unit === 'unit' ? 'unidades' : item.unit}</dd></div>)}</dl></section>
          </> : <>
            <label className="field">Nombre de la receta<Input {...register('name', { required: 'Ingresá un nombre.', maxLength: { value: 120, message: 'Usá hasta 120 caracteres.' } })} placeholder="Cookies con chocolate" aria-invalid={Boolean(errors.name)} aria-describedby="recipe-name-error" /><FieldError id="recipe-name-error" message={errors.name?.message} /></label>
            <fieldset><legend>Rendimiento de la tanda</legend><div className="field-row">
              <label className="field">Cantidad producida<Input {...register('yieldQuantity', { validate: (value) => validateDecimalField(value, 'el rendimiento', true) })} inputMode="decimal" placeholder="12" aria-invalid={Boolean(errors.yieldQuantity)} aria-describedby="yield-error" /><FieldError id="yield-error" message={errors.yieldQuantity?.message} /></label>
              <label className="field">Unidad de rendimiento<NativeSelect {...register('yieldUnit')}><UnitOptions /></NativeSelect></label>
            </div></fieldset>
            <fieldset><legend>Tu trabajo</legend><p className="section-help">Horas de elaboración de una tanda. La tarifa se configura en «Valor de tu hora».</p>
              <label className="field">Horas de trabajo<Input {...register('workingHours', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'las horas de trabajo') })} inputMode="decimal" placeholder="Pendiente" aria-invalid={Boolean(errors.workingHours)} aria-describedby="working-hours-error" /><FieldError id="working-hours-error" message={errors.workingHours?.message} /></label>
            </fieldset>
            <fieldset><legend>Energía de la tanda</legend><p className="section-help">Incluí el precalentado en el tiempo de horno. Dejá vacío lo que todavía no conozcas; usá 0 si no se utiliza.</p><div className="field-row">
              <label className="field">Horno a gas (minutos)<Input {...register('gasOvenMinutes', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'los minutos de horno') })} inputMode="decimal" placeholder="Pendiente" aria-invalid={Boolean(errors.gasOvenMinutes)} aria-describedby="gas-minutes-error" /><FieldError id="gas-minutes-error" message={errors.gasOvenMinutes?.message} /></label>
              <label className="field">Batidora (minutos)<Input {...register('electricMixerMinutes', { validate: (value) => value.trim() === '' || validateDecimalField(value, 'los minutos de batidora') })} inputMode="decimal" placeholder="Pendiente" aria-invalid={Boolean(errors.electricMixerMinutes)} aria-describedby="electric-minutes-error" /><FieldError id="electric-minutes-error" message={errors.electricMixerMinutes?.message} /></label>
            </div></fieldset>
            <fieldset><legend>Ingredientes</legend><p className="section-help">Los costos se calculan con los precios vigentes de tu catálogo.</p>
              {fields.map((field, index) => <fieldset className="ingredient-row" key={field.id}><legend>Ingrediente {index + 1}</legend>
                <label className="field" htmlFor={`ingredient-supply-${index}`}>Insumo<SearchableSelect id={`ingredient-supply-${index}`} value={watch(`ingredients.${index}.supplyId`)} onChange={(value) => { setValue(`ingredients.${index}.supplyId`, value, { shouldValidate: true, shouldDirty: true }); clearResult(); }} invalid={Boolean(errors.ingredients?.[index]?.supplyId)} describedBy={`supply-error-${index}`} placeholder="Buscá un insumo" options={supplies.map((supply) => ({ value: supply.id, label: supply.name }))} /><FieldError id={`supply-error-${index}`} message={errors.ingredients?.[index]?.supplyId?.message} /></label>
                <div className="field-row price-field"><label className="field">Cantidad utilizada<Input {...register(`ingredients.${index}.quantity`, { validate: (value) => validateDecimalField(value, 'la cantidad utilizada', true) })} inputMode="decimal" aria-invalid={Boolean(errors.ingredients?.[index]?.quantity)} aria-describedby={`quantity-error-${index}`} /><FieldError id={`quantity-error-${index}`} message={errors.ingredients?.[index]?.quantity?.message} /></label><label className="field">Unidad de uso<NativeSelect {...register(`ingredients.${index}.unit`)}><UnitOptions /></NativeSelect></label></div>
                <Button type="button" variant="ghost" className="remove-ingredient" onClick={() => removeIngredient(index)} disabled={fields.length === 1}>Quitar ingrediente {index + 1}</Button>
              </fieldset>)}
              <Button type="button" variant="outline" onClick={addIngredient} disabled={fields.length >= 100}><Plus aria-hidden="true" />Agregar ingrediente</Button>
            </fieldset>
            <p className="decimal-help">Podés usar coma o punto decimal, sin separador de miles.</p>
            <div className="form-actions editor-actions"><Button type="submit">{busy ? 'Guardando…' : selectedId ? 'Guardar cambios' : 'Guardar receta'}</Button><Button type="button" variant="outline" onClick={cancelRecipe}>Cancelar</Button>{selectedId && <Button type="button" variant="destructive" onClick={handleDeleteRecipe}>Eliminar receta</Button>}</div>
          </>}
          <div className="calculation-action"><Button type="button" variant="outline" onClick={handleSubmit(calculate)}>{busy ? 'Procesando…' : 'Calcular costo de la tanda'}</Button><p className="section-help">Calcular no guarda los cambios de la receta.</p></div>
        </fieldset>
      </form>
      <aside className="result-column" aria-label="Configuración y costo de la tanda">
        <section className="result-card" aria-live="polite"><p className="eyebrow">COSTO DE LA TANDA</p>{result ? <><h2 className="result-amount">{pesos.format(result.productionSubtotal)}</h2>
          <dl className="result-breakdown"><div><dt>Ingredientes</dt><dd>{pesos.format(result.ingredientsSubtotal)}</dd></div><div><dt>Tu remuneración</dt><dd>{result.laborCost === null ? 'Pendiente' : pesos.format(result.laborCost)}</dd></div><div><dt>Horno a gas</dt><dd>{result.gasCost === null ? 'Pendiente' : pesos.format(result.gasCost)}</dd></div><div><dt>Batidora</dt><dd>{result.electricityCost === null ? 'Pendiente' : pesos.format(result.electricityCost)}</dd></div></dl>
          <dl className="ingredient-list result-ingredients">{result.items.map((item, index) => <div key={index}><dt>{item.name}<br /><small>{decimal.format(item.quantity)} {item.unit}</small></dt><dd>{pesos.format(item.cost)}</dd></div>)}</dl>
          {result.missingInputs.length > 0 && <p className="pending-cost" role="status">Falta completar: {result.missingInputs.join(' y ')}. El importe es parcial.</p>}<p className="result-footnote">Incluye tu trabajo para valorar la tanda. Los envases se suman al cotizar la venta.</p>
        </> : <><h2 className="result-placeholder">Tu receta, más clara.</h2><p className="result-description">Calculá la tanda para conocer sus ingredientes, trabajo y energía.</p></>}</section>
        <form className="catalog-card settings-card" onSubmit={handleSettingsSubmit(updateHourlyRate)} onChange={clearResult} noValidate aria-label="Valor de tu hora"><fieldset className="form-controls" disabled={busy || loading}>
          <div className="card-heading"><h2>Valor de tu hora</h2>{!isEditingHourlyRate && <Button type="button" variant="outline" aria-label="Editar valor de la hora" onClick={() => setIsEditingHourlyRate(true)}><Pencil aria-hidden="true" />Editar</Button>}</div>
          <p className="section-help">Tu remuneración por cada hora de trabajo. Se aplica a todas las recetas.</p><EditorStatus editing={isEditingHourlyRate} saved={settings.hourlyRate !== null} dirty={hourlyRateDirty} />
          {!isEditingHourlyRate ? <RecordDetails items={[{ label: 'Tarifa por hora', value: settings.hourlyRate === null ? null : pesos.format(settings.hourlyRate) }]} /> : <>
            <label className="field">Tarifa por hora (ARS)<Input {...registerSettings('hourlyRate', { validate: (value) => validateDecimalField(value, 'el valor de la hora') })} inputMode="decimal" placeholder="Por ejemplo, 5000" aria-invalid={Boolean(settingsErrors.hourlyRate)} aria-describedby="hourly-rate-error" /><FieldError id="hourly-rate-error" message={settingsErrors.hourlyRate?.message} /></label>
            <div className="form-actions editor-actions"><Button type="submit">Guardar cambios</Button><Button type="button" variant="outline" onClick={cancelHourlyRate}>Cancelar</Button></div>
          </>}
        </fieldset></form>
        <form className="catalog-card settings-card" onSubmit={energyForm.handleSubmit(updateEnergySettings)} onChange={clearResult} noValidate aria-label="Promedios diarios de energía"><fieldset className="form-controls" disabled={busy || loading}>
          <div className="card-heading"><h2>Promedios de energía</h2>{!isEditingEnergy && <Button type="button" variant="outline" aria-label="Editar promedios de energía" onClick={() => setIsEditingEnergy(true)}><Pencil aria-hidden="true" />Editar</Button>}</div>
          <p className="section-help">Promedios diarios para estimar lo que usa cada tanda.</p><EditorStatus editing={isEditingEnergy} saved={settings.gasDailyAverage !== null && settings.electricityDailyAverage !== null} dirty={energyForm.formState.isDirty} />
          {!isEditingEnergy ? <RecordDetails items={[{ label: 'Gas por día', value: settings.gasDailyAverage === null ? null : pesos.format(settings.gasDailyAverage) }, { label: 'Electricidad por día', value: settings.electricityDailyAverage === null ? null : pesos.format(settings.electricityDailyAverage) }]} /> : <>
            <label className="field">Gas por día (ARS)<Input {...energyForm.register('gasDailyAverage', { validate: (value) => validateDecimalField(value, 'el promedio diario de gas', true) })} inputMode="decimal" aria-invalid={Boolean(energyForm.formState.errors.gasDailyAverage)} aria-describedby="gas-daily-error" /><FieldError id="gas-daily-error" message={energyForm.formState.errors.gasDailyAverage?.message} /></label>
            <label className="field price-field">Electricidad por día (ARS)<Input {...energyForm.register('electricityDailyAverage', { validate: (value) => validateDecimalField(value, 'el promedio diario de electricidad', true) })} inputMode="decimal" aria-invalid={Boolean(energyForm.formState.errors.electricityDailyAverage)} aria-describedby="electricity-daily-error" /><FieldError id="electricity-daily-error" message={energyForm.formState.errors.electricityDailyAverage?.message} /></label>
            <div className="form-actions editor-actions"><Button type="submit">Guardar cambios</Button><Button type="button" variant="outline" onClick={cancelEnergy}>Cancelar</Button></div>
          </>}
        </fieldset></form>
      </aside>
    </div>
  </main>;
}
