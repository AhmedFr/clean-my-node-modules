---
title: "Comment trouver chaque dossier node_modules sur votre Mac"
description: "Les commandes Terminal pour localiser et dimensionner chaque dossier node_modules sur macOS, les trier par taille et ancienneté, et décider quoi supprimer."
date: "2026-07-25"
---

Avant de pouvoir nettoyer, il faut savoir ce qui est là. La plupart des développeurs pensent avoir « quelques » dossiers `node_modules` et en découvrent des dizaines. Ce guide vous donne les commandes exactes pour tous les trouver, les dimensionner, et les classer selon leur degré de sécurité pour la suppression.

## La recherche de base

Partez du dossier où vivent vos projets (ajustez `~/code` selon votre organisation) :

```bash
find ~/code -name node_modules -type d -prune
```

L'option `-prune` est essentielle : elle empêche `find` de descendre dans chaque `node_modules` qu'il trouve, ce qui évite les `node_modules` imbriqués à l'intérieur des dépendances (ceux-ci disparaissent de toute façon avec leur parent) et rend la commande nettement plus rapide.

Si vos projets sont dispersés, cherchez dans tout votre dossier personnel. Attendez-vous à ce que ce soit long sur un gros disque :

```bash
find ~ -name node_modules -type d -prune 2>/dev/null
```

Le `2>/dev/null` masque les erreurs de permission provenant des dossiers système que vous ne pouvez de toute façon pas lire.

## Ajouter les tailles

Passez chaque résultat dans `du` :

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh
```

`sort -rh` place les plus gros dossiers en tête. Sur une machine avec un an de travail JavaScript actif, le haut de cette liste réserve généralement une surprise : des dossiers individuels de 800 Mo à 2 Go, et des totaux se comptant en dizaines de gigaoctets.

Pour le chiffre total unique :

```bash
find ~/code -name node_modules -type d -prune -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {printf "%.1f GB\n", s/1048576}'
```

Une mise en garde si vous utilisez pnpm : les liens physiques (hard links) faussent ces chiffres à la hausse, parfois sévèrement. Les octets sont partagés avec le store global, et supprimer un projet libère moins que ce que `du` suggère. Les détails sont dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained).

## Classer par ancienneté

La taille vous dit ce qui vaut la peine d'être supprimé ; l'ancienneté vous dit ce qui est sûr. Un `node_modules` auquel vous n'avez pas touché depuis six mois appartient à un projet vers lequel vous ne reviendrez probablement pas de sitôt, et le réinstaller plus tard ne coûte qu'un `npm install`.

Ceci liste chaque dossier de projet avec la dernière fois que quelque chose dans le projet (hors `node_modules` lui-même) a été modifié :

```bash
for nm in $(find ~/code -name node_modules -type d -prune); do
  proj=$(dirname "$nm")
  last=$(find "$proj" -path "$proj/node_modules" -prune -o -type f -newer "$nm" -print -quit 2>/dev/null)
  mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$proj")
  size=$(du -sh "$nm" 2>/dev/null | cut -f1)
  echo "$mod  $size  $proj"
done | sort
```

Tout ce qui se trouve en haut de cette liste (les plus anciens d'abord) avec une colonne de taille bien grasse est un candidat de choix. Supprimer est sûr car `node_modules` est toujours reproductible à partir du fichier de verrouillage, comme expliqué dans [Comment supprimer node_modules en toute sécurité](/fr/blog/how-to-delete-node-modules-safely).

## Le problème de maintenance

Ces commandes fonctionnent. Le hic, c'est que le nettoyage de disque n'est pas un événement ponctuel. De nouveaux projets apparaissent, les anciens deviennent obsolètes, et trois mois plus tard les mêmes gigaoctets sont de retour. Personne ne relance une boucle shell de cinq lignes sur un planning régulier.

Cet écart entre « possible dans le terminal » et « effectivement fait » est exactement ce que [TidyDisk](/fr) comble. Il vit dans votre barre de menu macOS et garde la réponse à jour : chaque dossier `node_modules`, sa taille réelle (conscient de pnpm, donc sans double comptage des liens physiques), et à quel point son projet est obsolète, classé et prêt. Quand le total dépasse un seuil qui vous importe, vous le voyez sans avoir à demander.

## Décidez, puis supprimez

Quelle que soit la route choisie, le cadre de décision reste le même :

1. **Projets actifs (touchés cette semaine) : gardez.** Le coût de réinstallation vous agacerait.
2. **Projets récents (touchés ce mois-ci) : gardez sauf s'ils sont énormes.**
3. **Tout ce qui est plus vieux : supprimez.** Si vous revenez un jour sur le projet, `npm install` reconstruit tout en une minute ou deux.

Et quand vous supprimez, préférez la Corbeille à `rm -rf`. La Corbeille ne coûte rien et transforme un chemin mal tapé d'une catastrophe en non-événement.

Lancez le scan gratuit de [TidyDisk](/fr) et vous aurez votre chiffre complet et honnête en une minute environ. La plupart des premiers scans trouvent plus de 20 Go. Le récupérer coûte un clic avec une licence à vie à 19 euros.
