import { json, type Request, type Response, type NextFunction } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExceptionFilter } from './filters/api-exception.filter.js';
import { createValidationPipe } from './validation.js';

/** Aplica el contrato HTTP compartido por la aplicación real y sus pruebas. */
export function configureApp(app: NestExpressApplication): void {
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');
  app.use(json({ limit: '16kb' }));
  /** Rechaza escrituras sin JSON antes de que lleguen al controller. */
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && !request.is('application/json')) {
      response.status(415).json({ message: 'Enviá JSON.' });
      return;
    }
    next();
  });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new ApiExceptionFilter());
}
