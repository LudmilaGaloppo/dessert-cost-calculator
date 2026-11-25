import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { UpdateHourlyRateDto } from './dto/update-hourly-rate.dto.js';
import { UpdateEnergySettingsDto } from './dto/update-energy-settings.dto.js';

/** Expone la configuración general conservando las rutas costs y energy. */
@Controller('settings')
export class SettingsController {
  /** Recibe el servicio de configuración. */
  constructor(private readonly settings: SettingsService) {}
  /** Devuelve tarifa y promedios diarios configurados. */
  @Get('costs')
  async find() { return { settings: await this.settings.find() }; }
  /** Guarda la tarifa recibida sin convertir textos numéricos. */
  @Put('costs')
  async updateHourlyRate(@Body() input: UpdateHourlyRateDto) { return { settings: await this.settings.updateHourlyRate(input) }; }
  /** Guarda ambos promedios diarios de energía. */
  @Put('energy')
  async updateEnergy(@Body() input: UpdateEnergySettingsDto) { return { settings: await this.settings.updateEnergy(input) }; }
}
