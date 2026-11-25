import { expect, test, type Page } from '@playwright/test';
import type { Packaging, Recipe, Supply } from '@dessert-cost/shared';

/** Simula persistencia HTTP para verificar la interfaz sin modificar MongoDB ni datos personales. */
async function mockApi(page: Page) {
  let supplies: Supply[] = [
    { id: 'flour', name: 'Harina 0000', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 },
    { id: 'sugar', name: 'Azúcar', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 2000 },
  ];
  let recipes: Recipe[] = [{ id: 'cookies', name: 'Cookies con chocolate', yieldQuantity: 12, yieldUnit: 'unit', workingHours: 3, gasOvenMinutes: 0, electricMixerMinutes: 0, ingredients: [{ supplyId: 'flour', quantity: 375, unit: 'g' }] }];
  let packaging: Packaging[] = [
    { id: 'bag', name: 'Bolsa individual', kind: 'individual', purchaseQuantity: 100, purchasePrice: 1700, capacity: 1, capacityUnit: 'unit', stickersPerPackage: 1 },
    { id: 'box', name: 'Caja con visor', kind: 'box', purchaseQuantity: 4, purchasePrice: 4800, capacity: 12, capacityUnit: 'unit', stickersPerPackage: 1 },
  ];
  let settings = { hourlyRate: 5000, gasDailyAverage: 3000, electricityDailyAverage: 2850 };
  let stickers = { name: 'Logo redondo', purchaseQuantity: 80, purchasePrice: 28000 };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.method() === 'GET' ? null : request.postDataJSON();
    if (path === '/api/supplies' && !body) return route.fulfill({ json: { supplies } });
    if (path.startsWith('/api/supplies') && body) {
      const supply = { ...body, id: path.split('/')[3] ?? 'new-supply' } as Supply;
      supplies = [...supplies.filter((item) => item.id !== supply.id), supply];
      return route.fulfill({ json: { supply } });
    }
    if (path === '/api/recipes' && !body) return route.fulfill({ json: { recipes } });
    if (path.startsWith('/api/recipes') && body) {
      const recipe = { ...body, id: path.split('/')[3] ?? 'new-recipe' } as Recipe;
      recipes = [...recipes.filter((item) => item.id !== recipe.id), recipe];
      return route.fulfill({ json: { recipe } });
    }
    if (path === '/api/packaging' && !body) return route.fulfill({ json: { packaging } });
    if (path.startsWith('/api/packaging') && body) {
      const item = { ...body, id: path.split('/')[3] ?? 'new-packaging' } as Packaging;
      packaging = [...packaging.filter((previous) => previous.id !== item.id), item];
      return route.fulfill({ json: { packaging: item } });
    }
    if (path === '/api/settings/costs' || path === '/api/settings/energy') {
      settings = { ...settings, ...body };
      return route.fulfill({ json: { settings } });
    }
    if (path === '/api/settings/stickers') {
      stickers = { ...stickers, ...body };
      return route.fulfill({ json: { stickers } });
    }
    return route.fulfill({ status: 404, json: { error: 'Ruta no simulada' } });
  });
}

/** Elige un registro por texto usando la misma navegación que tendría una persona con teclado. */
async function selectOption(page: Page, id: string, query: string) {
  const input = page.locator('#' + id);
  await input.fill(query);
  await expect(page.getByRole('option').first()).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).not.toHaveValue(query);
}

