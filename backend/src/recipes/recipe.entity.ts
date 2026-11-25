import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { RecipeInput, RecipeIngredient, Unit } from '@dessert-cost/shared';
import { UNITS } from '../common/units.js';

/** Conserva el ingrediente embebido sin crear un identificador adicional. */
@Schema({ _id: false })
export class RecipeIngredientEntity implements RecipeIngredient {
  @Prop({ type: String, required: true })
  supplyId!: string;
  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value > 0 })
  quantity!: number;
  @Prop({ type: String, required: true, enum: UNITS })
  unit!: Unit;
}
const RecipeIngredientSchema = SchemaFactory.createForClass(RecipeIngredientEntity);

/** Acepta un tiempo pendiente o un valor finito no negativo. */
function isNullableTime(value: number | null): boolean { return value === null || (Number.isFinite(value) && value >= 0); }

/** Conserva los campos y la colección de recetas, sin copiar precios del catálogo. */
@Schema({ collection: 'recipes', timestamps: true, versionKey: false, bufferCommands: false })
export class Recipe implements RecipeInput {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;
  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value > 0 })
  yieldQuantity!: number;
  @Prop({ type: String, required: true, enum: UNITS })
  yieldUnit!: Unit;
  @Prop({ type: Number, default: null, validate: isNullableTime })
  workingHours!: number | null;
  @Prop({ type: Number, default: null, validate: isNullableTime })
  gasOvenMinutes!: number | null;
  @Prop({ type: Number, default: null, validate: isNullableTime })
  electricMixerMinutes!: number | null;
  @Prop({ type: [RecipeIngredientSchema], required: true })
  ingredients!: RecipeIngredientEntity[];
}
export const RecipeSchema = SchemaFactory.createForClass(Recipe);
