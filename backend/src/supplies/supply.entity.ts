import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { SupplyInput, Unit } from '@dessert-cost/shared';
import { UNITS } from '../common/units.js';

/** Conserva el esquema y la colección de insumos existentes en MongoDB. */
@Schema({ collection: 'supplies', timestamps: true, versionKey: false, bufferCommands: false })
export class Supply implements SupplyInput {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value > 0 })
  purchaseQuantity!: number;

  @Prop({ type: String, required: true, enum: UNITS })
  purchaseUnit!: Unit;

  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value >= 0 })
  purchasePrice!: number;
}
export const SupplySchema = SchemaFactory.createForClass(Supply);
