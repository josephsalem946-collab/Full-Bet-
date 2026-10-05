import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Trash2,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  Timer,
  Zap,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import {
  playClickSound,
  playWinSound,
  playCrashSound,
  playBetPlacedSound,
  playBallDropSound,
  playRouletteClick
} from '../utils/audio';

interface LuckyXProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  onBack?: () => void;
}

// 5 Color families of 10 balls each strictly matching Lucky X
// Red: 1-10, Blue: 11-20, Green: 21-30, Yellow: 31-40, Purple: 41-50
export type BallColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export interface LuckyBall {
  number: number;
  color: BallColor;
  colorLabel: string;
}

// Helper: Returns full color styling for any ball number 1-50
export function getBallColorConfig(num: number) {
  if (num <= 10) {
    return {
      color: 'red' as const,
      colorLabel: 'Rouge',
      // Realistic 3D Sphere styling
      bgGradient: 'bg-gradient-to-br from-red-500 via-red-600 to-red-950',
      border: 'border-red-400',
      textColor: 'text-white',
      glow: 'shadow-[0_0_10px_rgba(239,68,68,0.7)]',
      centerRing: 'border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.85)]',
      centerBg: 'from-red-950 via-red-900 to-black',
      centerInnerBorder: 'border-red-400/60',
      tagColor: 'bg-red-600 text-white'
    };
  } else if (num <= 20) {
    return {
      color: 'blue' as const,
      colorLabel: 'Bleu',
      bgGradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-950',
      border: 'border-blue-400',
      textColor: 'text-white',
      glow: 'shadow-[0_0_10px_rgba(59,130,246,0.7)]',
      centerRing: 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.85)]',
      centerBg: 'from-blue-950 via-blue-900 to-black',
      centerInnerBorder: 'border-blue-400/60',
      tagColor: 'bg-blue-600 text-white'
    };
  } else if (num <= 30) {
    return {
      color: 'green' as const,
      colorLabel: 'Vert',
      bgGradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-950',
      border: 'border-emerald-400',
      textColor: 'text-white',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.7)]',
      centerRing: 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.85)]',
      centerBg: 'from-emerald-950 via-emerald-900 to-black',
      centerInnerBorder: 'border-emerald-400/60',
      tagColor: 'bg-emerald-600 text-white'
    };
  } else if (num <= 40) {
    return {
      color: 'yellow' as const,
      colorLabel: 'Jaune',
      bgGradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-900',
      border: 'border-yellow-300',
      textColor: 'text-slate-950 font-black',
      glow: 'shadow-[0_0_10px_rgba(234,179,8,0.7)]',
      centerRing: 'border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.85)]',
      centerBg: 'from-amber-950 via-yellow-950 to-black',
      centerInnerBorder: 'border-yellow-400/60',
      tagColor: 'bg-yellow-500 text-slate-950'
    };
  } else {
    return {
      color: 'purple' as const,
      colorLabel: 'Violet',
      bgGradient: 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-950',
      border: 'border-purple-400',
      textColor: 'text-white',
      glow: 'shadow-[0_0_10px_rgba(168,85,247,0.7)]',
      centerRing: 'border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.85)]',
      centerBg: 'from-purple-950 via-purple-900 to-black',
      centerInnerBorder: 'border-purple-400/60',
      tagColor: 'bg-purple-600 text-white'
    };
  }
}

export const LUCKY_X_BALLS: LuckyBall[] = Array.from({ length: 50 }, (_, i) => {
  const num = i + 1;
  const cfg = getBallColorConfig(num);
  return { number: num, color: cfg.color, colorLabel: cfg.colorLabel };
});

export const COLOR_CONFIG: Record<
  BallColor,
  { label: string; ringColor: string; activeColor: string; bg: string; border: string; hex: string }
