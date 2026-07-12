import type { LegalContent } from "./legal.types";

// O inglês é a fonte de verdade das páginas legais. Os demais idiomas
// (fr/es/de/pt) espelham essa estrutura de forma idêntica; apenas o texto
// legível para humanos é traduzido. Nomes de produtos/serviços (TidyDisk,
// Google Analytics, PostHog, Polar, Vercel), o e-mail de contato, o SIRET e o
// endereço postal permanecem inalterados.
export const pt: LegalContent = {
  updatedLabel: "Última atualização",
  privacy: {
    title: "Política de Privacidade",
    intro:
      "Esta política explica quais dados pessoais o TidyDisk coleta, por quê, e as escolhas que você tem. Ela abrange tanto este site quanto o aplicativo TidyDisk para macOS.",
    sections: [
      {
        heading: "Quem é responsável",
        paragraphs: [
          "O TidyDisk é operado por Ahmed ABOUELLEIL SAYED, empresário individual estabelecido na França, que é o controlador de dados responsável pelo tratamento descrito aqui. Você pode nos contatar a qualquer momento pelo e-mail contact@tidydisk.app. Os dados completos de contato e da empresa estão na página de Aviso Legal.",
        ],
      },
      {
        heading: "Análise do site (Google Analytics)",
        paragraphs: [
          "Neste site utilizamos o Google Analytics 4 para entender como os visitantes encontram e usam o site, de modo que possamos melhorá-lo. O Google Analytics define cookies (como o _ga) e coleta dados de uso, como páginas visualizadas, localização aproximada derivada do seu endereço IP, tipo de dispositivo e navegador, e como você navega pelo site.",
          "Só carregamos o Google Analytics depois que você o aceita no banner de cookies. Nada é carregado e nenhum cookie de análise é definido até que você consinta. Você pode alterar ou retirar a sua escolha a qualquer momento por meio do link de Preferências de cookies no rodapé; a retirada remove os cookies de análise. A base legal é o seu consentimento (artigo 6(1)(a) do RGPD). O Google atua como nosso operador; consulte a política de privacidade do Google para mais detalhes.",
        ],
      },
      {
        heading: "Análise de uso do aplicativo (PostHog)",
        paragraphs: [
          "O aplicativo de desktop TidyDisk pode enviar eventos anônimos de uso do produto (por exemplo: uma varredura concluída, a exibição do paywall, a ativação de uma licença) ao PostHog, hospedado na União Europeia. Esses eventos são vinculados a um identificador de instalação aleatório, não ao seu nome ou e-mail, e são usados apenas para entender como o aplicativo é usado e para aprimorá-lo.",
          "A análise do aplicativo pode ser desativada a qualquer momento no aplicativo, em Configurações. Nenhuma análise é coletada enquanto o aplicativo é executado em ambiente de desenvolvimento. A base legal é o nosso interesse legítimo em manter e melhorar o aplicativo (artigo 6(1)(f) do RGPD).",
        ],
      },
      {
        heading: "Compras e licenciamento (Polar)",
        paragraphs: [
          "Quando você compra uma licença do TidyDisk, o checkout e o pagamento são processados pela Polar, que atua como merchant of record (vendedor oficial). A Polar coleta e trata os dados necessários para receber o pagamento e emitir a fatura (como seu e-mail, dados de faturamento e informações de pagamento) e é responsável por recolher e repassar os impostos aplicáveis. Nós não vemos nem armazenamos os dados completos do seu pagamento.",
          "Recebemos informações limitadas do pedido da Polar (como seu e-mail e o status da licença) para que possamos entregar a sua chave de licença e prestar suporte. A base legal é a execução do nosso contrato com você (artigo 6(1)(b) do RGPD). Consulte a política de privacidade da Polar para saber como ela trata os seus dados.",
        ],
      },
      {
        heading: "Hospedagem (Vercel)",
        paragraphs: [
          "Este site é hospedado pela Vercel. Como parte da disponibilização do site, a Vercel trata dados técnicos, como seu endereço IP e registros de requisições, em nosso nome, o que é necessário para entregar as páginas de forma segura e confiável (artigo 6(1)(f) do RGPD).",
        ],
      },
      {
        heading: "Cookies e armazenamento local",
        paragraphs: [
          "Os únicos cookies que este site define são os cookies do Google Analytics descritos acima, e apenas depois que você consente. A sua própria escolha de consentimento é armazenada no armazenamento local do seu navegador (não em um cookie), para que possamos lembrá-la; isso é estritamente necessário e está sempre ativo. Não usamos cookies de publicidade nem de rastreamento entre sites.",
        ],
      },
      {
        heading: "Transferências internacionais",
        paragraphs: [
          "Alguns dos nossos operadores (como Google, Polar e Vercel) podem tratar dados fora do Espaço Econômico Europeu. Quando isso ocorre, as transferências são cobertas por salvaguardas adequadas, como as Cláusulas Contratuais Padrão da Comissão Europeia.",
        ],
      },
      {
        heading: "Por quanto tempo mantemos os dados",
        paragraphs: [
          "Os dados de análise são retidos pelo período configurado no Google Analytics e no PostHog e, então, excluídos ou agregados. Os dados de pedidos e de licenças são mantidos pelo tempo necessário para dar suporte à sua licença e cumprir nossas obrigações legais e contábeis.",
        ],
      },
      {
        heading: "Seus direitos",
        paragraphs: [
          "Nos termos do RGPD, você tem o direito de acessar, corrigir, excluir, restringir ou se opor ao tratamento dos seus dados pessoais, o direito à portabilidade dos dados e o direito de retirar o consentimento a qualquer momento, sem afetar o tratamento anterior. Para exercer qualquer um desses direitos, envie um e-mail para contact@tidydisk.app.",
          "Se você acredita que seus dados não são tratados de forma lícita, tem o direito de apresentar uma reclamação à autoridade de controle local. Na França, essa autoridade é a CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Crianças",
        paragraphs: [
          "O TidyDisk é uma ferramenta para desenvolvedores e não é direcionado a crianças. Não coletamos intencionalmente dados pessoais de crianças menores de 16 anos.",
        ],
      },
      {
        heading: "Alterações a esta política",
        paragraphs: [
          "Podemos atualizar esta política à medida que o produto evolui ou a legislação muda. A data no topo indica quando ela foi revisada pela última vez; alterações significativas serão refletidas aqui.",
        ],
      },
      {
        heading: "Contato",
        paragraphs: [
          "Para qualquer dúvida sobre esta política ou sobre os seus dados, envie um e-mail para contact@tidydisk.app.",
        ],
      },
    ],
  },
  imprint: {
    title: "Aviso Legal",
    intro:
      "Informações sobre quem opera o TidyDisk e como entrar em contato, conforme exigido para a venda online na União Europeia.",
    labels: {
      responsible: "Responsável",
      address: "Endereço",
      email: "E-mail",
      siret: "SIRET",
    },
    sections: [
      {
        heading: "Contato",
        paragraphs: [
          "Para qualquer solicitação, incluindo suporte e pedidos legais ou de privacidade, envie um e-mail para contact@tidydisk.app. Procuramos responder em poucos dias úteis.",
        ],
      },
      {
        heading: "Pagamentos e merchant of record",
        paragraphs: [
          "As licenças do TidyDisk são vendidas por meio da Polar, que atua como merchant of record (vendedor oficial) da venda. A Polar cuida do checkout, do pagamento, do faturamento e do recolhimento e repasse de qualquer IVA ou imposto sobre vendas aplicável. O seu recibo de compra e a sua fatura são emitidos pela Polar.",
        ],
      },
      {
        heading: "Reembolsos e direito de arrependimento",
        paragraphs: [
          "A licença do TidyDisk é um produto digital entregue imediatamente na forma de uma chave de licença. Quando você consente com a entrega imediata, o direito legal de arrependimento de 14 dias para conteúdo digital deixa de se aplicar assim que a entrega tem início. Se algo estiver errado com a sua compra, entre em contato conosco pelo e-mail contact@tidydisk.app ou por meio da Polar, e resolveremos a situação.",
        ],
      },
      {
        heading: "Lei aplicável e litígios",
        paragraphs: [
          "Estas relações são regidas pela lei francesa. Se você for um consumidor residente na União Europeia, mantém a proteção das disposições imperativas da lei do seu país de residência. A Comissão Europeia disponibiliza uma plataforma de resolução de litígios online em ec.europa.eu/consumers/odr.",
        ],
      },
      {
        heading: "Hospedagem",
        paragraphs: [
          "Este site é hospedado pela Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        ],
      },
    ],
  },
};
