---
title: "Warum ist node_modules so riesig? Was wirklich drinsteckt"
description: "Warum eine 20-Zeilen-App 300 MB Abhängigkeiten mitbringt: transitive Pakete, doppelte Versionen, Dev-Tooling und Plattform-Binaries erklärt."
date: "2026-07-11"
---

Du schreibst einen 20-Zeilen-Express-Server, führst `npm install` aus, und `node_modules` landet bei 180 MB mit 4.000 Dateien. Der bekannte Scherz stellt `node_modules` als schwerer als ein Schwarzes Loch dar. Aber das Gewicht ist kein Fehler und kein Zufall. Es ist das direkte Ergebnis einiger bewusster Design-Entscheidungen im npm-Ökosystem, und sobald du sie durchschaust, hört die Größe auf, mysteriös zu sein.

## Transitive Abhängigkeiten: du installierst 5, du bekommst 800

Deine `package.json` listet direkte Abhängigkeiten auf. Jede davon hat ihre eigenen Abhängigkeiten, und so weiter, den Baum hinunter. Die Installation eines typischen Web-Frameworks plus Test-Runner plus Bundler landet routinemäßig bei 800 bis 1.500 einzelnen Paketen.

Sieh es dir selbst an:

```bash
npm ls --all | wc -l
```

Das npm-Ökosystem hat historisch viele kleine, auf einen Zweck fokussierte Pakete gegenüber großen Standardbibliotheken bevorzugt. Das hat echte Vorteile (fokussierter Code, unabhängige Updates) und einen offensichtlichen Preis: Der Abhängigkeitsgraph explodiert, und jeder Knoten im Graphen ist ein Ordner auf deiner Festplatte mit eigener `package.json`, README, Lizenzdatei und oft eigenen Tests und Source Maps, die im Tarball mitgeliefert werden.

## Duplikate: dasselbe Paket, fünfmal

Zwei deiner Abhängigkeiten brauchen `lodash`, aber die eine will `^4.17.0` und die andere pinnt `4.16.6` fest. Paketmanager mit einem flachen `node_modules`-Layout (npm, yarn classic) deduplizieren, was sie können, aber jeder Versionskonflikt bedeutet, dass dieselbe Bibliothek an unterschiedlichen Tiefen des Baums physisch mehrfach kopiert wird.

Prüfe in einem Projekt, wie schlimm es wirklich ist:

```bash
npm ls lodash
npm dedupe --dry-run
```

In großen Apps ist es üblich, dieselbe Utility-Bibliothek in 3 bis 6 verschiedenen Versionen zu finden. Jede Kopie liegt vollständig auf der Festplatte. pnpm geht genau dieses Problem mit einem inhaltsadressierten Store und Hardlinks an, weshalb dieselbe Menge an Projekten unter pnpm dramatisch weniger echten Speicherplatz belegt. Wir schlüsseln diesen Mechanismus in [Der pnpm-Store erklärt](/de/blog/pnpm-store-explained) auf.

## Dev-Abhängigkeiten wiegen schwerer als deine App

Die Laufzeit-Abhängigkeiten der meisten Apps sind überschaubar. Schwer ist das Werkzeug drumherum: TypeScript bringt einen ~60 MB großen Compiler mit, Bundler und ihre Plugin-Ökosysteme fügen Dutzende Megabyte hinzu, Test-Runner bringen eigene Parser und Instrumentierung mit, Linter tragen vollständige ASTs für jede Syntax, die sie unterstützen.

Ein schneller Weg, den Unterschied zu spüren:

```bash
npm install --omit=dev
du -sh node_modules
```

Reine Produktions-Installationen sind häufig 3 bis 10 Mal kleiner als die vollständige Entwicklungsinstallation. Das 1 GB große `node_modules` ist meistens die Werkstatt, nicht das Produkt.

## Plattform-Binaries: die stillen Schwergewichte

Manche Pakete liefern vorkompilierte native Binaries für jede Plattform und Architektur, die sie unterstützen: Bildbearbeitung (sharp), Headless-Browser (puppeteer lädt ein vollständiges Chromium mit ~170 MB herunter), Datenbank-Treiber, SWC und esbuild mit Binaries pro Plattform. Eine Handvoll davon kann die Größe eines ansonsten gewöhnlichen Projekts verdoppeln.

Finde die Schwergewichte in jedem beliebigen `node_modules`:

```bash
du -sh node_modules/* node_modules/.pnpm 2>/dev/null | sort -rh | head -20
```

Führe das in einem Projekt aus, und du wirst meist 5 Pakete finden, die für die Hälfte des Gesamtvolumens verantwortlich sind.

## Dateien, die aus keinem Laufzeitgrund existieren

Paket-Tarballs enthalten häufig Dokumentation, Beispielordner, Testsuiten, TypeScript-Quellen neben dem kompilierten Output und Source Maps. Nichts davon wird gebraucht, um deine App auszuführen, aber alles davon wird auf deine Festplatte entpackt. Multipliziere kleine Verschwendung mit 1.200 Paketen, und sie hört auf, klein zu sein.

## Ist die Größe also ein Problem?

Für ein einzelnes aktives Projekt: nicht wirklich. Speicherplatz ist billig, und das Werkzeug verdient sich seine Megabyte jeden Tag.

Die echten Kosten zeigen sich in der Summe. Jedes Projekt, das du je geklont hast, behält seine eigene vollständige Kopie dieses Gewichts für immer, egal ob du es letzte Woche oder letztes Jahr geöffnet hast. Zehn veraltete Projekte à 500 MB sind 5 GB reines totes Gewicht, und die meisten aktiven Entwickler haben weit mehr als zehn. Diese Summe lohnt sich aufzuräumen, und das ist völlig sicher, weil `node_modules` immer aus der Lockfile reproduzierbar ist, wie wir in [Wie du node_modules sicher löschst](/de/blog/how-to-delete-node-modules-safely) erklärt haben.

Wenn du deine eigene Zahl wissen willst: [TidyDisk](/de) scannt deinen Mac kostenlos und zeigt jeden `node_modules`-Ordner, mit Größe und sortiert, mit markierten veralteten Ordnern. Die meisten Leute finden beim ersten Scan 20+ GB. Das Zurückholen ist ein Klick und eine einmalige 19-Euro-Lizenz, und alles wandert in den Papierkorb, sodass nie etwas versehentlich verloren geht.
