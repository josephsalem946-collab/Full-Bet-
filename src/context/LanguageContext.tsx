import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'ht' | 'fr' | 'en' | 'es' | 'pt';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  is_default: boolean;
  label: string; // Backward compatibility with existing UI
}

export const APP_METADATA = {
  name: "Full Bet",
  country_code: "HT",
  tagline: "Paryaj & Bòlèt Ofisyèl",
  default_language: "ht" as LanguageCode
};

export const LANGUAGE_SETTINGS = {
  storage_key: "app_language",
  sync_endpoint: "/api/v1/user/preferences",
  ui_component: "Dropdown / Modal Hybrid",
  accessibility_compliant: true
};

export const LANGUAGES: LanguageOption[] = [
  {
    code: "ht",
    name: "Haitian Creole",
    nativeName: "Kreyòl Ayisyen",
    flag: "🇭🇹",
    is_default: true,
    label: "Kreyòl Ayisyen"
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    is_default: false,
    label: "Français"
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    is_default: false,
    label: "English"
  },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    is_default: false,
    label: "Español"
  },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    is_default: false,
    label: "Português"
  }
];

export const TRANSLATIONS_UI = {
  ht: {
    select_language: "Chwazi lang ou pi pito a",
    success_message: "Lang lan mete ajou avèk siksè"
  },
  fr: {
    select_language: "Sélectionner la langue",
    success_message: "Langue mise à jour avec succès"
  },
  en: {
    select_language: "Select Language",
    success_message: "Language updated successfully"
  },
  es: {
    select_language: "Seleccionar idioma",
    success_message: "Idioma actualizado con éxito"
  },
  pt: {
    select_language: "Selecionar idioma",
    success_message: "Idioma atualizado com sucesso"
  }
};

