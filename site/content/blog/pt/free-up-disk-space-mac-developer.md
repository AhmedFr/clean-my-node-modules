---
title: "Liberar espaço em disco no Mac: o checklist do desenvolvedor"
description: "Um checklist priorizado: node_modules, caches de pacotes, lixo do Xcode, imagens Docker, simuladores e caches de navegador, com comandos reais."
date: "2026-08-08"
---

Macs de desenvolvedor lotam de forma diferente dos Macs comuns. O conselho de sempre (esvaziar a Lixeira, limpar Downloads, mover fotos para a nuvem) mal arranha o problema, porque o peso está em lugares que o Finder nunca mostra. Este é o checklist que realmente usamos, ordenado por gigabytes recuperados por minuto de esforço.

## 1. Pastas node_modules obsoletas (geralmente o maior ganho)

Se você trabalha com JavaScript, comece por aqui. Todo projeto que você já clonou mantém uma pasta de dependências de 200 MB a 1,5 GB até você excluí-la, e tudo isso é reproduzível a partir do lockfile com um único `npm install`.

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh | head -20
```

Exclua as pastas de projetos que você não toca há dois meses. As instruções completas e os cuidados de segurança estão em [Como excluir node_modules com segurança](/pt/blog/how-to-delete-node-modules-safely), e o [TidyDisk](/pt) automatiza todo esse ciclo direto da sua barra de menu, caso você prefira não fazer isso manualmente. Recuperação típica: **10 a 50 GB**.

## 2. Stores e caches de gerenciadores de pacotes

```bash
pnpm store prune        # pnpm: remove pacotes sem referência
npm cache verify        # npm: faz garbage collection segura no cache
yarn cache clean        # yarn classic: limpa ~/Library/Caches/Yarn
```

Usuários de pnpm devem rodar o prune depois de excluir projetos antigos, não antes, para que o prune consiga liberar tudo o que os projetos excluídos estavam referenciando (detalhes em [O pnpm store explicado](/pt/blog/pnpm-store-explained)). Recuperação típica: **2 a 10 GB**.

## 3. Xcode: o outro buraco negro

Mesmo se você só compila um app iOS ocasionalmente, o Xcode acumula quantidades impressionantes de estado derivado:

```bash
du -sh ~/Library/Developer/Xcode/DerivedData
du -sh ~/Library/Developer/Xcode/iOS\ DeviceSupport 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator
```

- **DerivedData** é um cache de build; excluí-lo custa uma recompilação lenta. Costuma ser de 5 a 20 GB.
- **iOS DeviceSupport** mantém símbolos de depuração para cada versão do iOS de cada dispositivo que você já conectou. Versões antigas são peso morto.
- **Simuladores**: `xcrun simctl delete unavailable` remove simuladores de runtimes que você não tem mais.

Recuperação típica: **10 a 40 GB** em máquinas que compilam para plataformas Apple.

## 4. Docker

A imagem de disco do Docker Desktop cresce e raramente encolhe sozinha:

```bash
docker system df                 # veja o que está sendo usado
docker system prune -a --volumes # remove imagens, containers e volumes não usados
```

Leia o aviso antes de rodar o segundo comando: `-a` remove todas as imagens não anexadas a um container em execução, e `--volumes` remove volumes sem referência, incluindo dados que você talvez queira manter. Rode o prune sem `--volumes` primeiro se tiver dúvida. Recuperação típica: **5 a 30 GB**.

## 5. Homebrew

```bash
brew cleanup -s
du -sh $(brew --cache)
```

O Homebrew guarda versões antigas e downloads; `cleanup -s` limpa os dois. Recuperação típica: **1 a 5 GB**.

## 6. Todo o resto que vale a pena checar

```bash
du -sh ~/Library/Caches/* 2>/dev/null | sort -rh | head -15
```

Achados frequentes: caches de navegador, caches de apps Electron e do Slack, imagens antigas de emuladores iOS/Android de projetos paralelos, `~/Library/Caches/Google/AndroidStudio*`, e gigabytes de caches de módulos do `pip`/`cargo`/`go` (`pip cache purge`, `cargo cache -a` com a ferramenta cargo-cache, `go clean -modcache`).

## A ordem importa

Trabalhe a lista de cima para baixo. Os dois primeiros itens são estado puramente recuperável e de custo quase zero; os itens do Xcode e do Docker custam uma recompilação ou um novo download; a limpeza de caches mais profundos troca velocidade futura por espaço. Pare quando tiver a folga de que precisa.

## Mantendo tudo limpo

A verdade desconfortável sobre limpeza de disco é que ela é uma assinatura, não uma compra única. Seis semanas depois de uma sessão heroica de limpeza, as mesmas pastas voltam a pesar. Checklists não se executam sozinhos.

Para a parte do problema relacionada a JavaScript (que costuma ser a maior), o [TidyDisk](/pt) transforma o checklist em um olhar rápido: ele vive na barra de menu, rastreia continuamente cada pasta `node_modules` e seu pnpm store, e limpa o que você escolher em um clique, sempre para a Lixeira. O escaneamento é grátis e leva cerca de um minuto; ver o seu número já costuma ser motivação suficiente.
