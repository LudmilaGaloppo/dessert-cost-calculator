import { Body, Controller, Get, Put } from '@nestjs/common';
import { StickersService } from './stickers.service.js';
import { UpdateStickerSettingsDto } from './dto/update-sticker-settings.dto.js';

/** Separa stickers por funcionalidad conservando su ruta pública de configuración. */
@Controller('settings/stickers')
export class StickersController {
  /** Recibe el servicio de stickers registrado por el módulo. */
  constructor(private readonly stickers: StickersService) {}
  /** Recupera la compra de stickers. */
  @Get()
  async find() { return { stickers: await this.stickers.find() }; }
  /** Guarda la compra compartida de stickers. */
  @Put()
  async update(@Body() input: UpdateStickerSettingsDto) { return { stickers: await this.stickers.update(input) }; }
}
