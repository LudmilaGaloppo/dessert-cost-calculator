// Vocabulario del modelo:
// supply = insumo del catálogo con sus datos de compra; supplies = array de insumos.
// ingredient = uso de un insumo en una receta, con cantidad y unidad propias.
// ingredient.supplyId referencia supply.id; el precio se obtiene del insumo.
// Ejemplo y explicación: ../../../docs/04-calculo-de-receta.md

import type { Unit, Supply, RecipeIngredient, RecipeIngredientsCost, RecipeInput, CostSettings, ProductionCost, Packaging, SaleQuoteCost, StickerSettings, PricingBasis, SaleProfit } from '@dessert-cost/shared';

interface UnitDefinition {
  dimension: 'mass' | 'volume' | 'count';
  factor: number;
}

// Record exige una definición para cada Unit. En ejecución sigue siendo un objeto.
const units: Record<Unit, UnitDefinition> = {
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1000 },
  ml: { dimension: 'volume', factor: 1 },
  l: { dimension: 'volume', factor: 1000 },
  unit: { dimension: 'count', factor: 1 },
};

/** Valida un número finito no negativo (o mayor que cero si positive es true); lanza un error si no cumple. */
function requireNumber(value: unknown, label: string, positive = false): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || (positive ? value <= 0 : value < 0)) {
    throw new RangeError(`${label} debe ser un número finito ${positive ? 'mayor que cero' : 'no negativo'}.`);
  }
}

/** Comprueba que el identificador sea un texto no vacío ni compuesto solo por espacios; si falla, lanza un error. */
function requireId(value: unknown): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('El identificador del insumo debe ser un texto no vacío.');
  }
}

/** Convierte una cantidad entre unidades compatibles usando sus factores; rechaza cantidades o unidades inválidas. */
export function convertQuantity(quantity: number, fromUnit: Unit, toUnit: Unit): number {
  requireNumber(quantity, 'La cantidad');
  if (!Object.hasOwn(units, fromUnit) || !Object.hasOwn(units, toUnit)) {
    throw new RangeError('Unidad desconocida. Usá g, kg, ml, l o unit.');
  }
  const from = units[fromUnit];
  const to = units[toUnit];
  if (from.dimension !== to.dimension) {
    throw new RangeError(`Unidades incompatibles: ${fromUnit} y ${toUnit}.`);
  }
  const converted = quantity * (from.factor / to.factor);
  requireNumber(converted, 'La cantidad convertida');
  return converted;
}

/** Calcula el costo proporcional del ingrediente: verifica el insumo, convierte la cantidad usada y aplica el precio de compra. */
export function calculateIngredientCost(supply: Supply, ingredient: RecipeIngredient): number {
  requireId(supply.id);
  requireId(ingredient.supplyId);
  if (supply.id !== ingredient.supplyId) {
    throw new Error('El ingrediente no referencia este insumo.');
  }
  requireNumber(supply.purchasePrice, 'El precio de compra');
  requireNumber(supply.purchaseQuantity, 'La cantidad comprada', true);
  const usedQuantity = convertQuantity(ingredient.quantity, ingredient.unit, supply.purchaseUnit);
  const cost = supply.purchasePrice * (usedQuantity / supply.purchaseQuantity);
  requireNumber(cost, 'El costo calculado');
  return cost;
}

/** Busca cada insumo por ID y devuelve el costo de cada ingrediente y su subtotal, sin modificar la receta ni el catálogo. */
export function calculateRecipeIngredients(
  recipe: { ingredients: readonly RecipeIngredient[] },
  supplies: readonly Supply[],
): RecipeIngredientsCost {
  if (!Array.isArray(recipe.ingredients) || !Array.isArray(supplies)) {
    throw new TypeError('Los ingredientes y el catálogo deben ser arrays.');
  }
  // Índice dinámico: la clave es el ID (string) y el valor es el insumo (Supply).
  // set agrega, has verifica existencia y get recupera el insumo por su ID.
  const catalog = new Map<string, Supply>();
  for (const supply of supplies) {
    requireId(supply.id);
    if (catalog.has(supply.id)) throw new Error(`Identificador duplicado: ${supply.id}.`);
    catalog.set(supply.id, supply);
  }

  // Arma cada línea del desglose con los datos de uso y el costo calculado del insumo.
  const items = recipe.ingredients.map((ingredient) => {
    requireId(ingredient.supplyId);
    const supply = catalog.get(ingredient.supplyId);
    if (!supply) throw new Error(`Insumo inexistente: ${ingredient.supplyId}.`);
    return {
      supplyId: supply.id,
      name: supply.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      cost: calculateIngredientCost(supply, ingredient),
    };
  });
  // Acumula los costos de las líneas para obtener el subtotal de ingredientes.
  const ingredientsSubtotal = items.reduce((total, item) => total + item.cost, 0);
  requireNumber(ingredientsSubtotal, 'El subtotal de ingredientes');
  return { items, ingredientsSubtotal };
}

