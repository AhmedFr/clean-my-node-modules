---
title: "Monorepos e espaço em disco: domando o node_modules em escala"
description: "Por que monorepos multiplicam o peso das dependências, como workspaces e pnpm ajudam, e como manter caches do turbo e clones obsoletos sob controle."
date: "2026-09-05"
---

Monorepos concentram tudo: código, ferramentas e uso de disco. Um único monorepo bem utilizado pode carregar mais peso de dependências do que uma dezena de projetos pequenos, e ainda adiciona novas categorias de consumo de disco (caches de build, artefatos por pacote) que os conselhos comuns de limpeza ignoram. Aqui está para onde vão os gigabytes e como recuperá-los.

## Onde os monorepos colocam seu peso

**O node_modules raiz.** Com workspaces do npm, yarn ou pnpm, a maioria das dependências sobe para um único `node_modules` na raiz. Em um repositório com 20 pacotes, essa pasta costuma ter de 1 a 3 GB. Esse é, na verdade, o resultado eficiente: uma cópia compartilhada em vez de 20.

**O node_modules por pacote.** Pacotes com versões conflitantes ou scripts de ciclo de vida ganham seu próprio `node_modules` aninhado. Alguns são normais; dezenas de pacotes pesados sugerem conflitos de versão que vale a pena resolver com uma passada de `dedupe`:

```bash
npm dedupe --dry-run       # npm workspaces
pnpm dedupe --check        # pnpm 9+
```

**Caches de build e de tarefas.** O `.turbo` do Turborepo, o `.nx/cache` do Nx, os caches do Vite e do webpack dentro de `node_modules/.cache`, os arquivos `.tsbuildinfo` do TypeScript. Eles ganham seu espaço em um repositório ativo e são puro desperdício em um clone obsoleto. Podem rivalizar com o peso das dependências:

```bash
du -sh .turbo .nx/cache node_modules/.cache 2>/dev/null
```

**Clones duplicados.** O multiplicador específico de monorepos: worktrees e segundos clones para branches paralelas. Cada clone carrega todo o peso do `node_modules` e dos caches. Três cópias de trabalho de um monorepo de 4 GB são 12 GB, e as duas que você criou para aquele hotfix em março ainda estão lá.

## A escolha do gerenciador de pacotes importa ainda mais aqui

Tudo em [npm vs. yarn vs. pnpm no disco](/pt/blog/npm-yarn-pnpm-disk-space) é amplificado por um monorepo, e o pnpm tem uma vantagem estrutural que vale a pena conhecer: como o `node_modules` de cada projeto é feito de hard links para um único store, seus três clones do monorepo compartilham a maior parte do disco físico. Com npm ou yarn classic, cada clone é uma cópia física completa. Se você mantém várias cópias de trabalho de um repositório grande, o modelo de store do pnpm é a decisão de disco de maior alavancagem disponível ([como o store funciona](/pt/blog/pnpm-store-explained)).

## Limpeza que respeita um monorepo ativo

Para o monorepo em que você trabalha diariamente:

1. **Deixe o `node_modules` raiz em paz.** Reinstalar um workspace grande leva minutos; excluí-lo para recuperar espaço que você vai precisar de novo amanhã é um prejuízo líquido.
2. **Limpe os caches ocasionalmente.** O `.turbo` e afins se regeneram na próxima build. Limpá-los em um repositório que você ainda usa custa um build frio.
3. **Faça o dedupe dos conflitos de versão.** Reduz permanentemente a camada de `node_modules` por pacote.

Para o resto, seja implacável:

4. **Clones e worktrees obsoletos são o prêmio maior.** Um segundo clone esquecido são vários gigabytes de duplicação pura. `git worktree list` mostra worktrees que você esqueceu; exclua o `node_modules` deles primeiro, depois o worktree em si, se a branch já foi lançada.
5. **Monorepos arquivados** (o antigo repositório da empresa, o reescrito que foi abandonado) mantêm todo o peso para sempre. O `node_modules` e os caches deles são [seguros para excluir](/pt/blog/how-to-delete-node-modules-safely) como qualquer outro; o lockfile reconstrói tudo se o repositório algum dia acordar.

E como sempre no macOS: exclua para a Lixeira, não com `rm -rf`. Quanto maior a pasta, mais vale a pena esse [hábito](/pt/blog/never-rm-rf-node-modules).

## Mantendo o placar

A parte difícil em um mundo de monorepos é conhecer o seu total atual. O peso se acumula no repositório, em seus clones, nas pastas por pacote e no pnpm store, tudo ao mesmo tempo; nenhum `du` isolado mostra isso. O [TidyDisk](/pt) mantém o total corrente na barra de menu do seu Mac: cada `node_modules` em cada clone, o pnpm store medido com honestidade (hard links contados uma única vez), o tempo de inatividade de cada projeto, limpeza em um clique para a Lixeira. O escaneamento é gratuito, e usuários de monorepo costumam ver os maiores primeiros números de todos.

Seja automatizando ou fazendo isso via script, cheque o número trimestralmente. Monorepos crescem em silêncio, e o primeiro `find` em uma máquina que hospeda um deles é, de forma confiável, uma surpresa.
