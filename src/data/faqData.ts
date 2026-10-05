import {
  GAMINGHUB_FAQ_CATEGORIES_HT,
  GAMINGHUB_FAQ_CATEGORIES_FR,
  GAMINGHUB_PLATFORM_CONFIG
} from './gaminghubFaqData';

export interface FAQItem {
  id: string;
  question?: string;
  answer?: string;
  q: string; // for backward compatibility
  a: string; // for backward compatibility
  keywords?: string[];
  tags?: string[];
  symbol?: string;
  action_link?: string;
  action_label?: string;
}

export interface FAQCategory {
  id?: string;
  slug?: string;
  title?: string;
  icon?: string;
  description?: string;
  category: string;
  items: FAQItem[];
  faqs?: FAQItem[]; // alias
}

export interface FAQData {
  ht: FAQCategory[];
  fr: FAQCategory[];
}

export { GAMINGHUB_PLATFORM_CONFIG };

export const FULL_BET_FAQ_METADATA = {
  app_name: "Full Bet",
  version: "1.0.0",
  last_updated: "2025-02-18",
  default_language: "ht"
};

export const GAMINGHUB_FAQ_METADATA = {
  platform_name: "Gaminghub Haïti",
  version: "2.0.0",
  title: "Sant Èd ak Kesyon Moun Poze Souvan (FAQ)",
  description: "Tout repons sou fason pou w jwe, depoze, retire kòb epi tcheke fich ou sou Gaminghub Haïti."
};

// Helper mapper for Gaminghub categories
export const MAPPED_GAMINGHUB_HT: FAQCategory[] = GAMINGHUB_FAQ_CATEGORIES_HT.map(cat => ({
  id: cat.id,
  slug: cat.id,
  title: cat.title,
  category: cat.title,
  icon: cat.icon,
  description: cat.description,
  items: cat.questions.map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    q: q.question,
    a: q.answer,
    keywords: q.tags,
    tags: q.tags,
    symbol: q.symbol,
    action_link: q.action_link,
    action_label: q.action_label
  })),
  faqs: cat.questions.map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    q: q.question,
    a: q.answer,
    keywords: q.tags,
    tags: q.tags,
    symbol: q.symbol,
    action_link: q.action_link,
    action_label: q.action_label
  }))
}));

export const MAPPED_GAMINGHUB_FR: FAQCategory[] = GAMINGHUB_FAQ_CATEGORIES_FR.map(cat => ({
  id: cat.id,
  slug: cat.id,
  title: cat.title,
  category: cat.title,
  icon: cat.icon,
  description: cat.description,
  items: cat.questions.map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    q: q.question,
    a: q.answer,
    keywords: q.tags,
    tags: q.tags,
    symbol: q.symbol,
    action_link: q.action_link,
    action_label: q.action_label
  })),
  faqs: cat.questions.map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    q: q.question,
    a: q.answer,
    keywords: q.tags,
    tags: q.tags,
    symbol: q.symbol,
    action_link: q.action_link,
    action_label: q.action_label
  }))
}));

// ==============================================================
// GAMINGHUB v2.1.0 OFFICIAL SECTIONS (HT & FR)
// ==============================================================
const CAT_GH_BOUS_HT: FAQCategory = {
  id: "bous_ak_depo",
  slug: "bous-depo-retre",
  title: "Bous, Depo ak Retrè Kòb",
  category: "Bous, Depo ak Retrè Kòb",
  icon: "wallet",
  items: [
    {
      id: "q1",
      question: "Kouman mwen ka depoze kòb sou kont GamingHub mwen an?",
      answer: "Ou ka klike sou bouton vèt 'Depoze' a anlè a dwat. Chwazi metòd peman ou prefere a (Moncash online oswa Natcash online), antre montan an, epi swiv enstriksyon sou ekran an pou konfime tranzaksyon an.",
      q: "Kouman mwen ka depoze kòb sou kont GamingHub mwen an?",
      a: "Ou ka klike sou bouton vèt 'Depoze' a anlè a dwat. Chwazi metòd peman ou prefere a (Moncash online oswa Natcash online), antre montan an, epi swiv enstriksyon sou ekran an pou konfime tranzaksyon an.",
      keywords: ["depo", "moncash online", "natcash online", "kòb", "recharge"],
      action_link: "/wallet/deposit",
      action_label: "Fè Yon Depo"
    },
    {
      id: "q2",
      question: "Poukisa balans mwen an parèt sou fòm pwen (••••••••)?",
      answer: "Pou sekirite ak konfidansyalite w, ou ka kache balans ou lè w klike sou ti ikòn je a ki akote montan an. Klike sou li ankò nenpòt lè pou remèt li vizib.",
      q: "Poukisa balans mwen an parèt sou fòm pwen (••••••••)?",
      a: "Pou sekirite ak konfidansyalite w, ou ka kache balans ou lè w klike sou ti ikòn je a ki akote montan an. Klike sou li ankò nenpòt lè pou remèt li vizib.",
      keywords: ["kache", "je", "balans", "konfidansyalite"]
    },
    {
      id: "q3",
      question: "Konbyen tan sa pran pou yon retrè rive sou kont mwen?",
      answer: "Retrè pa Moncash online ak Natcash online fèt an jeneral nan mwens pase 15 minit apre ekip la fin valide demann ou an.",
      q: "Konbyen tan sa pran pou yon retrè rive sou kont mwen?",
      a: "Retrè pa Moncash online ak Natcash online fèt an jeneral nan mwens pase 15 minit apre ekip la fin valide demann ou an.",
      keywords: ["retrè", "delè", "tan", "resevwa kòb"],
      action_link: "/wallet/withdraw",
      action_label: "Mande Yon Retrè"
    }
  ]
};
CAT_GH_BOUS_HT.faqs = CAT_GH_BOUS_HT.items;

const CAT_GH_BOLET_HT: FAQCategory = {
  id: "bolet_ak_fich",
  slug: "bolet-ak-fich",
  title: "Bòlèt, Loto ak Fich Aktif",
  category: "Bòlèt, Loto ak Fich Aktif",
  icon: "dices",
  items: [
    {
      id: "q4",
      question: "Kisa 'FICH AKTIF' vle di?",
      answer: "Yon fich aktif se yon tikè ou fèk jwe ki valide nan sistèm nan epi tiraj la oswa match la poko fini. Depi rezilta a soti, fich la ap pase nan seksyon 'Istorik Jwèt'.",
      q: "Kisa 'FICH AKTIF' vle di?",
      a: "Yon fich aktif se yon tikè ou fèk jwe ki valide nan sistèm nan epi tiraj la oswa match la poko fini. Depi rezilta a soti, fich la ap pase nan seksyon 'Istorik Jwèt'.",
      keywords: ["fich", "tikè", "aktif", "tiraj", "valide"],
      action_link: "/my-bets",
      action_label: "Wè Fich Yo"
    },
    {
      id: "q5",
      question: "Ki tiraj bòlèt ki disponib sou GamingHub?",
      answer: "Nou pran tiraj ofisyèl New York (Midi ak Aswè), Florida (Midi ak Aswè), ansanm ak Georgia. Ou ka jwe Bòlèt Senp, Maryaj, Loto 3, Loto 4 ak Loto 5.",
      q: "Ki tiraj bòlèt ki disponib sou GamingHub?",
      a: "Nou pran tiraj ofisyèl New York (Midi ak Aswè), Florida (Midi ak Aswè), ansanm ak Georgia. Ou ka jwe Bòlèt Senp, Maryaj, Loto 3, Loto 4 ak Loto 5.",
      keywords: ["new york", "florida", "georgia", "maryaj", "loto"],
      action_link: "/borlette",
      action_label: "Jwe Bòlèt"
    },
    {
      id: "q6",
      question: "Kijan m ka konnen si fich bòlèt mwen an genyen?",
      answer: "Sistèm nan kalkile genyen yo otomatikman le pli vit tiraj la fini. Kòb ou genyen an ap depoze dirèkteman sou balans GamingHub ou a.",
      q: "Kijan m ka konnen si fich bòlèt mwen an genyen?",
      a: "Sistèm nan kalkile genyen yo otomatikman le pli vit tiraj la fini. Kòb ou genyen an ap depoze dirèkteman sou balans GamingHub ou a.",
      keywords: ["genyen", "kalkil", "rezilta", "peye"]
    }
  ]
};
CAT_GH_BOLET_HT.faqs = CAT_GH_BOLET_HT.items;

