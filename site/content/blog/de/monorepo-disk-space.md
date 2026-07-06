---
title: "Monorepos und Speicherplatz: node_modules im großen Maßstab bändigen"
description: "Warum Monorepos das Abhängigkeitsgewicht vervielfachen, wie Workspaces und pnpm helfen, und wie du Turbo-Caches, Paket-Builds und alte Klone im Griff behältst."
date: "2026-09-05"
---

Monorepos konzentrieren alles: Code, Tooling und Speicherverbrauch. Ein einziges, viel genutztes Monorepo kann mehr Abhängigkeitsgewicht tragen als ein Dutzend kleiner Projekte, und es bringt neue Kategorien von Speicherverbrauch mit sich (Build-Caches, paketweise Artefakte), die gewöhnliche Aufräumtipps ignorieren. Hier steckt das Gewicht, und so holst du es zurück.

## Wo Monorepos ihr Gewicht ablegen

**Das Root-node_modules.** Mit npm-, yarn- oder pnpm-Workspaces werden die meisten Abhängigkeiten in ein einziges Root-`node_modules` hochgehoben. In einem Repo mit 20 Paketen ist dieser Ordner routinemäßig 1 bis 3 GB groß. Das ist eigentlich das effiziente Ergebnis: eine geteilte Kopie statt 20.

**Paketweises node_modules.** Pakete mit widersprüchlichen Versionen oder Lifecycle-Skripten bekommen ihr eigenes, verschachteltes `node_modules`. Eine Handvoll ist normal; Dutzende schwere deuten auf Versionskonflikte hin, die sich mit einem `dedupe`-Durchlauf beheben lassen:

```bash
npm dedupe --dry-run       # npm workspaces
pnpm dedupe --check        # pnpm 9+
```

**Build- und Task-Caches.** Turborepos `.turbo`, Nx' `.nx/cache`, Vite- und webpack-Caches innerhalb von `node_modules/.cache`, TypeScripts `.tsbuildinfo`-Dateien. Sie verdienen sich ihren Platz in einem aktiven Repo und sind reine Verschwendung bei einem veralteten Klon. Sie können dem Abhängigkeitsgewicht Konkurrenz machen:

```bash
du -sh .turbo .nx/cache node_modules/.cache 2>/dev/null
```

**Doppelte Klone.** Der Monorepo-spezifische Multiplikator: Worktrees und zweite Klone für parallele Branches. Jeder Klon trägt das volle `node_modules`- und Cache-Gewicht. Drei Arbeitskopien eines 4-GB-Monorepos sind 12 GB, und die zwei, die du im März für diesen Hotfix angelegt hast, sind immer noch da.

## Die Wahl des Paketmanagers zählt hier noch mehr

Alles aus [npm vs. yarn vs. pnpm im Speicherverbrauch](/de/blog/npm-yarn-pnpm-disk-space) wird in einem Monorepo verstärkt, und pnpm hat einen strukturellen Vorteil, den man kennen sollte: Weil das `node_modules` jedes Projekts per Hardlink in einen Store zeigt, teilen sich deine drei Klone des Monorepos größtenteils den physischen Speicherplatz. Bei npm oder yarn classic ist jeder Klon eine vollständige physische Kopie. Hältst du mehrere Arbeitskopien eines großen Repos vor, ist pnpms Store-Modell die Speicherplatzentscheidung mit der höchsten Hebelwirkung, die es gibt ([wie der Store funktioniert](/de/blog/pnpm-store-explained)).

## Aufräumen, das ein aktives Monorepo respektiert

Für das Monorepo, in dem du täglich arbeitest:

1. **Lass das Root-`node_modules` in Ruhe.** Ein großes Workspace neu zu installieren dauert Minuten; es zu löschen, um Speicher zurückzugewinnen, den du morgen schon wieder brauchst, ist ein Nettoverlust.
2. **Räume Caches gelegentlich auf.** `.turbo` und Verwandte regenerieren sich beim nächsten Build. Sie auf einem Repo zu leeren, das du noch nutzt, kostet einen kalten Build.
3. **Dedupliziere Versionskonflikte.** Verkleinert die paketweise `node_modules`-Schicht dauerhaft.

Bei allem anderen darfst du rücksichtslos sein:

4. **Veraltete Klone und Worktrees sind der Jackpot.** Ein vergessener zweiter Klon ist mehrere Gigabyte reine Duplikation. `git worktree list` zeigt Worktrees, die du vergessen hast; lösche zuerst deren `node_modules`, dann den Worktree selbst, falls der Branch ausgeliefert wurde.
5. **Archivierte Monorepos** (das alte Firmenrepo, die Neuentwicklung, die aufgegeben wurde) behalten ihr volles Gewicht für immer. Ihr `node_modules` und ihre Caches lassen sich [gefahrlos löschen](/de/blog/how-to-delete-node-modules-safely) wie bei jedem anderen Projekt; die Lockfile baut alles wieder auf, sollte das Repo je wieder aufwachen.

Und wie immer auf macOS: in den Papierkorb löschen, nicht mit `rm -rf`. Je größer der Ordner, desto mehr lohnt sich diese [Gewohnheit](/de/blog/never-rm-rf-node-modules).

## Den Überblick behalten

Der schwierige Teil in einer Monorepo-Welt ist, deine aktuelle Gesamtsumme zu kennen. Gewicht sammelt sich gleichzeitig im Repo, seinen Klonen, paketweisen Ordnern, Caches und dem pnpm-Store an; kein einzelnes `du` zeigt es dir. [TidyDisk](/de) behält die laufende Summe in der Menüleiste deines Macs: jedes `node_modules` über jeden Klon hinweg, den pnpm-Store ehrlich vermessen (Hardlinks nur einmal gezählt), Veraltetheit pro Projekt, Aufräumen mit einem Klick in den Papierkorb. Der Scan ist kostenlos, und Monorepo-Nutzer sehen tendenziell die größten ersten Zahlen von allen.

Ob du es automatisierst oder skriptest: Prüfe die Zahl vierteljährlich. Monorepos wachsen im Stillen, und der erste `find` auf einer Maschine, die eines beherbergt, ist zuverlässig eine Überraschung.
