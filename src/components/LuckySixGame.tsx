import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Trash2,
  Sparkles,
  Trophy,
  History,
  Volume2,
  VolumeX,
  Play,
  Clock,
  RotateCcw,
  CheckCircle2,
  Star,
  Info,
  ChevronRight,
  Flame,
  Zap,
  Printer,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { TicketPrintModal, PrintableTicketData } from './TicketPrintModal';
import {
  playClickSound,
  playWinSound,
  playCrashSound,
  playBallDropSound,
  playBetPlacedSound,
  isSoundEnabled
} from '../utils/audio';

// 8 Official Color Families (each strictly 6 numbers = 48 total)
export type SixBallColor =
  | 'red'
  | 'green'
  | 'blue'
  | 'purple'
  | 'brown'
  | 'yellow'
  | 'orange'
  | 'grey';

export interface LuckySixBall {
  number: number;
  color: SixBallColor;
  colorLabel: string;
  colorHex: string;
  colorBorder: string;
  colorBg: string;
}

export const COLOR_CONFIG: Record<
  SixBallColor,
  { label: string; hex: string; border: string; text: string; bg: string; glow: string; badge: string; shadow: string }
> = {
  red: {
    label: 'Rouge',
    hex: '#ef4444',
    border: 'border-[#ef4444]',
    text: 'text-red-400',
    bg: 'bg-[#ef4444]',
    glow: 'shadow-[0_0_12px_rgba(239,68,68,0.8)]',
    badge: 'bg-[#ef4444]',
    shadow: 'rgba(239,68,68,0.6)'
  },
  green: {
    label: 'Vert',
    hex: '#22c55e',
    border: 'border-[#22c55e]',
    text: 'text-emerald-400',
    bg: 'bg-[#22c55e]',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.8)]',
    badge: 'bg-[#22c55e]',
    shadow: 'rgba(34,197,94,0.6)'
  },
  blue: {
    label: 'Bleu',
    hex: '#3b82f6',
    border: 'border-[#3b82f6]',
    text: 'text-blue-400',
    bg: 'bg-[#3b82f6]',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.8)]',
    badge: 'bg-[#3b82f6]',
    shadow: 'rgba(59,130,246,0.6)'
  },
  purple: {
    label: 'Violet',
    hex: '#c084fc',
    border: 'border-[#c084fc]',
    text: 'text-purple-300',
    bg: 'bg-[#c084fc]',
    glow: 'shadow-[0_0_12px_rgba(192,132,252,0.8)]',
    badge: 'bg-[#c084fc]',
    shadow: 'rgba(192,132,252,0.6)'
  },
  brown: {
    label: 'Marron',
    hex: '#b45309',
    border: 'border-[#b45309]',
    text: 'text-amber-500',
    bg: 'bg-[#b45309]',
    glow: 'shadow-[0_0_12px_rgba(180,83,9,0.8)]',
    badge: 'bg-[#b45309]',
    shadow: 'rgba(180,83,9,0.6)'
  },
  yellow: {
    label: 'Jaune',
    hex: '#facc15',
    border: 'border-[#facc15]',
    text: 'text-yellow-300',
    bg: 'bg-[#facc15]',
    glow: 'shadow-[0_0_12px_rgba(250,204,21,0.8)]',
    badge: 'bg-[#facc15]',
    shadow: 'rgba(250,204,21,0.6)'
  },
  orange: {
    label: 'Orange',
    hex: '#f97316',
    border: 'border-[#f97316]',
    text: 'text-orange-400',
    bg: 'bg-[#f97316]',
    glow: 'shadow-[0_0_12px_rgba(249,115,22,0.8)]',
    badge: 'bg-[#f97316]',
    shadow: 'rgba(249,115,22,0.6)'
  },
  grey: {
    label: 'Gris',
    hex: '#94a3b8',
    border: 'border-[#94a3b8]',
    text: 'text-slate-300',
    bg: 'bg-[#94a3b8]',
    glow: 'shadow-[0_0_12px_rgba(148,163,184,0.8)]',
    badge: 'bg-[#94a3b8]',
    shadow: 'rgba(148,163,184,0.6)'
  }
};

// 8 Official Color Arrays of 6 numbers strictly
export const COLOR_NUMBERS: Record<SixBallColor, number[]> = {
  red: [1, 9, 17, 25, 33, 41],
  green: [2, 10, 18, 26, 34, 42],
  blue: [3, 11, 19, 27, 35, 43],
  purple: [4, 12, 20, 28, 36, 44],
  brown: [5, 13, 21, 29, 37, 45],
  yellow: [6, 14, 22, 30, 38, 46],
  orange: [7, 15, 23, 31, 39, 47],
  grey: [8, 16, 24, 32, 40, 48]
};

