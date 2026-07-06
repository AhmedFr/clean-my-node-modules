---
title: "npm vs. yarn vs. pnpm: qual desperdiça menos espaço em disco?"
description: "Como o npm, o yarn e o pnpm organizam o node_modules no disco, quanto isso custa em muitos projetos, e qual acumula menos."
date: "2026-08-22"
---

Gerenciadores de pacotes costumam ser comparados por velocidade de instalação e ergonomia do lockfile. Compare-os por uso de disco, e as diferenças ficam maiores: em uma máquina com muitos projetos, a distância entre o melhor e o pior layout costuma ser medida em dezenas de gigabytes.

## Como cada um usa o seu disco

**O npm** materializa um `node_modules` completo e plano por projeto. Cada pacote é fisicamente copiado para cada projeto que o usa. Cinquenta projetos usando TypeScript significam cinquenta cópias do compilador do TypeScript. O npm também mantém um cache global de downloads em `~/.npm` (tarballs, não árvores instaladas), que é modesto em comparação.

**O yarn classic (v1)** se comporta como o npm no disco: cópias físicas completas por projeto, além do próprio cache em `~/Library/Caches/Yarn`. Em termos de disco, trate-o como o npm com um lockfile diferente.

**O yarn berry (v2+) com Plug'n'Play** é o radical: não existe `node_modules` nenhum. As dependências ficam como arquivos zip em `.yarn/cache` e são resolvidas em tempo de execução. Os zips são comprimidos e um arquivo por pacote, então o uso de disco por projeto cai drasticamente. O custo é a compatibilidade com o ecossistema: ferramentas que esperam um `node_modules` físico precisam de shims, o que é boa parte do motivo pelo qual a adoção do PnP ficou limitada. O Berry também pode rodar no modo `nodeLinker: node-modules`, o que te coloca de volta no território do npm.

**O pnpm** mantém um store por máquina, endereçado por conteúdo (`~/Library/pnpm/store` no macOS), e constrói o `node_modules` de cada projeto com hard links para ele. Cinquenta projetos usando a mesma versão do TypeScript compartilham uma única cópia física. O custo marginal por projeto se aproxima de zero para dependências compartilhadas; o store cresce com a união de tudo o que você usa, não a soma. Os detalhes finos (por que o `du` superestima, por que o store precisa de prune) estão em [O pnpm store explicado](/pt/blog/pnpm-store-explained).

## Os números em uma máquina real

Os valores exatos dependem da sua stack, mas o formato é consistente. Considere um desenvolvedor com 30 projetos, com uma média de 900 MB de dependências cada, com bastante sobreposição entre os projetos:

| Gerenciador | Total aproximado em disco |
|---|---|
| npm / yarn classic | 25 a 30 GB (30 cópias completas) |
| yarn berry PnP | 6 a 10 GB (zips comprimidos, cache compartilhado) |
| pnpm | 8 a 12 GB (um store + hard links, antes do prune) |

O pnpm e o PnP ficam na mesma faixa; o npm e o yarn classic custam aproximadamente três vezes mais para os mesmos projetos. A suposição de sobreposição é o que faz a diferença aqui: se seus projetos compartilham poucas dependências, a distância diminui.

## Disco não é o único eixo

Escolher um gerenciador de pacotes apenas pelo uso de disco seria estranho. O ranking de compatibilidade é praticamente o inverso do ranking de disco: o npm funciona com tudo, o pnpm funciona com quase tudo (com problemas ocasionais em pacotes que assumem um layout plano), o PnP exige mais adaptações. Suporte a monorepo, velocidade de instalação e familiaridade da equipe pesam na decisão, e olhamos o ângulo específico de monorepo em [Monorepos e espaço em disco](/pt/blog/monorepo-disk-space).

Mas se a pressão de disco é uma restrição real para você, o conselho prático é:

1. **Já está no pnpm:** você está no time eficiente; sua manutenção é rodar `pnpm store prune` depois de excluir projetos antigos.
2. **Está no npm ou no yarn classic:** você não precisa migrar para resolver seu disco. Excluir pastas `node_modules` obsoletas recupera a maior parte do desperdício, independentemente do gerenciador, já que [elas são sempre reproduzíveis](/pt/blog/how-to-delete-node-modules-safely).
3. **Migrando mesmo assim:** o pnpm é a opção menos disruptiva entre as eficientes; a maioria dos projetos migra com uma importação de lockfile e pequenas mudanças de script.

## Seja qual for o que você usa, o vazamento é o mesmo

Os quatro layouts compartilham um único modo de falha: nada se exclui sozinho. Projetos obsoletos mantêm todo o peso (npm, yarn) ou mantêm referências que prendem o store (pnpm) até você agir. O gerenciador determina a velocidade com que o disco enche, não se ele enche.

Essa parte contínua é o que o [TidyDisk](/pt) resolve: ele conhece cada `node_modules` no seu Mac e o seu pnpm store, mede tudo sem contagem dupla de hard links, sinaliza o que está obsoleto, e limpa o que você escolher em um clique, para a Lixeira. O escaneamento é gratuito, e funciona do mesmo jeito qualquer que seja o gerenciador de pacotes que enche o seu disco.
