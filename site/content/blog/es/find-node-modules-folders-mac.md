---
title: "Cómo encontrar cada carpeta node_modules en tu Mac"
description: "Comandos de terminal para localizar y medir cada carpeta node_modules en macOS, ordenarlas por tamaño y antigüedad, y decidir qué borrar."
date: "2026-07-25"
---

Antes de poder limpiar, necesitas saber qué hay. La mayoría de desarrolladores calcula que tiene "unas pocas" carpetas `node_modules` y descubre que son docenas. Esta guía te da los comandos exactos para encontrarlas todas, medirlas y clasificarlas según lo seguro que sea borrarlas.

## La búsqueda básica

Empieza desde la carpeta donde viven tus proyectos (ajusta `~/code` a tu organización):

```bash
find ~/code -name node_modules -type d -prune
```

El flag `-prune` importa: evita que `find` descienda dentro de cada `node_modules` que encuentra, con lo que se saltan los `node_modules` anidados dentro de las dependencias (esos desaparecen con su padre de todos modos) y el comando se vuelve mucho más rápido.

Si tus proyectos están dispersos, busca en toda tu carpeta de usuario. Espera que esto tarde un rato en un disco grande:

```bash
find ~ -name node_modules -type d -prune 2>/dev/null
```

El `2>/dev/null` oculta los errores de permisos de carpetas del sistema que de todos modos no puedes leer.

## Añade los tamaños

Canaliza cada resultado a través de `du`:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh
```

`sort -rh` pone las carpetas más grandes arriba. En una máquina con un año de trabajo activo en JavaScript, la parte superior de esta lista suele ser un shock: carpetas individuales de 800 MB a 2 GB, y totales de decenas de gigabytes.

Para el número total único:

```bash
find ~/code -name node_modules -type d -prune -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {printf "%.1f GB\n", s/1048576}'
```

Una advertencia si usas pnpm: los hard links hacen que estos números se sobreestimen, a veces mucho. Los bytes se comparten con el almacén global, y borrar un proyecto libera menos de lo que sugiere `du`. Los detalles están en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained).

## Clasifica por antigüedad

El tamaño te dice qué merece la pena borrar; la antigüedad te dice qué es seguro. Un `node_modules` que no has tocado en seis meses pertenece a un proyecto al que probablemente no volverás pronto, y reinstalarlo más tarde cuesta un solo `npm install`.

Esto lista cada carpeta de proyecto con la última vez que se modificó algo dentro del proyecto (excluyendo el propio `node_modules`):

```bash
for nm in $(find ~/code -name node_modules -type d -prune); do
  proj=$(dirname "$nm")
  last=$(find "$proj" -path "$proj/node_modules" -prune -o -type f -newer "$nm" -print -quit 2>/dev/null)
  mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$proj")
  size=$(du -sh "$nm" 2>/dev/null | cut -f1)
  echo "$mod  $size  $proj"
done | sort
```

Cualquier entrada en la parte alta de esa lista (empezando por las más antiguas) con una columna de tamaño abultada es un candidato principal. Borrar es seguro porque `node_modules` siempre se puede reproducir a partir del archivo de bloqueo, como se explica en [Cómo borrar node_modules de forma segura](/es/blog/how-to-delete-node-modules-safely).

## El problema del mantenimiento

Estos comandos funcionan. El problema es que la limpieza de disco no es un evento único. Aparecen proyectos nuevos, los viejos quedan obsoletos, y dentro de tres meses esos mismos gigabytes vuelven a estar ahí. Nadie vuelve a ejecutar un bucle de shell de cinco líneas de forma programada.

Esa brecha entre "posible en la terminal" y "realmente ocurre" es exactamente lo que cierra [TidyDisk](/es). Vive en la barra de menús de macOS y mantiene la respuesta al día: cada carpeta `node_modules`, su tamaño real (consciente de pnpm, así que sin duplicar por hard links) y cuán obsoleto está su proyecto, ordenado y listo. Cuando el total supera un umbral que te importa, lo ves sin preguntar.

## Decide, luego borra

Sea cual sea la ruta que tomes, el marco de decisión es el mismo:

1. **Proyectos activos (tocados esta semana): conserva.** El coste de reinstalar sería molesto.
2. **Proyectos recientes (tocados este mes): conserva a menos que sean enormes.**
3. **Todo lo demás más antiguo: borra.** Si vuelves al proyecto algún día, `npm install` reconstruye todo en un minuto o dos.

Y cuando borres, prefiere la Papelera antes que `rm -rf`. La Papelera no cuesta nada y convierte una ruta mal escrita de un desastre a un no-evento.

Ejecuta el escaneo gratuito en [TidyDisk](/es) y tendrás tu número completo y honesto en un minuto aproximadamente. La mayoría de los primeros escaneos encuentran 20+ GB. Recuperarlo es un clic con una licencia de por vida de 19 euros.
