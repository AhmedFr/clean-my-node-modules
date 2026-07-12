import type { Dictionary } from "../i18n.types";

// Spanish dictionary. Reproduces the same JSX structure as en.tsx; only the
// visible text is translated. No em dashes anywhere.
export const es: Dictionary = {
  meta: {
    title:
      "TidyDisk: descubre qué ocupa el disco de tu Mac de desarrollo y recupéralo con un clic",
    description:
      "TidyDisk vive en la barra de menús de macOS y te muestra el coste real de tus proyectos: cada carpeta node_modules, tu almacén de pnpm y todos los paquetes instalados. Escaneo gratis. Limpieza con un clic con licencia de por vida por 19 euros. De forma segura, a la Papelera, nunca con rm -rf.",
    blogTitle: "Blog de TidyDisk: mantén limpio el disco de desarrollo",
    blogDescription:
      "Guías prácticas sobre limpieza de node_modules, uso de disco de gestores de paquetes y cómo recuperar espacio en un Mac de desarrollador. De los creadores de TidyDisk.",
    ogAlt:
      "TidyDisk: la app de la barra de menús de macOS que recupera el disco que ocupan tus proyectos de desarrollo",
  },

  nav: {
    features: "Funciones",
    packages: "Paquetes",
    why: "Por qué",
    how: "Cómo funciona",
    download: "Descargar",
    blog: "Blog",
    github: "GitHub",
    getApp: "Consigue la app",
  },

  hero: {
    eyebrow: "App de barra de menús de macOS · escaneo gratis",
    heading: (
      <>
        Un <span className="text-accent">disco ordenado</span>, sin
        pensar en ello.
      </>
    ),
    body: (
      <>
        El trabajo de desarrollo devora tu Mac en silencio: proyectos
        antiguos, dependencias pesadas, experimentos olvidados. TidyDisk
        vigila desde la barra de menús y te devuelve el espacio con un
        clic. De forma segura, a la Papelera, nunca con{" "}
        <code>rm -rf</code>.
      </>
    ),
    downloadCta: "Descargar para macOS",
    githubCta: "Ver en GitHub",
    micro: "Licencia MIT · macOS 13+ · Apple Silicon e Intel",
  },

  band: {
    statement: (
      <>
        <code>node_modules</code> es el objeto más pesado del universo
        conocido. <em>Te ayudamos a borrarlo.</em>
      </>
    ),
  },

  features: [
    {
      tagline: "Siempre vigilando",
      heading: "Vigila tu disco para que tú no tengas que hacerlo.",
      body: "TidyDisk vive en tu barra de menús y vuelve a escanear según tu horario: cada 6 horas, a diario o cada semana. Una notificación nativa aparece en cuanto tus node_modules superan el límite que has fijado.",
      bullets: [
        "Escaneos en segundo plano cada 6 horas, a diario o cada semana",
        "Un umbral que fijas tú, en gigabytes claros",
        "Un vistazo a la barra de menús te dice cómo estás",
      ],
    },
    {
      tagline: "Claridad total",
      heading: "Cada dependencia muerta, ordenada.",
      body: "Abre el lanzador completo para una limpieza a fondo. Búsqueda al estilo Spotlight por nombre y ruta de proyecto, con cada carpeta node_modules mostrando su tamaño real y cuánto hace que no la tocas. Los más grandes y más olvidados suben a lo más alto.",
      bullets: [
        "Ordena por último uso, tamaño o nombre del proyecto",
        "Navegación completa por teclado: ↑↓ para moverte, ↵ para abrir, ⌘⌫ para eliminar",
        "En pnpm, los bytes reales que liberarías, aparte de lo enlazado al almacén compartido",
        "Muestra en Finder o abre en tu editor, a una tecla de distancia",
      ],
    },
    {
      tagline: "Recompensa segura",
      heading: "Un clic. Gigabytes de vuelta. Nada perdido.",
      body: (
        <>
          Elige lo que no necesitas y va a la Papelera. Sin terminal, sin
          ruleta de <code>rm -rf</code>, recuperable hasta que la
          vacíes. Observa cómo baja el medidor y sube tu espacio libre.
          ¿Necesitas un proyecto de nuevo? Un simple{" "}
          <code>npm install</code> lo trae de vuelta al instante.
        </>
      ),
      bullets: [
        <>
          Elimina a la Papelera: recuperable, nunca con <code>rm -rf</code>
        </>,
        "Elimina una carpeta o barre todas las obsoletas de una vez",
        "Solo toca node_modules, nunca tu código fuente",
      ],
    },
    {
      tagline: "Vista de toda la máquina",
      heading: "Cada paquete que has instalado, en una sola lista.",
      body: "Abre la pestaña Paquetes para un inventario de todo el equipo con cada dependencia que usan tus proyectos: cuántos la usan, su tamaño, las versiones que tienes, la última en npm y cualquier aviso de seguridad. Detecta lo pesado y lo que no usas, unifica versiones que se han dispersado y ve qué está marcado, todo desde proyectos que ya has escaneado.",
      bullets: [
        "Cuántos proyectos usan cada paquete, y su tamaño real",
        <>
          Una insignia de <b>unificar</b> cuando un paquete está instalado
          en varias versiones
        </>,
        "Etiquetas de última versión en npm y avisos de seguridad. Despliega una fila para ver la gravedad por versión",
      ],
    },
  ],

  grid: {
    kicker: "Todo en un solo menú",
    heading: (
      <>
        App pequeña. <span className="text-accent">Gran alivio.</span>
      </>
    ),
    lead: "Tus escaneos se quedan en tu Mac. Solo analíticas de uso anónimas, con opción de desactivarlas en un clic desde Ajustes. Una utilidad discreta que mantiene tu disco honesto.",
    cards: [
      {
        title: "Poda el almacén de pnpm",
        copy: "Recupera las versiones muertas del almacén compartido con un clic seguro. Nunca elimina el almacén en sí.",
      },
      {
        title: "Tamaño real frente a enlazado",
        copy: "En pnpm, ve los bytes que realmente liberarías aparte de lo enlazado al almacén compartido.",
      },
      {
        title: "Avisos de seguridad",
        copy: "Una insignia de gravedad en cualquier paquete con una vulnerabilidad conocida, según la base de datos de avisos de npm.",
      },
      {
        title: "Escaneos programados",
        copy: "Se ejecuta cada 6 horas, a diario o cada semana, siempre en segundo plano.",
      },
      {
        title: "Alertas de umbral",
        copy: "Fija un límite en gigabytes y recibe un aviso en el instante en que lo superas.",
      },
      {
        title: "Medidor de disco en píxeles",
        copy: "Una barra fácil de leer que se llena y enrojece a medida que se acumulan tus dependencias.",
      },
      {
        title: "Mostrar en Finder",
        copy: "Salta directo a cualquier carpeta de proyecto sin soltar el teclado.",
      },
      {
        title: "Abrir en tu editor",
        copy: "Una pulsación abre el proyecto en el editor que ya usas.",
      },
      {
        title: "Detección de framework",
        copy: "React, Next, Vue, Svelte, Node, Expo: cada proyecto, etiquetado correctamente.",
      },
    ],
    comingSoonPill: "Próximamente",
    comingSoonText: (
      <>
        Cachés de npm, yarn y bun, además de artefactos de compilación
        por proyecto como <code>.next</code> y <code>dist</code>.
      </>
    ),
  },

  why: {
    kicker: "Por qué se acumula",
    heading: (
      <>
        El ciclo de vida de <span className="text-accent">node_modules</span>.
      </>
    ),
    lead: "Cada instalación escribe tus dependencias en el disco. Cuánto se acumulan, y cuánto puedes recuperar, depende de tu gestor de paquetes.",
    npmTag: "una copia completa por proyecto",
    pnpmTag: "un almacén compartido",
    npmNote: (
      <>
        Cada proyecto recibe su <b>propia copia completa</b> de cada
        dependencia. Instala <code>lodash</code> en diez proyectos y se
        escribe en disco <b>diez veces</b>. Multiplica eso por cientos de
        paquetes transitivos y los proyectos antiguos que olvidaste, y
        estás a decenas de gigabytes de profundidad.
      </>
    ),
    pnpmNote: (
      <>
        pnpm mantiene <b>un almacén global</b> y enlaza cada proyecto a
        él mediante hard links. Una versión concreta de un paquete vive
        en disco <b>una sola vez</b>, sin importar cuántos proyectos la
        usen, un ahorro enorme. <b>Pero el almacén sigue creciendo</b>{" "}
        a medida que llegan versiones nuevas y las viejas se quedan.
      </>
    ),
    storeLabel: "· almacenado una vez",
    footNote: (
      <>
        TidyDisk actúa <b>en los dos frentes</b>: envía a la papelera el{" "}
        <code>node_modules</code> obsoleto que nunca volverás a{" "}
        <code>npm install</code>, <b>y</b> poda de forma segura tu
        almacén de pnpm de versiones a las que ya nadie enlaza, con un
        clic en la pestaña <b>Cachés</b> (nunca elimina el almacén en
        sí).
      </>
    ),
    sizingNote: (
      <>
        Por eso los tamaños parecen pequeños en pnpm: TidyDisk cuenta el
        almacén compartido <b>una sola vez</b> y te muestra lo que
        realmente puedes liberar, no los mismos bytes enlazados en una
        docena de proyectos.
      </>
    ),
  },

  how: {
    kicker: "Cómo funciona",
    heading: (
      <>
        Tres pasos hacia un <span className="text-accent">Mac más ligero.</span>
      </>
    ),
    steps: [
      {
        num: "01",
        title: "Consíguela y escanea",
        body: "Descarga la .app firmada, o clona el repositorio y compila la tuya. El primer escaneo mapea cada carpeta node_modules de tu disco.",
        cmd: (
          <>
            <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
            package
          </>
        ),
      },
      {
        num: "02",
        title: "Fija tu límite",
        body: "Elige un umbral en gigabytes y con qué frecuencia volver a escanear: cada 6 horas, a diario o cada semana. Eso es toda la configuración.",
        cmd: (
          <>
            <span className="pmt">límite</span> 5 GB ·{" "}
            <span className="pmt">escaneo</span> diario
          </>
        ),
      },
      {
        num: "03",
        title: "Limpia con un clic",
        body: "Cuando superes el límite, revisa las carpetas obsoletas (o poda el almacén de pnpm, o audita un paquete pesado) y recupera el espacio. Tu disco te lo agradecerá.",
        cmd: (
          <>
            <span className="pmt">↵</span> 2.71 GB movidos a la Papelera
          </>
        ),
      },
    ],
  },

  download: {
    kicker: "Descargar",
    heading: (
      <>
        Escaneo gratis. <span className="text-accent">19 euros para limpiar.</span>
      </>
    ),
    lead: "El escaneo es gratis para siempre y el código es MIT en GitHub. La limpieza con un clic es una licencia de por vida de pago único: precio de lanzamiento 19 euros, luego 29 tras el lanzamiento. 30 días de garantía de devolución, sin preguntas.",
    free: {
      name: (
        <>
          <span className="text-accent">0 €</span> · Escanea todo
        </>
      ),
      desc: "El escaneo, gratis para siempre.",
      bullets: [
        "Descarga y ejecuta, sin configuración necesaria",
        "Ve cada carpeta node_modules, caché y paquete de tu equipo",
        "Sin cuenta, nunca",
      ],
      cta: "Descargar para macOS",
    },
    pro: {
      badge: "Precio de lanzamiento",
      name: (
        <>
          <span className="text-accent">19 €</span> · Limpieza de por vida
        </>
      ),
      desc: "Licencia de pago único, desbloquea la limpieza para siempre.",
      bullets: [
        "Eliminación con un clic, directa a la Papelera",
        "Limpia lo obsoleto: barre todos los node_modules obsoletos a la vez",
        "Poda tu almacén de pnpm con un clic",
        "Todas las actualizaciones futuras incluidas",
        "Clave de licencia al instante, entregada vía Polar",
        "Precio de lanzamiento: 19 euros ahora, 29 euros tras el lanzamiento",
      ],
      cta: "Comprar TidyDisk · 19 €",
    },
  },

  finalCta: {
    heading: (
      <>
        Deja de acumular
        <br />
        node_modules.
      </>
    ),
    body: "Recupera los gigabytes que tus dependencias han estado acumulando. Escaneo gratis, desbloquea la limpieza por 19 euros.",
    downloadCta: "Descargar escaneo gratis",
    buyCta: "Comprar · 19 €",
  },

  footer: {
    tagline: "La app de barra de menús que evita que la basura de desarrollo devore tu Mac.",
    productHead: "Producto",
    openSourceHead: "Código abierto",
    legalHead: "Legal",
    links: {
      feature: "Funciones",
      how: "Cómo funciona",
      download: "Descargar",
      blog: "Blog",
      repo: "Repositorio en GitHub",
      issues: "Incidencias",
      releases: "Versiones",
      privacy: "Política de privacidad",
      legal: "Aviso legal",
      cookies: "Preferencias de cookies",
    },
    copyright: "© 2026 TidyDisk · Licencia MIT",
    platform: "macOS 13+ · Apple Silicon e Intel",
  },

  blog: {
    eyebrow: "blog",
    listTitle: (
      <>
        Mantén el disco de desarrollo <span className="text-accent">limpio</span>
      </>
    ),
    listLead:
      "Guías prácticas sobre node_modules, el funcionamiento interno de los gestores de paquetes y cómo recuperar espacio en disco. Un artículo nuevo cada semana.",
    readArticle: "Leer artículo",
    backToArticles: "← Todos los artículos",
    byline: "TidyDisk team",
    ctaTitle: "Descubre cuánto cuestan realmente tus proyectos",
    ctaBody:
      "TidyDisk escanea tu Mac gratis y muestra cada carpeta node_modules, con su tamaño y clasificación. La limpieza es un clic, siempre a la Papelera.",
    ctaButton: "Descargar para macOS",
  },
};