const CAT_GH_SPORTS_HT: FAQCategory = {
  id: "paryaj_espotif",
  slug: "paryaj-espotif-hub",
  title: "Paryaj Espòtif (GamingHub)",
  category: "Paryaj Espòtif (GamingHub)",
  icon: "trophy",
  items: [
    {
      id: "q7",
      question: "Èske mwen ka parye sou match k ap jwe an dirèk (Live)?",
      answer: "Wi, nan kategori 'Paryaj Espòtif', klike sou 'Match an dirèk' pou w wè kòt yo k ap chanje selon evolisyon match la.",
      q: "Èske mwen ka parye sou match k ap jwe an dirèk (Live)?",
      a: "Wi, nan kategori 'Paryaj Espòtif', klike sou 'Match an dirèk' pou w wè kòt yo k ap chanje selon evolisyon match la.",
      keywords: ["espò", "live", "foutbòl", "match"],
      action_link: "/live",
      action_label: "Ale nan Direct"
    },
    {
      id: "q8",
      question: "Ki diferans ki genyen ant yon Paryaj Senp ak yon Konbine?",
      answer: "Yon Paryaj Senp gen yon sèl seleksyon. Yon Konbine pèmèt ou miltipliye plizyè kòt ansanm sou menm tikè a pou fè plis kòb, men fòk tout seleksyon yo bon.",
      q: "Ki diferans ki genyen ant yon Paryaj Senp ak yon Konbine?",
      a: "Yon Paryaj Senp gen yon sèl seleksyon. Yon Konbine pèmèt ou miltipliye plizyè kòt ansanm sou menm tikè a pou fè plis kòb, men fòk tout seleksyon yo bon.",
      keywords: ["senp", "konbine", "kòt", "miltipliye"],
      action_link: "/sports",
      action_label: "Parye Kounye a"
    }
  ]
};
CAT_GH_SPORTS_HT.faqs = CAT_GH_SPORTS_HT.items;

const CAT_GH_SECURITY_HT: FAQCategory = {
  id: "sekirite_ak_kont",
  slug: "sekirite-ak-firebase",
  title: "Sekirite ak Otantifikasyon Firebase",
  category: "Sekirite ak Otantifikasyon Firebase",
  icon: "shield-check",
  items: [
    {
      id: "q9",
      question: "Kisa ti boukliye vèt Firebase la vle di sou pwofil mwen an?",
      answer: "Li konfime ke sesyon ou an sekirize atravè Firebase Authentication ak yon nivo chifreman estanda mondyal pou pwoteje kont ak lajan ou.",
      q: "Kisa ti boukliye vèt Firebase la vle di sou pwofil mwen an?",
      a: "Li konfime ke sesyon ou an sekirize atravè Firebase Authentication ak yon nivo chifreman estanda mondyal pou pwoteje kont ak lajan ou.",
      keywords: ["firebase", "sekirite", "boukliye", "otantifikasyon"],
      action_link: "/profile/verify",
      action_label: "Verifye Kont"
    },
    {
      id: "q10",
      question: "Kisa pou m fè si mwen bliye modpas mwen?",
      answer: "Sou paj koneksyon an, klike sou 'Bliye modpas?'. W ap resevwa yon lyen re-inisyalizasyon oswa yon kòd sekirite pa SMS/Email.",
      q: "Kisa pou m fè si mwen bliye modpas mwen?",
      a: "Sou paj koneksyon an, klike sou 'Bliye modpas?'. W ap resevwa yon lyen re-inisyalizasyon oswa yon kòd sekirite pa SMS/Email.",
      keywords: ["modpas", "bliye", "rekipere", "sms"],
      action_link: "/auth/forgot-password",
      action_label: "Reyajiste Modpas"
    }
  ]
};
CAT_GH_SECURITY_HT.faqs = CAT_GH_SECURITY_HT.items;

// Versions Françaises GamingHub
const CAT_GH_BOUS_FR: FAQCategory = {
  id: "bous_ak_depo",
  slug: "bous-depo-retre",
  title: "Portefeuille, Dépôts et Retraits",
  category: "Portefeuille, Dépôts et Retraits",
  icon: "wallet",
  items: [
    {
      id: "q1-fr",
      question: "Comment déposer des fonds sur mon compte GamingHub ?",
      answer: "Cliquez sur le bouton vert 'Depoze' en haut à droite. Choisissez votre méthode préférée (Moncash online ou Natcash online), entrez le montant et suivez les instructions à l'écran.",
      q: "Comment déposer des fonds sur mon compte GamingHub ?",
      a: "Cliquez sur le bouton vert 'Depoze' en haut à droite. Choisissez votre méthode préférée (Moncash online ou Natcash online), entrez le montant et suivez les instructions à l'écran.",
      keywords: ["dépôt", "moncash online", "natcash online", "recharge"],
      action_link: "/wallet/deposit",
      action_label: "Faire un Dépôt"
    },
    {
      id: "q2-fr",
      question: "Pourquoi mon solde s'affiche-t-il sous forme masquée (••••••••) ?",
      answer: "Pour votre sécurité et confidentialité, vous pouvez masquer votre solde en cliquant sur l'icône de l'œil près du montant. Cliquez dessus à tout moment pour le rendre visible.",
      q: "Pourquoi mon solde s'affiche-t-il sous forme masquée (••••••••) ?",
      a: "Pour votre sécurité et confidentialité, vous pouvez masquer votre solde en cliquant sur l'icône de l'œil près du montant. Cliquez dessus à tout moment pour le rendre visible.",
      keywords: ["masqué", "œil", "solde", "confidentialité"]
    },
    {
      id: "q3-fr",
      question: "Combien de temps prend un retrait pour arriver sur mon compte ?",
      answer: "Les retraits par Moncash online et Natcash online sont généralement crédités en moins de 15 minutes après validation par notre équipe.",
      q: "Combien de temps prend un retrait pour arriver sur mon compte ?",
      a: "Les retraits par Moncash online et Natcash online sont généralement crédités en moins de 15 minutes après validation par notre équipe.",
      keywords: ["retrait", "délai", "temps"],
      action_link: "/wallet/withdraw",
      action_label: "Demander un Retrait"
    }
  ]
};
CAT_GH_BOUS_FR.faqs = CAT_GH_BOUS_FR.items;

