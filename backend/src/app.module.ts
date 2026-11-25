import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FeaturesModule } from './features.module.js';

/** Configura MongoDB después de leer el entorno y conecta los módulos de la aplicación. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI') ?? 'mongodb://127.0.0.1:27017/dessert_cost_calculator',
        serverSelectionTimeoutMS: 5000, retryAttempts: 1,
      }),
    }),
    FeaturesModule,
  ],
})
export class AppModule {}
