---
title: "Speicherplatz auf einem Mac freigeben: die Checkliste für Entwickler"
description: "Eine priorisierte Checkliste für Entwickler: node_modules, Paketmanager-Caches, Xcode-Müll, Docker-Images, Simulatoren und Browser-Caches, mit echten Befehlen."
date: "2026-08-08"
---

Entwickler-Macs füllen sich anders als normale Macs. Die üblichen Tipps (Papierkorb leeren, Downloads aufräumen, Fotos auslagern) kratzen das Problem kaum an, weil das Gewicht an Stellen liegt, die dir der Finder nie zeigt. Das hier ist die Checkliste, die wir tatsächlich verwenden, sortiert nach Gigabyte pro Minute Aufwand.

## 1. Veraltete node_modules-Ordner (meist der größte Gewinn)

Wenn du JavaScript-Arbeit machst, fang hier an. Jedes Projekt, das du je geklont hast, behält einen 200 MB bis 1,5 GB schweren Abhängigkeitsordner, bis du ihn löschst, und das komplett reproduzierbar aus der Lockfile mit einem einzigen `npm install`.

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

Lösche die, die zu Projekten gehören, die du seit zwei Monaten nicht angefasst hast. Die vollständige Anleitung mit Sicherheitshinweisen findest du in [node_modules sicher löschen](/de/blog/how-to-delete-node-modules-safely), und [TidyDisk](/de) automatisiert die ganze Runde aus deiner Menüleiste, falls du es lieber nicht manuell machen möchtest. Typische Ersparnis: **10 bis 50 GB**.

## 2. Paketmanager-Stores und -Caches

```bash
pnpm store prune        # pnpm: entfernt nicht mehr referenzierte Pakete
npm cache verify        # npm: räumt den Cache sicher auf
yarn cache clean        # yarn classic: leert ~/Library/Caches/Yarn
```

pnpm-Nutzer sollten den Prune-Befehl nach dem Löschen alter Projekte ausführen, nicht davor, damit er alles freigeben kann, worauf die gelöschten Projekte verwiesen haben (Details in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained)). Typische Ersparnis: **2 bis 10 GB**.

## 3. Xcode: das andere schwarze Loch

Auch wenn du nur gelegentlich eine iOS-App baust, sammelt Xcode gewaltige Mengen an abgeleitetem Zustand an:

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/iOS\ DeviceSupport 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator
```

- **DerivedData** ist ein Build-Cache; das Löschen kostet dich einen langsamen Rebuild. Oft 5 bis 20 GB.
- **iOS DeviceSupport** hält Debug-Symbole für jede iOS-Version jedes Geräts vor, das du je angeschlossen hast. Alte Versionen sind totes Gewicht.
- **Simulatoren**: `xcrun simctl delete unavailable` entfernt Simulatoren für Runtimes, die du nicht mehr hast.

Typische Ersparnis: **10 bis 40 GB** auf Maschinen, die für Apple-Plattformen bauen.

## 4. Docker

Das Disk-Image von Docker Desktop wächst und schrumpft von selbst kaum:

```bash
docker system df                 # zeigt, was belegt ist
docker system prune -a --volumes # entfernt ungenutzte Images, Container, Volumes
```

Lies die Warnung, bevor du den zweiten Befehl ausführst: `-a` entfernt alle Images, die an keinem laufenden Container hängen, und `--volumes` entfernt nicht referenzierte Volumes, einschließlich Daten, die du vielleicht noch brauchst. Prune im Zweifel erst ohne `--volumes`. Typische Ersparnis: **5 bis 30 GB**.

## 5. Homebrew

```bash
brew cleanup -s
du -sh $(brew --cache)
```

Homebrew hält alte Versionen und Downloads vor; `cleanup -s` räumt beides weg. Typische Ersparnis: **1 bis 5 GB**.

## 6. Alles andere, das einen Blick wert ist

```bash
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -15
```

Häufige Funde: Browser-Caches, Slack- und Electron-App-Caches, alte iOS-/Android-Emulator-Images aus Nebenprojekten, `~/Library/Caches/Google/AndroidStudio*`, sowie mehrere Gigabyte an `pip`-/`cargo`-/`go`-Modul-Caches (`pip cache purge`, `cargo cache -a` mit dem cargo-cache-Tool, `go clean -modcache`).

## Die Reihenfolge zählt

Arbeite die Liste von oben nach unten ab. Die ersten beiden Punkte sind reiner, wiederherstellbarer Zustand mit praktisch null Kosten; die Xcode- und Docker-Punkte kosten einen Rebuild oder ein erneutes Pull; das tiefere Cache-Aufräumen tauscht zukünftige Geschwindigkeit gegen Speicherplatz. Hör auf, sobald du den Spielraum hast, den du brauchst.

## Es sauber halten

Die unangenehme Wahrheit über das Aufräumen der Festplatte ist, dass es ein Abo ist, kein einmaliger Kauf. Sechs Wochen nach einer heldenhaften Aufräumaktion sind dieselben Ordner wieder schwer. Checklisten laufen nicht von selbst.

Für den JavaScript-förmigen Teil des Problems (meist der größte) macht [TidyDisk](/de) aus der Checkliste einen einzigen Blick: Es lebt in der Menüleiste, verfolgt fortlaufend jeden `node_modules`-Ordner und deinen pnpm-Store, und räumt mit einem Klick auf, was du auswählst, immer in den Papierkorb. Der Scan ist kostenlos und dauert etwa eine Minute; deine Zahl zu sehen, ist meist Motivation genug.
