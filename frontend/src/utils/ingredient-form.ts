import { calculateIngredientCost } from '../domain/costs.js';
import type { Unit, SupplyInput } from '@dessert-cost/shared';
import type { IngredientFormValues, IngredientFormResult } from '../types/ingredient-form.js';

export const emptyIngredientForm: IngredientFormValues = {
  name: '', purchaseQuantity: '', purchaseUnit: 'kg', purchasePrice: '', usedQuantity: '', usedUnit: 'g',
};

export const exampleIngredientForm: IngredientFormValues = {
  name: 'Harina', purchaseQuantity: '2,5', purchaseUnit: 'kg', purchasePrice: '6000', usedQuantity: '375', usedUnit: 'g',
};

/** Convierte un campo decimal con coma o punto; rechaza vacíos y formatos ambiguos antes del cálculo. */
export function parseDecimal(value: string, label: string): number {
  const text = value.trim();
  if (text === '') throw new Error(`Completá ${label}.`);
  if (!/^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text)) {
    throw new Error(`Revisá ${label}: usá números, coma o punto decimal, sin separador de miles.`);
  }
  const number = Number(text.replace(',', '.'));
  if (!Number.isFinite(number)) throw new Error(`Ingresá un número válido para ${label}.`);
  return number;
}

/** Comprueba la unidad recibida desde el formulario y la devuelve con el tipo Unit. */
export function parseUnit(value: string): Unit {
  switch (value) {
    case 'g': case 'kg': case 'ml': case 'l': case 'unit': return value;
    default: throw new Error('Elegí una unidad válida.');
  }
}

/** Valida los textos del formulario, construye el insumo y su uso, y delega el costo en la lógica existente. */
export function calculateIngredientForm(values: IngredientFormValues): IngredientFormResult {
  const { name, purchaseQuantity, purchasePrice, purchaseUnit } = supplyInputFromForm(values);
  const usedQuantity = parseDecimal(values.usedQuantity, 'la cantidad utilizada');
  const usedUnit = parseUnit(values.usedUnit);
  const cost = calculateIngredientCost(
    { id: 'current-supply', name, purchaseQuantity, purchaseUnit, purchasePrice },
    { supplyId: 'current-supply', quantity: usedQuantity, unit: usedUnit },
  );
  return { name, purchaseQuantity, purchaseUnit, purchasePrice, usedQuantity, usedUnit, cost };
}

/** Prepara solo los datos de compra para guardar el insumo, sin exigir una cantidad de uso. */
export function supplyInputFromForm(values: IngredientFormValues): SupplyInput {
  const name = values.name.trim();
  if (!name) throw new Error('Ingresá el nombre del insumo.');
  if (name.length > 120) throw new Error('El nombre no puede superar los 120 caracteres.');
  const purchaseQuantity = parseDecimal(values.purchaseQuantity, 'la cantidad comprada');
  const purchasePrice = parseDecimal(values.purchasePrice, 'el precio de compra');
  const purchaseUnit = parseUnit(values.purchaseUnit);
  // Un uso cero comprueba las reglas de compra existentes sin agregar costo a una receta.
  calculateIngredientCost(
    { id: 'current-supply', name, purchaseQuantity, purchaseUnit, purchasePrice },
    { supplyId: 'current-supply', quantity: 0, unit: purchaseUnit },
  );
  return { name, purchaseQuantity, purchaseUnit, purchasePrice };
}

/** Devuelve true o un mensaje para las reglas de validación de React Hook Form. */
export function validateDecimalField(value: string, label: string, positive = false): true | string {
  try {
    const number = parseDecimal(value, label);
    if (positive ? number <= 0 : number < 0) return `Ingresá un valor ${positive ? 'mayor que cero' : 'no negativo'} para ${label}.`;
    return true;
  } catch (error) {
    return error instanceof Error ? error.message : 'Ingresá un número válido.';
  }
}
