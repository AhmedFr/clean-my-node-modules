---
title: "npm vs yarn vs pnpm: ¿cuál desperdicia menos espacio en disco?"
description: "Cómo organizan npm, yarn y pnpm cada uno node_modules en disco, qué cuesta eso en muchos proyectos, y cuál acumula menos."
date: "2026-08-22"
---

Los gestores de paquetes se comparan habitualmente por velocidad de instalación y ergonomía del archivo de bloqueo. Compáralos en cambio por uso de disco y las diferencias son mayores: en una máquina con muchos proyectos, la brecha entre la organización mejor y la peor a menudo se mide en decenas de gigabytes.

## Cómo usa cada uno tu disco

**npm** materializa un `node_modules` completo y plano por proyecto. Cada paquete se copia físicamente en cada proyecto que lo usa. Cincuenta proyectos usando TypeScript significan cincuenta copias del compilador de TypeScript. npm también mantiene una caché de descargas global en `~/.npm` (tarballs, no árboles instalados), que es modesta en comparación.

**yarn clásico (v1)** se comporta como npm en disco: copias físicas completas por proyecto, más su propia caché en `~/Library/Caches/Yarn`. En cuanto a disco, trátalo como npm con un archivo de bloqueo distinto.

**yarn berry (v2+) con Plug'n'Play** es el radical: no hay `node_modules` en absoluto. Las dependencias se quedan como archivos zip en `.yarn/cache` y se resuelven en tiempo de ejecución. Los zips están comprimidos y son un archivo por paquete, así que el uso de disco por proyecto baja drásticamente. El coste es la compatibilidad del ecosistema: las herramientas que esperan un `node_modules` físico necesitan shims, lo cual es gran parte de por qué la adopción de PnP se quedó limitada. Berry también puede funcionar en modo `nodeLinker: node-modules`, que te devuelve al terreno de npm.

**pnpm** mantiene un almacén direccionado por contenido por máquina (`~/Library/pnpm/store` en macOS) y construye el `node_modules` de cada proyecto con hard links hacia él. Cincuenta proyectos que usan la misma versión de TypeScript comparten una copia física. El coste marginal por proyecto se acerca a cero para las dependencias compartidas; el almacén crece con la unión de todo lo que usas, no la suma. Los detalles finos (por qué `du` sobreestima, por qué el almacén necesita poda) están en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained).

## Los números en una máquina real

Las cifras exactas dependen de tu stack, pero la forma es consistente. Toma a un desarrollador con 30 proyectos que promedian 900 MB de dependencias cada uno, con mucho solapamiento entre proyectos:

| Gestor | Total aproximado en disco |
|---|---|
| npm / yarn clásico | 25 a 30 GB (30 copias completas) |
| yarn berry PnP | 6 a 10 GB (zips comprimidos, caché compartida) |
| pnpm | 8 a 12 GB (un almacén + hard links, antes de podar) |

pnpm y PnP quedan en la misma liga; npm y yarn clásico cuestan aproximadamente el triple por los mismos proyectos. La suposición de solapamiento es la que hace el trabajo aquí: si tus proyectos comparten pocas dependencias, la brecha se reduce.

## El disco no es el único eje

Elegir un gestor de paquetes solo por uso de disco sería extraño. El ranking de compatibilidad es más o menos el inverso del ranking de disco: npm funciona con todo, pnpm funciona con casi todo (problemas ocasionales con paquetes que asumen una organización plana), PnP requiere más adaptación. El soporte de monorepos, la velocidad de instalación y la familiaridad del equipo pesan todos, y analizamos el ángulo de monorepos específicamente en [Monorepos y espacio en disco](/es/blog/monorepo-disk-space).

Pero si la presión de disco es una restricción real para ti, el consejo práctico es:

1. **Ya usas pnpm:** estás en el bando eficiente; tu mantenimiento es `pnpm store prune` tras borrar proyectos antiguos.
2. **Usas npm o yarn clásico:** no necesitas migrar para arreglar tu disco. Borrar las carpetas `node_modules` obsoletas de proyectos recupera la mayor parte del desperdicio sin importar el gestor, ya que [siempre son reproducibles](/es/blog/how-to-delete-node-modules-safely).
3. **Migrando de todos modos:** pnpm es la opción menos disruptiva de las eficientes; la mayoría de proyectos cambian con una importación del archivo de bloqueo y cambios menores en los scripts.

## Uses lo que uses, la fuga es la misma

Las cuatro organizaciones comparten un mismo modo de fallo: nada se borra solo. Los proyectos obsoletos mantienen su peso completo (npm, yarn) o mantienen referencias que anclan el almacén (pnpm) hasta que actúas. El gestor determina la velocidad a la que se llena el disco, no si se llena.

Esa parte continua es lo que gestiona [TidyDisk](/es): conoce cada `node_modules` en tu Mac y tu almacén de pnpm, los mide sin duplicar hard links, marca lo obsoleto, y limpia lo que elijas con un clic, a la Papelera. El escaneo es gratis, y funciona igual sea cual sea el gestor de paquetes que llena tu disco.