const CAT_GH_BOLET_FR: FAQCategory = {
  id: "bolet_ak_fich",
  slug: "bolet-ak-fich",
  title: "Borlette, Loto et Fiches Actives",
  category: "Borlette, Loto et Fiches Actives",
  icon: "dices",
  items: [
    {
      id: "q4-fr",
      question: "Que signifie 'FICH AKTIF' (Tickets Actifs) ?",
      answer: "Une fiche active est un ticket validé dont le tirage ou la rencontre sportive est en cours. Une fois le résultat proclamé, la fiche bascule automatiquement dans l'Historique.",
      q: "Que signifie 'FICH AKTIF' (Tickets Actifs) ?",
      a: "Une fiche active est un ticket validé dont le tirage ou la rencontre sportive est en cours. Une fois le résultat proclamé, la fiche bascule automatiquement dans l'Historique.",
      keywords: ["fiche", "ticket", "actif", "tirage"],
      action_link: "/my-bets",
      action_label: "Voir Mes Fiches"
    },
    {
      id: "q5-fr",
      question: "Quels tirages de borlette sont disponibles sur GamingHub ?",
      answer: "Nous couvrons les tirages officiels New York (Midi et Soir), Florida (Midi et Soir), ainsi que Georgia. Formules : Borlette Simple, Mariage, Loto 3, 4 et 5 chiffres.",
      q: "Quels tirages de borlette sont disponibles sur GamingHub ?",
      a: "Nous couvrons les tirages officiels New York (Midi et Soir), Florida (Midi et Soir), ainsi que Georgia. Formules : Borlette Simple, Mariage, Loto 3, 4 et 5 chiffres.",
      keywords: ["new york", "florida", "georgia", "mariage", "loto"],
      action_link: "/borlette",
      action_label: "Jouer à la Borlette"
    },
    {
      id: "q6-fr",
      question: "Comment savoir si ma fiche de borlette a gagné ?",
      answer: "Le système calcule les gains automatiquement dès proclamation officielle du tirage. Les gains sont directement crédités sur votre solde GamingHub.",
      q: "Comment savoir si ma fiche de borlette a gagné ?",
      a: "Le système calcule les gains automatiquement dès proclamation officielle du tirage. Les gains sont directement crédités sur votre solde GamingHub.",
      keywords: ["gains", "calcul", "résultat", "paiement"]
    }
  ]
};
CAT_GH_BOLET_FR.faqs = CAT_GH_BOLET_FR.items;

const CAT_GH_SPORTS_FR: FAQCategory = {
  id: "paryaj_espotif",
  slug: "paryaj-espotif-hub",
  title: "Paris Sportifs (GamingHub)",
  category: "Paris Sportifs (GamingHub)",
  icon: "trophy",
  items: [
    {
      id: "q7-fr",
      question: "Puis-je parier sur des matchs en direct (Live) ?",
      answer: "Oui, dans l'onglet 'Paris Sportifs', cliquez sur 'Matchs en Direct' pour visualiser l'évolution dynamique des cotes selon le score du match.",
      q: "Puis-je parier sur des matchs en direct (Live) ?",
      a: "Oui, dans l'onglet 'Paris Sportifs', cliquez sur 'Matchs en Direct' pour visualiser l'évolution dynamique des cotes selon le score du match.",
      keywords: ["sport", "live", "football", "match"],
      action_link: "/live",
      action_label: "Aller au Direct"
    },
    {
      id: "q8-fr",
      question: "Quelle est la différence entre un Pari Simple et un Combiné ?",
      answer: "Un Pari Simple contient une unique sélection. Un Combiné regroupe plusieurs sélections dont les cotes sont multipliées pour maximiser le gain potentiel.",
      q: "Quelle est la différence entre un Pari Simple et un Combiné ?",
      a: "Un Pari Simple contient une unique sélection. Un Combiné regroupe plusieurs sélections dont les cotes sont multipliées pour maximiser le gain potentiel.",
      keywords: ["simple", "combiné", "cotes", "multiple"],
      action_link: "/sports",
      action_label: "Parier Maintenant"
    }
  ]
};
CAT_GH_SPORTS_FR.faqs = CAT_GH_SPORTS_FR.items;

const CAT_GH_SECURITY_FR: FAQCategory = {
  id: "sekirite_ak_kont",
  slug: "sekirite-ak-firebase",
  title: "Sécurité et Authentification Firebase",
  category: "Sécurité et Authentification Firebase",
  icon: "shield-check",
  items: [
    {
      id: "q9-fr",
      question: "Que signifie le petit bouclier vert Firebase sur mon profil ?",
      answer: "Il confirme que votre session est sécurisée via Firebase Authentication avec un chiffrement répondant aux plus hauts standards de sécurité mondiaux.",
      q: "Que signifie le petit bouclier vert Firebase sur mon profil ?",
      a: "Il confirme que votre session est sécurisée via Firebase Authentication avec un chiffrement répondant aux plus hauts standards de sécurité mondiaux.",
      keywords: ["firebase", "sécurité", "bouclier", "authentification"],
      action_link: "/profile/verify",
      action_label: "Vérifier Compte"
    },
    {
      id: "q10-fr",
      question: "Que faire si j'ai oublié mon mot de passe ?",
      answer: "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié'. Vous recevrez un lien de réinitialisation sécurisé par SMS ou email.",
      q: "Que faire si j'ai oublié mon mot de passe ?",
      a: "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié'. Vous recevrez un lien de réinitialisation sécurisé par SMS ou email.",
      keywords: ["mot de passe", "oublié", "sms", "récupération"],
      action_link: "/auth/forgot-password",
      action_label: "Réinitialiser"
    }
  ]
};
CAT_GH_SECURITY_FR.faqs = CAT_GH_SECURITY_FR.items;

// 1. Pwomosyon ak Bonis
const CAT_PROMO_HT: FAQCategory = {
  id: "promotions-bonis",
  slug: "promotions-et-bonus",
  title: "Pwomosyon ak Bonis",
  category: "Pwomosyon ak Bonis",
  icon: "gift",
  items: [
    {
      id: "promo-001",
      question: "Kijan pou m benefisye de 'Boost de Cotes +30%' la ?",
      answer: "Pou w benefisye de Boost de Cotes +30% la (pa egzanp sou match Ligue des Champions tankou Real Madrid vs Manchester City), ou sèlman bezwen chwazi seleksyon ki elijib la nan tikè w la epi aktive bouton 'Aplike Boost' la anvan w valide paryaj la.",
      q: "Kijan pou m benefisye de 'Boost de Cotes +30%' la ?",
      a: "Pou w benefisye de Boost de Cotes +30% la (pa egzanp sou match Ligue des Champions tankou Real Madrid vs Manchester City), ou sèlman bezwen chwazi seleksyon ki elijib la nan tikè w la epi aktive bouton 'Aplike Boost' la anvan w valide paryaj la.",
      keywords: ["boost", "cotes", "30%", "ligue des champions", "pwomosyon", "bonis"],
      action_link: "/promotions/boost-cotes",
      action_label: "Wè Pwomosyon an"
    },
    {
      id: "promo-002",
      question: "Ki kondisyon ki genyen sou Bonis Byenvini an ?",
      answer: "Bonis byenvini an double premye depo w la jiska yon montan maksimòm. Pou w ka retire lajan bonis la, ou dwe jwe li omwen 3 fwa sou kòt ki egal oswa siperyè a 1.50 nan yon delè 30 jou.",
      q: "Ki kondisyon ki genyen sou Bonis Byenvini an ?",
      a: "Bonis byenvini an double premye depo w la jiska yon montan maksimòm. Pou w ka retire lajan bonis la, ou dwe jwe li omwen 3 fwa sou kòt ki egal oswa siperyè a 1.50 nan yon delè 30 jou.",
      keywords: ["byenvini", "premye depo", "kondisyon", "rollover"],
      action_link: "/promotions/welcome-bonus",
      action_label: "Kondisyon Bonis"
    },
    {
      id: "promo-003",
      question: "Kisa 'Cashout' ye epi kijan li fonksyone ?",
      answer: "Opsyon Cashout la pèmèt ou rekipere yon pati nan lajan w oswa sekirize yon benefis anvan yon match fini. Disponibilite Cashout la depann de eta match la ak mache paryaj la.",
      q: "Kisa 'Cashout' ye epi kijan li fonksyone ?",
      a: "Opsyon Cashout la pèmèt ou rekipere yon pati nan lajan w oswa sekirize yon benefis anvan yon match fini. Disponibilite Cashout la depann de eta match la ak mache paryaj la.",
      keywords: ["cashout", "retire avan", "sekirize"],
      action_link: "/my-bets",
      action_label: "Wè Tikè Mwen Yo"
    }
  ]
};
CAT_PROMO_HT.faqs = CAT_PROMO_HT.items;

