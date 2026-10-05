import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Trophy,
  Activity,
  Sparkles,
  SlidersHorizontal,
  Lock,
  Trash2,
  Ticket,
  Maximize2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { MatchEvent, BetSlipItem, SportType, SideMarketItem } from '../types';
import { playClickSound, playWinSound } from '../utils/audio';
import { ScrollToTopButton } from './ScrollToTopButton';
import { NewBadge } from './NewBadge';
import { DynamicAdBanner } from './DynamicAdBanner';
import { useTranslation } from '../context/LanguageContext';
import { useFeatures } from '../context/FeaturesContext';
import { FUN_BETS_ITEMS, FUN_BETS_SUB_CATEGORIES, FunBetItem } from '../data/funBetsData';

interface SportsScreenProps {
  matches: MatchEvent[];
  selectedBets: BetSlipItem[];
  onToggleBetSelection: (item: BetSlipItem) => void;
  selectedLeagueFilter?: string | null;
  onClearLeagueFilter: () => void;
  onOpenBetSlip: () => void;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onNavigateModule?: (mod: 'sports' | 'casino' | 'borlette') => void;
}

export const SportsScreen: React.FC<SportsScreenProps> = ({
  matches,
  selectedBets,
  onToggleBetSelection,
  selectedLeagueFilter,
  onClearLeagueFilter,
  onOpenBetSlip,
  isAdmin = false,
  onOpenAdmin,
  onNavigateModule
}) => {
  const { t } = useTranslation();
  const { banners, isMatchLocked, isGameActive, getGameMaintenanceMessage } = useFeatures();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'fun-bets'>('all');
  const [funBetsCategory, setFunBetsCategory] = useState<string>('all_fun');
  const [activeSport, setActiveSport] = useState<SportType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveMinuteTick, setLiveMinuteTick] = useState(0);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({
    'm-uefa-1': true,
    'match_classic_fr': true
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live timer tick simulation for active matches
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMinuteTick(prev => (prev + 1) % 90);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const toggleMarkets = (matchId: string) => {
    playClickSound();
    setExpandedMarkets(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  const isSelected = (matchId: string, marketName: string, selectionName: string): boolean => {
    return selectedBets.some(
      b => b.matchId === matchId && b.marketName === marketName && b.selectionName === selectionName
    );
  };

  // Filter matches
  const filteredMatches = matches.filter(match => {
    // League filter
    if (selectedLeagueFilter && !match.league.toLowerCase().includes(selectedLeagueFilter.toLowerCase())) {
      return false;
    }
    // Tab filter
    if (activeTab === 'live' && !match.isLive) return false;
    if (activeTab === 'upcoming' && match.isLive) return false;

    // Sport filter
    if (activeSport !== 'all' && match.sport !== activeSport) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${match.homeTeam} ${match.awayTeam} ${match.league} ${match.country}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  const liveCount = matches.filter(m => m.isLive).length;
  const footballCount = matches.filter(m => m.sport === 'football').length;
  const basketballCount = matches.filter(m => m.sport === 'basketball').length;
  const tennisCount = matches.filter(m => m.sport === 'tennis').length;

  const totalRate = selectedBets.reduce((acc, b) => acc * b.rate, 1);

  // Fun Bets filter and selection handler
  const filteredFunBets = FUN_BETS_ITEMS.filter(item => {
    if (funBetsCategory !== 'all_fun' && item.category_id !== funBetsCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const text = `${item.title} ${item.description} ${item.match.home_team} ${item.match.away_team} ${item.match.league} ${item.category_label}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const handleToggleFunBet = (item: FunBetItem) => {
    playClickSound();
    onToggleBetSelection({
      matchId: item.match.id,
      matchTitle: `${item.match.home_team} vs ${item.match.away_team}`,
      league: `${item.match.league} [${item.badge.text}]`,
      marketName: item.title,
      selectionName: item.market.selection_name,
      rate: item.odds.current
    });
  };

  // Sports list for Zone 2 horizontal scroll
  const sportsCategories = [
    { id: 'all', label: t('all'), icon: '🏆', count: matches.length },
    { id: 'football', label: 'Football', icon: '⚽', count: footballCount || 42 },
    { id: 'basketball', label: 'Basketball', icon: '🏀', count: basketballCount || 11 },
    { id: 'tennis', label: 'Tennis', icon: '🎾', count: tennisCount || 18 },
    { id: 'rugby', label: 'Rugby', icon: '🏉', count: 5 },
    { id: 'esports', label: 'eSports', icon: '🎮', count: 14 },
    { id: 'f1', label: 'Formule 1', icon: '🏎️', count: 2 },
    { id: 'mma', label: 'MMA / Boxe', icon: '🥊', count: 6 },
    { id: 'baseball', label: 'Baseball', icon: '⚾', count: 8 },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐', count: 4 }
  ];

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-60px)] pb-36 sm:pb-32 pt-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4">
        
        {/* Dynamic Ad Banner / Promo Showcase (HTML/CSS, Google AdSense, Régie Publicitaire) */}
        <DynamicAdBanner
          banner={banners && banners.length > 0 ? banners[0] : undefined}
          isAdmin={isAdmin}
          onEditBanner={onOpenAdmin}
          onNavigate={(dest) => {
            if (dest === 'sports' || dest === 'casino' || dest === 'borlette') {
              onNavigateModule?.(dest);
            } else if (dest === 'live') {
              setActiveTab('live');
            }
          }}
        />

        {/* Selected League Filter Tag if active from Drawer */}
        {selectedLeagueFilter && (
          <div className="flex items-center justify-between bg-blue-950/40 border border-blue-600/40 rounded-xl px-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-blue-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Filtre actif : <strong className="text-white">{selectedLeagueFilter}</strong></span>
            </div>
            <button
              onClick={onClearLeagueFilter}
              className="text-[#00E5FF] hover:text-white font-semibold underline underline-offset-2"
            >
              Afficher tout
            </button>
          </div>
        )}

        {/* Navigation Bar matching navigation_bar spec */}
        <div className="flex items-center justify-between gap-2 bg-[#0D111A] p-2 rounded-2xl border border-[#1E2638] shadow-md">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* Tab: Tous */}
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-[#1E88E5]/20 text-white border border-[#1E88E5]/60 shadow-[0_2px_10px_rgba(30,136,229,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>Tous</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300">
                142
              </span>
            </button>

            {/* Tab: En Direct (Live) */}
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('live');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'live'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/60 shadow-[0_2px_10px_rgba(239,68,68,0.3)]'
                  : 'text-slate-400 hover:text-red-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span>En Direct</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600 text-white leading-none">
                LIVE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300">
                14
              </span>
            </button>

            {/* Tab: À Venir */}
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('upcoming');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'upcoming'
                  ? 'bg-[#1E88E5]/20 text-white border border-[#1E88E5]/60 shadow-[0_2px_10px_rgba(30,136,229,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>À Venir</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300">
                48
              </span>
            </button>

            {/* Tab: Fun Bets (Special styling with gradient, glow & lightning) */}
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('fun-bets');
              }}
              style={{
                background: activeTab === 'fun-bets'
                  ? 'linear-gradient(135deg, #7E22CE 0%, #4F46E5 100%)'
                  : 'rgba(126, 34, 206, 0.15)',
                borderColor: 'rgba(168, 85, 247, 0.4)',
                boxShadow: activeTab === 'fun-bets' ? '0 4px 14px rgba(126, 34, 206, 0.35)' : 'none'
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                activeTab === 'fun-bets'
                  ? 'text-[#F3E8FF] ring-1 ring-purple-400/50'
                  : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              {/* Lightning SVG M13 2L3 14h7v8l11-12h-8l1-8z */}
              <svg className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h7v8l11-12h-8l1-8z" />
              </svg>
              <span>Fun Bets</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 leading-none">
                NEW
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/50 text-purple-200">
                18
              </span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative hidden md:block w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#131b2e] text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-8 pr-3 py-1.5 outline-hidden focus:ring-1 focus:ring-[#1E88E5] border border-slate-700/60"
            />
          </div>
        </div>

        {/* ===================== ZONE 2 & 3 OR FUN BETS SECTION ===================== */}
        {activeTab === 'fun-bets' ? (
          /* ===================== FUN BETS SECTION (fun_bets_section spec) ===================== */
          <section className="space-y-4 animate-in fade-in duration-200">
            {/* Fun Bets Header Showcase */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#7E22CE]/30 via-[#4F46E5]/20 to-[#0D111A] border border-purple-500/40 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] shrink-0">
                  <div className="w-full h-full rounded-[14px] bg-[#0D111A] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#F59E0B]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h7v8l11-12h-8l1-8z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Fun Bets & Evènman Ensolit
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                      NEW
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Selebrasyon espesyal, aksyon raman wè, pèfòmans ekstraòdinè ak mega kòt boosté !
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-xs font-mono text-purple-300 font-bold bg-purple-950/80 border border-purple-800/80 px-3 py-1.5 rounded-xl">
                  {filteredFunBets.length} pari seleksyone
                </div>
              </div>
            </div>

            {/* Sub Categories Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {FUN_BETS_SUB_CATEGORIES.map(subCat => {
                const isActive = funBetsCategory === subCat.id;
                return (
                  <button
                    key={subCat.id}
                    onClick={() => {
                      playClickSound();
                      setFunBetsCategory(subCat.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#7E22CE] to-[#4F46E5] text-white shadow-[0_2px_12px_rgba(126,34,206,0.4)] border border-purple-400/50'
                        : 'bg-[#0D111A] text-slate-400 hover:text-white border border-[#1E2638] hover:bg-white/5'
                    }`}
                  >
                    <span>{subCat.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/40 text-purple-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {subCat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Fun Bets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFunBets.map(item => {
                const isItemInSlip = isSelected(item.match.id, item.title, item.market.selection_name);
                const startTimeFormatted = new Date(item.match.start_time).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[#0D111A] border border-[#1E2638] hover:border-purple-500/40 transition-all shadow-md flex flex-col justify-between gap-3 group relative overflow-hidden"
                  >
                    {/* Top Row: Sport, League, Badge */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 font-bold border border-slate-700/60 text-[11px] truncate">
                          {item.match.sport === 'Football' ? '⚽' : '🏀'} {item.match.league}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                          {startTimeFormatted}
                        </span>
                      </div>

                      {/* Custom Badge */}
                      <span
                        style={{
                          backgroundColor: item.badge.color_bg,
                          color: item.badge.color_text
                        }}
                        className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full font-mono shrink-0 shadow-xs"
                      >
                        {item.badge.text}
                      </span>
                    </div>

                    {/* Middle: Teams & Title & Description */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                        <span className="text-white font-bold">{item.match.home_team}</span>
                        <span>vs</span>
                        <span className="text-white font-bold">{item.match.away_team}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-amber-400 group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Popularity Gauge */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Popilarite jwè yo :</span>
                        </span>
                        <span className="font-bold text-amber-400">{item.popularity_score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                          style={{ width: `${item.popularity_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Selection details and Odds Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-400 leading-tight">
                        <span className="block text-slate-300 font-semibold truncate">
                          {item.market.selection_name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Min: {item.market.min_stake} € • Max: {item.market.max_stake} €
                        </span>
                      </div>

                      {/* Odds Button */}
                      <button
                        onClick={() => handleToggleFunBet(item)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-md shrink-0 ${
                          isItemInSlip
                            ? 'bg-[#28a745] text-white font-black shadow-[0_0_12px_rgba(40,167,69,0.5)] border border-[#28a745]'
                            : 'bg-gradient-to-r from-[#7E22CE] to-[#4F46E5] hover:from-purple-600 hover:to-indigo-500 text-white border border-purple-400/40'
                        }`}
                        title="Klike pou mete nan fich ou"
                      >
                        {isItemInSlip ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                            <span className="font-mono">{item.odds.current.toFixed(2)}</span>
                          </>
                        ) : (
                          <>
                            {item.odds.is_boosted && (
                              <span className="line-through text-purple-200/70 font-mono text-[10px]">
                                {item.odds.previous.toFixed(2)}
                              </span>
                            )}
                            <span className="font-mono text-sm font-black text-amber-300">
                              {item.odds.current.toFixed(2)}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            {/* ===================== ZONE 2 : NAVIGATION DES SPORTS (SCROLL HORIZONTAL) ===================== */}
            {/* Règle : Hauteur fixe (50px), défilement horizontal sans contrainte, flex-shrink: 0 */}
            <nav
              className="sports-nav h-[50px] shrink-0 bg-[#0e1628] rounded-xl border border-slate-800/80 flex items-center overflow-x-auto whitespace-nowrap no-scrollbar px-2 gap-2 shadow-inner"
              aria-label="Sports navigation"
            >
          {sportsCategories.map(sport => {
            const isSportActive = activeSport === sport.id;
            return (
              <button
                key={sport.id}
                onClick={() => {
                  playClickSound();
                  setActiveSport(sport.id as SportType | 'all');
                }}
                className={`sport-item inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSportActive
                    ? 'active bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 bg-[#131e36]/60 border border-slate-800'
                }`}
              >
                <span>{sport.icon}</span>
                <span>{sport.label}</span>
                <span className="text-[10px] font-mono-num px-1.5 py-0.2 rounded-full bg-black/40 text-slate-300">
                  {sport.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Matches Feed Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t('sports')} ({filteredMatches.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-600 font-semibold">
            Cotes en direct • Clic pour ajouter au coupon
          </span>
        </div>

        {/* ===================== ZONE 3 : LISTE DES MATCHS (ESPACE FLEXIBLE & DÉFILEMENT) ===================== */}
        {/* Règle : flex: 1, min-width: 0 sur le conteneur des équipes pour éviter le bug d'écrasement en flexbox */}
        <main className="matches-list flex-1 space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center bg-[#0c1322] rounded-2xl text-slate-400 text-sm">
              Aucun match ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            filteredMatches.map(match => {
              const match1X2 = match.odds['1X2'] || [];
              const isMarketsExpanded = expandedMarkets[match.id] ?? false;

              // Compile side markets
              const sideMarketsList: SideMarketItem[] = match.sideMarkets && match.sideMarkets.length > 0
                ? match.sideMarkets
                : [
                    ...(match.odds.totalGoals && match.odds.totalGoals.length > 0 ? [{
                      id: 'total_goals',
                      name: 'Total de buts (Plus / Moins de 2.5)',
                      odds: match.odds.totalGoals.map(o => ({ label: o.name, value: o.rate }))
                    }] : []),
                    ...(match.odds.doubleChance && match.odds.doubleChance.length > 0 ? [{
                      id: 'double_chance',
                      name: 'Double Chance',
                      odds: match.odds.doubleChance.map(o => ({ label: o.name, value: o.rate }))
                    }] : []),
                    ...(match.odds.btts && match.odds.btts.length > 0 ? [{
                      id: 'btts',
                      name: 'Les 2 équipes marquent (BTTS)',
                      odds: match.odds.btts.map(o => ({ label: o.name, value: o.rate }))
                    }] : [])
                  ];

              return (
                <article
                  key={match.id}
                  className="match-card"
                >
                  {/* Match Header (.match-header) */}
                  <div className="match-header">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-bold text-slate-800 truncate">{match.league}</span>
                      <NewBadge isNew={match.isNew} createdAt={match.createdAt} />
                      <span className="text-slate-400 shrink-0">•</span>
                      <span className="text-slate-500 shrink-0 text-xs">{match.country}</span>
                    </div>

                    {match.isLive ? (
                      <div className="live-badge flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span>{match.minute ? `${match.minute}'` : 'LIVE'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px] shrink-0 ml-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{match.startTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Match Teams & Live Scores (.teams-container & .team-row) */}
                  <div className="teams-container">
                    {/* Home Team */}
                    <div className="team-row">
                      <span
                        className="truncate block min-w-0 text-slate-900"
                        title={match.homeTeam}
                      >
                        {match.homeTeam}
                      </span>
                      {match.isLive ? (
                        <span className="score">
                          {match.homeScore ?? 0}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 font-mono">VS</span>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="team-row">
                      <span
                        className="truncate block min-w-0 text-slate-900"
                        title={match.awayTeam}
                      >
                        {match.awayTeam}
                      </span>
                      {match.isLive ? (
                        <span className="score">
                          {match.awayScore ?? 0}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Lock Warning if Match is disabled by Super-Admin */}
                  {isMatchLocked(match.id) && (
                    <div className="my-2 p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Paris temporairement suspendus sur cette rencontre par la direction.</span>
                    </div>
                  )}

                  {/* ===================== ZONE 4 : GRILLE DE COTES (.odds-grid & .odd-box) ===================== */}
                  <div className="mt-1 pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">
                      {t('mainMarket')}
                    </div>

                    <div className="odds-grid button-group">
                      {match1X2.map(odd => {
                        const active = isSelected(match.id, '1X2', odd.name);
                        const matchLocked = isMatchLocked(match.id);
                        const symbol = odd.name === 'N' ? 'X' : odd.name;
                        const teamAbbr = odd.name === '1'
                          ? match.homeTeam.slice(0, 3).toUpperCase()
                          : odd.name === '2'
                          ? match.awayTeam.slice(0, 3).toUpperCase()
                          : 'NUL';

                        return (
                          <button
                            key={odd.id}
                            disabled={matchLocked}
                            onClick={() => {
                              if (matchLocked) return;
                              playClickSound();
                              onToggleBetSelection({
                                matchId: match.id,
                                matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                                league: match.league,
                                marketName: '1X2',
                                selectionName: odd.name,
                                rate: odd.rate
                              });
                            }}
                            className={`bet-button odd-box ${active ? 'active' : ''} ${
                              matchLocked ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={`Parye ${symbol} (${teamAbbr}) - Kòt: ${odd.rate.toFixed(2)}`}
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <span className={`text-xs font-black px-1.5 py-0.5 rounded transition-colors ${
                                active ? 'bg-white text-[#28a745] font-black' : 'bg-slate-700/80 text-white'
                              }`}>
                                {symbol}
                              </span>
                              <span className="odd-label text-[11px] truncate font-semibold">
                                {teamAbbr}
                              </span>
                            </div>
                            <div className="odd-value font-mono text-sm sm:text-base font-black">
                              {odd.rate.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Side Markets (Marchés complémentaires) Expandable Accordion */}
                  {sideMarketsList.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => toggleMarkets(match.id)}
                        className="w-full flex items-center justify-between py-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                          <span>{t('secondaryMarkets')}</span>
                          <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[10px] font-mono border border-sky-200 font-bold">
                            +{sideMarketsList.length}
                          </span>
                        </div>
                        {isMarketsExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {isMarketsExpanded && (
                        <div className="mt-2 space-y-2.5 animate-fadeIn">
                          {sideMarketsList.map(market => (
                            <div key={market.id} className="bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                                {market.name}
                              </span>
                              <div className={`grid gap-2 ${market.odds.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {market.odds.map(odd => {
                                  const active = isSelected(match.id, market.name, odd.label);
                                  return (
                                    <button
                                      key={`${market.id}-${odd.label}`}
                                      onClick={() => {
                                        playClickSound();
                                        onToggleBetSelection({
                                          matchId: match.id,
                                          matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
                                          league: match.league,
                                          marketName: market.name,
                                          selectionName: odd.label,
                                          rate: odd.value
                                        });
                                      }}
                                      className={`bet-button flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-all h-[42px] ${
                                        active
                                          ? 'active bg-[#28a745] text-white border-2 border-[#28a745] shadow-[0_4px_14px_rgba(40,167,69,0.45)]'
                                          : 'bg-[#1e2638] text-slate-200 hover:bg-[#2b354f] border border-slate-700'
                                      }`}
                                    >
                                      <span className="text-xs font-semibold truncate mr-1">{odd.label}</span>
                                      <span className={`text-xs font-black font-mono ${active ? 'text-white' : 'text-[#ffb703]'}`}>
                                        {odd.value.toFixed(2)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </article>
              );
            })
          )}
        </main>
          </>
        )}

      </div>

      {/* ===================== ZONE 5 : COUPON DE PARI (BET SLIP) / TIROIR DU BAS ===================== */}
      {/* Règle : Hauteur maximale contrôlée (max-height: 40% de l'écran avec overflow-y: auto interne), safe areas */}
      {selectedBets.length > 0 && (
        <aside
          className={`betslip-drawer fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-[#182033] border-t-2 border-[#00E5FF] shadow-[0_-8px_30px_rgba(0,0,0,0.6)] flex flex-col transition-all duration-300 rounded-t-2xl safe-bottom ${
            isDrawerExpanded ? 'max-h-[40vh]' : 'max-h-[64px]'
          }`}
        >
          {/* Bet Slip Header / Compact bar */}
          <div className="betslip-header h-[56px] shrink-0 flex items-center justify-between px-3 sm:px-4 bg-[#101726] rounded-t-2xl">
            <div
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
              onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            >
              <div className="w-7 h-7 rounded-full bg-[#00E5FF] text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                {selectedBets.length}
              </div>
              <div className="text-left leading-tight min-w-0">
                <span className="font-bold text-xs text-white block truncate">
                  Coupon de pari ({selectedBets.length})
                </span>
                <span className="text-[11px] text-slate-300">
                  Total cote : <strong className="font-mono-num text-[#00E5FF] font-black">{totalRate.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Expand / Collapse toggle */}
              <button
                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title={isDrawerExpanded ? 'Réduire' : 'Agrandir'}
              >
                {isDrawerExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              {/* Action Button: Opens Full Slip Dialog */}
              <button
                onClick={() => {
                  playClickSound();
                  onOpenBetSlip();
                }}
                className="flex items-center gap-1.5 font-black text-xs bg-gradient-to-r from-[#00E5FF] to-cyan-500 hover:from-cyan-400 hover:to-cyan-400 text-slate-950 px-3 py-2 rounded-xl shadow-lg active:scale-95 transition-all"
              >
                <span>Finaliser</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Internal Scrollable Content (Active only when expanded, max-height 40% screen respected) */}
          {isDrawerExpanded && (
            <div className="betslip-content overflow-y-auto px-4 py-3 space-y-2 flex-1 no-scrollbar border-t border-slate-800/80">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between pb-1">
                <span>Sélections du coupon</span>
                <button
                  onClick={() => {
                    playClickSound();
                    onOpenBetSlip();
                  }}
                  className="text-[#00E5FF] hover:underline flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Plein Écran</span>
                </button>
              </div>

              {selectedBets.map((bet, index) => (
                <div
                  key={`${bet.matchId}-${bet.marketName}-${bet.selectionName}`}
                  className="bet-item flex items-center justify-between p-2 rounded-xl bg-[#0e1628] border border-slate-800 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-slate-200 truncate">{bet.matchTitle}</div>
                    <div className="text-[10px] text-slate-400">
                      {bet.marketName} : <strong className="text-[#00E5FF]">{bet.selectionName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono-num font-black text-amber-400 text-xs">
                      {bet.rate.toFixed(2)}
                    </span>
                    <button
                      onClick={() => onToggleBetSelection(bet)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                      title="Supprimer la sélection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {/* Scroll-to-Top Button */}
      <ScrollToTopButton targetRef={containerRef} />
    </div>
  );
};
