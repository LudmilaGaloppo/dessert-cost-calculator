import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { SuppliesService } from './supplies.service.js';
import { CreateSupplyDto } from './dto/create-supply.dto.js';
import { UpdateSupplyDto } from './dto/update-supply.dto.js';
import { IdParamDto } from '../common/dto/id-param.dto.js';

/** Expone las rutas HTTP del catálogo de insumos. */
@Controller('supplies')
export class SuppliesController {
  /** Recibe el servicio de insumos mediante inyección de dependencias. */
  constructor(private readonly supplies: SuppliesService) {}

  /** Devuelve los insumos conservando la respuesta que consume el frontend. */
  @Get()
  async findAll() { return { supplies: await this.supplies.findAll() }; }

  /** Crea un insumo con los datos validados por su DTO. */
  @Post()
  async create(@Body() input: CreateSupplyDto) { return { supply: await this.supplies.create(input) }; }

  /** Actualiza un insumo identificado por un ID válido. */
  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() input: UpdateSupplyDto) { return { supply: await this.supplies.update(id, input) }; }

  /** Elimina un insumo sin uso y responde sin contenido. */
  @Delete(':id') @HttpCode(204)
  async remove(@Param() { id }: IdParamDto) { await this.supplies.remove(id); }
}
