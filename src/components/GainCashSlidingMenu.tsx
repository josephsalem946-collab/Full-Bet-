import React, { useState } from 'react';
import {
  X,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowRight,
  Trophy,
  Globe,
  Flame,
  Wallet,
  ShieldCheck,
  FileText,
  User,
  Settings,
  HelpCircle,
  ExternalLink,
  Dices,
  Ticket,
  Smartphone,
  Rocket,
  Zap,
  CircleDot,
  Coins,
  Sparkles,
  Bell,
  Eye,
  EyeOff,
  Receipt,
  Printer,
  ArrowDownCircle,
  Clock,
  QrCode,
  Gamepad2
} from 'lucide-react';
import { UserProfile, GameModule } from '../types';
import { GainCashLogo } from './GainCashLogo';
import { playClickSound } from '../utils/audio';
import { useTranslation, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { formaterEtMasquer } from '../utils/securityMasking';
import { TOP_15_GAMES, GameItem } from '../data/top15Games';
import {
  FULLBET_GAMINGHUB_CONFIG,
  INITIAL_GAMINGHUB_TICKETS,
  GamingHubTicket,
  AGENCY_INFO,
  SUPPORTED_PRINT_FORMATS
} from '../data/gamingHubData';
import { PrintableTicketData } from './TicketPrintModal';
import {
  ALL_MULTILIVE_GAMES,
  DEFAULT_MULTILIVE_GAME_IDS,
  getStoredMultiLiveGames,
  saveStoredMultiLiveGames
} from '../data/multiLiveData';

export type CasinoGameId = 'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix';

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activeModule: GameModule;
  onSelectModule: (mod: GameModule) => void;
  onSelectCasinoGame?: (game: CasinoGameId) => void;
  onSelectLeague: (leagueName: string) => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
  onOpenRules: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenFirebaseLogin?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenOwnerSuperAdmin?: () => void;
  onOpenTop15Modal?: () => void;
  onOpenBetSlip?: () => void;
  onOpenNotifications?: () => void;
  onOpenTicketVerify?: () => void;
  onPrintTicketData?: (ticket: PrintableTicketData) => void;
  onOpenMultiLive?: () => void;
  unreadNotifsCount?: number;
}

interface AccordionSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: {
    name: string;
    badge?: string;
    sport?: string;
  }[];
}

interface CasinoGameItem {
  id: CasinoGameId;
  name: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  iconBg: string;
}

