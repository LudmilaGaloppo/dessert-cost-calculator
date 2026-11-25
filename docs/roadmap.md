# Roadmap

Este documento reúne las líneas de evolución del producto. No establece fechas de entrega ni compromisos de implementación. El [alcance](alcance.md) distingue las funcionalidades disponibles de las previstas.

## Base disponible

- Catálogos persistidos de insumos y envases.
- Recetas con rendimiento, ingredientes y tiempos de elaboración.
- Configuración general de trabajo y energía.
- Cotización por cantidad de unidades, envase y stickers.
- Sugerencia de precios y evaluación de ganancia total y excedente.
- Interfaz compartida con lectura, edición y protección de cambios.
- API modular NestJS con DTOs y persistencia Mongoose.
- Pruebas de dominio, HTTP, integración con MongoDB e interfaz.

## Presupuestos e historial

- Guardar cotizaciones y recuperar sus resultados.
- Conservar los precios y entradas usados en cada presupuesto.
- Incorporar historial de cambios de precios del catálogo.
- Definir cómo preservar las referencias cuando se modifica o elimina una receta o un envase.

## Respaldo y portabilidad

- Exportar e importar catálogos, recetas y configuración.
- Facilitar copias de respaldo y restauración.
- Ampliar las instrucciones de instalación y operación.

## Presentaciones de venta

- Admitir cotizaciones por peso y producto completo.
- Distribuir cantidades entre varios envases según sus capacidades.
- Comparar alternativas de presentación para una misma receta.

## Modelo de costos

- Ofrecer estimaciones de energía basadas en consumo técnico.
- Incorporar gastos generales y comisiones por canal de venta.
- Distinguir trabajo propio de personal contratado.
- Mantener explícitas las bases de los porcentajes y los conceptos incluidos en cada total.

## Operación y acceso

- Registrar elaboraciones y movimientos de existencias.
- Gestionar pedidos y reportes.
- Evaluar autenticación, separación de datos por cuenta y despliegue para uso compartido.

## Criterios de implementación

Cada ampliación debe definir sus entradas, reglas, persistencia y efecto sobre los resultados existentes. Las nuevas funciones deben conservar la distinción entre datos pendientes y valores cero, y contar con verificaciones adecuadas a sus reglas.
