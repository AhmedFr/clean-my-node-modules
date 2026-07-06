---
title: "Libérer de l'espace disque sur un Mac : la checklist du développeur"
description: "Une checklist priorisée pour développeurs : node_modules, caches de packages, Xcode, Docker, simulateurs, caches navigateur, avec de vraies commandes."
date: "2026-08-08"
---

Les Mac de développeur se remplissent différemment des Mac ordinaires. Les conseils habituels (vider la Corbeille, nettoyer les Téléchargements, décharger les photos) n'entament à peine le problème, car le poids se trouve dans des endroits que le Finder ne vous montre jamais. Voici la checklist qu'on utilise vraiment, classée par gigaoctets récupérés par minute d'effort.

## 1. Les dossiers node_modules obsolètes (souvent le plus gros gain)

Si vous faites du JavaScript, commencez ici. Chaque projet que vous avez un jour cloné garde un dossier de dépendances de 200 Mo à 1,5 Go jusqu'à ce que vous le supprimiez, et tout est reproductible depuis le fichier de verrouillage avec un simple `npm install`.

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

Supprimez ceux appartenant à des projets auxquels vous n'avez pas touché depuis deux mois. Les instructions complètes et les notes de sécurité sont dans [Comment supprimer node_modules en toute sécurité](/fr/blog/how-to-delete-node-modules-safely), et [TidyDisk](/fr) automatise toute la boucle depuis votre barre de menu si vous préférez ne pas le faire manuellement. Récupération typique : **10 à 50 Go**.

## 2. Stores et caches des gestionnaires de paquets

```bash
pnpm store prune        # pnpm : supprime les packages non référencés
npm cache verify        # npm : nettoie le cache en toute sécurité
yarn cache clean        # yarn classic : vide ~/Library/Caches/Yarn
```

Les utilisateurs de pnpm devraient purger après avoir supprimé les vieux projets, pas avant, afin que la purge puisse libérer tout ce que les projets supprimés référençaient (détails dans [Le store pnpm expliqué](/fr/blog/pnpm-store-explained)). Récupération typique : **2 à 10 Go**.

## 3. Xcode : l'autre trou noir

Même si vous ne compilez qu'occasionnellement une app iOS, Xcode accumule des quantités impressionnantes d'états dérivés :

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/iOS\ DeviceSupport 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator
```

- **DerivedData** est un cache de build ; le supprimer coûte une recompilation lente. Souvent 5 à 20 Go.
- **iOS DeviceSupport** garde les symboles de débogage pour chaque version iOS de chaque appareil que vous avez déjà branché. Les anciennes versions sont du poids mort.
- **Simulateurs** : `xcrun simctl delete unavailable` supprime les simulateurs des runtimes que vous n'avez plus.

Récupération typique : **10 à 40 Go** sur les machines qui compilent pour les plateformes Apple.

## 4. Docker

L'image disque de Docker Desktop grossit et rétrécit rarement d'elle-même :

```bash
docker system df                 # voir ce qui est utilisé
docker system prune -a --volumes # supprimer images, conteneurs, volumes inutilisés
```

Lisez l'avertissement avant de lancer la seconde commande : `-a` supprime toutes les images non attachées à un conteneur en cours d'exécution, et `--volumes` supprime les volumes non référencés, y compris des données que vous voudriez peut-être garder. Lancez la purge sans `--volumes` d'abord en cas de doute. Récupération typique : **5 à 30 Go**.

## 5. Homebrew

```bash
brew cleanup -s
du -sh $(brew --cache)
```

Homebrew garde les anciennes versions et les téléchargements ; `cleanup -s` nettoie les deux. Récupération typique : **1 à 5 Go**.

## 6. Tout le reste qui mérite un coup d'œil

```bash
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -15
```

Trouvailles fréquentes : caches de navigateur, caches d'apps Slack et Electron, vieilles images d'émulateur iOS/Android de projets annexes, `~/Library/Caches/Google/AndroidStudio*`, et des gigaoctets de caches de modules `pip`/`cargo`/`go` (`pip cache purge`, `cargo cache -a` avec l'outil cargo-cache, `go clean -modcache`).

## L'ordre compte

Travaillez la liste de haut en bas. Les deux premiers postes sont de l'état pur et récupérable à coût quasi nul ; les postes Xcode et Docker coûtent une recompilation ou un re-téléchargement ; le nettoyage de cache plus profond échange de la vitesse future contre de l'espace. Arrêtez-vous quand vous avez la marge dont vous avez besoin.

## Le garder propre

La vérité inconfortable sur le nettoyage de disque, c'est que c'est un abonnement, pas un achat unique. Six semaines après une session de nettoyage héroïque, les mêmes dossiers sont de nouveau lourds. Les checklists ne s'exécutent pas toutes seules.

Pour la partie du problème liée à JavaScript (généralement la plus grosse), [TidyDisk](/fr) transforme la checklist en un coup d'œil : il vit dans la barre de menu, suit en continu chaque dossier `node_modules` et votre store pnpm, et nettoie ce que vous choisissez en un clic, toujours vers la Corbeille. Le scan est gratuit et prend environ une minute ; voir votre chiffre suffit généralement comme motivation.
