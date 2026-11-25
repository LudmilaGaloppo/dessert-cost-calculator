import { calculateRecipeIngredients } from '../src/domain/costs.js';
import type { Supply, Recipe } from '@dessert-cost/shared';

// Datos hipotéticos para probar el cálculo, no una receta real completa.
const supplies: Supply[] = [
  { id: 'flour', name: 'Harina', purchaseQuantity: 2.5, purchaseUnit: 'kg', purchasePrice: 6000 },
  { id: 'sugar', name: 'Azúcar', purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 2000 },
];

const recipe: Recipe = {
  id: 'cookies-demo',
  name: 'Cookies de ejemplo',
  yieldQuantity: 12,
  yieldUnit: 'unit',
  workingHours: 3,
  gasOvenMinutes: 90,
  electricMixerMinutes: 5,
  ingredients: [
    { supplyId: 'flour', quantity: 375, unit: 'g' },
    { supplyId: 'sugar', quantity: 150, unit: 'g' },
  ],
};

console.log(JSON.stringify(calculateRecipeIngredients(recipe, supplies), null, 2));
