# Flujo de desarrollo con Git y GitHub Desktop

El repositorio utiliza npm workspaces para mantener frontend, backend y contratos compartidos. Los cambios se revisan desde la raíz del proyecto.

## Revisión de cambios

```sh
git status
git diff
git diff --staged
```

`git diff` muestra cambios no preparados y `git diff --staged` muestra lo seleccionado para el próximo commit. La revisión debe incluir archivos nuevos, eliminaciones y modificaciones del archivo de dependencias bloqueadas cuando corresponda.

## Organización de commits

- Agrupar implementación, configuración y pruebas relacionadas en commits funcionales coherentes.
- Mantener los cambios de documentación en un commit separado cuando acompañan una modificación funcional.
- Usar mensajes breves en inglés que describan el resultado.

Ejemplos:

```text
feat: add packaging cost calculation
fix: preserve pending labor inputs
docs: clarify pricing formulas
```

Un cambio exclusivamente documental requiere únicamente su commit de documentación.

## GitHub Desktop

1. Agregar o abrir la carpeta del repositorio.
2. Revisar los archivos y diferencias en **Changes**.
3. Seleccionar los cambios que corresponden al commit.
4. Escribir su descripción en **Summary** y confirmar el commit.
5. Revisar **History** antes de sincronizar con **Push origin**.

**Fetch origin** actualiza las referencias remotas. **Pull origin** incorpora los cambios disponibles en la rama. Los commits locales y su publicación remota son operaciones distintas.

## Convenciones del proyecto

- Mantener las aplicaciones en `frontend/` y `backend/`, con dependencias propias.
- Compartir contratos mediante `shared/`; evitar imports a archivos internos de la otra aplicación.
- Organizar el backend por funcionalidad con módulos, controllers, services, DTOs y entidades.
- Mantener las reglas de cálculo independientes de los componentes de interfaz.
- Escribir comentarios breves en español sobre la responsabilidad de las funciones.
- Actualizar la documentación cuando cambian reglas, rutas o comandos.

## Verificaciones

| Cambio | Comprobaciones relacionadas |
|---|---|
| Cálculos y formularios | `npm run typecheck`, `npm test` |
| API y persistencia | Pruebas HTTP e integración con MongoDB |
| Interfaz | Pruebas Playwright y revisión de los tamaños afectados |
| Compilación y dependencias | `npm run build` |
| Documentación | Revisar enlaces, comandos y correspondencia con la implementación |

Los comandos y requisitos de ejecución se describen en el [README principal](../README.md).

## Archivos versionados

Se versionan el código, la configuración de proyecto, la documentación y `package-lock.json`. Las dependencias instaladas, las salidas de compilación y los resultados de pruebas se excluyen mediante [.gitignore](../.gitignore).

Los archivos `.env` locales están excluidos; `backend/.env.example` contiene la configuración de ejemplo que se publica. `.gitignore` no elimina archivos que ya estén versionados ni borra sus versiones anteriores.

## Contenido público e historial

En un repositorio público son visibles los archivos publicados y las versiones anteriores incluidas en su historial. Editar o eliminar un documento cambia la versión actual, pero no retira su contenido de commits anteriores.

La preparación del contenido público y una eventual modificación del historial son operaciones independientes.

## Referencias

- [Gestión de repositorios remotos](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories).
- [Revisión y creación de commits en GitHub Desktop](https://docs.github.com/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop).
