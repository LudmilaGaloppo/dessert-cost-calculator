import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Conserva la compra compartida y su colección sticker_settings. */
@Schema({ collection: 'sticker_settings', timestamps: true, versionKey: false, bufferCommands: false })
export class StickerSettings {
  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  name!: string;
  @Prop({ type: Number, required: true, validate: (value: number) => Number.isInteger(value) && value > 0 })
  purchaseQuantity!: number;
  @Prop({ type: Number, required: true, validate: (value: number) => Number.isFinite(value) && value >= 0 })
  purchasePrice!: number;
}
export const StickerSettingsSchema = SchemaFactory.createForClass(StickerSettings);
