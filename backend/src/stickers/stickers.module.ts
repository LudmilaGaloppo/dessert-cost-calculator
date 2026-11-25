import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StickerSettings, StickerSettingsSchema } from './sticker-settings.entity.js';
import { StickersController } from './stickers.controller.js';
import { StickersService } from './stickers.service.js';

/** Agrupa modelo, servicio y rutas de la compra compartida de stickers. */
@Module({ imports: [MongooseModule.forFeature([{ name: StickerSettings.name, schema: StickerSettingsSchema }])], controllers: [StickersController], providers: [StickersService] })
export class StickersModule {}