// Generates the 48 balls according to the official rule
export const LUCKY_SIX_BALLS: LuckySixBall[] = Array.from({ length: 48 }, (_, i) => {
  const number = i + 1;
  const colorIndex = (number - 1) % 8;
  const colorsOrder: SixBallColor[] = [
    'red',
    'green',
    'blue',
    'purple',
    'brown',
    'yellow',
    'orange',
    'grey'
  ];
  const color = colorsOrder[colorIndex];
  const cfg = COLOR_CONFIG[color];
  return {
    number,
    color,
    colorLabel: cfg.label,
    colorHex: cfg.hex,
    colorBorder: cfg.border,
    colorBg: cfg.bg
  };
});

// Official 30 Multipliers (positions 6 to 35)
export interface PayoutSlot {
  position: number; // 6 to 35
  multiplier: number;
  label: string;
  hasStar?: boolean;
}

export const PAYOUT_SLOTS: PayoutSlot[] = [
  // Gauche - Col 1 (Pos 6 à 10)
  { position: 6, multiplier: 10000, label: '10k', hasStar: true },
  { position: 7, multiplier: 7500, label: '7.5k' },
  { position: 8, multiplier: 5000, label: '5k' },
  { position: 9, multiplier: 2500, label: '2.5k' },
  { position: 10, multiplier: 1000, label: '1k' },
  // Gauche - Col 2 (Pos 11 à 15)
  { position: 11, multiplier: 500, label: '500' },
  { position: 12, multiplier: 300, label: '300' },
  { position: 13, multiplier: 200, label: '200' },
  { position: 14, multiplier: 150, label: '150' },
  { position: 15, multiplier: 100, label: '100' },
  // Gauche - Col 3 (Pos 16 à 20)
  { position: 16, multiplier: 80, label: '80' },
  { position: 17, multiplier: 60, label: '60' },
  { position: 18, multiplier: 40, label: '40' },
  { position: 19, multiplier: 30, label: '30' },
  { position: 20, multiplier: 25, label: '25' },
  // Droite - Col 4 (Pos 21 à 25)
  { position: 21, multiplier: 20, label: '20' },
  { position: 22, multiplier: 18, label: '18' },
  { position: 23, multiplier: 16, label: '16', hasStar: true },
  { position: 24, multiplier: 14, label: '14' },
  { position: 25, multiplier: 12, label: '12' },
  // Droite - Col 5 (Pos 26 à 30)
  { position: 26, multiplier: 10, label: '10' },
  { position: 27, multiplier: 9, label: '9' },
  { position: 28, multiplier: 8, label: '8' },
  { position: 29, multiplier: 7, label: '7' },
  { position: 30, multiplier: 6, label: '6' },
  // Droite - Col 6 (Pos 31 à 35)
  { position: 31, multiplier: 5, label: '5' },
  { position: 32, multiplier: 4, label: '4' },
  { position: 33, multiplier: 3, label: '3' },
  { position: 34, multiplier: 2, label: '2' },
  { position: 35, multiplier: 1, label: '1' }
];

// Reference Round #89 from user specification:
// Top 5: 34, 16, 36, 35, 10
export const REFERENCE_ROUND_89: number[] = [
  34, 16, 36, 35, 10,
  3, 14, 43, 41, 23,
  1, 9, 17, 25, 33,
  2, 18, 26, 42, 4,
  12, 20, 28, 44, 5,
  13, 21, 29, 37, 45,
  6, 22, 30, 38, 46
];

export interface LuckySixTicket {
  id: string;
  roundNumber: number;
  betType: 'standard_6' | 'color_6' | 'sum_5_under' | 'sum_5_over' | 'first_ball_color' | 'more_even' | 'more_odd';
  selectedNumbers?: number[];
  selectedColor?: SixBallColor;
  label: string;
  stakeHTG: number;
  multiplier: number;
  potentialWinHTG: number;
  status: 'pending' | 'won' | 'lost';
  payoutHTG?: number;
  winningPosition?: number;
  createdAt: string;
}

interface LuckySixGameProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  onBack?: () => void;
}

