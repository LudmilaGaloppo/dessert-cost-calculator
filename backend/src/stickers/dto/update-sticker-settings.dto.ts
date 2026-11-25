import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, MaxLength, Min } from 'class-validator';
import { trimText } from '../../common/validation.js';

/** Define la compra compartida de stickers que recibe la API. */
export class UpdateStickerSettingsDto {
  @Transform(trimText) @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;
  @IsInt() @IsPositive()
  purchaseQuantity!: number;
  @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  purchasePrice!: number;
}
