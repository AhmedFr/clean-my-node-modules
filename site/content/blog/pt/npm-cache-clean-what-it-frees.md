---
title: "npm cache clean: o que ele realmente libera (e o que não libera)"
description: "O que vive no cache do npm, quando o npm cache clean --force ajuda, por que o verify costuma ser melhor, e onde estão as economias reais de disco."
date: "2026-08-01"
---

`npm cache clean --force` é o primeiro comando que a maioria das pessoas tenta quando o uso de disco relacionado ao npm sai de controle. Raramente é o comando certo. Aqui está o que o cache do npm realmente contém, o que limpá-lo libera, e onde vive de fato o espaço que você está procurando.

## O que há no cache do npm

O npm mantém um cache endereçado por conteúdo em `~/.npm` (especificamente `~/.npm/_cacache`). Todo tarball de pacote que o npm já baixou fica armazenado ali, junto com metadados do registro. A função dele é tornar instalações repetidas rápidas e permitir que instalações funcionem offline.

Meça o seu:

```bash
du -sh ~/.npm
```

Tamanhos típicos vão de algumas centenas de megabytes a vários gigabytes em máquinas com histórico longo de uso do npm.

Duas propriedades importam:

1. **Ele se autocorrige.** Os dados são verificados por checksum na saída; entradas corrompidas são baixadas novamente de forma automática. Os motivos históricos para limpar o cache rotineiramente desapareceram, em sua maioria, com o npm 5.
2. **Ele é compartilhado.** Um único cache atende a todos os projetos. Excluí-lo deixa a próxima instalação de tudo mais lenta.

## O que a limpeza realmente faz

```bash
npm cache clean --force
```

Isso exclui o cache inteiro. A flag `--force` é exigida justamente porque a equipe do npm considera a limpeza manual quase nunca necessária. Você libera o tamanho de `~/.npm` uma vez, e depois as instalações começam a preenchê-lo de novo imediatamente, cada uma mais lenta do que seria, porque os tarballs precisam ser baixados de novo.

A ferramenta mais suave é:

```bash
npm cache verify
```

Isso checa a integridade, faz garbage collection dos dados desnecessários, e reporta o que recuperou, sem descartar entradas válidas. Se você sente que o cache está inchado, rode o `verify` primeiro; ele costuma cortar uma fatia significativa mantendo as instalações rápidas.

## Quando o clean --force é de fato certo

- Você está recuperando espaço em uma máquina que está se aposentando do trabalho com JavaScript.
- O cache cresceu além do que seu disco comporta e você aceita instalações mais lentas.
- Você está depurando um cache genuinamente corrompido que o `verify` não consegue corrigir (raro).

Fora desses casos, o cache é uma das poucas partes do uso de disco de dev que ganha seu espaço no dia a dia.

## Onde está o espaço de verdade

Aqui está a comparação que importa. Em uma máquina de dev típica:

| Local | Tamanho típico | Custo de excluir |
|---|---|---|
| Cache do `~/.npm` | 0,5 a 3 GB | Instalações futuras mais lentas |
| Todas as pastas `node_modules` | 20 a 80 GB | Um `npm install` por projeto revivido |
| pnpm store (se usado) | 2 a 15 GB | Novo download na próxima instalação após o prune |

O cache costuma ser o menor dos três e o único com um benefício de desempenho contínuo. Pastas `node_modules` obsoletas são de dez a trinta vezes maiores e não devolvem nada. Se você tem quinze minutos para limpeza de disco, o cache é o último lugar para gastá-los. Comece por [encontrar cada pasta node_modules no seu Mac](/pt/blog/find-node-modules-folders-mac), exclua as obsoletas, e se usa pnpm, rode `pnpm store prune` como descrito em [O pnpm store explicado](/pt/blog/pnpm-store-explained).

Usuários de yarn: o cache equivalente vive em `~/Library/Caches/Yarn` e é limpo com `yarn cache clean`; a mesma lógica se aplica.

## Uma ordem sensata de limpeza para usuários de npm

1. Exclua pastas `node_modules` obsoletas de projetos (o grande ganho, totalmente recuperável).
2. Rode `npm cache verify` (corte grátis, sem desvantagem).
3. Só recorra ao `npm cache clean --force` quando precisar do último gigabyte e aceitar o custo.

Se o passo 1 parece cansativo, é exatamente essa a parte que o [TidyDisk](/pt) automatiza: um escaneamento gratuito mostra cada `node_modules` no seu Mac, medido e ordenado por tempo de inatividade, e um clique manda os que você escolher para a Lixeira. A licença vitalícia de 19 euros se paga na primeira vez que evita que você faça essa lista na mão.
