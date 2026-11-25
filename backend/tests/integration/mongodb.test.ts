import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createDatabaseTestApp } from '../helpers/create-test-app.js';
import { Supply as SupplyEntity, SupplySchema } from '../../src/supplies/supply.entity.js';
import { Recipe as RecipeEntity, RecipeSchema } from '../../src/recipes/recipe.entity.js';
import { CostSettings, CostSettingsSchema } from '../../src/settings/cost-settings.entity.js';
import { SuppliesService } from '../../src/supplies/supplies.service.js';
import { SettingsService } from '../../src/settings/settings.service.js';
import type { Recipe, Supply } from '@dessert-cost/shared';

test('Nest lee documentos anteriores sin migrar colecciones, identificadores ni valores pendientes', async (context) => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator';
  const dbName = `dessert_cost_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  const purchase = { name: 'Harina existente', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 2400 };
  const { insertedId: supplyId } = await connection.collection('supplies').insertOne({ ...purchase });
  const { insertedId: recipeId } = await connection.collection('recipes').insertOne({ name: 'Receta existente', yieldQuantity: 12, yieldUnit: 'unit', ingredients: [{ supplyId: supplyId.toString(), quantity: 100, unit: 'g' }] });
  await connection.collection('settings').insertOne({ key: 'costs', hourlyRate: 0 });
  await connection.collection('packaging').insertOne({ name: 'Bolsa existente', kind: 'individual', purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit', stickersPerPackage: 1 });
  await connection.collection('sticker_settings').insertOne({ name: 'Logo existente', purchaseQuantity: 80, purchasePrice: 28000 });
  const app = await createDatabaseTestApp(uri, dbName);
  context.after(async () => {
    await app.close();
    try {
      assert.equal(connection.name, dbName);
      assert.match(dbName, /^dessert_cost_test_[a-f0-9]{32}$/);
      await connection.dropDatabase();
    } finally { await connection.close(); }
  });
  const address = (app.getHttpServer() as Server).address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api`;
  assert.deepEqual(await (await fetch(`${base}/supplies`)).json(), { supplies: [{ ...purchase, id: supplyId.toString() }] });
  const recipes = (await (await fetch(`${base}/recipes`)).json() as { recipes: Recipe[] }).recipes;
  assert.equal(recipes[0].id, recipeId.toString());
  assert.equal(recipes[0].workingHours, null);
  assert.equal(recipes[0].gasOvenMinutes, null);
  assert.equal(recipes[0].electricMixerMinutes, null);
  assert.deepEqual(await (await fetch(`${base}/settings/costs`)).json(), { settings: { hourlyRate: 0, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await (await fetch(`${base}/packaging`)).json() as { packaging: unknown[] }).packaging.length, 1);
  assert.deepEqual(await (await fetch(`${base}/settings/stickers`)).json(), { stickers: { name: 'Logo existente', purchaseQuantity: 80, purchasePrice: 28000 } });
});

