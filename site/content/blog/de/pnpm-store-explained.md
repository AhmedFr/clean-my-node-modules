---
title: "Der pnpm-Store erklärt: wohin dein Speicherplatz wirklich geht"
description: "Wie pnpms inhaltsadressierter Store und Hardlinks funktionieren, warum dir du bei Projektgrößen etwas vormacht, und wie du den Store sicher bereinigst."
date: "2026-07-18"
---

Das Kernversprechen von pnpm ist Speichereffizienz: Installiere dieselbe Abhängigkeit in zehn Projekten, und sie liegt trotzdem nur einmal auf der Festplatte. Dieses Versprechen hält pnpm auch ein, aber es macht die Speichernutzung gleichzeitig ziemlich verwirrend. Tools melden Größen, die sich zu widersprechen scheinen, die Aufräum-Intuition aus npm funktioniert nicht mehr, und der Ort, an dem dein Speicher wirklich verschwunden ist, ist ein Ordner, den die meisten Leute noch nie geöffnet haben.

## Das zweistufige Design

pnpm teilt die Installation in zwei Ebenen auf:

1. **Der globale Store**, unter `~/Library/pnpm/store` auf macOS (prüfe deinen eigenen mit `pnpm store path`). Jede Version jedes Pakets, das du je installiert hast, liegt hier genau einmal, gespeichert nach Inhalts-Hash.
2. **Projektbezogene `node_modules`**, die fast keine echten Dateidaten enthalten. Dateien innerhalb von `node_modules/.pnpm` sind Hardlinks, die auf den Store zeigen, und deine `node_modules`-Einträge auf oberster Ebene sind Symlinks in `.pnpm`.

Ein Hardlink ist keine Kopie. Er ist ein zweiter Verzeichniseintrag für dieselben Bytes auf der Festplatte. Zehn Projekte, die dasselbe `react`-Paket per Hardlink verlinken, teilen sich eine einzige physische Kopie.

## Warum `du` dich in die Irre führt

Führe `du -sh node_modules` in einem pnpm-Projekt aus, und du siehst vielleicht 800 MB. Lösche dieses Projekt, und du gewinnst vielleicht nur 40 MB zurück. Beide Zahlen sind ehrlich, sie beantworten nur unterschiedliche Fragen.

`du` zählt die Größe jeder Datei, die es erreichen kann. Es weiß nicht (außer du vergleichst Inode-Zahlen über die gesamte Festplatte hinweg), dass 760 dieser Megabyte Hardlinks sind, die sich den Store und möglicherweise fünf weitere Projekte teilen. Die Bytes werden erst wirklich frei, wenn die letzte Referenz verschwindet, und der Store hält immer eine Referenz, bis du ihn bereinigst.

Die praktischen Konsequenzen:

- **Das Löschen eines einzelnen pnpm-Projekts gibt kaum Speicher frei.** Der Store hält weiterhin alles.
- **Das Aufsummieren von `du` über mehrere pnpm-Projekte zählt drastisch zu hoch.** Dieselben Bytes werden pro Projekt einmal mitgezählt.
- **Die echten Bytes liegen im Store selbst.** Miss ihn mit `du -sh $(pnpm store path)`.

Auf APFS (dem Standard-Dateisystem von macOS) gibt es noch eine zweite Besonderheit: Clones. Zwei Dateien können sich Speicherplatz teilen, ohne sich überhaupt einen Inode zu teilen, wodurch sie sowohl für `du` als auch für die Hardlink-Zählung unsichtbar bleiben. Eine genaue Abrechnung auf modernem macOS ist wirklich schwierig, weshalb naive Disk-Tools bei pnpm-Setups so oft danebenliegen.

## Den Store richtig bereinigen

Der Store wächst standardmäßig unbegrenzt: Jede Version jedes Pakets, das du je installiert hast, bleibt erhalten, auch Pakete, auf die kein Projekt mehr verweist. Die eingebaute Bereinigung:

```bash
pnpm store prune
```

Das entfernt Pakete, auf die aktuell kein Projekt mehr verlinkt. Es ist völlig sicher: Alles, worauf noch verwiesen wird, bleibt erhalten, und alles Entfernte würde bei der nächsten Installation, die es braucht, einfach erneut heruntergeladen. Auf einem Rechner mit einem Jahr pnpm-Historie gibt eine erste Bereinigung häufig mehrere Gigabyte frei.

Zwei verwandte Befehle, die sich zu merken lohnen:

```bash
pnpm store path     # where is my store?
pnpm store status   # verify store integrity
```

## Was das für deine Aufräum-Strategie bedeutet

Wenn du pnpm nutzt, drehen sich die Aufräum-Prioritäten im Vergleich zu npm um:

1. **Zuerst den Store bereinigen.** Dort konzentriert sich das tote Gewicht.
2. **Dann veraltete Projekt-`node_modules` löschen.** Jedes gibt sofort seine nicht geteilten Dateien frei und löst Referenzen, sodass die nächste Bereinigung mehr freigeben kann.
3. **Traue `du`-Zahlen pro Projekt nicht.** Sie sind Obergrenzen, oft ziemlich lockere.

Die Reihenfolge zählt: Erst Projekte löschen und dann bereinigen gibt am meisten frei, weil die Bereinigung nur entfernen kann, worauf nichts mehr verweist.

Dieses Messproblem ist auch einer der Gründe, warum wir [TidyDisk](/de) genau so gebaut haben, wie wir es getan haben. Es versteht das Layout von pnpm: Es misst den echten Inhalt des Stores, statt Hardlinks über Projekte hinweg doppelt zu zählen, sodass die gemeldeten Gigabyte auch die Gigabyte sind, die du wirklich zurückbekommst. Der Scan ist kostenlos, und das Aufräumen geht immer in den Papierkorb, niemals über `rm -rf`, eine Gewohnheit, die wir in [Warum du node_modules niemals mit rm -rf löschen solltest](/de/blog/never-rm-rf-node-modules) erklären.

## Fazit

pnpm spart tatsächlich Speicherplatz, oft sogar drastisch. Aber es verlagert das Problem, statt es zu beseitigen: Der Store sammelt jede Paketversion für immer, bis du ihn bereinigst, und Standard-Tools zur Größenmessung können nicht durch die Hardlinks hindurchsehen. Lerne `pnpm store prune`, führe es nach dem Löschen alter Projekte aus, und sei misstrauisch gegenüber jedem Tool, das pnpm-Projektgrößen meldet, ohne den Store zu erwähnen.

Willst du deine echte Zahl sehen? [TidyDisk](/de) zeigt deinen Store, jedes Projekt und jedes veraltete `node_modules` in einer Liste, kostenlos zu scannen, einmalig 19 Euro, wenn du das Aufräumen mit einem Klick möchtest.