export const GainCashSlidingMenu: React.FC<SlidingMenuProps> = ({
  isOpen,
  onClose,
  user,
  activeModule,
  onSelectModule,
  onSelectCasinoGame,
  onSelectLeague,
  onOpenWallet,
  onOpenRules,
  onOpenAdmin,
  onOpenProfile,
  onOpenFirebaseLogin,
  onOpenDownloadApp,
  onOpenOwnerSuperAdmin,
  onOpenTop15Modal,
  onOpenBetSlip,
  onOpenNotifications,
  onOpenTicketVerify,
  onPrintTicketData,
  onOpenMultiLive,
  unreadNotifsCount = 1
}) => {
  const { t, lang, changeLanguage } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTop15Category, setSelectedTop15Category] = useState<string>('Tous');
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [isBorletteExpanded, setIsBorletteExpanded] = useState<boolean>(false);
  const [isMultiLiveExpanded, setIsMultiLiveExpanded] = useState<boolean>(false);
  const [multiLiveActiveGames, setMultiLiveActiveGames] = useState<string[]>(getStoredMultiLiveGames);
  const [isGamingHubExpanded, setIsGamingHubExpanded] = useState<boolean>(true);
  const [showAllGamingHubTickets, setShowAllGamingHubTickets] = useState<boolean>(false);

  const handlePrintGamingHubTicket = (ticket: GamingHubTicket) => {
    playClickSound();
    if (onPrintTicketData) {
      onPrintTicketData({
        ticketCode: ticket.ticket_id,
        date: new Date(ticket.created_at).toLocaleString('fr-FR'),
        userId: user.id || 'USR-HT-89241',
        gameType: ticket.category_label || 'FULL BET Pari',
        odds: ticket.total_odds || ticket.multiplier_target || 1.0,
        betAmount: ticket.stake_htg || 100,
        potentialPayout: ticket.potential_gain_htg || 15000,
        status: ticket.status as any,
        securityCode: ticket.security_code,
        barcodeData: ticket.barcode_data,
        matches: ticket.matches,
        plays: ticket.plays,
        drawDetails: ticket.draw_details,
        details: ticket.game_title
      });
      onClose();
    } else if (onOpenBetSlip) {
      onOpenBetSlip();
      onClose();
    }
  };

  // Initiales itilizatè pou avatar (Compose CircleShape AccentBlue #1E88E5)
  const userInitials = (user.fullName || 'JB')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'JB';

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'top-pays': true,
    'international-clubs': true,
    'international': false,
    'autres-sports': false
  });

  const toggleSection = (id: string) => {
    playClickSound();
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const casinoGamesList: CasinoGameItem[] = [
    {
      id: 'keno',
      name: '🎯 Keno Officiel (20/80)',
      tagline: 'Tirage 20 boules • Paris Spéciaux',
      badge: '50 000x',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      iconBg: 'from-blue-700 to-indigo-900'
    },
    {
      id: 'luckysix',
      name: '🎱 Lucky Six',
      tagline: 'Loto Visuel 6/48 Officiel',
      badge: '10 000x',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <CircleDot className="w-4 h-4 text-emerald-400" />,
      iconBg: 'from-emerald-600 to-teal-800'
    },
    {
      id: 'luckyx',
      name: '⚡ Lucky X',
      tagline: '50 Boules • Matrice 5×10',
      badge: 'HOT',
      badgeColor: 'bg-cyan-500/20 text-[#00E5FF] border-cyan-500/30',
      icon: <Zap className="w-4 h-4 text-[#00E5FF]" />,
      iconBg: 'from-cyan-600 to-blue-800'
    },
    {
      id: 'crash',
      name: '✈️ Aviator (Spribe)',
      tagline: 'Double mise • Multiplicateur dynamique',
      badge: 'POPULAIRE',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: <Rocket className="w-4 h-4 text-red-400" />,
      iconBg: 'from-red-600 to-amber-700'
    },
    {
      id: 'jetx',
      name: '🚀 JetX (SmartSoft Gaming)',
      tagline: 'Chasseur supersonique • Parachutistes',
      badge: 'SMARTSOFT',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      icon: <Flame className="w-4 h-4 text-yellow-400" />,
      iconBg: 'from-yellow-600 to-amber-800'
    },
    {
      id: 'slots',
      name: '🎰 Slots 777 Vegas',
      tagline: 'Triple Rouleau • Jackpot',
      badge: 'Jackpot',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: <Coins className="w-4 h-4 text-amber-400" />,
      iconBg: 'from-amber-600 to-yellow-700'
    },
    {
      id: 'roulette',
      name: '🎡 Roulette Américaine',
      tagline: 'Double Zéro (0 & 00) • 36 Numéros',
      badge: '36:1',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: <Dices className="w-4 h-4 text-purple-400" />,
      iconBg: 'from-purple-600 to-indigo-800'
    }
  ];

  const accordionData: AccordionSection[] = [
    {
      id: 'top-pays',
      title: 'TOP PAYS & LIGUES MAJEURES',
      icon: <Flame className="w-4 h-4 text-orange-400" />,
      items: [
        { name: 'Angleterre - Premier League', badge: 'En direct' },
        { name: 'Espagne - La Liga', badge: 'Populaire' },
        { name: 'France - Ligue 1', badge: '12 Matchs' },
        { name: 'Italie - Serie A', badge: '8 Matchs' },
        { name: 'Allemagne - Bundesliga', badge: 'Ce soir' },
        { name: 'Portugal - Liga Portugal' }
      ]
    },
    {
      id: 'international-clubs',
      title: 'INTERNATIONAL CLUBS',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      items: [
        { name: 'Ligue des Champions', badge: 'Choc' },
        { name: 'Europa League' },
        { name: 'Conference League' },
        { name: 'Copa Libertadores' },
        { name: 'Copa Sudamericana' }
      ]
    },
    {
      id: 'international',
      title: 'INTERNATIONAL (NATIONS)',
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      items: [
        { name: 'UEFA Nations League' },
        { name: 'Coupe du Monde (Qualifications)' },
        { name: 'Copa America' },
        { name: 'Gold Cup CONCACAF' }
      ]
    },
    {
      id: 'autres-sports',
      title: 'BASKETBALL & AUTRES',
      icon: <Trophy className="w-4 h-4 text-blue-400" />,
      items: [
        { name: 'NBA (Basketball)', badge: 'Live' },
        { name: 'EuroLeague Basketball' },
        { name: 'Tennis - ATP Masters' }
      ]
    }
  ];

  // Filter games if searching
  const filteredGames = searchQuery.trim()
    ? casinoGamesList.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : casinoGamesList;

  // Filter top 15 games
  const filteredTop15Games = TOP_15_GAMES.filter(g => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      g.title.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      (g.badge && g.badge.toLowerCase().includes(q));
    const matchesCat = selectedTop15Category === 'Tous' ||
      g.category.toLowerCase().includes(selectedTop15Category.toLowerCase());
    return matchesSearch && matchesCat;
  });

  // Filter items if searching
  const filteredData = searchQuery.trim()
    ? accordionData
        .map(sec => ({
          ...sec,
          items: sec.items.filter(it => it.name.toLowerCase().includes(searchQuery.toLowerCase()))
        }))
        .filter(sec => sec.items.length > 0)
    : accordionData;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container (Hauteur 100%, Fond Blanc Clair #f8fafc, Colonne verticale divisée en 2 Zones) */}
      <div className="relative w-full max-w-sm sm:w-[320px] h-full bg-[#f8fafc] text-slate-800 flex flex-col z-50 shadow-2xl overflow-hidden border-r border-slate-200 animate-in slide-in-from-left duration-200 font-sans">
        
        {/* ==================================================== */}
        {/* ZONE 1 : FIXE / NON-DÉFILANTE (Hauteur auto / flex-shrink-0) */}
        {/* Reste ancrée en haut et ne bouge JAMAIS au défilement */}
        {/* ==================================================== */}
        <div className="shrink-0 flex flex-col bg-white border-b border-slate-200 shadow-xs z-20">
          
          {/* 1.1 Tèt meni an (Header FULL en or et BET en bleu ciel) */}
          <div className="p-4 bg-white flex items-center justify-between border-b border-slate-200">
            <div>
              <div className="text-2xl font-black tracking-wide leading-none font-display flex items-center gap-1.5">
                {/* FULL en or */}
                <span
                  className="font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.35))' }}
                >
                  FULL
                </span>
                {/* BET en bleu ciel */}
                <span
                  className="font-black bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500 bg-clip-text text-transparent"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(14, 165, 233, 0.35))' }}
                >
                  BET
                </span>
              </div>
              <div className="text-[10px] text-sky-600 font-bold tracking-widest uppercase mt-1">
                PARIS • CASINO • BORLETTE
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notifikasyon bouton */}
              {onOpenNotifications && (
                <button
                  onClick={() => {
                    playClickSound();
                    onClose();
                    onOpenNotifications();
                  }}
                  className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                  title="Notifikasyon"
                  aria-label="Notifikasyon"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-xs">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                }}
                className="p-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base transition-colors cursor-pointer border border-slate-200"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 1.2 Kat Profil Itilizatè Maske (Fond Blanc Clair) */}
          <div className="p-3 bg-white">
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0 ring-2 ring-sky-300">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {isMasked ? formaterEtMasquer(user.fullName, 'nom') : user.fullName}
                      </span>
                      <button
                        onClick={() => {
                          playClickSound();
                          setIsMasked(!isMasked);
                        }}
                        className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                        title={isMasked ? "Afficher informations" : "Masquer informations"}
                      >
                        {isMasked ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                        18+
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isMasked ? formaterEtMasquer(user.phone, 'telephone') : user.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Profile / Auth links */}
                <div className="flex items-center gap-1 shrink-0">
                  {onOpenFirebaseLogin && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFirebaseLogin();
                      }}
                      className="text-[10px] text-amber-700 hover:text-amber-800 font-bold px-1.5 py-1 rounded bg-amber-50 border border-amber-200 cursor-pointer"
                      title="Connexion Firebase"
                    >
                      Auth
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenProfile();
                    }}
                    className="text-[10px] text-sky-700 hover:text-sky-800 font-bold px-2 py-1 rounded bg-sky-50 border border-sky-200 cursor-pointer"
                  >
                    Profil
                  </button>
                </div>
              </div>

              {/* Solde Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block tracking-wider">
                    SOLDE
                  </span>
                  <span className="text-sm font-bold text-emerald-600 font-mono block">
                    {isMasked ? '•••••• HTG' : `${user.balanceHTG.toLocaleString('fr-FR')} HTG`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenWallet('deposit');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Dépôt
                  </button>
                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenWallet('withdraw');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-sky-600 border border-sky-300 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Retrè
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1.3 Barre de recherche */}
          <div className="px-3 pb-3 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder') || 'Rechercher match, sport ou jeu...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 outline-hidden border border-slate-200 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* ZONE 2 : DÉFILANTE (Expanded / ScrollView)            */}
        {/* Fond Blanc Clair #f8fafc                             */}
        {/* ▼ L'utilisateur glisse le doigt ici (Scrollable) ▼  */}
        {/* ==================================================== */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4 bg-[#f8fafc]">
          
          {/* 2.1 MODULES PRINCIPAUX (ModuleDrawerItem matching Compose) */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
              MODULES PRINCIPAUX
            </div>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  playClickSound();
                  onSelectModule('sports');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeModule === 'sports'
                    ? 'bg-sky-50 text-sky-700 border border-sky-400 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
                }`}
              >
                <span className="text-base">⚽</span>
                <span>Paris Sportifs</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  onSelectModule('casino');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeModule === 'casino'
                    ? 'bg-sky-50 text-sky-700 border border-sky-400 shadow-xs'
                    : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
                }`}
              >
                <span className="text-base">🎰</span>
                <span>Casino & Crash</span>
              </button>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    playClickSound();
                    onSelectModule('borlette');
                    setIsBorletteExpanded(!isBorletteExpanded);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeModule === 'borlette'
                      ? 'bg-sky-50 text-sky-700 border border-sky-400 shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">🎟️</span>
                    <span className="truncate">La Borlette Haïtienne</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBorletteExpanded || activeModule === 'borlette' ? 'rotate-180 text-sky-600' : 'text-slate-400'}`} />
                </button>

                {/* Sub-sections Borlette */}
                {(isBorletteExpanded || activeModule === 'borlette') && (
                  <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-sky-300 ml-4 animate-in fade-in duration-150">
                    {[
                      { label: 'Pran Fich (Bolet, Maryaj, Loto)', icon: '✍️' },
                      { label: 'Tirajes New York & Florida', icon: '🗽' },
                      { label: 'Fich Mwen Yo (Historique)', icon: '📄' },
                      { label: 'Rezilta & Estatistik', icon: '📊' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          playClickSound();
                          onSelectModule('borlette');
                          onClose();
                        }}
                        className="w-full text-left flex items-center gap-2 py-1.5 px-2 rounded-md text-[11px] text-slate-600 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                      >
                        <span className="text-xs">{sub.icon}</span>
                        <span className="truncate font-medium">{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-Live Gri (2x2 Multi-View ak opsyon ajoute / retire jwèt) */}
              <div className="space-y-1">
                <div className="flex items-stretch gap-1">
                  {/* Main Launch Button */}
                  <button
                    onClick={() => {
                      playClickSound();
                      if (onOpenMultiLive) onOpenMultiLive();
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#1a202c] hover:from-[#161b22] hover:to-[#21262d] text-white border border-emerald-500/40 shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base">📺</span>
                      <div className="text-left">
                        <span className="truncate block font-black text-white group-hover:text-emerald-300 transition-colors">
                          Multi-Live Gri
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {multiLiveActiveGames.length} jwèt aktif nan gri an
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#ff3333] text-white animate-pulse">
                        LIVE
                      </span>
                      <span className="text-[9px] font-mono text-[#00ff88] font-bold">
                        ● ONLINE
                      </span>
                    </div>
                  </button>

                  {/* Toggle customize panel */}
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsMultiLiveExpanded(!isMultiLiveExpanded);
                    }}
                    className={`px-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                      isMultiLiveExpanded
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#161b22] hover:bg-[#21262d] text-slate-300 border-slate-700'
                    }`}
                    title={isMultiLiveExpanded ? "Fèmen konfigirasyon an" : "Pèsonalize jwèt yo (Ajoute / Retire)"}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMultiLiveExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Multi-Live Game Customizer Sub-panel */}
                {isMultiLiveExpanded && (
                  <div className="p-3 bg-[#0d131f] border border-emerald-500/30 rounded-xl space-y-2.5 text-white animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        Pèsonalize Jwèt nan Gri an :
                      </span>
                      <button
                        onClick={() => {
                          playClickSound();
                          setMultiLiveActiveGames(DEFAULT_MULTILIVE_GAME_IDS);
                          saveStoredMultiLiveGames(DEFAULT_MULTILIVE_GAME_IDS);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                        title="Remèt 4 jwèt pa defo yo"
                      >
                        4 pa defo
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Klike sou yon jwèt pou <strong>ajoute</strong> oubyen <strong>retire</strong> l nan gri milti-vi an (1 jiska 6 jwèt) :
                    </p>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
                      {ALL_MULTILIVE_GAMES.map((game) => {
                        const isSelected = multiLiveActiveGames.includes(game.id);

                        return (
                          <div
                            key={game.id}
                            onClick={() => {
                              playClickSound();
                              setMultiLiveActiveGames((prev) => {
                                let next: string[];
                                if (prev.includes(game.id)) {
                                  if (prev.length <= 1) {
                                    alert("Ou dwe kenbe omwen yon (1) jwèt nan gri an !");
                                    return prev;
                                  }
                                  next = prev.filter(id => id !== game.id);
                                } else {
                                  if (prev.length >= 6) {
                                    alert("Ou ka chwazi jiska 6 jwèt maksimòm nan gri an !");
                                    return prev;
                                  }
                                  next = [...prev, game.id];
                                }
                                saveStoredMultiLiveGames(next);
                                return next;
                              });
                            }}
                            className={`p-2 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-white'
                                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base">{game.icon}</span>
                              <div className="truncate">
                                <span className={`font-bold block ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                  {game.name}
                                </span>
                                <span className="text-[9px] text-slate-500 block truncate">
                                  {game.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isSelected ? '✓ Aktif' : '+ Ajoute'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Launch Action */}
                    <button
                      onClick={() => {
                        playClickSound();
                        if (onOpenMultiLive) onOpenMultiLive();
                        onClose();
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer mt-1"
                    >
                      <span>Ouvri Gri an ({multiLiveActiveGames.length} jwèt)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 2.2 GAMINGHUB HAÏTI • KARAKTERISTIK OFISYÈL         */}
          {/* ==================================================== */}
          <div className="rounded-2xl bg-[#0D131F] border border-emerald-500/30 text-white p-3 shadow-md space-y-3">
            {/* Header: GamingHub Haïti Branding */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xs">
                  <Gamepad2 className="w-4 h-4 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wider text-white">
                      GAMINGHUB HAÏTI
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      HT 🇭🇹
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {FULLBET_GAMINGHUB_CONFIG.platform.name} • Modil Ofisyèl
                  </span>
                </div>
              </div>

              {/* Toggle expand/collapse */}
              <button
                onClick={() => {
                  playClickSound();
                  setIsGamingHubExpanded(!isGamingHubExpanded);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={isGamingHubExpanded ? "Fèmen detay yo" : "Ouvri detay yo"}
              >
                {isGamingHubExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {isGamingHubExpanded && (
              <>
                {/* 1. Rezime 3 Kategori Jwèt Yo (Dashboard Summary) */}
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>{FULLBET_GAMINGHUB_CONFIG.dashboard_summary.categories_summary.title}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-mono text-[9px] font-bold">
                      <Zap className="w-3 h-3 animate-pulse fill-amber-400" />
                      <span>{FULLBET_GAMINGHUB_CONFIG.dashboard_summary.active_tickets_indicator.badge_text}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {FULLBET_GAMINGHUB_CONFIG.dashboard_summary.categories_summary.categories.map((cat) => {
                      let badgeClass = 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
                      let iconSymbol = <Dices className="w-3.5 h-3.5 text-cyan-400" />;
                      let subtitle = cat.available_draws?.slice(0, 2).join(', ') || '';

                      if (cat.id === 'paryaj_espotif') {
                        badgeClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
                        iconSymbol = <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
                        subtitle = cat.popular_sports?.slice(0, 2).join(', ') || '';
                      } else if (cat.id === 'kazino_jwèt') {
                        badgeClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30';
                        iconSymbol = <Flame className="w-3.5 h-3.5 text-purple-400" />;
                        subtitle = cat.quick_access_games?.slice(0, 2).join(', ') || '';
                      }

                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            playClickSound();
                            if (cat.action_url === '/bolet') onSelectModule('borlette');
                            else if (cat.action_url === '/sports') onSelectModule('sports');
                            else if (cat.action_url === '/casino') onSelectModule('casino');
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-[#121927] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between text-left cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1 w-full">
                            {iconSymbol}
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black font-mono border ${badgeClass}`}>
                              {cat.active_items_count}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 truncate w-full">
                            {cat.name}
                          </div>
                          <div className="text-[8px] text-slate-500 truncate w-full">
                            {subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Tikè Ki Valide Kounye A (Active Tickets Section) */}
                <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                    <span>{FULLBET_GAMINGHUB_CONFIG.active_tickets_section.title} ({FULLBET_GAMINGHUB_CONFIG.active_tickets_section.total_active})</span>
                    <button
                      onClick={() => setShowAllGamingHubTickets(!showAllGamingHubTickets)}
                      className="text-[9px] text-emerald-400 hover:underline font-mono cursor-pointer"
                    >
                      {showAllGamingHubTickets ? 'Kache' : 'Wè Tout'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {(showAllGamingHubTickets
                      ? FULLBET_GAMINGHUB_CONFIG.active_tickets_section.tickets
                      : FULLBET_GAMINGHUB_CONFIG.active_tickets_section.tickets.slice(0, 2)
                    ).map((ticket) => {
                      const matchingHubTicket = INITIAL_GAMINGHUB_TICKETS.find(t => t.ticket_id === ticket.ticket_id);
                      return (
                        <div
                          key={ticket.ticket_id}
                          className="p-2 rounded-xl bg-[#121927] border border-slate-800/80 hover:border-emerald-500/40 transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-[10px] text-amber-400">
                                {ticket.ticket_id}
                              </span>
                              <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold truncate">
                                {ticket.category_label}
                              </span>
                              <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                                {ticket.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-200 font-bold truncate mt-0.5">
                              {ticket.lottery_name || ticket.sport} • {ticket.game_type || ticket.bet_type}
                              {ticket.bet_details.combination && (
                                <span className="text-amber-300 ml-1">({ticket.bet_details.combination})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono mt-0.5">
                              <span>Miz: <strong className="text-white">{ticket.financials.stake_formatted}</strong></span>
                              <span>•</span>
                              <span>Gain: <strong className="text-emerald-400">{ticket.financials.potential_win_formatted}</strong></span>
                            </div>
                          </div>

                          {matchingHubTicket && (
                            <button
                              onClick={() => handlePrintGamingHubTicket(matchingHubTicket)}
                              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Enprime fich sa a sou enprimant POS"
                            >
                              <Printer className="w-3 h-3" />
                              <span className="text-[9px] font-bold font-mono">POS</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Bottom Actions: Retrè, Istorik, Verifye */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80 text-[10px]">
                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenWallet('withdraw');
                    }}
                    className="py-1.5 px-1 rounded-lg bg-[#121927] hover:bg-rose-950/40 text-rose-400 border border-rose-500/20 font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3 h-3 text-rose-400" />
                    <span>Retrè</span>
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenBetSlip?.();
                    }}
                    className="py-1.5 px-1 rounded-lg bg-[#121927] hover:bg-amber-950/40 text-amber-400 border border-amber-500/20 font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Istorik</span>
                  </button>

                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenTicketVerify?.();
                    }}
                    className="py-1.5 px-1 rounded-lg bg-[#121927] hover:bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3 h-3 text-cyan-400" />
                    <span>Verifye</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 2.3 FULL BET - Top 15 Jwèt Casino & Arcade Directs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>FULL BET - Top 15 Jwèt Casino & Arcade</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-600 font-mono font-bold">15 Jwèt</span>
                {onOpenTop15Modal && (
                  <button
                    onClick={() => {
                      playClickSound();
                      onClose();
                      onOpenTop15Modal();
                    }}
                    className="text-[9px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold border border-sky-200 transition-colors cursor-pointer"
                  >
                    Ekran Konplè ↗
                  </button>
                )}
              </div>
            </div>

            {/* Filtres rapides par catégorie */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] scrollbar-none">
              {['Tous', 'Machine à Sous', 'Casino en Direct', 'Jeu Crash', 'Live Show', 'Stratégie & Table', 'Jackpot'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedTop15Category(cat)}
                  className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    selectedTop15Category === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {cat === 'Tous' ? 'Tout (15)' : cat}
                </button>
              ))}
            </div>

            {/* Lis 15 Jwèt yo */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredTop15Games.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  Pa gen jwèt ki koresponn ak rechèch la.
                </div>
              ) : (
                filteredTop15Games.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      playClickSound();
                      if (game.targetModule === 'sports') {
                        onSelectModule('sports');
                      } else if (game.casinoId && onSelectCasinoGame) {
                        onSelectCasinoGame(game.casinoId);
                        onSelectModule('casino');
                      } else {
                        onSelectModule('casino');
                      }
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-sky-300 transition-all cursor-pointer group flex flex-col gap-1.5 shadow-xs"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                          {game.emoji}
                        </span>
                        <span className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors truncate">
                          {game.id}. {game.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                        {game.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 pl-0.5">
                      {game.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] w-full">
                      <span className="text-emerald-600 font-mono font-bold">
                        {game.badge || game.multiplier || 'Direct'}
                      </span>
                      <span className="text-sky-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Jwe Kounye a</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2.3 Sélecteur de Langue */}
          <div className="rounded-xl bg-white p-3 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>{t('selectLanguage')}</span>
              </span>
              <span className="text-[10px] text-sky-600 font-mono font-bold uppercase">{lang}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    playClickSound();
                    changeLanguage(item.code as LanguageCode);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    lang === item.code
                      ? 'bg-sky-50 text-sky-700 border-2 border-sky-500 shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span className="text-sm">{item.flag}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2.4 Compétitions avec accordéons */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              {t('topCompetitions')}
            </div>

            {filteredData.map((section) => {
              const isExpanded = expandedSections[section.id] ?? false;

              return (
                <div key={section.id} className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
                  {/* Accordion Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {section.icon}
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 py-1 px-1 border-t border-slate-200">
                      {section.items.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            playClickSound();
                            onSelectLeague(item.name);
                            onSelectModule('sports');
                            onClose();
                          }}
                          className="w-full flex items-center justify-between px-3 py-1.5 text-left text-xs text-slate-700 hover:text-sky-600 hover:bg-slate-100 rounded-md transition-colors group cursor-pointer"
                        >
                          <span className="truncate pr-2 font-medium">{item.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2.5 PASSERELLES CERTIFIÉES HAÏTI */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              PASSERELLES SÉCURISÉES EN LIGNE
            </div>
            <div className="space-y-1.5">
              <div className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">Natcash online</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">(+509 •••• ••••) • Ligne Sécurisée</div>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono shrink-0">Min 25 HTG</span>
              </div>

              <div className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">Moncash online</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">(+509 •••• ••••) • Ligne Sécurisée</div>
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono shrink-0">Min 25 HTG</span>
              </div>
            </div>

            {/* Assistance WhatsApp & Support Full Bet */}
            <a
              href="mailto:fullbet509@gmail.com?subject=Demande%20de%20support%20-%20Full%20Bet"
              className="flex items-center justify-between w-full p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-colors gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate">{t('supportWhatsApp')}</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </a>
          </div>

          {/* 2.6 ADMINISTRATION & RÈGLES */}
          <div className="space-y-1 pt-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
              ADMINISTRATION & RÈGLES
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenBetSlip?.();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-left"
              >
                <span className="text-sm shrink-0">🎫</span>
                <span className="truncate flex-1 min-w-0">Mes Paris / Tickets en Cours (Panier)</span>
              </button>

              {onOpenTicketVerify && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenTicketVerify();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-left gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-sm shrink-0">🔍</span>
                    <span className="truncate">Verifye yon Tikè (FB-XXXX-YYYY)</span>
                  </div>
                  <span className="text-[9px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-mono font-bold">
                    QR / Code
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenNotifications?.();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-left gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <span className="text-sm">🔔</span>
                    {unreadNotifsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#E53935]" />
                    )}
                  </div>
                  <span className="truncate">Notifications & Alertes ({unreadNotifsCount} Non lue)</span>
                </div>
                {unreadNotifsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#E53935] shrink-0" />
                )}
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenRules();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-left"
              >
                <span className="text-sm shrink-0">📄</span>
                <span className="truncate flex-1 min-w-0">Règles & Conditions d'utilisation</span>
              </button>

              {onOpenOwnerSuperAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenOwnerSuperAdmin();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer text-left gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm shrink-0">🛡️</span>
                    <span className="truncate">Panneau Propriétaire 2FA (HQ)</span>
                  </div>
                  <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-200 shrink-0 font-bold">OWNER</span>
                </button>
              )}
            </div>
          </div>

          {/* 2.7 Téléchargement App & Footer */}
          <div className="pt-2 space-y-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-900">{t('downloadApp')}</p>
                <p className="text-[11px] text-slate-500">{t('appSubtitle')}</p>
              </div>
              <button
                onClick={() => {
                  playClickSound();
                  if (onOpenDownloadApp) {
                    onClose();
                    onOpenDownloadApp();
                  }
                }}
                className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(14,165,233,0.3)] transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-white" />
                <span>{t('downloadApp')} (.APK / iOS)</span>
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-100/80 border border-slate-200 text-[10px] text-slate-500 text-center space-y-1">
              <div>
                <span>Full Bet Officiel (fullbet.com) • Support : </span>
                <a href="mailto:fullbet509@gmail.com" className="text-sky-600 hover:underline font-mono font-bold">
                  fullbet509@gmail.com
                </a>
              </div>
              <div className="text-[9px] text-slate-400">
                Plateforme certifiée 18+ • Tous droits réservés
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
