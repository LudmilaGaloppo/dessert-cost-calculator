# Modelo de datos

Los contratos compartidos se definen en [shared/src/costs.d.ts](../shared/src/costs.d.ts). Separan los datos persistidos, las entradas de formulario y los resultados calculados.

## Insumos

`SupplyInput` contiene los datos de compra. `Supply` agrega el identificador asignado por la API.

| Campo | Significado |
|---|---|
| `id` | Identificador del insumo guardado |
| `name` | Nombre visible en el catálogo |
| `purchaseQuantity` | Cantidad correspondiente al precio de compra |
| `purchaseUnit` | Unidad de esa cantidad: `g`, `kg`, `ml`, `l` o `unit` |
| `purchasePrice` | Precio total de compra |

La cantidad y la unidad se almacenan por separado. Los importes se guardan como números y se presentan en pesos argentinos en la interfaz.

## Recetas e ingredientes

`RecipeInput` define el contenido editable de una receta; `Recipe` incorpora su `id`.

| Campo | Significado |
|---|---|
| `name` | Nombre de la receta |
| `yieldQuantity` | Cantidad vendible producida por tanda |
| `yieldUnit` | Unidad del rendimiento |
| `workingHours` | Horas de trabajo atribuibles a la tanda, o `null` |
| `gasOvenMinutes` | Minutos de horno a gas, o `null` |
| `electricMixerMinutes` | Minutos de batidora eléctrica, o `null` |
| `ingredients` | Lista de ingredientes utilizados |

Cada `RecipeIngredient` contiene `supplyId`, `quantity` y `unit`. El precio y el nombre se consultan en el catálogo; no se duplican dentro de la receta. Al recalcular, se utilizan los precios vigentes.

`null` representa un dato pendiente. Un cero explícito indica que ese tiempo no se utiliza y se trata como un valor informado.

## Configuración de costos

`CostSettings` reúne valores generales reutilizados por todas las recetas:

- `hourlyRate`: tarifa por hora de trabajo.
- `gasDailyAverage`: promedio diario para estimar gas.
- `electricityDailyAverage`: promedio diario para estimar electricidad.

Los valores sin configurar se devuelven como `null`. La tarifa admite cero; los promedios diarios configurados deben ser positivos.

## Envases y stickers

`PackagingInput` define nombre, tipo, compra, capacidad y stickers por envase. `Packaging` agrega su identificador.

| Campo | Significado |
|---|---|
| `kind` | Presentación `individual` o `box` |
| `purchaseQuantity` / `purchasePrice` | Datos de compra del envase |
| `capacity` / `capacityUnit` | Capacidad máxima, expresada actualmente en `unit` |
| `stickersPerPackage` | Cantidad de stickers que utiliza cada envase |

`StickerSettings` conserva una compra compartida con `name`, `purchaseQuantity` y `purchasePrice`. El costo proporcional del sticker se calcula al cotizar.

## Resultados calculados

| Contrato | Contenido |
|---|---|
| `RecipeIngredientsCost` | Desglose y subtotal de ingredientes |
| `ProductionCost` | Ingredientes, remuneración, energía y entradas pendientes |
| `SaleQuoteCost` | Productos, envases, stickers y remuneración atribuible a la venta |
| `SaleProfit` | Precio de venta, ganancia total, remuneración, excedente y porcentajes |

Estos resultados se calculan a partir de los datos guardados. Las simulaciones de venta no se persisten como presupuestos históricos.

## Rendimiento y presentación

El rendimiento describe una tanda. La presentación define cuántas unidades se venden y qué envase necesitan.

```text
Costo de los productos = costo de la tanda ÷ rendimiento × unidades vendidas
Costo cotizado = costo de los productos + packaging
```

La cotización actual exige que el rendimiento esté expresado en unidades. No agrega cajas automáticamente cuando se supera la capacidad del envase.

## Validación y almacenamiento

Los tipos de TypeScript describen los contratos durante el desarrollo. Los DTOs de NestJS validan las peticiones en ejecución y los esquemas de Mongoose definen los documentos almacenados.

La API transforma `_id` de MongoDB a `id: string` y devuelve únicamente los campos del contrato público. El recorrido completo se describe en [estructura del proyecto](07-estructura-del-proyecto.md).
