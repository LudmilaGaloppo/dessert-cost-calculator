import test from 'node:test';
import assert from 'node:assert/strict';
import { convertQuantity, calculateIngredientCost, calculateProductionCost, calculateRecipeIngredients, calculateSaleQuoteCost } from '../src/domain/costs.js';
import type { Packaging, RecipeInput, Supply, RecipeIngredient, Unit } from '@dessert-cost/shared';

const flour: Supply = Object.freeze({ id: 'flour', name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 });
const ingredient: RecipeIngredient = Object.freeze({ supplyId: 'flour', quantity: 375, unit: 'g' });

test('convierte masa y volumen en ambos sentidos, y conserva unidades', () => {
  assert.equal(convertQuantity(2.5, 'kg', 'g'), 2500);
  assert.equal(convertQuantity(375, 'g', 'kg'), 0.375);
  assert.equal(convertQuantity(1.5, 'l', 'ml'), 1500);
  assert.equal(convertQuantity(250, 'ml', 'l'), 0.25);
  assert.equal(convertQuantity(3, 'unit', 'unit'), 3);
});

test('rechaza unidades desconocidas y conversiones entre dimensiones', () => {
  for (const pair of [['g', 'ml'], ['kg', 'unit'], ['gr', 'g'], ['g', 'constructor']]) {
    // Simulamos unidades externas inválidas para comprobar la validación en ejecución.
    assert.throws(() => convertQuantity(1, pair[0] as Unit, pair[1] as Unit), RangeError);
  }
});

test('calcula la proporción aunque la compra y el uso tengan distintas unidades', () => {
  assert.equal(calculateIngredientCost(flour, ingredient), 900);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 150 }), 360);
  assert.equal(calculateIngredientCost({ ...flour, purchaseQuantity: 2500, purchaseUnit: 'g' }, { ...ingredient, quantity: 0.375, unit: 'kg' }), 900);
});

test('rechaza datos faltantes, texto, negativos y números no finitos', () => {
  for (const value of [undefined, null, '', '6000', NaN, Infinity, -1]) {
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost({ ...flour, purchasePrice: value }, ingredient));
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost({ ...flour, purchaseQuantity: value }, ingredient));
    // @ts-expect-error Entrada inválida intencional para probar la validación en ejecución.
    assert.throws(() => calculateIngredientCost(flour, { ...ingredient, quantity: value }));
  }
  assert.throws(() => calculateIngredientCost({ ...flour, purchaseQuantity: 0 }, ingredient));
});

test('permite precio cero y uso cero explícitos; no confunde costo con stock', () => {
  assert.equal(calculateIngredientCost({ ...flour, purchasePrice: 0 }, ingredient), 0);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 0 }), 0);
  assert.equal(calculateIngredientCost(flour, { ...ingredient, quantity: 5000 }), 12000);
});

test('devuelve desglose y subtotal sin modificar la receta ni el catálogo', () => {
  const sugar: Supply = Object.freeze({ id: 'sugar', name: 'Azúcar', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 2000 });
  const recipe = Object.freeze({ ingredients: Object.freeze([ingredient, Object.freeze<RecipeIngredient>({ supplyId: 'sugar', quantity: 150, unit: 'g' })]) });
  const result = calculateRecipeIngredients(recipe, Object.freeze([flour, sugar]));
  assert.equal(result.ingredientsSubtotal, 1200);
  assert.deepEqual(result.items.map((item) => item.cost), [900, 300]);
  assert.equal(recipe.ingredients[0].quantity, 375);
  assert.equal(flour.purchaseQuantity, 2.5);
});

test('detecta referencias ausentes, incorrectas e identificadores duplicados', () => {
  assert.throws(() => calculateRecipeIngredients({ ingredients: [ingredient] }, []), /Insumo inexistente/);
  assert.throws(() => calculateIngredientCost(flour, { ...ingredient, supplyId: 'other' }), /no referencia/);
  assert.throws(() => calculateRecipeIngredients({ ingredients: [] }, [flour, flour]), /duplicado/);
  // @ts-expect-error Se omite supplyId intencionalmente para probar un dato externo incompleto.
  assert.throws(() => calculateRecipeIngredients({ ingredients: [{ quantity: 1, unit: 'g' }] }, [flour]), /identificador/);
});

test('recalcula con el precio actual y conserva resultados previos como valores', () => {
  const recipe = { ingredients: [ingredient] };
  const before = calculateRecipeIngredients(recipe, [flour]);
  const after = calculateRecipeIngredients(recipe, [{ ...flour, purchasePrice: 8000 }]);
  assert.equal(before.ingredientsSubtotal, 900);
  assert.equal(after.ingredientsSubtotal, 1200);
});

