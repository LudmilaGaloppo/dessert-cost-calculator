import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPackagingForm, packagingInputFromForm, packagingToForm } from '../src/utils/packaging-form.js';

test('convierte la caja acordada conservando compra, capacidad y sticker', () => {
  assert.deepEqual(packagingInputFromForm({ name: ' Caja con visor ', kind: 'box', purchaseQuantity: '4', purchasePrice: '4800', capacity: '12', stickersPerPackage: '1' }), {
    name: 'Caja con visor', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1,
  });
});

test('exige capacidad uno para la bolsa individual y cantidades enteras', () => {
  assert.throws(() => packagingInputFromForm({ name: 'Bolsa', kind: 'individual', purchaseQuantity: '100', purchasePrice: '1700', capacity: '2', stickersPerPackage: '1' }), /una cookie/);
  assert.throws(() => packagingInputFromForm({ name: 'Caja', kind: 'box', purchaseQuantity: '4,5', purchasePrice: '4800', capacity: '12', stickersPerPackage: '1' }), /entero/);
});

test('crea valores independientes y transforma un envase persistido', () => {
  const empty = emptyPackagingForm();
  const form = packagingToForm({ id: 'bag', name: 'Bolsa', kind: 'individual', purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit', stickersPerPackage: 1 });
  empty.name = 'Otro';
  assert.equal(form.name, 'Bolsa');
  assert.equal(form.stickersPerPackage, '1');
});
