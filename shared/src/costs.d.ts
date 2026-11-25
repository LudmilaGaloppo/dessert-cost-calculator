// Unión de literales: solo estas unidades son válidas en el modelo.
export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'unit';

// Datos que se envían al guardar un insumo; el servidor asigna su identificador.
export interface SupplyInput {
  name: string;
  purchaseQuantity: number;
  purchaseUnit: Unit;
  purchasePrice: number;
}

// Insumo guardado del catálogo, con sus datos de compra y su identificador.
export interface Supply extends SupplyInput {
  id: string;
}

// Uso de un insumo dentro de una receta.
export interface RecipeIngredient {
  supplyId: string;
  quantity: number;
  unit: Unit;
}

// Datos editables: el rendimiento describe lo que produce una tanda.
export interface RecipeInput {
  name: string;
  yieldQuantity: number;
  yieldUnit: Unit;
  workingHours: number | null;
  gasOvenMinutes: number | null;
  electricMixerMinutes: number | null;
  ingredients: readonly RecipeIngredient[];
}

// Receta persistida; sus costos se calculan con el catálogo vigente.
export interface Recipe extends RecipeInput {
  id: string;
}

export interface IngredientCost extends RecipeIngredient {
  name: string;
  cost: number;
}

export interface RecipeIngredientsCost {
  items: IngredientCost[];
  ingredientsSubtotal: number;
}

// Configuración general usada para valorar el trabajo de cualquier receta.
export interface CostSettings {
  hourlyRate: number | null;
  gasDailyAverage: number | null;
  electricityDailyAverage: number | null;
}

// Desglose conocido de producción; null distingue un costo pendiente de un costo cero.
export interface ProductionCost extends RecipeIngredientsCost {
  laborCost: number | null;
  gasCost: number | null;
  electricityCost: number | null;
  energyCost: number;
  productionSubtotal: number;
  missingInputs: string[];
}

export type PackagingKind = 'individual' | 'box';

// Datos de compra y capacidad de un envase; el servidor asigna su identificador.
export interface PackagingInput {
  name: string;
  kind: PackagingKind;
  purchaseQuantity: number;
  purchasePrice: number;
  capacity: number;
  capacityUnit: Unit;
  stickersPerPackage: number;
}

// Envase persistido y reutilizable en distintas cotizaciones.
export interface Packaging extends PackagingInput {
  id: string;
}

// Compra de stickers compartida por todas las presentaciones que los utilizan.
export interface StickerSettings {
  name: string | null;
  purchaseQuantity: number | null;
  purchasePrice: number | null;
}

// Costo de una cantidad vendida con el envase elegido, sin convertirlo en precio de venta.
export interface SaleQuoteCost {
  requestedUnits: number;
  packageCount: number;
  unitProductionCost: number;
  productsCost: number;
  // Parte del trabajo propio atribuible a la cantidad cotizada; null si falta valorarlo.
  laborCost: number | null;
  unitPackagingCost: number;
  containersCost: number;
  stickerCount: number;
  stickerCost: number | null;
  packagingCost: number;
  quotedCost: number;
  isPartial: boolean;
  missingInputs: string[];
}

// El porcentaje puede aplicarse sobre el costo o sobre el precio de venta.
export type PricingBasis = 'markup' | 'margin';

// Ganancia para quien elabora: incluye su trabajo; el excedente lo descuenta para evaluar la tarifa.
export interface SaleProfit {
  salePrice: number;
  profit: number;
  laborCost: number | null;
  surplus: number | null;
  markupPercentage: number | null;
  marginPercentage: number | null;
}
