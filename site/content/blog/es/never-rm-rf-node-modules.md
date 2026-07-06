---
title: "Por qué nunca deberías usar rm -rf node_modules (usa la Papelera)"
description: "rm -rf no tiene deshacer, y limpiar node_modules es justo donde ocurren los errores por cansancio. El argumento a favor del borrado a la Papelera, con comandos."
date: "2026-08-29"
---

`rm -rf node_modules` es uno de los comandos más escritos en el desarrollo de JavaScript. Funciona, es rápido, y aproximadamente una vez en cada carrera profesional destruye algo que importaba. Este artículo es el argumento para romper el hábito, y qué escribir en su lugar.

## El modo de fallo no es hipotético

`rm -rf` borra de inmediato, de forma recursiva, silenciosa y permanente. No hay confirmación, no hay deshacer, y no hay recuperación salvo herramientas forenses o copias de seguridad. Combinado con el autocompletado de la shell y la memoria muscular, los accidentes clásicos se ven así:

```bash
rm -rf node_modules   # bien, en el directorio correcto
rm -rf node_module s  # un espacio: borra node_module Y s, o da error si tienes suerte
rm -rf ./node_modules # ¿escrito en ~ en vez del proyecto? nada te detiene
rm -rf $DIR/node_modules  # $DIR sin definir: esto es rm -rf /node_modules
```

El caso de la variable sin definir ha quemado a suficiente gente como para ser un cliché. Ninguno de estos son problemas de habilidad; son problemas de cansancio, y todo el mundo está cansado alguna vez. El radio de impacto del comando es ilimitado y su velocidad es instantánea, exactamente la combinación equivocada para una tarea rutinaria.

## La Papelera existe para esto

macOS ha tenido un borrado recuperable durante cuarenta años. Los archivos en la Papelera no te cuestan nada hasta que la vacías, y han salvado incontables errores. Las herramientas de desarrollo mayormente la ignoran porque la ruta de estilo POSIX (`rm`) es anterior a ella y porque escribir a la Papelera desde un script cuesta una línea más. Es un mal trato: todo el sentido de borrar `node_modules` es que sea de bajo riesgo, y el borrado a la Papelera es lo que realmente lo hace de bajo riesgo incluso cuando eliges la carpeta equivocada.

Opciones de línea de comandos en macOS:

```bash
# Finder vía AppleScript (funciona en todas partes, sin instalar nada)
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'

# Herramienta de Homebrew, mejor ergonomía
brew install trash
trash node_modules
```

En versiones modernas de macOS también hay un comando `trash` nativo en algunas ediciones; `brew install trash` cubre el resto. Ambas te dan el mismo contrato: el borrado es instantáneo desde el punto de vista de tu proyecto, y reversible desde el tuyo.

Si quieres que el hábito se quede, créate un alias:

```bash
alias rmnm='trash ./node_modules && echo "node_modules movido a la Papelera"'
```

## "Pero node_modules es desechable de todos modos"

Cierto, [y por eso borrarlo es seguro](/es/blog/how-to-delete-node-modules-safely): todo vuelve con `npm install`. El argumento aquí no trata de `node_modules` en sí. Trata de lo que hay al lado cuando tus dedos resbalan. La carpeta que querías escribir, la carpeta hermana que agarró el autocompletado, la ruta que una variable no rellenó. El borrado a la Papelera significa que el peor caso de una sesión de limpieza es sacar una carpeta de vuelta arrastrándola, en vez de explicarte a ti mismo dónde fueron a parar tres semanas de una rama sin subir.

Hay también un punto más sutil: los hábitos se transfieren. Las manos que escriben `rm -rf node_modules` a diario son las mismas manos que un día escribirán `rm -rf` junto a algo irremplazable. Hacer del borrado recuperable tu opción por defecto es un seguro barato para todo lo que haces.

## ¿Y el espacio en disco?

Los archivos en la Papelera siguen ocupando disco hasta que la vacías, y si estás limpiando para liberar espacio, eso importa. El flujo de trabajo sigue siendo mejor que rm: borra a la Papelera, confirma que tus proyectos están bien, y luego vacía la Papelera de forma deliberada (o deja que el autovaciado de 30 días de macOS lo haga). Separar "quitar del proyecto" de "destruir los bytes" es precisamente lo que hace el proceso seguro.

## Nuestro sesgo, dicho con claridad

Construimos [TidyDisk](/es) en torno a este principio: cada limpieza que realiza pasa por la Papelera de macOS, nunca por `rm -rf`, sin excepciones. Encuentra cada `node_modules` en tu Mac, muestra tamaños reales (incluyendo [una contabilidad honesta de pnpm](/es/blog/pnpm-store-explained)), y limpia lo que elijas con un clic que puedes deshacer. El escaneo es gratis; la limpieza con un clic es una licencia de por vida de 19 euros.

Ya sea que lo instales o no, adopta el hábito: en un Mac, un borrado que puedes deshacer es estrictamente mejor que un borrado que no puedes. Crea el alias de `trash`, retira `rm -rf` de tu rotación diaria, y guárdalo para el raro día en que de verdad lo necesites.
