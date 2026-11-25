import type { Packaging, PackagingInput, StickerSettings } from '@dessert-cost/shared';
import { request } from './request';

/** Recupera el catálogo de envases guardado en MongoDB. */
export async function listPackaging(signal?: AbortSignal): Promise<Packaging[]> {
  return (await request<{ packaging: Packaging[] }>('/api/packaging', { signal })).packaging;
}

/** Crea o actualiza un envase con sus datos de compra y capacidad. */
export async function savePackaging(input: PackagingInput, id?: string): Promise<Packaging> {
  return (await request<{ packaging: Packaging }>(id ? `/api/packaging/${encodeURIComponent(id)}` : '/api/packaging', {
    method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  })).packaging;
}

/** Elimina un envase guardado del catálogo de presentaciones. */
export async function deletePackaging(id: string): Promise<void> {
  await request<void>(`/api/packaging/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Recupera la compra de stickers usada por todas las presentaciones. */
export async function getStickerSettings(signal?: AbortSignal): Promise<StickerSettings> {
  return (await request<{ stickers: StickerSettings }>('/api/settings/stickers', { signal })).stickers;
}

/** Guarda la compra de stickers para recalcular automáticamente su costo unitario. */
export async function saveStickerSettings(name: string, purchaseQuantity: number, purchasePrice: number): Promise<StickerSettings> {
  return (await request<{ stickers: StickerSettings }>('/api/settings/stickers', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, purchaseQuantity, purchasePrice }),
  })).stickers;
}
