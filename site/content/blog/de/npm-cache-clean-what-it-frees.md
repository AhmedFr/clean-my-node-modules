---
title: "npm cache clean: was es wirklich freigibt (und was nicht)"
description: "Was im npm-Cache steckt, wann npm cache clean --force hilft, warum verify meist die bessere Wahl ist, und wo die echten Speicherersparnisse liegen."
date: "2026-08-01"
---

`npm cache clean --force` ist der erste Befehl, zu dem die meisten greifen, wenn der npm-bedingte Speicherverbrauch aus dem Ruder läuft. Selten ist es der richtige. Hier steht, was der npm-Cache tatsächlich enthält, was das Leeren wirklich freigibt, und wo der gesuchte Speicherplatz wirklich liegt.

## Was im npm-Cache steckt

npm führt einen inhaltsadressierten Cache unter `~/.npm` (genauer `~/.npm/_cacache`). Jedes Package-Tarball, das npm jemals heruntergeladen hat, liegt dort, zusammen mit Registry-Metadaten. Seine Aufgabe: wiederholte Installationen beschleunigen und Installationen offline ermöglichen.

Miss deinen eigenen:

```bash
du -sh ~/.npm
```

Typische Größen reichen von ein paar hundert Megabyte bis zu mehreren Gigabyte auf Rechnern mit langer npm-Historie.

Zwei Eigenschaften sind wichtig:

1. **Er heilt sich selbst.** Daten werden beim Auslesen per Prüfsumme verifiziert; beschädigte Einträge werden automatisch neu geladen. Die historischen Gründe, den Cache routinemäßig zu leeren, sind mit npm 5 größtenteils verschwunden.
2. **Er wird geteilt.** Ein Cache bedient jedes Projekt. Ihn zu löschen verlangsamt die nächste Installation von allem.

## Was das Leeren wirklich bewirkt

```bash
npm cache clean --force
```

Das löscht den kompletten Cache. Das Flag `--force` ist genau deshalb nötig, weil das npm-Team manuelles Leeren fast nie für nötig hält. Du gibst die Größe von `~/.npm` einmalig frei, und danach füllen Installationen ihn sofort wieder auf, jede einzelne langsamer, als sie es gewesen wäre, weil Tarballs erneut heruntergeladen werden müssen.

Das sanftere Werkzeug ist:

```bash
npm cache verify
```

Das prüft die Integrität, räumt nicht mehr benötigte Daten weg und meldet, was zurückgewonnen wurde, ohne gültige Einträge wegzuwerfen. Wenn dir der Cache aufgebläht vorkommt, führe zuerst `verify` aus; es kürzt oft einen spürbaren Teil, ohne Installationen zu verlangsamen.

## Wann clean --force wirklich richtig ist

- Du gibst Speicher auf einem Rechner frei, den du aus der JavaScript-Arbeit zurückziehst.
- Der Cache ist über das hinausgewachsen, was deine Festplatte verkraftet, und du nimmst langsamere Installationen in Kauf.
- Du debuggst einen wirklich beschädigten Cache, den `verify` nicht reparieren kann (selten).

Außerhalb dieser Fälle ist der Cache einer der wenigen Posten im Dev-Speicherverbrauch, der sich täglich auszahlt.

## Wo der echte Speicherplatz liegt

Hier ist der Vergleich, der zählt. Auf einem typischen Dev-Rechner:

| Ort | Typische Größe | Kosten des Löschens |
|---|---|---|
| `~/.npm`-Cache | 0,5 bis 3 GB | Langsamere künftige Installationen |
| Alle `node_modules`-Ordner | 20 bis 80 GB | Ein `npm install` pro wiederbelebtem Projekt |
| pnpm-Store (falls genutzt) | 2 bis 15 GB | Erneutes Herunterladen bei der nächsten Installation nach dem Bereinigen |

Der Cache ist meist der kleinste der drei und der einzige mit einem laufenden Performance-Vorteil. Veraltete `node_modules`-Ordner sind zehn- bis dreißigmal größer und geben dir nichts zurück. Wenn du fünfzehn Minuten für Speicherbereinigung hast, ist der Cache der letzte Ort dafür. Fang an mit [jedem node_modules-Ordner auf deinem Mac finden](/de/blog/find-node-modules-folders-mac), lösche die veralteten, und wenn du pnpm nutzt, führe `pnpm store prune` aus, wie in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained) beschrieben.

Für Yarn-Nutzer: der entsprechende Cache liegt unter `~/Library/Caches/Yarn` und wird mit `yarn cache clean` geleert; die gleiche Logik gilt.

## Eine sinnvolle Reihenfolge fürs Aufräumen für npm-Nutzer

1. Veraltete Projekt-`node_modules`-Ordner löschen (der große Gewinn, vollständig wiederherstellbar).
2. `npm cache verify` ausführen (kostenloser Trimm, kein Nachteil).
3. Erst zu `npm cache clean --force` greifen, wenn du das letzte Gigabyte brauchst und die Kosten akzeptierst.

Wenn sich Schritt 1 mühsam anhört: genau das automatisiert [TidyDisk](/de): ein kostenloser Scan zeigt jedes `node_modules` auf deinem Mac, mit Größe und sortiert nach Veraltetheit, und ein Klick schickt die ausgewählten in den Papierkorb. Die 19-Euro-Lifetime-Lizenz zahlt sich schon beim ersten Mal aus, wenn sie dir diese Liste von Hand erspart.
