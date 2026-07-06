---
title: "npm cache clean : ce qu'il libère vraiment (et ce qu'il ne fait pas)"
description: "Ce qui vit dans le cache npm, quand npm cache clean --force aide vraiment, pourquoi verify est meilleur, et où se trouvent les vraies économies d'espace."
date: "2026-08-01"
---

`npm cache clean --force` est la première commande à laquelle la plupart des gens pensent quand l'usage disque lié à npm devient incontrôlable. C'est rarement la bonne. Voici ce que contient vraiment le cache npm, ce que son nettoyage libère, et où se trouve vraiment l'espace que vous cherchez.

## Ce qu'il y a dans le cache npm

npm garde un cache adressé par contenu dans `~/.npm` (précisément `~/.npm/_cacache`). Chaque archive de package que npm a jamais téléchargée y est stockée, avec les métadonnées du registre. Son rôle est de rendre les installations répétées rapides et de permettre aux installations de fonctionner hors ligne.

Dimensionnez le vôtre :

```bash
du -sh ~/.npm
```

Les tailles typiques vont de quelques centaines de mégaoctets à plusieurs gigaoctets sur les machines avec un long historique npm.

Deux propriétés comptent :

1. **Il s'auto-répare.** Les données sont vérifiées par somme de contrôle à la sortie ; les entrées corrompues sont retéléchargées automatiquement. Les raisons historiques de nettoyer régulièrement le cache ont surtout disparu avec npm 5.
2. **Il est partagé.** Un seul cache sert tous les projets. Le supprimer ralentit la prochaine installation de tout le monde.

## Ce que le nettoyage fait vraiment

```bash
npm cache clean --force
```

Ça supprime tout le cache. L'option `--force` est requise précisément parce que l'équipe npm considère qu'un nettoyage manuel n'est presque jamais nécessaire. Vous libérez la taille de `~/.npm` une fois, puis les installations commencent immédiatement à le remplir à nouveau, chacune plus lente qu'elle ne l'aurait été car les archives doivent être retéléchargées.

L'outil plus doux, c'est :

```bash
npm cache verify
```

Ça vérifie l'intégrité, nettoie les données inutiles par ramasse-miettes, et rapporte ce qui a été récupéré, sans jeter les entrées valides. Si vous sentez que le cache est trop gros, lancez d'abord `verify` ; ça réduit souvent une part significative tout en gardant les installations rapides.

## Quand clean --force est vraiment la bonne solution

- Vous récupérez de l'espace sur une machine que vous retirez du travail JavaScript.
- Le cache a dépassé ce que votre disque peut se permettre et vous acceptez des installations plus lentes.
- Vous déboguez un cache vraiment corrompu que `verify` ne peut pas réparer (rare).

En dehors de ces cas, le cache est l'un des rares postes d'usage disque de dev qui gagne sa place au quotidien.

## Où se trouve le vrai espace

Voici la comparaison qui compte. Sur une machine de dev typique :

| Emplacement | Taille typique | Coût de la suppression |
|---|---|---|
| Cache `~/.npm` | 0,5 à 3 Go | Installations futures plus lentes |
| Tous les dossiers `node_modules` | 20 à 80 Go | Un `npm install` par projet réactivé |
| Store pnpm (si utilisé) | 2 à 15 Go | Retéléchargement à la prochaine installation après purge |

Le cache est généralement le plus petit des trois et le seul avec un bénéfice de performance continu. Les dossiers `node_modules` obsolètes sont dix à trente fois plus gros et ne vous rendent rien. Si vous avez quinze minutes pour le nettoyage de disque, le cache est le dernier endroit où les passer. Commencez par [trouver chaque dossier node_modules sur votre Mac](/fr/blog/find-node-modules-folders-mac), supprimez les obsolètes, et si vous utilisez pnpm, lancez `pnpm store prune` comme décrit dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained).

Utilisateurs de yarn : le cache équivalent vit dans `~/Library/Caches/Yarn` et se nettoie avec `yarn cache clean` ; la même logique s'applique.

## Un ordre de nettoyage sensé pour les utilisateurs npm

1. Supprimer les `node_modules` de projets obsolètes (le gros gain, entièrement récupérable).
2. Lancer `npm cache verify` (réduction gratuite, aucun inconvénient).
3. Ne recourir à `npm cache clean --force` que quand vous avez besoin du dernier gigaoctet et acceptez le coût.

Si l'étape 1 vous semble fastidieuse, c'est la partie qu'automatise [TidyDisk](/fr) : un scan gratuit montre chaque `node_modules` sur votre Mac, dimensionné et trié par ancienneté, et un clic envoie ceux que vous choisissez vers la Corbeille. La licence à vie à 19 euros se rentabilise dès la première fois qu'elle vous évite de faire cette liste à la main.