test('MongoDB local persiste insumos, permite releerlos desde otra conexión y actualiza por ID', async (context) => {
  const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator';
  // dbName reemplaza la base de la URI: nunca se escribe en el catálogo de la usuaria.
  const dbName = `dessert_cost_test_${randomUUID().replaceAll('-', '')}`;
  const connection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  const app = await createDatabaseTestApp(uri, dbName);
  const server = app.getHttpServer() as Server;
  context.after(async () => {
    await app.close();
    try {
      assert.equal(connection.name, dbName);
      assert.match(dbName, /^dessert_cost_test_[a-f0-9]{32}$/);
      await connection.dropDatabase();
    } finally { await connection.close(); }
  });
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/supplies`;
  const headers = { 'Content-Type': 'application/json' };
  const input = { name: 'Harina de prueba', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 };
  const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(input) });
  assert.equal(response.status, 201);
  const { supply } = await response.json() as { supply: Supply };
  assert.match(supply.id, /^[a-f0-9]{24}$/);

  const secondConnection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    const service = new SuppliesService(secondConnection.model<SupplyEntity>(SupplyEntity.name, SupplySchema), secondConnection.model<RecipeEntity>(RecipeEntity.name, RecipeSchema));
    assert.deepEqual(await service.findAll(), [supply]);
  } finally { await secondConnection.close(); }

  const updated = await fetch(`${url}/${supply.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...input, purchasePrice: 8000 }) });
  assert.equal(updated.status, 200);
  const saved = await (await fetch(url)).json() as { supplies: Supply[] };
  assert.equal(saved.supplies.length, 1);
  assert.equal(saved.supplies[0].id, supply.id);
  assert.equal(saved.supplies[0].purchasePrice, 8000);
  const recipesUrl = `http://127.0.0.1:${address.port}/api/recipes`;
  const recipeInput = { name: 'Cookies de prueba', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 90, electricMixerMinutes: 5, ingredients: [{ supplyId: supply.id, quantity: 375, unit: 'g' }] };
  const recipeResponse = await fetch(recipesUrl, { method: 'POST', headers, body: JSON.stringify(recipeInput) });
  assert.equal(recipeResponse.status, 201);
  const { recipe } = await recipeResponse.json() as { recipe: Recipe };
  assert.match(recipe.id, /^[a-f0-9]{24}$/);
  assert.deepEqual((await (await fetch(recipesUrl)).json() as { recipes: Recipe[] }).recipes, [recipe]);
  const updatedRecipeResponse = await fetch(`${recipesUrl}/${recipe.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...recipeInput, yieldQuantity: 15 }) });
  assert.equal(updatedRecipeResponse.status, 200);
  assert.equal(((await updatedRecipeResponse.json()) as { recipe: Recipe }).recipe.yieldQuantity, 15);
  assert.equal((await fetch(`${url}/${supply.id}`, { method: 'DELETE' })).status, 409);
  assert.equal((await fetch(`${recipesUrl}/${recipe.id}`, { method: 'DELETE' })).status, 204);
  assert.deepEqual((await (await fetch(recipesUrl)).json() as { recipes: Recipe[] }).recipes, []);
  const unusedResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, name: 'Azúcar sin uso' }) });
  const { supply: unusedSupply } = await unusedResponse.json() as { supply: Supply };
  assert.equal((await fetch(`${url}/${unusedSupply.id}`, { method: 'DELETE' })).status, 204);
  assert.equal(await connection.collection('supplies').countDocuments({ name: 'Azúcar sin uso' }), 0);
  const settingsUrl = `http://127.0.0.1:${address.port}/api/settings/costs`;
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: null, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await fetch(settingsUrl, { method: 'PUT', headers, body: JSON.stringify({ hourlyRate: 0 }) })).status, 200);
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: 0, gasDailyAverage: null, electricityDailyAverage: null } });
  const settingsConnection = await mongoose.createConnection(uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  try {
    const service = new SettingsService(settingsConnection.model<CostSettings>(CostSettings.name, CostSettingsSchema));
    assert.deepEqual(await service.find(), { hourlyRate: 0, gasDailyAverage: null, electricityDailyAverage: null });
  } finally { await settingsConnection.close(); }
  assert.equal((await fetch(settingsUrl, { method: 'PUT', headers, body: JSON.stringify({ hourlyRate: 5000 }) })).status, 200);
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: 5000, gasDailyAverage: null, electricityDailyAverage: null } });
  assert.equal((await fetch(`http://127.0.0.1:${address.port}/api/settings/energy`, { method: 'PUT', headers, body: JSON.stringify({ gasDailyAverage: 3000, electricityDailyAverage: 2850 }) })).status, 200);
  assert.deepEqual(await (await fetch(settingsUrl)).json(), { settings: { hourlyRate: 5000, gasDailyAverage: 3000, electricityDailyAverage: 2850 } });
  const packagingUrl = `http://127.0.0.1:${address.port}/api/packaging`;
  const boxInput = { name: 'Caja de prueba', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1 };
  const packagingResponse = await fetch(packagingUrl, { method: 'POST', headers, body: JSON.stringify(boxInput) });
  assert.equal(packagingResponse.status, 201);
  const { packaging: savedBox } = await packagingResponse.json() as { packaging: { id: string } };
  assert.equal((await (await fetch(packagingUrl)).json() as { packaging: unknown[] }).packaging.length, 1);
  assert.equal((await fetch(`${packagingUrl}/${savedBox.id}`, { method: 'DELETE' })).status, 204);
  assert.deepEqual((await (await fetch(packagingUrl)).json() as { packaging: unknown[] }).packaging, []);
  const stickerUrl = `http://127.0.0.1:${address.port}/api/settings/stickers`;
  assert.equal((await fetch(stickerUrl, { method: 'PUT', headers, body: JSON.stringify({ name: 'Sticker de prueba', purchaseQuantity: 80, purchasePrice: 28000 }) })).status, 200);
  assert.deepEqual(await (await fetch(stickerUrl)).json(), { stickers: { name: 'Sticker de prueba', purchaseQuantity: 80, purchasePrice: 28000 } });
  assert.equal((await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...input, purchaseQuantity: 0 }) })).status, 400);
  assert.equal(await connection.collection('supplies').countDocuments(), 1);
  assert.equal(await connection.collection('recipes').countDocuments(), 0);
  assert.equal(await connection.collection('settings').countDocuments(), 1);
  assert.equal(await connection.collection('packaging').countDocuments(), 0);
  assert.equal(await connection.collection('sticker_settings').countDocuments(), 1);
});
