---
title: "npm cache clean: qué libera realmente (y qué no)"
description: "Qué vive en la caché de npm, cuándo ayuda npm cache clean --force, por qué verify suele ser mejor, y dónde están los ahorros de disco reales."
date: "2026-08-01"
---

`npm cache clean --force` es el primer comando al que recurre la mayoría cuando el uso de disco relacionado con npm se descontrola. Casi nunca es el correcto. Esto es lo que realmente contiene la caché de npm, qué libera limpiarla y dónde vive de verdad el espacio que estás buscando.

## Qué hay en la caché de npm

npm mantiene una caché direccionada por contenido en `~/.npm` (concretamente `~/.npm/_cacache`). Cada paquete tarball que npm ha descargado alguna vez se guarda ahí, junto con metadatos del registro. Su trabajo es hacer rápidas las instalaciones repetidas y permitir que las instalaciones funcionen sin conexión.

Mide la tuya:

```bash
du -sh ~/.npm
```

Los tamaños típicos van desde unos pocos cientos de megabytes hasta varios gigabytes en máquinas con historiales largos de npm.

Dos propiedades importan:

1. **Se autorrepara.** Los datos se verifican por checksum al salir; las entradas corruptas se vuelven a descargar automáticamente. Las razones históricas para limpiar la caché rutinariamente desaparecieron en gran parte con npm 5.
2. **Es compartida.** Una sola caché sirve a todos los proyectos. Borrarla ralentiza la siguiente instalación de todo.

## Qué hace realmente limpiarla

```bash
npm cache clean --force
```

Esto borra toda la caché. El flag `--force` es obligatorio precisamente porque el equipo de npm considera que la limpieza manual casi nunca es necesaria. Liberas el tamaño de `~/.npm` una vez, y luego las instalaciones empiezan a rellenarla de inmediato, cada una más lenta de lo que habría sido porque los tarballs deben volver a descargarse.

La herramienta más suave es:

```bash
npm cache verify
```

Esto comprueba la integridad, recolecta basura de datos innecesarios e informa de lo que recuperó, sin descartar entradas válidas. Si sientes que la caché está hinchada, ejecuta primero `verify`; a menudo recorta una parte considerable manteniendo las instalaciones rápidas.

## Cuándo clean --force es realmente lo correcto

- Estás recuperando espacio en una máquina que retiras del trabajo con JavaScript.
- La caché ha crecido más de lo que tu disco puede permitirse y aceptas instalaciones más lentas.
- Estás depurando una caché genuinamente corrupta que `verify` no puede arreglar (poco común).

Fuera de esos casos, la caché es una de las pocas partes del uso de disco de desarrollo que se gana su espacio a diario.

## Dónde está el espacio real

Aquí está la comparación que importa. En una máquina de desarrollo típica:

| Ubicación | Tamaño típico | Coste de borrarla |
|---|---|---|
| Caché de `~/.npm` | 0,5 a 3 GB | Instalaciones futuras más lentas |
| Todas las carpetas `node_modules` | 20 a 80 GB | Un `npm install` por proyecto revivido |
| Almacén de pnpm (si se usa) | 2 a 15 GB | Vuelve a descargarse tras la siguiente poda |

La caché suele ser la más pequeña de las tres y la única con un beneficio de rendimiento continuo. Las carpetas `node_modules` obsoletas son de diez a treinta veces más grandes y no te dan nada a cambio. Si tienes quince minutos para limpiar disco, la caché es el último lugar donde gastarlos. Empieza por [encontrar cada carpeta node_modules en tu Mac](/es/blog/find-node-modules-folders-mac), borra las obsoletas, y si usas pnpm, ejecuta `pnpm store prune` como se describe en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained).

Usuarios de yarn: la caché equivalente vive en `~/Library/Caches/Yarn` y se limpia con `yarn cache clean`; se aplica la misma lógica.

## Un orden de limpieza sensato para usuarios de npm

1. Borra las carpetas `node_modules` obsoletas de proyectos (la gran ganancia, totalmente recuperable).
2. Ejecuta `npm cache verify` (recorte gratuito, sin desventaja).
3. Recurre a `npm cache clean --force` solo cuando necesites el último gigabyte y aceptes el coste.

Si el paso 1 suena tedioso, esa es la parte que automatiza [TidyDisk](/es): un escaneo gratis muestra cada `node_modules` en tu Mac, medido y ordenado por antigüedad, y un clic envía los que elijas a la Papelera. La licencia de por vida de 19 euros se paga sola la primera vez que te ahorra hacer esta lista a mano.
