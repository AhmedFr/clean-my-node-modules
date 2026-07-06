---
title: "Liberar espacio en disco en un Mac: la lista de tareas del desarrollador"
description: "Una lista priorizada para desarrolladores: node_modules, cachés de paquetes, basura de Xcode, imágenes de Docker y cachés de navegador, con comandos reales."
date: "2026-08-08"
---

Los Mac de desarrollo se llenan de forma distinta a los Mac normales. Los consejos habituales (vaciar la Papelera, limpiar Descargas, subir fotos a la nube) apenas hacen mella en el problema, porque el peso está en sitios que Finder nunca te muestra. Esta es la lista que realmente usamos, ordenada por gigabytes por minuto de esfuerzo.

## 1. Carpetas node_modules obsoletas (normalmente la mayor ganancia)

Si haces trabajo de JavaScript, empieza aquí. Cada proyecto que has clonado alguna vez mantiene una carpeta de dependencias de 200 MB a 1,5 GB hasta que la borras, y todo es reproducible desde el archivo de bloqueo con un `npm install`.

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

Borra las que pertenezcan a proyectos que no has tocado en dos meses. Las instrucciones completas y notas de seguridad están en [Cómo borrar node_modules de forma segura](/es/blog/how-to-delete-node-modules-safely), y [TidyDisk](/es) automatiza todo el ciclo desde tu barra de menús si prefieres no hacerlo a mano. Recuperación típica: **10 a 50 GB**.

## 2. Almacenes y cachés de gestores de paquetes

```bash
pnpm store prune        # pnpm: elimina paquetes sin referencias
npm cache verify        # npm: recolecta basura de la caché de forma segura
yarn cache clean        # yarn clásico: limpia ~/Library/Caches/Yarn
```

Los usuarios de pnpm deberían podar después de borrar proyectos antiguos, no antes, para que la poda pueda liberar todo lo que esos proyectos borrados estaban referenciando (detalles en [El almacén de pnpm explicado](/es/blog/pnpm-store-explained)). Recuperación típica: **2 a 10 GB**.

## 3. Xcode: el otro agujero negro

Aunque solo compiles una app de iOS de vez en cuando, Xcode acumula cantidades asombrosas de estado derivado:

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/iOS\ DeviceSupport 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator
```

- **DerivedData** es una caché de compilación; borrarla cuesta una recompilación lenta. A menudo 5 a 20 GB.
- **iOS DeviceSupport** guarda símbolos de depuración de cada versión de iOS de cada dispositivo que hayas conectado alguna vez. Las versiones antiguas son peso muerto.
- **Simuladores**: `xcrun simctl delete unavailable` elimina simuladores de runtimes que ya no tienes.

Recuperación típica: **10 a 40 GB** en máquinas que compilan para plataformas Apple.

## 4. Docker

La imagen de disco de Docker Desktop crece y rara vez se reduce por sí sola:

```bash
docker system df                 # ver qué se está usando
docker system prune -a --volumes # eliminar imágenes, contenedores y volúmenes no usados
```

Lee la advertencia antes de ejecutar el segundo comando: `-a` elimina todas las imágenes no adjuntas a un contenedor en ejecución, y `--volumes` elimina volúmenes sin referencias, incluidos datos que podrías querer conservar. Poda sin `--volumes` primero si tienes dudas. Recuperación típica: **5 a 30 GB**.

## 5. Homebrew

```bash
brew cleanup -s
du -sh $(brew --cache)
```

Homebrew conserva versiones antiguas y descargas; `cleanup -s` limpia ambas. Recuperación típica: **1 a 5 GB**.

## 6. Todo lo demás que vale la pena revisar

```bash
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -15
```

Hallazgos frecuentes: cachés de navegador, cachés de apps de Slack y Electron, imágenes antiguas de emuladores de iOS/Android de proyectos paralelos, `~/Library/Caches/Google/AndroidStudio*`, y gigabytes de cachés de módulos de `pip`/`cargo`/`go` (`pip cache purge`, `cargo cache -a` con la herramienta cargo-cache, `go clean -modcache`).

## El orden importa

Trabaja la lista de arriba abajo. Los dos primeros elementos son puro estado recuperable con coste casi cero; los elementos de Xcode y Docker cuestan una recompilación o una nueva descarga; la limpieza de cachés más profundas cambia velocidad futura por espacio. Para cuando tengas el margen que necesitas.

## Mantenerlo limpio

La verdad incómoda sobre la limpieza de disco es que es una suscripción, no una compra. Seis semanas después de una sesión heroica de limpieza, las mismas carpetas vuelven a pesar. Las listas de tareas no se ejecutan solas.

Para la parte del problema con forma de JavaScript (que suele ser la mayor), [TidyDisk](/es) convierte la lista de tareas en un vistazo: vive en la barra de menús, rastrea continuamente cada carpeta `node_modules` y tu almacén de pnpm, y limpia lo que elijas con un clic, siempre a la Papelera. El escaneo es gratis y tarda un minuto aproximadamente; ver tu número suele ser motivación suficiente.