// 2. Depo ak Retrè Lajan
const CAT_PAY_HT: FAQCategory = {
  id: "depo-retre",
  slug: "depots-et-retraits",
  title: "Depo ak Retrè Lajan",
  category: "Depo ak Retrè Lajan",
  icon: "wallet",
  items: [
    {
      id: "pay-001",
      question: "Ki metòd peman ki disponib pou fè depo ?",
      answer: "Ou ka fè depo sou Full Bet pa Moncash online, Natcash online, kat labank (Visa / Mastercard), oswa transfè kripto (USDT). Depo yo fèt enstantane sou kont ou.",
      q: "Ki metòd peman ki disponib pou fè depo ?",
      a: "Ou ka fè depo sou Full Bet pa Moncash online, Natcash online, kat labank (Visa / Mastercard), oswa transfè kripto (USDT). Depo yo fèt enstantane sou kont ou.",
      keywords: ["depo", "moncash online", "natcash online", "kat kredi", "usdt", "kripto"],
      action_link: "/wallet/deposit",
      action_label: "Fè Yon Depo"
    },
    {
      id: "pay-002",
      question: "Konbyen tan yon retrè pran pou l rive nan menm ?",
      answer: "Retrè pa Moncash online ak Natcash online trete jeneralman ant 5 a 30 minit. Pou transfè labank, sa ka pran ant 24 a 48 èdtan ouvriyab.",
      q: "Konbyen tan yon retrè pran pou l rive nan menm ?",
      a: "Retrè pa Moncash online ak Natcash online trete jeneralman ant 5 a 30 minit. Pou transfè labank, sa ka pran ant 24 a 48 èdtan ouvriyab.",
      keywords: ["delè retrè", "konbyen tan", "reswa lajan"],
      action_link: "/wallet/withdraw",
      action_label: "Mande Yon Retrè"
    },
    {
      id: "pay-003",
      question: "Ki montan minimòm ak maksimòm pou depo ak retrè ?",
      answer: "Depo minimòm lan se 50 HTG (oswa ekivalan $1 USD). Retrè minimòm lan se 100 HTG. Pa gen limit maksimòm sou kont ki fin valide idantite yo (KYC).",
      q: "Ki montan minimòm ak maksimòm pou depo ak retrè ?",
      a: "Depo minimòm lan se 50 HTG (oswa ekivalan $1 USD). Retrè minimòm lan se 100 HTG. Pa gen limit maksimòm sou kont ki fin valide idantite yo (KYC).",
      keywords: ["minimòm", "maksimòm", "limit lajan"],
      action_link: "/wallet/limits",
      action_label: "Wè Limit Yo"
    }
  ]
};
CAT_PAY_HT.faqs = CAT_PAY_HT.items;

// 3. Paryaj Espòtif ak Match an Dirèk
const CAT_BET_HT: FAQCategory = {
  id: "pari-direk",
  slug: "paris-sportifs-et-direct",
  title: "Paryaj Espòtif ak Match an Dirèk",
  category: "Paryaj Espòtif ak Match an Dirèk",
  icon: "tv",
  items: [
    {
      id: "bet-001",
      question: "Kijan pou m gade yon match an dirèk nan aplikasyon an ?",
      answer: "Klike sou bouton 'Voir le direct' oswa al nan onglet 'Direct' nan meni an. Match ki gen yon ti ikòn televizyon oswa 'Play' gen difizyon videyo an dirèk oswa animasyon an tan reyèl.",
      q: "Kijan pou m gade yon match an dirèk nan aplikasyon an ?",
      a: "Klike sou bouton 'Voir le direct' oswa al nan onglet 'Direct' nan meni an. Match ki gen yon ti ikòn televizyon oswa 'Play' gen difizyon videyo an dirèk oswa animasyon an tan reyèl.",
      keywords: ["streaming", "voir le direct", "an dirèk", "gade match"],
      action_link: "/live",
      action_label: "Ale nan Direct"
    },
    {
      id: "bet-002",
      question: "Kisa k ap pase si yon match anile oswa ranvwaye ?",
      answer: "Si yon match ranvwaye epi li pa jwe nan 48 èdtan ki vini apre yo, kòt match sa a ap pase a 1.00 (ranbousman pou paryaj senp, oswa retire l nan kalkil konbine a).",
      q: "Kisa k ap pase si yon match anile oswa ranvwaye ?",
      a: "Si yon match ranvwaye epi li pa jwe nan 48 èdtan ki vini apre yo, kòt match sa a ap pase a 1.00 (ranbousman pou paryaj senp, oswa retire l nan kalkil konbine a).",
      keywords: ["match anile", "ranvwaye", "ranbousman"],
      action_link: "/rules/sports",
      action_label: "Li Règ Paryaj yo"
    },
    {
      id: "bet-003",
      question: "Ki diferans ki genyen ant yon pari senp ak yon pari konbine ?",
      answer: "Yon pari senp gen yon sèl seleksyon. Yon pari konbine (akimilè) rasanble plizyè match ansanm kote tout kòt yo miltipliye, sa ki bay yon pi gwo benefis men tout chwa yo dwe genyen.",
      q: "Ki diferans ki genyen ant yon pari senp ak yon pari konbine ?",
      a: "Yon pari senp gen yon sèl seleksyon. Yon pari konbine (akimilè) rasanble plizyè match ansanm kote tout kòt yo miltipliye, sa ki bay yon pi gwo benefis men tout chwa yo dwe genyen.",
      keywords: ["pari senp", "konbine", "akimilè", "miltip"],
      action_link: "/sports",
      action_label: "Parye Kounye a"
    }
  ]
};
CAT_BET_HT.faqs = CAT_BET_HT.items;

// 4. Kont, Idantite ak Sekirite
const CAT_ACC_HT: FAQCategory = {
  id: "kont-sekirite",
  slug: "compte-et-securite",
  title: "Kont, Idantite ak Sekirite",
  category: "Kont, Idantite ak Sekirite",
  icon: "shield-check",
  items: [
    {
      id: "acc-001",
      question: "Kijan pou m verifye kont mwen (Verifikasyon KYC) ?",
      answer: "Ale nan seksyon 'Profil mwen' > 'Verifikasyon Idantite'. W ap telechaje yon pyès idantite valid (Paspò, Lisans, oswa Kat Idantifikasyon Nasyonal) ansanm ak yon selfie.",
      q: "Kijan pou m verifye kont mwen (Verifikasyon KYC) ?",
      a: "Ale nan seksyon 'Profil mwen' > 'Verifikasyon Idantite'. W ap telechaje yon pyès idantite valid (Paspò, Lisans, oswa Kat Idantifikasyon Nasyonal) ansanm ak yon selfie.",
      keywords: ["kyc", "verifikasyon", "kat idantite", "paspò", "sekirite"],
      action_link: "/profile/verify",
      action_label: "Verifye Kont Mwen"
    },
    {
      id: "acc-002",
      question: "Mwen bliye modpas mwen, kisa pou m fè ?",
      answer: "Sou paj koneksyon an, klike sou 'Modpas bliye'. Antre nimewo telefòn ou oswa imel ou pou w resevwa yon kòd sekirite (OTP) pou kreye yon nouvo modpas.",
      q: "Mwen bliye modpas mwen, kisa pou m fè ?",
      a: "Sou paj koneksyon an, klike sou 'Modpas bliye'. Antre nimewo telefòn ou oswa imel ou pou w resevwa yon kòd sekirite (OTP) pou kreye yon nouvo modpas.",
      keywords: ["bliye modpas", "rekiperasyon", "otp", "kòd"],
      action_link: "/auth/forgot-password",
      action_label: "Reyajiste Modpas"
    },
    {
      id: "acc-003",
      question: "Èske mwen ka posede plizyè kont sou Full Bet ?",
      answer: "Non. Règ Full Bet yo entèdi strikteman yon sèl itilizatè posede plis pase yon kont. Tout kont an doub ka bloke otomatikman.",
      q: "Èske mwen ka posede plizyè kont sou Full Bet ?",
      a: "Non. Règ Full Bet yo entèdi strikteman yon sèl itilizatè posede plis pase yon kont. Tout kont an doub ka bloke otomatikman.",
      keywords: ["plizyè kont", "kont miltip", "règ kont"],
      action_link: "/terms",
      action_label: "Tèm ak Kondisyon"
    }
  ]
};
CAT_ACC_HT.faqs = CAT_ACC_HT.items;

