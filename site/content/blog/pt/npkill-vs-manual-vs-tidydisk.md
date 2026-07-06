---
title: "npkill vs. limpeza manual vs. TidyDisk: qual usar?"
description: "Uma comparação honesta das três formas de limpar o node_modules em um Mac: comandos brutos de terminal, o CLI npkill e o app de barra de menu TidyDisk."
date: "2026-08-15"
---

Existem três formas razoáveis de recuperar o espaço em disco que seus projetos JavaScript acumulam: fazer na mão pelo terminal, usar um CLI feito para isso, ou rodar um app que fica de olho continuamente. Nós construímos uma dessas três opções, então desconte o viés, mas aqui está a comparação honesta, incluindo os casos em que a resposta não somos nós.

## Opção 1: comandos manuais de terminal

A opção de zero instalação. Encontre e meça tudo:

```bash
find ~/code -name node_modules -type d -prune -exec du -sh {} + | sort -rh
```

Depois exclua o que você escolher. Os padrões completos de comando estão em [nosso guia para encontrar cada pasta node_modules](/pt/blog/find-node-modules-folders-mac).

**Pontos fortes:** Sem dependências, funciona em qualquer lugar, automatizável, você vê exatamente o que acontece.

**Pontos fracos:** Você precisa se lembrar de fazer isso. A medição é lenta em discos grandes, o `du` conta os hard links do pnpm em dobro (detalhes [aqui](/pt/blog/pnpm-store-explained)), a checagem de tempo de inatividade é uma ginástica de shell, e a ferramenta natural de exclusão é o `rm -rf`, que não tem desfazer. Na prática, a maioria das pessoas faz isso uma vez, se sente ótima, e nunca mais repete.

**Ideal para:** limpezas pontuais, servidores remotos, pessoas que vivem no terminal e gostam disso.

## Opção 2: npkill

O [npkill](https://npkill.js.org/) é um CLI open source bem feito: rode `npx npkill`, ele escaneia a partir da pasta atual, lista cada `node_modules` com seu tamanho, e você exclui com a barra de espaço. É gratuito, rápido para começar, e merece sua popularidade.

**Pontos fortes:** Gratuito, sem instalação (roda via npx), interativo e bem mais amigável do que find/du crus, mostra informação de última modificação, multiplataforma.

**Pontos fracos:** Ainda é uma sessão que você precisa se lembrar de rodar. Ele escaneia a partir de onde você o inicia, então pastas fora dessa árvore ficam de fora. A exclusão é imediata e permanente em vez de ir para a Lixeira (não há desfazer se você escolher a linha errada). Cobre apenas `node_modules`: sem consciência do pnpm store, e pastas com hard links do pnpm reportam tamanhos que superestimam o que a exclusão vai liberar.

**Ideal para:** desenvolvedores que querem uma limpeza gratuita, ocasional e interativa, e que se sentem confortáveis em um terminal.

## Opção 3: TidyDisk

O [TidyDisk](/pt) é um app de barra de menu do macOS. Ele escaneia continuamente em vez de sob demanda: cada pasta `node_modules`, seu pnpm store, e seus pacotes instalados, medidos corretamente (ele considera os hard links do pnpm em vez de contá-los em dobro) e classificados por tempo de inatividade. A limpeza é um clique, e tudo vai para a Lixeira, nunca via `rm -rf`, então qualquer erro é reversível. O escaneamento é gratuito; a limpeza em um clique é uma licença vitalícia de 19 euros.

**Pontos fortes:** O número está sempre atualizado, sem sessão para lembrar. Medição com consciência do pnpm. Exclusão via Lixeira com desfazer real. Classificação por tempo de inatividade embutida. Sem necessidade de terminal.

**Pontos fracos:** Apenas macOS. O clique de limpeza custa dinheiro (uma vez). Quem quer uma ferramenta automatizável e encadeável em pipe vai preferir um CLI.

**Ideal para:** desenvolvedores Mac que querem o problema resolvido de forma contínua em vez de heroica, e qualquer um que já tenha errado o dedo em um `rm -rf`.

## A decisão de verdade

| Você é... | Use |
|---|---|
| Limpando um servidor ou máquina de CI | Comandos manuais |
| Uma pessoa de terminal fazendo uma limpeza trimestral, de graça | npkill |
| Um usuário de Mac que quer algo contínuo, seguro e em um clique | TidyDisk |

E duas notas honestas. Primeira: se você limpa duas vezes por ano e o terminal não te assusta, o npkill é genuinamente bom e não custa nada; preferimos que você o use a não fazer nada. Segunda: seja qual for sua escolha, exclua para a Lixeira quando puder e confira [por que o rm -rf é o hábito errado](/pt/blog/never-rm-rf-node-modules) quando não puder.

Se a opção contínua parece com o seu estilo, [baixe o TidyDisk](/pt) e rode o escaneamento gratuito. Você vai saber o seu número em cerca de um minuto, e o primeiro número costuma ser o convincente.
