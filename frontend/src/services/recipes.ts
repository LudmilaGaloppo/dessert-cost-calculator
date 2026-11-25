import type { Recipe, RecipeInput } from '@dessert-cost/shared';
import { request } from './request';

/** Recupera las recetas guardadas; permite cancelar la carga al salir de la pantalla. */
export async function listRecipes(signal?: AbortSignal): Promise<Recipe[]> {
  return (await request<{ recipes: Recipe[] }>('/api/recipes', { signal })).recipes;
}

/** Crea o actualiza una receta enviando cantidades y referencias, sin copiar precios. */
export async function saveRecipe(input: RecipeInput, id?: string): Promise<Recipe> {
  const response = await request<{ recipe: Recipe }>(id ? `/api/recipes/${encodeURIComponent(id)}` : '/api/recipes', {
    method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  return response.recipe;
}

/** Elimina una receta guardada; sus insumos permanecen en el catálogo. */
export async function deleteRecipe(id: string): Promise<void> {
  await request<void>(`/api/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
