---
title: "Por que o node_modules é tão gigante? O que tem lá dentro de verdade"
description: "Por que um app de 20 linhas puxa 300 MB de dependências: pacotes transitivos, versões duplicadas, ferramentas de dev e binários de plataforma explicados."
date: "2026-07-11"
---

Você escreve um servidor Express de 20 linhas, roda `npm install`, e o `node_modules` chega a 180 MB com 4.000 arquivos. A piada famosa retrata o `node_modules` como mais pesado que um buraco negro. Mas o peso não é um bug nem um acidente. É o resultado direto de algumas escolhas de design deliberadas no ecossistema npm, e assim que você as enxerga, o tamanho deixa de ser um mistério.

## Dependências transitivas: você instala 5, recebe 800

Seu `package.json` lista dependências diretas. Cada uma delas tem suas próprias dependências, e assim por diante, árvore abaixo. Instalar um framework web típico mais um test runner mais um bundler costuma resolver para 800 a 1.500 pacotes distintos.

Veja por si mesmo:

```bash
npm ls --all | wc -l
```

O ecossistema npm historicamente favoreceu muitos pacotes pequenos e de propósito único em vez de grandes bibliotecas padrão. Isso traz benefícios reais (código focado, atualizações independentes) e um custo óbvio: o grafo de dependências explode, e cada nó do grafo é uma pasta no seu disco com seu próprio `package.json`, README, arquivo de licença e, muitas vezes, seus próprios testes e source maps embarcados no tarball.

## Duplicação: o mesmo pacote, cinco vezes

Duas das suas dependências precisam do `lodash`, mas uma quer `^4.17.0` e a outra fixa `4.16.6`. Gerenciadores de pacotes que usam um layout plano de `node_modules` (npm, yarn classic) deduplicam o que conseguem, mas qualquer conflito de versão significa que a mesma biblioteca é fisicamente copiada várias vezes em profundidades diferentes da árvore.

Veja o tamanho do problema em um projeto:

```bash
npm ls lodash
npm dedupe --dry-run
```

Em apps grandes é comum encontrar a mesma biblioteca utilitária presente em 3 a 6 versões diferentes. Cada cópia é totalmente materializada no disco. O pnpm ataca exatamente esse problema com um store endereçado por conteúdo e hard links, motivo pelo qual o mesmo conjunto de projetos ocupa um espaço real de disco drasticamente menor sob o pnpm. Detalhamos esse mecanismo em [O pnpm store explicado](/pt/blog/pnpm-store-explained).

## As dependências de dev pesam mais que o seu app

As dependências de runtime da maioria dos apps são modestas. O que pesa é o conjunto de ferramentas: o TypeScript vem com um compilador de cerca de 60 MB, bundlers e seus ecossistemas de plugins somam dezenas de megabytes, test runners trazem seus próprios parsers e instrumentação, linters carregam ASTs completas para cada sintaxe que suportam.

Uma forma rápida de sentir a diferença:

```bash
npm install --omit=dev
du -sh node_modules
```

Instalações somente de produção costumam ser de 3 a 10 vezes menores que a instalação completa de desenvolvimento. O `node_modules` de 1 GB é, em boa parte, a oficina, não o produto.

## Binários de plataforma: os pesos-pesados silenciosos

Alguns pacotes distribuem binários nativos pré-compilados para cada plataforma e arquitetura que suportam: processamento de imagem (sharp), navegadores headless (o puppeteer baixa um Chromium completo, cerca de 170 MB), drivers de banco de dados, SWC e esbuild com binários por plataforma. Um punhado desses pode dobrar o tamanho de um projeto por outro lado comum.

Encontre os grandes vilões dentro de qualquer `node_modules`:

```bash
du -sh node_modules/* node_modules/.pnpm 2>/dev/null | sort -rh | head -20
```

Rode isso em um projeto e normalmente você vai encontrar 5 pacotes responsáveis por metade do total.

## Arquivos que existem sem motivo de runtime

Os tarballs de pacotes frequentemente incluem documentação, pastas de exemplos, suítes de teste, fontes TypeScript junto com o resultado compilado, e source maps. Nada disso é necessário para rodar o seu app, e tudo isso é descompactado no seu disco. Multiplique um pequeno desperdício por 1.200 pacotes e ele deixa de ser pequeno.

## Então o tamanho é um problema?

Para um único projeto ativo: não muito. Disco é barato, e o conjunto de ferramentas ganha seus megabytes no dia a dia.

O custo real aparece no agregado. Todo projeto que você já clonou mantém sua própria cópia completa desse peso para sempre, tenha você aberto na semana passada ou no ano passado. Dez projetos obsoletos de 500 MB cada são 5 GB de puro peso morto, e a maioria dos desenvolvedores ativos tem muito mais do que dez. Esse agregado é o que vale a pena limpar, e é completamente seguro de limpar porque o `node_modules` é sempre reproduzível a partir do lockfile, como cobrimos em [Como excluir node_modules com segurança](/pt/blog/how-to-delete-node-modules-safely).

Se quiser saber o seu próprio número, o [TidyDisk](/pt) escaneia o seu Mac de graça e mostra cada pasta `node_modules`, medida e ordenada, com as obsoletas sinalizadas. A maioria das pessoas encontra mais de 20 GB no primeiro escaneamento. Recuperar isso é um clique e uma licença vitalícia de 19 euros, e tudo vai para a Lixeira, então nada nunca se perde por engano.
