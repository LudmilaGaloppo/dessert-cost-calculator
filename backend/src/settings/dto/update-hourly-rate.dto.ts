import { IsNumber, Min } from 'class-validator';

/** Valida la tarifa general y conserva el cero explícito como valor configurado. */
export class UpdateHourlyRateDto {
  @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  hourlyRate!: number;
}
