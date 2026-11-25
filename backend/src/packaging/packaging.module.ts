import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Packaging, PackagingSchema } from './packaging.entity.js';
import { PackagingController } from './packaging.controller.js';
import { PackagingService } from './packaging.service.js';

/** Agrupa la persistencia, el servicio y las rutas del catálogo de envases. */
@Module({ imports: [MongooseModule.forFeature([{ name: Packaging.name, schema: PackagingSchema }])], controllers: [PackagingController], providers: [PackagingService] })
export class PackagingModule {}
