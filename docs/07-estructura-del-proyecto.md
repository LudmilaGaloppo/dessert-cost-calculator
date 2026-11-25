# Estructura: frontend, backend y contratos compartidos

El proyecto separa la interfaz React, la API NestJS y los contratos de datos compartidos. El backend se organiza por funcionalidad, con controllers, services, módulos, DTOs y entidades Mongoose.

```text
DessertCostCalculator/
├── frontend/                  # React, formularios y servicios HTTP
├── backend/
│   ├── src/
│   │   ├── main.ts            # Arranque de Nest y cierre ordenado
│   │   ├── app.module.ts      # Entorno y conexión MongoDB
│   │   ├── features.module.ts # Reúne las funcionalidades de la API
│   │   ├── common/
│   │   │   ├── configure-app.ts
│   │   │   ├── validation.ts
│   │   │   ├── units.ts
│   │   │   ├── dto/id-param.dto.ts
│   │   │   └── filters/api-exception.filter.ts
│   │   ├── supplies/
│   │   │   ├── supplies.module.ts
│   │   │   ├── supplies.controller.ts
│   │   │   ├── supplies.service.ts
│   │   │   ├── supply.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-supply.dto.ts
│   │   │       └── update-supply.dto.ts
│   │   ├── recipes/           # Mismo patrón para recetas e ingredientes
│   │   ├── packaging/         # Mismo patrón para envases
│   │   ├── settings/          # Tarifa y energía
│   │   └── stickers/          # Compra compartida de stickers
│   ├── tests/
│   │   ├── api.test.ts
│   │   ├── supply-validation.test.ts
│   │   ├── helpers/           # Modelos en memoria y arranque de Nest para pruebas
│   │   └── integration/mongodb.test.ts
│   ├── .env.example
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.tests.json
│   └── package.json
├── shared/src/costs.d.ts      # Contratos de datos que intercambian las aplicaciones
├── docs/
├── tsconfig.base.json
├── package.json              # Workspaces y comandos desde la raíz
└── package-lock.json
```

## Organización por funcionalidad

Cada funcionalidad reúne sus piezas dentro de una carpeta. Por ejemplo, `recipes/` contiene las rutas, las reglas, los DTOs y el esquema necesarios para trabajar con recetas.

| Pieza | Responsabilidad | Ejemplo de insumos |
|---|---|---|
| Controller | Recibe la petición HTTP y delega; devuelve la respuesta pública | `POST /api/supplies` llama a `SuppliesService.create` |
| DTO | Define y valida la entrada en ejecución | Nombre, cantidad positiva, unidad admitida y precio no negativo |
| Service | Aplica reglas y consulta los modelos de MongoDB | Impide eliminar un insumo usado por una receta |
| Entity / schema | Define los documentos guardados y la colección | `SupplySchema` conserva `supplies` y sus campos |
| Module | Registra y conecta controllers, providers y modelos | `SuppliesModule` exporta `SuppliesService` para reutilizarlo |

