---
title: "Cómo borrar node_modules de forma segura y recuperar gigabytes"
description: "Una guía práctica para borrar carpetas node_modules sin romper nada: qué es seguro, qué comprobar antes y cómo hacerlo en segundos."
date: "2026-07-04"
---

Cada proyecto de JavaScript que has clonado alguna vez dejó algo atrás: una carpeta `node_modules` que fácilmente puede pesar entre 200 MB y más de 1 GB. Multiplica eso por las docenas de proyectos que hay en tu carpeta `~/code` o `~/dev` y a menudo estás mirando 20, 50, a veces 100 GB de espacio en disco ocupado por dependencias que no has tocado en meses.

La buena noticia: `node_modules` es 100% desechable. La mejor noticia: puedes recuperarlo todo en segundos cuando lo necesites.

## Por qué borrar node_modules siempre es seguro

`node_modules` no contiene nada original. Es una copia materializada de lo que describen tu `package.json` y el archivo de bloqueo (`package-lock.json`, `yarn.lock` o `pnpm-lock.yaml`). Tu código, tu configuración y las versiones de tus dependencias viven todos fuera de él.

Eso significa que la ruta de recuperación es siempre la misma:

```bash
npm install   # o yarn, o pnpm install
```

Ejecuta eso en la carpeta del proyecto y todo el árbol de `node_modules` vuelve, byte a byte equivalente en lo que respecta a tu proyecto, porque el archivo de bloqueo fija cada versión.

Solo hay dos cosas que vale la pena comprobar antes de borrar:

1. **¿Está el proyecto ejecutándose ahora mismo?** Detén primero los servidores de desarrollo y los watchers. Un proceso en ejecución con manejadores de archivo abiertos dentro de `node_modules` puede comportarse de forma extraña cuando la carpeta desaparece bajo él.
2. **¿Tienes el archivo de bloqueo confirmado?** Si es así (casi seguro que sí), reinstalar reproduce exactamente el mismo árbol de dependencias. Si el proyecto no tiene archivo de bloqueo, la reinstalación sigue funcionando pero puede resolver versiones ligeramente más nuevas.

Esa es toda la lista de comprobación. No hay estado, ninguna caché que vayas a lamentar perder, ninguna configuración dentro de `node_modules` que importe.

## ¿De cuánto espacio estamos hablando?

Comprueba un solo proyecto:

```bash
du -sh ./node_modules
```

Los resultados típicos van desde 150 MB para una librería pequeña hasta 1,5 GB o más para una app full-stack con un bundler, un test runner y un framework de UI. Si quieres ver el total en todo lo que tienes, esto encuentra cada `node_modules` en disco y lo mide:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} +
```

En una máquina usada a diario para trabajo de JavaScript durante uno o dos años, totales de 30 a 80 GB son completamente normales. Escribimos más sobre de dónde viene todo ese peso en [¿Por qué node_modules es tan enorme?](/es/blog/why-is-node-modules-so-huge).

## La forma manual

Para un solo proyecto, el enfoque clásico:

```bash
cd ~/code/old-project
rm -rf node_modules
```

Funciona, pero recomendamos no convertirlo en costumbre, por una razón sencilla: es instantáneo e irreversible. Escribes la ruta equivocada, el autocompletado coge la carpeta equivocada, y no hay deshacer. Mover la carpeta a la Papelera en su lugar mantiene una red de seguridad:

```bash
# macOS: mover a la Papelera en vez de destruir de inmediato
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'
```

Poco elegante, pero recuperable. Cualquier cosa que borre archivos de desarrollo debería ser recuperable por defecto.

## El problema del lote

Borrar una carpeta es fácil. El verdadero problema son los otros 40 proyectos que olvidaste: el tutorial que seguiste en marzo, la prueba técnica de tu última búsqueda de empleo, los tres proyectos paralelos abandonados. Cada uno guarda tranquilamente cientos de megabytes.

Encontrarlos todos, comprobar cuándo tocaste cada proyecto por última vez, medir cada carpeta y decidir qué es seguro eliminar es exactamente el tipo de tarea que nunca se hace a mano.

Puedes automatizarlo con un script, y muchos desarrolladores lo hacen. También hay herramientas de línea de comandos creadas para esto. Pero si quieres que sea una decisión de 10 segundos en vez de una sesión de terminal, esto es precisamente para lo que construimos [TidyDisk](/es): vive en tu barra de menús de macOS, sabe continuamente dónde está cada carpeta `node_modules`, cuánto pesa y cuán obsoleto está el proyecto, y te deja limpiar las que elijas con un clic. Todo va a la Papelera, nunca mediante `rm -rf`, así que un error no te cuesta nada.

## ¿Qué pasa con el almacén de pnpm y las cachés globales?

Si usas pnpm, borrar el `node_modules` de un proyecto libera menos de lo que podrías esperar, porque pnpm enlaza archivos mediante hard links desde un almacén global direccionado por contenido. El almacén en sí se limpia por separado con `pnpm store prune`. Cubrimos todo ese tema en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained).

npm y yarn también mantienen cachés globales (`~/.npm`, `~/Library/Caches/Yarn`) que sobreviven al borrado de proyectos por diseño. Esas son una limpieza aparte con sus propias reglas.

## El hábito que mantiene tu disco limpio

Una rutina sencilla que lleva menos de un minuto al mes:

1. Lista los proyectos que no has tocado en 60 días o más.
2. Borra sus `node_modules` (a la Papelera).
3. Reinstala bajo demanda el día en que realmente vuelvas a uno de ellos.

El coste de equivocarse es un `npm install` y un descanso para el café. La recompensa son decenas de gigabytes de vuelta, de forma permanente, porque los proyectos obsoletos rara vez vuelven a la vida.

Si prefieres tener esa rutina automatizada, [TidyDisk](/es) hace el escaneo gratis: instálalo, y te muestra exactamente cuántos gigabytes están reteniendo tus carpetas `node_modules` ahora mismo. Limpiarlas con un clic es una licencia de por vida de 19 euros, y el escaneo solo ya suele compensar la descarga en sorpresas evitadas.
