# Catálogo de insumos, API y persistencia

El catálogo conserva los datos de compra utilizados para calcular recetas. La interfaz accede a MongoDB a través de la API NestJS.

```text
Formulario → servicio HTTP → DTO y controller → service → modelo Mongoose → MongoDB
```

## Operaciones del catálogo

1. **Nuevo insumo** prepara un formulario vacío.
2. **Guardar insumo** persiste nombre, cantidad comprada, unidad y precio total.
3. El buscador permite cargar un registro en modo lectura.
4. **Editar** habilita sus campos; **Guardar cambios** conserva el identificador.
5. **Cancelar** recupera los valores guardados, con confirmación si hay modificaciones.
6. **Eliminar insumo** requiere confirmación y se bloquea si una receta lo utiliza.

La cantidad utilizada en el cálculo proporcional no forma parte de la compra guardada. Se puede calcular un costo sin convertir esa simulación en un movimiento de stock.

## Responsabilidades

| Archivo | Responsabilidad |
|---|---|
| [IngredientCalculator.tsx](../frontend/src/pages/IngredientCalculator.tsx) | Formulario, selección del catálogo y resultado |
| [services/supplies.ts](../frontend/src/services/supplies.ts) | Peticiones HTTP del frontend |
| [supplies.controller.ts](../backend/src/supplies/supplies.controller.ts) | Rutas y respuestas públicas |
| [create-supply.dto.ts](../backend/src/supplies/dto/create-supply.dto.ts) | Validación de los datos de compra |
| [supplies.service.ts](../backend/src/supplies/supplies.service.ts) | Reglas del catálogo y operaciones con MongoDB |
| [supply.entity.ts](../backend/src/supplies/supply.entity.ts) | Esquema de documentos de la colección `supplies` |
| [supplies.module.ts](../backend/src/supplies/supplies.module.ts) | Registro y conexión de las dependencias |

## Contrato HTTP

| Método y ruta | Resultado |
|---|---|
| `GET /api/supplies` | Lista `{ supplies: [...] }` |
| `POST /api/supplies` | Crea un insumo y devuelve `{ supply: ... }` con HTTP 201 |
| `PUT /api/supplies/:id` | Actualiza los datos completos y devuelve `{ supply: ... }` |
| `DELETE /api/supplies/:id` | Elimina un insumo sin uso y devuelve HTTP 204 |

Los datos inválidos reciben HTTP 400; un registro ausente, 404; una referencia que impide eliminar, 409. Los errores de acceso a datos se presentan como HTTP 503 sin detalles internos de la conexión.

## Validación

El frontend valida los campos para ofrecer mensajes inmediatos. La API vuelve a validarlos mediante DTOs, independientemente de la pantalla que origine la solicitud.

- Los nombres se recortan y deben tener contenido.
- La cantidad comprada debe ser positiva.
- El precio debe ser finito y no negativo.
- La unidad debe pertenecer al conjunto admitido.
- Los campos ajenos al DTO se descartan.
- Los textos numéricos no se convierten implícitamente en números.

El service comprueba las relaciones con otras colecciones antes de eliminar. El esquema Mongoose aplica las restricciones de persistencia.

## Identificadores y precios

MongoDB genera `_id`. La API lo convierte a `id: string` para mantener un contrato común con el frontend y omite campos internos de los documentos.

Los precios guardados representan la referencia vigente del catálogo. Actualizar un insumo permite recalcular las recetas relacionadas. La aplicación no conserva un historial de compras ni presupuestos con precios anteriores.

## Configuración local

[backend/.env.example](../backend/.env.example) documenta `MONGODB_URI` y `API_PORT`. La configuración de conexión pertenece al backend y se carga mediante `ConfigModule`.

El navegador utiliza rutas relativas `/api/...`; el proxy de Vite las reenvía a la API local. Si se cambia el puerto del backend, el destino del proxy debe actualizarse también.

## Pruebas

```sh
npm test
npm run test:integration
```

Las pruebas HTTP ejecutan controllers, DTOs y services reales con modelos en memoria. Las pruebas de integración utilizan MongoDB en bases temporales independientes, verifican persistencia y compatibilidad de documentos y eliminan esas bases al finalizar.

La [estructura del proyecto](07-estructura-del-proyecto.md) detalla la organización completa del backend.