// 5. Èd ak Sipò Kliyan
const CAT_SUP_HT: FAQCategory = {
  id: "ed-sipo",
  slug: "assistance-et-support",
  title: "Èd ak Sipò Kliyan",
  category: "Èd ak Sipò Kliyan",
  icon: "headphones",
  items: [
    {
      id: "sup-001",
      question: "Kijan pou m kontakte sèvis kliyan Full Bet la ?",
      answer: "Sèvis kliyan nou an disponib 24/7 atravè 'Chat an Dirèk' nan aplikasyon an, pa WhatsApp nan nimewo ofisyèl la, oswa pa imel nan support@fullbet.com.",
      q: "Kijan pou m kontakte sèvis kliyan Full Bet la ?",
      a: "Sèvis kliyan nou an disponib 24/7 atravè 'Chat an Dirèk' nan aplikasyon an, pa WhatsApp nan nimewo ofisyèl la, oswa pa imel nan support@fullbet.com.",
      keywords: ["sipò", "èd", "kontak", "whatsapp", "chat", "reklamasyon"],
      action_link: "/support/chat",
      action_label: "Kòmanse yon Chat"
    },
    {
      id: "sup-002",
      question: "Aplikasyon an ap fè lenta oswa li pa chaje kòrèkteman, kisa pou m fè ?",
      answer: "Asire w ou gen yon bon koneksyon Entènèt, netwaye kach (cache) aplikasyon an nan paramèt telefòn ou, oswa verifye si gen yon dènye mizajou Full Bet ki disponib sou Play Store / App Store.",
      q: "Aplikasyon an ap fè lenta oswa li pa chaje kòrèkteman, kisa pou m fè ?",
      a: "Asire w ou gen yon bon koneksyon Entènèt, netwaye kach (cache) aplikasyon an nan paramèt telefòn ou, oswa verifye si gen yon dènye mizajou Full Bet ki disponib sou Play Store / App Store.",
      keywords: ["lenta", "teknik", "bug", "cache", "mizajou"],
      action_link: "/settings",
      action_label: "Paramèt Aplikasyon"
    }
  ]
};
CAT_SUP_HT.faqs = CAT_SUP_HT.items;

// Versions françaises
const CAT_PROMO_FR: FAQCategory = {
  id: "promotions-bonis",
  slug: "promotions-et-bonus",
  title: "Promotions et Bonus",
  category: "Promotions et Bonus",
  icon: "gift",
  items: [
    {
      id: "promo-001-fr",
      question: "Comment bénéficier du 'Boost de Cotes +30%' ?",
      answer: "Pour profiter du Boost de Cotes +30% (par exemple sur les chocs de Ligue des Champions comme Real Madrid vs Manchester City), ajoutez simplement la sélection éligible sur votre coupon puis activez le bouton 'Appliquer Boost' avant de valider votre pari.",
      q: "Comment bénéficier du 'Boost de Cotes +30%' ?",
      a: "Pour profiter du Boost de Cotes +30% (par exemple sur les chocs de Ligue des Champions comme Real Madrid vs Manchester City), ajoutez simplement la sélection éligible sur votre coupon puis activez le bouton 'Appliquer Boost' avant de valider votre pari.",
      keywords: ["boost", "cotes", "30%", "ligue des champions", "promotion", "bonus"],
      action_link: "/promotions/boost-cotes",
      action_label: "Voir la Promotion"
    },
    {
      id: "promo-002-fr",
      question: "Comment fonctionnent les sélections, les paris les plus communs et les mises totales sur Full Bet ?",
      answer: "Sur chaque fiche de pari client, vous pouvez ajouter une ou plusieurs sélections (paris simples ou combinés jusqu'à 30 sélections). La mise totale (en HTG) est multipliée par la cote cumulée pour déterminer le gain potentiel. Les paris les plus communs (1X2, Plus/Moins de buts, Double Chance, et Borlette NY/Floride) sont mis à jour en temps réel avec validation instantanée.",
      q: "Comment fonctionnent les sélections, les paris les plus communs et les mises totales sur Full Bet ?",
      a: "Sur chaque fiche de pari client, vous pouvez ajouter une ou plusieurs sélections (paris simples ou combinés jusqu'à 30 sélections). La mise totale (en HTG) est multipliée par la cote cumulée pour déterminer le gain potentiel. Les paris les plus communs (1X2, Plus/Moins de buts, Double Chance, et Borlette NY/Floride) sont mis à jour en temps réel avec validation instantanée.",
      keywords: ["sélections", "fiche", "paris communs", "mise totale", "calcul", "gains"],
      action_link: "/sports",
      action_label: "Voir les Sélections & Cotes"
    },
    {
      id: "promo-003-fr",
      question: "Qu'est-ce que le 'Cashout' et comment fonctionne-t-il ?",
      answer: "L'option Cashout vous permet de récupérer une fraction de votre mise ou de sécuriser un gain avant la fin d'un match. La disponibilité du Cashout dépend du scénario de la rencontre et des marchés.",
      q: "Qu'est-ce que le 'Cashout' et comment fonctionne-t-il ?",
      a: "L'option Cashout vous permet de récupérer une fraction de votre mise ou de sécuriser un gain avant la fin d'un match. La disponibilité du Cashout dépend du scénario de la rencontre et des marchés.",
      keywords: ["cashout", "retirer avant", "sécuriser"],
      action_link: "/my-bets",
      action_label: "Voir Mes Paris"
    }
  ]
};
CAT_PROMO_FR.faqs = CAT_PROMO_FR.items;

const CAT_PAY_FR: FAQCategory = {
  id: "depo-retre",
  slug: "depots-et-retraits",
  title: "Dépôts et Retraits de Fonds",
  category: "Dépôts et Retraits de Fonds",
  icon: "wallet",
  items: [
    {
      id: "pay-001-fr",
      question: "Quels modes de paiement sont acceptés pour déposer ?",
      answer: "Vous pouvez effectuer vos dépôts sur Full Bet par Moncash online, Natcash online, carte bancaire (Visa / Mastercard) ou crypto (USDT). Tous les dépôts sont instantanément crédités sur votre solde.",
      q: "Quels modes de paiement sont acceptés pour déposer ?",
      a: "Vous pouvez effectuer vos dépôts sur Full Bet par Moncash online, Natcash online, carte bancaire (Visa / Mastercard) ou crypto (USDT). Tous les dépôts sont instantanément crédités sur votre solde.",
      keywords: ["dépôt", "moncash online", "natcash online", "carte bancaire", "usdt", "crypto"],
      action_link: "/wallet/deposit",
      action_label: "Faire un Dépôt"
    },
    {
      id: "pay-002-fr",
      question: "Combien de temps prend un retrait ?",
      answer: "Les retraits via Moncash online et Natcash online sont généralement traités entre 5 et 30 minutes. Pour les virements bancaires, comptez de 24 à 48 heures ouvrées.",
      q: "Combien de temps prend un retrait ?",
      a: "Les retraits via Moncash online et Natcash online sont généralement traités entre 5 et 30 minutes. Pour les virements bancaires, comptez de 24 à 48 heures ouvrées.",
      keywords: ["délai retrait", "combien de temps", "recevoir argent"],
      action_link: "/wallet/withdraw",
      action_label: "Demander un Retrait"
    },
    {
      id: "pay-003-fr",
      question: "Quels sont les montants minimum et maximum ?",
      answer: "Le dépôt minimum est de 50 HTG (ou l'équivalent de 1$ USD). Le retrait minimum est de 100 HTG. Aucun plafond maximal n'est imposé sur les comptes vérifiés (KYC).",
      q: "Quels sont les montants minimum et maximum ?",
      a: "Le dépôt minimum est de 50 HTG (ou l'équivalent de 1$ USD). Le retrait minimum est de 100 HTG. Aucun plafond maximal n'est imposé sur les comptes vérifiés (KYC).",
      keywords: ["minimum", "maximum", "plafond"],
      action_link: "/wallet/limits",
      action_label: "Voir les Limites"
    }
  ]
};
CAT_PAY_FR.faqs = CAT_PAY_FR.items;

