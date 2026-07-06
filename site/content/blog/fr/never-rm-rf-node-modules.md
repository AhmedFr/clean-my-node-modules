---
title: "Pourquoi il ne faut jamais faire rm -rf node_modules (utilisez la Corbeille)"
description: "rm -rf n'a pas d'annulation, et node_modules est exactement là où les erreurs de mains fatiguées arrivent. Le cas pour la Corbeille, avec les commandes."
date: "2026-08-29"
---

`rm -rf node_modules` est l'une des commandes les plus tapées du développement JavaScript. Ça marche, c'est rapide, et environ une fois par carrière, ça détruit quelque chose d'important. Cet article est le plaidoyer pour casser cette habitude, et ce qu'il faut taper à la place.

## Le mode d'échec n'est pas hypothétique

`rm -rf` supprime immédiatement, récursivement, silencieusement, et de façon permanente. Il n'y a pas de confirmation, pas d'annulation, et pas de récupération possible en dehors d'outils forensiques ou de sauvegardes. Combiné à l'autocomplétion du shell et à la mémoire musculaire, les accidents classiques ressemblent à ceci :

```bash
rm -rf node_modules   # ok, dans le bon dossier
rm -rf node_module s  # un espace : supprime node_module ET s, ou erreur si vous avez de la chance
rm -rf ./node_modules # tapé dans ~ au lieu du projet ? rien pour vous arrêter
rm -rf $DIR/node_modules  # $DIR non défini : ça devient rm -rf /node_modules
```

Le cas de la variable non définie a brûlé assez de monde pour être devenu un cliché. Aucun de ces cas n'est un problème de compétence ; ce sont des problèmes de fatigue, et tout le monde est fatigué parfois. Le rayon d'action de la commande est illimité et sa vitesse est instantanée, ce qui est exactement la mauvaise combinaison pour une corvée routinière.

## La Corbeille existe pour ça

macOS a une suppression récupérable depuis quarante ans. Les fichiers dans la Corbeille ne vous coûtent rien tant que vous ne la videz pas, et ils ont sauvé d'innombrables erreurs. Les outils de développement ignorent majoritairement la Corbeille parce que le chemin façon POSIX (`rm`) précède son existence et parce qu'écrire vers la Corbeille depuis un script demande une ligne de plus. C'est un mauvais compromis : tout l'intérêt de supprimer `node_modules` est que c'est peu risqué, et la suppression via la Corbeille est ce qui rend ça vraiment peu risqué, même quand vous choisissez le mauvais dossier.

Options en ligne de commande sur macOS :

```bash
# Finder via AppleScript (fonctionne partout, aucune installation)
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'

# Outil Homebrew, ergonomie plus agréable
brew install trash
trash node_modules
```

Sur les versions récentes de macOS, il existe aussi parfois une commande `trash` native ; `brew install trash` couvre le reste. Les deux vous donnent le même contrat : la suppression est instantanée du point de vue de votre projet, et réversible du vôtre.

Si vous voulez que l'habitude s'installe, faites-en un alias :

```bash
alias rmnm='trash ./node_modules && echo "node_modules déplacé vers la Corbeille"'
```

## « Mais node_modules est jetable de toute façon »

Vrai, [et c'est justement pour ça que le supprimer est sûr](/fr/blog/how-to-delete-node-modules-safely) : tout revient avec `npm install`. L'argument ici ne porte pas sur `node_modules` lui-même. Il porte sur ce qui se trouve juste à côté quand vos doigts dérapent. Le dossier que vous vouliez taper, le dossier voisin que l'autocomplétion a attrapé, le chemin qu'une variable n'a pas réussi à remplir. La suppression via la Corbeille signifie que le pire scénario d'une session de nettoyage est de ressortir un dossier en le glissant, plutôt que de vous expliquer à vous-même où sont passées trois semaines d'une branche non poussée.

Il y a aussi un point plus subtil : les habitudes se transfèrent. Les mains qui font `rm -rf node_modules` quotidiennement sont les mêmes mains qui un jour taperont `rm -rf` juste à côté de quelque chose d'irremplaçable. Faire de la suppression récupérable votre défaut est une assurance bon marché sur tout ce que vous faites.

## Et l'espace disque, alors ?

Les fichiers dans la Corbeille occupent toujours de l'espace disque tant que vous ne la videz pas, et si vous nettoyez pour libérer de la place, ça compte. Le flux de travail reste meilleur que rm : supprimer vers la Corbeille, confirmer que vos projets vont bien, puis vider la Corbeille délibérément (ou laisser la vidange automatique de 30 jours de macOS s'en charger). Séparer « retirer du projet » de « détruire les octets » est précisément ce qui rend le processus sûr.

## Notre parti pris, dit clairement

On a construit [TidyDisk](/fr) autour de ce principe : chaque nettoyage qu'il effectue passe par la Corbeille macOS, jamais par `rm -rf`, sans exception. Il trouve chaque `node_modules` sur votre Mac, montre les tailles réelles (y compris une [comptabilité pnpm honnête](/fr/blog/pnpm-store-explained)), et nettoie ce que vous choisissez en un clic que vous pouvez annuler. Le scan est gratuit ; le nettoyage en un clic est une licence à vie à 19 euros.

Que vous l'installiez ou non un jour, adoptez l'habitude : sur un Mac, une suppression que vous pouvez annuler est strictement meilleure qu'une suppression que vous ne pouvez pas annuler. Créez un alias pour `trash`, retirez `rm -rf` de votre rotation quotidienne, et gardez-le pour le rare jour où vous en avez vraiment besoin.
