---
title: "npkill vs nettoyage manuel vs TidyDisk : lequel choisir ?"
description: "Une comparaison honnête des trois façons de nettoyer node_modules sur un Mac : commandes Terminal brutes, la CLI npkill, et l'app de barre de menu TidyDisk."
date: "2026-08-15"
---

Il existe trois façons raisonnables de récupérer l'espace disque que vos projets JavaScript accumulent : le faire à la main dans le terminal, utiliser un outil en ligne de commande conçu pour ça, ou faire tourner une app qui surveille en continu. On en construit un des trois, à pondérer en conséquence, mais voici la comparaison honnête, y compris les cas où la réponse n'est pas nous.

## Option 1 : commandes Terminal manuelles

L'option zéro installation. Trouver et dimensionner tout :

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + | sort -rh
```

Puis supprimer ce que vous choisissez. Les modèles de commande complets sont dans [notre guide pour trouver chaque dossier node_modules](/fr/blog/find-node-modules-folders-mac).

**Atouts :** aucune dépendance, fonctionne partout, scriptable, vous voyez exactement ce qui se passe.

**Faiblesses :** vous devez vous souvenir de le faire. Le dimensionnement est lent sur les gros disques, `du` compte deux fois les liens physiques de pnpm (détails [ici](/fr/blog/pnpm-store-explained)), la vérification d'ancienneté est une contorsion shell, et l'outil de suppression naturel est `rm -rf`, qui n'a pas d'annulation. En réalité, la plupart des gens font ça une fois, se sentent bien, et ne le refont jamais.

**Idéal pour :** les nettoyages ponctuels, les serveurs distants, les gens qui vivent dans le terminal et aiment ça.

## Option 2 : npkill

[npkill](https://npkill.js.org/) est une CLI open source bien conçue : lancez `npx npkill`, elle scanne depuis le dossier courant, liste chaque `node_modules` avec sa taille, et vous supprimez avec la barre d'espace. C'est gratuit, ça démarre vite, et ça mérite sa popularité.

**Atouts :** gratuit, aucune installation (fonctionne via npx), interactif et bien plus convivial que find/du bruts, montre les infos de dernière modification, multiplateforme.

**Faiblesses :** ça reste une session dont il faut se souvenir. Ça scanne depuis l'endroit où vous le lancez, donc les dossiers hors de cet arbre sont ratés. La suppression est immédiate et permanente plutôt que vers la Corbeille (pas d'annulation si vous choisissez la mauvaise ligne). Ça ne couvre que `node_modules` : aucune conscience du store pnpm, et les dossiers pnpm à liens physiques affichent des tailles qui surestiment ce que la suppression libérera vraiment.

**Idéal pour :** les développeurs qui veulent un nettoyage gratuit, occasionnel, interactif, et à l'aise dans un terminal.

## Option 3 : TidyDisk

[TidyDisk](/fr) est une app de barre de menu macOS. Elle scanne en continu plutôt qu'à la demande : chaque dossier `node_modules`, votre store pnpm, et vos packages installés, dimensionnés correctement (elle tient compte des liens physiques de pnpm au lieu de les compter deux fois) et classés par ancienneté. Le nettoyage se fait en un clic, et tout part vers la Corbeille, jamais par `rm -rf`, donc toute erreur est réversible. Le scan est gratuit ; le nettoyage en un clic est une licence à vie à 19 euros.

**Atouts :** le chiffre est toujours à jour, aucune session à se rappeler. Dimensionnement conscient de pnpm. Suppression via la Corbeille avec vraie annulation. Classement par ancienneté intégré. Aucun terminal nécessaire.

**Faiblesses :** macOS uniquement. Le clic de nettoyage coûte de l'argent (une fois). Les gens qui veulent un outil scriptable et « pipeable » préféreront une CLI.

**Idéal pour :** les développeurs Mac qui veulent que le problème soit géré en continu plutôt qu'héroïquement, et quiconque a déjà tapé un `rm -rf` de travers.

## La vraie décision

| Vous êtes... | Utilisez |
|---|---|
| En train de nettoyer un serveur ou une machine CI | Commandes manuelles |
| Une personne de terminal qui fait une purge trimestrielle, gratuite | npkill |
| Sur un Mac et voulez que ce soit continu, sûr, et en un clic | TidyDisk |

Et deux remarques honnêtes. D'abord : si vous nettoyez deux fois par an et que le terminal ne vous fait pas peur, npkill est vraiment bon et ne coûte rien ; on préférerait que vous l'utilisiez plutôt que rien. Ensuite : quoi que vous choisissiez, supprimez vers la Corbeille quand vous le pouvez et consultez [pourquoi rm -rf est la mauvaise habitude](/fr/blog/never-rm-rf-node-modules) quand vous ne le pouvez pas.

Si l'option continue vous semble être votre style, [téléchargez TidyDisk](/fr) et lancez le scan gratuit. Vous connaîtrez votre chiffre en une minute environ, et le premier chiffre est généralement le plus convaincant.
