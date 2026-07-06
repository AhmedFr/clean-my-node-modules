---
title: "Pourquoi node_modules est-il si énorme ? Ce qu'il y a vraiment dedans"
description: "Pourquoi une app de 20 lignes fait venir 300 Mo de dépendances : packages transitifs, versions dupliquées, outils de dev, et binaires par plateforme expliqués."
date: "2026-07-11"
---

Vous écrivez un serveur Express de 20 lignes, lancez `npm install`, et `node_modules` atterrit à 180 Mo avec 4 000 fichiers. La fameuse blague imagine `node_modules` comme plus lourd qu'un trou noir. Mais ce poids n'est ni un bug ni un accident. C'est le résultat direct de quelques choix de conception délibérés dans l'écosystème npm, et une fois qu'on les voit, la taille cesse d'être mystérieuse.

## Les dépendances transitives : vous en installez 5, vous en obtenez 800

Votre `package.json` liste des dépendances directes. Chacune a ses propres dépendances, et ainsi de suite en descendant l'arbre. Installer un framework web classique plus un lanceur de tests plus un bundler résout couramment vers 800 à 1 500 packages distincts.

Voyez-le par vous-même :

```bash
npm ls --all | wc -l
```

L'écosystème npm a historiquement favorisé de nombreux petits packages à but unique plutôt que de grandes bibliothèques standards. Ça a de vrais bénéfices (code ciblé, mises à jour indépendantes) et un coût évident : le graphe de dépendances explose, et chaque nœud du graphe est un dossier sur votre disque avec son propre `package.json`, README, fichier de licence, et souvent ses propres tests et source maps livrés dans l'archive.

## La duplication : le même package, cinq fois

Deux de vos dépendances ont besoin de `lodash`, mais l'une veut `^4.17.0` et l'autre épingle `4.16.6`. Les gestionnaires de paquets utilisant une organisation `node_modules` plate (npm, yarn classic) dédupliquent ce qu'ils peuvent, mais tout conflit de version signifie que la même bibliothèque est physiquement copiée plusieurs fois à différentes profondeurs de l'arbre.

Vérifiez à quel point c'est grave dans un projet :

```bash
npm ls lodash
npm dedupe --dry-run
```

Dans les grosses applications, il est courant de trouver la même bibliothèque utilitaire présente en 3 à 6 versions différentes. Chaque copie est entièrement matérialisée sur le disque. pnpm attaque exactement ce problème avec un store adressé par contenu et des liens physiques, ce qui explique pourquoi le même ensemble de projets prend nettement moins d'espace disque réel sous pnpm. On décompose ce mécanisme dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained).

## Les dépendances de développement dépassent votre app

Les dépendances d'exécution de la plupart des apps sont modestes. Ce qui est lourd, c'est la chaîne d'outils : TypeScript embarque un compilateur d'environ 60 Mo, les bundlers et leurs écosystèmes de plugins ajoutent des dizaines de mégaoctets, les lanceurs de tests apportent leurs propres analyseurs et instrumentation, les linters portent des AST complets pour chaque syntaxe qu'ils supportent.

Un moyen rapide de sentir la différence :

```bash
npm install --omit=dev
du -sh node_modules
```

Les installations de production uniquement sont fréquemment 3 à 10 fois plus petites que l'installation de développement complète. Le `node_modules` d'1 Go, c'est surtout l'atelier, pas le produit.

## Les binaires par plateforme : les poids lourds silencieux

Certains packages livrent des binaires natifs précompilés pour chaque plateforme et architecture qu'ils supportent : traitement d'image (sharp), navigateurs headless (puppeteer télécharge un Chromium complet d'environ 170 Mo), pilotes de base de données, SWC et esbuild avec des binaires par plateforme. Une poignée d'entre eux peut doubler la taille d'un projet par ailleurs ordinaire.

Trouvez les gros morceaux dans n'importe quel `node_modules` :

```bash
du -sh node_modules/* node_modules/.pnpm 2>/dev/null | sort -rh | head -20
```

Lancez ça dans un projet et vous trouverez généralement 5 packages responsables de la moitié du total.

## Des fichiers qui n'existent pour aucune raison d'exécution

Les archives de packages incluent fréquemment de la documentation, des dossiers d'exemples, des suites de tests, des sources TypeScript aux côtés de la sortie compilée, et des source maps. Rien de tout ça n'est nécessaire pour faire tourner votre app, et tout est décompressé sur votre disque. Multipliez un petit gaspillage par 1 200 packages et ça cesse d'être petit.

## Alors, la taille est-elle un problème ?

Pour un seul projet actif : pas vraiment. Le disque est bon marché, et la chaîne d'outils gagne ses mégaoctets au quotidien.

Le vrai coût apparaît en agrégat. Chaque projet que vous avez un jour cloné garde sa propre copie complète de ce poids pour toujours, que vous l'ayez ouvert la semaine dernière ou l'année dernière. Dix projets obsolètes à 500 Mo chacun, ça fait 5 Go de poids mort pur, et la plupart des développeurs actifs en ont bien plus que dix. Cet agrégat est ce qui vaut la peine d'être nettoyé, et c'est complètement sûr à nettoyer car `node_modules` est toujours reproductible depuis le fichier de verrouillage, comme couvert dans [Comment supprimer node_modules en toute sécurité](/fr/blog/how-to-delete-node-modules-safely).

Si vous voulez connaître votre propre chiffre, [TidyDisk](/fr) scanne votre Mac gratuitement et montre chaque dossier `node_modules`, dimensionné et trié, avec les obsolètes signalés. La plupart des gens trouvent plus de 20 Go au premier scan. Le récupérer coûte un clic et une licence à vie à 19 euros, et tout part vers la Corbeille, donc rien n'est jamais perdu par erreur.
