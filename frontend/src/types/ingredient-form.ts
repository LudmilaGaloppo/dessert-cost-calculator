import type { Unit } from '@dessert-cost/shared';

// Los campos conservan texto mientras se editan, incluso cuando están vacíos.
export interface IngredientFormValues {
  name: string;
  purchaseQuantity: string;
  purchaseUnit: string;
  purchasePrice: string;
  usedQuantity: string;
  usedUnit: string;
}

export interface IngredientFormResult {
  name: string;
  purchaseQuantity: number;
  purchaseUnit: Unit;
  purchasePrice: number;
  usedQuantity: number;
  usedUnit: Unit;
  cost: number;
}
