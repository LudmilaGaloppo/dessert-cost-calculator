# Energía estimada por receta

La aplicación estima gas y electricidad mediante un promedio diario configurable y el tiempo de uso de cada artefacto. Es una aproximación de costos, no una medición de consumo técnico.

## Entradas

| Ámbito | Campo | Descripción |
|---|---|---|
| Configuración | `gasDailyAverage` | Costo promedio diario de gas |
| Configuración | `electricityDailyAverage` | Costo promedio diario de electricidad |
| Receta | `gasOvenMinutes` | Tiempo de horno a gas, incluido el precalentado |
| Receta | `electricMixerMinutes` | Tiempo total de batidora eléctrica |

Los promedios se guardan una vez en la configuración general. Cada receta conserva sus tiempos de uso. Los valores se cargan explícitamente; no hay consumos ni importes domésticos precargados.

## Fórmula

```text
Costo estimado = promedio diario ÷ 24 × minutos utilizados ÷ 60
Energía de la tanda = gas conocido + electricidad conocida
```

Ejemplo ilustrativo:

```text
Gas: $2.400 por día, 90 minutos → $150
Electricidad: $1.200 por día, 6 minutos → $5
Energía estimada de la tanda → $155
```

## Alcance de la estimación

El método distribuye el promedio diario de manera uniforme durante las veinticuatro horas. No utiliza potencia eléctrica, kWh, consumo de gas por hora ni tarifas específicas del artefacto.

Un promedio que incluya otros consumos o cargos también los distribuye. Para obtener mayor precisión, un modelo de consumo técnico podría reemplazar la fórmula conservando los tiempos de las recetas.

## Valores pendientes

Un tiempo igual a cero indica que la receta no utiliza el artefacto y produce un costo cero sin requerir su promedio diario. Un tiempo sin informar permanece pendiente.

Si hay tiempo de uso positivo y falta el promedio correspondiente, el costo queda pendiente y el resultado se muestra como parcial. Los promedios configurados deben ser finitos y positivos.

## Interfaz y API

La tarjeta de energía en Recetas permite consultar, editar, guardar o cancelar los promedios generales.

- `GET /api/settings/costs` recupera tarifa y promedios diarios.
- `PUT /api/settings/energy` actualiza los dos promedios diarios.

La función `calculateDailyProration` se utiliza dentro de `calculateProductionCost`, en [costs.ts](../frontend/src/domain/costs.ts). La energía forma parte del costo de la tanda y se distribuye entre las unidades vendidas.
