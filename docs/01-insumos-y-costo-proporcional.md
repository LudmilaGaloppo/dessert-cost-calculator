# Insumos y costo proporcional

El costo de un ingrediente depende de la cantidad utilizada y del precio de compra del insumo. La referencia de compra puede reutilizarse en distintas recetas.

## Datos necesarios

| Dato | Descripción |
|---|---|
| Precio de compra | Importe total pagado por la cantidad registrada |
| Cantidad comprada | Cantidad a la que corresponde ese precio |
| Unidad de compra | Unidad de la cantidad comprada |
| Cantidad utilizada | Cantidad necesaria para una receta |
| Unidad de uso | Unidad de la cantidad utilizada |

Las cantidades se convierten a una misma unidad antes de aplicar la proporción.

```text
Costo proporcional = precio de compra × cantidad utilizada ÷ cantidad comprada
```

## Ejemplo

Una compra de 2,5 kg de harina por $6.000 equivale a 2.500 g con un costo de $2,40 por gramo.

| Cantidad utilizada | Cálculo | Costo |
|---|---|---:|
| 375 g | 6.000 × 375 ÷ 2.500 | $900 |
| 150 g | 6.000 × 150 ÷ 2.500 | $360 |

Los importes son ejemplos de cálculo, no precios de referencia del mercado.

## Unidades compatibles

- Masa: `g` y `kg`.
- Volumen: `ml` y `l`.
- Cantidades discretas: `unit`.

La conversión entre masa y volumen requiere conocer la densidad del ingrediente y no forma parte del cálculo actual. Tampoco se asume un peso universal por pieza.

## Validaciones

- La cantidad comprada debe ser finita y mayor que cero.
- El precio y la cantidad utilizada deben ser finitos y no negativos.
- Las unidades deben existir y pertenecer a la misma dimensión.
- Un campo vacío no se convierte automáticamente en cero.

El cálculo proporcional admite una cantidad utilizada igual a cero. El editor de recetas exige cantidades positivas para sus ingredientes.

## Receta y existencias

Guardar una receta describe su composición; no registra una elaboración ni descuenta stock. El catálogo conserva una referencia de compra para calcular costos, por lo que una receta puede utilizar una cantidad mayor que la compra registrada.

El control de existencias requeriría compras y elaboraciones como movimientos independientes. Esa funcionalidad está fuera del [alcance actual](alcance.md).

## Implementación

La regla se implementa en [costs.ts](../frontend/src/domain/costs.ts) y se verifica en [costs.test.ts](../frontend/tests/costs.test.ts). El [modelo de datos](02-modelo-de-datos.md) separa la compra del insumo de su uso en una receta.
