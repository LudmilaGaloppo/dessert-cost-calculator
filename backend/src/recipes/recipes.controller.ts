import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { RecipesService } from './recipes.service.js';
import { CreateRecipeDto } from './dto/create-recipe.dto.js';
import { UpdateRecipeDto } from './dto/update-recipe.dto.js';
import { IdParamDto } from '../common/dto/id-param.dto.js';

/** Expone las rutas HTTP de recetas delegando sus reglas al servicio. */
@Controller('recipes')
export class RecipesController {
  /** Recibe el servicio de recetas registrado en su módulo. */
  constructor(private readonly recipes: RecipesService) {}
  /** Lista las recetas con el formato conocido por el frontend. */
  @Get()
  async findAll() { return { recipes: await this.recipes.findAll() }; }
  /** Crea una receta con los datos validados. */
  @Post()
  async create(@Body() input: CreateRecipeDto) { return { recipe: await this.recipes.create(input) }; }
  /** Reemplaza los datos de una receta existente. */
  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() input: UpdateRecipeDto) { return { recipe: await this.recipes.update(id, input) }; }
  /** Elimina una receta y responde sin contenido. */
  @Delete(':id') @HttpCode(204)
  async remove(@Param() { id }: IdParamDto) { await this.recipes.remove(id); }
}
