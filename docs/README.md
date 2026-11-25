# Documentación

Referencia técnica de DessertCostCalculator: reglas de cálculo, modelo de datos, arquitectura y recorridos de uso.

## Producto

- [Alcance y límites actuales](alcance.md).
- [Roadmap](roadmap.md).

## Dominio y cálculos

| Documento | Contenido |
|---|---|
| [Insumos y costo proporcional](01-insumos-y-costo-proporcional.md) | Referencias de compra, unidades y cálculo proporcional |
| [Modelo de datos](02-modelo-de-datos.md) | Insumos, recetas, configuración, envases y resultados |
| [Función de costo de un ingrediente](03-primera-funcion.md) | Contrato, validación y uso de la función de dominio |
| [Cálculo de una receta](04-calculo-de-receta.md) | Relación con el catálogo, desglose y subtotal |
| [Trabajo propio y producción](09-mano-de-obra.md) | Horas, tarifa, datos pendientes y remuneración |
| [Energía estimada](11-energia-estimada.md) | Promedios diarios y prorrateo por tiempo de uso |
| [Packaging y cotización](10-packaging-y-cotizacion.md) | Envases, stickers, capacidad y cantidad vendida |
| [Precio y ganancia](12-precio-de-venta.md) | Recargo, margen, precio manual y excedente |

## Implementación

- [Interfaz y formularios](05-primera-pantalla.md).
- [Catálogo, API y persistencia](06-mongodb-y-formularios.md).
- [Arquitectura y estructura del proyecto](07-estructura-del-proyecto.md).
- [Gestión de recetas](08-recetas-persistidas.md).

## Desarrollo

- [Instalación, ejecución y verificaciones](../README.md#ejecución-local).
- [Flujo con Git y GitHub Desktop](git-y-github-desktop.md).

Los importes incluidos en los ejemplos ilustran las fórmulas y no representan datos precargados ni precios recomendados.
