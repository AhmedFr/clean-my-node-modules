---
title: "So findest du jeden node_modules-Ordner auf deinem Mac"
description: "Terminal-Befehle, um jeden node_modules-Ordner unter macOS zu finden und zu messen, nach Größe und Alter zu sortieren und zu entscheiden, was gelöscht wird."
date: "2026-07-25"
---

Bevor du aufräumen kannst, musst du wissen, was überhaupt da ist. Die meisten Entwickler schätzen, dass sie "ein paar" `node_modules`-Ordner haben, und finden dann Dutzende. Dieser Leitfaden gibt dir die genauen Befehle, um sie alle zu finden, ihre Größe zu messen und danach zu bewerten, wie gefahrlos sie sich löschen lassen.

## Die einfache Suche

Starte im Ordner, in dem deine Projekte liegen (passe `~/code` an dein eigenes Layout an):

```bash
find ~/code -name node_modules -type d -prune
```

Das `-prune`-Flag ist entscheidend: Es verhindert, dass `find` in jeden gefundenen `node_modules`-Ordner hinabsteigt, überspringt also die verschachtelten `node_modules`-Ordner innerhalb von Abhängigkeiten (die verschwinden ohnehin mit ihrem übergeordneten Ordner) und macht den Befehl deutlich schneller.

Sind deine Projekte über die Platte verteilt, durchsuche dein gesamtes Home-Verzeichnis. Rechne bei einer großen Festplatte mit etwas Wartezeit:

```bash
find ~ -name node_modules -type d -prune 2>/dev/null
```

`2>/dev/null` blendet Berechtigungsfehler aus Systemordnern aus, die du ohnehin nicht lesen kannst.

## Größen ergänzen

Leite jeden Treffer durch `du`:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh
```

`sort -rh` setzt die größten Ordner nach oben. Auf einer Maschine mit einem Jahr aktiver JavaScript-Arbeit ist die Spitze dieser Liste meist ein Schock: einzelne Ordner von 800 MB bis 2 GB, und Summen im Bereich mehrerer Dutzend Gigabyte.

Für die eine Gesamtzahl:

```bash
find ~/code -name node_modules -type d -prune -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {printf "%.1f GB\n", s/1048576}'
```

Ein Vorbehalt, falls du pnpm nutzt: Hardlinks verzerren diese Zahlen, manchmal deutlich. Die Bytes werden mit dem globalen Store geteilt, und das Löschen eines Projekts gibt weniger frei, als `du` vermuten lässt. Details dazu findest du in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained).

## Nach Alter sortieren

Die Größe zeigt dir, was sich zu löschen lohnt; das Alter zeigt dir, was gefahrlos ist. Ein `node_modules`-Ordner, den du seit sechs Monaten nicht angefasst hast, gehört wahrscheinlich zu einem Projekt, zu dem du so schnell nicht zurückkehrst, und eine spätere Neuinstallation kostet nur ein `npm install`.

Das hier listet jeden Projektordner mit dem Zeitpunkt, an dem zuletzt irgendetwas im Projekt (außer `node_modules` selbst) verändert wurde:

```bash
for nm in $(find ~/code -name node_modules -type d -prune); do
  proj=$(dirname "$nm")
  last=$(find "$proj" -path "$proj/node_modules" -prune -o -type f -newer "$nm" -print -quit 2>/dev/null)
  mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$proj")
  size=$(du -sh "$nm" 2>/dev/null | cut -f1)
  echo "$mod  $size  $proj"
done | sort
```

Alles, was oben auf dieser Liste steht (älteste zuerst) und dazu eine dicke Größenspalte hat, ist ein erstklassiger Kandidat. Das Löschen ist ungefährlich, weil sich `node_modules` immer aus der Lockfile reproduzieren lässt, wie in [node_modules sicher löschen](/de/blog/how-to-delete-node-modules-safely) beschrieben.

## Das Wartungsproblem

Diese Befehle funktionieren. Das Problem ist, dass Festplatten-Aufräumen kein einmaliges Ereignis ist. Neue Projekte entstehen, alte werden zu Altlasten, und drei Monate später sind dieselben Gigabyte wieder da. Niemand führt eine fünfzeilige Shell-Schleife regelmäßig von Hand aus.

Genau diese Lücke zwischen "im Terminal möglich" und "passiert tatsächlich" schließt [TidyDisk](/de). Es sitzt in deiner macOS-Menüleiste und hält die Antwort aktuell: jeder `node_modules`-Ordner, seine echte Größe (pnpm-bewusst, also ohne Hardlink-Doppelzählung), und wie veraltet sein Projekt ist, sortiert und einsatzbereit. Überschreitet die Summe einen Schwellenwert, der dir wichtig ist, siehst du es, ohne fragen zu müssen.

## Entscheiden, dann löschen

Welchen Weg du auch wählst, das Entscheidungsschema bleibt gleich:

1. **Aktive Projekte (diese Woche angefasst): behalten.** Die Kosten einer Neuinstallation würden dich nur nerven.
2. **Aktuelle Projekte (diesen Monat angefasst): behalten, außer sie sind riesig.**
3. **Alles Ältere: löschen.** Kehrst du eines Tages zum Projekt zurück, baut `npm install` alles in ein bis zwei Minuten wieder auf.

Und wenn du löschst, bevorzuge den Papierkorb gegenüber `rm -rf`. Der Papierkorb kostet nichts und macht aus einem vertippten Pfad ein Nicht-Ereignis statt eines Desasters.

Führe den kostenlosen Scan in [TidyDisk](/de) aus, und du hast in etwa einer Minute deine vollständige, ehrliche Zahl. Die meisten ersten Scans finden 20+ GB. Sie zurückzuholen ist ein Klick mit einer 19-Euro-Lifetime-Lizenz.
