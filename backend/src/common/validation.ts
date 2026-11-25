import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { TransformFnParams } from 'class-transformer';
import type { ValidationError } from 'class-validator';

const fieldLabels: Record<string, string> = {
  name: 'El nombre', purchaseQuantity: 'La cantidad comprada', purchasePrice: 'El precio de compra', purchaseUnit: 'La unidad de compra',
  yieldQuantity: 'El rendimiento', yieldUnit: 'La unidad de rendimiento', workingHours: 'Las horas de trabajo',
  gasOvenMinutes: 'Los minutos de horno', electricMixerMinutes: 'Los minutos de batidora',
  ingredients: 'La lista de ingredientes', supplyId: 'El identificador del insumo', quantity: 'La cantidad utilizada', unit: 'La unidad de uso',
  kind: 'El tipo de envase', capacity: 'La capacidad', capacityUnit: 'La unidad de capacidad', stickersPerPackage: 'Los stickers por envase',
  hourlyRate: 'La tarifa por hora', gasDailyAverage: 'El promedio diario de gas', electricityDailyAverage: 'El promedio diario de electricidad', id: 'El identificador',
};

/** Recorta nombres de texto sin convertir números, objetos u otros tipos externos. */
export function trimText({ value }: TransformFnParams): unknown { return typeof value === 'string' ? value.trim() : value; }

/** Obtiene el primer mensaje de validación, incluidos los ingredientes anidados. */
function firstMessage(errors: ValidationError[]): string {
  for (const error of errors) {
    if (error.constraints) {
      const label = fieldLabels[error.property] ?? 'El dato enviado';
      const messages: Record<string, string> = {
        isString: `${label}: ingresá un texto.`, isNotEmpty: `${label}: completá este campo.`,
        maxLength: `${label}: superaste la longitud permitida.`, isNumber: `${label}: ingresá un número finito.`,
        isInt: `${label}: ingresá un número entero.`, isPositive: `${label}: debe ser mayor que cero.`,
        min: `${label}: no puede ser negativo.`, isIn: `${label}: elegí una opción válida.`,
        equals: `${label}: por ahora debe expresarse en unidades.`, isMongoId: `${label}: no es válido.`,
        isArray: `${label}: enviá una lista.`, arrayMinSize: 'La receta debe tener al menos un ingrediente.',
        arrayMaxSize: 'La receta admite hasta 100 ingredientes.', nestedValidation: 'Revisá los datos del ingrediente.',
      };
      const constraint = Object.keys(error.constraints)[0];
      return messages[constraint] ?? Object.values(error.constraints)[0];
    }
    if (error.children?.length) return firstMessage(error.children);
  }
  return 'Revisá los datos enviados.';
}

/** Valida DTOs y elimina campos ajenos sin convertir textos numéricos en números. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true, transform: true,
    transformOptions: { enableImplicitConversion: false },
    exceptionFactory: (errors) => new BadRequestException(firstMessage(errors)),
  });
}
