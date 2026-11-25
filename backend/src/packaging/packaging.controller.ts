import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { PackagingService } from './packaging.service.js';
import { CreatePackagingDto } from './dto/create-packaging.dto.js';
import { UpdatePackagingDto } from './dto/update-packaging.dto.js';
import { IdParamDto } from '../common/dto/id-param.dto.js';

/** Expone el catálogo de envases bajo las rutas que ya usa el frontend. */
@Controller('packaging')
export class PackagingController {
  /** Recibe el servicio de envases mediante el módulo. */
  constructor(private readonly packaging: PackagingService) {}
  /** Lista los envases disponibles. */
  @Get()
  async findAll() { return { packaging: await this.packaging.findAll() }; }
  /** Crea un envase con los datos validados. */
  @Post()
  async create(@Body() input: CreatePackagingDto) { return { packaging: await this.packaging.create(input) }; }
  /** Actualiza el envase identificado en la ruta. */
  @Put(':id')
  async update(@Param() { id }: IdParamDto, @Body() input: UpdatePackagingDto) { return { packaging: await this.packaging.update(id, input) }; }
  /** Elimina un envase y devuelve HTTP 204. */
  @Delete(':id') @HttpCode(204)
  async remove(@Param() { id }: IdParamDto) { await this.packaging.remove(id); }
}