export const translations: Record<LanguageCode, Record<string, string>> = {
  ht: {
    sports: "Paryaj Espòtif",
    live: "An Dirèk",
    upcoming: "K ap Vini",
    all: "Tout",
    new: "NOUVO",
    secondaryMarkets: "Lòt Mache yo",
    downloadApp: "Telechaje Aplikasyon an",
    appSubtitle: "Enstale aplikasyon mobil rapid la",
    selectLanguage: "Chwazi lang ou pi pito a",
    mainMarket: "Rezilta Match (1X2)",
    balance: "Balans",
    betSlip: "Koupon paryaj",
    deposit: "Depo",
    withdraw: "Retrè",
    casino: "Kazino & Crash",
    borlette: "Bòlèt NY/FL",
    searchPlaceholder: "Chèche yon konpetisyon, peyi oswa ekip...",
    oddsBoost: "BOOST KÒT +30%",
    viewLive: "Gade an dirèk",
    finalizeBet: "Valide",
    totalOdds: "Kòt total",
    activeCoupon: "Koupon Paryaj aktif",
    menu: "Meni",
    topCompetitions: "Lòd Konpetisyon yo",
    gatewaysTitle: "Pasrèl Ofisyèl Ayiti",
    rulesAndTerms: "Règleman & Kondisyon",
    adminPanel: "Panèl Admin",
    supportWhatsApp: "Sipò Ofisyèl Full Bet",
    profile: "Pwofil Mwen",
    linksAndServices: "Lyen & Sèvis",
    ticketVerifier: "Verifikatè Fich & Koupon",
    privacyPolicy: "Règleman sou Konfidansyalite",
    officialSupport: "Sipò Kliyan Ofisyèl",
    technicalInfo: "Enfòmasyon teknik",
    certified18: "Platfòm Sètifye 18+",
    instantPayments: "Peman Enstantane & Sekirize",
    supportDesc: "Asistans 24h/7j pou depo, retrè, verifikasyon fich ak koupon espòtif.",
    legalMentions: "Mansyon legal : Full Bet Ofisyèl, platfòm sètifye 18+ ak tout dwa rezève.",
    allRightsReserved: "© 2026 Full Bet • Tout dwa rezève • Jwe avèk responsablite."
  },
  fr: {
    sports: "Paris Sportifs",
    live: "En Direct",
    upcoming: "À Venir",
    all: "Tous",
    new: "NOUVEAU",
    secondaryMarkets: "Marchés complémentaires",
    downloadApp: "Télécharger l'App",
    appSubtitle: "Installez l'application mobile rapide",
    selectLanguage: "Sélectionner la langue",
    mainMarket: "Résultat du Match (1X2)",
    balance: "Solde",
    betSlip: "Coupon de paris",
    deposit: "Dépôt",
    withdraw: "Retrait",
    casino: "Casino & Crash",
    borlette: "Borlette NY/FL",
    searchPlaceholder: "Rechercher une compétition, pays ou équipe...",
    oddsBoost: "BOOST DE COTES +30%",
    viewLive: "Voir le direct",
    finalizeBet: "Finaliser",
    totalOdds: "Cote totale",
    activeCoupon: "Coupon de Paris actif",
    menu: "Menu",
    topCompetitions: "Hiérarchie des Compétitions",
    gatewaysTitle: "Passerelles Certifiées Haïti",
    rulesAndTerms: "Règles & Conditions d'utilisation",
    adminPanel: "Panneau Admin",
    supportWhatsApp: "Support Officiel Full Bet",
    profile: "Mon Profil",
    linksAndServices: "Liens & Services",
    ticketVerifier: "Vérificateur de Coupon / Fiche",
    privacyPolicy: "Politique de Confidentialité",
    officialSupport: "Support Client Officiel",
    technicalInfo: "Informations techniques",
    certified18: "Plateforme Certifiée 18+",
    instantPayments: "Paiements Instantanés Sécurisés",
    supportDesc: "Assistance 24h/7j pour dépôts, retraits, vérification de fiches et tickets sportifs.",
    legalMentions: "Mentions légales : Full Bet Officiel, plateforme certifiée 18+ et droits réservés.",
    allRightsReserved: "© 2026 Full Bet • Tous droits réservés • Jouez de manière responsable."
  },
  en: {
    sports: "Sports Betting",
    live: "Live",
    upcoming: "Upcoming",
    all: "All",
    new: "NEW",
    secondaryMarkets: "Side Markets",
    downloadApp: "Download App",
    appSubtitle: "Install our fast mobile app",
    selectLanguage: "Select Language",
    mainMarket: "Match Winner (1X2)",
    balance: "Balance",
    betSlip: "Bet Slip",
    deposit: "Deposit",
    withdraw: "Withdraw",
    casino: "Casino & Crash",
    borlette: "Borlette NY/FL",
    searchPlaceholder: "Search competition, country or team...",
    oddsBoost: "ODDS BOOST +30%",
    viewLive: "Watch Live",
    finalizeBet: "Checkout",
    totalOdds: "Total Odds",
    activeCoupon: "Active Bet Slip",
    menu: "Menu",
    topCompetitions: "Competitions Hierarchy",
    gatewaysTitle: "Certified Gateways Haiti",
    rulesAndTerms: "Rules & Terms of Use",
    adminPanel: "Admin Panel",
    supportWhatsApp: "Full Bet Official Support",
    profile: "My Profile",
    linksAndServices: "Links & Services",
    ticketVerifier: "Ticket & Slip Verifier",
    privacyPolicy: "Privacy Policy",
    officialSupport: "Official Customer Support",
    technicalInfo: "Technical Information",
    certified18: "Certified Platform 18+",
    instantPayments: "Instant & Secure Payments",
    supportDesc: "24/7 assistance for deposits, withdrawals, ticket verification and sports slips.",
    legalMentions: "Legal Notice: Full Bet Official, 18+ certified platform with all rights reserved.",
    allRightsReserved: "© 2026 Full Bet • All rights reserved • Gamble responsibly."
  },
  es: {
    sports: "Apuestas Deportivas",
    live: "En Vivo",
    upcoming: "Próximos",
    all: "Todos",
    new: "NUEVO",
    secondaryMarkets: "Mercados Secundarios",
    downloadApp: "Descargar App",
    appSubtitle: "Instala la app móvil rápida",
    selectLanguage: "Seleccionar idioma",
    mainMarket: "Resultado del Partido (1X2)",
    balance: "Saldo",
    betSlip: "Boleto de Apuestas",
    deposit: "Depósito",
    withdraw: "Retiro",
    casino: "Casino y Crash",
    borlette: "Borlette NY/FL",
    searchPlaceholder: "Buscar competición, país o equipo...",
    oddsBoost: "AUMENTO DE CUOTAS +30%",
    viewLive: "Ver en vivo",
    finalizeBet: "Apostar",
    totalOdds: "Cuota Total",
    activeCoupon: "Boleto Activo",
    menu: "Menú",
    topCompetitions: "Jerarquía de Competiciones",
    gatewaysTitle: "Pasarelas Certificadas Haití",
    rulesAndTerms: "Reglas y Términos",
    adminPanel: "Panel de Administrador",
    supportWhatsApp: "Soporte Oficial Full Bet",
    profile: "Mi Perfil",
    linksAndServices: "Enlaces y Servicios",
    ticketVerifier: "Verificador de Boletos / Fichas",
    privacyPolicy: "Política de Privacidad",
    officialSupport: "Soporte Oficial al Cliente",
    technicalInfo: "Información Técnica",
    certified18: "Plataforma Certificada 18+",
    instantPayments: "Pagos Instantáneos y Seguros",
    supportDesc: "Asistencia 24/7 para depósitos, retiros, verificación de boletos y fichas deportivas.",
    legalMentions: "Aviso Legal: Full Bet Oficial, plataforma certificada 18+ y derechos reservados.",
    allRightsReserved: "© 2026 Full Bet • Todos los derechos reservados • Juegue responsablemente."
  },
  pt: {
    sports: "Apostas Esportivas",
    live: "Ao Vivo",
    upcoming: "Próximos",
    all: "Todos",
    new: "NOVO",
    secondaryMarkets: "Mercados Secundários",
    downloadApp: "Baixar Aplicativo",
    appSubtitle: "Instale nosso aplicativo móvel rápido",
    selectLanguage: "Selecionar idioma",
    mainMarket: "Vencedor da Partida (1X2)",
    balance: "Saldo",
    betSlip: "Bilhete de Apostas",
    deposit: "Depósito",
    withdraw: "Saque",
    casino: "Cassino & Crash",
    borlette: "Borlette NY/FL",
    searchPlaceholder: "Pesquisar competição, país ou equipe...",
    oddsBoost: "SUPER COTAS +30%",
    viewLive: "Assistir Ao Vivo",
    finalizeBet: "Finalizar Aposta",
    totalOdds: "Cota Total",
    activeCoupon: "Bilhete de Apostas Ativo",
    menu: "Menu",
    topCompetitions: "Hierarquia de Competições",
    gatewaysTitle: "Gateways Certificados Haiti",
    rulesAndTerms: "Regras & Termos de Uso",
    adminPanel: "Painel de Administração",
    supportWhatsApp: "Suporte Oficial Full Bet",
    profile: "Meu Perfil",
    linksAndServices: "Links & Serviços",
    ticketVerifier: "Verificador de Bilhetes / Apostas",
    privacyPolicy: "Política de Privacidade",
    officialSupport: "Suporte Oficial ao Cliente",
    technicalInfo: "Informações Técnicas",
    certified18: "Plataforma Certificada 18+",
    instantPayments: "Pagamentos Instantâneos e Seguros",
    supportDesc: "Atendimento 24/7 para depósitos, saques, verificação de bilhetes e apostas esportivas.",
    legalMentions: "Aviso Legal: Full Bet Oficial, plataforma certificada 18+ e todos os direitos reservados.",
    allRightsReserved: "© 2026 Full Bet • Todos os direitos reservados • Jogue com responsabilidade."
  }
};

