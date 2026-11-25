import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './common/configure-app.js';

/** Inicia Nest, conecta MongoDB y publica la API únicamente en esta computadora. */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false, abortOnError: false });
  try {
    configureApp(app);
    const port = Number(app.get(ConfigService).get('API_PORT') ?? 3001);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto inválido.');
    app.enableShutdownHooks();
    await app.listen(port, '127.0.0.1');
    console.log(`API local disponible en http://127.0.0.1:${port}`);
  } catch (error) { await app.close(); throw error; }
}

/** Informa un fallo de arranque sin imprimir la URI ni detalles internos de la conexión. */
function reportStartupError(): void {
  console.error('No se pudo iniciar la API. Revisá MongoDB local, MONGODB_URI y API_PORT.');
  process.exitCode = 1;
}
void bootstrap().catch(reportStartupError);
