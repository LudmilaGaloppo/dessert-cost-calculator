import { Module } from '@nestjs/common';
import { SuppliesModule } from './supplies/supplies.module.js';
import { RecipesModule } from './recipes/recipes.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { PackagingModule } from './packaging/packaging.module.js';
import { StickersModule } from './stickers/stickers.module.js';

/** Reúne las funcionalidades para reutilizar las mismas rutas y servicios en pruebas. */
@Module({ imports: [SuppliesModule, RecipesModule, SettingsModule, PackagingModule, StickersModule] })
export class FeaturesModule {}
