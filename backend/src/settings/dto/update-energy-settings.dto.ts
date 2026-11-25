import { IsNumber, IsPositive } from 'class-validator';

/** Exige ambos promedios diarios positivos antes de actualizar energía. */
export class UpdateEnergySettingsDto {
  @IsNumber({ allowNaN: false, allowInfinity: false }) @IsPositive()
  gasDailyAverage!: number;
  @IsNumber({ allowNaN: false, allowInfinity: false }) @IsPositive()
  electricityDailyAverage!: number;
}
