import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Search,
  ArrowRight,
  Flame,
  Zap,
  Play,
  RotateCcw,
  Trophy,
  Plane
} from 'lucide-react';
import { TOP_15_GAMES, GameItem } from '../data/top15Games';
import { playClickSound, playWinSound, playCrashSound, playBetPlacedSound } from '../utils/audio';
import { AviatorCompleteGame } from './AviatorCompleteGame';

interface FullBetTop15ModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onUpdateBalance?: (newBalance: number, reason: string) => void;
  onSelectGame: (game: GameItem) => void;
}

// Koulè ki baze sou tèm FULL BET la (Imaj: #0D1322, #151D30, #1E88E5)
// val DarkBackground = Color(0xFF0D1322)
// val CardBackground = Color(0xFF151D30)
// val AccentBlue = Color(0xFF1E88E5)
// val TextWhite = Color(0xFFFFFFFF)
// val TextGray = Color(0xFF94A3B8)
// val GreenWin = Color(0xFF4CAF50)
// val RedLoss = Color(0xFFE53935)

export const FullBetTop15Modal: React.FC<FullBetTop15ModalProps> = ({
  isOpen,
  onClose,
  userBalance,
  onUpdateBalance,
  onSelectGame
}) => {
  const [activeTab, setActiveTab] = useState<'top15' | 'aviator'>('top15');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // ===================== AVIATOR MINI SCREEN STATE =====================
  const [aviatorMultiplier, setAviatorMultiplier] = useState(1.00);
  const [aviatorState, setAviatorState] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [aviatorBet, setAviatorBet] = useState(500);
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const crashPointRef = useRef(3.45);
  const startTimestampRef = useRef(0);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startAviatorFlight = () => {
    if (userBalance < aviatorBet) {
      alert("Solde ensifizan pou mete pari sa a.");
      return;
    }

    playBetPlacedSound();
    onUpdateBalance?.(userBalance - aviatorBet, `Pari Aviator - ${aviatorBet} HTG`);
    setHasBet(true);
    setHasCashedOut(false);
    setWinAmount(0);
    setAviatorState('flying');
    setAviatorMultiplier(1.00);

    // Random crash point (skewed provably fair)
    const rand = Math.random();
    crashPointRef.current = rand < 0.08 ? 1.05 : +(1.1 + Math.pow(Math.random() * 2.8, 2)).toFixed(2);
    startTimestampRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTimestampRef.current) / 1000;
      const current = +(1.0 + Math.pow(elapsed * 0.9, 1.6)).toFixed(2);

      if (current >= crashPointRef.current) {
        setAviatorMultiplier(crashPointRef.current);
        setAviatorState('crashed');
        playCrashSound();
      } else {
        setAviatorMultiplier(current);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const cashOutAviator = () => {
    if (aviatorState !== 'flying' || !hasBet || hasCashedOut) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const win = Math.round(aviatorBet * aviatorMultiplier);
    setWinAmount(win);
    setHasCashedOut(true);
    playWinSound();
    onUpdateBalance?.(userBalance + win, `Genyen Aviator (${aviatorMultiplier}x) - ${win} HTG`);
  };

  if (!isOpen) return null;

  const categories = ['Tous', 'Machine à Sous', 'Casino en Direct', 'Jeu Crash', 'Live Show', 'Stratégie & Table', 'Jackpot'];

  const filteredGames = TOP_15_GAMES.filter(game => {
    const matchesSearch =
      game.title.toLowerCase().includes(search.toLowerCase()) ||
      game.category.toLowerCase().includes(search.toLowerCase()) ||
      game.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Tous' ||
      game.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0D1322] border border-[#1E88E5]/50 shadow-[0_10px_35px_rgba(30,136,229,0.25)] overflow-hidden text-white font-sans">
        
        {/* ================= HEADER (Matching FullBetTop15Screen) ================= */}
        <div className="p-4 sm:p-5 bg-[#0D1322] border-b border-[#1E88E5]/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                FULL BET - Top 15 Jwèt
              </h2>
              <p className="text-[11px] text-[#94A3B8]">
                Pi bon seleksyon kazino, kous ak jwèt an dirèk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User balance in Compose GreenWin (#4CAF50) & CardBackground (#151D30) */}
            <div className="px-3 py-1.5 rounded-lg bg-[#151D30] border border-[#1E88E5] text-[#4CAF50] font-bold text-xs sm:text-sm font-mono shadow-sm">
              {userBalance.toLocaleString('fr-FR')} HTG
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#151D30] hover:bg-[#1E88E5]/30 text-[#94A3B8] hover:text-white transition-colors cursor-pointer border border-[#1E88E5]/20"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch between Top 15 Screen and Aviator Screen */}
        <div className="flex border-b border-[#1E88E5]/20 bg-[#0a0f1d] px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('top15');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 ${
              activeTab === 'top15'
                ? 'bg-[#151D30] text-[#1E88E5] border-[#1E88E5] shadow-sm'
                : 'text-[#94A3B8] border-transparent hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-[#1E88E5]" />
            <span>Lis 15 Jwèt yo</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#1E88E5]/20 text-[#1E88E5] font-mono">15</span>
          </button>

          <button
            onClick={() => {
              playClickSound();
              setActiveTab('aviator');
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t-2 ${
              activeTab === 'aviator'
                ? 'bg-[#151D30] text-[#1E88E5] border-[#1E88E5] shadow-sm'
                : 'text-[#94A3B8] border-transparent hover:text-white'
            }`}
          >
            <Plane className="w-4 h-4 text-red-400" />
            <span>Aviator Demo Direct</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-mono">HOT</span>
          </button>
        </div>

        {/* ================= TAB 1: TOP 15 SCREEN ================= */}
        {activeTab === 'top15' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Category Filters */}
            <div className="p-3 bg-[#0D1322] border-b border-[#1E88E5]/20 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Chèche nan 15 jwèt yo (Gates of Olympus, Aviator, Sweet Bonanza...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#151D30] text-white placeholder-[#94A3B8] text-xs rounded-xl pl-9 pr-4 py-2.5 outline-hidden border border-[#1E88E5]/30 focus:border-[#1E88E5] transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      playClickSound();
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#1E88E5] text-white shadow-sm'
                        : 'bg-[#151D30] text-[#94A3B8] hover:text-white border border-[#1E88E5]/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list of 15 games (Matching LazyColumn & GameCardItem) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {filteredGames.length === 0 ? (
                <div className="p-8 text-center text-[#94A3B8] text-xs">
                  Pa gen okenn jwèt ki koresponn ak rechèch ou a.
                </div>
              ) : (
                filteredGames.map((game) => (
                  <div
                    key={game.id}
                    onClick={() => {
                      playClickSound();
                      onSelectGame(game);
                      onClose();
                    }}
                    className="p-3 sm:p-3.5 rounded-xl bg-[#151D30] border border-[#1E88E5]/40 hover:border-[#1E88E5] hover:shadow-[0_4px_16px_rgba(30,136,229,0.2)] transition-all cursor-pointer group flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl sm:text-2xl shrink-0 group-hover:scale-110 transition-transform">
                          {game.emoji}
                        </span>
                        <div>
                          <div className="text-white font-bold text-sm sm:text-base group-hover:text-[#1E88E5] transition-colors">
                            {game.id}. {game.title}
                          </div>
                          <div className="text-[#94A3B8] text-xs mt-0.5 leading-relaxed">
                            {game.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {/* Category Chip in AccentBlue.copy(alpha=0.2f) and AccentBlue text */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1E88E5]/20 text-[#1E88E5] border border-[#1E88E5]/30">
                          {game.category}
                        </span>

                        {game.badge && (
                          <span className="text-[10px] font-mono font-bold text-[#4CAF50]">
                            {game.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#1E88E5]/15 text-[11px]">
                      <span className="text-slate-400 font-mono">
                        {game.multiplier ? `Multiplicateur: ${game.multiplier}` : 'Full Bet Officiel'}
                      </span>
                      <span className="text-[#1E88E5] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Jwe Kounye a</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: AVIATOR SCREEN (Matching AviatorGameScreen) ================= */}
        {activeTab === 'aviator' && (
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto">
            <AviatorCompleteGame
              user={{
                balanceHTG: userBalance,
                fullName: 'Joueur Full Bet'
              } as any}
              onUpdateBalance={(newBal, reason) => {
                onUpdateBalance?.(newBal, reason);
              }}
              onOpenWallet={() => {}}
            />
          </div>
        )}

      </div>
    </div>
  );
};
