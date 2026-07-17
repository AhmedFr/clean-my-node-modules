import type { Dictionary } from "../i18n.types";

// French dictionary. Translates every field of the English reference
// (`en.tsx`) with native-quality French, reproducing the same element
// structure (same tags, same accent spans, same `<code>`, `<b>`, `<br/>`,
// bullet array lengths). Only the human-readable text changes.
export const fr: Dictionary = {
  meta: {
    title:
      "TidyDisk : voyez ce qui dévore le disque de vos projets, récupérez-le en un clic",
    description:
      "TidyDisk vit dans la barre de menu macOS et révèle ce que vos projets de dev coûtent vraiment : chaque dossier node_modules, votre store pnpm et les caches des gestionnaires de paquets, les images et volumes Docker, et chaque package installé. Scan gratuit. Nettoyage en un clic avec une licence à vie à 19 euros. En toute sécurité, vers la Corbeille, jamais rm -rf.",
    blogTitle: "Le blog TidyDisk : garder un disque de dev propre",
    blogDescription:
      "Guides pratiques sur le nettoyage de node_modules, l'usage disque des gestionnaires de paquets, et la récupération d'espace sur un Mac de développeur.",
    ogAlt:
      "TidyDisk : l'application de barre de menu macOS qui récupère l'espace disque que vos projets de dev vous coûtent",
  },

  nav: {
    features: "Fonctionnalités",
    packages: "Packages",
    why: "Pourquoi",
    how: "Comment ça marche",
    download: "Télécharger",
    blog: "Blog",
    github: "GitHub",
    getApp: "Obtenir l'app",
  },

  hero: {
    eyebrow: "App de barre de menu macOS · scan gratuit",
    heading: (
      <>
        Un <span className="text-accent">disque propre</span>, sans y penser.
      </>
    ),
    body: (
      <>
        Le travail de dev grignote votre Mac en silence :{" "}
        <code>node_modules</code> lourds, images Docker, caches de build,
        expériences oubliées. TidyDisk veille depuis la barre de menu et vous
        rend l’espace en un clic. En toute sécurité, vers la Corbeille,
        jamais <code>rm -rf</code>.
      </>
    ),
    downloadCta: "Télécharger pour macOS",
    githubCta: "Voir sur GitHub",
    micro: "Licence MIT · macOS 13+ · Apple Silicon & Intel",
  },

  band: {
    statement: (
      <>
        <code>node_modules</code> est l’objet le plus lourd de l’univers
        connu. Mais il n’est pas seul : images Docker, caches de build et
        projets morts s’accumulent aussi.{" "}
        <em>TidyDisk nettoie tout ça.</em>
      </>
    ),
  },

  areas: {
    kicker: "Un seul outil, tout le bazar du dev",
    heading: (
      <>
        Quatre endroits où votre disque se remplit{" "}
        <span className="text-accent">en silence.</span>
      </>
    ),
    lead: "TidyDisk surveille les quatre et vous rend l’espace, en toute sécurité.",
    cards: [
      {
        title: "Projects",
        copy: "De lourds node_modules obsolètes, classés par les octets réels que vous libéreriez.",
      },
      {
        title: "Caches",
        copy: "Votre store pnpm et le cache de build Docker, purgés en un clic sans risque.",
      },
      {
        title: "Packages",
        copy: "Un inventaire des dépendances à l'échelle de la machine : dérive de versions, doublons et alertes de sécurité.",
      },
      {
        title: "Docker",
        copy: "Images, volumes, conteneurs et cache de build, regroupés par le projet auquel ils appartiennent.",
      },
    ],
  },

  features: [
    {
      tagline: "Toujours en veille",
      heading: "Il surveille votre disque pour que vous n'ayez pas à le faire.",
      body: "TidyDisk vit dans votre barre de menu et relance un scan selon votre planning : toutes les 6 heures, chaque jour, ou chaque semaine. Une notification native apparaît dès que vos node_modules dépassent le seuil que vous avez fixé.",
      bullets: [
        "Scans en arrière-plan toutes les 6 heures, chaque jour, ou chaque semaine",
        "Un seuil que vous fixez, en gigaoctets tout simples",
        "Un coup d'œil à la barre de menu suffit pour savoir où vous en êtes",
      ],
    },
    {
      tagline: "Clarté totale",
      heading: "Chaque dépendance morte, classée.",
      body: "Ouvrez le lanceur complet pour un grand nettoyage. Une recherche façon Spotlight sur les noms et chemins de projets, avec chaque dossier node_modules affichant sa taille réelle et le temps écoulé depuis que vous y avez touché. Les plus gros, les plus vieux remontent en tête.",
      bullets: [
        "Trier par dernière utilisation, taille, ou nom de projet",
        "Navigation clavier complète : ↑↓ pour se déplacer, ↵ pour ouvrir, ⌘⌫ pour supprimer",
        "Sous pnpm, les octets réels que vous libéreriez, en dehors de ce qui est lié au store partagé",
        "Révéler dans le Finder ou ouvrir dans votre éditeur, à une touche près",
      ],
    },
    {
      tagline: "Bénéfice sans risque",
      heading: "Un clic. Des gigaoctets récupérés. Rien de perdu.",
      body: (
        <>
          Choisissez ce dont vous n&apos;avez plus besoin et ça part à la
          Corbeille. Pas de terminal, pas de roulette russe au{" "}
          <code>rm -rf</code>, récupérable tant que vous ne la videz pas.
          Regardez la jauge baisser et votre espace libre grimper. Besoin
          d&apos;un projet à nouveau ? Un simple <code>npm install</code> le
          ramène aussitôt.
        </>
      ),
      bullets: [
        <>
          Supprime vers la Corbeille : récupérable, jamais{" "}
          <code>rm -rf</code>
        </>,
        "Supprimer un seul dossier ou balayer tous les vieux d'un coup",
        "Ne touche jamais qu'à node_modules, jamais à votre code source",
      ],
    },
    {
      tagline: "Vue de la machine entière",
      heading: "Tous les packages que vous avez installés, dans une seule liste.",
      body: "Ouvrez l'onglet Packages pour un inventaire de toutes les dépendances que vos projets utilisent, sur toute la machine : combien de projets s'en servent, sa taille, les versions que vous avez, la dernière version sur npm, et les alertes de sécurité éventuelles. Repérez ce qui est lourd et inutilisé, unifiez les versions qui ont dérivé, et voyez ce qui est signalé, le tout depuis les projets déjà scannés.",
      bullets: [
        "Combien de projets utilisent chaque package, et sa taille réelle",
        <>
          Un badge <b>unifier</b> quand un package est installé en plusieurs
          versions
        </>,
        "Pastilles dernière version npm et alerte de sécurité. Développez une ligne pour la sévérité par version",
      ],
    },
    {
      tagline: "Au-delà de node_modules",
      heading: "Votre espace Docker, regroupé par projet.",
      body: "Docker accumule discrètement des gigaoctets dans les images, volumes, conteneurs et le cache de build. Ouvrez l'onglet Docker pour le voir regroupé par le projet auquel appartient chaque ressource, avec les vrais logos, tailles et badges d’utilisation. Récupérez les images orphelines, les conteneurs arrêtés et les volumes inutilisés en un clic, avec les mêmes confirmations sécurisées que le reste de TidyDisk.",
      bullets: [
        "Images, volumes, conteneurs et cache de build, chacun avec sa taille réelle",
        <>
          Ressources <b>regroupées par projet</b> à partir des labels Compose
          et des liens d’utilisation
        </>,
        "Confirmations sûres et typées avant toute suppression définitive",
      ],
    },
  ],

  grid: {
    kicker: "Tout dans un seul menu",
    heading: (
      <>
        Petite app. <span className="text-accent">Grand soulagement.</span>
      </>
    ),
    lead: "Vos scans restent sur votre Mac. Analytique d'usage anonyme uniquement, avec désactivation en un clic dans les Réglages. Un utilitaire discret qui garde votre disque honnête.",
    cards: [
      {
        title: "Purger le store pnpm",
        copy: "Récupérez les versions mortes du store partagé en un clic sans risque. Le store lui-même n'est jamais supprimé.",
      },
      {
        title: "Taille réelle vs liée",
        copy: "Sous pnpm, voyez les octets que vous libéreriez vraiment, en dehors de ce qui est lié au store partagé.",
      },
      {
        title: "Alertes de sécurité",
        copy: "Une pastille de sévérité sur tout package présentant une vulnérabilité connue, tirée de la base d'alertes npm.",
      },
      {
        title: "Scans planifiés",
        copy: "Tourne toutes les 6 heures, chaque jour, ou chaque semaine, entièrement en arrière-plan.",
      },
      {
        title: "Alertes de seuil",
        copy: "Fixez une limite en gigaoctets et soyez averti dès que vous la dépassez.",
      },
      {
        title: "Jauge disque en pixels",
        copy: "Une barre visible en un regard qui se remplit et rougit à mesure que vos dépendances s’accumulent.",
      },
      {
        title: "Révéler dans le Finder",
        copy: "Accédez directement à n'importe quel dossier de projet sans quitter le clavier.",
      },
      {
        title: "Ouvrir dans votre éditeur",
        copy: "Une touche pour lancer le projet dans l'éditeur que vous utilisez déjà.",
      },
      {
        title: "Détection du framework",
        copy: "React, Next, Vue, Svelte, Node, Expo : chaque projet, correctement identifié.",
      },
    ],
    comingSoonPill: "Bientôt disponible",
    comingSoonText: (
      <>
        À venir : les caches npm, yarn &amp; bun, plus les sorties de build
        par projet comme <code>.next</code> et <code>dist</code>.
      </>
    ),
  },

  why: {
    kicker: "Pourquoi ça s'accumule",
    heading: (
      <>
        Le cycle de vie de <span className="text-accent">node_modules</span>.
      </>
    ),
    lead: "Chaque installation écrit vos dépendances sur le disque. Ce qui s'accumule, et ce que vous pouvez récupérer, dépend entièrement de votre gestionnaire de paquets.",
    npmTag: "une copie complète par projet",
    pnpmTag: "un store partagé",
    npmNote: (
      <>
        Chaque projet reçoit sa <b>propre copie complète</b> de chaque
        dépendance. Installez <code>lodash</code> dans dix projets et il est
        écrit sur le disque <b>dix fois</b>. Multipliez ça par des centaines
        de packages transitifs et les vieux projets que vous avez oubliés, et
        vous voilà à des dizaines de gigaoctets.
      </>
    ),
    pnpmNote: (
      <>
        pnpm garde <b>un store global unique</b> et fait un lien physique
        (hard link) de chaque projet vers celui-ci. Une version donnée d’un
        package vit sur le disque <b>une seule fois</b>, peu importe le
        nombre de projets qui l’utilisent, une économie énorme.{" "}
        <b>Mais le store continue de grossir</b> à mesure que de nouvelles
        versions arrivent et que les anciennes s’attardent.
      </>
    ),
    storeLabel: "· stocké une fois",
    footNote: (
      <>
        TidyDisk agit <b>des deux côtés</b> : il envoie à la corbeille les
        vieux <code>node_modules</code> de projets sur lesquels vous ne
        referez plus jamais un <code>npm install</code>, <b>et</b> purge en
        toute sécurité votre store pnpm des versions que plus rien ne
        référence, en un clic dans l&apos;onglet <b>Caches</b> (il ne
        supprime jamais le store lui-même).
      </>
    ),
    sizingNote: (
      <>
        C&apos;est aussi pour ça que les tailles paraissent petites sous
        pnpm : TidyDisk compte le store partagé <b>une seule fois</b> et vous
        montre ce qui est réellement à vous de libérer, pas les mêmes octets
        liés dans une dizaine de projets.
      </>
    ),
  },

  how: {
    kicker: "Comment ça marche",
    heading: (
      <>
        Trois étapes vers un <span className="text-accent">Mac plus léger.</span>
      </>
    ),
    steps: [
      {
        num: "01",
        title: "Récupérez-le, il scanne",
        body: "Téléchargez le .app signé, ou clonez le dépôt et construisez le vôtre. Le premier scan cartographie chaque dossier node_modules sur votre disque.",
        cmd: (
          <>
            <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
            package
          </>
        ),
      },
      {
        num: "02",
        title: "Fixez votre limite",
        body: "Choisissez un seuil en gigaoctets et une fréquence de scan : toutes les 6 heures, chaque jour, ou chaque semaine. C'est tout le réglage nécessaire.",
        cmd: (
          <>
            <span className="pmt">limite</span> 5 Go ·{" "}
            <span className="pmt">scan</span> quotidien
          </>
        ),
      },
      {
        num: "03",
        title: "Nettoyez en un clic",
        body: "Quand vous dépassez la limite, passez en revue les dossiers obsolètes (ou purgez le store pnpm, ou auditez un package lourd) et récupérez l'espace. Votre disque vous remerciera.",
        cmd: (
          <>
            <span className="pmt">↵</span> 2,71 Go déplacés vers la Corbeille
          </>
        ),
      },
    ],
  },

  download: {
    kicker: "Télécharger",
    heading: (
      <>
        Scan gratuit. <span className="text-accent">19 euros pour nettoyer.</span>
      </>
    ),
    lead: "Le scan est gratuit pour toujours et le code source est en licence MIT sur GitHub. Le nettoyage en un clic est une licence à vie payée une fois : prix de lancement 19 euros, puis 29 après le lancement. Remboursement sous 30 jours, sans questions.",
    free: {
      name: (
        <>
          <span className="text-accent">0 €</span> · Tout scanner
        </>
      ),
      desc: "Le scan, gratuit pour toujours.",
      bullets: [
        "Téléchargez et lancez, aucune configuration requise",
        "Voyez chaque dossier node_modules, cache, et package sur votre machine",
        "Aucun compte, jamais",
      ],
      cta: "Télécharger pour macOS",
    },
    pro: {
      badge: "Prix de lancement",
      name: (
        <>
          <span className="text-accent">19 €</span> · Nettoyage à vie
        </>
      ),
      desc: "Licence à payer une fois, débloque le nettoyage à vie.",
      bullets: [
        "Suppression en un clic, direct vers la Corbeille",
        "Nettoyage des obsolètes : balayez tous les node_modules périmés d'un coup",
        "Purgez votre store pnpm, en un clic",
        "Toutes les futures mises à jour incluses",
        "Clé de licence instantanée, livrée via Polar",
        "Prix de lancement : 19 euros maintenant, 29 euros après le lancement",
      ],
      cta: "Acheter TidyDisk · 19 €",
    },
  },

  finalCta: {
    heading: (
      <>
        Arrêtez d&apos;accumuler
        <br />
        node_modules.
      </>
    ),
    body: "Récupérez les gigaoctets que vos dépendances accumulaient. Scan gratuit, nettoyage débloqué pour 19 euros.",
    downloadCta: "Télécharger le scan gratuit",
    buyCta: "Acheter · 19 €",
  },

  footer: {
    tagline: "L'app de barre de menu qui empêche le bazar du dev de dévorer votre Mac.",
    productHead: "Produit",
    openSourceHead: "Open source",
    legalHead: "Légal",
    links: {
      feature: "Fonctionnalités",
      how: "Comment ça marche",
      download: "Télécharger",
      blog: "Blog",
      repo: "Dépôt GitHub",
      issues: "Issues",
      releases: "Releases",
      privacy: "Politique de confidentialité",
      legal: "Mentions légales",
      cookies: "Préférences cookies",
    },
    copyright: "© 2026 TidyDisk · licence MIT",
    platform: "macOS 13+ · Apple Silicon & Intel",
  },

  blog: {
    eyebrow: "blog",
    listTitle: (
      <>
        Garder un disque de dev <span className="text-accent">propre</span>
      </>
    ),
    listLead:
      "Guides pratiques sur node_modules, les rouages des gestionnaires de paquets, et la récupération d'espace disque. Un nouvel article chaque semaine.",
    readArticle: "Lire l'article",
    backToArticles: "← Tous les articles",
    byline: "TidyDisk team",
    ctaTitle: "Découvrez ce que vos projets coûtent vraiment",
    ctaBody:
      "TidyDisk scanne votre Mac gratuitement et montre chaque dossier node_modules, dimensionné et classé. Le nettoyage se fait en un clic, toujours vers la Corbeille.",
    ctaButton: "Télécharger pour macOS",
  },
};