> = {
  red: {
    label: 'Rouge (1-10)',
    ringColor: 'border-red-500 text-red-500',
    activeColor: 'bg-red-500 text-white',
    bg: 'bg-red-950/60',
    border: 'border-red-500/60',
    hex: '#ef4444'
  },
  blue: {
    label: 'Bleu (11-20)',
    ringColor: 'border-blue-500 text-blue-500',
    activeColor: 'bg-blue-500 text-white',
    bg: 'bg-blue-950/60',
    border: 'border-blue-500/60',
    hex: '#3b82f6'
  },
  green: {
    label: 'Vert (21-30)',
    ringColor: 'border-emerald-500 text-emerald-500',
    activeColor: 'bg-emerald-500 text-white',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/60',
    hex: '#10b981'
  },
  yellow: {
    label: 'Jaune (31-40)',
    ringColor: 'border-yellow-400 text-yellow-400',
    activeColor: 'bg-yellow-400 text-slate-950',
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-500/60',
    hex: '#eab308'
  },
  purple: {
    label: 'Violet (41-50)',
    ringColor: 'border-purple-500 text-purple-500',
    activeColor: 'bg-purple-500 text-white',
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/60',
    hex: '#a855f7'
  }
};

// Official Paytable multipliers for hit counts
const OFFICIAL_HITS_PAYTABLE: { count: number; mult: string; value: number }[] = [
  { count: 1, mult: '-', value: 0 },
  { count: 2, mult: '-', value: 0 },
  { count: 3, mult: '-', value: 0 },
  { count: 4, mult: '-', value: 0 },
  { count: 5, mult: '-', value: 0 },
  { count: 6, mult: '2', value: 2 },
  { count: 7, mult: '3', value: 3 },
  { count: 8, mult: '8', value: 8 },
  { count: 9, mult: '9', value: 9 },
  { count: 10, mult: '20', value: 20 }
];

// Screenshot initial reference round balls (Round 44)
const SCREENSHOT_ROUND_BALLS = [
  11, 19, 23, 13, 32, 18,
  10, 6, 3, 15, 46, 44,
  35, 50, 26, 22, 9, 47,
  8, 41, 48, 20, 29, 2,
  36, 42, 49, 17, 7, 28,
  39, 21, 30, 25, 34, 4
];

