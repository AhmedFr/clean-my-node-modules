---
title: "Como excluir node_modules com segurança e recuperar gigabytes"
description: "Um guia prático para excluir pastas node_modules sem quebrar nada: o que é seguro, o que checar antes, e como fazer isso em segundos."
date: "2026-07-04"
---

Todo projeto JavaScript que você já clonou deixou algo para trás: uma pasta `node_modules` que facilmente pesa de 200 MB a mais de 1 GB. Multiplique isso pelas dezenas de projetos guardados na sua pasta `~/code` ou `~/dev` e você costuma estar diante de 20, 50, às vezes 100 GB de espaço em disco ocupados por dependências que você não toca há meses.

A boa notícia: o `node_modules` é 100% descartável. A notícia melhor ainda: você pode recuperar tudo em segundos quando precisar.

## Por que excluir node_modules é sempre seguro

O `node_modules` não contém nada original. É uma cópia materializada do que o seu `package.json` e o lockfile (`package-lock.json`, `yarn.lock` ou `pnpm-lock.yaml`) descrevem. Seu código, sua configuração e as versões das suas dependências vivem todos fora dele.

Isso significa que o caminho de recuperação é sempre o mesmo:

```bash
npm install   # ou yarn, ou pnpm install
```

Rode isso na pasta do projeto e toda a árvore de `node_modules` volta, equivalente byte a byte do ponto de vista do seu projeto, porque o lockfile fixa cada versão.

Há apenas duas coisas que vale a pena checar antes de excluir:

1. **O projeto está rodando agora?** Pare servidores de dev e watchers primeiro. Um processo em execução com handles de arquivo abertos dentro do `node_modules` pode se comportar de forma estranha quando a pasta desaparece embaixo dele.
2. **Você tem o lockfile commitado?** Se sim (você quase certamente tem), reinstalar reproduz exatamente a mesma árvore de dependências. Se o projeto não tem lockfile, a reinstalação ainda funciona, mas pode resolver versões um pouco mais novas.

Esse é o checklist inteiro. Não há estado, nenhum cache que você vá lamentar perder, nenhuma configuração dentro do `node_modules` que importe.

## De quanto espaço estamos falando?

Cheque um único projeto:

```bash
du -sh ./node_modules
```

Os resultados típicos vão de 150 MB para uma biblioteca pequena a 1,5 GB e além para um app full-stack com bundler, test runner e framework de UI. Se quiser ver o total em tudo o que você tem, isso encontra e mede cada `node_modules` no disco:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} +
```

Em uma máquina usada diariamente para JavaScript por um ano ou dois, totais de 30 a 80 GB são completamente normais. Escrevemos mais sobre de onde vem todo esse peso em [Por que o node_modules é tão gigante?](/pt/blog/why-is-node-modules-so-huge).

## O jeito manual

Para um único projeto, a abordagem clássica:

```bash
cd ~/code/old-project
rm -rf node_modules
```

Funciona, mas recomendamos não fazer disso um hábito com o `rm -rf`, por um motivo simples: é instantâneo e irreversível. Digite o caminho errado, deixe o autocomplete escolher a pasta errada, e não há como desfazer. Mover a pasta para a Lixeira em vez disso mantém uma rede de segurança:

```bash
# macOS: mover para a Lixeira em vez de destruir imediatamente
osascript -e 'tell app "Finder" to delete POSIX file "'$PWD'/node_modules"'
```

Meio desajeitado, mas recuperável. Qualquer coisa que exclua arquivos de desenvolvedor deveria ter a recuperação como padrão.

## O problema em lote

Excluir uma pasta é fácil. O problema real são os outros 40 projetos que você esqueceu: o tutorial que você seguiu em março, o teste técnico da sua última busca de emprego, os três projetos paralelos abandonados. Cada um guarda silenciosamente centenas de megabytes.

Encontrar todos eles, checar quando você tocou em cada projeto pela última vez, medir cada pasta e decidir o que é seguro remover é exatamente o tipo de tarefa que nunca é feita manualmente.

Você pode automatizar isso com um script, e muitos desenvolvedores fazem. Também existem ferramentas de linha de comando criadas para isso. Mas se você quer que essa seja uma decisão de 10 segundos em vez de uma sessão de terminal, foi exatamente para isso que criamos o [TidyDisk](/pt): ele vive na sua barra de menu do macOS, sabe continuamente onde está cada pasta `node_modules`, o quão grande ela é e há quanto tempo o projeto está parado, e deixa você limpar as que escolher em um clique. Tudo vai para a Lixeira, nunca via `rm -rf`, então um erro não custa nada.

## E o pnpm store e os caches globais?

Se você usa pnpm, excluir o `node_modules` de um projeto libera menos do que você imagina, porque o pnpm cria hard links de arquivos a partir de um store global endereçado por conteúdo. O store em si é limpo separadamente com `pnpm store prune`. Cobrimos esse tema inteiro em [O pnpm store explicado](/pt/blog/pnpm-store-explained).

npm e yarn também mantêm caches globais (`~/.npm`, `~/Library/Caches/Yarn`) que sobrevivem à exclusão de projetos por design. Essa é uma limpeza separada, com regras próprias.

## O hábito que mantém seu disco limpo

Uma rotina simples que leva menos de um minuto por mês:

1. Liste projetos que você não toca há 60 dias ou mais.
2. Exclua o `node_modules` deles (para a Lixeira).
3. Reinstale sob demanda no dia em que realmente voltar a um deles.

O custo de errar é um `npm install` e uma pausa para o café. O retorno são dezenas de gigabytes de volta, permanentemente, porque projetos obsoletos raramente voltam à vida.

Se preferir ter essa rotina automatizada, o [TidyDisk](/pt) faz o escaneamento de graça: instale, e ele mostra exatamente quantos gigabytes as suas pastas `node_modules` estão ocupando agora. Limpar tudo em um clique é uma licença vitalícia de 19 euros, e o escaneamento sozinho já costuma se pagar com a surpresa que evita.
