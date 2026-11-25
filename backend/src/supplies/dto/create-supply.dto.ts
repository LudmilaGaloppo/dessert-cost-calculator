import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import type { SupplyInput, Unit } from '@dessert-cost/shared';
import { trimText } from '../../common/validation.js';
import { UNITS } from '../../common/units.js';

/** Define y valida los datos de compra que se aceptan al crear un insumo. */
export class CreateSupplyDto implements SupplyInput {
  @Transform(trimText)
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }) @IsPositive()
  purchaseQuantity!: number;

  @IsIn(UNITS)
  purchaseUnit!: Unit;

  @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  purchasePrice!: number;
}
