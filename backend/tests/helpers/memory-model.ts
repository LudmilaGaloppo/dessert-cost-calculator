/** Simula la interfaz de consulta de Mongoose para probar servicios y controllers reales. */
function query<T>(read: () => T) {
  return {
    /** Conserva el encadenamiento usado por las consultas del servicio. */
    sort(_fields: unknown) { return this; },
    /** Conserva el encadenamiento de las consultas sin documentos hidratados. */
    lean() { return this; },
    /** Devuelve una copia para que cada lectura se comporte como una consulta independiente. */
    async exec(): Promise<T> { return structuredClone(read()); },
  };
}

/** Guarda documentos en memoria y reproduce solo las operaciones MongoDB usadas por la API. */
export function createMemoryModel<T extends object>(firstId: string) {
  type Stored = T & { _id: string };
  const documents: Stored[] = [];
  let sequence = BigInt('0x' + firstId);

  /** Filtra por campos directos y por la referencia de insumo embebida en una receta. */
  function matches(document: Stored, filter: Record<string, unknown>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (key === 'ingredients.supplyId') return (document as unknown as { ingredients: { supplyId: string }[] }).ingredients.some((item) => item.supplyId === value);
      return (document as Record<string, unknown>)[key] === value;
    });
  }

  return {
    documents,
    /** Simula una lista de documentos que cumple el filtro recibido. */
    find(filter: Record<string, unknown> = {}) { return query(() => documents.filter((document) => matches(document, filter))); },
    /** Simula la lectura de una configuración única. */
    findOne(filter: Record<string, unknown> = {}) { return query(() => documents.find((document) => matches(document, filter)) ?? null); },
    /** Inserta un documento con un ID determinista para verificar el contrato HTTP. */
    async create(input: T): Promise<Stored> {
      const document = { ...structuredClone(input), _id: (sequence++).toString(16).padStart(24, '0') };
      documents.push(document);
      return structuredClone(document);
    },
    /** Reemplaza los campos indicados si el documento existe. */
    findByIdAndUpdate(id: string, update: { $set: Partial<T> }) {
      return query(() => {
        const index = documents.findIndex((document) => document._id === id);
        if (index < 0) return null;
        documents[index] = { ...documents[index], ...structuredClone(update.$set) };
        return documents[index];
      });
    },
    /** Elimina un documento y lo devuelve, como findByIdAndDelete. */
    findByIdAndDelete(id: string) {
      return query(() => { const index = documents.findIndex((document) => document._id === id); return index < 0 ? null : documents.splice(index, 1)[0]; });
    },
    /** Simula el upsert de configuración sin perder los otros campos ya guardados. */
    findOneAndUpdate(filter: Record<string, unknown>, update: { $set: Partial<T> }) {
      return query(() => {
        const index = documents.findIndex((document) => matches(document, filter));
        if (index < 0) {
          const document = { ...filter, ...structuredClone(update.$set), _id: (sequence++).toString(16).padStart(24, '0') } as Stored;
          documents.push(document); return document;
        }
        documents[index] = { ...documents[index], ...structuredClone(update.$set) }; return documents[index];
      });
    },
  };
}
