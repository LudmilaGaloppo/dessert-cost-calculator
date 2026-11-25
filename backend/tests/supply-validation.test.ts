import test from 'node:test';
import assert from 'node:assert/strict';
import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { createValidationPipe } from '../src/common/validation.js';
import { CreateSupplyDto } from '../src/supplies/dto/create-supply.dto.js';

const purchase = { name: ' Harina ', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };

test('el DTO permite solo datos de compra y recorta el nombre', async () => {
  const value = await createValidationPipe().transform({ ...purchase, id: 'injected', usedQuantity: 375, $set: {} }, { type: 'body', metatype: CreateSupplyDto });
  assert.deepEqual({ ...value }, { ...purchase, name: 'Harina' });
});

test('el DTO rechaza entradas inválidas sin confiar en la validación del formulario', async () => {
  for (const invalid of [null, [], {}, { ...purchase, name: '  ' }, { ...purchase, name: 'a'.repeat(121) }, { ...purchase, purchasePrice: '6000' }, { ...purchase, purchasePrice: -1 }, { ...purchase, purchaseQuantity: 0 }, { ...purchase, purchaseQuantity: Infinity }, { ...purchase, purchaseUnit: { $ne: null } }, { ...purchase, purchaseUnit: 'gr' }]) {
    await assert.rejects(() => createValidationPipe().transform(invalid, { type: 'body', metatype: CreateSupplyDto }), BadRequestException);
  }
  assert.equal((await createValidationPipe().transform({ ...purchase, purchasePrice: 0 }, { type: 'body', metatype: CreateSupplyDto })).purchasePrice, 0);
});

