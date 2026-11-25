export interface RecipeFormValues {
  name: string;
  yieldQuantity: string;
  yieldUnit: string;
  workingHours: string;
  gasOvenMinutes: string;
  electricMixerMinutes: string;
  ingredients: { supplyId: string; quantity: string; unit: string }[];
}
