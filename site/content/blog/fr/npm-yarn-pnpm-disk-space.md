---
title: "npm vs yarn vs pnpm : lequel gaspille le moins d'espace disque ?"
description: "Comment npm, yarn, et pnpm organisent chacun node_modules sur le disque, ce que ça coûte à travers de nombreux projets, et lequel accumule le moins."
date: "2026-08-22"
---

Les gestionnaires de paquets sont généralement comparés sur la vitesse d'installation et l'ergonomie du fichier de verrouillage. Comparez-les plutôt sur l'usage disque et les différences deviennent plus grandes : sur une machine avec de nombreux projets, l'écart entre la meilleure et la pire organisation se mesure souvent en dizaines de gigaoctets.

## Comment chacun utilise votre disque

**npm** matérialise un `node_modules` complet et plat par projet. Chaque package est physiquement copié dans chaque projet qui l'utilise. Cinquante projets utilisant TypeScript, ça veut dire cinquante copies du compilateur TypeScript. npm garde aussi un cache de téléchargement global dans `~/.npm` (des archives, pas des arbres installés), modeste en comparaison.

**yarn classic (v1)** se comporte comme npm sur le disque : des copies physiques complètes par projet, plus son propre cache dans `~/Library/Caches/Yarn`. Côté disque, traitez-le comme npm avec un fichier de verrouillage différent.

**yarn berry (v2+) avec Plug'n'Play** est le plus radical : il n'y a pas de `node_modules` du tout. Les dépendances restent des archives zip dans `.yarn/cache` et sont résolues à l'exécution. Les zips sont compressés et un fichier par package, donc l'usage disque par projet chute nettement. Le coût est la compatibilité de l'écosystème : les outils qui s'attendent à un `node_modules` physique ont besoin de shims, ce qui explique en grande partie pourquoi l'adoption de PnP est restée limitée. Berry peut aussi tourner en mode `nodeLinker: node-modules`, ce qui vous ramène en territoire npm.

**pnpm** garde un store adressé par contenu par machine (`~/Library/pnpm/store` sur macOS) et construit le `node_modules` de chaque projet à partir de liens physiques vers celui-ci. Cinquante projets utilisant la même version de TypeScript partagent une seule copie physique. Le coût marginal par projet approche zéro pour les dépendances partagées ; le store grandit avec l'union de tout ce que vous utilisez, pas la somme. Les détails (pourquoi `du` surcompte, pourquoi le store a besoin d'être purgé) sont dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained).

## Les chiffres sur une vraie machine

Les chiffres exacts dépendent de votre stack, mais la tendance est constante. Prenez un développeur avec 30 projets pesant en moyenne 900 Mo de dépendances chacun, avec un fort recoupement entre projets :

| Gestionnaire | Total approximatif sur le disque |
|---|---|
| npm / yarn classic | 25 à 30 Go (30 copies complètes) |
| yarn berry PnP | 6 à 10 Go (zips compressés, cache partagé) |
| pnpm | 8 à 12 Go (un store + liens physiques, avant purge) |

pnpm et PnP atterrissent dans la même catégorie ; npm et yarn classic coûtent environ trois fois plus pour les mêmes projets. L'hypothèse de recoupement fait tout le travail ici : si vos projets partagent peu de dépendances, l'écart se réduit.

## Le disque n'est pas le seul axe

Choisir un gestionnaire de paquets uniquement sur l'usage disque serait étrange. Le classement de compatibilité est à peu près l'inverse du classement disque : npm fonctionne avec tout, pnpm fonctionne avec presque tout (quelques soucis occasionnels avec les packages qui supposent une organisation plate), PnP demande le plus d'accommodements. Le support des monorepos, la vitesse d'installation, et la familiarité de l'équipe comptent tous, et on regarde l'angle monorepo spécifiquement dans [Monorepos et espace disque](/fr/blog/monorepo-disk-space).

Mais si la pression disque est une contrainte réelle pour vous, le conseil pratique est :

1. **Déjà sur pnpm :** vous êtes dans le camp efficace ; votre maintenance se résume à `pnpm store prune` après avoir supprimé les vieux projets.
2. **Sur npm ou yarn classic :** vous n'avez pas besoin de migrer pour régler votre disque. Supprimer les `node_modules` de projets obsolètes récupère la plupart du gaspillage quel que soit le gestionnaire, puisque [ils sont toujours reproductibles](/fr/blog/how-to-delete-node-modules-safely).
3. **Migrer quand même :** pnpm est le moins perturbateur des options efficaces ; la plupart des projets basculent avec un import de fichier de verrouillage et de petits changements de scripts.

## Quoi que vous utilisiez, la fuite est la même

Les quatre organisations partagent un même mode de défaillance : rien ne se supprime jamais tout seul. Les projets obsolètes gardent tout leur poids (npm, yarn) ou gardent des références qui épinglent le store (pnpm) jusqu'à ce que vous agissiez. Le gestionnaire détermine la vitesse à laquelle le disque se remplit, pas s'il se remplit.

Cette partie continue est ce que gère [TidyDisk](/fr) : il connaît chaque `node_modules` sur votre Mac et votre store pnpm, les dimensionne sans double comptage des liens physiques, signale ce qui est obsolète, et nettoie ce que vous choisissez en un clic, vers la Corbeille. Le scan est gratuit, et ça fonctionne pareil quel que soit le gestionnaire de paquets qui remplit votre disque.
