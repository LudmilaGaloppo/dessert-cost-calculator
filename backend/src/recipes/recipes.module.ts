import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recipe, RecipeSchema } from './recipe.entity.js';
import { RecipesController } from './recipes.controller.js';
import { RecipesService } from './recipes.service.js';
import { SuppliesModule } from '../supplies/supplies.module.js';

/** Registra recetas y reutiliza el servicio de insumos sin dependencias circulares entre módulos. */
@Module({ imports: [MongooseModule.forFeature([{ name: Recipe.name, schema: RecipeSchema }]), SuppliesModule], controllers: [RecipesController], providers: [RecipesService] })
export class RecipesModule {}
