import type { Dictionary } from "../i18n.types";

// Portuguese (Brazilian) dictionary. Translates every field of `en.tsx` into
// native-quality Portuguese, reproducing the same element structure (same
// tags, same `className="text-accent"` spans, same `<code>`, `<b>`, `<br/>`,
// bullet array lengths). No em dashes anywhere.
export const pt: Dictionary = {
  meta: {
    title:
      "TidyDisk: veja o que está consumindo o disco do seu ambiente de dev, recupere-o em um clique",
    description:
      "O TidyDisk mostra o que seus projetos de dev custam no disco: node_modules, pnpm store e pacotes instalados. Grátis para escanear, limpeza por 19 euros.",
    blogTitle: "Blog do TidyDisk: mantendo discos de dev limpos",
    blogDescription:
      "Guias práticos sobre limpeza de node_modules, uso de disco por gerenciadores de pacotes e como recuperar espaço em um Mac de desenvolvedor. Da equipe do TidyDisk.",
    ogAlt:
      "TidyDisk: o app de barra de menu do macOS que recupera o disco que seus projetos de dev custam",
  },

  nav: {
    features: "Recursos",
    packages: "Pacotes",
    why: "Por que",
    how: "Como funciona",
    download: "Baixar",
    blog: "Blog",
    github: "GitHub",
    getApp: "Obter o app",
  },

  hero: {
    eyebrow: "App de barra de menu do macOS · escaneamento gratuito",
    heading: (
      <>
        Um <span className="text-accent">disco organizado</span>, sem
        pensar nisso.
      </>
    ),
    body: (
      <>
        O trabalho de dev consome seu Mac silenciosamente: projetos antigos,
        dependências pesadas, experimentos esquecidos. O TidyDisk observa a
        partir da barra de menu e devolve o espaço em um clique. Com
        segurança, para a Lixeira, nunca <code>rm -rf</code>.
      </>
    ),
    downloadCta: "Baixar para macOS",
    githubCta: "Ver no GitHub",
    micro: "Licença MIT · macOS 13+ · Apple Silicon e Intel",
  },

  band: {
    statement: (
      <>
        <code>node_modules</code> é o objeto mais pesado do universo
        conhecido. <em>Nós ajudamos você a apagá-lo.</em>
      </>
    ),
  },

  features: [
    {
      tagline: "Sempre vigiando",
      heading: "Ele vigia seu disco para que você não precise.",
      body: "O TidyDisk vive na sua barra de menu e reescaneia na frequência que você definir: a cada 6 horas, diariamente ou semanalmente. Uma notificação nativa aparece no instante em que seus node_modules ultrapassam o limite que você configurou.",
      bullets: [
        "Escaneamentos em segundo plano a cada 6 horas, diariamente ou semanalmente",
        "Um limite que você define, em gigabytes simples",
        "Um olhar na barra de menu já mostra onde você está",
      ],
    },
    {
      tagline: "Clareza total",
      heading: "Cada dependência morta, classificada.",
      body: "Abra o launcher completo para uma limpeza profunda. Busca no estilo Spotlight entre nomes de projetos e caminhos, com cada pasta node_modules mostrando seu tamanho real e há quanto tempo você não a toca. Os maiores e mais antigos infratores sobem ao topo.",
      bullets: [
        "Ordene por último uso, tamanho ou nome do projeto",
        "Navegação completa pelo teclado: ↑↓ para mover, ↵ para abrir, ⌘⌫ para excluir",
        "No pnpm, os bytes reais que você liberaria, além do que está vinculado ao store compartilhado",
        "Revele no Finder ou abra no seu editor, a uma tecla de distância",
      ],
    },
    {
      tagline: "Retorno seguro",
      heading: "Um clique. Gigabytes de volta. Nada perdido.",
      body: (
        <>
          Escolha o que você não precisa e vai para a Lixeira. Sem terminal,
          sem roleta de <code>rm -rf</code>, recuperável até você esvaziá-la.
          Veja o medidor cair e seu espaço livre subir. Precisa do projeto de
          novo? Um único <code>npm install</code> traz tudo de volta.
        </>
      ),
      bullets: [
        <>
          Exclui para a Lixeira: recuperável, nunca <code>rm -rf</code>
        </>,
        "Exclua uma pasta ou varra todas as antigas de uma vez",
        "Só toca em node_modules, nunca no seu código-fonte",
      ],
    },
    {
      tagline: "Visão de toda a máquina",
      heading: "Todo pacote que você instalou, em uma única lista.",
      body: "Abra a aba Pacotes para um inventário de todo o computador de cada dependência que seus projetos usam: quantos a utilizam, seu tamanho, as versões que você tem, a mais recente no npm, e quaisquer alertas de segurança. Identifique os pesados e não usados, unifique versões que se dispersaram, e veja o que está sinalizado, tudo a partir de projetos que você já escaneou.",
      bullets: [
        "Quantos projetos usam cada pacote, e seu tamanho real",
        <>
          Um selo de <b>unificar</b> quando um pacote está instalado em
          várias versões
        </>,
        "Selos de mais recente no npm e alerta de segurança. Expanda uma linha para severidade por versão",
      ],
    },
  ],

  grid: {
    kicker: "Tudo em um único menu",
    heading: (
      <>
        App pequeno. <span className="text-accent">Grande alívio.</span>
      </>
    ),
    lead: "Seus escaneamentos ficam no seu Mac. Apenas análises de uso anônimas, com opção de recusa em um clique nas Configurações. Um utilitário discreto que mantém seu disco honesto.",
    cards: [
      {
        title: "Limpe o pnpm store",
        copy: "Recupere as versões mortas do store compartilhado com um clique seguro. Nunca exclui o store em si.",
      },
      {
        title: "Tamanho real vs. vinculado",
        copy: "No pnpm, veja os bytes que você realmente liberaria, além do que está vinculado ao store compartilhado.",
      },
      {
        title: "Alertas de segurança",
        copy: "Um selo de severidade em qualquer pacote com vulnerabilidade conhecida, vindo do banco de dados de alertas do npm.",
      },
      {
        title: "Escaneamentos agendados",
        copy: "Roda a cada 6 horas, diariamente ou semanalmente, totalmente em segundo plano.",
      },
      {
        title: "Alertas de limite",
        copy: "Defina um limite em gigabytes e seja avisado no instante em que ultrapassá-lo.",
      },
      {
        title: "Medidor de disco em pixels",
        copy: "Uma barra visível de relance que enche e fica vermelha conforme suas dependências se acumulam.",
      },
      {
        title: "Revelar no Finder",
        copy: "Vá direto para qualquer pasta de projeto sem tirar as mãos do teclado.",
      },
      {
        title: "Abrir no seu editor",
        copy: "Uma tecla abre o projeto no editor que você já usa.",
      },
      {
        title: "Detecção de framework",
        copy: "React, Next, Vue, Svelte, Node, Expo: cada projeto, corretamente identificado.",
      },
    ],
    comingSoonPill: "Em breve",
    comingSoonText: (
      <>
        Caches de npm, yarn e bun, além de artefatos de build por projeto
        como <code>.next</code> e <code>dist</code>.
      </>
    ),
  },

  why: {
    kicker: "Por que se acumula",
    heading: (
      <>
        O ciclo de vida do <span className="text-accent">node_modules</span>.
      </>
    ),
    lead: "Toda instalação grava suas dependências no disco. O quanto elas se acumulam, e o quanto você pode recuperar, depende do seu gerenciador de pacotes.",
    npmTag: "uma cópia completa por projeto",
    pnpmTag: "um store compartilhado",
    npmNote: (
      <>
        Cada projeto recebe sua <b>própria cópia completa</b> de cada
        dependência. Instale <code>lodash</code> em dez projetos e ele é
        gravado no disco <b>dez vezes</b>. Multiplique isso por centenas de
        pacotes transitivos e os projetos antigos que você esqueceu, e você
        chega a dezenas de gigabytes.
      </>
    ),
    pnpmNote: (
      <>
        O pnpm mantém <b>um store global</b> e cria hard links de cada
        projeto para ele. Uma determinada versão de um pacote existe no
        disco <b>uma única vez</b>, não importa quantos projetos a usem, uma
        economia enorme. <b>Mas o store ainda cresce</b> conforme novas
        versões chegam e as antigas permanecem.
      </>
    ),
    storeLabel: "· armazenado uma vez",
    footNote: (
      <>
        O TidyDisk atua <b>nas duas pontas</b>: envia para a Lixeira o{" "}
        <code>node_modules</code> de projetos antigos nos quais você nunca
        mais vai rodar <code>npm install</code>, <b>e</b> limpa com
        segurança as versões do seu pnpm store que ninguém mais referencia,
        com um clique na aba <b>Caches</b> (ele nunca exclui o store em si).
      </>
    ),
    sizingNote: (
      <>
        É também por isso que os tamanhos parecem pequenos no pnpm: o
        TidyDisk conta o store compartilhado <b>uma única vez</b> e mostra o
        que é realmente seu para liberar, não os mesmos bytes vinculados em
        uma dúzia de projetos.
      </>
    ),
  },

  how: {
    kicker: "Como funciona",
    heading: (
      <>
        Três passos para um <span className="text-accent">Mac mais leve.</span>
      </>
    ),
    steps: [
      {
        num: "01",
        title: "Baixe e ele escaneia",
        body: "Baixe o .app assinado, ou clone o repositório e compile o seu próprio. O primeiro escaneamento mapeia cada pasta node_modules no seu disco.",
        cmd: (
          <>
            <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
            package
          </>
        ),
      },
      {
        num: "02",
        title: "Defina seu limite",
        body: "Escolha um limite em gigabytes e a frequência de reescaneamento: a cada 6 horas, diariamente ou semanalmente. É toda a configuração.",
        cmd: (
          <>
            <span className="pmt">limite</span> 5 GB ·{" "}
            <span className="pmt">verificar</span> diariamente
          </>
        ),
      },
      {
        num: "03",
        title: "Limpe com um clique",
        body: "Quando você ultrapassar o limite, revise as pastas antigas (ou limpe o pnpm store, ou audite um pacote pesado) e recupere o espaço. Seu disco agradece.",
        cmd: (
          <>
            <span className="pmt">↵</span> 2,71 GB movidos para a Lixeira
          </>
        ),
      },
    ],
  },

  download: {
    kicker: "Baixar",
    heading: (
      <>
        Grátis para escanear.{" "}
        <span className="text-accent">19 euros para limpar.</span>
      </>
    ),
    lead: "O escaneamento é gratuito para sempre e o código-fonte é MIT no GitHub. A limpeza em um clique é uma licença vitalícia única: preço de lançamento de 19 euros, depois 29 após o lançamento. Devolução em 30 dias, sem perguntas.",
    free: {
      name: (
        <>
          <span className="text-accent">$0</span> · Escaneie tudo
        </>
      ),
      desc: "O escaneamento, grátis para sempre.",
      bullets: [
        "Baixe e execute, sem configuração necessária",
        "Veja cada pasta node_modules, cache e pacote na sua máquina",
        "Nunca precisa de conta",
      ],
      cta: "Baixar para macOS",
    },
    pro: {
      badge: "Preço de fundador",
      name: (
        <>
          <span className="text-accent">€19</span> · Limpeza vitalícia
        </>
      ),
      desc: "Licença única, libera a limpeza para sempre.",
      bullets: [
        "Exclusão em um clique, direto para a Lixeira",
        "Limpar antigos: varra todos os node_modules antigos de uma vez",
        "Limpe seu pnpm store, com um clique",
        "Todas as atualizações futuras incluídas",
        "Chave de licença instantânea, entregue via Polar",
        "Preço de fundador: 19 euros agora, 29 euros após o lançamento",
      ],
      cta: "Comprar TidyDisk · €19",
    },
  },

  finalCta: {
    heading: (
      <>
        Pare de acumular
        <br />
        node_modules.
      </>
    ),
    body: "Recupere os gigabytes que suas dependências vêm acumulando. Escaneie grátis, libere a limpeza por 19 euros.",
    downloadCta: "Baixar escaneamento grátis",
    buyCta: "Comprar · €19",
  },

  footer: {
    tagline:
      "O app de barra de menu que impede a bagunça de dev de consumir seu Mac.",
    productHead: "Produto",
    openSourceHead: "Código aberto",
    legalHead: "Legal",
    links: {
      feature: "Recursos",
      how: "Como funciona",
      download: "Baixar",
      blog: "Blog",
      repo: "Repositório no GitHub",
      issues: "Issues",
      releases: "Releases",
      privacy: "Política de Privacidade",
      legal: "Aviso Legal",
      cookies: "Preferências de cookies",
    },
    copyright: "© 2026 TidyDisk · Licença MIT",
    platform: "macOS 13+ · Apple Silicon e Intel",
  },

  blog: {
    eyebrow: "blog",
    listTitle: (
      <>
        Mantendo discos de dev <span className="text-accent">limpos</span>
      </>
    ),
    listLead:
      "Guias práticos sobre node_modules, internals de gerenciadores de pacotes e como recuperar espaço em disco. Novo artigo toda semana.",
    readArticle: "Ler artigo",
    backToArticles: "← Todos os artigos",
    byline: "TidyDisk team",
    ctaTitle: "Veja o que seus projetos realmente custam",
    ctaBody:
      "O TidyDisk escaneia seu Mac gratuitamente e mostra cada pasta node_modules, com tamanho e classificação. A limpeza é um clique, sempre para a Lixeira.",
    ctaButton: "Baixar para macOS",
  },
};
