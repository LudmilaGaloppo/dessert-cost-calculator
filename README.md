# DessertCostCalculator

Aplicación web para calcular costos de pastelería y evaluar precios de venta. Permite registrar insumos, armar recetas y contemplar trabajo, energía y packaging para conocer el costo de cada presentación y su ganancia estimada.

## Funcionalidades

- **Catálogo de insumos:** registro de compras, precios, cantidades y unidades, con conversión entre gramos y kilogramos, o mililitros y litros.
- **Gestión de recetas:** ingredientes, rendimiento por tanda y desglose de costos calculado con los precios vigentes del catálogo.
- **Trabajo y energía:** tarifa por hora, tiempo de elaboración y estimación de gas y electricidad según el uso de cada receta.
- **Packaging:** catálogo de bolsas y cajas, capacidad por envase y costo de stickers, aplicados a la cantidad elegida para la venta.
- **Simulación de precios:** sugerencias por recargo sobre costo o margen sobre venta, y evaluación de un precio manual.
- **Ganancia desglosada:** diferencia entre la ganancia total para quien elabora, la remuneración por su trabajo y el excedente posterior.
- **Interfaz adaptable:** búsqueda en catálogos, navegación con teclado, vistas de lectura y edición, y protección de cambios sin guardar.

Los datos faltantes se identifican como pendientes y los cálculos incompletos se muestran como parciales. La aplicación distingue un valor pendiente de un cero explícito.

## Tecnologías

| Área | Tecnologías |
|---|---|
| Frontend | React, TypeScript, Vite, React Hook Form |
| Interfaz | shadcn/ui, Base UI, Tailwind CSS, Lucide |
| Backend | NestJS, TypeScript, class-validator, class-transformer |
| Persistencia | MongoDB y Mongoose |
| Pruebas | Node.js Test Runner y Playwright |

El backend se organiza por funcionalidad, con módulos, controllers, services, DTOs y entidades. Los contratos de datos compartidos mantienen la comunicación entre ambas aplicaciones.

## Estructura del proyecto

```text
DessertCostCalculator/
├── frontend/   # Interfaz, formularios y lógica de cálculo
├── backend/    # API REST, validación y persistencia
├── shared/     # Contratos de datos compartidos
└── docs/       # Documentación del proyecto
```

Las aplicaciones se administran con npm workspaces y comparten un único archivo de dependencias bloqueadas (`package-lock.json`).

## Ejecución local

### Requisitos

- Node.js 22 o posterior y npm.
- MongoDB en ejecución.

### Instalación

Desde la raíz del proyecto:

```sh
npm ci
```

### Configuración

La API utiliza MongoDB local y el puerto `3001` de forma predeterminada. Para personalizar la conexión o el puerto, copiá [backend/.env.example](backend/.env.example) a `backend/.env` y ajustá `MONGODB_URI` y `API_PORT`.

Si cambiás el puerto de la API, actualizá también el destino del proxy en [frontend/vite.config.ts](frontend/vite.config.ts).

### Iniciar la aplicación

En una terminal, iniciá la API:

```sh
npm run dev:api
```

En otra terminal, iniciá el frontend:

```sh
npm run dev
```

Abrí la dirección que indique Vite. Ambos servidores detectan cambios durante el desarrollo.

## Verificación

| Comando | Descripción |
|---|---|
| `npm run typecheck` | Comprueba los tipos de todos los paquetes |
| `npm test` | Ejecuta las pruebas de cálculo, formularios, validación y API |
| `npm run test:integration` | Verifica la persistencia con MongoDB en bases temporales |
| `npm run test:ui --workspace @dessert-cost/frontend` | Comprueba los recorridos de interfaz en escritorio y tamaño móvil |

Las pruebas de integración requieren MongoDB activo. Las pruebas de interfaz utilizan Google Chrome y respuestas de API simuladas.

## Compilación

```sh
npm run build
```

Genera la web en `frontend/dist/` y la API en `backend/dist/`. Para ejecutar la API compilada:

```sh
npm run start:api
```

## Estado del proyecto

Aplicación en desarrollo con ejecución local y persistencia en MongoDB. Los catálogos, las recetas y la configuración se guardan; las simulaciones de venta se calculan en pantalla.

## Documentación

El [índice de documentación](docs/README.md) reúne las reglas de cálculo, el modelo de datos, la arquitectura y las guías de desarrollo. Las funcionalidades previstas se detallan en el [roadmap](docs/roadmap.md).