/** Prorratea un promedio diario sobre los minutos usados; conserva null cuando falta una entrada. */
function calculateDailyProration(minutes: number | null, dailyAverage: number | null, timeLabel: string, rateLabel: string, missingInputs: string[]): number | null {
  if (minutes === null) missingInputs.push(timeLabel);
  if (minutes !== 0 && dailyAverage === null) missingInputs.push(rateLabel);
  if (minutes === null || (minutes !== 0 && dailyAverage === null)) return null;
  requireNumber(minutes, timeLabel);
  if (minutes === 0) return 0;
  if (dailyAverage === null) return null;
  requireNumber(dailyAverage, rateLabel, true);
  const cost = dailyAverage / 24 * (minutes / 60);
  requireNumber(cost, `El costo de ${timeLabel}`);
  return cost;
}

/** Suma ingredientes, trabajo y energía conocidos, e informa entradas pendientes sin asumir cero. */
export function calculateProductionCost(recipe: RecipeInput, supplies: readonly Supply[], settings: CostSettings): ProductionCost {
  const ingredientCost = calculateRecipeIngredients(recipe, supplies);
  if (!settings || typeof settings !== 'object') throw new TypeError('La configuración de costos es obligatoria.');
  const missingInputs: string[] = [];
  let laborCost: number | null = null;
  if (recipe.workingHours === null) {
    missingInputs.push('horas de trabajo');
    if (settings.hourlyRate === null) missingInputs.push('valor de la hora');
  }
  else if (recipe.workingHours === 0) laborCost = 0;
  else if (settings.hourlyRate === null) missingInputs.push('valor de la hora');
  else {
    requireNumber(recipe.workingHours, 'Las horas de trabajo');
    requireNumber(settings.hourlyRate, 'El valor de la hora');
    laborCost = recipe.workingHours * settings.hourlyRate;
    requireNumber(laborCost, 'El costo de mano de obra');
  }
  const gasCost = calculateDailyProration(recipe.gasOvenMinutes, settings.gasDailyAverage, 'minutos de horno', 'promedio diario de gas', missingInputs);
  const electricityCost = calculateDailyProration(recipe.electricMixerMinutes, settings.electricityDailyAverage, 'minutos de batidora', 'promedio diario de electricidad', missingInputs);
  const energyCost = (gasCost ?? 0) + (electricityCost ?? 0);
  return {
    ...ingredientCost,
    laborCost,
    gasCost,
    electricityCost,
    energyCost,
    productionSubtotal: ingredientCost.ingredientsSubtotal + (laborCost ?? 0) + energyCost,
    missingInputs,
  };
}

