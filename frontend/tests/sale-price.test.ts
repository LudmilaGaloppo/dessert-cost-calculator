import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateProductionCost, calculateSaleProfit, calculateSaleQuoteCost, calculateSuggestedSalePrice } from '../src/domain/costs.js';
import type { PricingBasis } from '@dessert-cost/shared';

test('distingue recargo sobre costo de margen sobre precio de venta', () => {
  assert.equal(calculateSuggestedSalePrice(10000, 50, 'markup'), 15000);
  assert.equal(calculateSuggestedSalePrice(10000, 50, 'margin'), 20000);
  const profit = calculateSaleProfit(10000, 15000);
  assert.equal(profit.profit, 5000);
  assert.equal(profit.markupPercentage, 50);
  assert.ok(profit.marginPercentage !== null && Math.abs(profit.marginPercentage - 100 / 3) < 1e-10);
  assert.deepEqual(calculateSaleProfit(10000, 20000), { salePrice: 20000, profit: 10000, laborCost: 0, surplus: 10000, markupPercentage: 100, marginPercentage: 50 });
});

test('no redondea el precio a múltiplos ni incorpora comisiones', () => {
  assert.equal(calculateSuggestedSalePrice(8175, 30, 'markup'), 10627.5);
  assert.equal(calculateSuggestedSalePrice(8175, 30, 'margin'), 8175 / 0.7);
  assert.equal(calculateSaleProfit(8175, 10600).profit, 2425);
});

test('permite recargos mayores al 100%, pero exige margen menor al 100%', () => {
  assert.equal(calculateSuggestedSalePrice(10000, 150, 'markup'), 25000);
  assert.equal(calculateSuggestedSalePrice(100, 99, 'margin'), 100 / (1 - 0.99));
  for (const percentage of [100, 101, 150]) {
    assert.throws(() => calculateSuggestedSalePrice(10000, percentage, 'margin'), /menor que 100/);
  }
  assert.throws(() => calculateSuggestedSalePrice(10000, 50, 'other' as PricingBasis), RangeError);
});

test('el precio manual admite ganancia, equilibrio, pérdida y precio cero', () => {
  assert.deepEqual(calculateSaleProfit(10000, 8000), { salePrice: 8000, profit: -2000, laborCost: 0, surplus: -2000, markupPercentage: -20, marginPercentage: -25 });
  assert.deepEqual(calculateSaleProfit(10000, 10000), { salePrice: 10000, profit: 0, laborCost: 0, surplus: 0, markupPercentage: 0, marginPercentage: 0 });
  assert.deepEqual(calculateSaleProfit(10000, 0), { salePrice: 0, profit: -10000, laborCost: 0, surplus: -10000, markupPercentage: -100, marginPercentage: null });
});

test('conserva ceros explícitos y no inventa porcentajes con denominador cero', () => {
  for (const basis of ['markup', 'margin'] as const) {
    assert.equal(calculateSuggestedSalePrice(10000, 0, basis), 10000);
    assert.equal(calculateSuggestedSalePrice(0, 50, basis), 0);
  }
  assert.deepEqual(calculateSaleProfit(0, 100), { salePrice: 100, profit: 100, laborCost: 0, surplus: 100, markupPercentage: null, marginPercentage: 100 });
  assert.deepEqual(calculateSaleProfit(0, 0), { salePrice: 0, profit: 0, laborCost: 0, surplus: 0, markupPercentage: null, marginPercentage: null });
});

test('rechaza entradas inválidas y resultados que desbordan', () => {
  for (const value of [undefined, null, '', '50', -1, NaN, Infinity]) {
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSuggestedSalePrice(value, 50, 'markup'), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSuggestedSalePrice(100, value, 'markup'), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSaleProfit(value, 100), RangeError);
    // @ts-expect-error Dato externo inválido para verificar la validación en ejecución.
    assert.throws(() => calculateSaleProfit(100, value), RangeError);
  }
  assert.throws(() => calculateSuggestedSalePrice(Number.MAX_VALUE, 100, 'markup'), RangeError);
  assert.throws(() => calculateSaleProfit(Number.MIN_VALUE, 1), RangeError);
  for (const laborCost of [-1, NaN, Infinity, 101]) {
    assert.throws(() => calculateSaleProfit(100, 200, laborCost), RangeError);
  }
});

