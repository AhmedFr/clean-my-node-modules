---
title: "node_modules sicher löschen und Gigabytes zurückgewinnen"
description: "Ein praktischer Leitfaden, um node_modules-Ordner zu löschen, ohne etwas kaputtzumachen: was sicher ist, was du vorher prüfst, und wie es in Sekunden geht."
date: "2026-07-04"
---

Jedes JavaScript-Projekt, das du je geklont hast, hat etwas hinterlassen: einen `node_modules`-Ordner, der locker 200 MB bis über 1 GB wiegen kann. Multipliziere das mit den Dutzenden Projekten in deinem `~/code`- oder `~/dev`-Ordner, und du landest oft bei 20, 50, manchmal 100 GB Speicherplatz, gebunden in Abhängigkeiten, die du seit Monaten nicht mehr angefasst hast.

Die gute Nachricht: `node_modules` ist zu 100 % entbehrlich. Die bessere Nachricht: Du bekommst alles in Sekunden zurück, wenn du es brauchst.

## Warum das Löschen von node_modules immer sicher ist

`node_modules` enthält nichts Originales. Es ist eine materialisierte Kopie dessen, was deine `package.json` und deine Lockfile (`package-lock.json`, `yarn.lock` oder `pnpm-lock.yaml`) beschreiben. Dein Code, deine Konfiguration und deine Abhängigkeitsversionen leben alle außerhalb davon.

Das bedeutet, der Weg zurück ist immer derselbe:

```bash
npm install   # oder yarn, oder pnpm install
```

Führe das im Projektordner aus, und der komplette `node_modules`-Baum kommt zurück, aus Sicht deines Projekts byteidentisch, weil die Lockfile jede Version festnagelt.

Es gibt nur zwei Dinge, die es zu prüfen lohnt, bevor du löschst:

1. **Läuft das Projekt gerade?** Stoppe zuerst Dev-Server und Watcher. Ein laufender Prozess mit offenen Dateihandles in `node_modules` kann sich seltsam verhalten, wenn der Ordner unter ihm verschwindet.
2. **Hast du die Lockfile committet?** Falls ja (was fast sicher der Fall ist), erzeugt die Neuinstallation exakt denselben Abhängigkeitsbaum. Hat das Projekt keine Lockfile, funktioniert die Neuinstallation trotzdem, löst aber möglicherweise leicht neuere Versionen auf.

Das ist die gesamte Checkliste. Es gibt keinen Zustand, keinen Cache, den du vermissen wirst, keine Konfiguration in `node_modules`, die irgendeine Rolle spielt.

## Von wie viel Speicherplatz reden wir hier?

Prüfe ein einzelnes Projekt:

```bash
du -sh ./node_modules
```

Typische Werte reichen von 150 MB für eine kleine Bibliothek bis 1,5 GB und mehr für eine Full-Stack-App mit Bundler, Test-Runner und UI-Framework. Willst du die Gesamtsumme über alles sehen, was du hast, findet dieser Befehl jedes `node_modules` auf der Festplatte und ermittelt die Größe:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} +
```

Auf einer Maschine, die ein oder zwei Jahre täglich für JavaScript-Arbeit genutzt wird, sind Summen von 30 bis 80 GB völlig normal. Wir haben ausführlicher darüber geschrieben, woher dieses ganze Gewicht kommt, in [Warum ist node_modules so riesig?](/de/blog/why-is-node-modules-so-huge).

## Der manuelle Weg

Für ein einzelnes Projekt der klassische Ansatz:

```bash
cd ~/code/old-project
rm -rf node_modules
```

Das funktioniert, aber wir raten davon ab, `rm -rf` zur Gewohnheit zu machen, aus einem einfachen Grund: Es ist sofort und unumkehrbar. Tippst du den falschen Pfad, autovervollständigt die Shell den falschen Ordner, gibt es kein Zurück. Den Ordner stattdessen in den Papierkorb zu verschieben, behält ein Sicherheitsnetz:

```bash
# macOS: in den Papierkorb verschieben statt sofort zu zerstören
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'
```

Umständlich, aber wiederherstellbar. Alles, was Entwicklerdateien löscht, sollte standardmäßig wiederherstellbar sein.

## Das Problem im großen Stil

Einen Ordner zu löschen ist leicht. Das eigentliche Problem sind die anderen 40 Projekte, die du vergessen hast: das Tutorial, dem du im März gefolgt bist, die Probeaufgabe aus deiner letzten Jobsuche, die drei aufgegebenen Nebenprojekte. Jedes davon hält still Hunderte Megabyte.

Sie alle zu finden, zu prüfen, wann du jedes Projekt zuletzt angefasst hast, jeden Ordner zu vermessen und zu entscheiden, was gefahrlos entfernt werden kann, ist genau die Art von Aufgabe, die von Hand nie erledigt wird.

Du kannst es skripten, und viele Entwickler tun das. Es gibt auch CLI-Tools, die genau dafür gebaut sind. Willst du aber, dass es eine 10-Sekunden-Entscheidung wird statt einer Terminal-Sitzung, ist genau dafür [TidyDisk](/de) gebaut: Es lebt in deiner macOS-Menüleiste, weiß fortlaufend, wo jeder `node_modules`-Ordner liegt, wie groß er ist und wie veraltet das Projekt ist, und lässt dich die ausgewählten mit einem Klick aufräumen. Alles wandert in den Papierkorb, nie über `rm -rf`, sodass dich ein Fehler nichts kostet.

## Was ist mit dem pnpm-Store und globalen Caches?

Nutzt du pnpm, gibt das Löschen des `node_modules`-Ordners eines Projekts weniger frei, als du vielleicht erwartest, weil pnpm Dateien aus einem globalen, inhaltsadressierten Store per Hardlink einbindet. Der Store selbst wird separat mit `pnpm store prune` bereinigt. Wir behandeln dieses ganze Thema in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained).

npm und yarn führen außerdem globale Caches (`~/.npm`, `~/Library/Caches/Yarn`), die Projektlöschungen absichtlich überleben. Das ist ein separates Aufräumthema mit eigenen Regeln.

## Die Gewohnheit, die deine Festplatte sauber hält

Eine einfache Routine, die weniger als eine Minute im Monat kostet:

1. Liste Projekte auf, die du seit 60+ Tagen nicht angefasst hast.
2. Lösche deren `node_modules` (in den Papierkorb).
3. Installiere bei Bedarf neu, an dem Tag, an dem du tatsächlich zu einem davon zurückkehrst.

Die Kosten, falls du dich irrst, sind ein `npm install` und eine Kaffeepause. Der Gewinn ist Dutzende Gigabyte, dauerhaft zurück, weil veraltete Projekte selten wieder zum Leben erwachen.

Möchtest du diese Routine lieber automatisiert haben: [TidyDisk](/de) übernimmt den Scan kostenlos. Installiere es, und es zeigt dir genau, wie viele Gigabyte deine `node_modules`-Ordner gerade belegen. Sie mit einem Klick aufzuräumen ist eine einmalige Lizenz für 19 Euro, und der Scan allein zahlt sich meist schon durch die ersparte Überraschung aus.