const CAT_BET_FR: FAQCategory = {
  id: "pari-direk",
  slug: "paris-sportifs-et-direct",
  title: "Paris Sportifs et Matchs en Direct",
  category: "Paris Sportifs et Matchs en Direct",
  icon: "tv",
  items: [
    {
      id: "bet-001-fr",
      question: "Comment suivre un match en direct sur l'application ?",
      answer: "Cliquez sur 'Voir le direct' ou rendez-vous sur l'onglet 'Direct' du menu. Les rencontres assorties d'une icône TV ou 'Play' disposent du streaming vidéo ou de l'animation graphique en temps réel.",
      q: "Comment suivre un match en direct sur l'application ?",
      a: "Cliquez sur 'Voir le direct' ou rendez-vous sur l'onglet 'Direct' du menu. Les rencontres assorties d'une icône TV ou 'Play' disposent du streaming vidéo ou de l'animation graphique en temps réel.",
      keywords: ["streaming", "voir le direct", "en direct", "regarder match"],
      action_link: "/live",
      action_label: "Aller au Direct"
    },
    {
      id: "bet-002-fr",
      question: "Que se passe-t-il si un match est annulé ou reporté ?",
      answer: "Si une rencontre est reportée et non rejouée dans les 48 heures suivantes, la cote de ce match passe à 1.00 (remboursement intégral en pari simple ou neutralisation dans un combiné).",
      q: "Que se passe-t-il si un match est annulé ou reporté ?",
      a: "Si une rencontre est reportée et non rejouée dans les 48 heures suivantes, la cote de ce match passe à 1.00 (remboursement intégral en pari simple ou neutralisation dans un combiné).",
      keywords: ["match annulé", "reporté", "remboursement"],
      action_link: "/rules/sports",
      action_label: "Règles des Paris"
    },
    {
      id: "bet-003-fr",
      question: "Quelle est la différence entre un pari simple et un combiné ?",
      answer: "Un pari simple porte sur un unique pronostic. Un pari combiné rassemble plusieurs sélections dont les cotes se multiplient entre elles, offrant un gain potentiel très élevé à condition que tous les choix soient gagnants.",
      q: "Quelle est la différence entre un pari simple et un combiné ?",
      a: "Un pari simple porte sur un unique pronostic. Un pari combiné rassemble plusieurs sélections dont les cotes se multiplient entre elles, offrant un gain potentiel très élevé à condition que tous les choix soient gagnants.",
      keywords: ["pari simple", "combiné", "accumulateur", "multiple"],
      action_link: "/sports",
      action_label: "Parier Maintenant"
    }
  ]
};
CAT_BET_FR.faqs = CAT_BET_FR.items;

const CAT_ACC_FR: FAQCategory = {
  id: "kont-sekirite",
  slug: "compte-et-securite",
  title: "Compte, Identité et Sécurité",
  category: "Compte, Identité et Sécurité",
  icon: "shield-check",
  items: [
    {
      id: "acc-001-fr",
      question: "Comment vérifier mon compte (Validation KYC) ?",
      answer: "Accédez à 'Mon Profil' > 'Vérification d'Identité'. Téléchargez une pièce d'identité en cours de validité (Passeport, Permis ou Carte d'Identification Nationale) accompagnée d'un selfie.",
      q: "Comment vérifier mon compte (Validation KYC) ?",
      a: "Accédez à 'Mon Profil' > 'Vérification d'Identité'. Téléchargez une pièce d'identité en cours de validité (Passeport, Permis ou Carte d'Identification Nationale) accompagnée d'un selfie.",
      keywords: ["kyc", "vérification", "carte identité", "passeport", "sécurité"],
      action_link: "/profile/verify",
      action_label: "Vérifier Mon Compte"
    },
    {
      id: "acc-002-fr",
      question: "J'ai oublié mon mot de passe, que faire ?",
      answer: "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié'. Renseignez votre numéro de téléphone ou email afin de recevoir un code de sécurité (OTP) pour définir un nouveau mot de passe.",
      q: "J'ai oublié mon mot de passe, que faire ?",
      a: "Sur l'écran de connexion, cliquez sur 'Mot de passe oublié'. Renseignez votre numéro de téléphone ou email afin de recevoir un code de sécurité (OTP) pour définir un nouveau mot de passe.",
      keywords: ["mot de passe oublié", "récupération", "otp", "code"],
      action_link: "/auth/forgot-password",
      action_label: "Réinitialiser Mot de Passe"
    },
    {
      id: "acc-003-fr",
      question: "Puis-je posséder plusieurs comptes sur Full Bet ?",
      answer: "Non. Le règlement Full Bet interdit rigoureusement la détention de plusieurs comptes par un même utilisateur. Tout compte en doublon s'expose à un blocage immédiat.",
      q: "Puis-je posséder plusieurs comptes sur Full Bet ?",
      a: "Non. Le règlement Full Bet interdit rigoureusement la détention de plusieurs comptes par un même utilisateur. Tout compte en doublon s'expose à un blocage immédiat.",
      keywords: ["comptes multiples", "règles compte"],
      action_link: "/terms",
      action_label: "Conditions Générales"
    }
  ]
};
CAT_ACC_FR.faqs = CAT_ACC_FR.items;

const CAT_SUP_FR: FAQCategory = {
  id: "ed-sipo",
  slug: "assistance-et-support",
  title: "Assistance et Support Client",
  category: "Assistance et Support Client",
  icon: "headphones",
  items: [
    {
      id: "sup-001-fr",
      question: "Comment contacter le service client Full Bet ?",
      answer: "Notre assistance clientèle est opérationnelle 24h/24 et 7j/7 via le Chat en direct de l'application, par WhatsApp au numéro officiel ou par email à support@fullbet.com.",
      q: "Comment contacter le service client Full Bet ?",
      a: "Notre assistance clientèle est opérationnelle 24h/24 et 7j/7 via le Chat en direct de l'application, par WhatsApp au numéro officiel ou par email à support@fullbet.com.",
      keywords: ["support", "aide", "contact", "whatsapp", "chat", "réclamation"],
      action_link: "/support/chat",
      action_label: "Démarrer un Chat"
    },
    {
      id: "sup-002-fr",
      question: "L'application fonctionne au ralenti, que faire ?",
      answer: "Vérifiez la stabilité de votre connexion Internet, videz le cache de l'application dans les réglages de votre smartphone ou vérifiez si une mise à jour Full Bet est disponible sur le Play Store / App Store.",
      q: "L'application fonctionne au ralenti, que faire ?",
      a: "Vérifiez la stabilité de votre connexion Internet, videz le cache de l'application dans les réglages de votre smartphone ou vérifiez si une mise à jour Full Bet est disponible sur le Play Store / App Store.",
      keywords: ["lenteur", "technique", "bug", "cache", "mise à jour"],
      action_link: "/settings",
      action_label: "Paramètres de l'App"
    }
  ]
};
CAT_SUP_FR.faqs = CAT_SUP_FR.items;

