# Precio de venta y ganancia estimada

Después de calcular una venta en Packaging, la aplicación permite sugerir un precio por porcentaje o evaluar un precio manual. Los importes corresponden a toda la cantidad elegida, incluidos sus envases y stickers.

## Precio sugerido

La base del porcentaje se elige explícitamente. Con un costo total de $10.000, incluida la remuneración de trabajo:

| Base | Fórmula | Precio al 50% | Excedente |
|---|---|---:|---:|
| Recargo sobre costo | costo × (1 + porcentaje / 100) | $15.000 | $5.000 |
| Margen sobre venta | costo ÷ (1 − porcentaje / 100) | $20.000 | $10.000 |

El recargo puede superar el 100%. El margen para sugerir un precio debe ser menor al 100%, ya que la fórmula divide por cero al alcanzar ese valor. Ambos admiten 0% y el formulario no establece un porcentaje predeterminado.

## Ganancia total, remuneración y excedente

El modelo contempla trabajo propio. La ganancia total representa lo que queda para quien elabora después de ingredientes, energía y packaging. Incluye la remuneración prevista por su trabajo.

```text
Remuneración cotizada = horas × tarifa ÷ rendimiento × unidades vendidas
Gastos contemplados = costo cotizado − remuneración cotizada
Ganancia total = precio de venta − gastos contemplados
Excedente = precio de venta − costo cotizado
Recargo sobre costo (%) = excedente ÷ costo cotizado × 100
Margen después de remuneración (%) = excedente ÷ precio de venta × 100
```

Ejemplo ilustrativo: una venta de $3.500 con gastos de $1.200 deja una ganancia total de $2.300. Si contempla una remuneración de $1.000, el excedente es $1.300.

Al mismo precio manual y con los mismos gastos, cambiar la tarifa modifica la distribución entre remuneración y excedente. El precio sugerido sí contempla la tarifa para ayudar a cubrirla.

Si el excedente es negativo pero la ganancia total es positiva, el precio cubre los gastos y solo parte de la remuneración prevista. Si la ganancia total es negativa, tampoco alcanza para cubrir los gastos. La interfaz presenta ambos casos.

## Simulación manual

El precio manual se evalúa de manera independiente de la sugerencia por porcentaje. Editar uno de los formularios retira su resultado anterior. Cambiar receta, presentación o cantidad invalida la cotización y las simulaciones asociadas.

Los campos aceptan coma o punto decimal, sin separadores de miles. El cálculo conserva su precisión y la interfaz muestra dos decimales. No se ajustan precios a múltiplos de $100, $500 u otros valores.

La simulación corresponde a venta directa, sin comisiones. Los conceptos todavía no modelados, como impuestos o gastos generales adicionales, no se incorporan automáticamente.

## Ceros y datos pendientes

- Con costo cero, el recargo no está definido.
- Con precio cero, el margen no está definido.
- Si falta valorar el trabajo, remuneración, excedente y porcentajes quedan pendientes.
- Si falta algún costo relevante, los resultados se identifican como provisorios y se indican las entradas pendientes.

Las simulaciones se mantienen en pantalla; no se guardan como presupuestos históricos.

## Implementación y pruebas

- [costs.ts](../frontend/src/domain/costs.ts): `calculateSuggestedSalePrice`, `calculateSaleProfit` y distribución de costos de cotización.
- [Contratos compartidos](../shared/src/costs.d.ts): `PricingBasis`, `SaleQuoteCost` y `SaleProfit`.
- [SalePriceCalculator.tsx](../frontend/src/components/SalePriceCalculator.tsx): formularios y presentación del desglose.
- [sale-price.test.ts](../frontend/tests/sale-price.test.ts): recargo, margen, pérdidas, ceros, precisión y remuneración.
- [Pruebas de interfaz](../frontend/e2e/app.spec.ts): recorrido de venta y presentación de resultados.

```sh
npm test
npm run test:ui --workspace @dessert-cost/frontend
```
