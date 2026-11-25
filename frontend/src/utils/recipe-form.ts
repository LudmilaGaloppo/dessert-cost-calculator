import type { RecipeInput, Supply } from '@dessert-cost/shared';
import type { RecipeFormValues } from '../types/recipe-form.js';
import { parseDecimal, parseUnit } from './ingredient-form.js';
import { calculateRecipeIngredients } from '../domain/costs.js';

/** Crea campos vacíos independientes para una nueva receta. */
export function emptyRecipeForm(): RecipeFormValues {
  return { name: '', yieldQuantity: '', yieldUnit: 'unit', workingHours: '', gasOvenMinutes: '', electricMixerMinutes: '', ingredients: [{ supplyId: '', quantity: '', unit: 'g' }] };
}

/** Convierte los números persistidos en textos editables por React Hook Form. */
export function recipeToForm(recipe: RecipeInput): RecipeFormValues {
  return {
    name: recipe.name, yieldQuantity: String(recipe.yieldQuantity), yieldUnit: recipe.yieldUnit,
    workingHours: recipe.workingHours === null ? '' : String(recipe.workingHours),
    gasOvenMinutes: recipe.gasOvenMinutes === null ? '' : String(recipe.gasOvenMinutes),
    electricMixerMinutes: recipe.electricMixerMinutes === null ? '' : String(recipe.electricMixerMinutes),
    ingredients: recipe.ingredients.map((item) => ({ ...item, quantity: String(item.quantity) })),
  };
}

/** Prepara la receta y verifica las cantidades y unidades contra los insumos vigentes. */
export function recipeInputFromForm(values: RecipeFormValues, supplies: readonly Supply[]): RecipeInput {
  const name = values.name.trim();
  if (!name || name.length > 120) throw new Error('El nombre debe tener entre 1 y 120 caracteres.');
  const yieldQuantity = parseDecimal(values.yieldQuantity, 'el rendimiento');
  if (yieldQuantity <= 0) throw new Error('El rendimiento debe ser mayor que cero.');
  if (!values.ingredients.length || values.ingredients.length > 100) throw new Error('Agregá entre 1 y 100 ingredientes.');

  /** Convierte y valida la cantidad de una fila antes de calcular el costo. */
  function toIngredient(item: RecipeFormValues['ingredients'][number], index: number) {
    const quantity = parseDecimal(item.quantity, `la cantidad del ingrediente ${index + 1}`);
    if (quantity <= 0) throw new Error(`La cantidad del ingrediente ${index + 1} debe ser mayor que cero.`);
    return { supplyId: item.supplyId, quantity, unit: parseUnit(item.unit) };
  }

  const workingHours = values.workingHours.trim() === '' ? null : parseDecimal(values.workingHours, 'las horas de trabajo');
  if (workingHours !== null && workingHours < 0) throw new Error('Las horas de trabajo no pueden ser negativas.');
  const gasOvenMinutes = values.gasOvenMinutes.trim() === '' ? null : parseDecimal(values.gasOvenMinutes, 'los minutos de horno');
  const electricMixerMinutes = values.electricMixerMinutes.trim() === '' ? null : parseDecimal(values.electricMixerMinutes, 'los minutos de batidora');
  if (gasOvenMinutes !== null && gasOvenMinutes < 0) throw new Error('Los minutos de horno no pueden ser negativos.');
  if (electricMixerMinutes !== null && electricMixerMinutes < 0) throw new Error('Los minutos de batidora no pueden ser negativos.');
  const input = { name, yieldQuantity, yieldUnit: parseUnit(values.yieldUnit), workingHours, gasOvenMinutes, electricMixerMinutes, ingredients: values.ingredients.map(toIngredient) };
  calculateRecipeIngredients(input, supplies);
  return input;
}
