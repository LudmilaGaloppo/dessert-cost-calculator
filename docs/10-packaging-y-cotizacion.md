# Packaging y costo de una venta

Packaging separa **Calcular una venta** de **Envases y stickers**. El catálogo conserva las compras de envases y la configuración compartida de stickers; la cotización calcula el costo de la cantidad elegida.

## Catálogo de envases

Cada envase guarda nombre, tipo, cantidad comprada, precio total, capacidad y stickers por envase.

El buscador y **Nuevo envase** están arriba del editor. Los registros guardados se muestran como texto; **Editar** permite modificar sus campos. **Guardar cambios** conserva el identificador y **Cancelar** restaura los valores previos. Eliminar requiere confirmación.

La compra de stickers se administra por separado para reutilizarla en todos los envases. Su costo unitario se recalcula a partir de la cantidad y el precio registrados.

## Reglas de presentación

| Tipo | Envases necesarios | Capacidad |
|---|---|---|
| Individual | Uno por unidad vendida | Exactamente una unidad por envase |
| Caja | Una caja por cotización | La cantidad no puede superar su capacidad |

La cantidad de stickers se calcula como envases necesarios × stickers por envase. Puede ser cero.

La cotización actual requiere un rendimiento de receta expresado en `unit` y una cantidad entera positiva. No distribuye automáticamente una venta entre varias cajas cuando se supera la capacidad.

## Fórmulas

```text
Costo de los productos = costo de la tanda ÷ rendimiento × unidades vendidas
Costo unitario del envase = precio de compra ÷ cantidad comprada
Costo de envases = costo unitario × envases necesarios
Costo de stickers = precio de compra ÷ cantidad comprada × stickers necesarios
Costo cotizado = productos + envases + stickers
```

La remuneración de trabajo propio se distribuye en la misma proporción que los productos, para mostrar su participación en la ganancia de esa venta.

## Ejemplo ilustrativo

Una tanda de doce unidades tiene un costo de producción de $6.000. Una venta de cinco unidades requiere productos por $2.500.

Si una compra de diez cajas cuesta $8.000 y cada caja utiliza un sticker de una compra de cien por $10.000:

- Caja: $800.
- Sticker: $100.
- Packaging: $900.
- Costo de la venta: $3.400.

La caja debe admitir al menos cinco unidades. Los valores ilustran el cálculo y no son datos precargados ni precios recomendados.

## Recorrido en pantalla

1. Elegir una receta guardada.
2. Seleccionar un envase.
3. Indicar la cantidad de unidades.
4. Calcular el costo de la venta.
5. Evaluar un precio en [precio y ganancia](12-precio-de-venta.md).

Los paneles conservan sus formularios al alternarlos. Consultar un envase no borra la simulación; guardar cambios que afectan sus costos retira el resultado para recalcularlo.

Si faltan datos relevantes de producción o stickers, el costo se identifica como parcial y los precios derivados como provisorios.

## API

- `GET /api/packaging`: listar envases.
- `POST /api/packaging`: crear un envase.
- `PUT /api/packaging/:id`: actualizar sus datos completos.
- `DELETE /api/packaging/:id`: eliminar un envase.
- `GET /api/settings/stickers`: recuperar la compra compartida de stickers.
- `PUT /api/settings/stickers`: actualizar esa compra.

Los datos se guardan en `packaging` y `sticker_settings`. Las simulaciones de venta se mantienen en pantalla y no se persisten como presupuestos.
