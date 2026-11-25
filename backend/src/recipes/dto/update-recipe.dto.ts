import { CreateRecipeDto } from './create-recipe.dto.js';

/** Mantiene el contrato PUT de receta completa con las mismas validaciones que al crearla. */
export class UpdateRecipeDto extends CreateRecipeDto {}
