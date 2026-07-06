---
title: "Monorepos y espacio en disco: domar node_modules a gran escala"
description: "Por qué los monorepos multiplican el peso de las dependencias, cómo ayudan pnpm y los workspaces, y cómo controlar cachés, builds y clones obsoletos."
date: "2026-09-05"
---

Los monorepos concentran todo: código, herramientas y uso de disco. Un solo monorepo muy usado puede cargar más peso de dependencias que una docena de proyectos pequeños, y añade nuevas categorías de consumo de disco (cachés de compilación, artefactos por paquete) que los consejos de limpieza habituales ignoran. Aquí es donde van los gigabytes y cómo recuperarlos.

## Dónde ponen su peso los monorepos

**El node_modules raíz.** Con workspaces de npm, yarn o pnpm, la mayoría de dependencias se elevan a un único `node_modules` raíz. En un repositorio con 20 paquetes, esta carpeta suele pesar de 1 a 3 GB. Ese es en realidad el resultado eficiente: una copia compartida en vez de 20.

**El node_modules por paquete.** Los paquetes con versiones conflictivas o scripts de ciclo de vida obtienen su propio `node_modules` anidado. Un puñado es normal; docenas de ellos pesados sugieren conflictos de versión que vale la pena arreglar con un pase de `dedupe`:

```bash
npm dedupe --dry-run       # workspaces de npm
pnpm dedupe --check        # pnpm 9+
```

**Cachés de compilación y de tareas.** El `.turbo` de Turborepo, el `.nx/cache` de Nx, las cachés de Vite y webpack dentro de `node_modules/.cache`, los archivos `.tsbuildinfo` de TypeScript. Se ganan su espacio en un repositorio activo y son puro desperdicio en un clon obsoleto. Pueden rivalizar con el peso de las dependencias:

```bash
du -sh .turbo .nx/cache node_modules/.cache 2>/dev/null
```

**Clones duplicados.** El multiplicador específico de monorepos: worktrees y segundos clones para ramas paralelas. Cada clon carga con todo el peso de `node_modules` y las cachés. Tres copias de trabajo de un monorepo de 4 GB son 12 GB, y los dos que creaste para ese hotfix de marzo siguen ahí.

## La elección del gestor de paquetes importa más aquí

Todo lo que se explica en [npm vs yarn vs pnpm en disco](/es/blog/npm-yarn-pnpm-disk-space) se amplifica en un monorepo, y pnpm tiene una ventaja estructural que vale la pena conocer: como el `node_modules` de cada proyecto son hard links a un almacén, tus tres clones del monorepo comparten en gran medida el disco físico. Con npm o yarn clásico, cada clon es una copia física completa. Si mantienes varias copias de trabajo de un repositorio grande, el modelo de almacén de pnpm es la decisión de disco de mayor impacto disponible ([cómo funciona el almacén](/es/blog/pnpm-store-explained)).

## Limpieza que respeta un monorepo activo

Para el monorepo en el que trabajas a diario:

1. **Deja en paz el `node_modules` raíz.** Reinstalar un workspace grande lleva minutos; borrarlo para recuperar espacio que necesitarás mañana es una pérdida neta.
2. **Recorta las cachés de vez en cuando.** `.turbo` y similares se regeneran en la siguiente compilación. Limpiarlas en un repositorio que sigues usando cuesta una compilación en frío.
3. **Unifica versiones conflictivas.** Reduce la capa de `node_modules` por paquete de forma permanente.

Para todo lo demás, sé implacable:

4. **Los clones y worktrees obsoletos son el premio gordo.** Un segundo clon olvidado son varios gigabytes de pura duplicación. `git worktree list` muestra los worktrees que olvidaste; borra su `node_modules` primero, y luego el propio worktree si la rama ya se publicó.
5. **Los monorepos archivados** (el repositorio de la antigua empresa, la reescritura abandonada) mantienen todo su peso para siempre. Su `node_modules` y sus cachés son [seguros de borrar](/es/blog/how-to-delete-node-modules-safely) como cualquier otro; el archivo de bloqueo reconstruye todo si el repositorio alguna vez despierta.

Y como siempre en macOS: borra a la Papelera, no con `rm -rf`. Cuanto más grande sea la carpeta, más vale ese [hábito](/es/blog/never-rm-rf-node-modules).

## Llevar la cuenta

La parte difícil en un mundo de monorepos es conocer tu total actual. El peso se acumula simultáneamente en el repositorio, sus clones, las carpetas por paquete y el almacén de pnpm; ningún `du` único lo muestra. [TidyDisk](/es) mantiene el total en marcha en la barra de menús de tu Mac: cada `node_modules` en cada clon, el almacén de pnpm medido con honestidad (los hard links contados una sola vez), la antigüedad por proyecto, limpieza con un clic a la Papelera. El escaneo es gratis, y los usuarios de monorepos tienden a ver los primeros números más grandes de todos.

Ya sea que lo automatices o lo hagas con scripts, comprueba el número trimestralmente. Los monorepos crecen en silencio, y el primer `find` en una máquina que aloja uno es siempre una sorpresa.
