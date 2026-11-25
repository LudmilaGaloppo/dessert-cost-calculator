import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Conserva la configuración identificada por key=costs en la colección settings. */
@Schema({ collection: 'settings', timestamps: true, versionKey: false, bufferCommands: false })
export class CostSettings {
  @Prop({ type: String, required: true, unique: true })
  key!: string;
  @Prop({ type: Number, validate: (value: number) => Number.isFinite(value) && value >= 0 })
  hourlyRate?: number;
  @Prop({ type: Number, validate: (value: number) => Number.isFinite(value) && value > 0 })
  gasDailyAverage?: number;
  @Prop({ type: Number, validate: (value: number) => Number.isFinite(value) && value > 0 })
  electricityDailyAverage?: number;
}
export const CostSettingsSchema = SchemaFactory.createForClass(CostSettings);
