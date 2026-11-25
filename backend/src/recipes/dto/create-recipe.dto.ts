import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import type { RecipeInput, RecipeIngredient, Unit } from '@dessert-cost/shared';
import { trimText } from '../../common/validation.js';
import { UNITS } from '../../common/units.js';

/** Valida la cantidad, la unidad y la referencia externa de un ingrediente. */
export class RecipeIngredientDto implements RecipeIngredient {
  @IsMongoId()
  supplyId!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }) @IsPositive()
  quantity!: number;

  @IsIn(UNITS)
  unit!: Unit;
}

/** Define la receta recibida; los tiempos omitidos siguen siendo pendientes, nunca cero implícito. */
export class CreateRecipeDto implements RecipeInput {
  @Transform(trimText)
  @IsString() @IsNotEmpty() @MaxLength(120)
  name!: string;

  @IsNumber({ allowNaN: false, allowInfinity: false }) @IsPositive()
  yieldQuantity!: number;

  @IsIn(UNITS)
  yieldUnit!: Unit;

  @IsOptional() @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  workingHours: number | null = null;

  @IsOptional() @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  gasOvenMinutes: number | null = null;

  @IsOptional() @IsNumber({ allowNaN: false, allowInfinity: false }) @Min(0)
  electricMixerMinutes: number | null = null;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @ValidateNested({ each: true }) @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];
}
