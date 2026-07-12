import type { LegalContent } from "./legal.types";

// La version anglaise (en.ts) fait foi pour les pages legales. Cette version
// francaise en reprend la structure a l'identique ; seul le texte lisible est
// traduit. Les noms de produits et de services (TidyDisk, Google Analytics,
// PostHog, Polar, Vercel), l'adresse e-mail, le SIRET et l'adresse postale
// restent inchanges.
export const fr: LegalContent = {
  updatedLabel: "Dernière mise à jour",
  privacy: {
    title: "Politique de confidentialité",
    intro:
      "Cette politique explique quelles données personnelles TidyDisk collecte, pourquoi, et les choix dont vous disposez. Elle couvre à la fois ce site web et l'application TidyDisk pour macOS.",
    sections: [
      {
        heading: "Qui est responsable",
        paragraphs: [
          "TidyDisk est exploité par Ahmed ABOUELLEIL SAYED, entrepreneur individuel établi en France, qui est le responsable du traitement décrit ici. Vous pouvez nous contacter à tout moment à l'adresse contact@tidydisk.app. Les coordonnées complètes et les informations légales figurent sur la page Mentions légales.",
        ],
      },
      {
        heading: "Mesure d'audience du site (Google Analytics)",
        paragraphs: [
          "Sur ce site web, nous utilisons Google Analytics 4 pour comprendre comment les visiteurs trouvent et utilisent le site afin de l'améliorer. Google Analytics dépose des cookies (tels que _ga) et collecte des données d'usage comme les pages consultées, une localisation approximative déduite de votre adresse IP, le type d'appareil et de navigateur, et la manière dont vous naviguez sur le site.",
          "Nous ne chargeons Google Analytics qu'après que vous l'avez accepté dans le bandeau cookies. Rien n'est chargé et aucun cookie de mesure d'audience n'est déposé tant que vous n'avez pas donné votre consentement. Vous pouvez modifier ou retirer votre choix à tout moment via le lien Préférences cookies présent dans le pied de page ; le retrait supprime les cookies de mesure d'audience. La base légale est votre consentement (article 6, paragraphe 1, point a) du RGPD). Google agit en tant que sous-traitant ; consultez la politique de confidentialité de Google pour plus de détails.",
        ],
      },
      {
        heading: "Mesure d'usage de l'application (PostHog)",
        paragraphs: [
          "L'application de bureau TidyDisk peut envoyer des événements anonymes d'usage du produit (par exemple : un scan terminé, l'affichage de l'écran d'achat, l'activation d'une licence) à PostHog, hébergé dans l'Union européenne. Ces événements sont rattachés à un identifiant d'installation aléatoire, et non à votre nom ou à votre adresse e-mail, et servent uniquement à comprendre comment l'application est utilisée et à l'améliorer.",
          "La mesure d'usage de l'application peut être désactivée à tout moment dans l'application, dans les Paramètres. Aucune donnée n'est collectée lorsque l'application s'exécute en mode développement. La base légale est notre intérêt légitime à maintenir et améliorer l'application (article 6, paragraphe 1, point f) du RGPD).",
        ],
      },
      {
        heading: "Achats et licences (Polar)",
        paragraphs: [
          "Lorsque vous achetez une licence TidyDisk, la commande et le paiement sont gérés par Polar, qui agit en tant que revendeur officiel (merchant of record). Polar collecte et traite les données nécessaires à l'encaissement du paiement et à l'émission d'une facture (telles que votre adresse e-mail, vos informations de facturation et vos données de paiement) et est responsable de la collecte et du reversement des taxes applicables. Nous ne voyons ni ne conservons vos coordonnées de paiement complètes.",
          "Nous recevons de Polar des informations de commande limitées (telles que votre adresse e-mail et le statut de votre licence) afin de vous fournir votre clé de licence et de vous apporter une assistance. La base légale est l'exécution de notre contrat avec vous (article 6, paragraphe 1, point b) du RGPD). Consultez la politique de confidentialité de Polar pour savoir comment il traite vos données.",
        ],
      },
      {
        heading: "Hébergement (Vercel)",
        paragraphs: [
          "Ce site web est hébergé par Vercel. Dans le cadre de la diffusion du site, Vercel traite pour notre compte des données techniques telles que votre adresse IP et les journaux de requêtes, ce qui est nécessaire pour délivrer les pages de manière sécurisée et fiable (article 6, paragraphe 1, point f) du RGPD).",
        ],
      },
      {
        heading: "Cookies et stockage local",
        paragraphs: [
          "Les seuls cookies déposés par ce site sont les cookies Google Analytics décrits ci-dessus, et uniquement après votre consentement. Votre choix de consentement lui-même est enregistré dans le stockage local de votre navigateur (et non dans un cookie) afin que nous puissions le mémoriser ; ce stockage est strictement nécessaire et toujours actif. Nous n'utilisons pas de cookies publicitaires ni de suivi intersites.",
        ],
      },
      {
        heading: "Transferts internationaux",
        paragraphs: [
          "Certains de nos sous-traitants (tels que Google, Polar et Vercel) peuvent traiter des données en dehors de l'Espace économique européen. Lorsque cela se produit, ces transferts sont encadrés par des garanties appropriées telles que les clauses contractuelles types de la Commission européenne.",
        ],
      },
      {
        heading: "Durée de conservation des données",
        paragraphs: [
          "Les données de mesure d'audience sont conservées pendant la durée configurée dans Google Analytics et PostHog, puis supprimées ou agrégées. Les données de commande et de licence sont conservées aussi longtemps que nécessaire pour assurer le suivi de votre licence et pour respecter nos obligations légales et comptables.",
        ],
      },
      {
        heading: "Vos droits",
        paragraphs: [
          "En vertu du RGPD, vous disposez du droit d'accéder à vos données personnelles, de les rectifier, de les effacer, d'en limiter le traitement ou de vous y opposer, du droit à la portabilité de vos données, ainsi que du droit de retirer votre consentement à tout moment sans que cela n'affecte les traitements antérieurs. Pour exercer l'un de ces droits, écrivez-nous à contact@tidydisk.app.",
          "Si vous estimez que vos données ne sont pas traitées de manière licite, vous avez le droit d'introduire une réclamation auprès de votre autorité de contrôle locale. En France, il s'agit de la CNIL (www.cnil.fr).",
        ],
      },
      {
        heading: "Mineurs",
        paragraphs: [
          "TidyDisk est un outil destiné aux développeurs et ne s'adresse pas aux enfants. Nous ne collectons pas sciemment de données personnelles concernant des enfants de moins de 16 ans.",
        ],
      },
      {
        heading: "Modifications de cette politique",
        paragraphs: [
          "Nous pouvons mettre à jour cette politique à mesure que le produit évolue ou que la législation change. La date indiquée en haut de page précise sa dernière révision ; les modifications importantes y seront répercutées.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Pour toute question concernant cette politique ou vos données, écrivez à contact@tidydisk.app.",
        ],
      },
    ],
  },
  imprint: {
    title: "Mentions légales",
    intro:
      "Informations sur l'exploitant de TidyDisk et sur les moyens de nous contacter, tel que requis pour la vente en ligne au sein de l'Union européenne.",
    labels: {
      responsible: "Responsable",
      address: "Adresse",
      email: "E-mail",
      siret: "SIRET",
    },
    sections: [
      {
        heading: "Contact",
        paragraphs: [
          "Pour toute demande, y compris pour l'assistance et les demandes juridiques ou relatives à la confidentialité, écrivez à contact@tidydisk.app. Nous nous efforçons de répondre sous quelques jours ouvrés.",
        ],
      },
      {
        heading: "Paiements et revendeur officiel",
        paragraphs: [
          "Les licences TidyDisk sont vendues par l'intermédiaire de Polar, qui agit en tant que revendeur officiel (merchant of record) pour la vente. Polar gère la commande, le paiement, la facturation, ainsi que la collecte et le reversement de la TVA ou de toute taxe sur les ventes applicable. Votre reçu d'achat et votre facture sont émis par Polar.",
        ],
      },
      {
        heading: "Remboursements et droit de rétractation",
        paragraphs: [
          "La licence TidyDisk est un produit numérique livré immédiatement sous la forme d'une clé de licence. Lorsque vous consentez à une livraison immédiate, le droit de rétractation légal de 14 jours applicable aux contenus numériques ne s'applique plus une fois la livraison commencée. Si un problème survient avec votre achat, contactez-nous à contact@tidydisk.app ou via Polar et nous y remédierons.",
        ],
      },
      {
        heading: "Droit applicable et litiges",
        paragraphs: [
          "Ces relations sont régies par le droit français. Si vous êtes un consommateur résidant dans l'Union européenne, vous conservez la protection des dispositions impératives de la loi de votre pays de résidence. La Commission européenne met à disposition une plateforme de règlement en ligne des litiges à l'adresse ec.europa.eu/consumers/odr.",
        ],
      },
      {
        heading: "Hébergement",
        paragraphs: [
          "Ce site web est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.",
        ],
      },
    ],
  },
};
