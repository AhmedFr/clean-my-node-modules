---
title: "Monorepos et espace disque : dompter node_modules à grande échelle"
description: "Pourquoi les monorepos multiplient le poids des dépendances, comment pnpm aide, et comment maîtriser caches turbo, builds par package, et clones obsolètes."
date: "2026-09-05"
---

Les monorepos concentrent tout : le code, les outils, et l'usage disque. Un seul monorepo bien utilisé peut porter plus de poids en dépendances qu'une douzaine de petits projets, et il ajoute de nouvelles catégories de consommation disque (caches de build, artefacts par package) que les conseils de nettoyage classiques ignorent. Voici où passent les gigaoctets et comment les récupérer.

## Où les monorepos placent leur poids

**Le node_modules racine.** Avec les workspaces npm, yarn, ou pnpm, la plupart des dépendances remontent vers un seul `node_modules` racine. Dans un dépôt de 20 packages, ce dossier fait couramment 1 à 3 Go. C'est en fait le résultat efficace : une copie partagée plutôt que 20.

**Les node_modules par package.** Les packages avec des versions en conflit ou des scripts de cycle de vie obtiennent leur propre `node_modules` imbriqué. Une poignée est normale ; des dizaines de gros suggèrent des conflits de versions à corriger avec une passe de `dedupe` :

```bash
npm dedupe --dry-run       # workspaces npm
pnpm dedupe --check        # pnpm 9+
```

**Les caches de build et de tâches.** Le `.turbo` de Turborepo, le `.nx/cache` de Nx, les caches Vite et webpack à l'intérieur de `node_modules/.cache`, les fichiers `.tsbuildinfo` de TypeScript. Ils gagnent leur place sur un dépôt actif et sont du gaspillage pur sur un clone obsolète. Ils peuvent rivaliser avec le poids des dépendances :

```bash
du -sh .turbo .nx/cache node_modules/.cache 2>/dev/null
```

**Les clones en double.** Le multiplicateur spécifique au monorepo : les worktrees et les seconds clones pour des branches parallèles. Chaque clone porte le poids complet du `node_modules` et des caches. Trois copies de travail d'un monorepo de 4 Go, ça fait 12 Go, et les deux que vous avez créées pour ce correctif urgent en mars sont toujours là.

## Le choix du gestionnaire de paquets compte encore plus ici

Tout ce qui est dans [npm vs yarn vs pnpm sur le disque](/fr/blog/npm-yarn-pnpm-disk-space) est amplifié par un monorepo, et pnpm a un avantage structurel qui vaut le coup d'être connu : puisque le `node_modules` de chaque projet est constitué de liens physiques vers un seul store, vos trois clones du monorepo partagent en grande partie l'espace disque physique. Avec npm ou yarn classic, chaque clone est une copie physique complète. Si vous gardez plusieurs copies de travail d'un gros dépôt, le modèle de store de pnpm est la décision disque la plus rentable disponible ([comment le store fonctionne](/fr/blog/pnpm-store-explained)).

## Un nettoyage qui respecte un monorepo actif

Pour le monorepo dans lequel vous travaillez quotidiennement :

1. **Laissez le node_modules racine tranquille.** Réinstaller un gros workspace prend quelques minutes ; le supprimer pour récupérer de l'espace dont vous aurez besoin demain est une perte nette.
2. **Réduisez les caches occasionnellement.** `.turbo` et compagnie se régénèrent au prochain build. Les vider sur un dépôt que vous utilisez encore coûte un build à froid.
3. **Dédupliquez les conflits de versions.** Réduit durablement la couche de `node_modules` par package.

Pour tout le reste, soyez sans pitié :

4. **Les clones et worktrees obsolètes sont le jackpot.** Un second clone oublié représente plusieurs gigaoctets de pure duplication. `git worktree list` révèle les worktrees oubliés ; supprimez leur `node_modules` d'abord, puis le worktree lui-même si la branche a été livrée.
5. **Les monorepos archivés** (le vieux dépôt de l'entreprise, la réécriture abandonnée) gardent tout leur poids pour toujours. Leurs `node_modules` et caches sont [sûrs à supprimer](/fr/blog/how-to-delete-node-modules-safely) comme n'importe quel autre ; le fichier de verrouillage reconstruit tout si le dépôt se réveille un jour.

Et comme toujours sur macOS : supprimez vers la Corbeille, pas avec `rm -rf`. Plus le dossier est gros, plus cette [habitude](/fr/blog/never-rm-rf-node-modules) en vaut la peine.

## Garder le score

La partie difficile dans un monde de monorepo, c'est de connaître son total actuel. Le poids s'accumule à travers le dépôt, ses clones, les dossiers par package, les caches, et le store pnpm simultanément ; aucun `du` unique ne le montre. [TidyDisk](/fr) garde le total en cours dans la barre de menu de votre Mac : chaque `node_modules` à travers chaque clone, le store pnpm dimensionné honnêtement (les liens physiques comptés une fois), l'obsolescence par projet, un nettoyage en un clic vers la Corbeille. Le scan est gratuit, et les utilisateurs de monorepo ont tendance à voir les plus gros premiers chiffres de tout le monde.

Que vous l'automatisiez ou que vous le scriptiez, vérifiez le chiffre chaque trimestre. Les monorepos grossissent en silence, et le premier `find` sur une machine qui en héberge un est fiablement une surprise.
