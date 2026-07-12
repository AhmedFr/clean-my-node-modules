import type { ConsentCopyMap } from "./CookieConsent.types";

/** Google Analytics 4 measurement ID for the marketing site. */
export const GA_ID = "G-0DW5WJLY1M";

/** localStorage key holding the visitor's consent choice. */
export const CONSENT_KEY = "td-cookie-consent";

// Banner copy per locale. Google Analytics only loads once the visitor
// accepts, so the wording promises exactly that: nothing is tracked first.
export const CONSENT_COPY: ConsentCopyMap = {
  en: {
    message:
      "We use Google Analytics cookies to understand how TidyDisk is used. Nothing is tracked until you accept.",
    accept: "Accept",
    decline: "Decline",
  },
  fr: {
    message:
      "Nous utilisons des cookies Google Analytics pour comprendre l'utilisation de TidyDisk. Rien n'est suivi tant que vous n'avez pas accepté.",
    accept: "Accepter",
    decline: "Refuser",
  },
  es: {
    message:
      "Usamos cookies de Google Analytics para entender cómo se usa TidyDisk. No se rastrea nada hasta que aceptes.",
    accept: "Aceptar",
    decline: "Rechazar",
  },
  de: {
    message:
      "Wir verwenden Google-Analytics-Cookies, um zu verstehen, wie TidyDisk genutzt wird. Es wird nichts erfasst, bis du zustimmst.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
  },
  pt: {
    message:
      "Usamos cookies do Google Analytics para entender como o TidyDisk é usado. Nada é rastreado até você aceitar.",
    accept: "Aceitar",
    decline: "Recusar",
  },
};
