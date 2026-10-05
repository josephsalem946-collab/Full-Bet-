export interface GaminghubFaqQuestion {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  symbol: string;
  action_link?: string;
  action_label?: string;
}

export interface GaminghubFaqCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: GaminghubFaqQuestion[];
}

export interface GaminghubPlatformConfig {
  name: string;
  slug: string;
  version: string;
  default_currency: string;
  supported_currencies: string[];
  last_updated: string;
  contact: {
    support_whatsapp: string;
    support_email: string;
    support_hours: string;
  };
}

export const GAMINGHUB_PLATFORM_CONFIG: GaminghubPlatformConfig = {
  name: "Gaminghub Haïti",
  slug: "gaminghub-haiti",
  version: "2.0.0",
  default_currency: "HTG",
  supported_currencies: ["HTG", "USD"],
  last_updated: "2026-09-29",
  contact: {
    support_whatsapp: "+509 0000-0000",
    support_email: "support@gaminghubhaiti.com",
    support_hours: "Lendi rive Dimanch, 8:00 AM - 10:00 PM"
  }
};

export const GAMINGHUB_FAQ_CATEGORIES_HT: GaminghubFaqCategory[] = [
  {
    id: "solde-solide",
    title: "Solde Solide (Gaminghub Haïti)",
    icon: "wallet",
    description: "Tout enfòmasyon sou bous dijital ak balans Solde Solide ou sou Gaminghub Haïti.",
    questions: [
      {
        id: "ss-01",
        question: "Kisa ki 'Solde Solide' nan Gaminghub Haïti a?",
        answer: "Solde Solide se bous elektwonik sekirize Gaminghub Haïti kote kòb ou rete an depo pou fè tout acha ak rechaj gaming ou yo byen vit san ou pa bezwen peye frè siplemantè chak fwa.",
        tags: ["solde", "solide", "bous", "kont", "balans"],
        symbol: "💰",
        action_link: "/wallet",
        action_label: "Wè Solde Solide"
      },
      {
        id: "ss-02",
        question: "Kijan mwen ka tcheke balans Solde Solide mwen?",
        answer: "Konekte sou kont Gaminghub Haïti ou, ale nan seksyon 'Solde Solide'. Balans disponib ou, bonis yo, ak tout tranzaksyon resan yo ap parèt nan seksyon an tèt la.",
        tags: ["balans", "verifye", "tcheke", "kont"],
        symbol: "🔍",
        action_link: "/wallet",
        action_label: "Tcheke Balans"
      },
      {
        id: "ss-03",
        question: "Kouman pou m fè glise eleman yo pou m wè tout detay Solde Solide la?",
        answer: "Sou telefòn, ou ka jis glise ak dwèt ou (swipe) agoch oswa adwat sou kat balans lan. Sou òdinatè, klike ak sourit la epi trennen (drag-and-drop) pou fè defile tout seksyon yo tankou Solde Prensipal, Bonis, Pwen ak Dènye Rechaj.",
        tags: ["glise", "swipe", "drag", "eleman", "aksesible"],
        symbol: "👉",
        action_link: "/wallet",
        action_label: "Glise Kat yo"
      },
      {
        id: "ss-04",
        question: "Èske lajan ki nan Solde Solide la gen yon dat limit pou l ekspire?",
        answer: "Non, lajan ou mete nan Solde Solide ou pa janm ekspire. Li rete disponib toutotan kont ou aktif pou nenpòt acha nan Gaminghub Haïti.",
        tags: ["ekspirasyon", "validite", "sekirite"],
        symbol: "⏳"
      },
      {
        id: "ss-05",
        question: "Èske mwen ka transfere Solde Solide bay yon lòt jwè?",
        answer: "Wi, ou ka transfere yon pati nan solde ou bay yon lòt itilizatè Gaminghub Haïti gras ak ID Gaminghub oswa nimewo telefòn li, depi kont ou verifye.",
        tags: ["transfè", "pataje", "jwè", "itilizatè"],
        symbol: "🔄",
        action_link: "/wallet/transfer",
        action_label: "Transfere Kòb"
      }
    ]
  },
  {
    id: "depo-rechaj",
    title: "Depo ak Rechaj",
    icon: "credit-card",
    description: "Fason pou mete lajan sou kont ou ak tout metòd peman ki disponib an Ayiti.",
    questions: [
      {
        id: "dr-01",
        question: "Ki metòd peman mwen ka itilize pou rechaje Solde Solide mwen?",
        answer: "Nou aksepte MonCash, Natcash, viman labank (Sogebank, Unibank, BNC), ansanm ak kat debi/kredi entènasyonal (Visa, Mastercard) ak kèk kriptomonnen sipòte.",
        tags: ["moncash", "natcash", "labank", "rechaj", "depo"],
        symbol: "💳",
        action_link: "/wallet/deposit",
        action_label: "Fè yon Depo"
      },
      {
        id: "dr-02",
        question: "Konbyen tan sa pran pou rechaj la parèt nan Solde Solide mwen?",
        answer: "Rechaj pa MonCash ak Natcash otomatik yo fèt nan mwens pase 1 a 3 minit. Pou transfè labank manyèl, li ka pran ant 10 a 30 minit apre verifikasyon resi a pa ekip sipò a.",
        tags: ["delè", "tan", "vitès", "validasyon"],
        symbol: "⚡"
      },
      {
        id: "dr-03",
        question: "Ki kantite minimòm mwen ka depoze sou kont mwen?",
        answer: "Depo minimòm lan se 250 HTG pou MonCash ak Natcash, epi 1,000 HTG pou viman labank dirèk.",
        tags: ["limit", "minimòm", "kantite"],
        symbol: "📊"
      },
      {
        id: "dr-04",
        question: "Kisa pou m fè si m fè yon depo epi li pa parèt sou kont mwen?",
        answer: "Pa panike. Kenbe prèv peman an (SMS konfimasyon oswa nimewo tranzaksyon / ID Tranzaksyon an) epi voye l bay sipò WhatsApp nou an dirèkteman pou nou ka regle sa touswit.",
        tags: ["pwoblèm", "depo manke", "sipò", "id tranzaksyon"],
        symbol: "⚠️",
        action_link: "https://wa.me/50900000000",
        action_label: "Sipò WhatsApp"
      }
    ]
  },
  {
    id: "acha-gaming",
    title: "Acha Jwèt ak Sèvis Gaming",
    icon: "gamepad-2",
    description: "Enfòmasyon sou fason pou achte Diamonds, Pass, Kat Kado ak Kredi jwèt.",
    questions: [
      {
        id: "ag-01",
        question: "Ki jwèt mwen ka rechaje sou Gaminghub Haïti?",
        answer: "Ou ka rechaje Diamonds Free Fire, PUBG Mobile UC, Call of Duty Mobile CP, Roblox Robux, Brawl Stars, Genshin Impact, ak kat kado pou PlayStation (PSN), Xbox, Steam, Nintendo e Google Play.",
        tags: ["free fire", "pubg", "cod mobile", "robux", "playstation", "steam"],
        symbol: "🎮",
        action_link: "/casino",
        action_label: "Boutik Gaming"
      },
      {
        id: "ag-02",
        question: "Èske mwen bezwen bay modpas kont jwèt mwen pou m resevwa yon rechaj?",
        answer: "Non, jamè! Pou pifò jwèt (tankou Free Fire oswa PUBG), nou sèlman bezwen Player ID (UID) ak non karaktè ou sèlman. Pa janm bay modpas ou bay pèsonn.",
        tags: ["sekirite", "modpas", "player id", "uid"],
        symbol: "🛡️"
      },
      {
        id: "ag-03",
        question: "Kouman livrezon kòd kat kado yo fèt?",
        answer: "Kòd kat kado dijital yo (Steam, PSN, Xbox, elatriye) parèt touswit sou ekran ou apre acha a, epi yo voye yon kopi pa imèl ak sou kont Gaminghub ou nan seksyon 'Istorik Kòmand'.",
        tags: ["kòd", "kat kado", "livrezon", "enstantane"],
        symbol: "🎟️",
        action_link: "/my-bets",
        action_label: "Istorik Kòmand"
      }
    ]
  },
  {
    id: "retre-ranbousman",
    title: "Retrè ak Ranbousman",
    icon: "arrow-left-right",
    description: "Kondisyon pou retire kòb oswa mande ranbousman si gen erè.",
    questions: [
      {
        id: "rr-01",
        question: "Èske mwen ka retire lajan ki nan Solde Solide mwen sou MonCash oswa Natcash?",
        answer: "Wi, ou ka fè yon demann retrè depi kont ou byen verifye. Y ap voye kòb la dirèkteman sou kont MonCash oswa Natcash ou nan yon delè 1 a 24 èdtan travayab.",
        tags: ["retrè", "cashout", "moncash", "natcash"],
        symbol: "💸",
        action_link: "/wallet/withdraw",
        action_label: "Mande yon Retrè"
      },
      {
        id: "rr-02",
        question: "Ki politik ranbousman Gaminghub Haïti genyen?",
        answer: "Si yon tranzaksyon echwe oswa si yon sèvis pa te livre akoz yon pwoblèm teknik nan sistèm nou an, n ap ranbouse lajan an 100% sou Solde Solide ou touswit apre verifikasyon an.",
        tags: ["ranbousman", "erè", "garanti"],
        symbol: "🛡️"
      }
    ]
  },
  {
    id: "kont-sekirite",
    title: "Kont ak Sekirite",
    icon: "shield-check",
    description: "Jere enfòmasyon pèsonèl ou ak pwoteksyon kont ou.",
    questions: [
      {
        id: "ks-01",
        question: "Kouman pou m pwoteje kont Gaminghub Haïti mwen?",
        answer: "Chwazi yon modpas solid, aktive otantifikasyon a de faktè (2FA) si li disponib, epi pa janm pataje kòd konfimasyon ou resevwa pa SMS oswa imèl ak pèsonn.",
        tags: ["sekirite", "modpas", "2fa", "kont"],
        symbol: "🔒",
        action_link: "/profile/security",
        action_label: "Sekirite Kont"
      },
      {
        id: "ks-02",
        question: "Kisa pou m fè si mwen bliye modpas mwen?",
        answer: "Klike sou lyen 'Modpas Bliye' sou paj koneksyon an, mete imèl ou oswa nimewo telefòn ou, epi n ap voye yon lyen sekirize pou w ka chwazi yon nouvo modpas.",
        tags: ["modpas bliye", "rekipere kont", "login"],
        symbol: "🔑",
        action_link: "/auth/forgot-password",
        action_label: "Reyajiste Modpas"
      }
    ]
  },
  {
    id: "sipo-kontak",
    title: "Sipò ak Asistans Kliyan",
    icon: "headphones",
    description: "Kijan pou kontakte ekip Gaminghub Haïti a lè ou bezwen èd.",
    questions: [
      {
        id: "sk-01",
        question: "Kouman pou mwen kontakte sipò Gaminghub Haïti?",
        answer: "Ou ka kontakte nou dirèkteman sou WhatsApp ofisyèl nou an (+509 0000-0000), pa chat an dirèk sou sitwèb la, oswa voye yon imèl bay support@gaminghubhaiti.com.",
        tags: ["sipò", "whatsapp", "kontak", "èd"],
        symbol: "💬",
        action_link: "mailto:support@gaminghubhaiti.com",
        action_label: "Voye Imèl"
      },
      {
        id: "sk-02",
        question: "Ki orè ekip sipò a disponib?",
        answer: "Ekip sipò nou an disponib 7 jou sou 7, soti 8:00 AM rive 10:00 PM (Lè Ayiti) pou reponn tout kesyon ou yo byen vit.",
        tags: ["orè", "disponibilite", "tan travay"],
        symbol: "⏰"
      }
    ]
  }
];

