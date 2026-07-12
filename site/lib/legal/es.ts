import type { LegalContent } from "./legal.types";

// El inglés (en.ts) es la fuente de verdad de las páginas legales. Las demás
// localizaciones (fr/es/de/pt) reproducen esta estructura de forma idéntica;
// solo se traduce el texto legible. Los nombres de producto/servicio (TidyDisk,
// Google Analytics, PostHog, Polar, Vercel), el correo de contacto, el SIRET y
// la dirección postal se mantienen tal cual.
export const es: LegalContent = {
  updatedLabel: "Última actualización",
  privacy: {
    title: "Política de Privacidad",
    intro:
      "Esta política explica qué datos personales recopila TidyDisk, con qué finalidad y las opciones de las que dispone. Abarca tanto este sitio web como la aplicación TidyDisk para macOS.",
    sections: [
      {
        heading: "Quién es el responsable",
        paragraphs: [
          "TidyDisk es operado por Ahmed ABOUELLEIL SAYED, autónomo con domicilio en Francia, que es el responsable del tratamiento de los datos descritos aquí. Puede ponerse en contacto con nosotros en cualquier momento en contact@tidydisk.app. Los datos completos de contacto y de la empresa figuran en la página de Aviso Legal.",
        ],
      },
      {
        heading: "Analítica del sitio web (Google Analytics)",
        paragraphs: [
          "En este sitio web utilizamos Google Analytics 4 para entender cómo encuentran y usan el sitio los visitantes, de modo que podamos mejorarlo. Google Analytics instala cookies (como _ga) y recopila datos de uso como las páginas vistas, la ubicación aproximada derivada de su dirección IP, el tipo de dispositivo y navegador, y la forma en que navega por el sitio.",
          "Solo cargamos Google Analytics después de que usted lo acepte en el banner de cookies. No se carga nada ni se instala ninguna cookie analítica hasta que da su consentimiento. Puede cambiar o retirar su elección en cualquier momento mediante el enlace de Preferencias de cookies del pie de página; al retirarlo se eliminan las cookies analíticas. La base jurídica es su consentimiento (artículo 6, apartado 1, letra a) del RGPD). Google actúa como nuestro encargado del tratamiento; consulte la política de privacidad de Google para más detalles.",
        ],
      },
      {
        heading: "Analítica de uso de la aplicación (PostHog)",
        paragraphs: [
          "La aplicación de escritorio TidyDisk puede enviar eventos anónimos de uso del producto (por ejemplo: un análisis completado, la visualización del muro de pago, la activación de una licencia) a PostHog, alojado en la UE. Estos eventos se asocian a un identificador de instalación aleatorio, no a su nombre ni a su correo electrónico, y se utilizan únicamente para comprender cómo se usa la aplicación y mejorarla.",
          "La analítica de la aplicación puede desactivarse en cualquier momento en la propia aplicación, en Ajustes. No se recopila ninguna analítica mientras la aplicación se ejecuta en modo de desarrollo. La base jurídica es nuestro interés legítimo en mantener y mejorar la aplicación (artículo 6, apartado 1, letra f) del RGPD).",
        ],
      },
      {
        heading: "Compras y licencias (Polar)",
        paragraphs: [
          "Cuando compra una licencia de TidyDisk, el proceso de pago (checkout) y el cobro los gestiona Polar, que actúa como comerciante registrado (merchant of record). Polar recopila y trata los datos necesarios para cobrar el pago y emitir una factura (como su correo electrónico, los datos de facturación y la información de pago) y es responsable de recaudar y remitir los impuestos aplicables. Nosotros no vemos ni almacenamos los datos completos de su medio de pago.",
          "Recibimos de Polar información limitada del pedido (como su correo electrónico y el estado de la licencia) para poder entregarle su clave de licencia y prestarle soporte. La base jurídica es la ejecución de nuestro contrato con usted (artículo 6, apartado 1, letra b) del RGPD). Consulte la política de privacidad de Polar para saber cómo trata sus datos.",
        ],
      },
      {
        heading: "Alojamiento (Vercel)",
        paragraphs: [
          "Este sitio web está alojado por Vercel. Como parte de la prestación del servicio, Vercel trata datos técnicos como su dirección IP y los registros de solicitudes por cuenta nuestra, lo cual es necesario para servir las páginas de forma segura y fiable (artículo 6, apartado 1, letra f) del RGPD).",
        ],
      },
      {
        heading: "Cookies y almacenamiento local",
        paragraphs: [
          "Las únicas cookies que instala este sitio son las cookies de Google Analytics descritas anteriormente, y solo después de que usted dé su consentimiento. Su propia elección de consentimiento se guarda en el almacenamiento local de su navegador (no en una cookie) para que podamos recordarla; esto es estrictamente necesario y está siempre activo. No utilizamos cookies de publicidad ni de seguimiento entre sitios.",
        ],
      },
      {
        heading: "Transferencias internacionales",
        paragraphs: [
          "Algunos de nuestros encargados del tratamiento (como Google, Polar y Vercel) pueden tratar datos fuera del Espacio Económico Europeo. Cuando esto ocurre, las transferencias están amparadas por garantías adecuadas, como las Cláusulas Contractuales Tipo de la Comisión Europea.",
        ],
      },
      {
        heading: "Cuánto tiempo conservamos los datos",
        paragraphs: [
          "Los datos analíticos se conservan durante el periodo configurado en Google Analytics y PostHog y luego se eliminan o se agregan. Los datos de pedidos y licencias se conservan durante el tiempo necesario para dar soporte a su licencia y para cumplir nuestras obligaciones legales y contables.",
        ],
      },
      {
        heading: "Sus derechos",
        paragraphs: [
          "En virtud del RGPD, tiene derecho a acceder, rectificar, suprimir, limitar u oponerse al tratamiento de sus datos personales, así como derecho a la portabilidad de los datos y derecho a retirar su consentimiento en cualquier momento sin que ello afecte al tratamiento anterior. Para ejercer cualquiera de estos derechos, escríbanos a contact@tidydisk.app.",
          "Si considera que sus datos no se tratan de forma lícita, tiene derecho a presentar una reclamación ante su autoridad de control local. En Francia se trata de la CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Menores",
        paragraphs: [
          "TidyDisk es una herramienta para desarrolladores y no está dirigida a menores. No recopilamos de forma consciente datos personales de menores de 16 años.",
        ],
      },
      {
        heading: "Cambios en esta política",
        paragraphs: [
          "Podemos actualizar esta política a medida que el producto evolucione o cambie la legislación. La fecha que aparece en la parte superior indica cuándo se revisó por última vez; los cambios significativos se reflejarán aquí.",
        ],
      },
      {
        heading: "Contacto",
        paragraphs: [
          "Para cualquier pregunta sobre esta política o sobre sus datos, escriba a contact@tidydisk.app.",
        ],
      },
    ],
  },
  imprint: {
    title: "Aviso Legal",
    intro:
      "Información sobre quién opera TidyDisk y cómo ponerse en contacto, tal como se exige para la venta en línea en la Unión Europea.",
    labels: {
      responsible: "Responsable",
      address: "Dirección",
      email: "Correo electrónico",
      siret: "SIRET",
      vat: "IVA",
    },
    sections: [
      {
        heading: "Contacto",
        paragraphs: [
          "Para cualquier consulta, incluidas las de soporte y las relativas a asuntos legales o de privacidad, escriba a contact@tidydisk.app. Procuramos responder en unos pocos días hábiles.",
        ],
      },
      {
        heading: "Pagos y comerciante registrado",
        paragraphs: [
          "Las licencias de TidyDisk se venden a través de Polar, que actúa como comerciante registrado (merchant of record) de la venta. Polar gestiona el proceso de pago, el cobro, la facturación y la recaudación y remisión de cualquier IVA o impuesto sobre las ventas que resulte aplicable. Su recibo de compra y su factura los emite Polar.",
        ],
      },
      {
        heading: "Reembolsos y derecho de desistimiento",
        paragraphs: [
          "La licencia de TidyDisk es un producto digital que se entrega de inmediato en forma de clave de licencia. Cuando usted consiente la entrega inmediata, el derecho legal de desistimiento de 14 días para contenidos digitales deja de ser aplicable una vez que ha comenzado la entrega. Si algo no está bien con su compra, póngase en contacto con nosotros en contact@tidydisk.app o a través de Polar y lo solucionaremos.",
        ],
      },
      {
        heading: "Legislación aplicable y controversias",
        paragraphs: [
          "Estas relaciones se rigen por la legislación francesa. Si es un consumidor residente en la UE, conserva la protección de las disposiciones imperativas de la legislación de su país de residencia. La Comisión Europea ofrece una plataforma de resolución de litigios en línea en ec.europa.eu/consumers/odr.",
        ],
      },
      {
        heading: "Alojamiento",
        paragraphs: [
          "Este sitio web está alojado por Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        ],
      },
    ],
  },
};