test('la ganancia de una cookie de $3500 incluye el trabajo propio con tarifa cero o de $5000', () => {
  const supply = { id: 'dough', name: 'Masa', purchaseQuantity: 11, purchaseUnit: 'unit' as const, purchasePrice: 13200 };
  const recipe = { name: 'Cookies', yieldQuantity: 11, yieldUnit: 'unit' as const, workingHours: 3, gasOvenMinutes: 60, electricMixerMinutes: 0, ingredients: [{ supplyId: supply.id, quantity: 11, unit: 'unit' as const }] };
  const bag = { id: 'bag', name: 'Bolsa', kind: 'individual' as const, purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit' as const, stickersPerPackage: 0 };
  const stickers = { name: null, purchaseQuantity: null, purchasePrice: null };
  for (const hourlyRate of [0, 5000]) {
    const production = calculateProductionCost(recipe, [supply], { hourlyRate, gasDailyAverage: 8257.92, electricityDailyAverage: null });
    const quote = calculateSaleQuoteCost(recipe, production, bag, stickers, 1);
    const result = calculateSaleProfit(quote.quotedCost, 3500, quote.laborCost);
    assert.ok(Math.abs(result.profit - 2251.72) < 1e-10);
    assert.equal(quote.laborCost, hourlyRate * 3 / 11);
    if (hourlyRate === 5000) assert.equal(result.surplus?.toFixed(2), '888.08');
  }
});

test('distribuye el trabajo por las unidades de una caja y conserva el recargo elegido', () => {
  const recipe = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit' as const, workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [] };
  const production = calculateProductionCost(recipe, [], { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null });
  const box = { id: 'box', name: 'Caja', kind: 'box' as const, purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit' as const, stickersPerPackage: 1 };
  const quote = calculateSaleQuoteCost(recipe, production, box, { name: 'Sticker', purchaseQuantity: 80, purchasePrice: 28000 }, 5);
  assert.equal(quote.laborCost, 6250);
  const price = calculateSuggestedSalePrice(quote.quotedCost, 50, 'markup');
  const result = calculateSaleProfit(quote.quotedCost, price, quote.laborCost);
  assert.equal(result.profit, 10150);
  assert.equal(result.surplus, 3900);
  assert.equal(result.markupPercentage, 50);
});

test('distingue dinero disponible de cubrir la tarifa y de perder dinero', () => {
  const underpaid = calculateSaleProfit(3000, 2000, 1500);
  assert.equal(underpaid.profit, 500);
  assert.equal(underpaid.surplus, -1000);
  assert.equal(calculateSaleProfit(3000, 1000, 1500).profit, -500);
  assert.equal(calculateSaleProfit(3000, 0, 1500).profit, -1500);
});

test('conserva pendiente el desglose del trabajo sin inventar una remuneración cero', () => {
  const recipe = { name: 'Cookies', yieldQuantity: 12, yieldUnit: 'unit' as const, workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [] };
  const production = calculateProductionCost(recipe, [], { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null });
  const bag = { id: 'bag', name: 'Bolsa', kind: 'individual' as const, purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit' as const, stickersPerPackage: 0 };
  const quote = calculateSaleQuoteCost(recipe, production, bag, { name: null, purchaseQuantity: null, purchasePrice: null }, 1);
  assert.equal(quote.laborCost, null);
  assert.equal(quote.isPartial, true);
  assert.deepEqual(calculateSaleProfit(quote.quotedCost, 3500, quote.laborCost), { salePrice: 3500, profit: 3483, laborCost: null, surplus: null, markupPercentage: null, marginPercentage: null });
});
