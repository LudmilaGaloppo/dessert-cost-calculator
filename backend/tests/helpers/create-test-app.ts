import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { FeaturesModule } from '../../src/features.module.js';
import { configureApp } from '../../src/common/configure-app.js';

/** Inicia los módulos reales sustituyendo únicamente MongoDB por modelos de prueba. */
export async function createHttpTestApp(models: Record<string, unknown>): Promise<NestExpressApplication> {
  const builder = Test.createTestingModule({ imports: [FeaturesModule] });
  for (const [name, model] of Object.entries(models)) builder.overrideProvider(getModelToken(name)).useValue(model);
  const module = await builder.compile();
  const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  return app;
}

/** Inicia los mismos módulos sobre una base temporal explícita para verificar persistencia real. */
export async function createDatabaseTestApp(uri: string, dbName: string): Promise<NestExpressApplication> {
  const module = await Test.createTestingModule({ imports: [MongooseModule.forRoot(uri, { dbName, serverSelectionTimeoutMS: 5000, retryAttempts: 1 }), FeaturesModule] }).compile();
  const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
  return app;
}
