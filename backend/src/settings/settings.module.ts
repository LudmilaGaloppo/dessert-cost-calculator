import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CostSettings, CostSettingsSchema } from './cost-settings.entity.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

/** Conecta el modelo, el servicio y las rutas de configuración de costos. */
@Module({ imports: [MongooseModule.forFeature([{ name: CostSettings.name, schema: CostSettingsSchema }])], controllers: [SettingsController], providers: [SettingsService] })
export class SettingsModule {}
