---
title: "O pnpm store explicado: para onde vai realmente o seu espaço em disco"
description: "Como o store de conteúdo e os hard links do pnpm funcionam de verdade, por que o du mente sobre o tamanho dos projetos, e como limpar o store com segurança."
date: "2026-07-18"
---

O grande diferencial do pnpm é a eficiência de disco: instale a mesma dependência em dez projetos e ela fica armazenada no disco uma única vez. Ele cumpre essa promessa, mas também torna o uso de disco genuinamente confuso. Ferramentas reportam tamanhos que parecem contraditórios, a intuição de limpeza vinda do npm deixa de valer, e o lugar para onde seu espaço realmente foi é uma pasta que quase ninguém já abriu.

## O design em duas camadas

O pnpm divide a instalação em duas camadas:

1. **O store global**, em `~/Library/pnpm/store` no macOS (confira o seu com `pnpm store path`). Cada versão de cada pacote que você já instalou vive aqui exatamente uma vez, armazenada por hash de conteúdo.
2. **O `node_modules` por projeto**, que contém quase nenhum dado real de arquivo. Os arquivos dentro de `node_modules/.pnpm` são hard links apontando para o store, e as entradas de nível superior do seu `node_modules` são symlinks para dentro do `.pnpm`.

Um hard link não é uma cópia. É uma segunda entrada de diretório para os mesmos bytes no disco. Dez projetos com hard link para o mesmo pacote `react` compartilham uma única cópia física.

## Por que o du te engana

Rode `du -sh node_modules` em um projeto pnpm e você pode ver 800 MB. Exclua esse projeto e talvez recupere apenas 40 MB. Os dois números são honestos; respondem a perguntas diferentes.

O `du` conta o tamanho de cada arquivo que consegue alcançar. Ele não sabe (a menos que você compare contagens de inode em todo o disco) que 760 desses megabytes são hard links compartilhados com o store e possivelmente com outros cinco projetos. Os bytes só são realmente liberados quando a última referência desaparece, e o store sempre mantém uma referência até você fazer o prune.

As consequências práticas:

- **Excluir um único projeto pnpm libera pouco.** O store ainda mantém tudo.
- **Somar o `du` entre projetos pnpm superestima muito o total.** Os mesmos bytes são contados uma vez por projeto.
- **O store em si é onde vivem os bytes de verdade.** Meça-o com `du -sh $(pnpm store path)`.

No APFS (o sistema de arquivos padrão do macOS) existe uma segunda pegadinha: os clones. Dois arquivos podem compartilhar armazenamento sem sequer compartilhar um inode, o que os torna invisíveis tanto para o `du` quanto para a contagem de hard links. Uma contabilidade precisa no macOS moderno é genuinamente difícil, e é por isso que ferramentas de disco ingênuas erram tanto com configurações pnpm.

## Limpando o store da forma certa

O store cresce para sempre por padrão: cada versão de cada pacote que você já instalou permanece, incluindo pacotes que nenhum projeto mais referencia. A limpeza embutida:

```bash
pnpm store prune
```

Isso remove pacotes que nenhum projeto atualmente vincula. É completamente seguro: qualquer coisa ainda referenciada é mantida, e qualquer coisa removida seria baixada novamente na próxima instalação que precisar dela. Em uma máquina com um ano de histórico pnpm, um primeiro prune costuma liberar vários gigabytes.

Dois comandos relacionados que vale a pena conhecer:

```bash
pnpm store path     # onde fica o meu store?
pnpm store status   # verifica a integridade do store
```

## O que isso significa para a estratégia de limpeza

Se você usa pnpm, as prioridades de limpeza se invertem em comparação ao npm:

1. **Faça o prune do store primeiro.** É ali que o peso morto se concentra.
2. **Depois exclua os `node_modules` obsoletos dos projetos.** Cada um libera seus arquivos não compartilhados imediatamente e libera referências para que o próximo prune consiga liberar mais.
3. **Não confie nos números de `du` por projeto.** São limites superiores, muitas vezes bem folgados.

A ordem importa: excluir projetos e depois fazer o prune libera o máximo possível, porque o prune só consegue remover o que ninguém mais referencia.

Esse problema de medição é também um dos motivos pelos quais construímos o [TidyDisk](/pt) do jeito que construímos. Ele entende o layout do pnpm: mede o conteúdo real do store em vez de contar hard links em dobro entre projetos, então os gigabytes que ele reporta são gigabytes que você realmente recupera. O escaneamento é gratuito, e a limpeza sempre vai para a Lixeira, nunca via `rm -rf`, um hábito que explicamos em [Por que você nunca deve dar rm -rf em node_modules](/pt/blog/never-rm-rf-node-modules).

## O resumo

O pnpm genuinamente economiza espaço em disco, muitas vezes de forma dramática. Mas ele realoca o problema em vez de eliminá-lo: o store acumula toda versão de pacote para sempre até você fazer o prune, e as ferramentas de medição padrão não conseguem enxergar através dos hard links. Aprenda o `pnpm store prune`, rode-o depois de excluir projetos antigos, e desconfie de qualquer ferramenta que reporte tamanhos de projetos pnpm sem mencionar o store.

Quer ver o seu número real? O [TidyDisk](/pt) mostra o seu store, cada projeto, e cada `node_modules` obsoleto em uma única lista, grátis para escanear, 19 euros uma vez se você quiser a limpeza em um clique.
