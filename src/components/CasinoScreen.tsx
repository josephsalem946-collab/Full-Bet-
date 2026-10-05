import React, { useState, useEffect, useRef } from 'react';
import {
  Rocket,
  Dices,
  CircleDot,
  RotateCw,
  TrendingUp,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  History,
  Coins,
  ShieldAlert,
  Lock,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import {
  playClickSound,
  playWinSound,
  playCrashSound,
  playRouletteClick,
  playBetPlacedSound,
  toggleSound,
  isSoundEnabled
} from '../utils/audio';
import { ScrollToTopButton } from './ScrollToTopButton';
import { AmericanRoulette } from './AmericanRoulette';
import { LuckyXGame } from './LuckyXGame';
import { LuckySixGame } from './LuckySixGame';
import { AviatorCompleteGame } from './AviatorCompleteGame';
import { JetXCompleteGame } from './JetXCompleteGame';
import { KenoCompleteGame } from './KenoCompleteGame';
import { useFeatures } from '../context/FeaturesContext';

interface CasinoScreenProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  selectedGame?: 'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix';
  onSelectGame?: (game: 'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix') => void;
}

export const CasinoScreen: React.FC<CasinoScreenProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  selectedGame,
  onSelectGame
}) => {
  const { isGameActive, getGameMaintenanceMessage } = useFeatures();
  const isCrashActive = isGameActive('casino_crash');
  const isKenoActive = isGameActive('casino_keno');
  const isRouletteActive = isGameActive('casino_roulette');
  const isSlotsActive = isGameActive('casino_slots');
  const isLuckyXActive = isGameActive('casino_luckyx');
  const isLuckySixActive = isGameActive('casino_luckysix');

  const [activeGame, setActiveGameInternal] = useState<'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix'>(
    selectedGame || 'keno'
  );

  useEffect(() => {
    if (selectedGame && selectedGame !== activeGame) {
      setActiveGameInternal(selectedGame);
    }
  }, [selectedGame]);

  const setActiveGame = (g: 'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix') => {
    setActiveGameInternal(g);
    onSelectGame?.(g);
  };
  const [soundOn, setSoundOn] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // ===================== CRASH / AVIATOR STATE =====================
  const [crashState, setCrashState] = useState<'idle' | 'running' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [crashBet, setCrashBet] = useState(100);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([2.45, 1.20, 5.80, 1.12, 14.30, 1.85]);
  const [autoCashOut, setAutoCashOut] = useState<number>(2.0);
  const [autoCashOutEnabled, setAutoCashOutEnabled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashAnimationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashTargetRef = useRef<number>(2.0);

  // Generate a random crash point with typical Provably Fair curve
  const generateCrashTarget = () => {
    const rand = Math.random();
    if (rand < 0.04) return 1.00; // instant crash 4%
    return Math.max(1.05, +(1 / (1 - rand * 0.95)).toFixed(2));
  };

  const startCrashRound = () => {
    if (crashBet <= 0) return;
    if (user.balanceHTG < crashBet) {
      alert("Solde insuffisant pour miser.");
      onOpenWallet();
      return;
    }

    // Deduct bet
    onUpdateBalance(user.balanceHTG - crashBet, `Mise Crash Aviator (-${crashBet} HTG)`);
    playBetPlacedSound();

    setHasActiveBet(true);
    setHasCashedOut(false);
    setMultiplier(1.00);
    setCrashState('running');

    crashTargetRef.current = generateCrashTarget();
    startTimeRef.current = performance.now();
  };

  const cashOutCrash = () => {
    if (!hasActiveBet || hasCashedOut || crashState !== 'running') return;
    const winAmount = Math.round(crashBet * multiplier);
    setHasCashedOut(true);
    setHasActiveBet(false);
    playWinSound();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
    onUpdateBalance(user.balanceHTG + winAmount, `Gain Crash Aviator x${multiplier.toFixed(2)} (+${winAmount} HTG)`);
  };

  // Crash Animation Loop
  useEffect(() => {
    if (crashState !== 'running') return;

    let isCancelled = false;

    const animate = (currentTime: number) => {
      if (isCancelled) return;
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      // Multiplier increases exponentially
      const currentMult = +(1.00 + Math.pow(elapsed * 0.7, 1.8)).toFixed(2);

      if (currentMult >= crashTargetRef.current) {
        // Crash happened!
        setMultiplier(crashTargetRef.current);
        setCrashState('crashed');
        playCrashSound();
        setRecentCrashes(prev => [crashTargetRef.current, ...prev.slice(0, 6)]);
        setHasActiveBet(false);
        return;
      }

      setMultiplier(currentMult);

      // Auto cash out check
      if (autoCashOutEnabled && hasActiveBet && !hasCashedOut && currentMult >= autoCashOut) {
        cashOutCrash();
      }

      crashAnimationRef.current = requestAnimationFrame(animate);
    };

    crashAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      if (crashAnimationRef.current) cancelAnimationFrame(crashAnimationRef.current);
    };
  }, [crashState, autoCashOutEnabled, autoCashOut, hasActiveBet, hasCashedOut]);

  // Render Crash Canvas graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = '#141d31';
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 30; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Trajectory Curve
    const progress = Math.min(1, (multiplier - 1) / 8);
    const startX = 30;
    const startY = h - 25;
    const endX = startX + progress * (w - 70);
    const endY = startY - Math.pow(progress, 0.75) * (h - 60);

    // Glowing curve line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(startX + (endX - startX) * 0.5, startY, endX, endY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = crashState === 'crashed' ? '#ef4444' : '#06b6d4';
    ctx.stroke();

    // Gradient fill under curve
    ctx.lineTo(endX, startY);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, endY, 0, startY);
    if (crashState === 'crashed') {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      grad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Rocket Icon or Explosion at tip
    if (crashState === 'crashed') {
      ctx.font = '24px sans-serif';
      ctx.fillText('💥', endX - 12, endY + 8);
    } else {
      ctx.font = '24px sans-serif';
      ctx.fillText('🚀', endX - 12, endY + 8);
    }
  }, [multiplier, crashState]);

  // ===================== SLOTS 777 STATE =====================
  const SLOT_SYMBOLS = ['7️⃣', '💎', '🔔', '🍒', '💵', '🍀'];
  const [reels, setReels] = useState<string[]>(['7️⃣', '💎', '7️⃣']);
  const [isSlotSpinning, setIsSlotSpinning] = useState(false);
  const [slotStake, setSlotStake] = useState<number>(50);
  const [slotMessage, setSlotMessage] = useState<string>('Tentez le Jackpot 777 !');

  const spinSlots = () => {
    if (user.balanceHTG < slotStake) {
      alert("Solde insuffisant.");
      onOpenWallet();
      return;
    }
    onUpdateBalance(user.balanceHTG - slotStake, `Mise Machine à Sous (-${slotStake} HTG)`);
    setIsSlotSpinning(true);
    setSlotMessage('Les rouleaux tournent...');

    let spins = 0;
    const spinInterval = setInterval(() => {
      setReels([
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
        SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
      ]);
      playRouletteClick();
      spins++;
      if (spins > 16) {
        clearInterval(spinInterval);
        setIsSlotSpinning(false);

        // Final outcome
        const finalReels = [
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
          SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
        ];
        // 10% chance of triple 7
        if (Math.random() < 0.12) {
          finalReels[0] = '7️⃣';
          finalReels[1] = '7️⃣';
          finalReels[2] = '7️⃣';
        }
        setReels(finalReels);

        if (finalReels[0] === '7️⃣' && finalReels[1] === '7️⃣' && finalReels[2] === '7️⃣') {
          const jackpot = slotStake * 50;
          playWinSound();
          confetti({ particleCount: 100, spread: 90 });
          setSlotMessage(`🔥 JACKPOT 777 ! +${jackpot.toLocaleString()} HTG`);
          onUpdateBalance(user.balanceHTG + jackpot, `Jackpot 777 Slots (+${jackpot} HTG)`);
        } else if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const win = slotStake * 15;
          playWinSound();
          confetti({ particleCount: 50 });
          setSlotMessage(`✨ TRIPLE ! +${win.toLocaleString()} HTG`);
          onUpdateBalance(user.balanceHTG + win, `Gain Triple Slots (+${win} HTG)`);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
          const smallWin = slotStake * 2;
          playWinSound();
          setSlotMessage(`Double symbole ! +${smallWin.toLocaleString()} HTG`);
          onUpdateBalance(user.balanceHTG + smallWin, `Gain Double Slots (+${smallWin} HTG)`);
        } else {
          setSlotMessage('Pas cette fois. Relancez !');
        }
      }
    }, 100);
  };

  return (
    <div ref={containerRef} className="relative min-h-[calc(100vh-3.5rem)] pb-28 pt-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-4">
        
        {/* Game Switcher Tabs */}
        <div className="flex items-center justify-between bg-[#0e1627] p-1.5 rounded-2xl shadow-md">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => {
                playClickSound();
                setActiveGame('keno');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                activeGame === 'keno'
                  ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-500 text-white shadow-lg ring-1 ring-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                K
              </span>
              <span>Keno</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full uppercase">
                20/80
              </span>
              {!isKenoActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('jetx');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                activeGame === 'jetx'
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg ring-1 ring-yellow-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="font-display italic font-black text-sm">
                <span className={activeGame === 'jetx' ? 'text-black' : 'text-white'}>Jet</span>
                <span className={activeGame === 'jetx' ? 'text-red-700' : 'text-[#fbc02d]'}>X</span>
              </span>
              <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                SmartSoft
              </span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('crash');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                activeGame === 'crash'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rocket className="w-4 h-4 text-cyan-200" />
              <span>Aviator</span>
              {!isCrashActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('roulette');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeGame === 'roulette'
                  ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CircleDot className="w-4 h-4 text-rose-200" />
              <span>Roulette Américaine</span>
              {!isRouletteActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('luckyx');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeGame === 'luckyx'
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-yellow-300 fill-current" />
              <span>⚡ Lucky X</span>
              <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                50 Boules
              </span>
              {!isLuckyXActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('luckysix');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeGame === 'luckysix'
                  ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-base leading-none">🎱</span>
              <span>Lucky Six</span>
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                6/48
              </span>
              {!isLuckySixActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveGame('slots');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeGame === 'slots'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Dices className="w-4 h-4 text-amber-900" />
              <span>Slots 777</span>
              {!isSlotsActive && <Lock className="w-3 h-3 text-red-400 ml-1" />}
            </button>
          </div>

          <button
            onClick={() => {
              const res = toggleSound();
              setSoundOn(res);
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white mr-1"
            title="Activer/Couper le son"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>

        {/* ===================== GAME 0: JETX SMARTSOFT GAMING ===================== */}
        {activeGame === 'jetx' && (
          <JetXCompleteGame
            user={user}
            onUpdateBalance={onUpdateBalance}
            onOpenWallet={onOpenWallet}
          />
        )}

        {/* ===================== GAME: KENO 20/80 ===================== */}
        {activeGame === 'keno' && (
          !isKenoActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Keno 20/80 Temporairement Suspendu
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_keno')}
              </p>
            </div>
          ) : (
            <KenoCompleteGame
              user={user}
              onUpdateBalance={onUpdateBalance}
              onOpenWallet={onOpenWallet}
            />
          )
        )}

        {/* ===================== GAME 1: CRASH AVIATOR (VERSION OFFICIELLE FULL BET AVEC DOUBLE PANNEAU) ===================== */}
        {activeGame === 'crash' && (
          !isCrashActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Crash Aviator Temporairement Suspendu
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_crash')}
              </p>
            </div>
          ) : (
            <AviatorCompleteGame
              user={user}
              onUpdateBalance={onUpdateBalance}
              onOpenWallet={onOpenWallet}
            />
          )
        )}

        {/* ===================== GAME 2: AMERICAN ROULETTE (0 & 00) ===================== */}
        {activeGame === 'roulette' && (
          !isRouletteActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Roulette Américaine Temporairement Suspendue
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_roulette')}
              </p>
            </div>
          ) : (
            <AmericanRoulette
              user={user}
              onUpdateBalance={onUpdateBalance}
              onOpenWallet={onOpenWallet}
              onBack={() => setActiveGame('luckyx')}
            />
          )
        )}

        {/* ===================== GAME 3: SLOTS 777 ===================== */}
        {activeGame === 'slots' && (
          !isSlotsActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Machine à Sous Vegas 777 Temporairement Suspendue
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_slots')}
              </p>
            </div>
          ) : (
            <div className="bg-[#0e1627] rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-white font-display">Machine à Sous Vegas 777</h3>
                  <p className="text-xs text-slate-400">Triple 7 = Jackpot x50 • Triple symbole = x15</p>
                </div>
                <div className="text-xs text-slate-400">
                  Solde : <strong className="text-emerald-400 font-mono-num">{user.balanceHTG.toLocaleString()} HTG</strong>
                </div>
              </div>

              {/* Slots Frame */}
              <div className="py-8 px-4 bg-gradient-to-b from-[#180d2b] to-[#0a0515] rounded-3xl border-4 border-amber-500/50 shadow-2xl flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center gap-3 sm:gap-6">
                  {reels.map((sym, idx) => (
                    <div
                      key={idx}
                      className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-gradient-to-b from-[#2d1b4d] to-[#120a22] border-2 border-amber-400/40 flex items-center justify-center text-4xl sm:text-5xl shadow-inner transition-transform ${
                        isSlotSpinning ? 'animate-bounce' : ''
                      }`}
                    >
                      {sym}
                    </div>
                  ))}
                </div>

                <div className="text-center font-bold text-sm text-amber-300">
                  {slotMessage}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-1/3">
                  <span className="text-[11px] text-slate-400 block mb-1">Mise (HTG) :</span>
                  <input
                    type="number"
                    min="25"
                    value={slotStake}
                    onChange={(e) => setSlotStake(Math.max(25, Number(e.target.value)))}
                    className="w-full bg-[#152038] text-white font-mono-num font-bold px-3 py-2.5 rounded-xl border border-slate-700"
                  />
                </div>

                <button
                  onClick={spinSlots}
                  disabled={isSlotSpinning}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{isSlotSpinning ? 'Lancement...' : `SPIN (${slotStake} HTG)`}</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* ===================== GAME 4: LUCKY X ===================== */}
        {activeGame === 'luckyx' && (
          !isLuckyXActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                ⚡ Lucky X Temporairement Suspendu
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_luckyx')}
              </p>
            </div>
          ) : (
            <LuckyXGame
              user={user}
              onUpdateBalance={onUpdateBalance}
              onOpenWallet={onOpenWallet}
              onBack={() => setActiveGame('keno')}
            />
          )
        )}

        {/* ===================== GAME 5: LUCKY SIX ===================== */}
        {activeGame === 'luckysix' && (
          !isLuckySixActive ? (
            <div className="p-8 sm:p-12 rounded-3xl bg-[#0e1628] border border-red-500/40 text-center space-y-3 shadow-xl">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                🎱 Lucky Six Temporairement Suspendu
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {getGameMaintenanceMessage('casino_luckysix')}
              </p>
            </div>
          ) : (
            <LuckySixGame
              user={user}
              onUpdateBalance={onUpdateBalance}
              onOpenWallet={onOpenWallet}
              onBack={() => setActiveGame('luckyx')}
            />
          )
        )}

      </div>

      <ScrollToTopButton targetRef={containerRef} />
    </div>
  );
};
