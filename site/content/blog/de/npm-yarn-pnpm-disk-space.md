---
title: "npm vs. yarn vs. pnpm: wer verschwendet am wenigsten Speicherplatz?"
description: "Wie npm, yarn und pnpm node_modules jeweils auf der Festplatte anlegen, was das über viele Projekte kostet, und wer am wenigsten hortet."
date: "2026-08-22"
---

Paketmanager werden meist nach Installationsgeschwindigkeit und Lockfile-Ergonomie verglichen. Vergleicht man sie stattdessen nach Speicherverbrauch, sind die Unterschiede größer: auf einem Rechner mit vielen Projekten liegt die Lücke zwischen dem besten und dem schlechtesten Layout oft im Bereich von Dutzenden Gigabyte.

## Wie jeder Einzelne deine Festplatte nutzt

**npm** legt pro Projekt ein vollständiges, flaches `node_modules` an. Jedes Paket wird physisch in jedes Projekt kopiert, das es nutzt. Fünfzig Projekte, die TypeScript verwenden, bedeuten fünfzig Kopien des TypeScript-Compilers. npm führt außerdem einen globalen Download-Cache unter `~/.npm` (Tarballs, keine installierten Baumstrukturen), der im Vergleich bescheiden ausfällt.

**yarn classic (v1)** verhält sich auf der Festplatte wie npm: vollständige physische Kopien pro Projekt, plus ein eigener Cache unter `~/Library/Caches/Yarn`. Speichertechnisch kannst du es wie npm mit anderem Lockfile behandeln.

**yarn berry (v2+) mit Plug'n'Play** ist der radikale Fall: es gibt gar kein `node_modules`. Abhängigkeiten bleiben als Zip-Archive in `.yarn/cache` und werden zur Laufzeit aufgelöst. Zips sind komprimiert und liegen als eine Datei pro Paket vor, wodurch der Speicherverbrauch pro Projekt stark sinkt. Der Preis ist Ökosystem-Kompatibilität: Tools, die ein physisches `node_modules` erwarten, brauchen Shims, was ein großer Grund ist, warum sich PnP nur begrenzt durchgesetzt hat. Berry kann auch im Modus `nodeLinker: node-modules` laufen, womit du wieder im npm-Terrain landest.

**pnpm** hält einen inhaltsadressierten Store pro Rechner (`~/Library/pnpm/store` unter macOS) und baut das `node_modules` jedes Projekts aus Hardlinks dorthin auf. Fünfzig Projekte mit derselben TypeScript-Version teilen sich eine physische Kopie. Die marginalen Kosten pro Projekt nähern sich für gemeinsam genutzte Abhängigkeiten null an; der Store wächst mit der Vereinigung von allem, was du nutzt, nicht mit der Summe. Das Kleingedruckte (warum `du` zu hoch zählt, warum der Store bereinigt werden muss) steht in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained).

## Die Zahlen auf einem echten Rechner

Die genauen Werte hängen von deinem Stack ab, aber die Form bleibt konsistent. Nimm eine:n Entwickler:in mit 30 Projekten, die im Schnitt je 900 MB Abhängigkeiten haben, mit starker Überlappung zwischen den Projekten:

| Manager | Ungefähre Gesamtgröße auf der Festplatte |
|---|---|
| npm / yarn classic | 25 bis 30 GB (30 vollständige Kopien) |
| yarn berry PnP | 6 bis 10 GB (komprimierte Zips, geteilter Cache) |
| pnpm | 8 bis 12 GB (ein Store plus Hardlinks, vor dem Bereinigen) |

pnpm und PnP landen in derselben Liga; npm und yarn classic kosten für dieselben Projekte etwa dreimal so viel. Die Überlappungsannahme leistet hier die eigentliche Arbeit: teilen deine Projekte nur wenige Abhängigkeiten, schrumpft die Lücke.

## Speicherplatz ist nicht die einzige Achse

Einen Paketmanager allein nach Speicherverbrauch zu wählen, wäre seltsam. Die Kompatibilitätsrangfolge verläuft ungefähr umgekehrt zur Speicherrangfolge: npm funktioniert mit allem, pnpm funktioniert mit fast allem (gelegentlich Ärger mit Paketen, die ein flaches Layout voraussetzen), PnP verlangt die meiste Anpassung. Monorepo-Unterstützung, Installationsgeschwindigkeit und Team-Vertrautheit spielen alle mit hinein, und den Monorepo-Blickwinkel behandeln wir gesondert in [Monorepos und Speicherplatz](/de/blog/monorepo-disk-space).

Ist Speicherdruck für dich aber ein echtes Problem, lautet der praktische Rat:

1. **Schon auf pnpm:** du bist im effizienten Lager; deine Wartung ist `pnpm store prune` nach dem Löschen alter Projekte.
2. **Auf npm oder yarn classic:** du musst nicht migrieren, um dein Speicherproblem zu lösen. Veraltete Projekt-`node_modules`-Ordner zu löschen holt die meiste Verschwendung zurück, egal welcher Manager, denn [sie sind immer reproduzierbar](/de/blog/how-to-delete-node-modules-safely).
3. **Migrierst du trotzdem:** pnpm ist die am wenigsten störende der effizienten Optionen; die meisten Projekte wechseln mit einem Lockfile-Import und kleinen Skript-Anpassungen.

## Egal was du nutzt, das Leck ist dasselbe

Alle vier Layouts teilen einen Fehlermodus: nichts löscht sich von selbst. Veraltete Projekte behalten ihr volles Gewicht (npm, yarn) oder halten Referenzen, die den Store festpinnen (pnpm), bis du handelst. Der Manager bestimmt, wie schnell sich die Festplatte füllt, nicht ob sie sich füllt.

Genau diesen laufenden Teil übernimmt [TidyDisk](/de): es kennt jedes `node_modules` auf deinem Mac und deinen pnpm-Store, bemisst sie ohne Hardlink-Doppelzählung, markiert, was veraltet ist, und räumt auf, was du auswählst, mit einem Klick, in den Papierkorb. Der Scan ist kostenlos, und er funktioniert gleich gut, egal welcher Paketmanager deine Festplatte füllt.
