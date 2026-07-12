import type { LegalContent } from "./legal.types";

// English is the source of truth for the legal pages. The other locales
// (fr/es/de/pt) mirror this structure verbatim; only the human-readable text is
// translated. Product/service names (TidyDisk, Google Analytics, PostHog,
// Polar, Vercel), the contact email, SIRET, and postal address stay as-is.
export const en: LegalContent = {
  updatedLabel: "Last updated",
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains what personal data TidyDisk collects, why, and the choices you have. It covers both this website and the TidyDisk macOS app.",
    sections: [
      {
        heading: "Who is responsible",
        paragraphs: [
          "TidyDisk is operated by Ahmed ABOUELLEIL SAYED, a sole trader based in France, who is the data controller for the processing described here. You can reach us any time at contact@tidydisk.app. Full contact and business details are on the Legal Notice page.",
        ],
      },
      {
        heading: "Website analytics (Google Analytics)",
        paragraphs: [
          "On this website we use Google Analytics 4 to understand how visitors find and use the site so we can improve it. Google Analytics sets cookies (such as _ga) and collects usage data like pages viewed, approximate location derived from your IP address, device and browser type, and how you navigate the site.",
          "We only load Google Analytics after you accept it in the cookie banner. Nothing is loaded and no analytics cookies are set until you consent. You can change or withdraw your choice at any time through the Cookie preferences link in the footer; withdrawing removes the analytics cookies. The legal basis is your consent (Article 6(1)(a) GDPR). Google acts as our processor; see Google's privacy policy for details.",
        ],
      },
      {
        heading: "App usage analytics (PostHog)",
        paragraphs: [
          "The TidyDisk desktop app can send anonymous product-usage events (for example: a scan completed, the paywall was shown, a license was activated) to PostHog, hosted in the EU. These events are tied to a random install identifier, not to your name or email, and are used only to understand how the app is used and to improve it.",
          "App analytics can be turned off at any time in the app under Settings. No analytics are collected while the app runs in development. The legal basis is our legitimate interest in maintaining and improving the app (Article 6(1)(f) GDPR).",
        ],
      },
      {
        heading: "Purchases and licensing (Polar)",
        paragraphs: [
          "When you buy a TidyDisk license, the checkout and payment are handled by Polar, which acts as the merchant of record. Polar collects and processes the data needed to take payment and issue an invoice (such as your email, billing details, and payment information) and is responsible for collecting and remitting applicable taxes. We do not see or store your full payment details.",
          "We receive limited order information from Polar (such as your email and license status) so we can deliver your license key and provide support. The legal basis is performance of our contract with you (Article 6(1)(b) GDPR). See Polar's privacy policy for how it handles your data.",
        ],
      },
      {
        heading: "Hosting (Vercel)",
        paragraphs: [
          "This website is hosted by Vercel. As part of serving the site, Vercel processes technical data such as your IP address and request logs on our behalf, which is necessary to deliver the pages securely and reliably (Article 6(1)(f) GDPR).",
        ],
      },
      {
        heading: "Cookies and local storage",
        paragraphs: [
          "The only cookies this site sets are the Google Analytics cookies described above, and only after you consent. Your consent choice itself is stored in your browser's local storage (not a cookie) so we can remember it; this is strictly necessary and always active. We do not use advertising or cross-site tracking cookies.",
        ],
      },
      {
        heading: "International transfers",
        paragraphs: [
          "Some of our processors (such as Google, Polar, and Vercel) may process data outside the European Economic Area. Where that happens, transfers are covered by appropriate safeguards such as the European Commission's Standard Contractual Clauses.",
        ],
      },
      {
        heading: "How long we keep data",
        paragraphs: [
          "Analytics data is retained for the period configured in Google Analytics and PostHog and then deleted or aggregated. Order and license data is kept for as long as needed to support your license and to meet our legal and accounting obligations.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          "Under the GDPR you have the right to access, correct, delete, restrict, or object to the processing of your personal data, the right to data portability, and the right to withdraw consent at any time without affecting prior processing. To exercise any of these, email us at contact@tidydisk.app.",
          "If you believe your data is not handled lawfully, you have the right to lodge a complaint with your local supervisory authority. In France this is the CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "TidyDisk is a developer tool and is not directed at children. We do not knowingly collect personal data from children under 16.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this policy as the product evolves or the law changes. The date at the top shows when it was last revised; significant changes will be reflected here.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "For any question about this policy or your data, email contact@tidydisk.app.",
        ],
      },
    ],
  },
  imprint: {
    title: "Legal Notice",
    intro:
      "Information about who operates TidyDisk and how to get in touch, as required for selling online in the European Union.",
    labels: {
      responsible: "Responsible",
      address: "Address",
      email: "Email",
      siret: "SIRET",
    },
    sections: [
      {
        heading: "Contact",
        paragraphs: [
          "For any inquiry, including support and legal or privacy requests, email contact@tidydisk.app. We aim to respond within a few business days.",
        ],
      },
      {
        heading: "Payments and merchant of record",
        paragraphs: [
          "TidyDisk licenses are sold through Polar, which acts as the merchant of record for the sale. Polar handles the checkout, payment, invoicing, and the collection and remittance of any applicable VAT or sales tax. Your purchase receipt and invoice are issued by Polar.",
        ],
      },
      {
        heading: "Refunds and right of withdrawal",
        paragraphs: [
          "The TidyDisk license is a digital product delivered immediately as a license key. Where you consent to immediate delivery, the statutory 14-day right of withdrawal for digital content no longer applies once delivery has begun. If something is wrong with your purchase, contact us at contact@tidydisk.app or through Polar and we will make it right.",
        ],
      },
      {
        heading: "Governing law and disputes",
        paragraphs: [
          "These dealings are governed by French law. If you are a consumer resident in the EU, you keep the protection of the mandatory provisions of the law of your country of residence. The European Commission provides an online dispute resolution platform at ec.europa.eu/consumers/odr.",
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "This website is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        ],
      },
    ],
  },
};