Los decoradores son las anotaciones que empiezan con `@`. `@Controller('supplies')` identifica un controller; `@Post()` registra una ruta; `@Body()` obtiene la entrada. `@Injectable()` permite que Nest construya un service y le entregue sus dependencias. `@InjectModel(Supply.name)` pide el modelo registrado por `MongooseModule.forFeature`. [Controllers](https://docs.nestjs.com/controllers), [módulos](https://docs.nestjs.com/modules) y [Mongoose en Nest](https://docs.nestjs.com/techniques/mongodb).

## Ejemplo: guardar un insumo

```text
Formulario
  → servicio HTTP del frontend
  → POST /api/supplies
  → validación de CreateSupplyDto
  → SuppliesController.create
  → SuppliesService.create
  → modelo Supply
  → colección supplies de MongoDB
```

El controller devuelve `{ supply: ... }` con HTTP 201. El service traduce `_id` a `id: string` y omite campos internos antes de responder.

Al eliminar, el controller entrega el ID validado al service. Este consulta las recetas que lo referencian y responde 409 si alguna lo utiliza. La regla vive en el service porque necesita datos guardados; no pertenece al DTO ni al controller.

`RecipesModule` importa `SuppliesModule` para comprobar los ingredientes contra el catálogo vigente. `SuppliesService` usa el modelo de recetas para proteger eliminaciones, sin importar `RecipesModule`; así los módulos evitan una dependencia circular.

## DTOs frente a tipos compartidos

Un tipo de TypeScript desaparece al compilar. `SupplyInput`, declarado en `shared`, describe el contrato que comparten frontend y backend, pero por sí solo no valida una petición.

`CreateSupplyDto` es una clase con decoradores de `class-validator`. El `ValidationPipe` la utiliza cuando llega una petición: rechaza campos inválidos, recorta nombres y elimina propiedades no declaradas. `class-transformer` permite construir los DTOs de ingredientes anidados. La conversión numérica implícita permanece desactivada: el texto `"5000"` no se acepta como si fuera el número `5000`. [Validación de Nest](https://docs.nestjs.com/techniques/validation).

Los DTOs de actualización heredan los de creación **sin hacer sus campos opcionales**, porque las rutas existentes usan PUT con el registro completo. No incorporamos PATCH. Los tiempos omitidos de una receta se normalizan a `null`, y una tarifa cero sigue siendo una configuración válida.

Los mensajes se presentan en español desde la configuración común de validación. El filtro de excepciones conserva los estados 400, 404, 409, 413, 415 y 503 y evita devolver detalles internos de la conexión.

## Qué se conserva

Se conservan las rutas `/api/supplies`, `/api/recipes`, `/api/packaging`, `/api/settings/costs`, `/api/settings/energy` y `/api/settings/stickers`, junto con sus respuestas JSON. El frontend sigue consultando esas rutas a través del proxy de Vite.

Las colecciones siguen siendo `supplies`, `recipes`, `packaging`, `settings` y `sticker_settings`. La configuración de costos conserva `key: 'costs'`. Los identificadores existentes no cambian. No se necesita una migración de documentos.

Nest usa el adaptador de Express para HTTP y Mongoose para MongoDB. Los controllers registran las rutas, los DTOs validan la entrada y los services concentran las reglas y las consultas a los modelos.

## Configuración, compilación y workspaces

`backend/.env` admite `MONGODB_URI` y `API_PORT`, según `.env.example`. `ConfigModule` carga el entorno antes de configurar MongoDB. Sin archivo `.env`, se mantienen MongoDB local y el puerto 3001. La API escucha en `127.0.0.1`.

TypeScript compila decoradores y su metadata porque Nest los usa para identificar DTOs y resolver dependencias. El backend conserva módulos ESM con `NodeNext`; no utiliza `tsx`, que no emite esa metadata. El modo de desarrollo usa el compilador de Nest con watch, y el arranque compilado usa `dist/main.js`.

El CLI compila y observa archivos; los paquetes `@nestjs/common`, `@nestjs/core` y `@nestjs/platform-express` ejecutan la aplicación. Las versiones de las herramientas y del runtime se declaran en `backend/package.json` y se fijan en el archivo de dependencias bloqueadas.

Los workspaces permiten mantener dependencias propias en cada `package.json` y un único `package-lock.json`. `shared` continúa siendo un paquete local de declaraciones, consumido con `import type`; no necesita servidor ni JavaScript ejecutable.

| Comando desde la raíz | Resultado |
|---|---|
| `npm ci` | Instala y enlaza los paquetes |
| `npm run dev` | Frontend con Vite |
| `npm run dev:api` | API Nest con compilación y reinicio en watch |
| `npm run typecheck` | Comprueba tipos de los tres paquetes |
| `npm run build` | Compila frontend y backend |
| `npm run start:api` | Ejecuta `backend/dist/main.js` |
| `npm test` | Ejecuta pruebas de dominio, formularios, DTOs y API |
| `npm run test:integration` | Verifica persistencia y compatibilidad sobre bases MongoDB temporales |
| `npm run test:ui --workspace @dessert-cost/frontend` | Pruebas del recorrido de interfaz con respuestas simuladas |

## Estrategia de pruebas

Las pruebas HTTP construyen los módulos, controllers, DTOs y services reales. Sustituyen únicamente los modelos de MongoDB por modelos en memoria. La integración usa MongoDB real en bases aleatorias `dessert_cost_test_...`, verifica persistencia y lectura de documentos con el formato anterior, y elimina solo esas bases temporales.

Las comprobaciones de tipos y compilación complementan las pruebas de dominio, HTTP e integración. Los recorridos de interfaz se verifican mediante Playwright con respuestas de API simuladas. Los comandos se ejecutan de manera independiente según el tipo de cambio.
