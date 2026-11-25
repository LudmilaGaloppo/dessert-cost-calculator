# Alcance del producto

DessertCostCalculator permite gestionar referencias de compra, calcular costos de recetas y evaluar precios para distintas presentaciones de venta. La versión actual se ejecuta localmente y persiste sus catálogos y configuración en MongoDB.

## Recorrido principal

Registrar insumos → crear una receta → definir rendimiento y tiempos → configurar costos generales → elegir presentación y cantidad → comparar precios y ganancia estimada.

## Funcionalidades disponibles

| Área | Alcance |
|---|---|
| Insumos | Crear, consultar, editar y eliminar compras de referencia con cantidad, unidad y precio |
| Recetas | Ingredientes relacionados con el catálogo, rendimiento por tanda y tiempos de trabajo y artefactos |
| Producción | Desglose de ingredientes, remuneración de trabajo propio y energía estimada |
| Packaging | Envases individuales o cajas con capacidad y stickers configurables |
| Venta | Cotización por cantidad de unidades y presentación elegida |
| Precios | Sugerencia por recargo o margen y evaluación de un precio manual |
| Persistencia | Catálogos, recetas y configuración general |
| Interfaz | Lectura y edición consistentes, búsqueda con teclado y protección de cambios pendientes |

## Reglas del cálculo

- Separar cantidad y unidad en los datos de compra y uso.
- Convertir únicamente unidades de una misma dimensión.
- Utilizar el rendimiento vendible para distribuir el costo de una tanda.
- Rechazar cantidades compradas o rendimientos iguales a cero.
- Distinguir ausencia de información y cero explícito.
- Mostrar resultados parciales si faltan entradas relevantes.
- Calcular la venta con los precios vigentes de catálogo y configuración.
- Incluir la remuneración por trabajo propio en la ganancia total y separar el excedente.
- Mantener la precisión durante el cálculo y presentar moneda en pesos argentinos con dos decimales.

La descripción de cada fórmula está en [costo proporcional](01-insumos-y-costo-proporcional.md), [producción](09-mano-de-obra.md), [energía](11-energia-estimada.md), [packaging](10-packaging-y-cotizacion.md) y [precio de venta](12-precio-de-venta.md).

## Límites actuales

La cotización con packaging requiere rendimiento expresado en unidades. Una venta en caja utiliza una sola caja y rechaza cantidades superiores a su capacidad. Las simulaciones no se guardan como presupuestos históricos.

El cálculo de energía distribuye promedios diarios y no mide consumos técnicos. La simulación de precios corresponde a venta directa y no incorpora automáticamente comisiones, impuestos ni otros gastos no modelados.

El catálogo no administra existencias ni registra consumos por elaboración. Tampoco mantiene un historial de compras y precios. La aplicación no incluye autenticación ni separación de datos por cuenta en su alcance local actual.

## Evolución

Las ampliaciones previstas incluyen presupuestos guardados, respaldo e historial de precios, presentaciones más flexibles y mejoras del modelo de costos. Se describen como trabajo futuro en el [roadmap](roadmap.md), no como funcionalidades disponibles.
