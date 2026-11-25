import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { PackagingInput, PackagingKind } from '@dessert-cost/shared';

/** Comprueba las cantidades enteras positivas que usa la compra y la capacidad. */
function isPositiveInteger(value: number): boolean { return Number.isInteger(value) && value > 0; }

/** Conserva la colección packaging y el formato de sus documentos existentes. */
@Schema({ collection: 'packaging', timestamps: true, versionKey: false, bufferCommands: false })
export class Packaging implements PackagingInput {
  @Prop({ type: String, required: true, trim: true, maxlength: 160 })
  name!: string;
  @Prop({ type: String, required: true, enum: ['individual', 'box'] })
  kind!: PackagingKind;
  @Prop({ type: Number, required: true, validate: isPositiveInteger })
  purchaseQuantity!: number;
  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value >= 0 })
  purchasePrice!: number;
  @Prop({ type: Number, required: true, validate: isPositiveInteger })
  capacity!: number;
  @Prop({ type: String, required: true, enum: ['unit'] })
  capacityUnit!: 'unit';
  @Prop({ type: Number, required: true, min: 0, validate: Number.isInteger })
  stickersPerPackage!: number;
}
export const PackagingSchema = SchemaFactory.createForClass(Packaging);
