import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { CostSettings as CostSettingsData } from '@dessert-cost/shared';
import { CostSettings } from './cost-settings.entity.js';
import type { UpdateHourlyRateDto } from './dto/update-hourly-rate.dto.js';
import type { UpdateEnergySettingsDto } from './dto/update-energy-settings.dto.js';

/** Conserva null para los valores de configuración que todavía no se definieron. */
function toSettings(document: CostSettings | null): CostSettingsData {
  return { hourlyRate: document?.hourlyRate ?? null, gasDailyAverage: document?.gasDailyAverage ?? null, electricityDailyAverage: document?.electricityDailyAverage ?? null };
}

/** Administra la tarifa y los promedios de energía compartidos por todas las recetas. */
@Injectable()
export class SettingsService {
  /** Recibe el modelo de configuración registrado por el módulo. */
  constructor(@InjectModel(CostSettings.name) private readonly settings: Model<CostSettings>) {}
  /** Recupera la configuración o devuelve pendientes si no existe. */
  async find(): Promise<CostSettingsData> { return toSettings(await this.settings.findOne({ key: 'costs' }).lean().exec()); }
  /** Actualiza solo la tarifa y conserva los promedios de energía. */
  async updateHourlyRate(input: UpdateHourlyRateDto): Promise<CostSettingsData> {
    return toSettings(await this.settings.findOneAndUpdate({ key: 'costs' }, { $set: input }, { upsert: true, returnDocument: 'after', runValidators: true }).lean().exec());
  }
  /** Actualiza solo los promedios de energía y conserva la tarifa. */
  async updateEnergy(input: UpdateEnergySettingsDto): Promise<CostSettingsData> {
    return toSettings(await this.settings.findOneAndUpdate({ key: 'costs' }, { $set: input }, { upsert: true, returnDocument: 'after', runValidators: true }).lean().exec());
  }
}
