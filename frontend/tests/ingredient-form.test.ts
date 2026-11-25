import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIngredientForm, emptyIngredientForm, exampleIngredientForm } from '../src/utils/ingredient-form.js';

test('el formulario acepta coma o punto decimal y conserva el cálculo conocido', () => {
  assert.equal(calculateIngredientForm(exampleIngredientForm).cost, 900);
  assert.equal(calculateIngredientForm({ ...exampleIngredientForm, purchaseQuantity: '2.5' }).cost, 900);
});

test('no convierte un campo vacío en cero ni acepta texto o separadores de miles', () => {
  assert.throws(() => calculateIngredientForm(emptyIngredientForm), /nombre/);
  for (const purchasePrice of ['', '  ', 'abc', '6.000,50', '1e3', 'Infinity']) {
    assert.throws(() => calculateIngredientForm({ ...exampleIngredientForm, purchasePrice }));
  }
});

test('el formulario conserva el precio cero explícito y rechaza negativos y divisor cero', () => {
  assert.equal(calculateIngredientForm({ ...exampleIngredientForm, purchasePrice: '0' }).cost, 0);
  assert.throws(() => calculateIngredientForm({ ...exampleIngredientForm, purchaseQuantity: '0' }), /mayor que cero/);
  assert.throws(() => calculateIngredientForm({ ...exampleIngredientForm, purchasePrice: '-100' }), /no negativo/);
});

test('rechaza unidades inválidas y muestra la incompatibilidad entre masa y volumen', () => {
  assert.throws(() => calculateIngredientForm({ ...exampleIngredientForm, purchaseUnit: 'gr' }), /unidad válida/);
  assert.throws(() => calculateIngredientForm({ ...exampleIngredientForm, usedUnit: 'ml' }), /incompatibles/);
});
