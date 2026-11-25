import { IsMongoId } from 'class-validator';

/** Valida identificadores de MongoDB recibidos en la ruta. */
export class IdParamDto {
  @IsMongoId({ message: 'El identificador no es válido.' })
  id!: string;
}