export const FAQ_DATA: FAQData = {
  ht: [
    // 6 Official Gaminghub Haïti v2.0.0 Categories
    ...MAPPED_GAMINGHUB_HT,

    // GamingHub Haïti v2.1.0 Official Categories
    CAT_GH_BOUS_HT,
    CAT_GH_BOLET_HT,
    CAT_GH_SPORTS_HT,
    CAT_GH_SECURITY_HT,

    // 5 Official Structured Categories from Full Bet v1.0.0 Spec
    CAT_PROMO_HT,
    CAT_PAY_HT,
    CAT_BET_HT,
    CAT_ACC_HT,
    CAT_SUP_HT,

    // Additional Specialized Categories
    {
      category: "GamingHub POS, Solde Kache & Enpresyon Tikè",
      icon: "printer",
      items: [
        {
          id: "faq_001",
          q: "Poukisa montan solde a (12 350 HTG) pa parèt an klè nan tèt paj la ankò?",
          a: "Pou garanti plis sekirite ak diskresyon pou jwè yo ak kachye yo nan kès la, montan lajan an kouvri pa yon nouvo ikòn konbine (pòtmonnen + fich). Lè w klike sou li, ou ka wè balans ou si w vle, epi w ap wè yon rezime tout fich ki louvri yo an menm tan.",
          keywords: ["solde", "kache", "diskresyon", "pos"]
        },
        {
          id: "faq_002",
          q: "Ki kalite fich mwen ka jere nan nouvo bouton konbine a?",
          a: "Meni sa a rasanble 3 prensipal kategori jwèt yo: 1) Pari Espòtif (fich foutbòl, baskètbòl, elatriye), 2) Kazino & Crash (sesyon jwèt tankou Aviator ak kous aktif), epi 3) Bòlèt NY/FL (tout tiraj New York ak Florida Midi/Swè, tankou Bolet, Maryaj, Loto 3, 4 ak 5 chif).",
          keywords: ["fich", "kategori", "aviator", "bolet"]
        },
        {
          id: "faq_003",
          q: "Kouman pou m enprime yon fich tikè rapidman?",
          a: "Chak fich ki valide posede yon ti bouton rapid ak yon ikòn enprimant sou li. Lè w klike sou ikòn sa a, sistèm nan voye tikè a dirèkteman sou enprimant ou an san l pa enprime rès paj sit la.",
          keywords: ["enprime", "resi", "pos 80mm", "58mm"]
        },
        {
          id: "faq_004",
          q: "Èske li mache sou enprimant tèmik (roulo kès) ak enprimant papye nòmal?",
          a: "Wi, sistèm nan optimize pou fòma tèmik 58mm ak 80mm (ESC/POS ou Bluetooth) ki itilize nan bank bòlèt ak kès pari, epi li mache trè byen tou sou enprimant papye estanda (A4/A5).",
          keywords: ["enprimant temik", "bluetooth", "papye a4"]
        },
        {
          id: "faq_005",
          q: "Kisa ki garanti tikè enprime a valab pou reklame kòb gayan?",
          a: "Chak fich ki enprime genyen ladan l yon nimewo idantifikasyon inik (#SP, #CR, oswa #BL), yon kòd sekirite verifye, dat/lè tiraj la, ansanm ak yon kòd-bar / QR kòd pou kès la ka eskane l epi peye gayan an san erè.",
          keywords: ["sekirite", "validasyon", "qr code", "kod bar"]
        }
      ]
    },
    {
      category: "Cote ak Gain (Règ Ofisyèl)",
      icon: "trending-up",
      items: [
        {
          id: "cote-1",
          q: "Ki sa ki cote maksimòm yon kliyan ka jwe sou FULL BET?",
          a: "Cote maksimòm nan se 50 000.00. Si yon kliyan ta antre oswa mande yon cote ki depase 50 000, sistèm nan otomatikman plafone li a 50 000.00.",
          keywords: ["cote", "maksimom", "50000"]
        },
        {
          id: "gain-1",
          q: "Konbyen lajan maksimòm yon kliyan ka genyen sou yon fich?",
          a: "Gain maksimòm lan se 1 000 000 Goud (HTG). Menm si kalkil (Mise x Cote) ta bay plis pase 1 000 000, sistèm nan otomatikman plafone gain an a 1 000 000 Goud egzakteman.",
          keywords: ["gain", "plafon", "1000000", "htg"]
        }
      ]
    },
    {
      category: "Limit Tranzaksyon & Alèt Otomatik 24h",
      icon: "clock",
      items: [
        {
          id: "limit-1",
          q: "Konbyen tranzaksyon yon kont ka fè nan yon jounen?",
          a: "Chak kont limite a yon maksimòm 15 tranzaksyon pa 24 èdtan sou yon fenèt glisant.",
          keywords: ["limit", "15 tranzaksyon", "24h"]
        },
        {
          id: "alert-1",
          q: "Kisa k ap pase lè yon kliyan rive nan 14e ak 15e tranzaksyon?",
          a: "Nan 14e tranzaksyon an, sistèm nan voye yon alèt avètisman (WARNING) pou di l rete 1 sèl tranzaksyon. Nan 15e tranzaksyon an, sistèm nan voye yon alèt kritik (CRITICAL), li bloke tout nouvo tranzaksyon, epi li afiche yon revèy (countdown HH:MM:SS) ki kalkile tan egzak ki rete anvan pi ansyen tranzaksyon an soti nan 24 èdtan an pou libere plas.",
          keywords: ["alet", "countdown", "bloque", "fenet glisant"]
        }
      ]
    },
    {
      category: "Kazino, Aviator Crash, Lucky X & Roulette",
      icon: "dice-5",
      items: [
        {
          id: "cas-1",
          q: "Kijan jwèt Aviator / Crash la fonksyone ?",
          a: "Nan Aviator / Crash, avyon an dekole ak yon miltiplikatè ki monte depi 1.00x rive jiska 100x oswa plis. Ou dwe klike sou 'Cash Out' anvan avyon an eksploze pou retire kòb ou miltipliye pa chif ki sou ekran an.",
          keywords: ["aviator", "crash", "multiplikate"]
        },
        {
          id: "cas-2",
          q: "Kijan Lucky X ak Lucky Six fonksyone ?",
          a: "Lucky X ak Lucky Six se jwèt tiraj boul elektwonik rapid. Nan Lucky X gen 50 boul koulè (Wouj, Bleu, Vèt, Jòn, Vyolèt). Apre chak tou, gen yon poz otomatik 2:30 pou mete paryaj. Machin lan rale boul yo an dirèk.",
          keywords: ["lucky x", "lucky six", "tiraj boul"]
        },
        {
          id: "cas-3",
          q: "Kijan Roulette Américaine (0 ak 00) fonksyone ?",
          a: "Roulette la gen 38 nimewo (0, 00 ak 1 rive 36). Ou mete jeton ou sou nimewo, koulè (Wouj/Nwa) oswa kolòn. Gen yon poz otomatik 2:30 ant chak tou pou prepare miz ou.",
          keywords: ["roulette", "00", "americaine"]
        }
      ]
    },
    {
      category: "La Borlette Haïtienne (Tiraj New York & Florida)",
      icon: "sparkles",
      items: [
        {
          id: "bor-1",
          q: "Ki tiraj ofisyèl ki disponib sou Full Bet ?",
          a: "Nou ofri 4 gwo tiraj ofisyèl chak jou : New York Midi (14:30), New York Soir (20:30), Florida Midi (13:30) ak Florida Soir (21:45). Rezilta yo soti dirèkteman nan sous ofisyèl yo.",
          keywords: ["borlette", "new york", "florida", "midi", "swè"]
        },
        {
          id: "bor-2",
          q: "Ki fòmil jwèt Bolet mwen ka pran ?",
          a: "Ou ka jwe : Bolet Senp (1er, 2ème, 3ème lo), Maryaj (de nimewo asosye ki peye jiska 1 000x), Loto 3 chif, ak Loto 4 chif.",
          keywords: ["bolet", "maryaj", "loto 3", "loto 4"]
        },
        {
          id: "bor-3",
          q: "Kouman pou mwen enprime oswa telechaje fich mwen an ?",
          a: "Lè w fin valide fich ou a, li parèt nan tab 'Fich Mwen' ak yon kòd sekirite inik. Ou ka klike sou bouton enprimant lan pou telechaje yon resi PDF oswa pataje l sou WhatsApp.",
          keywords: ["fich", "resi", "whatsapp"]
        }
      ]
    }
  ],
  fr: [
    // 6 Official Gaminghub Haïti v2.0.0 Categories
    ...MAPPED_GAMINGHUB_FR,

    // GamingHub Haïti v2.1.0 Catégories Officielles
    CAT_GH_BOUS_FR,
    CAT_GH_BOLET_FR,
    CAT_GH_SPORTS_FR,
    CAT_GH_SECURITY_FR,

    CAT_PROMO_FR,
    CAT_PAY_FR,
    CAT_BET_FR,
    CAT_ACC_FR,
    CAT_SUP_FR,

    {
      category: "GamingHub POS, Solde Masqué & Impression de Tickets",
      icon: "printer",
      items: [
        {
          id: "faq_001_fr",
          q: "Pourquoi le montant du solde (12 350 HTG) n'est-il plus affiché en clair dans l'en-tête ?",
          a: "Pour garantir une sécurité et une discrétion accrues pour les joueurs et les caissiers, le solde est masqué par défaut par une icône combinée (portefeuille + tickets). En cliquant dessus, vous pouvez révéler votre solde et accéder instantanément au récapitulatif de tous vos tickets ouverts.",
          keywords: ["solde", "masqué", "discrétion", "pos"]
        },
        {
          id: "faq_002_fr",
          q: "Quels types de tickets puis-je gérer via ce bouton combiné ?",
          a: "Ce menu centralise les 3 grandes catégories : 1) Paris Sportifs (football, basket, etc.), 2) Casino & Crash (sessions actives comme Aviator), et 3) Borlette NY/FL (tirages New York et Florida Midi/Soir : Bolet, Maryaj, Loto 3, 4 et 5 chiffres).",
          keywords: ["tickets", "catégories", "aviator", "borlette"]
        },
        {
          id: "faq_003_fr",
          q: "Comment imprimer rapidement un ticket / reçu ?",
          a: "Chaque ticket validé dispose d'un bouton d'impression rapide avec une icône d'imprimante. En cliquant dessus, le système transmet directement le reçu à votre imprimante sans imprimer le reste de l'interface.",
          keywords: ["impression", "reçu", "pos 80mm", "58mm"]
        },
        {
          id: "faq_004_fr",
          q: "Est-ce compatible avec les imprimantes thermiques de caisse et papier standard ?",
          a: "Oui, le système est optimisé pour les imprimantes thermiques POS 58mm et 80mm (ESC/POS ou Bluetooth) utilisées dans les banques de borlette et caisses de paris, ainsi que pour les imprimantes papier de bureau (A4/A5).",
          keywords: ["imprimante thermique", "bluetooth", "papier a4"]
        },
        {
          id: "faq_005_fr",
          q: "Qu'est-ce qui garantit la validité du ticket imprimé pour réclamer un gain ?",
          a: "Chaque ticket imprimé comporte un identifiant unique (#SP, #CR ou #BL), un code de sécurité vérifié, la date et l'heure officielles, ainsi qu'un code-barres et un QR code scannables par la caisse pour un paiement sécurisé.",
          keywords: ["sécurité", "validation", "qr code", "code-barres"]
        }
      ]
    },
    {
      category: "Cotes et Gains (Règles Officielles)",
      icon: "trending-up",
      items: [
        {
          id: "cote-1",
          q: "Quelle est la cote maximale autorisée sur FULL BET ?",
          a: "La cote maximale autorisée est de 50 000.00. Toute cote supérieure saisie est automatiquement plafonnée à 50 000.",
          keywords: ["cote", "maximale", "50000"]
        },
        {
          id: "gain-1",
          q: "Quel est le gain maximal payable sur une fiche ?",
          a: "Le gain maximal est de 1 000 000 HTG (Gourdes haïtiennes). Tout calcul excédant ce montant est immédiatement plafonné à 1 000 000 HTG.",
          keywords: ["gain", "plafond", "1000000", "htg"]
        }
      ]
    },
    {
      category: "Limite de Transactions & Alertes 24h",
      icon: "clock",
      items: [
        {
          id: "limit-1",
          q: "Combien de transactions un compte peut-il effectuer par 24h ?",
          a: "Chaque compte est strictement limité à 15 transactions par tranche glissante de 24 heures.",
          keywords: ["limite", "15 transactions", "24h"]
        },
        {
          id: "alert-1",
          q: "Que se passe-t-il lorsque l'utilisateur atteint la 14e et 15e transaction ?",
          a: "À la 14e transaction, un avertissement informe qu'il ne reste qu'une transaction. À la 15e transaction, le compte est temporairement bloqué avec un compte à rebours interactif (HH:MM:SS) indiquant l'heure exacte de réinitialisation.",
          keywords: ["alerte", "compte à rebours", "bloqué", "fenêtre glissante"]
        }
      ]
    },
    {
      category: "Casino, Aviator Crash, Lucky X & Roulette",
      icon: "dice-5",
      items: [
        {
          id: "cas-1",
          q: "Comment fonctionne le jeu Aviator / Crash ?",
          a: "Dans Aviator / Crash, l'avion prend son envol avec un multiplicateur progressif démarrant à 1.00x jusqu'à 100x et plus. Vous devez appuyer sur 'Cash Out' avant l'explosion de l'appareil pour empocher vos gains.",
          keywords: ["aviator", "crash", "multiplicateur"]
        },
        {
          id: "cas-2",
          q: "Comment fonctionnent Lucky X et Lucky Six ?",
          a: "Ce sont des tirages de boules animés en direct. Lucky X comprend 50 boules aux couleurs identifiées (Rouge, Bleu, Vert, Jaune, Violet) avec une pause automatique de 02:30 entre chaque round pour préparer vos sélections.",
          keywords: ["lucky x", "lucky six", "tirage boules"]
        },
        {
          id: "cas-3",
          q: "Comment jouer à la Roulette Américaine (0 et 00) ?",
          a: "La table comprend 38 cases numérotées de 0 à 36 avec un double zéro (00). Placez vos jetons sur les numéros pleins, les couleurs (Rouge/Noir) ou les colonnes. Une pause automatique de 2:30 est configurée entre chaque round.",
          keywords: ["roulette", "00", "américaine"]
        }
      ]
    },
    {
      category: "La Borlette Haïtienne (Tirages New York & Florida)",
      icon: "sparkles",
      items: [
        {
          id: "bor-1",
          q: "Quels sont les tirages officiels disponibles sur Full Bet ?",
          a: "Nous couvrons 4 tirages officiels quotidiens : New York Midi (14:30), New York Soir (20:30), Florida Midi (13:30) et Florida Soir (21:45), directement calqués sur les résultats certifiés des loteries d'État.",
          keywords: ["borlette", "new york", "florida", "midi", "soir"]
        },
        {
          id: "bor-2",
          q: "Quelles sont les formules de Borlette disponibles ?",
          a: "Vous pouvez miser sur la Borlette Simple (1er, 2ème, 3ème lot), le Mariage (combinaison de 2 numéros avec gain jusqu'à x1 000), le Loto 3 chiffres et le Loto 4 chiffres.",
          keywords: ["borlette", "mariage", "loto 3", "loto 4"]
        },
        {
          id: "bor-3",
          q: "Comment consulter et imprimer ma fiche de Borlette ?",
          a: "Dès validation, votre fiche est enregistrée dans l'onglet 'Mes Fiches' avec un identifiant et un QR code unique. Vous pouvez l'imprimer ou l'exporter au format reçu officiel.",
          keywords: ["fiche", "reçu", "whatsapp"]
        }
      ]
    }
  ]
};
