# Interfaz y formularios

La interfaz se organiza en tres secciones: Insumos, Recetas y Packaging. Utiliza React, TypeScript y Vite, con React Hook Form para administrar los formularios y shadcn/ui para los componentes compartidos.

## Organización del frontend

| Carpeta | Responsabilidad |
|---|---|
| `pages/` | Pantallas y coordinación de sus formularios |
| `components/` | Buscadores, catálogos, lectura de registros y protección de cambios |
| `components/ui/` | Componentes locales de shadcn/ui |
| `services/` | Comunicación HTTP con la API |
| `domain/` | Funciones de costos independientes de la interfaz |
| `types/` y `utils/` | Tipos y adaptación de los datos de formulario |

[App.tsx](../frontend/src/App.tsx) administra la sección activa. [main.tsx](../frontend/src/main.tsx) monta la aplicación y el proveedor de protección de cambios.

## Patrones compartidos

- **Catálogos:** buscador, actualización y creación en una ubicación consistente.
- **Lectura:** etiquetas secundarias y valores destacados como texto seleccionable.
- **Edición:** campos con borde y acciones para guardar o cancelar.
- **Estados:** registro nuevo, guardado, edición, cambios sin guardar y datos pendientes.
- **Resultados:** totales y desgloses separados de los datos de entrada.

[CatalogPicker.tsx](../frontend/src/components/CatalogPicker.tsx) comparte los controles del catálogo. [RecordDetails.tsx](../frontend/src/components/RecordDetails.tsx) presenta los datos guardados y el estado del editor.

## shadcn/ui y Tailwind CSS

shadcn/ui aporta componentes como `Button`, `Input`, tarjetas, comboboxes y diálogos. Su código se mantiene en el proyecto para adaptar variantes, tamaños y comportamiento.

Tailwind CSS genera las clases de estilo usadas por esos componentes. Por ejemplo:

```tsx
<Button variant="outline" className="rounded-lg">
  Cancelar
</Button>
```

`variant="outline"` selecciona la variante de botón con borde; `rounded-lg` aplica esquinas redondeadas. Las variables de [styles.css](../frontend/src/styles.css), como `--primary`, definen el tema compartido. El CSS propio organiza las páginas y la jerarquía de etiquetas, valores y resultados.

[components.json](../frontend/components.json) registra la configuración de shadcn y [vite.config.ts](../frontend/vite.config.ts) integra Tailwind y el alias `@/`. [shadcn.css](../frontend/src/shadcn.css) conserva las variantes CSS utilizadas por los componentes.

Los campos propagan referencias mediante `forwardRef` para que React Hook Form pueda registrar y enfocar el control real en React 18.

## Formularios

Los campos numéricos conservan texto mientras se editan. La conversión explícita admite coma o punto decimal y distingue un campo vacío de un cero informado.

React Hook Form conecta los controles con `register`, valida con `handleSubmit` y administra los errores por campo. `reset` carga un registro guardado o restaura sus valores. En Recetas, `useFieldArray` mantiene las filas dinámicas de ingredientes.

Los errores se muestran junto al campo correspondiente o como mensajes generales cuando afectan una operación completa. Un cálculo se retira cuando cambian entradas que lo dejan desactualizado.

## Navegación y cambios pendientes

[UnsavedChanges.tsx](../frontend/src/components/UnsavedChanges.tsx) reúne el estado de modificaciones y operaciones en curso. Los valores permanecen en los formularios de cada pantalla.

Cambiar de sección, reemplazar un registro o cancelar una edición solicita confirmación cuando se perderían cambios. El cierre o la recarga de pestaña utiliza el aviso nativo del navegador. La navegación se bloquea durante operaciones de guardado.

[SearchableSelect.tsx](../frontend/src/components/SearchableSelect.tsx) permite buscar sin distinguir tildes o mayúsculas, recorrer opciones con flechas, seleccionar con Enter y cerrar con Escape.

## Recorrido de venta

Packaging separa las tareas **Calcular una venta** y **Envases y stickers**. Los paneles conservan sus formularios al alternarlos.

La venta sigue el orden receta → presentación → cantidad → precio y ganancia. Consultar un envase guardado no elimina una simulación vigente; guardar costos nuevos retira el resultado que debe recalcularse.

## Verificación de interfaz

```sh
npm run test:ui --workspace @dessert-cost/frontend
```

Las pruebas Playwright requieren Google Chrome y utilizan respuestas HTTP simuladas. Cubren lectura, búsqueda con teclado, edición, cancelación, guardado, cambios pendientes y simulación de precios en escritorio y tamaño móvil de 390 × 844.

Las capturas y trazas se generan en `frontend/test-results/`, excluido de Git. El proyecto móvil verifica un viewport de Chrome, no un dispositivo físico.
