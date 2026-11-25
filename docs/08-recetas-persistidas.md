# Gestión y persistencia de recetas

La sección Recetas permite crear, consultar, editar y eliminar recetas con sus ingredientes, rendimiento y tiempos de elaboración.

## Datos persistidos

- Nombre.
- Rendimiento de la tanda: `yieldQuantity` y `yieldUnit`.
- Horas de trabajo: `workingHours`.
- Minutos de horno a gas: `gasOvenMinutes`.
- Minutos de batidora: `electricMixerMinutes`.
- Ingredientes con `supplyId`, `quantity` y `unit`.

Los tiempos pueden quedar pendientes mediante `null`. La receta no guarda los precios ni los nombres de los insumos como copias: utiliza sus identificadores para consultar el catálogo.

## Formulario dinámico

React Hook Form administra los campos y `useFieldArray` mantiene las filas de ingredientes. Cada fila tiene un identificador interno estable, distinto del `supplyId` persistido.

El editor permite buscar insumos, indicar cantidades y unidades, y agregar o quitar ingredientes. La API exige entre uno y cien ingredientes por receta.

## Lectura, edición y cálculo

El buscador está arriba del editor. **Nueva receta** prepara otro registro; al seleccionar una receta guardada, sus datos se presentan como texto en modo lectura.

**Editar** habilita los campos y las acciones **Guardar cambios**, **Cancelar** y **Eliminar receta**. Cancelar restaura los valores guardados; una actualización conserva el mismo identificador. Las acciones que descartan modificaciones requieren confirmación.

**Calcular costo de la tanda** está disponible en lectura y edición. El cálculo consulta los insumos vigentes y utiliza la configuración de costos cargada en la pantalla. Calcular no guarda modificaciones de la receta.

## Validación de referencias

Los DTOs comprueban campos, cantidades, unidades e ingredientes anidados. `RecipesService` consulta `SuppliesService` para verificar que cada insumo exista y que la unidad de uso sea compatible con la compra.

El nombre y el precio del insumo se recuperan del catálogo al calcular. Una modificación del catálogo se refleja al volver a ejecutar el cálculo, sin actualizar cada receta manualmente.

## Rutas

| Método y ruta | Operación |
|---|---|
| `GET /api/recipes` | Listar recetas |
| `POST /api/recipes` | Crear una receta |
| `PUT /api/recipes/:id` | Actualizar la receta completa |
| `DELETE /api/recipes/:id` | Eliminar una receta |

Crear devuelve HTTP 201; eliminar, HTTP 204. Un ID inválido devuelve 400 y una receta inexistente devuelve 404.

Eliminar una receta conserva sus insumos. La aplicación no persiste cotizaciones históricas que deban proteger esa referencia.

## Código relacionado

- [RecipeEditor.tsx](../frontend/src/pages/RecipeEditor.tsx).
- [Adaptación del formulario](../frontend/src/utils/recipe-form.ts).
- [RecipesController](../backend/src/recipes/recipes.controller.ts).
- [RecipesService](../backend/src/recipes/recipes.service.ts).
- [Recipe y su esquema](../backend/src/recipes/recipe.entity.ts).

El [trabajo](09-mano-de-obra.md), la [energía](11-energia-estimada.md) y el [packaging](10-packaging-y-cotizacion.md) completan el cálculo de producción y venta.
