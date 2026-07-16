import type { Dictionary } from "../i18n.types";

// German locale dictionary. Reproduces the exact element structure of the
// English reference (same tags, same className, same code/b/em spans) with
// only the human-readable text translated.
export const de: Dictionary = {
  meta: {
    title:
      "TidyDisk: sieh, was deine Dev-Festplatte frisst, hol sie dir mit einem Klick zurück",
    description:
      "TidyDisk zeigt in der Menüleiste, was dein Dev-Mac kostet: node_modules, pnpm-Store, Pakete. Kostenlos scannen, für 19 Euro sicher aufräumen, nie rm -rf.",
    blogTitle: "TidyDisk-Blog: saubere Dev-Festplatten",
    blogDescription:
      "Praktische Anleitungen zu node_modules, Paketmanager-Speicherverbrauch und wie du Speicherplatz auf dem Dev-Mac zurückgewinnst. Von den Machern von TidyDisk.",
    ogAlt:
      "TidyDisk: die macOS-Menüleisten-App, die den Speicher deiner Dev-Projekte zurückholt",
  },

  nav: {
    features: "Funktionen",
    packages: "Pakete",
    why: "Warum",
    how: "So funktioniert's",
    download: "Download",
    blog: "Blog",
    github: "GitHub",
    getApp: "App holen",
  },

  hero: {
    eyebrow: "macOS-Menüleisten-App · kostenloser Scan",
    heading: (
      <>
        Eine <span className="text-accent">aufgeräumte Festplatte</span>,
        ganz ohne Nachdenken.
      </>
    ),
    body: (
      <>
        Dev-Arbeit frisst deinen Mac still und leise: alte Projekte, schwere
        Abhängigkeiten, vergessene Experimente. TidyDisk behält das aus der
        Menüleiste im Blick und gibt dir den Speicher mit einem Klick
        zurück. Sicher, in den Papierkorb, nie <code>rm -rf</code>.
      </>
    ),
    downloadCta: "Für macOS herunterladen",
    githubCta: "Auf GitHub ansehen",
    micro: "MIT-lizenziert · macOS 13+ · Apple Silicon & Intel",
  },

  band: {
    statement: (
      <>
        <code>node_modules</code> ist das schwerste Objekt im bekannten
        Universum. <em>Wir helfen dir, es zu löschen.</em>
      </>
    ),
  },

  features: [
    {
      tagline: "Immer im Blick",
      heading: "Sie behält deine Festplatte im Auge, damit du es nicht musst.",
      body: "TidyDisk lebt in deiner Menüleiste und scannt nach deinem Zeitplan neu: alle 6 Stunden, täglich oder wöchentlich. Eine native Benachrichtigung erscheint, sobald deine node_modules die von dir gesetzte Grenze überschreiten.",
      bullets: [
        "Hintergrund-Scans alle 6 Stunden, täglich oder wöchentlich",
        "Ein Grenzwert, den du selbst festlegst, ganz einfach in Gigabyte",
        "Ein Blick auf die Menüleiste genügt, um zu wissen, wo du stehst",
      ],
    },
    {
      tagline: "Volle Klarheit",
      heading: "Jede tote Abhängigkeit, sortiert.",
      body: "Öffne den vollständigen Launcher für eine gründliche Aufräumaktion. Eine Spotlight-artige Suche über Projektnamen und Pfade zeigt zu jedem node_modules-Ordner die echte Größe und wie lange du ihn schon nicht mehr angefasst hast. Die größten, ältesten Übeltäter wandern nach oben.",
      bullets: [
        "Sortiere nach letzter Nutzung, Größe oder Projektname",
        "Volle Tastaturnavigation: ↑↓ zum Bewegen, ↵ zum Öffnen, ⌘⌫ zum Löschen",
        "Bei pnpm die echten Bytes, die du freigibst, abzüglich dessen, was im geteilten Store verlinkt ist",
        "Im Finder anzeigen oder im Editor öffnen, nur einen Tastendruck entfernt",
      ],
    },
    {
      tagline: "Sicherer Gewinn",
      heading: "Ein Klick. Gigabytes zurück. Nichts verloren.",
      body: (
        <>
          Wähle aus, was du nicht mehr brauchst, und es wandert in den
          Papierkorb. Kein Terminal, kein <code>rm -rf</code>-Roulette,
          wiederherstellbar, bis du ihn leerst. Sieh zu, wie der Zähler sinkt
          und dein freier Speicher wächst. Brauchst du ein Projekt doch
          wieder? Ein einziges <code>npm install</code> holt es zurück.
        </>
      ),
      bullets: [
        <>
          Löscht in den Papierkorb: wiederherstellbar, nie <code>rm -rf</code>
        </>,
        "Lösche einen Ordner oder räume alle veralteten auf einmal auf",
        "Rührt ausschließlich node_modules an, niemals deinen Quellcode",
      ],
    },
    {
      tagline: "Blick aufs ganze System",
      heading: "Jedes installierte Paket, in einer Liste.",
      body: "Öffne den Tab Pakete für eine rechnerweite Bestandsaufnahme jeder Abhängigkeit, die deine Projekte ziehen: wie viele sie nutzen, ihre Größe, die Versionen, auf denen du bist, die neueste auf npm und alle Sicherheitswarnungen. Erkenne die schweren und ungenutzten, vereinheitliche auseinandergedriftete Versionen und sieh, was markiert ist, alles aus bereits gescannten Projekten.",
      bullets: [
        "Wie viele Projekte jedes Paket nutzen, und seine echte Größe",
        <>
          Ein <b>Vereinheitlichen</b>-Badge, wenn ein Paket in mehreren
          Versionen installiert ist
        </>,
        "Pills für die neueste npm-Version und Sicherheitswarnungen. Zeile aufklappen für den Schweregrad je Version",
      ],
    },
  ],

  grid: {
    kicker: "Alles in einem Menü",
    heading: (
      <>
        Kleine App. <span className="text-accent">Große Erleichterung.</span>
      </>
    ),
    lead: "Deine Scans bleiben auf deinem Mac. Nur anonyme Nutzungsanalyse, mit Opt-out per Klick in den Einstellungen. Ein stilles Werkzeug, das deine Festplatte ehrlich hält.",
    cards: [
      {
        title: "pnpm-Store bereinigen",
        copy: "Hol dir die toten Versionen des geteilten Stores mit einem sicheren Klick zurück. Der Store selbst wird nie gelöscht.",
      },
      {
        title: "Echte vs. verlinkte Größe",
        copy: "Bei pnpm siehst du die Bytes, die du wirklich freigibst, abzüglich dessen, was im geteilten Store verlinkt ist.",
      },
      {
        title: "Sicherheitswarnungen",
        copy: "Eine Schweregrad-Pille bei jedem Paket mit bekannter Schwachstelle, aus der npm-Advisory-Datenbank.",
      },
      {
        title: "Geplante Scans",
        copy: "Läuft alle 6 Stunden, täglich oder wöchentlich, komplett im Hintergrund.",
      },
      {
        title: "Schwellenwert-Alarm",
        copy: "Setze ein Limit in Gigabyte und werde sofort benachrichtigt, wenn du es überschreitest.",
      },
      {
        title: "Pixel-Festplattenanzeige",
        copy: "Ein auf einen Blick erfassbarer Balken, der sich füllt und rot färbt, je mehr sich deine Abhängigkeiten stapeln.",
      },
      {
        title: "Im Finder anzeigen",
        copy: "Springe direkt zu jedem Projektordner, ohne die Tastatur zu verlassen.",
      },
      {
        title: "Im Editor öffnen",
        copy: "Ein Tastendruck startet das Projekt in dem Editor, den du bereits nutzt.",
      },
      {
        title: "Framework-Erkennung",
        copy: "React, Next, Vue, Svelte, Node, Expo: jedes Projekt korrekt erkannt.",
      },
    ],
    comingSoonPill: "Demnächst",
    comingSoonText: (
      <>
        npm-, yarn- und bun-Caches, plus projektspezifische Build-Ausgaben
        wie <code>.next</code> und <code>dist</code>.
      </>
    ),
  },

  why: {
    kicker: "Warum es sich anhäuft",
    heading: (
      <>
        Der <span className="text-accent">node_modules</span>-Lebenszyklus.
      </>
    ),
    lead: "Jede Installation schreibt deine Abhängigkeiten auf die Festplatte. Wie sehr sie sich anhäufen und wie viel du zurückgewinnen kannst, hängt von deinem Paketmanager ab.",
    npmTag: "eine vollständige Kopie pro Projekt",
    pnpmTag: "ein gemeinsamer Store",
    npmNote: (
      <>
        Jedes Projekt bekommt seine <b>eigene vollständige Kopie</b> jeder
        Abhängigkeit. Installiere <code>lodash</code> in zehn Projekten,
        und es wird <b>zehnmal</b> auf die Festplatte geschrieben.
        Multipliziere das mit Hunderten transitiver Pakete und den alten
        Projekten, die du vergessen hast, und du steckst Dutzende Gigabyte
        tief drin.
      </>
    ),
    pnpmNote: (
      <>
        pnpm hält <b>einen globalen Store</b> vor und verlinkt jedes
        Projekt per Hardlink hinein. Eine bestimmte Version eines Pakets
        liegt <b>einmal</b> auf der Festplatte, egal wie viele Projekte sie
        nutzen, eine enorme Ersparnis. <b>Aber der Store wächst trotzdem
        weiter</b>, wenn neue Versionen dazukommen und alte liegen bleiben.
      </>
    ),
    storeLabel: "· einmal gespeichert",
    footNote: (
      <>
        TidyDisk arbeitet an <b>beiden Enden</b>: Es schickt die veralteten
        Projekt-<code>node_modules</code>, die du nie wieder per{" "}
        <code>npm install</code> brauchst, in den Papierkorb, <b>und</b>{" "}
        bereinigt sicher deinen pnpm-Store von Versionen, auf die nichts mehr
        verweist, ein Klick im Tab <b>Caches</b> (der Store selbst wird nie
        gelöscht).
      </>
    ),
    sizingNote: (
      <>
        Das ist auch, warum die Größen bei pnpm klein wirken: TidyDisk zählt
        den geteilten Store nur <b>einmal</b> und zeigt dir, was du wirklich
        freigeben kannst, nicht dieselben Bytes, die in einem Dutzend
        Projekten verlinkt sind.
      </>
    ),
  },

  how: {
    kicker: "So funktioniert's",
    heading: (
      <>
        Drei Schritte zu einem <span className="text-accent">leichteren Mac.</span>
      </>
    ),
    steps: [
      {
        num: "01",
        title: "Holen und scannen",
        body: "Lade die signierte .app herunter oder klone das Repo und baue sie selbst. Der erste Scan kartiert jeden node_modules-Ordner auf deiner Festplatte.",
        cmd: (
          <>
            <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
            package
          </>
        ),
      },
      {
        num: "02",
        title: "Grenze festlegen",
        body: "Wähle einen Schwellenwert in Gigabyte und wie oft neu gescannt werden soll: alle 6 Stunden, täglich oder wöchentlich. Das ist die gesamte Einrichtung.",
        cmd: (
          <>
            <span className="pmt">limit</span> 5 GB ·{" "}
            <span className="pmt">scan</span> daily
          </>
        ),
      },
      {
        num: "03",
        title: "Aufräumen mit einem Klick",
        body: "Wenn du die Grenze überschreitest, sieh dir die veralteten Ordner an (oder bereinige den pnpm-Store oder prüfe ein schweres Paket) und hol dir den Speicher zurück. Deine Festplatte dankt es dir.",
        cmd: (
          <>
            <span className="pmt">↵</span> 2,71 GB in den Papierkorb
            verschoben
          </>
        ),
      },
    ],
  },

  download: {
    kicker: "Download",
    heading: (
      <>
        Kostenlos scannen.{" "}
        <span className="text-accent">19 Euro zum Aufräumen.</span>
      </>
    ),
    lead: "Der Scan ist für immer kostenlos, und der Quellcode ist MIT-lizenziert auf GitHub. Das Aufräumen mit einem Klick ist eine einmalige Lifetime-Lizenz: Gründerpreis 19 Euro, danach 29 nach dem Launch. 30 Tage Geld-zurück-Garantie, ohne Wenn und Aber.",
    free: {
      name: (
        <>
          <span className="text-accent">0 €</span> · Alles scannen
        </>
      ),
      desc: "Der Scan, für immer kostenlos.",
      bullets: [
        "Herunterladen und starten, keine Einrichtung nötig",
        "Sieh jeden node_modules-Ordner, Cache und jedes Paket auf deinem Rechner",
        "Niemals ein Konto nötig",
      ],
      cta: "Für macOS herunterladen",
    },
    pro: {
      badge: "Gründerpreis",
      name: (
        <>
          <span className="text-accent">19 €</span> · Lifetime-Aufräumen
        </>
      ),
      desc: "Einmalige Lizenz, schaltet das Aufräumen für immer frei.",
      bullets: [
        "Löschen mit einem Klick, direkt in den Papierkorb",
        "Veraltetes aufräumen: alle veralteten node_modules auf einmal beseitigen",
        "Bereinige deinen pnpm-Store mit einem Klick",
        "Alle zukünftigen Updates inklusive",
        "Sofortiger Lizenzschlüssel, geliefert über Polar",
        "Gründerpreis: jetzt 19 Euro, nach dem Launch 29 Euro",
      ],
      cta: "TidyDisk kaufen · 19 €",
    },
  },

  finalCta: {
    heading: (
      <>
        Schluss mit dem Horten
        <br />
        von node_modules.
      </>
    ),
    body: "Hol dir die Gigabyte zurück, die deine Abhängigkeiten gehortet haben. Kostenlos scannen, Aufräumen für 19 Euro freischalten.",
    downloadCta: "Kostenlosen Scan herunterladen",
    buyCta: "Kaufen · 19 €",
  },

  footer: {
    tagline:
      "Die Menüleisten-App, die verhindert, dass Dev-Müll deinen Mac auffrisst.",
    productHead: "Produkt",
    openSourceHead: "Open Source",
    legalHead: "Rechtliches",
    links: {
      feature: "Funktionen",
      how: "So funktioniert's",
      download: "Download",
      blog: "Blog",
      repo: "GitHub-Repository",
      issues: "Issues",
      releases: "Releases",
      privacy: "Datenschutzerklärung",
      legal: "Impressum",
      cookies: "Cookie-Einstellungen",
    },
    copyright: "© 2026 TidyDisk · MIT-Lizenz",
    platform: "macOS 13+ · Apple Silicon & Intel",
  },

  blog: {
    eyebrow: "blog",
    listTitle: (
      <>
        Dev-Festplatten <span className="text-accent">sauber</span> halten
      </>
    ),
    listLead:
      "Praktische Anleitungen zu node_modules, den Interna von Paketmanagern und wie du deinen Speicherplatz zurückbekommst. Jede Woche ein neuer Artikel.",
    readArticle: "Artikel lesen",
    backToArticles: "← Alle Artikel",
    byline: "TidyDisk team",
    ctaTitle: "Sieh, was deine Projekte wirklich kosten",
    ctaBody:
      "TidyDisk scannt deinen Mac kostenlos und zeigt jeden node_modules-Ordner, mit Größe und Rang. Aufräumen geht mit einem Klick, immer in den Papierkorb.",
    ctaButton: "Für macOS herunterladen",
  },
};
