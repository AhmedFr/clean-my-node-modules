---
title: "Como encontrar todas as pastas node_modules no seu Mac"
description: "Comandos de terminal para localizar e medir cada pasta node_modules no macOS, ordená-las por tamanho e tempo de inatividade, e decidir o que excluir."
date: "2026-07-25"
---

Antes de conseguir fazer a limpeza, você precisa saber o que existe. A maioria dos desenvolvedores acha que tem "algumas" pastas `node_modules` e descobre dezenas. Este guia traz os comandos exatos para encontrar todas elas, medir seu tamanho e classificá-las por quão seguro é excluí-las.

## A busca básica

Comece pela pasta onde seus projetos vivem (ajuste `~/code` para a sua estrutura):

```bash
find ~/code -name node_modules -type d -prune
```

A flag `-prune` importa: ela impede que o `find` desça para dentro de cada `node_modules` encontrado, o que pula os `node_modules` aninhados dentro das dependências (esses desaparecem junto com o pai de qualquer forma) e torna o comando drasticamente mais rápido.

Se seus projetos estão espalhados, busque em toda a sua pasta pessoal (home). Espere que isso demore um pouco em um disco grande:

```bash
find ~ -name node_modules -type d -prune 2>/dev/null
```

O `2>/dev/null` esconde erros de permissão de pastas do sistema que você não conseguiria ler de qualquer forma.

## Adicione os tamanhos

Encaminhe cada resultado para o `du`:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + 2>/dev/null | sort -rh
```

`sort -rh` coloca as maiores pastas no topo. Em uma máquina com um ano de trabalho ativo em JavaScript, o topo dessa lista costuma ser um choque: pastas individuais de 800 MB a 2 GB, e totais na casa das dezenas de gigabytes.

Para o número total único:

```bash
find ~/code -name node_modules -type d -prune -exec du -sk {} + 2>/dev/null | awk '{s+=$1} END {printf "%.1f GB\n", s/1048576}'
```

Um alerta se você usa pnpm: os hard links fazem esses números superestimarem o total, às vezes muito. Os bytes são compartilhados com o store global, e excluir um projeto libera menos do que o `du` sugere. Os detalhes estão em [O pnpm store explicado](/pt/blog/pnpm-store-explained).

## Classifique por tempo de inatividade

O tamanho diz o que vale a pena excluir; a idade diz o que é seguro. Um `node_modules` que você não toca há seis meses pertence a um projeto ao qual você provavelmente não vai voltar tão cedo, e reinstalar depois custa apenas um `npm install`.

Isso lista cada pasta de projeto com a última vez que algo no projeto (excluindo o próprio `node_modules`) foi modificado:

```bash
for nm in $(find ~/code -name node_modules -type d -prune); do
  proj=$(dirname "$nm")
  last=$(find "$proj" -path "$proj/node_modules" -prune -o -type f -newer "$nm" -print -quit 2>/dev/null)
  mod=$(stat -f "%Sm" -t "%Y-%m-%d" "$proj")
  size=$(du -sh "$nm" 2>/dev/null | cut -f1)
  echo "$mod  $size  $proj"
done | sort
```

Qualquer item no topo dessa lista (mais antigos primeiro) com uma coluna de tamanho generosa é um forte candidato. Excluir é seguro porque o `node_modules` é sempre reproduzível a partir do lockfile, como abordamos em [Como excluir node_modules com segurança](/pt/blog/how-to-delete-node-modules-safely).

## O problema da manutenção

Esses comandos funcionam. O problema é que a limpeza de disco não é um evento único. Novos projetos aparecem, os antigos ficam obsoletos, e daqui a três meses os mesmos gigabytes estão de volta. Ninguém executa um loop de shell de cinco linhas em uma agenda fixa.

Essa lacuna entre "possível no terminal" e "realmente acontece" é exatamente o que o [TidyDisk](/pt) fecha. Ele fica na barra de menu do macOS e mantém a resposta sempre atual: cada pasta `node_modules`, seu tamanho real (com consciência do pnpm, sem contagem dupla de hard links), e há quanto tempo o projeto está parado, classificados e prontos. Quando o total ultrapassa um limite que importa para você, você vê sem precisar perguntar.

## Decida, depois exclua

Qualquer que seja o caminho escolhido, o critério de decisão é o mesmo:

1. **Projetos ativos (usados nesta semana): mantenha.** O custo de reinstalar seria irritante.
2. **Projetos recentes (usados neste mês): mantenha, a menos que sejam enormes.**
3. **Tudo mais antigo: exclua.** Se você voltar ao projeto algum dia, o `npm install` reconstrói tudo em um ou dois minutos.

E quando for excluir, prefira a Lixeira ao `rm -rf`. A Lixeira não custa nada e transforma um caminho digitado errado de um desastre em um não evento.

Rode o escaneamento gratuito do [TidyDisk](/pt) e você terá seu número completo e honesto em cerca de um minuto. A maioria dos primeiros escaneamentos encontra mais de 20 GB. Recuperar esse espaço é um clique com uma licença vitalícia de 19 euros.
