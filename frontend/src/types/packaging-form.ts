export interface PackagingFormValues {
  name: string;
  kind: 'individual' | 'box';
  purchaseQuantity: string;
  purchasePrice: string;
  capacity: string;
  stickersPerPackage: string;
}

export interface QuoteFormValues {
  recipeId: string;
  packagingId: string;
  requestedUnits: string;
}
