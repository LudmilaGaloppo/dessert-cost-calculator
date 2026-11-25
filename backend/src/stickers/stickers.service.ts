import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { StickerSettings as StickerSettingsData } from '@dessert-cost/shared';
import { StickerSettings } from './sticker-settings.entity.js';
import type { UpdateStickerSettingsDto } from './dto/update-sticker-settings.dto.js';

/** Administra la compra única de stickers compartida por las presentaciones. */
@Injectable()
export class StickersService {
  /** Recibe el modelo de compra de stickers. */
  constructor(@InjectModel(StickerSettings.name) private readonly stickers: Model<StickerSettings>) {}
  /** Devuelve la compra conocida o conserva todos sus campos pendientes. */
  async find(): Promise<StickerSettingsData> {
    const document = await this.stickers.findOne().lean().exec();
    return document ? { name: document.name, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice } : { name: null, purchaseQuantity: null, purchasePrice: null };
  }
  /** Actualiza la compra existente o crea la primera sin cambiar su esquema de almacenamiento. */
  async update(input: UpdateStickerSettingsDto): Promise<StickerSettingsData> {
    const previous = await this.stickers.findOne().lean().exec();
    const document = previous
      ? await this.stickers.findByIdAndUpdate(previous._id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec()
      : await this.stickers.create(input);
    if (!document) throw new Error('No se pudo recuperar la configuración de stickers actualizada.');
    return { name: document.name, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice };
  }
}