test('una receta vacía tiene subtotal cero; rechaza colecciones inválidas', () => {
  assert.deepEqual(calculateRecipeIngredients({ ingredients: [] }, []), { items: [], ingredientsSubtotal: 0 });
  // @ts-expect-error Colección inválida intencional.
  assert.throws(() => calculateRecipeIngredients({ ingredients: null }, []), TypeError);
  // @ts-expect-error Colección inválida intencional.
  assert.throws(() => calculateRecipeIngredients({ ingredients: [] }, null), TypeError);
});

test('suma la mano de obra al subtotal con la tarifa general', () => {
  const recipe: RecipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [ingredient] };
  const result = calculateProductionCost(recipe, [flour], { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null });
  assert.equal(result.ingredientsSubtotal, 900);
  assert.equal(result.laborCost, 15000);
  assert.equal(result.productionSubtotal, 15900);
  assert.deepEqual(result.missingInputs, []);
});

test('mantiene el costo parcial cuando faltan horas o tarifa', () => {
  const recipe: RecipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: null, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [ingredient] };
  assert.deepEqual(calculateProductionCost(recipe, [flour], { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null }).missingInputs, ['horas de trabajo', 'valor de la hora']);
  const result = calculateProductionCost({ ...recipe, workingHours: 3 }, [flour], { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null });
  assert.equal(result.laborCost, null);
  assert.equal(result.productionSubtotal, 900);
  assert.deepEqual(result.missingInputs, ['valor de la hora']);
});

test('prorratea los promedios diarios sobre los minutos usados por la receta', () => {
  const recipe: RecipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 0, gasOvenMinutes: 90, electricMixerMinutes: 5, ingredients: [ingredient] };
  const result = calculateProductionCost(recipe, [flour], { hourlyRate: null, gasDailyAverage: 3000, electricityDailyAverage: 2850 });
  assert.equal(result.laborCost, 0);
  assert.equal(result.gasCost, 187.5);
  assert.ok(result.electricityCost !== null && Math.abs(result.electricityCost - 9.895833333333334) < 1e-10);
  assert.ok(Math.abs(result.energyCost - 197.39583333333334) < 1e-10);
  assert.deepEqual(result.missingInputs, []);
});

test('cotiza una caja con un único sticker y rechaza superar su capacidad', () => {
  const recipe: RecipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [ingredient] };
  const production = calculateProductionCost(recipe, [flour], { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null });
  const box: Packaging = { id: 'box', name: 'Caja', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1 };
  const result = calculateSaleQuoteCost(recipe, production, box, { name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 }, 5);
  assert.equal(result.productsCost, 6625);
  assert.equal(result.containersCost, 1200);
  assert.equal(result.stickerCount, 1);
  assert.equal(result.stickerCost, 350);
  assert.equal(result.quotedCost, 8175);
  assert.throws(() => calculateSaleQuoteCost(recipe, production, box, { name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 }, 13), /hasta 12/);
});

test('cotiza una bolsa y un sticker por cada cookie individual', () => {
  const recipe: RecipeInput = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [ingredient] };
  const production = calculateProductionCost(recipe, [flour], { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null });
  const bag: Packaging = { id: 'bag', name: 'Bolsa', kind: 'individual', purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit', stickersPerPackage: 1 };
  const result = calculateSaleQuoteCost(recipe, production, bag, { name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 }, 5);
  assert.equal(result.packageCount, 5);
  assert.equal(result.containersCost, 85);
  assert.equal(result.stickerCount, 5);
  assert.equal(result.stickerCost, 1750);
  assert.equal(result.packagingCost, 1835);
  assert.equal(result.quotedCost, 8460);
});

test('la tarifa cero calcula mano de obra cero y se distingue de una tarifa pendiente', () => {
  const recipe = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit' as const, workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [{ supplyId: flour.id, quantity: 375, unit: 'g' as const }] };
  const settings = { hourlyRate: 0, gasDailyAverage: null, electricityDailyAverage: null };
  const result = calculateProductionCost(recipe, [flour], settings);
  assert.equal(result.laborCost, 0);
  assert.equal(result.productionSubtotal, result.ingredientsSubtotal);
  assert.deepEqual(result.missingInputs, []);
  const pending = calculateProductionCost(recipe, [flour], { ...settings, hourlyRate: null });
  assert.equal(pending.laborCost, null);
  assert.deepEqual(pending.missingInputs, ['valor de la hora']);
  assert.deepEqual(calculateProductionCost({ ...recipe, workingHours: null }, [flour], settings).missingInputs, ['horas de trabajo']);
  for (const hourlyRate of [-1, NaN, Infinity]) {
    assert.throws(() => calculateProductionCost(recipe, [flour], { ...settings, hourlyRate }), /valor de la hora/i);
  }
});
