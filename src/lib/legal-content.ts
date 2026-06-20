// Contenu légal pour ArbiTech — 4 documents requis pour un SaaS en production.
// Chaque document est un tableau de sections { h2, paragraphs[] }.

export type LegalSection = {
  h2: string;
  paragraphs: string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "conditions",
    title: "Conditions d'utilisation",
    description:
      "Les règles d'utilisation de la plateforme ArbiTech. En clair, sans jargon juridique inutile.",
    lastUpdated: "20 juin 2025",
    sections: [
      {
        h2: "1. Objet",
        paragraphs: [
          "ArbiTech est une plateforme SaaS (Software as a Service) qui détecte et affiche des opportunités d'arbitrage sur les marchés de crypto-monnaies (Binance, Bybit, OKX, KuCoin). Les présentes conditions d'utilisation définissent les règles d'utilisation du service.",
          "En créant un compte ou en utilisant ArbiTech, vous acceptez sans réserve les présentes conditions. Si vous n'êtes pas d'accord, n'utilisez pas le service.",
        ],
      },
      {
        h2: "2. Définition du service",
        paragraphs: [
          "ArbiTech est un outil d'information. Il détecte et affiche des différences de prix entre plateformes de crypto-monnaies. ArbiTech n'est pas une plateforme de trading : vous n'achetez et ne vendez jamais de crypto via ArbiTech. Vous le faites vous-même, sur les plateformes concernées, en suivant les opportunités affichées.",
          "ArbiTech ne garde pas custody (garde) de vos fonds. Vous restez seul responsable de vos comptes sur Binance, Bybit, OKX, KuCoin et de vos transferts.",
        ],
      },
      {
        h2: "3. Comptes et sécurité",
        paragraphs: [
          "Vous devez fournir des informations exactes lors de l'inscription (nom, email). Vous êtes responsable de la confidentialité de votre mot de passe et de toutes les activités effectuées depuis votre compte.",
          "ArbiTech se réserve le droit de suspendre ou de fermer un compte en cas de fraude, d'abus, de tentative de manipulation du système, ou de non-respect des présentes conditions.",
        ],
      },
      {
        h2: "4. Abonnements et paiement",
        paragraphs: [
          "ArbiTech propose 3 forfaits : Découverte (gratuit), Pro (15 000 FCFA/mois) et Institutionnel (50 000 FCFA/mois). Les prix sont indiqués en FCFA et peuvent être modifiés à tout moment, avec un préavis de 30 jours pour les abonnés actifs.",
          "Les abonnements sont prélevés mensuellement ou annuellement, selon votre choix. Vous pouvez annuler à tout moment : l'abonnement reste actif jusqu'à la fin de la période payée, puis bascule automatiquement sur le plan gratuit.",
          "Aucun remboursement n'est accordé pour les périodes partiellement utilisées, sauf en cas de dysfonctionnement majeur du service imputable à ArbiTech.",
        ],
      },
      {
        h2: "5. Programme ambassadeur",
        paragraphs: [
          "Le programme ambassadeur permet à tout utilisateur (même sans abonnement payant) de parrainer de nouveaux utilisateurs et de toucher une commission sur leurs abonnements.",
          "Le taux de commission est de 20 % du montant de l'abonnement, versé à vie tant que le filleul reste abonné. Les commissions sont créditées sur votre compte ambassadeur et peuvent être réclamées dès qu'elles atteignent un seuil minimum de 5 000 FCFA.",
          "ArbiTech se réserve le droit de modifier les taux de commission ou les conditions du programme, avec un préavis de 30 jours. Toute tentative de fraude au parrainage (faux comptes, auto-parrainage) entraîne l'annulation des commissions et la fermeture du compte.",
        ],
      },
      {
        h2: "6. Limitation de responsabilité",
        paragraphs: [
          "ArbiTech est un outil d'information. Les opportunités affichées peuvent être inexactes, expirées, ou impossibles à exécuter pour des raisons indépendantes de notre volonté (frais de transfert, liquidité insuffisante, changement de prix entre l'affichage et l'exécution).",
          "Vous reconnaissez que le trading de crypto-monnaies comporte un risque de perte en capital. ArbiTech ne saurait être tenu responsable des pertes financières résultant de l'utilisation du service. Vous êtes seul responsable de vos décisions de trading.",
        ],
      },
      {
        h2: "7. Propriété intellectuelle",
        paragraphs: [
          "ArbiTech, son logo, son design, son code source et ses contenus sont la propriété exclusive d'ArbiTech. Toute reproduction, copie ou exploitation sans autorisation écrite est interdite.",
          "Les marques Binance, Bybit, OKX et KuCoin appartiennent à leurs propriétaires respectifs. ArbiTech n'est affilié à aucune de ces plateformes.",
        ],
      },
      {
        h2: "8. Modification des conditions",
        paragraphs: [
          "ArbiTech peut modifier les présentes conditions à tout moment. Les utilisateurs seront informés par email et/ou notification in-app au moins 30 jours avant l'entrée en vigueur des modifications substantielles. La date de dernière mise à jour est indiquée en haut de cette page.",
        ],
      },
      {
        h2: "9. Contact",
        paragraphs: [
          "Pour toute question relative aux présentes conditions, contactez-nous à l'adresse : legal@arbitech.app ou via la page Support.",
        ],
      },
    ],
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    description:
      "Comment nous traitons vos données personnelles. En transparence, parce que votre confiance compte.",
    lastUpdated: "20 juin 2025",
    sections: [
      {
        h2: "1. Données que nous collectons",
        paragraphs: [
          "Lors de votre inscription, nous collectons : votre nom, votre adresse email, et optionnellement votre numéro de téléphone (pour les notifications WhatsApp).",
          "Lors de votre utilisation : nous enregistrons les opportunités que vous consultez, vos préférences de notification, et vos transactions d'abonnement. Nous ne collectons pas d'informations de navigation tierces.",
        ],
      },
      {
        h2: "2. Utilisation de vos données",
        paragraphs: [
          "Vos données servent à : (1) faire fonctionner votre compte, (2) afficher les opportunités pertinentes, (3) vous envoyer des notifications (si vous l'avez activé), (4) gérer votre abonnement et vos commissions ambassadeur, (5) améliorer le service.",
          "Nous n'utilisons JAMAIS vos données pour vous vendre des services tiers, et nous ne vendons JAMAIS vos données à qui que ce soit.",
        ],
      },
      {
        h2: "3. Sécurité",
        paragraphs: [
          "Vos mots de passe sont chiffrés (hash scrypt) : même notre équipe ne peut pas les lire. Vos sessions sont protégées par des tokens uniques. Toutes les communications sont chiffrées en HTTPS.",
          "En cas de faille de sécurité affectant vos données, nous nous engageons à vous informer dans les 72 heures et à prendre les mesures correctives nécessaires.",
        ],
      },
      {
        h2: "4. Cookies",
        paragraphs: [
          "ArbiTech utilise un cookie de session (pour vous garder connecté) et des préférences stockées localement sur votre appareil (thème, filtres, préférences de notification). Nous n'utilisons pas de cookies publicitaires ni de tracking tiers.",
          "Vous pouvez à tout moment effacer ces données via les réglages de votre navigateur.",
        ],
      },
      {
        h2: "5. Partage avec des tiers",
        paragraphs: [
          "Nous ne partageons vos données avec AUCUN tiers, à l'exception : (1) de notre prestataire de paiement (Stripe, en production) qui traite les transactions de manière chiffrée, (2) des autorités légales si la loi nous y oblige (réquisition judiciaire).",
          "Les plateformes Binance, Bybit, OKX, KuCoin n'ont pas accès à vos données ArbiTech. ArbiTech n'a pas accès à vos données sur ces plateformes.",
        ],
      },
      {
        h2: "6. Vos droits",
        paragraphs: [
          "Conformément au RGPD et à la loi camerounaise de protection des données, vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.",
          "Pour exercer ces droits, écrivez à privacy@arbitech.app. Nous répondons sous 30 jours maximum.",
          "Vous pouvez supprimer votre compte à tout moment depuis la page Mon compte. La suppression entraîne l'effacement de toutes vos données personnelles dans un délai de 90 jours (sauf obligations légales de conservation).",
        ],
      },
      {
        h2: "7. Conservation des données",
        paragraphs: [
          "Vos données sont conservées aussi longtemps que votre compte est actif. Après suppression, elles sont effacées dans un délai de 90 jours, à l'exception des données nécessaires à la conformité fiscale (conservées 10 ans).",
        ],
      },
      {
        h2: "8. Mineurs",
        paragraphs: [
          "ArbiTech est réservé aux personnes majeures (18 ans et plus). Tout inscription d'un mineur est interdite et sera annulée sans préavis.",
        ],
      },
    ],
  },
  {
    slug: "avertissement",
    title: "Avertissement sur les risques",
    description:
      "Le trading de crypto-monnaies comporte des risques. Lisez ceci attentivement avant de commencer.",
    lastUpdated: "20 juin 2025",
    sections: [
      {
        h2: "Risque de perte en capital",
        paragraphs: [
          "Le trading de crypto-monnaies comporte un risque de perte en capital. Vous pouvez perdre tout ou partie de votre investissement. Ne mettez jamais en jeu un argent dont vous avez besoin pour vivre (loyer, nourriture, santé).",
          "ArbiTech est un outil d'information. Il ne garantit aucun profit. Les opportunités affichées peuvent ne pas être exécutables (prix qui change, frais cachés, liquidité insuffisante).",
        ],
      },
      {
        h2: "Risques spécifiques à l'arbitrage",
        paragraphs: [
          "Frais de transfert : déplacer une crypto entre plateformes coûte des frais réseau. Un arbitrage rentable sur le papier peut devenir perdant une fois les frais déduits. Vérifiez toujours les frais avant de valider.",
          "Prix qui change : entre le moment où vous voyez une opportunité sur ArbiTech et celui où vous l'exécutez, le prix peut avoir changé. Agissez vite, mais vérifiez toujours le prix réel sur la plateforme.",
          "Liquidité : un écart de prix affiché n'est exécutable que s'il y a assez de volume disponible. Sur les petites paires, le volume peut être insuffisant.",
          "Frais de conversion FCFA : sur le P2P, certains moyens de paiement imposent des frais. Lisez toujours les conditions de l'annonce.",
        ],
      },
      {
        h2: "Risques liés aux plateformes",
        paragraphs: [
          "Binance, Bybit, OKX, KuCoin sont des plateformes indépendantes d'ArbiTech. Elles peuvent à tout moment : suspendre votre compte, bloquer un retrait, modifier leurs conditions, faire faillite. ArbiTech n'a aucun contrôle sur ces plateformes.",
          "Ne laissez jamais tout votre capital sur une seule plateforme. Diversifiez. Et n'oubliez pas : « Not your keys, not your coins ». Pour les montants importants, envisagez un portefeuille personnel (Trust Wallet, Ledger).",
        ],
      },
      {
        h2: "Risques de sécurité",
        paragraphs: [
          "Activez toujours l'authentification à deux facteurs (2FA) sur vos comptes de plateforme. Ne partagez jamais vos mots de passe. Méfiez-vous du phishing : ArbiTech ne vous demandera JAMAIS votre mot de passe Binance ou autre.",
          "Sur le P2P, méfiez-vous des arnaques au « faux reçu de paiement ». Respectez le système d'escrow (séquestre) de la plateforme : ne libérez jamais les fonds tant que vous n'avez pas reçu le paiement sur votre compte Mobile Money.",
        ],
      },
      {
        h2: "Pas de conseil financier",
        paragraphs: [
          "ArbiTech fournit de l'information, pas des conseils financiers personnalisés. Rien dans ArbiTech (opportunités, blog, outils) ne constitue une recommandation d'investissement.",
          "Si vous hésitez, consultez un conseiller financier indépendant. Votre situation financière vous est propre.",
        ],
      },
      {
        h2: "Réglementation",
        paragraphs: [
          "La réglementation des crypto-monnaies varie selon les pays. Renseignez-vous sur la législation applicable dans votre pays (Cameroun, Côte d'Ivoire, Sénégal, Mali, etc.). Dans certains pays, la détention ou le trading de crypto-monnaies peut être restreint ou interdit.",
          "C'est à vous de respecter la fiscalité applicable à vos gains (déclaration, impôts). ArbiTech ne fournit pas de conseil fiscal.",
        ],
      },
      {
        h2: "En résumé",
        paragraphs: [
          "L'arbitrage crypto peut être rentable, mais ce n'est pas de l'argent facile. Soyez prudent, commencez petit, et n'investissez que ce que vous pouvez vous permettre de perdre.",
        ],
      },
    ],
  },
  {
    slug: "support",
    title: "Support & Aide",
    description:
      "Besoin d'aide ? Voici comment nous contacter et trouver des réponses à vos questions.",
    lastUpdated: "20 juin 2025",
    sections: [
      {
        h2: "Avant de contacter le support",
        paragraphs: [
          "80 % des questions que nous recevons trouvent leur réponse dans notre FAQ (page d'accueil) ou dans notre Blog. Prenez 2 minutes pour y chercher avant de nous écrire : vous gagnerez du temps.",
        ],
      },
      {
        h2: "Nous contacter",
        paragraphs: [
          "Email : support@arbitech.app — Réponse sous 24h en semaine, 48h le week-end.",
          "WhatsApp (plan Pro) : un numéro direct vous est communiqué après votre inscription au plan Pro.",
          "WhatsApp VIP (plan Institutionnel) : votre manager de compte personnel vous contacte dans les 2h suivant votre inscription.",
        ],
      },
      {
        h2: "Questions fréquentes",
        paragraphs: [
          "« Je ne reçois pas de notifications push » → Vérifiez que vous avez activé les notifications dans votre navigateur (Paramètres du site → Notifications → Autoriser). Sur mobile, installez l'app PWA pour bénéficier des notifications.",
          "« Les opportunités sont en retard » → C'est normal au plan Découverte (5 min de retard). Passez au plan Pro pour le temps réel.",
          "« Mon code de parrainage ne fonctionne pas » → Les codes sont uniques et sensibles à la casse. Vérifiez que votre ami a bien copié le lien complet.",
          "« Comment annuler mon abonnement ? » → Rendez-vous sur la page Mon compte → Mon abonnement → Annuler. L'abonnement reste actif jusqu'à la fin de la période payée.",
        ],
      },
      {
        h2: "Signaler un bug",
        paragraphs: [
          "Vous avez repéré un bug ? Écrivez à bugs@arbitech.app en décrivant : ce que vous faisiez, ce que vous attendiez, ce qui s'est passé, et idéalement une capture d'écran. Nous corrigeons les bugs critiques sous 48h.",
        ],
      },
      {
        h2: "Disponibilité du service",
        paragraphs: [
          "ArbiTech vise une disponibilité de 99,9 %. Les rares interruptions (maintenance, mise à jour) sont planifiées et annoncées 48h à l'avance. En cas de panne, consultez notre page Twitter @arbitech pour le statut en temps réel.",
        ],
      },
      {
        h2: "Support ambassadeur",
        paragraphs: [
          "Si vous êtes ambassadeur et avez une question sur vos commissions ou paiements, écrivez à ambassadors@arbitech.app. Nous traitons les demandes de paiement sous 48h.",
        ],
      },
    ],
  },
];

export function getLegalDocument(slug: string) {
  return LEGAL_DOCUMENTS.find((d) => d.slug === slug);
}
