---
title: "Warum du node_modules niemals mit rm -rf löschen solltest (nutze den Papierkorb)"
description: "rm -rf hat kein Rückgängig, und beim Aufräumen von node_modules passieren müde Fehler. Das Plädoyer für den Papierkorb, mit Befehlen."
date: "2026-08-29"
---

`rm -rf node_modules` ist einer der meistgetippten Befehle in der JavaScript-Entwicklung. Er funktioniert, er ist schnell, und ungefähr einmal pro Karriere zerstört er etwas, das wichtig war. Dieser Artikel ist das Plädoyer dafür, die Gewohnheit zu ändern, und was du stattdessen tippen solltest.

## Das Fehlerszenario ist nicht hypothetisch

`rm -rf` löscht sofort, rekursiv, lautlos und endgültig. Es gibt keine Bestätigung, kein Rückgängig und keine Wiederherstellung, außer über forensische Tools oder Backups. In Kombination mit Shell-Autovervollständigung und Fingerroutine sehen die klassischen Unfälle so aus:

```bash
rm -rf node_modules   # fine, in the right directory
rm -rf node_module s  # a space: deletes node_module AND s, or errors if lucky
rm -rf ./node_modules # typed in ~ instead of the project? nothing to stop you
rm -rf $DIR/node_modules  # $DIR unset: this is rm -rf /node_modules
```

Der Fall mit der leeren Variable hat schon so viele Leute erwischt, dass er zum Klischee geworden ist. Das sind keine Kompetenzprobleme, sondern Müdigkeitsprobleme, und jeder ist mal müde. Der Wirkungsradius des Befehls ist unbegrenzt und seine Geschwindigkeit sofort, genau die falsche Kombination für eine Routineaufgabe.

## Genau dafür gibt es den Papierkorb

macOS hat seit vierzig Jahren ein wiederherstellbares Löschen. Dateien im Papierkorb kosten dich nichts, bis du ihn leerst, und sie haben unzählige Fehler gerettet. Dev-Tools ignorieren das meist, weil der POSIX-Pfad (`rm`) älter ist und weil das Schreiben in den Papierkorb aus einem Skript eine Zeile mehr braucht. Das ist ein schlechter Tausch: Der ganze Sinn beim Löschen von `node_modules` ist, dass es risikoarm ist, und genau das macht die Löschung über den Papierkorb wirklich risikoarm, selbst wenn du den falschen Ordner erwischst.

Kommandozeilen-Optionen auf macOS:

```bash
# Finder via AppleScript (works everywhere, no install)
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'

# Homebrew tool, nicer ergonomics
brew install trash
trash node_modules
```

Auf modernem macOS gibt es in manchen Versionen auch einen nativen `trash`-Befehl; `brew install trash` deckt den Rest ab. Beide geben dir dieselbe Garantie: Aus Sicht deines Projekts ist das Löschen sofort, aus deiner Sicht ist es reversibel.

Wenn die Gewohnheit sitzen soll, leg dir einen Alias an:

```bash
alias rmnm='trash ./node_modules && echo "node_modules moved to Trash"'
```

## „Aber node_modules ist sowieso Wegwerfware"

Stimmt, [und genau deshalb ist es überhaupt sicher, es zu löschen](/de/blog/how-to-delete-node-modules-safely): Alles kommt mit `npm install` zurück. Bei diesem Argument geht es nicht um `node_modules` selbst. Es geht darum, was daneben liegt, wenn deine Finger ausrutschen. Der Ordner, den du eigentlich meintest, das Nachbarverzeichnis, das die Autovervollständigung erwischt hat, der Pfad, den eine Variable nicht gefüllt hat. Löschen über den Papierkorb bedeutet, dass der schlimmste Fall einer Aufräumaktion ist, einen Ordner wieder herauszuziehen, statt dir selbst erklären zu müssen, wohin drei Wochen eines ungepushten Branches verschwunden sind.

Es gibt noch einen subtileren Punkt: Gewohnheiten übertragen sich. Die Hände, die täglich `rm -rf node_modules` tippen, sind dieselben Hände, die eines Tages `rm -rf` neben etwas Unersetzlichem tippen werden. Das wiederherstellbare Löschen zum Standard zu machen, ist eine billige Versicherung für alles, was du tust.

## Was ist mit dem Speicherplatz?

Dateien im Papierkorb belegen weiterhin Speicherplatz, bis du ihn leerst, und wenn du aufräumst, um Platz freizumachen, spielt das eine Rolle. Der Ablauf ist trotzdem besser als rm: in den Papierkorb löschen, prüfen, dass deine Projekte in Ordnung sind, dann den Papierkorb bewusst leeren (oder die automatische 30-Tage-Leerung von macOS erledigen lassen). Genau die Trennung von „aus dem Projekt entfernen" und „die Bytes vernichten" macht den Prozess sicher.

## Unsere Haltung, ganz offen

Wir haben [TidyDisk](/de) genau nach diesem Prinzip gebaut: Jede Aufräumaktion läuft über den macOS-Papierkorb, nie über `rm -rf`, ohne Ausnahme. Es findet jedes `node_modules` auf deinem Mac, zeigt echte Größen (inklusive [ehrlicher pnpm-Abrechnung](/de/blog/pnpm-store-explained)) und räumt mit einem Klick auf, den du rückgängig machen kannst. Der Scan ist kostenlos; das Aufräumen mit einem Klick ist eine Lifetime-Lizenz für 19 Euro.

Ob du es je installierst oder nicht: Nimm dir die Gewohnheit mit. Auf einem Mac ist ein Löschen, das du rückgängig machen kannst, strikt besser als eines, das du nicht kannst. Leg dir einen Alias für `trash` an, verbanne `rm -rf` aus deinem Alltag, und heb es dir für den seltenen Tag auf, an dem du es wirklich brauchst.