interface LanguageContextType {
  lang: LanguageCode;
  changeLanguage: (newLang: LanguageCode) => void;
  t: (key: string) => string;
  uiTranslations: typeof TRANSLATIONS_UI[LanguageCode];
  successNotification: string | null;
  clearSuccessNotification: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ht',
  changeLanguage: () => {},
  t: (key: string) => key,
  uiTranslations: TRANSLATIONS_UI.ht,
  successNotification: null,
  clearSuccessNotification: () => {}
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LanguageCode>(() => {
    // Lecture de la clé configurée "app_language" ou migration depuis "app_lang"
    const saved = localStorage.getItem(LANGUAGE_SETTINGS.storage_key) || localStorage.getItem('app_lang');
    if (saved && (saved === 'ht' || saved === 'fr' || saved === 'en' || saved === 'es' || saved === 'pt')) {
      return saved as LanguageCode;
    }
    return APP_METADATA.default_language;
  });

  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const changeLanguage = (newLang: LanguageCode) => {
    setLang(newLang);
    try {
      localStorage.setItem(LANGUAGE_SETTINGS.storage_key, newLang);
      localStorage.setItem('app_lang', newLang);
    } catch (e) {
      console.warn('[LanguageContext] Storage non disponible:', e);
    }

    // Notification de succès selon translations_ui
    const msg = TRANSLATIONS_UI[newLang]?.success_message || TRANSLATIONS_UI.ht.success_message;
    setSuccessNotification(msg);
    setTimeout(() => {
      setSuccessNotification(null);
    }, 3200);

    // Synchronisation asynchrone avec le backend endpoint
    try {
      fetch(LANGUAGE_SETTINGS.sync_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: newLang,
          storage_key: LANGUAGE_SETTINGS.storage_key,
          country_code: APP_METADATA.country_code,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Mode déconnecté ou local silencieux
      });
    } catch {
      // Ignorer si hors ligne
    }
  };

  const clearSuccessNotification = () => setSuccessNotification(null);

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['ht']?.[key] || translations['fr']?.[key] || key;
  };

  const uiTranslations = TRANSLATIONS_UI[lang] || TRANSLATIONS_UI.ht;

  return (
    <LanguageContext.Provider value={{
      lang,
      changeLanguage,
      t,
      uiTranslations,
      successNotification,
      clearSuccessNotification
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export const useLanguage = useTranslation;