export const GAMINGHUB_FAQ_CATEGORIES_FR: GaminghubFaqCategory[] = [
  {
    id: "solde-solide",
    title: "Solde Solide (Gaminghub Haïti)",
    icon: "wallet",
    description: "Toutes les informations sur le portefeuille numérique et votre solde Solide.",
    questions: [
      {
        id: "ss-01-fr",
        question: "Qu'est-ce que le 'Solde Solide' sur Gaminghub Haïti ?",
        answer: "Le Solde Solide est le portefeuille numérique sécurisé de Gaminghub Haïti où vos fonds sont conservés pour effectuer tous vos achats et recharges gaming instantanément sans frais supplémentaires à chaque fois.",
        tags: ["solde", "solide", "portefeuille", "compte"],
        symbol: "💰",
        action_link: "/wallet",
        action_label: "Voir Solde Solide"
      },
      {
        id: "ss-02-fr",
        question: "Comment consulter mon solde Solide ?",
        answer: "Connectez-vous à votre compte Gaminghub Haïti, rendez-vous dans la section 'Solde Solide'. Votre solde disponible, vos bonus et les transactions récentes s'affichent en haut de la page.",
        tags: ["solde", "consulter", "vérifier"],
        symbol: "🔍",
        action_link: "/wallet",
        action_label: "Consulter Solde"
      },
      {
        id: "ss-03-fr",
        question: "Comment faire glisser les éléments pour voir tous les détails du Solde Solide ?",
        answer: "Sur mobile, glissez simplement avec votre doigt (swipe) vers la gauche ou la droite sur la carte de solde. Sur ordinateur, cliquez et faites glisser (drag-and-drop) pour faire défiler toutes les sections : Solde Principal, Bonus, Points VIP et Dernières Recharges.",
        tags: ["glisser", "swipe", "drag", "cartes"],
        symbol: "👉",
        action_link: "/wallet",
        action_label: "Faire Glisser les Cartes"
      },
      {
        id: "ss-04-fr",
        question: "Les fonds de mon Solde Solide ont-ils une date d'expiration ?",
        answer: "Non, les fonds déposés sur votre Solde Solide n'expirent jamais. Ils restent disponibles tant que votre compte est actif pour tout achat sur Gaminghub Haïti.",
        tags: ["expiration", "validité", "sécurité"],
        symbol: "⏳"
      },
      {
        id: "ss-05-fr",
        question: "Puis-je transférer du Solde Solide à un autre joueur ?",
        answer: "Oui, vous pouvez transférer une partie de votre solde à un autre utilisateur Gaminghub Haïti grâce à son ID ou son numéro de téléphone, sous réserve que votre compte soit vérifié.",
        tags: ["transfert", "partage", "joueur"],
        symbol: "🔄",
        action_link: "/wallet/transfer",
        action_label: "Transférer des Fonds"
      }
    ]
  },
  {
    id: "depo-rechaj",
    title: "Dépôts et Recharges",
    icon: "credit-card",
    description: "Méthodes pour approvisionner votre compte avec tous les moyens de paiement en Haïti.",
    questions: [
      {
        id: "dr-01-fr",
        question: "Quels moyens de paiement puis-je utiliser pour recharger mon Solde Solide ?",
        answer: "Nous acceptons MonCash, Natcash, les virements bancaires (Sogebank, Unibank, BNC), ainsi que les cartes bancaires internationales (Visa, Mastercard) et certaines cryptomonnaies.",
        tags: ["moncash", "natcash", "banque", "recharge", "dépôt"],
        symbol: "💳",
        action_link: "/wallet/deposit",
        action_label: "Faire un Dépôt"
      },
      {
        id: "dr-02-fr",
        question: "Combien de temps faut-il pour qu'une recharge apparaisse sur mon Solde Solide ?",
        answer: "Les recharges automatiques MonCash et Natcash sont créditées en 1 à 3 minutes. Pour les virements bancaires manuels, comptez 10 à 30 minutes après vérification du reçu par notre support.",
        tags: ["délai", "rapidité", "validation"],
        symbol: "⚡"
      },
      {
        id: "dr-03-fr",
        question: "Quel est le montant minimum de dépôt ?",
        answer: "Le dépôt minimum est de 250 HTG via MonCash et Natcash, et de 1 000 HTG pour les virements bancaires directs.",
        tags: ["minimum", "limite", "montant"],
        symbol: "📊"
      },
      {
        id: "dr-04-fr",
        question: "Que faire si mon dépôt n'apparaît pas sur mon compte ?",
        answer: "Pas d'inquiétude. Conservez votre preuve de paiement (SMS de confirmation ou identifiant de transaction) et transmettez-la directement à notre support WhatsApp pour une régularisation immédiate.",
        tags: ["problème", "support", "réclamation"],
        symbol: "⚠️",
        action_link: "https://wa.me/50900000000",
        action_label: "Support WhatsApp"
      }
    ]
  },
  {
    id: "acha-gaming",
    title: "Achats Gaming & Services",
    icon: "gamepad-2",
    description: "Achat de Diamants, Passes de combat, Cartes Cadeaux et Crédits de jeux.",
    questions: [
      {
        id: "ag-01-fr",
        question: "Quels jeux puis-je recharger sur Gaminghub Haïti ?",
        answer: "Vous pouvez recharger des diamants Free Fire, PUBG Mobile UC, Call of Duty Mobile CP, Roblox Robux, Brawl Stars, Genshin Impact, ainsi que des cartes cadeaux PlayStation (PSN), Xbox, Steam, Nintendo et Google Play.",
        tags: ["free fire", "pubg", "cod mobile", "robux", "playstation", "steam"],
        symbol: "🎮",
        action_link: "/casino",
        action_label: "Boutique Gaming"
      },
      {
        id: "ag-02-fr",
        question: "Dois-je communiquer le mot de passe de mon compte de jeu ?",
        answer: "Non, jamais ! Pour la majorité des jeux (comme Free Fire ou PUBG), nous avons seulement besoin de votre Player ID (UID) et pseudo. Ne donnez jamais votre mot de passe à qui que ce soit.",
        tags: ["sécurité", "mot de passe", "player id", "uid"],
        symbol: "🛡️"
      },
      {
        id: "ag-03-fr",
        question: "Comment s'effectue la livraison des codes de cartes cadeaux ?",
        answer: "Les codes numériques (Steam, PSN, Xbox, etc.) s'affichent instantanément à l'écran après paiement, et une copie est expédiée par email ainsi que dans votre espace 'Historique Commandes'.",
        tags: ["code", "carte cadeau", "livraison"],
        symbol: "🎟️",
        action_link: "/my-bets",
        action_label: "Historique Commandes"
      }
    ]
  },
  {
    id: "retre-ranbousman",
    title: "Retraits et Remboursements",
    icon: "arrow-left-right",
    description: "Conditions de retrait de gains et politique de remboursement.",
    questions: [
      {
        id: "rr-01-fr",
        question: "Puis-je retirer des fonds de mon Solde Solide vers MonCash ou Natcash ?",
        answer: "Oui, vous pouvez formuler une demande de retrait dès que votre compte est vérifié. Les fonds sont virés directement sur votre MonCash ou Natcash dans un délai ouvré de 1 à 24 heures.",
        tags: ["retrait", "moncash", "natcash"],
        symbol: "💸",
        action_link: "/wallet/withdraw",
        action_label: "Demander un Retrait"
      },
      {
        id: "rr-02-fr",
        question: "Quelle est la politique de remboursement de Gaminghub Haïti ?",
        answer: "Si une transaction échoue ou si un service ne peut être délivré en raison d'un problème technique, nous remboursons 100% de la somme sur votre Solde Solide immédiatement après vérification.",
        tags: ["remboursement", "garantie"],
        symbol: "🛡️"
      }
    ]
  },
  {
    id: "kont-sekirite",
    title: "Compte et Sécurité",
    icon: "shield-check",
    description: "Gestion des données personnelles et sécurisation de votre compte.",
    questions: [
      {
        id: "ks-01-fr",
        question: "Comment sécuriser mon compte Gaminghub Haïti ?",
        answer: "Choisissez un mot de passe robuste, activez l'authentification à deux facteurs (2FA) si disponible, et ne partagez jamais vos codes de validation reçus par SMS ou email.",
        tags: ["sécurité", "mot de passe", "2fa"],
        symbol: "🔒",
        action_link: "/profile/security",
        action_label: "Sécurité du Compte"
      },
      {
        id: "ks-02-fr",
        question: "Que faire en cas d'oubli de mot de passe ?",
        answer: "Cliquez sur 'Mot de passe oublié' sur la page de connexion, renseignez votre email ou numéro de téléphone, et vous recevrez un lien sécurisé pour définir un nouveau mot de passe.",
        tags: ["mot de passe oublié", "récupération"],
        symbol: "🔑",
        action_link: "/auth/forgot-password",
        action_label: "Réinitialiser"
      }
    ]
  },
  {
    id: "sipo-kontak",
    title: "Support et Assistance Client",
    icon: "headphones",
    description: "Comment joindre l'équipe d'assistance Gaminghub Haïti.",
    questions: [
      {
        id: "sk-01-fr",
        question: "Comment contacter le support client Gaminghub Haïti ?",
        answer: "Vous pouvez nous joindre directement sur WhatsApp officiel (+509 0000-0000), par chat en direct sur le site, ou par courriel à support@gaminghubhaiti.com.",
        tags: ["support", "whatsapp", "assistance"],
        symbol: "💬",
        action_link: "mailto:support@gaminghubhaiti.com",
        action_label: "Envoyer un Email"
      },
      {
        id: "sk-02-fr",
        question: "Quels sont les horaires de disponibilité du support ?",
        answer: "Notre équipe d'assistance est joignable 7 jours sur 7, de 8h00 à 22h00 (Heure d'Haïti) pour vous répondre dans les plus brefs délais.",
        tags: ["horaires", "disponibilité"],
        symbol: "⏰"
      }
    ]
  }
];
