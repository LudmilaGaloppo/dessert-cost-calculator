import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Supply, SupplySchema } from './supply.entity.js';
import { Recipe, RecipeSchema } from '../recipes/recipe.entity.js';
import { SuppliesController } from './supplies.controller.js';
import { SuppliesService } from './supplies.service.js';

/** Conecta insumos con su controller, servicio y los modelos necesarios para proteger sus referencias. */
@Module({
  imports: [MongooseModule.forFeature([{ name: Supply.name, schema: SupplySchema }, { name: Recipe.name, schema: RecipeSchema }])],
  controllers: [SuppliesController], providers: [SuppliesService], exports: [SuppliesService],
})
export class SuppliesModule {}
