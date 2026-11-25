# Cálculo de ingredientes de una receta

El cálculo recorre los ingredientes de una receta, consulta sus referencias de compra y devuelve un desglose con el subtotal. Este subtotal incluye únicamente ingredientes; trabajo y energía se agregan en el cálculo de producción.

## Archivos relacionados

- [Contratos de datos](../shared/src/costs.d.ts).
- [Funciones de costos](../frontend/src/domain/costs.ts).
- [Ejemplo ejecutable](../frontend/examples/recipe-cost.ts).
- [Pruebas del dominio](../frontend/tests/costs.test.ts).

## Funciones

| Función | Responsabilidad |
|---|---|
| `convertQuantity` | Convierte cantidades entre unidades compatibles |
| `calculateIngredientCost` | Calcula el costo proporcional de un uso |
| `calculateRecipeIngredients` | Relaciona ingredientes y catálogo y obtiene el desglose |

`calculateRecipeIngredients` recibe un objeto con `ingredients` y una lista de insumos. Devuelve `items` e `ingredientsSubtotal`. No necesita el nombre ni el identificador de la receta para realizar el cálculo.

## Relación entre compra y uso

- `supply` representa el insumo del catálogo con sus datos de compra.
- `ingredient` representa su uso dentro de una receta.
- `ingredient.supplyId` debe coincidir con `supply.id`.

El precio se consulta en el catálogo; no se copia al ingrediente. Por eso, al modificar un precio y recalcular, se actualizan los costos de las recetas que utilizan ese insumo.

La función construye un `Map<string, Supply>` para buscar cada referencia por identificador y detectar IDs duplicados. Las unidades se definen mediante `Record<Unit, UnitDefinition>`, con una dimensión y un factor de conversión por unidad.

## Reglas de validación

- Rechazar referencias inexistentes e identificadores duplicados.
- Admitir solamente `g`, `kg`, `ml`, `l` y `unit`.
- Convertir masa con masa y volumen con volumen.
- Rechazar números no finitos, cantidades negativas y compras iguales a cero.
- No convertir textos numéricos automáticamente.
- No limitar el uso a la cantidad comprada: el cálculo utiliza precios de referencia y no administra stock.

Los tipos `readonly` impiden modificar arrays mediante esas referencias durante la comprobación de TypeScript. La implementación devuelve resultados nuevos y no modifica la receta ni el catálogo.

## Ejemplo

| Insumo | Compra de referencia | Cantidad utilizada | Costo |
|---|---|---|---:|
| Harina | 2,5 kg por $6.000 | 375 g | $900 |
| Azúcar | 1 kg por $2.000 | 150 g | $300 |
| **Subtotal** | | | **$1.200** |

Son datos ilustrativos. El desglose se conserva como un valor calculado: cambiar el catálogo no altera un resultado anterior hasta volver a ejecutar el cálculo.

## Precisión

Se utilizan números de JavaScript y se evita redondear cada ingrediente antes de sumar. La interfaz presenta los importes con dos decimales, sin aplicar redondeos comerciales a múltiplos.

## Ejecución y pruebas

Desde la raíz del proyecto, después de instalar las dependencias:

```sh
npm run example
npm test
npm run typecheck
```

El ejemplo y las pruebas se compilan para Node en `frontend/.node-build/`. Los archivos fuente se mantienen en TypeScript; los imports locales con extensión `.js` se resuelven contra esos archivos durante la compilación con `NodeNext`.

El [costo de producción](09-mano-de-obra.md), la [energía](11-energia-estimada.md) y el [packaging](10-packaging-y-cotizacion.md) se calculan sobre este subtotal.
