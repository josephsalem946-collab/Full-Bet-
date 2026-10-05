import React, { useState, useEffect } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Tv,
  Dices,
  Ticket,
  Rocket,
  Trophy,
  ChevronRight,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Plane,
  CircleDot,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { UserProfile, GameModule } from '../types';
import { CasinoGameId } from './GainCashSlidingMenu';
import { playClickSound } from '../utils/audio';
import {
  ALL_MULTILIVE_GAMES,
  DEFAULT_MULTILIVE_GAME_IDS,
  getStoredMultiLiveGames,
  saveStoredMultiLiveGames,
  MultiLiveGameDef
} from '../data/multiLiveData';

interface MultiLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSelectModule?: (mod: GameModule) => void;
  onSelectCasinoGame?: (game: CasinoGameId) => void;
}

export const MultiLiveModal: React.FC<MultiLiveModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectModule,
  onSelectCasinoGame
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Active games in grid
  const [activeGameIds, setActiveGameIds] = useState<string[]>(getStoredMultiLiveGames);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);

  // Sync with localStorage
  useEffect(() => {
    if (isOpen) {
      setActiveGameIds(getStoredMultiLiveGames());
    }
  }, [isOpen]);

  const handleAddGame = (id: string) => {
    playClickSound();
    if (!activeGameIds.includes(id)) {
      const next = [...activeGameIds, id];
      setActiveGameIds(next);
      saveStoredMultiLiveGames(next);
    }
    setIsAddGameOpen(false);
  };

  const handleRemoveGame = (id: string) => {
    playClickSound();
    if (activeGameIds.length <= 1) {
      alert("Ou dwe kenbe omwen yon (1) jwèt nan gri an !");
      return;
    }
    const next = activeGameIds.filter(gId => gId !== id);
    setActiveGameIds(next);
    saveStoredMultiLiveGames(next);
  };

  const handleResetDefaults = () => {
    playClickSound();
    setActiveGameIds(DEFAULT_MULTILIVE_GAME_IDS);
    saveStoredMultiLiveGames(DEFAULT_MULTILIVE_GAME_IDS);
  };

  // 1. Keno Live State
  const [kenoCountdown, setKenoCountdown] = useState(24);
  const [drawnKenoBalls, setDrawnKenoBalls] = useState<number[]>([7, 14, 28, 33, 42, 59, 68, 77]);
  const [isKenoDrawing, setIsKenoDrawing] = useState(false);

  // 2. JetX Live State
  const [jetxMultiplier, setJetxMultiplier] = useState(1.42);
  const [jetxStatus, setJetxStatus] = useState<'flying' | 'crashed' | 'countdown'>('flying');
  const [jetxCountdown, setJetxCountdown] = useState(5);

  // 3. Borlette NY / FL State
  const [activeLotteryTab, setActiveLotteryTab] = useState<'ny' | 'fl'>('ny');

  // 4. Paris Sportifs Live State
  const [matchMinute, setMatchMinute] = useState(68);
  const [matchAttack, setMatchAttack] = useState<'home' | 'away' | 'mid'>('home');
  const matchScore = { home: 2, away: 1 };
  const liveOdds = { home: 1.62, draw: 3.45, away: 5.20 };

  // 5. Aviator Crash Live State
  const [aviatorMultiplier, setAviatorMultiplier] = useState(2.15);

  // 6. Roulette Live State
  const [rouletteNumber, setRouletteNumber] = useState(17);
  const [rouletteColor, setRouletteColor] = useState<'black' | 'red' | 'zero'>('black');

  // 7. Slots 777 Live State
  const [jackpotAmount, setJackpotAmount] = useState(1849500);

  // JetX Simulation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setJetxMultiplier((prev) => {
        if (jetxStatus === 'flying') {
          if (prev >= 4.8) {
            setJetxStatus('crashed');
            return prev;
          }
          return Number((prev + 0.03 + Math.random() * 0.04).toFixed(2));
        }
        return prev;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isOpen, jetxStatus]);

  // JetX loop
  useEffect(() => {
    if (jetxStatus === 'crashed') {
      const timer = setTimeout(() => {
        setJetxStatus('countdown');
        setJetxCountdown(4);
      }, 2500);
      return () => clearTimeout(timer);
    } else if (jetxStatus === 'countdown') {
      const timer = setInterval(() => {
        setJetxCountdown((c) => {
          if (c <= 1) {
            setJetxStatus('flying');
            setJetxMultiplier(1.0);
            return 4;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [jetxStatus]);

  // Keno Live Loop
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setKenoCountdown((c) => {
        if (c <= 1) {
          setIsKenoDrawing(true);
          const newBalls: number[] = [];
          while (newBalls.length < 8) {
            const num = Math.floor(Math.random() * 80) + 1;
            if (!newBalls.includes(num)) newBalls.push(num);
          }
          setDrawnKenoBalls(newBalls.sort((a, b) => a - b));
          setTimeout(() => setIsKenoDrawing(false), 3000);
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Live match timer
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setMatchMinute((m) => (m >= 90 ? 1 : m + 1));
      const pos = Math.random();
      setMatchAttack(pos > 0.6 ? 'home' : pos > 0.3 ? 'away' : 'mid');
      setJackpotAmount(j => j + Math.floor(Math.random() * 50) + 10);
    }, 5000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate grid layout based on item count
  const count = activeGameIds.length;
  const gridClasses =
    count === 1
      ? 'grid-cols-1 grid-rows-1'
      : count === 2
      ? 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1'
      : count === 3
      ? 'grid-cols-1 md:grid-cols-3'
      : count === 4
      ? 'grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2'
      : 'grid-cols-1 md:grid-cols-3 grid-rows-6 md:grid-rows-2';

  // Available games that can be added
  const availableToAdd = ALL_MULTILIVE_GAMES.filter(g => !activeGameIds.includes(g.id));

  // Render individual game cell content
  const renderGameContent = (gameId: string) => {
    switch (gameId) {
      case 'keno':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#111827] via-[#0b1120] to-[#030712] relative">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600/20 via-yellow-500/10 to-amber-400/30 border-2 border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 overflow-hidden">
                <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.2),transparent_70%)] ${isKenoDrawing ? 'animate-spin' : ''}`} />
                <div className="relative text-center">
                  <span className="text-2xl font-black font-mono text-amber-300 drop-shadow">
                    {drawnKenoBalls[drawnKenoBalls.length - 1] || 77}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-amber-400/80 font-bold block">
                    Dènye Boul
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">
                {isKenoDrawing ? 'Tirage 20 boul an dirèk...' : '8 boul tiré resaman :'}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1 max-w-xs">
                {drawnKenoBalls.map((num, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-xs font-mono"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Pwochèn: {kenoCountdown}s</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('keno');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Mize Keno</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'jetx':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#090d16] via-[#071322] to-[#020617] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15),transparent_60%)]" />
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-1">
              {jetxStatus === 'flying' && (
                <div className="space-y-1">
                  <div className="text-4xl font-black font-mono text-cyan-300 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse">
                    {jetxMultiplier.toFixed(2)}x
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs text-cyan-400">
                    <Rocket className="w-4 h-4 animate-bounce" />
                    <span>Fizé a ap monte rapid...</span>
                  </div>
                </div>
              )}
              {jetxStatus === 'crashed' && (
                <div className="space-y-1">
                  <div className="text-3xl font-black font-mono text-rose-500">
                    BOOM @ {jetxMultiplier.toFixed(2)}x
                  </div>
                  <span className="text-xs text-rose-400 font-semibold block">Eksplozyon ! Pwochèn vol ap vini.</span>
                </div>
              )}
              {jetxStatus === 'countdown' && (
                <div className="space-y-1">
                  <div className="text-2xl font-black font-mono text-amber-400">
                    Pwochèn Vol nan {jetxCountdown}s
                  </div>
                  <span className="text-xs text-slate-400 block">Prepare miz ou</span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between relative z-1">
              <span className="text-[10px] text-emerald-400 font-mono font-bold">2.14x • 4.80x • 1.12x</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('jetx');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Jwe JetX</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'borlette':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#061c14] via-[#09231a] to-[#02130e] relative">
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveLotteryTab('ny')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    activeLotteryTab === 'ny' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-950/80 text-emerald-300'
                  }`}
                >
                  🗽 NY Soir
                </button>
                <button
                  onClick={() => setActiveLotteryTab('fl')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    activeLotteryTab === 'fl' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-950/80 text-emerald-300'
                  }`}
                >
                  🌴 FL Midi
                </button>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-emerald-500/20 text-center w-full max-w-xs space-y-1">
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  <div className="text-center">
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-mono font-black text-base flex items-center justify-center shadow">
                      {activeLotteryTab === 'ny' ? '48' : '15'}
                    </span>
                    <span className="text-[8px] text-amber-300 font-bold block mt-0.5">1ye Lo</span>
                  </div>
                  <div className="text-center">
                    <span className="w-8 h-8 rounded-xl bg-slate-200 text-slate-900 font-mono font-black text-sm flex items-center justify-center shadow">
                      {activeLotteryTab === 'ny' ? '12' : '84'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5">2èm Lo</span>
                  </div>
                  <div className="text-center">
                    <span className="w-8 h-8 rounded-xl bg-amber-700 text-white font-mono font-black text-sm flex items-center justify-center shadow">
                      {activeLotteryTab === 'ny' ? '93' : '02'}
                    </span>
                    <span className="text-[8px] text-amber-500 font-bold block mt-0.5">3èm Lo</span>
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-emerald-300/80 font-mono">⏱️ Pwochèn tiraj nan 14 minit</span>
            </div>
            <div className="pt-2 border-t border-emerald-950/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Bolet • Maryaj • Loto</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectModule) onSelectModule('borlette');
                  onClose();
                }}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Pran Fich</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'sports':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#0a1428] via-[#091834] to-[#040c1d] relative">
            <div className="flex-1 flex flex-col justify-center space-y-1.5">
              <div className="p-2.5 bg-slate-900/80 rounded-xl border border-blue-500/20 flex items-center justify-between text-xs">
                <span className="font-bold text-white truncate text-xs">Real Madrid</span>
                <span className="px-2.5 py-0.5 bg-black/60 rounded border border-slate-700 font-mono font-black text-xs text-amber-400">
                  {matchScore.home} - {matchScore.away}
                </span>
                <span className="font-bold text-white truncate text-xs">FC Barcelona</span>
              </div>
              <div className="p-1.5 bg-emerald-950/40 rounded border border-emerald-500/20 text-center">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                  {matchMinute}' • {matchAttack === 'home' ? 'Real Madrid ap atake ➔' : '⬅ Barcelona ap atake'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <div className="p-1 bg-[#142036] rounded text-center">
                  <span className="text-[9px] text-slate-400 block">1 (Real)</span>
                  <span className="font-mono font-bold text-xs text-amber-400">{liveOdds.home}</span>
                </div>
                <div className="p-1 bg-[#142036] rounded text-center">
                  <span className="text-[9px] text-slate-400 block">X (Nul)</span>
                  <span className="font-mono font-bold text-xs text-amber-400">{liveOdds.draw}</span>
                </div>
                <div className="p-1 bg-[#142036] rounded text-center">
                  <span className="text-[9px] text-slate-400 block">2 (Barca)</span>
                  <span className="font-mono font-bold text-xs text-amber-400">{liveOdds.away}</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Cash Out disponib</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectModule) onSelectModule('sports');
                  onClose();
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Paris Live</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );

      case 'crash':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#250d18] via-[#1a0812] to-[#0d0309] relative">
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <Plane className="w-8 h-8 text-rose-500 animate-pulse" />
              <div className="text-3xl font-black font-mono text-rose-400 drop-shadow">
                {aviatorMultiplier.toFixed(2)}x
              </div>
              <span className="text-[10px] text-rose-300">Avyon an ap monte rapid</span>
            </div>
            <div className="pt-2 border-t border-rose-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Cash Out Enstantane</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('crash');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Jwe Crash
              </button>
            </div>
          </div>
        );

      case 'roulette':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#1a0b26] via-[#13061d] to-[#08020d] relative">
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500 flex items-center justify-center bg-black/60 shadow-lg">
                <span className="text-2xl font-black font-mono text-white">
                  {rouletteNumber}
                </span>
              </div>
              <span className="text-[10px] text-purple-300 font-bold uppercase">
                {rouletteColor === 'black' ? 'Nwa • Pè' : 'Wouj • Enpè'}
              </span>
            </div>
            <div className="pt-2 border-t border-purple-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">36 Nimewo + 0 Vèt</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('roulette');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Mize Roulette
              </button>
            </div>
          </div>
        );

      case 'slots':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#261e08] via-[#1d1604] to-[#0e0a02] relative">
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <span className="text-2xl">🎰 7️⃣ 🍒</span>
              <div className="text-lg font-black font-mono text-yellow-400 drop-shadow">
                {jackpotAmount.toLocaleString()} HTG
              </div>
              <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">Mega Jackpot</span>
            </div>
            <div className="pt-2 border-t border-yellow-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Miz depi 5 HTG</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('slots');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded text-xs font-bold cursor-pointer"
              >
                Jwe Slots
              </button>
            </div>
          </div>
        );

      case 'lucky6':
        return (
          <div className="flex-1 flex flex-col justify-between pt-10 p-3 bg-gradient-to-b from-[#211105] via-[#170a02] to-[#0c0501] relative">
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <div className="flex gap-1">
                {[5, 12, 19, 28, 33, 44].map((n, i) => (
                  <span
                    key={i}
                    className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center font-mono shadow"
                  >
                    {n}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-orange-300 font-semibold">Tirage 35 Boul Koulè</span>
            </div>
            <div className="pt-2 border-t border-orange-950 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Genyen jiska x100,000</span>
              <button
                onClick={() => {
                  playClickSound();
                  if (onSelectCasinoGame) onSelectCasinoGame('luckysix');
                  if (onSelectModule) onSelectModule('casino');
                  onClose();
                }}
                className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold cursor-pointer"
              >
                Lucky 6
              </button>
            </div>
          </div>
        );

      default:
        return <div className="p-4 text-center text-xs text-slate-500">Jwèt an dirèk</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1117]/95 backdrop-blur-md text-white font-sans overflow-hidden">
      <div className={`w-full h-full flex flex-col ${isFullscreen ? 'p-0' : 'max-w-7xl max-h-[96vh] rounded-2xl border border-[#30363d] shadow-2xl m-2 overflow-hidden'}`}>
        
        {/* HEADER BAR */}
        <header className="bg-[#161b22] px-4 py-2.5 text-sm sm:text-base font-bold border-b border-[#30363d] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Tv className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold tracking-wide font-display text-white">
                FULL BET - Multi-Live Gri
              </span>
              <span className="text-[11px] text-slate-400 font-normal ml-2">
                ({activeGameIds.length} jwèt aktif)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Game Button */}
            {availableToAdd.length > 0 && (
              <button
                onClick={() => {
                  playClickSound();
                  setIsAddGameOpen(true);
                }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                title="Ajoute yon jwèt nan gri an"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ajoute Jwèt</span>
              </button>
            )}

            {/* Reset to 4 default games */}
            <button
              onClick={handleResetDefaults}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Remèt 4 jwèt pa defo yo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="hidden sm:flex text-xs font-mono font-bold text-[#00ff88] items-center gap-1.5 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
              ● ONLINE
            </span>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Fèmen tout ekran" : "Plein ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
              title="Fèmen Multi-Live"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MULTIVIEW GRID */}
        <div className={`flex-1 grid ${gridClasses} gap-1 bg-[#30363d] p-1 overflow-y-auto`}>
          {activeGameIds.map((gameId) => {
            const def = ALL_MULTILIVE_GAMES.find(g => g.id === gameId);
            if (!def) return null;

            return (
              <div key={gameId} className="bg-[#1a202c] relative flex flex-col overflow-hidden rounded min-h-[220px]">
                {/* Cell Header with Remove (✕) option */}
                <div className="bg-black/75 absolute top-0 left-0 right-0 px-3 py-2 text-xs flex justify-between items-center z-10 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{def.icon}</span>
                    <span className="font-bold text-white">{def.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="bg-[#ff3333] text-white px-1.5 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider animate-pulse">
                      LIVE
                    </span>

                    {/* Button to remove this game from the grid */}
                    <button
                      onClick={() => handleRemoveGame(gameId)}
                      className="p-1 rounded bg-white/10 hover:bg-red-600/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title={`Retire ${def.name} nan gri an`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Render game body */}
                {renderGameContent(gameId)}
              </div>
            );
          })}

          {/* Add Game slot if less than 6 games */}
          {activeGameIds.length < 6 && (
            <div
              onClick={() => {
                playClickSound();
                setIsAddGameOpen(true);
              }}
              className="bg-[#161b22]/70 hover:bg-[#161b22] border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group min-h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 transition-transform group-hover:scale-110">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Ajoute yon Jwèt nan Gri an
              </span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Klike la a pou chwazi Keno, JetX, Borlette, Paris Sportifs, Aviator, Roulette, Slots oswa Lucky 6
              </p>
            </div>
          )}
        </div>

        {/* MODAL TO ADD A GAME TO THE GRID */}
        {isAddGameOpen && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-md w-full p-4 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Chwazi yon Jwèt pou Ajoute nan Gri an</h3>
                </div>
                <button
                  onClick={() => setIsAddGameOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Tout jwèt yo deja aktif nan gri an.</p>
                ) : (
                  availableToAdd.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleAddGame(game.id)}
                      className="p-3 bg-[#1a202c] hover:bg-[#21262d] border border-slate-700/60 hover:border-emerald-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{game.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300">
                              {game.name}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${game.badgeColor}`}>
                              {game.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{game.description}</p>
                        </div>
                      </div>

                      <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-[#30363d] flex justify-end">
                <button
                  onClick={() => setIsAddGameOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fèmen
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
