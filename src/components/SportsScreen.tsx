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
  SlidersHorizontal,
  Lock,
  Trash2,
  Maximize2,
  Zap,
  CheckCircle2,
  PlusCircle,
  X,
  Globe,
  CircleDot,
  Dribbble,
  Disc,
  Shield,
  Gamepad2,
  Gauge,
  Swords,
  Target,
  Circle
} from 'lucide-react';
import { MatchEvent, BetSlipItem, SportType, SideMarketItem, PlacedBet } from '../types';
import { playClickSound } from '../utils/audio';
import { ScrollToTopButton } from './ScrollToTopButton';
import { NewBadge } from './NewBadge';
import { DynamicAdBanner } from './DynamicAdBanner';
import { ModuleFilterBar } from './ModuleFilterBar';
import { useTranslation } from '../context/LanguageContext';
import { useFeatures } from '../context/FeaturesContext';
import { FUN_BETS_ITEMS, FUN_BETS_SUB_CATEGORIES, FunBetItem } from '../data/funBetsData';
import { MatchesListSkeleton } from './MatchSkeletonLoader';

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
  completingBet?: PlacedBet | null;
  onCancelCompleteBet?: () => void;
  isLoading?: boolean;
}

export const SportsScreen: React.FC<SportsScreenProps> = ({
  matches,
  selectedBets,
  onToggleBetSelection,
  selectedLeagueFilter,
  onClearLeagueFilter,
  onOpenBetSlip,
  isAdmin = false,
  onNavigateModule,
  completingBet,
  onCancelCompleteBet,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const { banners, isMatchLocked } = useFeatures();
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'fun-bets'>('all');
  const [funBetsCategory, setFunBetsCategory] = useState<string>('all_fun');
  const [activeSport, setActiveSport] = useState<SportType | 'all' | 'rugby' | 'esports' | 'f1' | 'mma' | 'volleyball'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveMinuteTick, setLiveMinuteTick] = useState(0);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({
    'm-uefa-1': true,
    'match_classic_fr': true
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial loader transition pou evite tout efè ekran blan pandan done yo ap chaje
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 320);
    return () => clearTimeout(timer);
  }, []);

  // Live timer tick simulation for active matches
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMinuteTick(prev => (prev + 1) % 90);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  void liveMinuteTick;

  const handleTabChange = (tab: 'all' | 'live' | 'upcoming' | 'fun-bets') => {
    playClickSound();
    if (tab !== activeTab) {
      setIsTransitioning(true);
      setActiveTab(tab);
      setTimeout(() => setIsTransitioning(false), 240);
    }
  };

  const handleSportChange = (sport: SportType | 'all' | 'rugby' | 'esports' | 'f1' | 'mma' | 'volleyball') => {
    playClickSound();
    if (sport !== activeSport) {
      setIsTransitioning(true);
      setActiveSport(sport);
      setTimeout(() => setIsTransitioning(false), 200);
    }
  };

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
    if (selectedLeagueFilter && !match.league.toLowerCase().includes(selectedLeagueFilter.toLowerCase())) {
      return false;
    }
    if (activeTab === 'live' && !match.isLive) return false;
    if (activeTab === 'upcoming' && match.isLive) return false;
    if (activeSport !== 'all' && match.sport !== activeSport) return false;

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

  void liveCount;

  const totalRate = selectedBets.reduce((acc, b) => acc * b.rate, 1);

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
      rate: item.odds.current,
      isFunBet: true
    });
  };

  // Sports list for Zone 2 horizontal scroll (minimalist uniform-stroke vector icons)
  const sportsCategories: { id: SportType | 'all' | 'rugby' | 'esports' | 'f1' | 'mma' | 'volleyball'; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: t('all'), icon: <Globe className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: matches.length },
    { id: 'football', label: 'Football', icon: <CircleDot className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: footballCount || 42 },
    { id: 'basketball', label: 'Basketball', icon: <Dribbble className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: basketballCount || 11 },
    { id: 'tennis', label: 'Tennis', icon: <Disc className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: tennisCount || 18 },
    { id: 'rugby', label: 'Rugby', icon: <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 5 },
    { id: 'esports', label: 'eSports', icon: <Gamepad2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 14 },
    { id: 'f1', label: 'Formule 1', icon: <Gauge className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 2 },
    { id: 'mma', label: 'MMA / Boxe', icon: <Swords className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 6 },
    { id: 'baseball', label: 'Baseball', icon: <Target className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 8 },
    { id: 'volleyball', label: 'Volleyball', icon: <Circle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />, count: 4 }
  ];

  // Répartition visuelle des mises des parieurs (vert = favorite/plus jouée, jaune = intermédiaire, rouge = moins jouée)
  const getOddsDistribution = (odds: MatchEvent['odds']['1X2']) => {
    if (!odds || odds.length === 0) return [];
    const weights = odds.map(o => (o.rate > 0 ? 1 / o.rate : 0.33));
    const total = weights.reduce((acc, w) => acc + w, 0) || 1;
    const percents = weights.map(w => Math.round((w / total) * 100));
    const diff = 100 - percents.reduce((acc, p) => acc + p, 0);
    if (percents.length > 0 && diff !== 0) {
      const maxIdx = percents.indexOf(Math.max(...percents));
      percents[maxIdx] += diff;
    }

    const ranked = odds
      .map((o, idx) => ({ idx, rate: o.rate }))
      .sort((a, b) => a.rate - b.rate);

    const styleMap: Record<number, { barClass: string; textClass: string; label: string }> = {};
    ranked.forEach((entry, rank) => {
      if (rank === 0) {
        styleMap[entry.idx] = {
          barClass: 'bg-emerald-500',
          textClass: 'text-emerald-600',
          label: 'Issue la plus jouée / favorite'
        };
      } else if (rank === ranked.length - 1) {
        styleMap[entry.idx] = {
          barClass: 'bg-red-500',
          textClass: 'text-red-500',
          label: 'Issue la moins jouée'
        };
      } else {
        styleMap[entry.idx] = {
          barClass: 'bg-amber-400',
          textClass: 'text-amber-600',
          label: 'Tendance intermédiaire'
        };
      }
    });

    return odds.map((_, idx) => ({
      percent: percents[idx],
      ...styleMap[idx]
    }));
  };

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-3.5rem)] pb-32 pt-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4">
        
        {/* Dynamic Ad Banner / Promo Showcase */}
        <DynamicAdBanner
          banners={banners}
          banner={banners && banners.length > 0 ? banners[0] : undefined}
          isAdmin={isAdmin}
          onNavigate={(dest) => {
            if (dest === 'sports' || dest === 'casino' || dest === 'borlette') {
              onNavigateModule?.(dest);
            } else if (dest === 'live') {
              setActiveTab('live');
            }
          }}
        />

        {/* Module Filters: Paris Sportifs, Casino, Borlette */}
        <ModuleFilterBar activeModule="sports" onNavigateModule={onNavigateModule} />

        {/* Active Konplete Fich Banner if user is adding selections */}
        {completingBet && (
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 rounded-2xl p-3 text-xs shadow-lg">
            <div className="flex items-center gap-2.5 min-w-0">
              <PlusCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-white truncate">
                  Mode Konplete Fich actif • Ticket #{completingBet.id}
                </p>
                <p className="text-[11px] text-emerald-300">
                  Fich en kour • Total seleksyon: <strong className="text-white font-mono">{completingBet.items.length + selectedBets.length}/35</strong> • Miz konsève: <strong className="text-emerald-400 font-mono">{completingBet.stake} HTG</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenBetSlip}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Valide Fich ({selectedBets.length})
              </button>
              {onCancelCompleteBet && (
                <button
                  onClick={onCancelCompleteBet}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                  title="Annuler le mode compléter"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected League Filter Tag if active from Drawer */}
        {selectedLeagueFilter && (
          <div className="flex items-center justify-between bg-blue-950/90 border border-blue-600/50 rounded-xl px-4 py-2 text-xs text-white">
            <div className="flex items-center gap-2 text-blue-200">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Filtre actif : <strong className="text-white">{selectedLeagueFilter}</strong></span>
            </div>
            <button
              onClick={onClearLeagueFilter}
              className="text-cyan-400 hover:text-white font-semibold underline underline-offset-2 cursor-pointer"
            >
              Afficher tout
            </button>
          </div>
        )}

        {/* Navigation & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0e1627] p-2 rounded-2xl shadow-md">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Tous</span>
              <span className="text-[10px] font-mono opacity-80">142</span>
            </button>

            <button
              onClick={() => handleTabChange('live')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>En Direct</span>
              <span className="text-[10px] font-mono font-bold">14</span>
            </button>

            <button
              onClick={() => handleTabChange('upcoming')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>À Venir</span>
              <span className="text-[10px] font-mono opacity-80">48</span>
            </button>

            <button
              onClick={() => handleTabChange('fun-bets')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'fun-bets'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Fun Bets</span>
              <span className="text-[10px] font-mono opacity-90">18</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#152038] text-white placeholder-slate-400 text-xs rounded-xl pl-9 pr-3 py-2 outline-hidden focus:ring-1 focus:ring-cyan-400 border border-slate-700/70"
            />
          </div>
        </div>

        {/* ===================== ZONE 2 & 3 OR FUN BETS SECTION ===================== */}
        {activeTab === 'fun-bets' ? (
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
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 font-bold border border-slate-700/60 text-[11px] truncate">
                          <Trophy className="w-3 h-3 shrink-0 text-amber-400" strokeWidth={1.75} />
                          <span className="truncate">{item.match.league}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                          {startTimeFormatted}
                        </span>
                      </div>

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

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-400 leading-tight">
                        <span className="block text-slate-300 font-semibold truncate">
                          {item.market.selection_name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          Min: 10 HTG • Max: {(item.market.max_stake * 50).toLocaleString()} HTG
                        </span>
                      </div>

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
                            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
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
            <nav
              className="sports-nav shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center overflow-x-auto whitespace-nowrap no-scrollbar p-1.5 gap-1.5"
              aria-label="Sports navigation"
            >
              {sportsCategories.map(sport => {
                const isSportActive = activeSport === sport.id;
                return (
                  <button
                    key={sport.id}
                    onClick={() => handleSportChange(sport.id)}
                    className={`sport-item inline-flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSportActive
                        ? 'bg-[#0d1526] text-amber-400 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{sport.icon}</span>
                    <span>{sport.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSportActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {sport.count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* ===================== ZONE 3 : LISTE DES MATCHS ===================== */}
            <main className="matches-list flex-1">
              {isLoading || isTransitioning ? (
                <MatchesListSkeleton count={4} message="Chajman match ak kòt an dirèk..." />
              ) : filteredMatches.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm shadow-xs">
                  Aucun match ne correspond aux filtres sélectionnés.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map(match => {
                    const match1X2 = match.odds['1X2'] || [];
                    const isMarketsExpanded = expandedMarkets[match.id] ?? false;

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
                      <article key={match.id} className="match-card">
                        {/* Match Header */}
                        <div className="match-header">
                          <div className="flex items-center gap-2 min-w-0 flex-1 text-xs">
                            <span className="font-bold text-slate-700 truncate">{match.league}</span>
                            <NewBadge isNew={match.isNew} createdAt={match.createdAt} />
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 truncate">{match.country}</span>
                          </div>

                          {match.isLive ? (
                            <div className="live-badge flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span>{match.minute ? `${match.minute}'` : 'LIVE'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px] font-mono-num shrink-0 ml-2">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{match.startTime}</span>
                            </div>
                          )}
                        </div>

                        {/* Match Teams & Scores */}
                        <div className="teams-container">
                          <div className="team-row">
                            <span className="truncate block min-w-0" title={match.homeTeam}>
                              {match.homeTeam}
                            </span>
                            {match.isLive ? (
                              <span className="score">{match.homeScore ?? 0}</span>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400 font-mono">VS</span>
                            )}
                          </div>

                          <div className="team-row">
                            <span className="truncate block min-w-0" title={match.awayTeam}>
                              {match.awayTeam}
                            </span>
                            {match.isLive ? (
                              <span className="score">{match.awayScore ?? 0}</span>
                            ) : null}
                          </div>
                        </div>

                        {/* Lock Warning */}
                        {isMatchLocked(match.id) && (
                          <div className="my-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                            <Lock className="w-4 h-4 text-red-500 shrink-0" />
                            <span>Paris temporairement suspendus sur cette rencontre.</span>
                          </div>
                        )}

                        {/* Odds Grid + Barres colorées de tendance/répartition sous les cotes (matchs seulement) */}
                        <div className="mt-1 pt-1">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                            {t('mainMarket')}
                          </div>

                          <div
                            className="odds-grid button-group"
                            style={match1X2.length === 2 ? { gridTemplateColumns: 'repeat(2, 1fr)' } : undefined}
                          >
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
                                  className={`bet-button odd-box relative overflow-hidden ${active ? 'active' : ''} ${
                                    matchLocked ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  title={`Parye ${symbol} (${teamAbbr}) - Kòt: ${odd.rate.toFixed(2)}`}
                                >
                                  {odd.trend === 'up' && (
                                    <div
                                      className="absolute top-0 right-0 w-0 h-0 border-t-[9px] border-t-emerald-500 border-l-[9px] border-l-transparent z-20 pointer-events-none"
                                      title="Cote en hausse"
                                    />
                                  )}
                                  {odd.trend === 'down' && (
                                    <div
                                      className="absolute bottom-0 right-0 w-0 h-0 border-b-[9px] border-b-red-500 border-l-[9px] border-l-transparent z-20 pointer-events-none"
                                      title="Cote en baisse"
                                    />
                                  )}

                                  <div className="flex items-center justify-center gap-1 mb-0.5">
                                    <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                      active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                                    }`}>
                                      {symbol}
                                    </span>
                                    <span className="odd-label text-[10px] truncate font-bold">
                                      {teamAbbr}
                                    </span>
                                  </div>

                                  <div className="odd-value text-sm sm:text-base">
                                    {odd.rate.toFixed(2)}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Barres colorées sous les cotes : tendance et répartition des mises (vert / jaune / rouge) */}
                          {match1X2.length > 0 && (() => {
                            const distribution = getOddsDistribution(match1X2);
                            return (
                              <div
                                className={`grid gap-2 mt-1.5 ${match1X2.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
                                aria-label="Tendance et répartition des mises"
                              >
                                {distribution.map((dist, idx) => (
                                  <div
                                    key={`${match.id}-dist-${idx}`}
                                    className="flex flex-col gap-0.5 px-1"
                                    title={`${dist.label} (${dist.percent}%)`}
                                  >
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${dist.barClass}`}
                                        style={{ width: `${Math.max(dist.percent, 8)}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-mono-num font-bold leading-none">
                                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dist.barClass}`} />
                                      <span className={dist.textClass}>{dist.percent}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Side Markets Accordion */}
                        {sideMarketsList.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => toggleMarkets(match.id)}
                              className="w-full flex items-center justify-between py-1 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 font-bold">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
                                <span>{t('secondaryMarkets')}</span>
                                <span className="text-[10px] font-mono bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded-full font-black">
                                  +{sideMarketsList.length}
                                </span>
                              </div>
                              {isMarketsExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            {isMarketsExpanded && (
                              <div className="mt-2 space-y-2 animate-fadeIn">
                                {sideMarketsList.map(market => (
                                  <div key={market.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <span className="text-[11px] font-bold text-slate-600 block">
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
                                            className={`bet-button relative overflow-hidden flex items-center justify-between py-2 px-2.5 rounded-xl transition-all ${
                                              active
                                                ? 'active'
                                                : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                          >
                                            <span className="text-xs font-semibold truncate mr-1.5">{odd.label}</span>
                                            <span className={`text-xs font-black font-mono-num ${active ? 'text-white' : 'text-sky-600'}`}>
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
                  })}
                </div>
              )}
            </main>
          </>
        )}

      </div>

      {/* ===================== ZONE 5 : COUPON DE PARI (BET SLIP) / TIROIR DU BAS ===================== */}
      {selectedBets.length > 0 && (
        <aside
          className={`betslip-drawer fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-[#0e1628] border-t border-x border-cyan-500/40 shadow-[0_-10px_30px_rgba(0,0,0,0.55)] flex flex-col transition-all duration-200 rounded-t-2xl safe-bottom ${
            isDrawerExpanded ? 'max-h-[42vh]' : 'max-h-[64px]'
          }`}
        >
          {/* Bet Slip Header / Compact bar */}
          <div className="betslip-header h-[56px] shrink-0 flex items-center justify-between px-4 bg-[#090e1a] rounded-t-2xl">
            <div
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
              onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
            >
              <div className={`w-7 h-7 rounded-full text-slate-950 flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                completingBet ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}>
                {completingBet ? completingBet.items.length + selectedBets.length : selectedBets.length}
              </div>
              <div className="text-left leading-tight min-w-0">
                <span className="font-bold text-xs text-white block truncate">
                  {completingBet ? `Konplete Fich #${completingBet.id} (+${selectedBets.length})` : `Coupon de pari (${selectedBets.length}/35)`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {completingBet ? (
                    <>Total seleksyon : <strong className="font-mono text-emerald-400">{completingBet.items.length + selectedBets.length}/35</strong></>
                  ) : (
                    <>Total cote : <strong className="font-mono text-amber-400">{totalRate.toFixed(2)}</strong></>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsDrawerExpanded(!isDrawerExpanded)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title={isDrawerExpanded ? 'Réduire' : 'Agrandir'}
              >
                {isDrawerExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  onOpenBetSlip();
                }}
                className={`flex items-center gap-1 font-black text-xs px-3.5 py-2 rounded-xl cursor-pointer transition-transform active:scale-95 ${
                  completingBet
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950'
                }`}
              >
                <span>{completingBet ? 'Finaliser Konplete' : 'Parier Maintenant'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Internal Scrollable Content */}
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

              {selectedBets.map((bet) => (
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
