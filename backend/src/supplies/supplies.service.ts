import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { Supply as SupplyData } from '@dessert-cost/shared';
import { Supply } from './supply.entity.js';
import { Recipe } from '../recipes/recipe.entity.js';
import type { CreateSupplyDto } from './dto/create-supply.dto.js';
import type { UpdateSupplyDto } from './dto/update-supply.dto.js';

/** Traduce el documento de MongoDB al contrato público, sin campos internos. */
function toSupply(document: Supply & { _id: { toString(): string } }): SupplyData {
  return { id: document._id.toString(), name: document.name, purchaseQuantity: document.purchaseQuantity, purchaseUnit: document.purchaseUnit, purchasePrice: document.purchasePrice };
}

/** Administra los insumos y protege los que están referenciados por recetas. */
@Injectable()
export class SuppliesService {
  /** Recibe los modelos registrados por el módulo de insumos. */
  constructor(@InjectModel(Supply.name) private readonly supplies: Model<Supply>, @InjectModel(Recipe.name) private readonly recipes: Model<Recipe>) {}

  /** Recupera el catálogo ordenado por nombre e identificador. */
  async findAll(): Promise<SupplyData[]> { return (await this.supplies.find().sort({ name: 1, _id: 1 }).lean().exec()).map(toSupply); }

  /** Guarda una compra nueva y devuelve el identificador generado por MongoDB. */
  async create(input: CreateSupplyDto): Promise<SupplyData> { return toSupply(await this.supplies.create(input)); }

  /** Actualiza la compra indicada o informa que ya no existe. */
  async update(id: string, input: UpdateSupplyDto): Promise<SupplyData> {
    const document = await this.supplies.findByIdAndUpdate(id, { $set: input }, { returnDocument: 'after', runValidators: true }).lean().exec();
    if (!document) throw new NotFoundException('El insumo no existe.');
    return toSupply(document);
  }

  /** Bloquea la eliminación de un insumo utilizado por alguna receta. */
  async remove(id: string): Promise<void> {
    const references = await this.recipes.find({ 'ingredients.supplyId': id }).lean().exec();
    if (references.length) throw new ConflictException(`No podés eliminar este insumo porque se usa en: ${references.map((recipe) => recipe.name).join(', ')}.`);
    if (!await this.supplies.findByIdAndDelete(id).lean().exec()) throw new NotFoundException('El insumo no existe.');
  }
}