// Helper: Formats total seconds into MM:SS (e.g. 60 -> "01:00")
export function formatCountdown(totalSecs: number): string {
  const m = Math.floor(Math.max(0, totalSecs) / 60);
  const s = Math.max(0, totalSecs) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const LuckyXGame: React.FC<LuckyXProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  onBack
}) => {
  // 1. Pause ant chak tiraj : 2 minit 30 segond (150 segond / 02:30)
  const PAUSE_SECONDS = 150; // 02:30
  // 2. Dire round tiraj la : 60 segond (01:00)
  const ROUND_SECONDS = 60; // 60 segond

  // Round & Game state
  const [roundNumber, setRoundNumber] = useState<number>(44);
  const [phase, setPhase] = useState<'betting' | 'drawing' | 'result'>('betting');
  const [countdown, setCountdown] = useState<number>(PAUSE_SECONDS);
  const [drawingCountdown, setDrawingCountdown] = useState<number>(ROUND_SECONDS);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Drawn Balls in active round (36 balls total)
  const [drawnBalls, setDrawnBalls] = useState<number[]>(SCREENSHOT_ROUND_BALLS);
  const [currentDrawnBall, setCurrentDrawnBall] = useState<number | null>(28);
  const [lastWinMessage, setLastWinMessage] = useState<string | null>(null);

  // User Selection
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([8, 23, 3, 49, 13, 18]);
  const [stake, setStake] = useState<number>(50.0);

  // Active Tab: 'chiffres' | 'speciaux'
  const [activeTab, setActiveTab] = useState<'chiffres' | 'speciaux'>('chiffres');

  // Quick Pick & Dropdowns
  const [quickPickCount, setQuickPickCount] = useState<number>(1);
  const [showQuickPickDropdown, setShowQuickPickDropdown] = useState<boolean>(false);
  const [betSystem, setBetSystem] = useState<'simple' | 'system'>('simple');
  const [showSystemDropdown, setShowSystemDropdown] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'first6'>('first6');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  // Active color filter
  const [activeColorFilter, setActiveColorFilter] = useState<BallColor | null>(null);

  // Special Bets Selection
  const [selectedSpecial, setSelectedSpecial] = useState<string | null>(null);

  // Tickets
  const [activeTickets, setActiveTickets] = useState<{
    id: string;
    roundNumber: number;
    numbers: number[];
    stake: number;
    payout: number;
    status: 'pending' | 'won' | 'lost';
  }[]>([]);

  // Refs for auto-timers & drawing
  const drawingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roundTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const selectedNumbersRef = useRef(selectedNumbers);
  selectedNumbersRef.current = selectedNumbers;
  const activeTicketsRef = useRef(activeTickets);
  activeTicketsRef.current = activeTickets;
  const userBalanceRef = useRef(user.balanceHTG);
  userBalanceRef.current = user.balanceHTG;

  // Generate 36 unique random numbers from 1 to 50
  const generate36Draw = (): number[] => {
    const pool = Array.from({ length: 50 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 36);
  };

  // Evaluate results of the 36 balls
  const resolveRoundResults = useCallback(
    (drawn36: number[]) => {
      setPhase('result');
      const tickets = activeTicketsRef.current;
      let totalWon = 0;
      let wonAny = false;

      const updatedTickets = tickets.map(t => {
        const matches = t.numbers.filter(n => drawn36.includes(n));
        const matchCount = matches.length;
        const paySlot = OFFICIAL_HITS_PAYTABLE.find(p => p.count === matchCount);
        const mult = paySlot ? paySlot.value : 0;

        if (mult > 0) {
          const payout = +(t.stake * mult).toFixed(2);
          totalWon += payout;
          wonAny = true;
          return { ...t, payout, status: 'won' as const };
        } else {
          return { ...t, payout: 0, status: 'lost' as const };
        }
      });

      setActiveTickets(updatedTickets);

      if (wonAny && totalWon > 0) {
        if (soundEnabled) playWinSound();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setLastWinMessage(`FÉLICITATIONS ! Gain de ${totalWon.toLocaleString()} HTG !`);
        const newBal = userBalanceRef.current + totalWon;
        onUpdateBalance(newBal, `Gains Lucky X Round #${roundNumber} (+${totalWon} HTG)`);
      } else if (tickets.length > 0) {
        if (soundEnabled) playCrashSound();
        setLastWinMessage(`Aucun gain sur ce tour. Prochain round dans un instant.`);
      } else {
        setLastWinMessage(`Tirage Round #${roundNumber} terminé.`);
      }

      // Automatically reset for next round after 6 seconds of result presentation
      setTimeout(() => {
        setPhase('betting');
        setCountdown(PAUSE_SECONDS); // 02:30 pause restarts automatically
        setDrawingCountdown(ROUND_SECONDS); // 60s round ready
        setRoundNumber(r => r + 1);
        setDrawnBalls([]);
        setCurrentDrawnBall(null);
        setLastWinMessage(null);
        setActiveTickets([]);
      }, 6000);
    },
    [roundNumber, soundEnabled, onUpdateBalance, PAUSE_SECONDS, ROUND_SECONDS]
  );

  // Start Drawing 36 Balls (Pandan egzakteman 60 segond)
  const startDrawingPhase = useCallback(() => {
    setPhase('drawing');
    setLastWinMessage(null);
    setDrawnBalls([]);
    setCurrentDrawnBall(null);
    setDrawingCountdown(ROUND_SECONDS);

    const target36 = generate36Draw();
    let idx = 0;
    const drawnAccumulator: number[] = [];

    if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);
    if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current);

    // Décompte de la durée du round (60s -> 0s)
    roundTimerIntervalRef.current = setInterval(() => {
      setDrawingCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    // Tirage des 36 boules réparties sur les 60 secondes (1666ms par boule)
    const ballIntervalMs = Math.floor((ROUND_SECONDS * 1000) / 36);

    drawingIntervalRef.current = setInterval(() => {
      if (idx >= 36) {
        if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);
        if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current);
        resolveRoundResults(drawnAccumulator);
        return;
      }

      const ball = target36[idx];
      drawnAccumulator.push(ball);
      setDrawnBalls([...drawnAccumulator]);
      setCurrentDrawnBall(ball);

      if (soundEnabled) {
        try {
          playBallDropSound();
        } catch {
          // ignore
        }
      }

      idx++;
    }, ballIntervalMs);
  }, [soundEnabled, resolveRoundResults, ROUND_SECONDS]);

  // Automatic 2:30 countdown effect during 'betting' phase
  useEffect(() => {
    if (phase !== 'betting' || !isAutoEnabled) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Automatically trigger the draw!
          startDrawingPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isAutoEnabled, startDrawingPhase]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);
      if (roundTimerIntervalRef.current) clearInterval(roundTimerIntervalRef.current);
    };
  }, []);

  // Number selection handler (Max 10)
  const toggleNumber = (num: number) => {
    if (soundEnabled) playClickSound();
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 10) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  // Color Filter Click (1-click color picks)
  const handleColorClick = (color: BallColor) => {
    if (soundEnabled) playClickSound();
    setActiveColorFilter(activeColorFilter === color ? null : color);
    const colorBalls = LUCKY_X_BALLS.filter(b => b.color === color).map(b => b.number);
    setSelectedNumbers(colorBalls);
  };

  // Quick Pick
  const handleRandomPick = (count: number) => {
    if (soundEnabled) playClickSound();
    const shuffled = [...Array(50).keys()].map(i => i + 1).sort(() => 0.5 - Math.random());
    setSelectedNumbers(shuffled.slice(0, count).sort((a, b) => a - b));
    setShowQuickPickDropdown(false);
  };

  // Trash / Clear
  const handleClear = () => {
    if (soundEnabled) playClickSound();
    setSelectedNumbers([]);
    setActiveColorFilter(null);
    setSelectedSpecial(null);
  };

  // Place Bet
  const handleAddBet = () => {
    if (selectedNumbers.length === 0 && !selectedSpecial) return;

    if (user.balanceHTG < stake) {
      if (soundEnabled) playCrashSound();
      alert('Solde insuffisant pour placer ce pari.');
      onOpenWallet();
      return;
    }

    onUpdateBalance(
      +(user.balanceHTG - stake).toFixed(2),
      `Lucky X Round #${roundNumber} - Pari (${stake} HTG)`
    );

    if (soundEnabled) playBetPlacedSound();

    const newTicket = {
      id: `LX-${roundNumber}-${Date.now().toString().slice(-4)}`,
      roundNumber,
      numbers: [...selectedNumbers],
      stake,
      payout: 0,
      status: 'pending' as const
    };

    setActiveTickets(prev => [...prev, newTicket]);
  };

  // Left wing (18 balls) & Right wing (18 balls)
  const leftWingBalls = drawnBalls.slice(0, 18);
  const rightWingBalls = drawnBalls.slice(18, 36);

  // Check if ball matches user's selection
  const isBallMatched = (num: number | null | undefined): boolean => {
    if (!num) return false;
    return selectedNumbers.includes(num);
  };

  // Get color config for current drawn ball
  const centerBallCfg = currentDrawnBall ? getBallColorConfig(currentDrawnBall) : null;

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl mx-auto rounded-3xl bg-[#070b13] border border-slate-800 shadow-2xl overflow-hidden font-sans select-none text-white">
      {/* ================= 1. HEADER (← Back Arrow, Title "LUCKY X", Auto 2:30 Toggle, "44 ROUND") ================= */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#05080f] border-b border-slate-900 gap-2">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
          )}

          {/* Title LUCKY X in cyan */}
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black italic tracking-wide text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.6)] font-display">
              LUCKY X
            </span>
          </div>

          {/* Auto 2:30 Mode Toggle */}
          <button
            onClick={() => {
              if (soundEnabled) playClickSound();
              setIsAutoEnabled(prev => !prev);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1 shrink-0 ${
              isAutoEnabled
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Activer ou suspendre la pause automatique 2:30"
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isAutoEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>Auto 2:30 {isAutoEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Live Countdown & Round Number */}
        <div className="flex items-center gap-2">
          {/* Digital Timer */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span
              className={`font-mono-num font-black text-xs sm:text-sm ${
                (phase === 'betting' && countdown <= 10) || (phase === 'drawing' && drawingCountdown <= 5)
                  ? 'text-red-400 animate-pulse'
                  : phase === 'betting'
                  ? 'text-amber-400'
                  : 'text-cyan-300'
              }`}
            >
              {phase === 'betting'
                ? formatCountdown(countdown)
                : phase === 'drawing'
                ? formatCountdown(drawingCountdown)
                : 'PAUSE 02:30'}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Round display: "44 ROUND" */}
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-black font-mono text-slate-200">
              {roundNumber}
            </span>
            <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              ROUND
            </span>
          </div>
        </div>
      </div>

      {/* ================= 2. THE DRAWING STAGE (Each Ball Corresponds to its Color!) ================= */}
      <div className="relative w-full py-4 px-3 sm:px-5 bg-radial from-[#0e2752] via-[#091b3b] to-[#040c1c] overflow-hidden border-b border-slate-900">
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          
          {/* LEFT WING: 3 columns x 6 rows = 18 balls with THEIR EXACT COLOR */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 z-10">
            {Array.from({ length: 18 }).map((_, idx) => {
              const ballNumber = leftWingBalls[idx];
              const ballCfg = ballNumber ? getBallColorConfig(ballNumber) : null;
              const matched = isBallMatched(ballNumber);

              return (
                <div
                  key={`left-${idx}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all duration-300 relative ${
                    ballNumber && ballCfg
                      ? matched
                        ? `${ballCfg.bgGradient} border-2 border-yellow-300 ${ballCfg.textColor} ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] scale-105 z-10 animate-pulse`
                        : `${ballCfg.bgGradient} border ${ballCfg.border} ${ballCfg.textColor} ${ballCfg.glow}`
                      : 'bg-[#071328]/60 border border-slate-800 text-transparent'
                  }`}
                  title={ballNumber && ballCfg ? `#${ballNumber} ${ballCfg.colorLabel}` : ''}
                >
                  {ballNumber ?? ''}
                  {matched && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[7px] flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* CENTER BIG BALL: Dynamically styled to match current drawn ball color */}
          <div className="relative flex flex-col items-center justify-center px-2 z-10">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center">
              {/* Outer Glowing Neon Ring Matching Ball Color */}
              <div
                className={`w-22 h-22 sm:w-26 sm:h-26 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                  centerBallCfg
                    ? `${centerBallCfg.centerRing} bg-gradient-to-b ${centerBallCfg.centerBg}`
                    : 'border-cyan-500 shadow-[0_0_25px_rgba(0,229,255,0.7)] bg-gradient-to-b from-[#091f38] via-[#041020] to-black'
                }`}
              >
                {/* Inner Concentric Fine Ring */}
                <div
                  className={`w-18 h-18 sm:w-21 sm:h-21 rounded-full border flex flex-col items-center justify-center transition-all duration-300 ${
                    centerBallCfg ? centerBallCfg.centerInnerBorder : 'border-cyan-400/60'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {currentDrawnBall ?? (phase === 'betting' ? formatCountdown(countdown) : formatCountdown(drawingCountdown))}
                  </span>

                  {currentDrawnBall && centerBallCfg && (
                    <span className="text-[8px] font-black uppercase tracking-wider text-white/90">
                      {centerBallCfg.colorLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown / Phase Subtitle */}
            <div className="mt-1 text-center">
              {phase === 'betting' ? (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-300'
                  }`}
                >
                  Tirage dans {formatCountdown(countdown)} (Pause 2:30)
                </span>
              ) : phase === 'drawing' ? (
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider animate-pulse">
                  Round 60s an dirèk ({formatCountdown(drawingCountdown)}) • {drawnBalls.length}/36 boul
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Résultats validés
                </span>
              )}
            </div>
          </div>

          {/* RIGHT WING: 3 columns x 6 rows = 18 balls with THEIR EXACT COLOR */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 z-10">
            {Array.from({ length: 18 }).map((_, idx) => {
              const ballNumber = rightWingBalls[idx];
              const ballCfg = ballNumber ? getBallColorConfig(ballNumber) : null;
              const matched = isBallMatched(ballNumber);

              return (
                <div
                  key={`right-${idx}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all duration-300 relative ${
                    ballNumber && ballCfg
                      ? matched
                        ? `${ballCfg.bgGradient} border-2 border-yellow-300 ${ballCfg.textColor} ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] scale-105 z-10 animate-pulse`
                        : `${ballCfg.bgGradient} border ${ballCfg.border} ${ballCfg.textColor} ${ballCfg.glow}`
                      : 'bg-[#071328]/60 border border-slate-800 text-transparent'
                  }`}
                  title={ballNumber && ballCfg ? `#${ballNumber} ${ballCfg.colorLabel}` : ''}
                >
                  {ballNumber ?? ''}
                  {matched && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[7px] flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Win / Loss Result Banner */}
        {lastWinMessage && (
          <div
            className={`mt-3 py-2 px-3 rounded-xl text-center text-xs font-black flex items-center justify-center gap-1.5 animate-in fade-in-50 duration-200 ${
              lastWinMessage.includes('FÉLICITATIONS')
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/90 text-slate-300 border border-slate-700'
            }`}
          >
            {lastWinMessage.includes('FÉLICITATIONS') ? (
              <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400" />
            )}
            <span>{lastWinMessage}</span>
          </div>
        )}

        {/* ================= 3. MULTIPLIERS / HITS ROW (Matching screenshot) ================= */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
          <div className="grid grid-cols-10 gap-0.5 text-center text-xs font-mono">
            {OFFICIAL_HITS_PAYTABLE.map(item => (
              <div key={item.count} className="flex flex-col items-center">
                <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
                  {item.count}
                </span>
                <span
                  className={`text-xs sm:text-sm font-black mt-0.5 ${
                    item.value > 0 ? 'text-slate-100 font-extrabold' : 'text-slate-600'
                  }`}
                >
                  {item.mult}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 3B. AUTOMATIC PAUSE & DRAWING STATUS BANNER ================= */}
        {phase === 'betting' && (
          <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-[#0a152e] to-indigo-950/80 border border-cyan-500/40 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                <Timer className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Pause Automatique 02:30 (Round #{roundNumber})
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Auto 2:30 ON
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Chwazi boul ou yo (1-50). Pwochèn round 60 segond la ap kòmanse nan fen kontrebous 2:30 la.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  Temps restant
                </span>
                <span className="font-mono-num font-black text-base sm:text-lg text-[#00e5ff] tracking-tight drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>
          </div>
        )}

        {phase === 'drawing' && (
          <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#08182d] to-blue-950/80 border border-emerald-500/40 shadow-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Round 60 Segond an Dirèk (Round #{roundNumber})
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-red-600 text-white animate-pulse">
                    LIVE 60S
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Tiraj 36 boul k ap dewoule an tan reyèl sou 60 segond ({drawnBalls.length}/36 boul sòti).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                  Fin Round la
                </span>
                <span className="font-mono-num font-black text-base sm:text-lg text-emerald-400 tracking-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                  {formatCountdown(drawingCountdown)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. ACTION BAR (Trash Button + "Ajoutez le pari" / "Lancer Tirage") ================= */}
        <div className="flex items-center gap-2 mt-3">
          {/* Trash button */}
          <button
            onClick={handleClear}
            disabled={phase === 'drawing'}
            className="w-12 h-11 rounded-xl bg-[#141822] hover:bg-[#1a2030] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors cursor-pointer active:scale-95 disabled:opacity-40"
            title="Effacer la sélection"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* "Ajoutez le pari" Button */}
          <button
            onClick={handleAddBet}
            disabled={phase === 'drawing' || (selectedNumbers.length === 0 && !selectedSpecial)}
            className={`flex-1 h-11 rounded-xl font-bold text-sm tracking-wide transition-all uppercase flex items-center justify-center cursor-pointer active:scale-98 ${
              selectedNumbers.length > 0 || selectedSpecial
                ? 'bg-gradient-to-r from-[#b71c1c] via-[#c62828] to-[#d32f2f] hover:from-[#c62828] hover:to-[#e53935] text-white shadow-[0_4px_16px_rgba(183,28,28,0.5)] border border-red-500/50'
                : 'bg-[#1e1315] border border-red-950/60 text-[#7f393d] cursor-not-allowed'
            }`}
          >
            <span>
              {selectedNumbers.length > 0
                ? `Ajoutez le pari (${stake.toFixed(2)} HTG)`
                : 'Ajoutez le pari'}
            </span>
          </button>

          {/* Instant Launch Button (if player doesn't want to wait the 2:30) */}
          <button
            onClick={startDrawingPhase}
            disabled={phase === 'drawing'}
            className="px-3.5 h-11 rounded-xl bg-[#1d64d8] hover:bg-[#2563eb] text-white font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-40 shrink-0"
            title="Lancer le tirage immédiatement"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Lancer</span>
          </button>
        </div>
      </div>

      {/* ================= 5. TABS: "Paris sur des chiffres" | "Paris spéciaux" ================= */}
      <div className="flex bg-[#070b13] border-b border-slate-800/80 px-2 pt-2">
        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            setActiveTab('chiffres');
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'chiffres'
              ? 'bg-[#181d28] text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Paris sur des chiffres
        </button>

        <button
          onClick={() => {
            if (soundEnabled) playClickSound();
            setActiveTab('speciaux');
          }}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'speciaux'
              ? 'bg-[#181d28] text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Paris spéciaux
        </button>
      </div>

      {/* ================= TAB 1: PARIS SUR DES CHIFFRES ================= */}
      {activeTab === 'chiffres' && (
        <div className="p-3 bg-[#11151f] space-y-2.5">
          {/* Dropdown 1: Sélection aléatoire 1 ▾ */}
          <div className="relative">
            <button
              onClick={() => setShowQuickPickDropdown(!showQuickPickDropdown)}
              disabled={phase === 'drawing'}
              className="w-full h-10 px-3 rounded-xl bg-[#1c2230] hover:bg-[#232b3d] border border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
            >
              <span>Sélection aléatoire {quickPickCount}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showQuickPickDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#161c28] border border-slate-700 rounded-xl p-1 shadow-2xl grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setQuickPickCount(cnt);
                      handleRandomPick(cnt);
                    }}
                    className={`py-1.5 text-xs font-mono font-bold rounded-lg ${
                      quickPickCount === cnt
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown 2: Système ▾ */}
          <div className="relative">
            <button
              onClick={() => setShowSystemDropdown(!showSystemDropdown)}
              disabled={phase === 'drawing'}
              className="w-full h-10 px-3 rounded-xl bg-[#1c2230] border border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-400 transition-colors disabled:opacity-50"
            >
              <span>{betSystem === 'simple' ? 'Système' : 'Système Actif'}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showSystemDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#161c28] border border-slate-700 rounded-xl p-1.5 shadow-2xl space-y-1 text-xs">
                <button
                  onClick={() => {
                    setBetSystem('simple');
                    setShowSystemDropdown(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-200"
                >
                  Simple (Tous les numéros sélectionnés doivent être tirés)
                </button>
                <button
                  onClick={() => {
                    setBetSystem('system');
                    setShowSystemDropdown(false);
                  }}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-cyan-300"
                >
                  Système (Gagnez dès 6 numéros correspondants)
                </button>
              </div>
            )}
          </div>

          {/* Dropdown 3: Numéro parmi les 6 premiers */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="w-full h-10 px-3 rounded-xl bg-[#1c2230] border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-300 transition-colors"
            >
              <span>
                {filterMode === 'first6'
                  ? 'Numéro parmi les 6 premiers'
                  : 'Tous les 36 numéros tirés'}
              </span>
            </button>
          </div>

          {/* ================= 5 COLOR RINGS (Red, Blue, Green, Yellow, Purple) ================= */}
          <div className="flex items-center justify-around py-1.5 px-2 bg-[#0b0e17] rounded-xl border border-slate-800">
            {(['red', 'blue', 'green', 'yellow', 'purple'] as BallColor[]).map(color => {
              const isFilterActive = activeColorFilter === color;
              const cfg = COLOR_CONFIG[color];

              return (
                <button
                  key={color}
                  onClick={() => handleColorClick(color)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
                    cfg.ringColor
                  } ${
                    isFilterActive
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'hover:scale-105'
                  }`}
                  title={cfg.label}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      isFilterActive ? 'bg-white' : 'bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* ================= 50 NUMBERS GRID (Each ball strictly corresponds to its family color: Red 1-10, Blue 11-20, Green 21-30, Yellow 31-40, Purple 41-50) ================= */}
          <div className="bg-[#0b0e17] p-2.5 rounded-2xl border border-slate-800 shadow-inner">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {LUCKY_X_BALLS.map(ball => {
                const isSelected = selectedNumbers.includes(ball.number);
                const isDrawn = drawnBalls.includes(ball.number);
                const ballCfg = getBallColorConfig(ball.number);

                let btnStyle = '';

                if (isSelected && isDrawn) {
                  // Matched in draw + selected!
                  btnStyle = `${ballCfg.bgGradient} border-2 border-yellow-300 ${ballCfg.textColor} ring-4 ring-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.95)] scale-110 font-black animate-pulse z-10`;
                } else if (isSelected) {
                  // User selected ball
                  btnStyle = `${ballCfg.bgGradient} border-2 border-white ${ballCfg.textColor} ring-2 ring-white/90 shadow-lg scale-105 font-black z-10`;
                } else if (isDrawn) {
                  // Ball has been drawn
                  btnStyle = `${ballCfg.bgGradient} border-2 border-yellow-400/90 ${ballCfg.textColor} opacity-95 shadow-md`;
                } else {
                  // Normal idle state: EVERY BALL CORRESPONDS TO ITS EXACT COLOR!
                  btnStyle = `${ballCfg.bgGradient} border ${ballCfg.border} ${ballCfg.textColor} ${ballCfg.glow} hover:brightness-125 hover:scale-105 transition-all`;
                }

                return (
                  <button
                    key={ball.number}
                    onClick={() => toggleNumber(ball.number)}
                    disabled={phase === 'drawing'}
                    className={`w-10 h-10 sm:w-11 sm:h-11 mx-auto rounded-full border flex flex-col items-center justify-center font-mono font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer relative shadow-md ${btnStyle}`}
                    title={`#${ball.number} (${ballCfg.colorLabel})`}
                  >
                    {/* Shiny 3D Glass Reflection Arc on Top */}
                    <span className="absolute top-1 left-2 w-3.5 h-1.5 rounded-full bg-white/35 pointer-events-none" />

                    {/* Ball Number */}
                    <span className="relative z-10 drop-shadow-sm font-black">{ball.number}</span>

                    {/* Selected Golden Checkmark Badge */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 text-slate-950 font-black text-[8px] flex items-center justify-center shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake selector bar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#0b0e17] rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-bold">Mise :</span>
            <div className="flex items-center gap-1">
              {[25, 50, 100, 250].map(amt => (
                <button
                  key={amt}
                  disabled={phase === 'drawing'}
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    setStake(amt);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs transition-colors ${
                    stake === amt
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <span className="font-mono font-black text-amber-400">{stake.toFixed(2)} HTG</span>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PARIS SPÉCIAUX ================= */}
      {activeTab === 'speciaux' && (
        <div className="p-3 bg-[#11151f] space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'first_red', label: '1ère boule : Rouge', mult: 'x4.8' },
              { id: 'first_blue', label: '1ère boule : Bleu', mult: 'x4.8' },
              { id: 'first_green', label: '1ère boule : Vert', mult: 'x4.8' },
              { id: 'first_yellow', label: '1ère boule : Jaune', mult: 'x4.8' },
              { id: 'first_purple', label: '1ère boule : Violet', mult: 'x4.8' },
              { id: 'first_even', label: '1ère boule : Paire', mult: 'x1.9' },
              { id: 'first_odd', label: '1ère boule : Impaire', mult: 'x1.9' },
              { id: 'under_25', label: '1ère boule : < 25.5', mult: 'x1.9' }
            ].map(spec => (
              <button
                key={spec.id}
                onClick={() => {
                  if (soundEnabled) playClickSound();
                  setSelectedSpecial(selectedSpecial === spec.id ? null : spec.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedSpecial === spec.id
                    ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md'
                    : 'bg-[#181d28] border-slate-700/80 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-bold">{spec.label}</div>
                <div className="font-mono font-black text-amber-400 text-[11px]">{spec.mult}</div>
              </button>
            ))}
          </div>

          {/* Stake selector bar */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-[#0b0e17] rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-bold">Mise :</span>
            <div className="flex items-center gap-1">
              {[25, 50, 100, 250].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    if (soundEnabled) playClickSound();
                    setStake(amt);
                  }}
                  className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs ${
                    stake === amt
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <span className="font-mono font-black text-amber-400">{stake.toFixed(2)} HTG</span>
          </div>
        </div>
      )}

      {/* ================= 6. ACTIVE TICKETS DRAWER / NOTICE ================= */}
      {activeTickets.length > 0 && (
        <div className="p-3 bg-[#090d16] border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">
              Tickets en cours ({activeTickets.length}) :
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">Round #{roundNumber}</span>
          </div>

          <div className="space-y-1.5">
            {activeTickets.map(t => (
              <div
                key={t.id}
                className="p-2 rounded-xl bg-[#141822] border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Numéros :</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {t.numbers.map(num => {
                        const bCfg = getBallColorConfig(num);
                        const isHit = drawnBalls.includes(num);
                        return (
                          <span
                            key={num}
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-sm relative ${
                              isHit
                                ? `${bCfg.bgGradient} text-white ring-2 ring-yellow-400 font-black`
                                : `${bCfg.bgGradient} ${bCfg.textColor} border ${bCfg.border}`
                            }`}
                            title={`#${num} ${bCfg.colorLabel}`}
                          >
                            {num}
                            {isHit && (
                              <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 text-slate-950 font-black text-[6px] flex items-center justify-center">
                                ✓
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Mise : {t.stake} HTG</div>
                </div>

                <div className="text-right">
                  {t.status === 'won' ? (
                    <span className="font-mono font-black text-emerald-400">
                      +{t.payout} HTG
                    </span>
                  ) : t.status === 'lost' ? (
                    <span className="font-bold text-rose-400 text-[11px]">Perdu</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      En jeu
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
