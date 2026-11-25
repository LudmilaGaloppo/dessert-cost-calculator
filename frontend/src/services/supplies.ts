import type { Supply, SupplyInput } from '@dessert-cost/shared';
import { request } from './request';

/** Obtiene el catálogo persistido en MongoDB; permite cancelar la carga al salir de la pantalla. */
export async function listSupplies(signal?: AbortSignal): Promise<Supply[]> {
  const response = await request<{ supplies: Supply[] }>('/api/supplies', { signal });
  return response.supplies;
}

/** Crea un insumo o actualiza el seleccionado, enviando únicamente sus datos de compra. */
export async function saveSupply(input: SupplyInput, id?: string): Promise<Supply> {
  const response = await request<{ supply: Supply }>(id ? `/api/supplies/${encodeURIComponent(id)}` : '/api/supplies', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return response.supply;
}

/** Elimina un insumo que no esté referenciado por ninguna receta guardada. */
export async function deleteSupply(id: string): Promise<void> {
  await request<void>(`/api/supplies/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
