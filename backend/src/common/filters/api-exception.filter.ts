import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

/** Conserva respuestas de error JSON y evita exponer detalles internos de MongoDB. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /** Traduce errores HTTP y del parser; las fallas internas conservan el estado 503 conocido. */
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.SERVICE_UNAVAILABLE;
    let message = 'No se pudo acceder a los datos. Verificá que MongoDB esté disponible.';
    const type = error && typeof error === 'object' && 'type' in error ? error.type : '';
    if (type === 'entity.parse.failed') { status = 400; message = 'El JSON enviado no es válido.'; }
    else if (type === 'entity.too.large') { status = 413; message = 'La solicitud es demasiado grande.'; }
    else if (error instanceof HttpException) {
      status = error.getStatus();
      const body = error.getResponse();
      message = typeof body === 'string' ? body : (body as { message?: string }).message ?? error.message;
      if (status === 404 && message.startsWith('Cannot ')) message = 'Ruta no encontrada.';
    }
    response.status(status).json({ message });
  }
}
