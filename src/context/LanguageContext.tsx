import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'fr' | 'ht' | 'en' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ht', label: 'Kreyòl', flag: '🇭🇹' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  fr: {
    sports: "Paris Sportifs",
    live: "En Direct",
    upcoming: "À Venir",
    all: "Tous",
    new: "NOUVEAU",
    secondaryMarkets: "Marchés complémentaires",
    downloadApp: "Télécharger l'App",
    appSubtitle: "Installez l'application mobile rapide",
    selectLanguage: "Choisir la langue",
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
    profile: "Mon Profil"
  },
  ht: {
    sports: "Paryaj Espòtif",
    live: "An Dirèk",
    upcoming: "K ap Vini",
    all: "Tout",
    new: "NOUVO",
    secondaryMarkets: "Lòt Mache yo",
    downloadApp: "Telechaje Aplikasyon an",
    appSubtitle: "Enstale aplikasyon mobil rapid la",
    selectLanguage: "Chwazi lang",
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
    profile: "Pwofil Mwen"
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
    profile: "My Profile"
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
    selectLanguage: "Seleccionar Idioma",
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
    profile: "Mi Perfil"
  }
};

interface LanguageContextType {
  lang: LanguageCode;
  changeLanguage: (newLang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'fr',
  changeLanguage: () => {},
  t: (key: string) => key
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('app_lang');
    if (saved === 'fr' || saved === 'ht' || saved === 'en' || saved === 'es') {
      return saved;
    }
    return 'fr';
  });

  const changeLanguage = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export const useLanguage = useTranslation;