/** Distribuye el costo de la tanda y suma el envase requerido por la presentación elegida. */
export function calculateSaleQuoteCost(recipe: RecipeInput, production: ProductionCost, packaging: Packaging, stickers: StickerSettings, requestedUnits: number): SaleQuoteCost {
  requireNumber(requestedUnits, 'La cantidad solicitada', true);
  if (!Number.isInteger(requestedUnits)) throw new RangeError('La cantidad de cookies debe ser un número entero.');
  if (recipe.yieldUnit !== 'unit') throw new RangeError('La receta debe tener rendimiento expresado en unidades.');
  requireNumber(recipe.yieldQuantity, 'El rendimiento', true);
  requireNumber(packaging.purchaseQuantity, 'La cantidad de envases comprada', true);
  requireNumber(packaging.purchasePrice, 'El precio de los envases');
  requireNumber(packaging.capacity, 'La capacidad del envase', true);
  if (packaging.capacityUnit !== 'unit') throw new RangeError('La capacidad del envase debe estar expresada en unidades.');
  if (packaging.kind === 'box' && requestedUnits > packaging.capacity) {
    throw new RangeError(`Esta caja admite hasta ${packaging.capacity} cookies. Elegí otra presentación.`);
  }
  if (packaging.kind === 'individual' && packaging.capacity !== 1) throw new RangeError('Un envase individual debe tener capacidad para una unidad.');
  if (packaging.kind !== 'box' && packaging.kind !== 'individual') throw new RangeError('El tipo de envase no es válido.');
  const packageCount = packaging.kind === 'individual' ? requestedUnits : 1;
  const unitProductionCost = production.productionSubtotal / recipe.yieldQuantity;
  const productsCost = unitProductionCost * requestedUnits;
  const laborCost = production.laborCost === null ? null : production.laborCost / recipe.yieldQuantity * requestedUnits;
  if (laborCost !== null) requireNumber(laborCost, 'La remuneración por trabajo propio');
  const unitPackagingCost = packaging.purchasePrice / packaging.purchaseQuantity;
  const containersCost = unitPackagingCost * packageCount;
  const stickerCount = packageCount * packaging.stickersPerPackage;
  const missingInputs = [...production.missingInputs];
  let stickerCost: number | null = null;
  if (stickerCount === 0) stickerCost = 0;
  else if (stickers.purchaseQuantity === null || stickers.purchasePrice === null) missingInputs.push('precio de los stickers');
  else {
    requireNumber(stickers.purchaseQuantity, 'La cantidad de stickers comprada', true);
    requireNumber(stickers.purchasePrice, 'El precio de los stickers');
    stickerCost = stickerCount * stickers.purchasePrice / stickers.purchaseQuantity;
  }
  const packagingCost = containersCost + (stickerCost ?? 0);
  const quotedCost = productsCost + packagingCost;
  for (const [label, value] of Object.entries({ unitProductionCost, productsCost, unitPackagingCost, containersCost, packagingCost, quotedCost })) requireNumber(value, label);
  return { requestedUnits, packageCount, unitProductionCost, productsCost, laborCost, unitPackagingCost, containersCost, stickerCount, stickerCost, packagingCost, quotedCost, isPartial: missingInputs.length > 0, missingInputs };
}

/** Sugiere un precio por recargo sobre costo o margen sobre venta, sin redondear ni sumar comisiones. */
export function calculateSuggestedSalePrice(cost: number, percentage: number, basis: PricingBasis): number {
  requireNumber(cost, 'El costo');
  requireNumber(percentage, 'El porcentaje');
  if (basis !== 'markup' && basis !== 'margin') throw new RangeError('Elegí recargo sobre costo o margen sobre venta.');
  if (basis === 'margin' && percentage >= 100) throw new RangeError('El margen sobre venta debe ser menor que 100%.');
  const price = basis === 'markup' ? cost * (1 + percentage / 100) : cost / (1 - percentage / 100);
  requireNumber(price, 'El precio sugerido');
  return price;
}

/** Incluye el trabajo propio en la ganancia y separa el excedente; los porcentajes usan el costo con trabajo. */
export function calculateSaleProfit(cost: number, salePrice: number, laborCost: number | null = 0): SaleProfit {
  requireNumber(cost, 'El costo');
  requireNumber(salePrice, 'El precio de venta');
  if (laborCost !== null) {
    requireNumber(laborCost, 'La remuneración por trabajo propio');
    if (laborCost > cost) throw new RangeError('La remuneración no puede superar el costo que la incluye.');
  }
  const profit = salePrice - (cost - (laborCost ?? 0));
  const surplus = laborCost === null ? null : salePrice - cost;
  const markupPercentage = cost === 0 || surplus === null ? null : surplus / cost * 100;
  const marginPercentage = salePrice === 0 || surplus === null ? null : surplus / salePrice * 100;
  if ((markupPercentage !== null && !Number.isFinite(markupPercentage)) || (marginPercentage !== null && !Number.isFinite(marginPercentage))) {
    throw new RangeError('Los porcentajes calculados deben ser finitos.');
  }
  return { salePrice, profit, laborCost, surplus, markupPercentage, marginPercentage };
}
