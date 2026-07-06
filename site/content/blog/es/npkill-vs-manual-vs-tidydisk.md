---
title: "npkill vs limpieza manual vs TidyDisk: ¿cuál deberías usar?"
description: "Una comparación honesta de tres formas de limpiar node_modules en un Mac: comandos de terminal, la CLI npkill y la app TidyDisk en la barra de menús."
date: "2026-08-15"
---

Hay tres formas razonables de recuperar el espacio en disco que acumulan tus proyectos de JavaScript: hacerlo a mano en la terminal, usar una herramienta de línea de comandos creada para ello, o ejecutar una app que vigila de forma continua. Construimos una de las tres, así que ten en cuenta el sesgo, pero aquí está la comparación honesta, incluidos los casos en los que la respuesta no somos nosotros.

## Opción 1: comandos manuales de terminal

La opción sin instalación. Encuentra y mide todo:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + | sort -rh
```

Luego borra lo que elijas. Los patrones de comandos completos están en [nuestra guía para encontrar cada carpeta node_modules](/es/blog/find-node-modules-folders-mac).

**Puntos fuertes:** Sin dependencias, funciona en todas partes, se puede automatizar con scripts, ves exactamente lo que ocurre.

**Puntos débiles:** Tienes que acordarte de hacerlo. Medir es lento en discos grandes, `du` duplica los hard links de pnpm (detalles [aquí](/es/blog/pnpm-store-explained)), la comprobación de antigüedad es una contorsión de shell, y la herramienta de borrado natural es `rm -rf`, que no tiene deshacer. En la práctica, la mayoría de la gente lo hace una vez, se siente genial, y nunca vuelve a hacerlo.

**Mejor para:** limpiezas puntuales, servidores remotos, gente que vive en la terminal y le gusta así.

## Opción 2: npkill

[npkill](https://npkill.js.org/) es una CLI de código abierto bien hecha: ejecutas `npx npkill`, escanea desde el directorio actual, lista cada `node_modules` con su tamaño, y borras con la barra espaciadora. Es gratis, rápida de arrancar, y se merece su popularidad.

**Puntos fuertes:** Gratis, sin instalación (se ejecuta vía npx), interactiva y mucho más amigable que find/du en crudo, muestra información de última modificación, multiplataforma.

**Puntos débiles:** Sigue siendo una sesión que tienes que recordar ejecutar. Escanea desde donde la lanzas, así que las carpetas fuera de ese árbol se pasan por alto. El borrado es inmediato y permanente en vez de ir a la Papelera (no hay deshacer si eliges la fila equivocada). Solo cubre `node_modules`: sin conciencia del almacén de pnpm, y las carpetas de pnpm enlazadas con hard links reportan tamaños que exageran lo que liberará el borrado.

**Mejor para:** desarrolladores que quieren una limpieza gratuita, ocasional e interactiva, y se sienten cómodos en una terminal.

## Opción 3: TidyDisk

[TidyDisk](/es) es una app de la barra de menús de macOS. Escanea de forma continua en vez de bajo demanda: cada carpeta `node_modules`, tu almacén de pnpm y tus paquetes instalados, medidos correctamente (tiene en cuenta los hard links de pnpm en vez de duplicarlos) y ordenados por antigüedad. La limpieza es un clic, y todo va a la Papelera, nunca mediante `rm -rf`, así que cualquier error es reversible. El escaneo es gratis; la limpieza con un clic es una licencia de por vida de 19 euros.

**Puntos fuertes:** El número siempre está al día, sin sesión que recordar. Medición consciente de pnpm. Borrado a la Papelera con deshacer real. Clasificación por antigüedad incluida. No necesita terminal.

**Puntos débiles:** Solo macOS. El clic de limpieza cuesta dinero (una vez). Quien quiera una herramienta programable y encadenable preferirá una CLI.

**Mejor para:** desarrolladores de Mac que quieren el problema resuelto de forma continua en vez de heroica, y cualquiera que alguna vez haya metido la pata con un `rm -rf`.

## La decisión real

| Si eres... | Usa |
|---|---|
| Limpiar un servidor o máquina de CI | Comandos manuales |
| Una persona de terminal haciendo una purga trimestral, gratis | npkill |
| En un Mac y quieres que sea continuo, seguro y de un clic | TidyDisk |

Y dos notas honestas. Primero: si limpias dos veces al año y la terminal no te asusta, npkill es genuinamente bueno y no cuesta nada; preferimos que lo uses a que no hagas nada. Segundo: elijas lo que elijas, borra a la Papelera cuando puedas y revisa [por qué rm -rf es el hábito equivocado](/es/blog/never-rm-rf-node-modules) cuando no puedas.

Si la opción continua suena a tu estilo, [descarga TidyDisk](/es) y ejecuta el escaneo gratis. Sabrás tu número en un minuto aproximadamente, y el primer número suele ser el convincente.
