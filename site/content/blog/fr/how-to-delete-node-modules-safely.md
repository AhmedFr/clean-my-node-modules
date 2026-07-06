---
title: "Comment supprimer node_modules en toute sécurité et récupérer des gigaoctets"
description: "Un guide pratique pour supprimer node_modules sans rien casser : ce qui est sûr, ce qu'il faut vérifier d'abord, et comment le faire en quelques secondes."
date: "2026-07-04"
---

Chaque projet JavaScript que vous avez un jour cloné a laissé quelque chose derrière lui : un dossier `node_modules` qui peut facilement peser de 200 Mo à plus d'1 Go. Multipliez ça par les dizaines de projets qui dorment dans votre dossier `~/code` ou `~/dev`, et vous vous retrouvez souvent avec 20, 50, parfois 100 Go d'espace disque retenus par des dépendances auxquelles vous n'avez pas touché depuis des mois.

La bonne nouvelle : `node_modules` est 100 % jetable. La meilleure nouvelle : vous pouvez tout récupérer en quelques secondes quand vous en avez besoin.

## Pourquoi supprimer node_modules est toujours sûr

`node_modules` ne contient rien d'original. C'est une copie matérialisée de ce que décrivent votre `package.json` et votre fichier de verrouillage (`package-lock.json`, `yarn.lock`, ou `pnpm-lock.yaml`). Votre code, votre configuration, et les versions de vos dépendances vivent tous en dehors de ce dossier.

Ça veut dire que le chemin de récupération est toujours le même :

```bash
npm install   # ou yarn, ou pnpm install
```

Lancez ça dans le dossier du projet et tout l'arbre `node_modules` revient, équivalent octet pour octet du point de vue de votre projet, car le fichier de verrouillage fixe chaque version.

Il n'y a que deux choses à vérifier avant de supprimer :

1. **Le projet tourne-t-il en ce moment ?** Arrêtez d'abord les serveurs de dev et les watchers. Un processus en cours avec des descripteurs de fichiers ouverts dans `node_modules` peut se comporter bizarrement quand le dossier disparaît sous lui.
2. **Avez-vous le fichier de verrouillage commité ?** Si oui (ce qui est presque certainement le cas), la réinstallation reproduit exactement le même arbre de dépendances. Si le projet n'a pas de fichier de verrouillage, la réinstallation fonctionne quand même mais peut résoudre des versions légèrement plus récentes.

C'est toute la checklist. Il n'y a pas d'état, pas de cache dont vous regretteriez la perte, pas de configuration à l'intérieur de `node_modules` qui compte.

## De combien d'espace parle-t-on ?

Vérifiez un seul projet :

```bash
du -sh ./node_modules
```

Les résultats typiques vont de 150 Mo pour une petite bibliothèque à 1,5 Go et plus pour une app full-stack avec un bundler, un lanceur de tests, et un framework d'interface. Si vous voulez voir le total sur tout ce que vous avez, ceci trouve chaque `node_modules` sur le disque et le dimensionne :

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} +
```

Sur une machine utilisée quotidiennement pour du JavaScript pendant un an ou deux, des totaux de 30 à 80 Go sont parfaitement normaux. On a écrit plus en détail sur d'où vient tout ce poids dans [Pourquoi node_modules est-il si énorme ?](/fr/blog/why-is-node-modules-so-huge).

## La méthode manuelle

Pour un seul projet, l'approche classique :

```bash
cd ~/code/old-project
rm -rf node_modules
```

Ça marche, mais on déconseille `rm -rf` comme habitude, pour une raison simple : c'est instantané et irréversible. Tapez le mauvais chemin, l'autocomplétion attrape le mauvais dossier, et il n'y a pas d'annulation possible. Déplacer le dossier vers la Corbeille à la place garde un filet de sécurité :

```bash
# macOS : déplacer vers la Corbeille au lieu de détruire immédiatement
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'
```

Un peu lourd, mais récupérable. Tout ce qui supprime des fichiers de développeur devrait être récupérable par défaut.

## Le problème du lot

Supprimer un dossier est facile. Le vrai problème, ce sont les 40 autres projets que vous avez oubliés : le tutoriel suivi en mars, le test technique de votre dernière recherche d'emploi, les trois projets annexes abandonnés. Chacun retient tranquillement des centaines de mégaoctets.

Les trouver tous, vérifier quand vous avez touché chaque projet pour la dernière fois, dimensionner chaque dossier, et décider ce qui est sûr à retirer, c'est exactement le genre de corvée qui ne se fait jamais à la main.

Vous pouvez le scripter, et beaucoup de développeurs le font. Il existe aussi des outils en ligne de commande conçus pour ça. Mais si vous voulez que ce soit une décision de 10 secondes plutôt qu'une session de terminal, c'est précisément pour ça qu'on a construit [TidyDisk](/fr) : il vit dans votre barre de menu macOS, sait en continu où se trouve chaque dossier `node_modules`, sa taille, et à quel point le projet est obsolète, et vous laisse nettoyer ceux que vous choisissez en un clic. Tout part vers la Corbeille, jamais par `rm -rf`, donc une erreur ne vous coûte rien.

## Et le store pnpm et les caches globaux ?

Si vous utilisez pnpm, supprimer le `node_modules` d'un projet libère moins que ce à quoi vous pourriez vous attendre, car pnpm crée des liens physiques vers un store global adressé par contenu. Le store lui-même se nettoie séparément avec `pnpm store prune`. On couvre tout ce sujet dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained).

npm et yarn gardent aussi des caches globaux (`~/.npm`, `~/Library/Caches/Yarn`) qui survivent volontairement aux suppressions de projets. C'est un nettoyage séparé avec ses propres règles.

## L'habitude qui garde votre disque propre

Une routine simple qui prend moins d'une minute par mois :

1. Lister les projets auxquels vous n'avez pas touché depuis 60 jours ou plus.
2. Supprimer leur `node_modules` (vers la Corbeille).
3. Réinstaller à la demande le jour où vous revenez vraiment sur l'un d'eux.

Le coût de se tromper est un `npm install` et une pause café. Le gain est des dizaines de gigaoctets récupérés, définitivement, car les projets obsolètes reviennent rarement à la vie.

Si vous préférez avoir cette routine automatisée, [TidyDisk](/fr) fait le scan gratuitement : installez-le, et il vous montre exactement combien de gigaoctets vos dossiers `node_modules` retiennent en ce moment. Les nettoyer en un clic est une licence à vie à 19 euros, et le scan seul rentabilise généralement le téléchargement en surprises évitées.