export const LuckySixGame: React.FC<LuckySixGameProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  onBack
}) => {
  // Round management
  const [roundNumber, setRoundNumber] = useState<number>(118);
  const [gameState, setGameState] = useState<'pause' | 'drawing' | 'finished'>('pause');
  
  // Timer state: 2:30 pause (150s), 60s draw
  const [pauseTimer, setPauseTimer] = useState<number>(150); // 2:30 in seconds
  const [drawnBalls, setDrawnBalls] = useState<number[]>([]);
  const [currentDrawnBall, setCurrentDrawnBall] = useState<number | null>(23); // Default visible center ball

  // Betting selection
  const [activeTab, setActiveTab] = useState<'chiffres' | 'speciaux'>('chiffres');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [stake, setStake] = useState<number>(50);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Tickets
  const [tickets, setTickets] = useState<LuckySixTicket[]>([]);
  const [lastRoundResult, setLastRoundResult] = useState<{ won: boolean; totalWon: number } | null>(null);
  const [printTicketData, setPrintTicketData] = useState<PrintableTicketData | null>(null);

  // Audio helper
  const playSound = (fn: () => void) => {
    if (!soundMuted && isSoundEnabled()) {
      fn();
    }
  };

  // Ball map for easy lookup
  const ballMap = useMemo(() => {
    const map = new Map<number, LuckySixBall>();
    LUCKY_SIX_BALLS.forEach(b => map.set(b.number, b));
    return map;
  }, []);

  // Top 5 balls
  const top5Balls = useMemo(() => {
    return drawnBalls.slice(0, 5);
  }, [drawnBalls]);

  // Drawn balls in the 30 payout positions (positions 6 to 35 -> index 5 to 34)
  const payoutBallsMap = useMemo(() => {
    const map = new Map<number, number>(); // position (6 to 35) -> ball number
    for (let i = 5; i < drawnBalls.length; i++) {
      map.set(i + 1, drawnBalls[i]);
    }
    return map;
  }, [drawnBalls]);

  // Stats of drawn balls
  const oddCount = useMemo(() => {
    return top5Balls.filter(n => n % 2 !== 0).length;
  }, [top5Balls]);

  const evenCount = useMemo(() => {
    return top5Balls.filter(n => n % 2 === 0).length;
  }, [top5Balls]);

  const sumTop5 = useMemo(() => {
    return top5Balls.reduce((acc, curr) => acc + curr, 0);
  }, [top5Balls]);

  // Generate sequence of 35 balls
  const generateDrawSequence = (): number[] => {
    const all = Array.from({ length: 48 }, (_, i) => i + 1);
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 35);
  };

  // Full draw sequence for current round
  const currentSequenceRef = useRef<number[]>(REFERENCE_ROUND_89);

  // 1. Timer for Pause (2:30 = 150 seconds)
  useEffect(() => {
    let interval: any = null;
    if (gameState === 'pause') {
      interval = setInterval(() => {
        setPauseTimer(prev => {
          if (prev <= 1) {
            startDraw();
            return 150;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // 2. Draw loop: 35 balls in 60 seconds (~1.7s per ball)
  useEffect(() => {
    let timer: any = null;
    if (gameState === 'drawing') {
      const intervalMs = Math.round(60000 / 35); // ~1714ms
      let drawnCount = 0;

      timer = setInterval(() => {
        if (drawnCount < currentSequenceRef.current.length) {
          const nextBall = currentSequenceRef.current[drawnCount];
          setCurrentDrawnBall(nextBall);
          setDrawnBalls(prev => [...prev, nextBall]);
          playSound(playBallDropSound);
          drawnCount++;
        } else {
          clearInterval(timer);
          finishRound();
        }
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // Start Draw
  const startDraw = () => {
    currentSequenceRef.current = generateDrawSequence();
    setDrawnBalls([]);
    setCurrentDrawnBall(null);
    setGameState('drawing');
    setLastRoundResult(null);
  };

  // Skip wait and trigger immediate draw
  const handleImmediateDraw = () => {
    playClickSound();
    setPauseTimer(0);
    startDraw();
  };

  // Finish Round & Evaluate Tickets
  const finishRound = () => {
    setGameState('finished');
    const finalDrawn = currentSequenceRef.current;
    let totalWon = 0;

    const evaluatedTickets = tickets.map(t => {
      if (t.roundNumber !== roundNumber || t.status !== 'pending') return t;

      if (t.betType === 'standard_6' && t.selectedNumbers) {
        // Check when 6th number matched
        const indices = t.selectedNumbers.map(num => finalDrawn.indexOf(num)).filter(idx => idx !== -1);
        if (indices.length === 6) {
          const lastIndex = Math.max(...indices);
          const position = lastIndex + 1; // 1 to 35
          if (position >= 6 && position <= 35) {
            const slot = PAYOUT_SLOTS.find(s => s.position === position);
            const mult = slot ? slot.multiplier : 1;
            const payout = t.stakeHTG * mult;
            totalWon += payout;
            return {
              ...t,
              status: 'won' as const,
              multiplier: mult,
              winningPosition: position,
              payoutHTG: payout
            };
          }
        }
        return { ...t, status: 'lost' as const, payoutHTG: 0 };
      }

      if (t.betType === 'sum_5_under') {
        const top5Sum = finalDrawn.slice(0, 5).reduce((a, b) => a + b, 0);
        if (top5Sum < 122.5) {
          const payout = Math.round(t.stakeHTG * 1.90);
          totalWon += payout;
          return { ...t, status: 'won' as const, payoutHTG: payout };
        }
        return { ...t, status: 'lost' as const, payoutHTG: 0 };
      }

      if (t.betType === 'sum_5_over') {
        const top5Sum = finalDrawn.slice(0, 5).reduce((a, b) => a + b, 0);
        if (top5Sum > 122.5) {
          const payout = Math.round(t.stakeHTG * 1.90);
          totalWon += payout;
          return { ...t, status: 'won' as const, payoutHTG: payout };
        }
        return { ...t, status: 'lost' as const, payoutHTG: 0 };
      }

      if (t.betType === 'more_even') {
        const evenC = finalDrawn.slice(0, 5).filter(n => n % 2 === 0).length;
        if (evenC >= 3) {
          const payout = Math.round(t.stakeHTG * 1.85);
          totalWon += payout;
          return { ...t, status: 'won' as const, payoutHTG: payout };
        }
        return { ...t, status: 'lost' as const, payoutHTG: 0 };
      }

      if (t.betType === 'more_odd') {
        const oddC = finalDrawn.slice(0, 5).filter(n => n % 2 !== 0).length;
        if (oddC >= 3) {
          const payout = Math.round(t.stakeHTG * 1.85);
          totalWon += payout;
          return { ...t, status: 'won' as const, payoutHTG: payout };
        }
        return { ...t, status: 'lost' as const, payoutHTG: 0 };
      }

      return { ...t, status: 'lost' as const, payoutHTG: 0 };
    });

    setTickets(evaluatedTickets);

    if (totalWon > 0) {
      playSound(playWinSound);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onUpdateBalance(user.balanceHTG + totalWon, `Gains Lucky Six Round #${roundNumber} (+${totalWon} HTG)`);
      setLastRoundResult({ won: true, totalWon });
    } else {
      setLastRoundResult({ won: false, totalWon: 0 });
    }

    // Schedule next pause after 5 seconds
    setTimeout(() => {
      setRoundNumber(prev => prev + 1);
      setGameState('pause');
      setPauseTimer(150);
      setDrawnBalls([]);
      setCurrentDrawnBall(23); // reset center view
    }, 5000);
  };

  // Number selection handling
  const toggleNumber = (num: number) => {
    playSound(playClickSound);
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 6) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  // Select all 6 numbers of a color
  const selectColorGroup = (color: SixBallColor) => {
    playSound(playClickSound);
    const nums = COLOR_NUMBERS[color];
    setSelectedNumbers([...nums]);
  };

  // Clear selections
  const handleClearSelection = () => {
    playSound(playClickSound);
    setSelectedNumbers([]);
  };

  // Place 6 numbers standard bet
  const handlePlaceBet = () => {
    if (selectedNumbers.length !== 6) {
      alert('Veuillez sélectionner exactement 6 numéros (de 1 à 48).');
      return;
    }
    if (user.balanceHTG < stake) {
      alert('Solde insuffisant pour placer ce pari.');
      onOpenWallet();
      return;
    }

    playSound(playBetPlacedSound);
    onUpdateBalance(user.balanceHTG - stake, `Pari Lucky Six #${roundNumber} [${selectedNumbers.join(', ')}]`);

    const newTicket: LuckySixTicket = {
      id: `L6-${Date.now().toString().slice(-6)}`,
      roundNumber,
      betType: 'standard_6',
      selectedNumbers: [...selectedNumbers].sort((a, b) => a - b),
      label: `6 Numéros: [${[...selectedNumbers].sort((a, b) => a - b).join(', ')}]`,
      stakeHTG: stake,
      multiplier: 10000,
      potentialWinHTG: stake * 10000,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setTickets(prev => [newTicket, ...prev]);
    setSelectedNumbers([]);
  };

  // Place special bet (Over/Under 122.5, Even/Odd)
  const handlePlaceSpecialBet = (type: 'sum_5_under' | 'sum_5_over' | 'more_even' | 'more_odd', label: string, mult: number) => {
    if (user.balanceHTG < stake) {
      alert('Solde insuffisant.');
      onOpenWallet();
      return;
    }

    playSound(playBetPlacedSound);
    onUpdateBalance(user.balanceHTG - stake, `Pari Spécial Lucky Six #${roundNumber} [${label}]`);

    const newTicket: LuckySixTicket = {
      id: `L6S-${Date.now().toString().slice(-6)}`,
      roundNumber,
      betType: type,
      label,
      stakeHTG: stake,
      multiplier: mult,
      potentialWinHTG: Math.round(stake * mult),
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setTickets(prev => [newTicket, ...prev]);
  };

  // Format pause timer 150s -> 02:30
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Center ball details
  const centerBallData = currentDrawnBall ? ballMap.get(currentDrawnBall) : null;

  return (
    <div className="w-full max-w-md mx-auto bg-[#0B1220] text-[#F8FAFC] font-sans rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col select-none">
      
      {/* 1. TOP HEADER BAR */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#EF4444]/60 bg-[#0F172A]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Retour au Casino"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <span className="text-[#38BDF8] font-black text-sm tracking-wider uppercase font-display">
            LUCKY SIX
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-slate-400 font-bold text-[11px]">ROUND</span>
            <span className="text-white font-black text-sm">{roundNumber}</span>
          </div>

          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="text-slate-400 hover:text-white transition-colors"
            title={soundMuted ? 'Activer le son' : 'Couper le son'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* 2. LIVE DRAWING STAGE (MATCHING USER REFERENCE IMAGE) */}
      <div className="relative p-3 bg-gradient-to-b from-[#090F1C] via-[#0E1729] to-[#0A101D] overflow-hidden border-b border-slate-800/80 min-h-[290px] flex flex-col justify-between">
        
        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP 5 ATTENTE BALLS */}
        <div className="flex items-center justify-center gap-2.5 z-10 pt-1">
          {Array.from({ length: 5 }).map((_, idx) => {
            const ballNum = top5Balls[idx];
            const ballData = ballNum ? ballMap.get(ballNum) : null;
            return (
              <div
                key={idx}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 ${
                  ballData
                    ? `bg-[#0D1527] text-white border-2 ${ballData.colorBorder} shadow-[0_0_8px_${COLOR_CONFIG[ballData.color].shadow}] scale-100`
                    : 'bg-[#131C31] text-slate-500 border border-slate-700/60'
                }`}
              >
                {ballNum ?? ''}
              </div>
            );
          })}
        </div>

        {/* CENTER STAGE: LEFT 15 SLOTS | 3D CENTER BALL | RIGHT 15 SLOTS */}
        <div className="grid grid-cols-12 items-center justify-between gap-1 z-10 py-2">
          
          {/* LEFT 15 PAYOUT SLOTS (Cols 1, 2, 3: Pos 6 to 20) */}
          <div className="col-span-4 grid grid-cols-3 gap-x-1 gap-y-1.5 text-center font-mono">
            {/* Row 1: Pos 6 (10k), Pos 11 (500), Pos 16 (80) */}
            {[PAYOUT_SLOTS[0], PAYOUT_SLOTS[5], PAYOUT_SLOTS[10]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 2: Pos 7 (7.5k), Pos 12 (300), Pos 17 (60) */}
            {[PAYOUT_SLOTS[1], PAYOUT_SLOTS[6], PAYOUT_SLOTS[11]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 3: Pos 8 (5k), Pos 13 (200), Pos 18 (40) */}
            {[PAYOUT_SLOTS[2], PAYOUT_SLOTS[7], PAYOUT_SLOTS[12]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 4: Pos 9 (2.5k), Pos 14 (150), Pos 19 (30) */}
            {[PAYOUT_SLOTS[3], PAYOUT_SLOTS[8], PAYOUT_SLOTS[13]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 5: Pos 10 (1k), Pos 15 (100), Pos 20 (25) */}
            {[PAYOUT_SLOTS[4], PAYOUT_SLOTS[9], PAYOUT_SLOTS[14]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
          </div>

          {/* CENTER: LARGE 3D GLOSSY BALL OR TIMER */}
          <div className="col-span-4 flex flex-col items-center justify-center">
            {gameState === 'pause' ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-amber-400 via-amber-600 to-amber-950 border-4 border-amber-300/80 shadow-[0_0_25px_rgba(245,158,11,0.6)] flex flex-col items-center justify-center animate-pulse">
                  <Clock className="w-5 h-5 text-amber-950 mb-0.5" />
                  <span className="text-amber-950 font-black text-sm sm:text-base font-mono leading-none">
                    {formatTime(pauseTimer)}
                  </span>
                </div>
                <button
                  onClick={handleImmediateDraw}
                  className="mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  title="Démarrer le tirage immédiatement"
                >
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Tirage direct</span>
                </button>
              </div>
            ) : centerBallData ? (
              /* REALISTIC 3D GLOSSY BALL MATCHING IMAGE */
              <div
                className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 animate-in zoom-in-75"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${centerBallData.colorHex} 45%, #000000 95%)`,
                  boxShadow: `0 0 25px ${COLOR_CONFIG[centerBallData.color].shadow}, inset -6px -6px 12px rgba(0,0,0,0.8), inset 6px 6px 12px rgba(255,255,255,0.7)`
                }}
              >
                {/* 3D Glassy Reflection Overlay */}
                <div className="absolute top-2 left-3 w-7 h-4 bg-white/40 rounded-full blur-[1px] -rotate-12 pointer-events-none" />
                
                {/* Ball Number */}
                <span className="text-slate-950 font-black text-2xl sm:text-3xl font-mono tracking-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] z-10">
                  {centerBallData.number}
                </span>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                <span className="text-slate-500 font-mono text-xs">...</span>
              </div>
            )}
          </div>

          {/* RIGHT 15 PAYOUT SLOTS (Cols 4, 5, 6: Pos 21 to 35) */}
          <div className="col-span-4 grid grid-cols-3 gap-x-1 gap-y-1.5 text-center font-mono">
            {/* Row 1: Pos 21 (20), Pos 26 (10), Pos 31 (5) */}
            {[PAYOUT_SLOTS[15], PAYOUT_SLOTS[20], PAYOUT_SLOTS[25]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 2: Pos 22 (18), Pos 27 (9), Pos 32 (4) */}
            {[PAYOUT_SLOTS[16], PAYOUT_SLOTS[21], PAYOUT_SLOTS[26]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 3: Pos 23 (16★), Pos 28 (8), Pos 33 (3) */}
            {[PAYOUT_SLOTS[17], PAYOUT_SLOTS[22], PAYOUT_SLOTS[27]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 4: Pos 24 (14), Pos 29 (7), Pos 34 (2) */}
            {[PAYOUT_SLOTS[18], PAYOUT_SLOTS[23], PAYOUT_SLOTS[28]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
            {/* Row 5: Pos 25 (12), Pos 30 (6), Pos 35 (1) */}
            {[PAYOUT_SLOTS[19], PAYOUT_SLOTS[24], PAYOUT_SLOTS[29]].map(slot => (
              <SlotBallItem key={slot.position} slot={slot} drawnBallNum={payoutBallsMap.get(slot.position)} ballMap={ballMap} />
            ))}
          </div>

        </div>

        {/* 3. INFORMATION BAR UNDER DRAW AREA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] z-10">
          
          {/* Left: 8 Color Squares & Odd/Even Counter */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              {(['red', 'green', 'blue', 'purple', 'brown', 'yellow', 'orange', 'grey'] as SixBallColor[]).map(c => (
                <div
                  key={c}
                  className="w-2.5 h-2.5 rounded-xs"
                  style={{ backgroundColor: COLOR_CONFIG[c].hex }}
                  title={COLOR_CONFIG[c].label}
                />
              ))}
            </div>
            <div className="font-mono text-slate-300 font-bold tracking-tight">
              <span>IMPAIR </span>
              <strong className="text-white">{oddCount}</strong>
              <span className="ml-1.5">PAIR </span>
              <strong className="text-white">{evenCount}</strong>
            </div>
          </div>

          {/* Right: Sum of Top 5 */}
          <div className="text-right flex items-center gap-2">
            <div className="flex flex-col text-slate-400 font-mono text-[9px] leading-tight">
              <span>SOMME DES 5</span>
              <span>PREMIÈRES -122.5+</span>
            </div>
            <span className="font-mono font-black text-base text-white">
              {top5Balls.length > 0 ? sumTop5 : '--'}
            </span>
          </div>

        </div>

      </div>

      {/* 4. RED ACTION BAR (TRASH + AJOUTEZ LE PARI) */}
      <div className="p-2.5 bg-[#0F172A] flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={handleClearSelection}
          className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title="Vider la sélection"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handlePlaceBet}
          disabled={selectedNumbers.length !== 6 || gameState === 'drawing'}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
            selectedNumbers.length === 6 && gameState !== 'drawing'
              ? 'bg-[#EF4444] hover:bg-red-600 text-white shadow-red-900/40 active:scale-98 animate-pulse'
              : 'bg-[#7F1D1D]/50 text-slate-400 border border-red-900/30 cursor-not-allowed'
          }`}
        >
          <span>Ajoutez Le Pari</span>
          <span className="font-mono font-bold text-amber-200">
            ({selectedNumbers.length}/6 • {stake} HTG)
          </span>
        </button>
      </div>

      {/* 5. TABS: PARIS SUR DES CHIFFRES / PARIS SPÉCIAUX */}
      <div className="flex border-b border-slate-800 bg-[#0B1220]">
        <button
          onClick={() => {
            playClickSound();
            setActiveTab('chiffres');
          }}
          className={`flex-1 py-2.5 px-2 text-center text-xs font-bold transition-all relative ${
            activeTab === 'chiffres'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Paris sur des chiffres</span>
          {activeTab === 'chiffres' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab('speciaux');
          }}
          className={`flex-1 py-2.5 px-2 text-center text-xs font-bold transition-all relative ${
            activeTab === 'speciaux'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Paris spéciaux</span>
          {activeTab === 'speciaux' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      </div>

      {/* 6. TAB CONTENT */}
      {activeTab === 'chiffres' ? (
        /* GRID OF 48 BALLS (6 ROWS X 8 COLS) */
        <div className="p-3 bg-[#0E1526] space-y-3">
          
          <div className="grid grid-cols-8 gap-1.5 sm:gap-2 justify-items-center">
            {LUCKY_SIX_BALLS.map(ball => {
              const isSelected = selectedNumbers.includes(ball.number);
              const colorInfo = COLOR_CONFIG[ball.color];
              return (
                <button
                  key={ball.number}
                  onClick={() => toggleNumber(ball.number)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold font-mono text-xs transition-all active:scale-95 cursor-pointer relative ${
                    isSelected
                      ? `text-slate-950 font-black shadow-lg scale-105 border-2 border-white`
                      : 'bg-[#182238] text-slate-300 hover:text-white border border-slate-700/60 hover:border-slate-500'
                  }`}
                  style={{
                    backgroundColor: isSelected ? colorInfo.hex : undefined,
                    boxShadow: isSelected ? `0 0 10px ${colorInfo.shadow}` : undefined
                  }}
                >
                  <span>{ball.number}</span>
                </button>
              );
            })}
          </div>

          {/* BOTTOM COLOR CIRCLES (ONE TAP SELECT ENTIRE COLOR COLUMN) */}
          <div className="grid grid-cols-8 gap-1.5 sm:gap-2 justify-items-center pt-2 border-t border-slate-800/80">
            {(['red', 'green', 'blue', 'purple', 'brown', 'yellow', 'orange', 'grey'] as SixBallColor[]).map(color => {
              const colorInfo = COLOR_CONFIG[color];
              const isFullColorSelected = COLOR_NUMBERS[color].every(n => selectedNumbers.includes(n));
              return (
                <button
                  key={color}
                  onClick={() => selectColorGroup(color)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-transform active:scale-90 cursor-pointer flex items-center justify-center ${
                    isFullColorSelected
                      ? 'scale-110 shadow-lg'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    borderColor: colorInfo.hex,
                    backgroundColor: isFullColorSelected ? colorInfo.hex : 'transparent',
                    boxShadow: isFullColorSelected ? `0 0 10px ${colorInfo.shadow}` : undefined
                  }}
                  title={`Choisir toute la couleur ${colorInfo.label}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colorInfo.hex }}
                  />
                </button>
              );
            })}
          </div>

          {/* QUICK STAKE SELECTOR */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Mise (HTG):</span>
            <div className="flex items-center gap-1.5">
              {[25, 50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => {
                    playClickSound();
                    setStake(amt);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all ${
                    stake === amt
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#182238] text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* SPECIAL BETS TAB */
        <div className="p-3.5 bg-[#0E1526] space-y-3">
          <div className="text-xs text-slate-400">
            Placez des paris instantanés sur les 5 premières boules tirées :
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePlaceSpecialBet('sum_5_under', 'Somme 5 < 122.5', 1.90)}
              disabled={gameState === 'drawing'}
              className="p-3 rounded-xl bg-[#182238] hover:bg-[#202C45] border border-slate-700 text-left transition-all cursor-pointer active:scale-98"
            >
              <div className="text-[11px] text-slate-400 font-mono">Somme des 5</div>
              <div className="text-sm font-bold text-sky-400">Moins de 122.5</div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">Cote @1.90</div>
            </button>

            <button
              onClick={() => handlePlaceSpecialBet('sum_5_over', 'Somme 5 > 122.5', 1.90)}
              disabled={gameState === 'drawing'}
              className="p-3 rounded-xl bg-[#182238] hover:bg-[#202C45] border border-slate-700 text-left transition-all cursor-pointer active:scale-98"
            >
              <div className="text-[11px] text-slate-400 font-mono">Somme des 5</div>
              <div className="text-sm font-bold text-emerald-400">Plus de 122.5</div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">Cote @1.90</div>
            </button>

            <button
              onClick={() => handlePlaceSpecialBet('more_even', 'Majorité Pairs (5 premières)', 1.85)}
              disabled={gameState === 'drawing'}
              className="p-3 rounded-xl bg-[#182238] hover:bg-[#202C45] border border-slate-700 text-left transition-all cursor-pointer active:scale-98"
            >
              <div className="text-[11px] text-slate-400 font-mono">Parité</div>
              <div className="text-sm font-bold text-purple-400">Plus de Pairs</div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">Cote @1.85</div>
            </button>

            <button
              onClick={() => handlePlaceSpecialBet('more_odd', 'Majorité Impairs (5 premières)', 1.85)}
              disabled={gameState === 'drawing'}
              className="p-3 rounded-xl bg-[#182238] hover:bg-[#202C45] border border-slate-700 text-left transition-all cursor-pointer active:scale-98"
            >
              <div className="text-[11px] text-slate-400 font-mono">Parité</div>
              <div className="text-sm font-bold text-orange-400">Plus d'Impairs</div>
              <div className="text-xs font-mono font-black text-amber-400 mt-1">Cote @1.85</div>
            </button>
          </div>
        </div>
      )}

      {/* 7. RECENT TICKETS & RESULT NOTIFICATION */}
      {lastRoundResult && (
        <div className={`p-3 text-center text-xs font-bold border-t ${
          lastRoundResult.won ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
        }`}>
          {lastRoundResult.won ? (
            <span>🎉 Bravo ! Vous avez remporté {lastRoundResult.totalWon.toLocaleString('fr-FR')} HTG au Round #{roundNumber} !</span>
          ) : (
            <span>Tirage du Round #{roundNumber} terminé. Prochain round dans 2:30.</span>
          )}
        </div>
      )}

      {/* TICKETS SUMMARY LIST */}
      {tickets.length > 0 && (
        <div className="p-3 bg-[#0B1220] border-t border-slate-800 text-xs space-y-1.5 max-h-36 overflow-y-auto">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Mes Coupons Récents ({tickets.length})</span>
            <span className="text-amber-400 font-mono font-bold">Solde: {user.balanceHTG.toLocaleString('fr-FR')} HTG</span>
          </div>
          {tickets.slice(0, 3).map(ticket => (
            <div
              key={ticket.id}
              className={`p-2 rounded-xl border flex items-center justify-between font-mono text-[11px] ${
                ticket.status === 'won'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                  : ticket.status === 'lost'
                  ? 'bg-red-950/20 border-red-900/30 text-slate-400'
                  : 'bg-slate-900 border-slate-800 text-slate-200'
              }`}
            >
              <div className="truncate pr-2">
                <span className="font-bold text-amber-400">#{ticket.roundNumber} </span>
                <span>{ticket.label}</span>
              </div>
              <div className="shrink-0 font-bold flex items-center gap-1.5">
                {ticket.status === 'won' ? (
                  <span className="text-emerald-400">+{ticket.payoutHTG} HTG</span>
                ) : ticket.status === 'lost' ? (
                  <span className="text-red-400">Perdu</span>
                ) : (
                  <span className="text-amber-400">{ticket.stakeHTG} HTG</span>
                )}
                <button
                  onClick={() => {
                    playClickSound();
                    setPrintTicketData({
                      ticketCode: ticket.id,
                      date: ticket.createdAt,
                      userId: user.id || 'USR-8821',
                      gameType: 'Casino • Lucky Six 6/48',
                      odds: ticket.multiplier,
                      betAmount: ticket.stakeHTG,
                      potentialPayout: ticket.potentialWinHTG,
                      status: ticket.status === 'won' ? 'WON' : ticket.status === 'lost' ? 'LOST' : 'PENDING',
                      gameDetails: {
                        game_round_id: `LUCKY-SIX-ROUND-#${ticket.roundNumber}`,
                        auto_cashout_multiplier: ticket.multiplier
                      },
                      details: ticket.label
                    });
                  }}
                  className="p-1 rounded-md bg-[#131b2c] hover:bg-[#1c273e] text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
                  title="Imprimer Fiche POS"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Universal Ticket Print Modal */}
      {printTicketData && (
        <TicketPrintModal
          isOpen={true}
          onClose={() => setPrintTicketData(null)}
          ticket={printTicketData}
        />
      )}

    </div>
  );
};

// Subcomponent: Display a payout slot or drawn ball at that slot
interface SlotBallItemProps {
  slot: PayoutSlot;
  drawnBallNum?: number;
  ballMap: Map<number, LuckySixBall>;
}

const SlotBallItem: React.FC<SlotBallItemProps> = ({ slot, drawnBallNum, ballMap }) => {
  const drawnBall = drawnBallNum ? ballMap.get(drawnBallNum) : null;

  if (drawnBall) {
    return (
      <div className="relative flex items-center justify-center h-6">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] font-mono text-slate-950 border border-white shadow-sm transition-transform scale-100 animate-in zoom-in-50`}
          style={{
            backgroundColor: drawnBall.colorHex,
            boxShadow: `0 0 8px ${COLOR_CONFIG[drawnBall.color].shadow}`
          }}
        >
          {drawnBall.number}
        </div>
        {slot.hasStar && (
          <Star className="w-2.5 h-2.5 absolute -top-1 -right-0.5 text-amber-400 fill-amber-400" />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-6 text-slate-400 hover:text-slate-200 text-[11px] font-bold">
      <span className={slot.multiplier >= 1000 ? 'text-amber-400 font-black' : 'text-slate-400'}>
        {slot.label}
      </span>
      {slot.hasStar && (
        <Star className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-amber-400/80 fill-amber-400/80" />
      )}
    </div>
  );
};
