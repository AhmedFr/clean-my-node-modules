import type { LegalContent } from "./legal.types";

// Deutsche Uebersetzung der Rechtstexte. Die Struktur spiegelt die englische
// Quelle (en.ts) exakt wider; nur die menschenlesbaren Texte sind uebersetzt.
// Produkt- und Dienstnamen (TidyDisk, Google Analytics, PostHog, Polar, Vercel),
// die Kontakt-E-Mail, SIRET und die Postanschrift bleiben unveraendert.
export const de: LegalContent = {
  updatedLabel: "Zuletzt aktualisiert",
  privacy: {
    title: "Datenschutzerklaerung",
    intro:
      "Diese Erklaerung beschreibt, welche personenbezogenen Daten TidyDisk erhebt, zu welchem Zweck und welche Wahlmoeglichkeiten Sie haben. Sie gilt sowohl fuer diese Website als auch fuer die TidyDisk-App fuer macOS.",
    sections: [
      {
        heading: "Verantwortlicher",
        paragraphs: [
          "TidyDisk wird von Ahmed ABOUELLEIL SAYED betrieben, einem Einzelunternehmer mit Sitz in Frankreich, der fuer die hier beschriebene Verarbeitung der Verantwortliche ist. Sie erreichen uns jederzeit unter contact@tidydisk.app. Vollstaendige Kontakt- und Unternehmensangaben finden Sie im Impressum.",
        ],
      },
      {
        heading: "Website-Analyse (Google Analytics)",
        paragraphs: [
          "Auf dieser Website setzen wir Google Analytics 4 ein, um zu verstehen, wie Besucher die Website finden und nutzen, damit wir sie verbessern koennen. Google Analytics setzt Cookies (etwa _ga) und erhebt Nutzungsdaten wie aufgerufene Seiten, den ungefaehren Standort, der aus Ihrer IP-Adresse abgeleitet wird, den Geraete- und Browsertyp sowie Ihre Navigation auf der Website.",
          "Wir laden Google Analytics erst, nachdem Sie im Cookie-Banner zugestimmt haben. Bis zu Ihrer Einwilligung wird nichts geladen und es werden keine Analyse-Cookies gesetzt. Sie koennen Ihre Wahl jederzeit ueber den Link zu den Cookie-Einstellungen im Footer aendern oder widerrufen; ein Widerruf entfernt die Analyse-Cookies. Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Google handelt als unser Auftragsverarbeiter; Einzelheiten entnehmen Sie der Datenschutzerklaerung von Google.",
        ],
      },
      {
        heading: "App-Nutzungsanalyse (PostHog)",
        paragraphs: [
          "Die TidyDisk-Desktop-App kann anonyme Ereignisse zur Produktnutzung (zum Beispiel: ein abgeschlossener Scan, die Anzeige der Paywall, die Aktivierung einer Lizenz) an PostHog senden, das in der EU gehostet wird. Diese Ereignisse sind mit einer zufaelligen Installationskennung verknuepft, nicht mit Ihrem Namen oder Ihrer E-Mail-Adresse, und dienen ausschliesslich dazu, die Nutzung der App zu verstehen und sie zu verbessern.",
          "Die App-Analyse kann jederzeit in der App unter Einstellungen deaktiviert werden. Waehrend die App im Entwicklungsmodus laeuft, werden keine Analysedaten erhoben. Rechtsgrundlage ist unser berechtigtes Interesse an der Wartung und Verbesserung der App (Art. 6 Abs. 1 lit. f DSGVO).",
        ],
      },
      {
        heading: "Kaeufe und Lizenzierung (Polar)",
        paragraphs: [
          "Wenn Sie eine TidyDisk-Lizenz erwerben, werden der Bezahlvorgang und die Zahlung von Polar abgewickelt, das als Verkaeufer im rechtlichen Sinne (Merchant of Record) auftritt. Polar erhebt und verarbeitet die zur Zahlungsabwicklung und Rechnungsstellung erforderlichen Daten (etwa Ihre E-Mail-Adresse, Rechnungsangaben und Zahlungsinformationen) und ist fuer die Erhebung und Abfuehrung der anfallenden Steuern verantwortlich. Wir sehen und speichern Ihre vollstaendigen Zahlungsdaten nicht.",
          "Wir erhalten von Polar begrenzte Bestellinformationen (etwa Ihre E-Mail-Adresse und den Lizenzstatus), damit wir Ihnen Ihren Lizenzschluessel bereitstellen und Support leisten koennen. Rechtsgrundlage ist die Erfuellung unseres Vertrags mit Ihnen (Art. 6 Abs. 1 lit. b DSGVO). Wie Polar Ihre Daten verarbeitet, entnehmen Sie der Datenschutzerklaerung von Polar.",
        ],
      },
      {
        heading: "Hosting (Vercel)",
        paragraphs: [
          "Diese Website wird von Vercel gehostet. Zur Auslieferung der Website verarbeitet Vercel in unserem Auftrag technische Daten wie Ihre IP-Adresse und Anfrageprotokolle, was erforderlich ist, um die Seiten sicher und zuverlaessig bereitzustellen (Art. 6 Abs. 1 lit. f DSGVO).",
        ],
      },
      {
        heading: "Cookies und lokaler Speicher",
        paragraphs: [
          "Die einzigen Cookies, die diese Website setzt, sind die oben beschriebenen Google-Analytics-Cookies, und nur nach Ihrer Einwilligung. Ihre Einwilligungsentscheidung selbst wird im lokalen Speicher Ihres Browsers (nicht in einem Cookie) abgelegt, damit wir sie uns merken koennen; dies ist unbedingt erforderlich und stets aktiv. Wir verwenden keine Werbe- oder seiteneubergreifenden Tracking-Cookies.",
        ],
      },
      {
        heading: "Internationale Datenuebermittlungen",
        paragraphs: [
          "Einige unserer Auftragsverarbeiter (etwa Google, Polar und Vercel) koennen Daten ausserhalb des Europaeischen Wirtschaftsraums verarbeiten. Soweit dies geschieht, sind die Uebermittlungen durch geeignete Garantien wie die Standardvertragsklauseln der Europaeischen Kommission abgesichert.",
        ],
      },
      {
        heading: "Speicherdauer",
        paragraphs: [
          "Analysedaten werden fuer den in Google Analytics und PostHog konfigurierten Zeitraum aufbewahrt und anschliessend geloescht oder aggregiert. Bestell- und Lizenzdaten werden so lange aufbewahrt, wie es zur Betreuung Ihrer Lizenz sowie zur Erfuellung unserer rechtlichen und buchhalterischen Pflichten erforderlich ist.",
        ],
      },
      {
        heading: "Ihre Rechte",
        paragraphs: [
          "Nach der DSGVO haben Sie das Recht auf Auskunft, Berichtigung, Loeschung, Einschraenkung oder Widerspruch gegen die Verarbeitung Ihrer personenbezogenen Daten, das Recht auf Datenuebertragbarkeit sowie das Recht, Ihre Einwilligung jederzeit zu widerrufen, ohne dass die Rechtmaessigkeit der bisherigen Verarbeitung beruehrt wird. Um eines dieser Rechte auszuueben, schreiben Sie uns an contact@tidydisk.app.",
          "Wenn Sie der Ansicht sind, dass Ihre Daten nicht rechtmaessig verarbeitet werden, haben Sie das Recht, bei Ihrer zustaendigen Aufsichtsbehoerde Beschwerde einzulegen. In Frankreich ist dies die CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Kinder",
        paragraphs: [
          "TidyDisk ist ein Entwicklerwerkzeug und richtet sich nicht an Kinder. Wir erheben nicht wissentlich personenbezogene Daten von Kindern unter 16 Jahren.",
        ],
      },
      {
        heading: "Aenderungen dieser Erklaerung",
        paragraphs: [
          "Wir koennen diese Erklaerung aktualisieren, wenn sich das Produkt weiterentwickelt oder die Rechtslage aendert. Das Datum am Anfang zeigt, wann sie zuletzt ueberarbeitet wurde; wesentliche Aenderungen werden hier abgebildet.",
        ],
      },
      {
        heading: "Kontakt",
        paragraphs: [
          "Bei Fragen zu dieser Erklaerung oder zu Ihren Daten schreiben Sie an contact@tidydisk.app.",
        ],
      },
    ],
  },
  imprint: {
    title: "Impressum",
    intro:
      "Angaben dazu, wer TidyDisk betreibt und wie Sie uns erreichen, wie es fuer den Online-Verkauf in der Europaeischen Union erforderlich ist.",
    labels: {
      responsible: "Verantwortlich",
      address: "Anschrift",
      email: "E-Mail",
      siret: "SIRET",
    },
    sections: [
      {
        heading: "Kontakt",
        paragraphs: [
          "Fuer jede Anfrage, einschliesslich Support sowie rechtlicher oder datenschutzbezogener Anliegen, schreiben Sie an contact@tidydisk.app. Wir bemuehen uns, innerhalb weniger Werktage zu antworten.",
        ],
      },
      {
        heading: "Zahlungen und Verkaeufer im rechtlichen Sinne",
        paragraphs: [
          "TidyDisk-Lizenzen werden ueber Polar verkauft, das als Verkaeufer im rechtlichen Sinne (Merchant of Record) fuer den Verkauf auftritt. Polar wickelt den Bezahlvorgang, die Zahlung, die Rechnungsstellung sowie die Erhebung und Abfuehrung einer etwaigen Umsatzsteuer ab. Ihre Kaufquittung und Rechnung werden von Polar ausgestellt.",
        ],
      },
      {
        heading: "Rueckerstattungen und Widerrufsrecht",
        paragraphs: [
          "Die TidyDisk-Lizenz ist ein digitales Produkt, das sofort als Lizenzschluessel geliefert wird. Sofern Sie der sofortigen Bereitstellung zustimmen, entfaellt das gesetzliche 14-taegige Widerrufsrecht fuer digitale Inhalte, sobald die Lieferung begonnen hat. Wenn mit Ihrem Kauf etwas nicht stimmt, wenden Sie sich an contact@tidydisk.app oder ueber Polar an uns, und wir werden es in Ordnung bringen.",
        ],
      },
      {
        heading: "Anwendbares Recht und Streitigkeiten",
        paragraphs: [
          "Diese Geschaeftsbeziehung unterliegt franzoesischem Recht. Wenn Sie Verbraucher mit Wohnsitz in der EU sind, bleibt Ihnen der Schutz der zwingenden Vorschriften des Rechts Ihres Wohnsitzlandes erhalten. Die Europaeische Kommission stellt unter ec.europa.eu/consumers/odr eine Plattform zur Online-Streitbeilegung bereit.",
        ],
      },
      {
        heading: "Hosting",
        paragraphs: [
          "Diese Website wird gehostet von Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        ],
      },
    ],
  },
};
