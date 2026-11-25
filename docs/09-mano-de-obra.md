# Trabajo propio y costo de producción

El trabajo de elaboración se valora a partir de las horas de una tanda y una tarifa general por hora. Esta remuneración se contempla en el costo de producción y al sugerir precios de venta.

```text
Remuneración de la tanda = horas de trabajo × tarifa por hora
Costo de producción = ingredientes + remuneración conocida + energía conocida
```

## Horas y tarifa

`workingHours` pertenece a cada receta. `hourlyRate` es una configuración compartida por todas las recetas y se guarda en la colección `settings`.

Cambiar la tarifa permite recalcular el valor del trabajo sin modificar los tiempos de cada receta. Los costos resultantes se calculan en pantalla; no se almacenan como importes fijos en la receta.

La tarjeta **Valor de tu hora** presenta la configuración en modo lectura. **Editar**, **Guardar cambios** y **Cancelar** siguen el mismo patrón que los otros editores.

## Trabajo incluido en la ganancia

El modelo actual contempla trabajo propio. Al evaluar un precio de venta, la ganancia total incluye esa remuneración porque queda para quien elabora. El excedente muestra lo que queda después de reconocer el trabajo a la tarifa configurada.

```text
Ganancia total = venta − ingredientes − energía − packaging
Excedente = ganancia total − remuneración prevista
```

La remuneración se distribuye según el rendimiento y las unidades vendidas. Al mismo precio manual y con los mismos gastos, cambiar la tarifa modifica el desglose entre trabajo y excedente, no la ganancia total. El precio sugerido sí cambia al variar el costo de trabajo contemplado.

Si una venta cubre los gastos pero no toda la remuneración prevista, la interfaz informa esa diferencia. El modelo no incorpora un costo separado de personal contratado.

## Datos pendientes y ceros

- Horas sin informar: el trabajo queda pendiente.
- Horas positivas sin tarifa: el trabajo queda pendiente.
- Horas iguales a cero: remuneración cero, sin exigir una tarifa para esa receta.
- Tarifa cero con horas informadas: remuneración cero explícita.

Los valores negativos son inválidos. La ausencia de un dato se representa con `null`; los totales incompletos se identifican como parciales.

## API y cálculo

- `GET /api/settings/costs` recupera la tarifa y los promedios de energía.
- `PUT /api/settings/costs` actualiza la tarifa.
- Las recetas conservan `workingHours` junto con sus otros datos.

La función `calculateProductionCost` está en [costs.ts](../frontend/src/domain/costs.ts). La [estimación de energía](11-energia-estimada.md) completa la producción, y el [packaging](10-packaging-y-cotizacion.md) se agrega al cotizar una venta.
