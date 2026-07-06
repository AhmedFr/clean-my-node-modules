---
title: "El almacén de pnpm explicado: adónde va realmente tu espacio en disco"
description: "Cómo funcionan el almacén de pnpm y los hard links, por qué du te miente sobre el tamaño de los proyectos, y cómo limpiar el almacén de forma segura."
date: "2026-07-18"
---

La característica estrella de pnpm es la eficiencia de disco: instala la misma dependencia en diez proyectos y se almacena en disco una sola vez. Cumple esa promesa, pero también hace que el uso de disco resulte genuinamente confuso. Las herramientas reportan tamaños que parecen contradictorios, la intuición de limpieza de npm deja de aplicarse, y el lugar donde realmente se fue tu espacio es una carpeta que la mayoría nunca ha abierto.

## El diseño de dos niveles

pnpm divide la instalación en dos capas:

1. **El almacén global**, en `~/Library/pnpm/store` en macOS (comprueba el tuyo con `pnpm store path`). Cada versión de cada paquete que has instalado alguna vez vive aquí exactamente una vez, almacenada por hash de contenido.
2. **El `node_modules` por proyecto**, que contiene casi ningún dato de archivo real. Los archivos dentro de `node_modules/.pnpm` son hard links que apuntan al almacén, y las entradas de nivel superior de tu `node_modules` son enlaces simbólicos hacia `.pnpm`.

Un hard link no es una copia. Es una segunda entrada de directorio para los mismos bytes en disco. Diez proyectos que enlazan mediante hard link el mismo paquete `react` comparten una copia física.

## Por qué du te engaña

Ejecuta `du -sh node_modules` en un proyecto pnpm y podrías ver 800 MB. Borra ese proyecto y quizás recuperes solo 40 MB. Ambos números son honestos; responden a preguntas distintas.

`du` cuenta el tamaño de cada archivo al que puede acceder. No sabe (a menos que compares recuentos de inodos en todo el disco) que 760 de esos megabytes son hard links compartidos con el almacén y posiblemente con otros cinco proyectos. Los bytes solo se liberan de verdad cuando desaparece la última referencia, y el almacén siempre mantiene una referencia hasta que lo podas.

Las consecuencias prácticas:

- **Borrar un solo proyecto pnpm libera poco.** El almacén sigue reteniendo todo.
- **Sumar `du` entre proyectos pnpm sobreestima muchísimo.** Los mismos bytes se cuentan una vez por proyecto.
- **El almacén en sí es donde viven los bytes reales.** Mídelo con `du -sh $(pnpm store path)`.

En APFS (el sistema de archivos por defecto de macOS) hay un segundo giro: los clones. Dos archivos pueden compartir almacenamiento sin siquiera compartir un inodo, lo que los hace invisibles tanto para `du` como para el conteo de hard links. Una contabilidad precisa en el macOS moderno es genuinamente difícil, y por eso las herramientas de disco ingenuas se equivocan tanto con las configuraciones de pnpm.

## Limpiar el almacén de la forma correcta

El almacén crece para siempre por defecto: cada versión de cada paquete que instalaste alguna vez se queda, incluidos los paquetes a los que ningún proyecto ya referencia. La limpieza incorporada:

```bash
pnpm store prune
```

Esto elimina paquetes a los que ningún proyecto enlaza actualmente. Es completamente seguro: todo lo que sigue siendo referenciado se conserva, y todo lo eliminado se volvería a descargar en la siguiente instalación que lo necesite. En una máquina con un año de historial de pnpm, una primera poda suele liberar varios gigabytes.

Dos comandos relacionados que vale la pena conocer:

```bash
pnpm store path     # ¿dónde está mi almacén?
pnpm store status   # verificar la integridad del almacén
```

## Qué significa esto para la estrategia de limpieza

Si eres usuario de pnpm, las prioridades de limpieza se invierten respecto a npm:

1. **Poda el almacén primero.** Ahí es donde se concentra el peso muerto.
2. **Luego borra los `node_modules` obsoletos de proyectos.** Cada uno libera de inmediato sus archivos no compartidos y libera referencias para que la siguiente poda pueda liberar más.
3. **No confíes en los números de `du` por proyecto.** Son límites superiores, a menudo poco ajustados.

El orden importa: borrar proyectos y luego podar libera más, porque la poda solo puede eliminar aquello a lo que ya nadie enlaza.

Este problema de medición es también una de las razones por las que construimos [TidyDisk](/es) como lo hicimos. Entiende la organización de pnpm: mide el contenido real del almacén en vez de duplicar hard links entre proyectos, así que los gigabytes que reporta son gigabytes que de verdad recuperas. El escaneo es gratis, y la limpieza siempre va a la Papelera, nunca mediante `rm -rf`, un hábito que explicamos en [Por qué nunca deberías usar rm -rf node_modules](/es/blog/never-rm-rf-node-modules).

## La conclusión

pnpm ahorra espacio en disco de verdad, a menudo de forma drástica. Pero reubica el problema en vez de eliminarlo: el almacén acumula cada versión de paquete para siempre hasta que lo podas, y las herramientas de medición estándar no pueden ver a través de los hard links. Aprende `pnpm store prune`, ejecútalo después de borrar proyectos antiguos, y sospecha de cualquier herramienta que reporte tamaños de proyectos pnpm sin mencionar el almacén.

¿Quieres ver tu número real? [TidyDisk](/es) muestra tu almacén, cada proyecto y cada `node_modules` obsoleto en una sola lista, gratis para escanear, 19 euros una vez si quieres la limpieza con un clic.
