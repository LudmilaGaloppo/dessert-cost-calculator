import test from 'node:test';
import assert from 'node:assert/strict';
import { supplyInputFromForm, exampleIngredientForm, validateDecimalField } from '../src/utils/ingredient-form.js';

test('guardar un insumo no exige ni persiste los datos de uso', () => {
  assert.deepEqual(supplyInputFromForm({ ...exampleIngredientForm, usedQuantity: '', usedUnit: '' }), { name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 });
});

test('las reglas de React Hook Form aceptan coma y rechazan vacíos, negativos y cero como divisor', () => {
  assert.equal(validateDecimalField('2,5', 'cantidad', true), true);
  assert.equal(validateDecimalField('0', 'precio'), true);
  assert.notEqual(validateDecimalField('', 'cantidad'), true);
  assert.notEqual(validateDecimalField('0', 'cantidad', true), true);
  assert.notEqual(validateDecimalField('-1', 'precio'), true);
});
