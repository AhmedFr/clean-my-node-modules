---
title: "¿Por qué node_modules es tan enorme? Qué hay realmente dentro"
description: "Por qué una app de 20 líneas atrae 300 MB de dependencias: paquetes transitivos, versiones duplicadas, herramientas de desarrollo y binarios explicados."
date: "2026-07-11"
---

Escribes un servidor Express de 20 líneas, ejecutas `npm install`, y `node_modules` termina pesando 180 MB con 4.000 archivos. El famoso chiste imagina `node_modules` más pesado que un agujero negro. Pero el peso no es un fallo ni un accidente. Es el resultado directo de unas cuantas decisiones de diseño deliberadas en el ecosistema npm, y una vez que las ves, el tamaño deja de ser un misterio.

## Dependencias transitivas: instalas 5, obtienes 800

Tu `package.json` lista las dependencias directas. Cada una de ellas tiene sus propias dependencias, y así sucesivamente por todo el árbol. Instalar un framework web típico más un test runner más un bundler resuelve rutinariamente a 800 o 1.500 paquetes distintos.

Compruébalo tú mismo:

```bash
npm ls --all | wc -l
```

El ecosistema npm ha favorecido históricamente muchos paquetes pequeños y de propósito único frente a grandes librerías estándar. Eso tiene beneficios reales (código enfocado, actualizaciones independientes) y un coste obvio: el grafo de dependencias explota, y cada nodo del grafo es una carpeta en tu disco con su propio `package.json`, README, archivo de licencia y a menudo sus propias pruebas y mapas de código fuente incluidos en el tarball.

## Duplicación: el mismo paquete, cinco veces

Dos de tus dependencias necesitan `lodash`, pero una quiere `^4.17.0` y otra fija `4.16.6`. Los gestores de paquetes que usan una organización plana de `node_modules` (npm, yarn clásico) deduplican lo que pueden, pero cualquier conflicto de versiones significa que la misma librería se copia físicamente varias veces en distintas profundidades del árbol.

Comprueba cómo de grave es en un proyecto:

```bash
npm ls lodash
npm dedupe --dry-run
```

En apps grandes es común encontrar la misma librería de utilidades presente en 3 a 6 versiones distintas. Cada copia está completamente materializada en disco. pnpm ataca precisamente este problema con un almacén direccionado por contenido y hard links, por lo que el mismo conjunto de proyectos ocupa dramáticamente menos espacio real en disco con pnpm. Desglosamos ese mecanismo en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained).

## Las dependencias de desarrollo pesan más que tu app

Las dependencias en tiempo de ejecución de la mayoría de las apps son modestas. Lo pesado es la cadena de herramientas: TypeScript trae un compilador de unos 60 MB, los bundlers y sus ecosistemas de plugins añaden decenas de megabytes, los test runners traen sus propios analizadores e instrumentación, los linters cargan árboles de sintaxis completos para cada sintaxis que soportan.

Una forma rápida de sentir la diferencia:

```bash
npm install --omit=dev
du -sh node_modules
```

Las instalaciones solo de producción son frecuentemente de 3 a 10 veces más pequeñas que la instalación de desarrollo completa. El `node_modules` de 1 GB es sobre todo el taller, no el producto.

## Binarios de plataforma: los pesos pesados silenciosos

Algunos paquetes incluyen binarios nativos precompilados para cada plataforma y arquitectura que soportan: procesamiento de imágenes (sharp), navegadores sin interfaz (puppeteer descarga un Chromium completo de unos 170 MB), drivers de bases de datos, SWC y esbuild con binarios por plataforma. Un puñado de estos puede duplicar el tamaño de un proyecto por lo demás ordinario.

Encuentra a los pesos pesados dentro de cualquier `node_modules`:

```bash
du -sh node_modules/* node_modules/.pnpm 2>/dev/null | sort -rh | head -20
```

Ejecuta eso en un proyecto y normalmente encontrarás 5 paquetes responsables de la mitad del total.

## Archivos que existen sin ninguna razón en tiempo de ejecución

Los tarballs de paquetes frecuentemente incluyen documentación, carpetas de ejemplos, suites de pruebas, código fuente de TypeScript junto al resultado compilado, y mapas de código fuente. Nada de eso hace falta para ejecutar tu app, y todo se descomprime en tu disco. Multiplica un pequeño desperdicio por 1.200 paquetes y deja de ser pequeño.

## Entonces, ¿es el tamaño un problema?

Para un solo proyecto activo: no realmente. El disco es barato, y la cadena de herramientas se gana sus megabytes a diario.

El coste real aparece en conjunto. Cada proyecto que has clonado alguna vez mantiene su propia copia completa de este peso para siempre, lo hayas abierto la semana pasada o el año pasado. Diez proyectos obsoletos de 500 MB cada uno son 5 GB de puro peso muerto, y la mayoría de desarrolladores en activo tienen muchos más de diez. Ese conjunto es lo que merece la pena limpiar, y es completamente seguro de limpiar porque `node_modules` siempre se puede reproducir a partir del archivo de bloqueo, como cubrimos en [Cómo borrar node_modules de forma segura](/es/blog/how-to-delete-node-modules-safely).

Si quieres conocer tu propio número, [TidyDisk](/es) escanea tu Mac gratis y muestra cada carpeta `node_modules`, medida y ordenada, con las obsoletas marcadas. La mayoría encuentra 20+ GB en el primer escaneo. Recuperarlo es un clic y una licencia de por vida de 19 euros, y todo va a la Papelera, así que nada se pierde nunca por error.
