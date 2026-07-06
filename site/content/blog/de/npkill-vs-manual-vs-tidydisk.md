---
title: "npkill vs. manuelles Aufräumen vs. TidyDisk: Was solltest du nutzen?"
description: "Ein ehrlicher Vergleich der drei Wege, node_modules auf einem Mac aufzuräumen: Terminal-Befehle, das npkill-CLI und die TidyDisk-Menüleisten-App."
date: "2026-08-15"
---

Es gibt drei vernünftige Wege, den Speicherplatz zurückzuholen, den deine JavaScript-Projekte horten: von Hand im Terminal, mit einem dafür gebauten CLI-Tool, oder mit einer App, die kontinuierlich mitschaut. Wir bauen eine der drei, rechne das entsprechend ein, aber hier ist der ehrliche Vergleich, inklusive der Fälle, in denen die Antwort nicht wir sind.

## Option 1: manuelle Terminal-Befehle

Die Null-Installation-Option. Alles finden und die Größe ermitteln:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + | sort -rh
```

Dann löschst du, was du auswählst. Vollständige Befehlsmuster findest du in [unserer Anleitung, um jeden node_modules-Ordner zu finden](/de/blog/find-node-modules-folders-mac).

**Stärken:** Keine Abhängigkeiten, funktioniert überall, skriptfähig, du siehst genau, was passiert.

**Schwächen:** Du musst selbst daran denken. Die Größenermittlung ist auf großen Festplatten langsam, `du` zählt pnpm-Hardlinks doppelt (Details [hier](/de/blog/pnpm-store-explained)), die Prüfung auf Alter ist eine Shell-Verrenkung, und das naheliegende Löschwerkzeug ist `rm -rf`, das kein Rückgängig kennt. Realistisch machen das die meisten Leute einmal, fühlen sich großartig, und machen es nie wieder.

**Am besten für:** einmalige Aufräumaktionen, Remote-Server, Leute, die im Terminal leben und das auch so wollen.

## Option 2: npkill

[npkill](https://npkill.js.org/) ist ein gut gemachtes Open-Source-CLI: Du führst `npx npkill` aus, es scannt vom aktuellen Verzeichnis aus, listet jedes `node_modules` mit seiner Größe auf, und du löschst mit der Leertaste. Es ist kostenlos, schnell gestartet, und verdient seine Beliebtheit.

**Stärken:** Kostenlos, keine Installation (läuft über npx), interaktiv und viel freundlicher als rohes find/du, zeigt das letzte Änderungsdatum, plattformübergreifend.

**Schwächen:** Immer noch eine Sitzung, die du selbst starten musst. Es scannt von dem Ort aus, an dem du es startest, Ordner außerhalb dieses Baums werden übersehen. Das Löschen ist sofort und endgültig statt über den Papierkorb (kein Rückgängig, wenn du die falsche Zeile erwischst). Es deckt nur `node_modules` ab: kein Bewusstsein für den pnpm-Store, und hardlink-verknüpfte pnpm-Ordner zeigen Größen, die übertreiben, was das Löschen wirklich freigibt.

**Am besten für:** Entwickler, die eine kostenlose, gelegentliche, interaktive Aufräumaktion wollen und sich im Terminal wohlfühlen.

## Option 3: TidyDisk

[TidyDisk](/de) ist eine macOS-Menüleisten-App. Sie scannt kontinuierlich statt auf Zuruf: jeden `node_modules`-Ordner, deinen pnpm-Store und deine installierten Pakete, korrekt bemessen (sie berücksichtigt pnpm-Hardlinks, statt sie doppelt zu zählen) und nach Alter sortiert. Aufräumen geht mit einem Klick, und alles wandert in den Papierkorb, nie über `rm -rf`, sodass jeder Fehler rückgängig gemacht werden kann. Der Scan ist kostenlos; das Aufräumen mit einem Klick ist eine Lifetime-Lizenz für 19 Euro.

**Stärken:** Die Zahl ist immer aktuell, keine Sitzung, an die du denken musst. pnpm-bewusste Größenermittlung. Löschen über den Papierkorb mit echtem Rückgängig. Alterssortierung eingebaut. Kein Terminal nötig.

**Schwächen:** Nur macOS. Der Aufräum-Klick kostet Geld (einmalig). Wer ein skriptfähiges, verkettbares Tool will, bevorzugt ein CLI.

**Am besten für:** Mac-Entwickler, die das Problem kontinuierlich statt heroisch gelöst haben wollen, und alle, die sich schon mal bei einem `rm -rf` vertippt haben.

## Die eigentliche Entscheidung

| Du bist... | Nutze |
|---|---|
| Am Aufräumen eines Servers oder CI-Rechners | Manuelle Befehle |
| Ein Terminal-Mensch, der kostenlos vierteljährlich aufräumt | npkill |
| Auf einem Mac und willst es kontinuierlich, sicher und mit einem Klick | TidyDisk |

Und zwei ehrliche Anmerkungen. Erstens: Wenn du zweimal im Jahr aufräumst und das Terminal dir keine Angst macht, ist npkill wirklich gut und kostet nichts; uns ist lieber, du nutzt es, als dass du gar nichts tust. Zweitens: Was auch immer du wählst, lösche in den Papierkorb, wenn du kannst, und lies nach, [warum rm -rf die falsche Gewohnheit ist](/de/blog/never-rm-rf-node-modules), wenn du es nicht kannst.

Wenn die kontinuierliche Option nach deinem Tempo klingt, [lade TidyDisk herunter](/de) und starte den kostenlosen Scan. Du kennst deine Zahl in etwa einer Minute, und meistens ist es genau diese erste Zahl, die überzeugt.
