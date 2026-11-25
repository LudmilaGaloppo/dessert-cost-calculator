import type { Packaging, PackagingInput } from '@dessert-cost/shared';
import type { PackagingFormValues } from '../types/packaging-form.js';
import { parseDecimal } from './ingredient-form.js';

/** Crea los campos iniciales de un envase individual. */
export function emptyPackagingForm(): PackagingFormValues {
  return { name: '', kind: 'individual', purchaseQuantity: '', purchasePrice: '', capacity: '1', stickersPerPackage: '1' };
}

/** Convierte un envase persistido a valores editables del formulario. */
export function packagingToForm(packaging: Packaging): PackagingFormValues {
  return { name: packaging.name, kind: packaging.kind, purchaseQuantity: String(packaging.purchaseQuantity), purchasePrice: String(packaging.purchasePrice), capacity: String(packaging.capacity), stickersPerPackage: String(packaging.stickersPerPackage) };
}

/** Valida textos del formulario y prepara un envase para la API. */
export function packagingInputFromForm(values: PackagingFormValues): PackagingInput {
  const name = values.name.trim();
  if (!name || name.length > 160) throw new Error('El nombre debe tener entre 1 y 160 caracteres.');
  const purchaseQuantity = parseDecimal(values.purchaseQuantity, 'la cantidad de envases comprada');
  const purchasePrice = parseDecimal(values.purchasePrice, 'el precio total de compra');
  const capacity = parseDecimal(values.capacity, 'la capacidad');
  const stickersPerPackage = parseDecimal(values.stickersPerPackage, 'los stickers por envase');
  if (!Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) throw new Error('La cantidad comprada debe ser un entero mayor que cero.');
  if (purchasePrice < 0) throw new Error('El precio total no puede ser negativo.');
  if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('La capacidad debe ser un entero mayor que cero.');
  if (values.kind === 'individual' && capacity !== 1) throw new Error('Un envase individual debe contener una cookie.');
  if (!Number.isInteger(stickersPerPackage) || stickersPerPackage < 0) throw new Error('Los stickers por envase deben ser un entero no negativo.');
  return { name, kind: values.kind, purchaseQuantity, purchasePrice, capacity, capacityUnit: 'unit', stickersPerPackage };
}