/** Comprueba que los textos y controles se mantengan dentro del ancho disponible. */
async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const captured: string[] = [];
  errors.set(page, captured);
  page.on('pageerror', (error) => captured.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') captured.push(message.text()); });
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Actualizar', exact: true })).toBeEnabled();
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

test('busca sin tildes, elige con teclado y presenta datos guardados como texto', async ({ page }, testInfo) => {
  await selectOption(page, 'savedSupply', 'azucar');
  await expect(page.locator('.record-details')).toContainText('Azúcar');
  await expect(page.getByRole('textbox', { name: 'Nombre del insumo', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nombre del insumo', exact: true })).toHaveValue('Azúcar');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expectNoOverflow(page);
  expect(await page.locator('.skip-link').evaluate((element) => getComputedStyle(element).clipPath)).toBe('inset(50%)');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Segoe UI');
  await page.screenshot({ path: testInfo.outputPath('insumos-final.png'), fullPage: true });
});

test('cancelar restaura el insumo y guardar permite salir sin advertencia', async ({ page }) => {
  await selectOption(page, 'savedSupply', 'Harina');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nombre del insumo', exact: true }).fill('Cambio sin guardar');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('textbox', { name: 'Nombre del insumo', exact: true })).toHaveValue('Cambio sin guardar');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(page.locator('.record-details')).toContainText('Harina 0000');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nombre del insumo', exact: true }).fill('Harina integral');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.locator('.record-details')).toContainText('Harina integral');
  await page.getByRole('button', { name: 'Recetas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'El costo de cada tanda.' })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('las flechas recorren todas las opciones y cambiar de registro protege la edición', async ({ page }) => {
  const picker = page.locator('#savedSupply');
  await picker.fill('a');
  await picker.press('ArrowDown');
  await picker.press('ArrowDown');
  await picker.press('Enter');
  await expect(page.locator('.record-details')).toContainText('Azúcar');
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nombre del insumo', exact: true }).fill('Azúcar nueva');
  await selectOption(page, 'savedSupply', 'Harina');
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  await expect(page.getByRole('textbox', { name: 'Nombre del insumo', exact: true })).toHaveValue('Azúcar nueva');
  await expect(picker).toHaveValue('Azúcar');
  await selectOption(page, 'savedSupply', 'Harina');
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(page.locator('.record-details')).toContainText('Harina 0000');
});

test('protege un registro nuevo al navegar y permite recuperar el foco con Escape', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Nombre del insumo', exact: true }).fill('Chocolate');
  await page.getByRole('button', { name: 'Recetas', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('textbox', { name: 'Nombre del insumo', exact: true })).toHaveValue('Chocolate');
  await page.getByRole('button', { name: 'Recetas', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(page.getByRole('heading', { name: 'El costo de cada tanda.' })).toBeVisible();
});

test('recetas conserva el cálculo, cancela cambios y protege tarifa y energía', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Recetas', exact: true }).click();
  await selectOption(page, 'saved-recipe', 'Cookies');
  await page.getByRole('button', { name: 'Calcular costo de la tanda' }).click();
  await expect(page.locator('.result-amount')).toHaveText(/15.900,00/);
  await expect(page.locator('.result-ingredients')).toContainText('Harina 0000');
  await page.getByRole('button', { name: 'Editar valor de la hora' }).click();
  await page.getByRole('textbox', { name: 'Tarifa por hora (ARS)' }).fill('0');
  await page.getByRole('button', { name: 'Packaging', exact: true }).click();
  await page.getByRole('button', { name: 'Seguir editando' }).click();
  const hourly = page.getByRole('form', { name: 'Valor de tu hora', exact: true });
  await hourly.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(hourly.locator('.record-details')).toContainText('$ 0,00');
  await page.getByRole('button', { name: 'Editar promedios de energía' }).click();
  const energy = page.getByRole('form', { name: 'Promedios diarios de energía' });
  await energy.getByRole('textbox', { name: 'Gas por día (ARS)' }).fill('5000');
  await energy.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(energy.locator('.record-details')).toContainText('3.000,00');
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('recetas-final.png'), fullPage: true });
});

test('guarda una receta nueva con insumos elegidos en el combobox', async ({ page }) => {
  await page.getByRole('button', { name: 'Recetas', exact: true }).click();
  const form = page.getByRole('form', { name: 'Editar receta', exact: true });
  await form.getByRole('textbox', { name: 'Nombre de la receta', exact: true }).fill('Cookies nuevas');
  await form.getByRole('textbox', { name: 'Cantidad producida', exact: true }).fill('12');
  await selectOption(page, 'ingredient-supply-0', 'Harina');
  await form.getByRole('textbox', { name: 'Cantidad utilizada', exact: true }).fill('375');
  await form.getByRole('button', { name: 'Guardar receta', exact: true }).click();
  await expect(form.locator('.record-details')).toContainText('Cookies nuevas');
  await expect(form.locator('.record-details').getByText('Pendiente', { exact: true })).toHaveCount(3);
  await expect(form.locator('.ingredient-list')).toContainText('Harina 0000');
});

test('separa la administración del recorrido de venta y conserva la ganancia con trabajo propio', async ({ page }, testInfo) => {
  await page.getByRole('button', { name: 'Packaging', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Armá tu venta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compra de stickers' })).toBeHidden();
  await selectOption(page, 'quote-recipe', 'Cookies');
  await selectOption(page, 'quote-packaging', 'Bolsa');
  await page.getByRole('textbox', { name: '3. Cantidad de cookies' }).fill('1');
  await page.getByRole('button', { name: 'Calcular costo de la venta' }).click();
  await page.getByRole('textbox', { name: 'Precio manual por toda la cotización (ARS)' }).fill('3500');
  await page.getByRole('button', { name: 'Calcular ganancia', exact: true }).click();
  const manual = page.getByRole('form', { name: 'Evaluar precio manual' });
  await expect(manual.locator('.profit-breakdown > div').first()).toContainText('3.058,00');
  await expect(manual.locator('.profit-breakdown')).toContainText('1.250,00');
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('venta-final.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Envases y stickers' }).click();
  await selectOption(page, 'saved-packaging', 'Caja');
  await expect(page.getByRole('form', { name: 'Editar envase', exact: true }).locator('.record-details')).toContainText('Caja con visor');
  await expectNoOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('envases-final.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Calcular una venta', exact: true }).click();
  await expect(manual.getByRole('textbox')).toHaveValue('3500');
  await expect(manual.locator('.profit-breakdown > div').first()).toContainText('3.058,00');
});

test('cancelar envases y stickers restaura los datos guardados', async ({ page }) => {
  await page.getByRole('button', { name: 'Packaging', exact: true }).click();
  await page.getByRole('tab', { name: 'Envases y stickers' }).click();
  await selectOption(page, 'saved-packaging', 'Bolsa');
  const packaging = page.getByRole('form', { name: 'Editar envase', exact: true });
  await packaging.getByRole('button', { name: 'Editar', exact: true }).click();
  await packaging.getByRole('textbox', { name: 'Nombre del envase', exact: true }).fill('Bolsa modificada');
  await packaging.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(packaging.locator('.record-details')).toContainText('Bolsa individual');
  const stickers = page.getByRole('form', { name: 'Compra de stickers', exact: true });
  await stickers.getByRole('button', { name: 'Editar stickers' }).click();
  await stickers.getByRole('textbox', { name: 'Precio total (ARS)' }).fill('30000');
  await stickers.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(stickers.locator('.record-details')).toContainText('28.000,00');
});
