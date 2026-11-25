import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Packaging as PackagingData } from '@dessert-cost/shared';
import { Packaging } from './packaging.entity.js';
import type { CreatePackagingDto } from './dto/create-packaging.dto.js';
import type { UpdatePackagingDto } from './dto/update-packaging.dto.js';

/** Devuelve los datos públicos del envase traduciendo _id a id. */
function toPackaging(document: Packaging & { _id: { toString(): string } }): PackagingData {
  return { id: document._id.toString(), name: document.name, kind: document.kind, purchaseQuantity: document.purchaseQuantity, purchasePrice: document.purchasePrice, capacity: document.capacity, capacityUnit: document.capacityUnit, stickersPerPackage: document.stickersPerPackage };
}

/** Administra envases y aplica las reglas de sus presentaciones. */
@Injectable()
export class PackagingService {
  /** Recibe el modelo de envases registrado por Nest y Mongoose. */
  constructor(@InjectModel(Packaging.name) private readonly packaging: Model<Packaging>) {}
  /** Recupera los envases ordenados por nombre. */
  async findAll(): Promise<PackagingData[]> { return (await this.packaging.find().sort({ name: 1, _id: 1 }).lean().exec()).map(toPackaging); }
  /** Verifica la relación entre tipo de presentación y capacidad. */
  private validateCapacity(input: CreatePackagingDto): void {
    if (input.kind === 'individual' && input.capacity !== 1) throw new BadRequestException('Un envase individual debe contener una unidad.');
  }
  /** Guarda un envase nuevo después de comprobar su capacidad. */
  async create(input: CreatePackagingDto): Promise<PackagingData> { this.validateCapacity(input); return toPackaging(await this.packaging.create(input)); }
  /** Actualiza los datos de un envase existente. */
  async update(id: string, input: UpdatePackagingDto): Promise<PackagingData> {
    this.validateCapacity(input);
    const document = await this.packaging.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
    if (!document) throw new NotFoundException('El envase no existe.');
    return toPackaging(document);
  }
  /** Elimina el envase indicado o informa que ya no existe. */
  async remove(id: string): Promise<void> { if (!await this.packaging.findByIdAndDelete(id).lean().exec()) throw new NotFoundException('El envase no existe.'); }
}
