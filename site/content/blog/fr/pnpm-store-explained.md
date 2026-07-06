---
title: "Le store pnpm expliqué : où va vraiment votre espace disque"
description: "Comment fonctionnent le store adressé par contenu et les liens physiques de pnpm, pourquoi du ment sur la taille des projets, et comment nettoyer le store."
date: "2026-07-18"
---

La fonctionnalité phare de pnpm, c'est l'efficacité disque : installez la même dépendance dans dix projets et elle est stockée une seule fois sur le disque. Il tient cette promesse, mais ça rend aussi l'usage disque véritablement déroutant. Les outils rapportent des tailles qui semblent contradictoires, l'intuition de nettoyage héritée de npm cesse de s'appliquer, et l'endroit où votre espace est vraiment parti est un dossier que la plupart des gens n'ont jamais ouvert.

## La conception à deux niveaux

pnpm divise l'installation en deux couches :

1. **Le store global**, dans `~/Library/pnpm/store` sur macOS (vérifiez le vôtre avec `pnpm store path`). Chaque version de chaque package que vous avez jamais installé y vit exactement une fois, stockée par hash de contenu.
2. **Le node_modules par projet**, qui ne contient presque aucune donnée réelle de fichier. Les fichiers à l'intérieur de `node_modules/.pnpm` sont des liens physiques pointant vers le store, et vos entrées `node_modules` de premier niveau sont des liens symboliques vers `.pnpm`.

Un lien physique n'est pas une copie. C'est une seconde entrée de répertoire pour les mêmes octets sur le disque. Dix projets liant physiquement le même package `react` partagent une seule copie physique.

## Pourquoi du vous induit en erreur

Lancez `du -sh node_modules` dans un projet pnpm et vous pourriez voir 800 Mo. Supprimez ce projet et vous ne récupérerez peut-être que 40 Mo. Les deux chiffres sont honnêtes ; ils répondent à des questions différentes.

`du` compte la taille de chaque fichier qu'il peut atteindre. Il ne sait pas (à moins de comparer les nombres d'inodes sur tout le disque) que 760 de ces mégaoctets sont des liens physiques partagés avec le store et possiblement avec cinq autres projets. Les octets ne sont vraiment libérés que quand la dernière référence disparaît, et le store garde toujours une référence tant que vous ne le purgez pas.

Les conséquences pratiques :

- **Supprimer un seul projet pnpm libère peu.** Le store garde toujours tout.
- **Additionner du à travers des projets pnpm surcompte follement.** Les mêmes octets sont comptés une fois par projet.
- **Le store lui-même est là où vivent les vrais octets.** Dimensionnez-le avec `du -sh $(pnpm store path)`.

Sur APFS (le système de fichiers par défaut de macOS), il y a une deuxième subtilité : les clones. Deux fichiers peuvent partager leur stockage sans même partager un inode, ce qui les rend invisibles à la fois pour `du` et pour le comptage de liens physiques. Une comptabilité précise sur macOS moderne est authentiquement difficile, ce qui explique pourquoi les outils disque naïfs se trompent tant sur les configurations pnpm.

## Nettoyer le store de la bonne manière

Le store grandit indéfiniment par défaut : chaque version de chaque package que vous avez jamais installé reste, y compris les packages qu'aucun projet ne référence plus. Le nettoyage intégré :

```bash
pnpm store prune
```

Ça supprime les packages qu'aucun projet ne lie actuellement. C'est complètement sûr : tout ce qui est encore référencé est gardé, et tout ce qui est supprimé serait retéléchargé à la prochaine installation qui en a besoin. Sur une machine avec un an d'historique pnpm, une première purge libère couramment plusieurs gigaoctets.

Deux commandes connexes à connaître :

```bash
pnpm store path     # où est mon store ?
pnpm store status   # vérifier l'intégrité du store
```

## Ce que ça implique pour la stratégie de nettoyage

Si vous êtes utilisateur de pnpm, les priorités de nettoyage s'inversent par rapport à npm :

1. **Purgez d'abord le store.** C'est là que le poids mort se concentre.
2. **Puis supprimez les node_modules de projets obsolètes.** Chacun libère immédiatement ses fichiers non partagés et libère des références pour que la prochaine purge puisse en libérer davantage.
3. **Ne faites pas confiance aux chiffres du par projet.** Ce sont des bornes supérieures, souvent larges.

L'ordre compte : supprimer les projets puis purger libère le plus, car la purge ne peut supprimer que ce que plus rien ne lie.

Ce problème de mesure est aussi l'une des raisons pour lesquelles on a construit [TidyDisk](/fr) comme on l'a fait. Il comprend l'organisation de pnpm : il dimensionne le contenu réel du store plutôt que de compter deux fois les liens physiques entre projets, donc les gigaoctets qu'il rapporte sont des gigaoctets que vous récupérez vraiment. Le scan est gratuit, et le nettoyage passe toujours par la Corbeille, jamais par `rm -rf`, une habitude qu'on explique dans [Pourquoi il ne faut jamais faire rm -rf node_modules](/fr/blog/never-rm-rf-node-modules).

## L'essentiel

pnpm économise vraiment de l'espace disque, souvent de façon spectaculaire. Mais il déplace le problème plutôt que de l'éliminer : le store accumule chaque version de chaque package pour toujours jusqu'à ce que vous le purgiez, et les outils de dimensionnement standards ne peuvent pas voir à travers les liens physiques. Apprenez `pnpm store prune`, lancez-le après avoir supprimé de vieux projets, et méfiez-vous de tout outil qui rapporte les tailles de projets pnpm sans mentionner le store.

Envie de voir votre vrai chiffre ? [TidyDisk](/fr) montre votre store, chaque projet, et chaque node_modules obsolète dans une seule liste, gratuit à scanner, 19 euros une fois si vous voulez le nettoyage en un clic.
