import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Recipe as RecipeData } from '@dessert-cost/shared';
import { Recipe } from './recipe.entity.js';
import { SuppliesService } from '../supplies/supplies.service.js';
import { UNIT_DIMENSIONS } from '../common/units.js';
import type { CreateRecipeDto } from './dto/create-recipe.dto.js';
import type { UpdateRecipeDto } from './dto/update-recipe.dto.js';

/** Traduce la receta persistida al contrato público y conserva los tiempos pendientes. */
function toRecipe(document: Recipe & { _id: { toString(): string } }): RecipeData {
  return { id: document._id.toString(), name: document.name, yieldQuantity: document.yieldQuantity, yieldUnit: document.yieldUnit,
    workingHours: document.workingHours ?? null, gasOvenMinutes: document.gasOvenMinutes ?? null, electricMixerMinutes: document.electricMixerMinutes ?? null,
    ingredients: document.ingredients.map(({ supplyId, quantity, unit }) => ({ supplyId, quantity, unit })) };
}

/** Administra recetas y comprueba sus referencias y unidades contra el catálogo vigente. */
@Injectable()
export class RecipesService {
  /** Recibe el modelo de recetas y el servicio de insumos exportado por su módulo. */
  constructor(@InjectModel(Recipe.name) private readonly recipes: Model<Recipe>, private readonly supplies: SuppliesService) {}

  /** Recupera las recetas ordenadas, sin persistir resultados calculados. */
  async findAll(): Promise<RecipeData[]> { return (await this.recipes.find().sort({ name: 1, _id: 1 }).lean().exec()).map(toRecipe); }

  /** Comprueba existencia de insumos y compatibilidad de unidades; son reglas que necesitan datos guardados. */
  private async validateReferences(input: CreateRecipeDto): Promise<void> {
    const supplies = await this.supplies.findAll();
    input.ingredients.forEach((ingredient, index) => {
      const supply = supplies.find((item) => item.id === ingredient.supplyId);
      if (!supply) throw new BadRequestException(`Elegí un insumo del catálogo para el ingrediente ${index + 1}.`);
      if (UNIT_DIMENSIONS[ingredient.unit] !== UNIT_DIMENSIONS[supply.purchaseUnit]) throw new BadRequestException(`La unidad del ingrediente ${index + 1} no es compatible con ${supply.name}.`);
    });
  }

  /** Valida las referencias y guarda una receta nueva. */
  async create(input: CreateRecipeDto): Promise<RecipeData> { await this.validateReferences(input); return toRecipe(await this.recipes.create(input)); }

  /** Revalida las referencias y actualiza una receta existente. */
  async update(id: string, input: UpdateRecipeDto): Promise<RecipeData> {
    await this.validateReferences(input);
    const document = await this.recipes.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
    if (!document) throw new NotFoundException('La receta no existe.');
    return toRecipe(document);
  }

  /** Elimina la receta y conserva todos sus insumos. */
  async remove(id: string): Promise<void> { if (!await this.recipes.findByIdAndDelete(id).lean().exec()) throw new NotFoundException('La receta no existe.'); }
}
