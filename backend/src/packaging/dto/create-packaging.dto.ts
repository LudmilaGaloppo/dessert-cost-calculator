import { Transform } from 'class-transformer';
import { Equals, IsIn, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import type { PackagingInput, PackagingKind } from '@dessert-cost/shared';
import { trimText } from '../../common/validation.js';

/** Define la compra, capacidad y stickers aceptados al crear un envase. */
export class CreatePackagingDto implements PackagingInput {
  @Transform(trimText) @IsString() @IsNotEmpty() @MaxLength(160)
  name!: string;
  @IsIn(['individual', 'box'])
  kind!: PackagingKind;
  @IsInt() @IsPositive()
  purchaseQuantity!: number;
  @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  purchasePrice!: number;
  @IsInt() @IsPositive()
  capacity!: number;
  @Equals('unit')
  capacityUnit!: 'unit';
  @IsInt() @Min(0)
  stickersPerPackage!: number;
}
