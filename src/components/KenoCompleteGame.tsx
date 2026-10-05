import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  FileText,
  Volume2,
  VolumeX,
  ChevronDown,
  Info,
  Layers,
  History,
  Trophy,
  Flame,
  Zap,
  Clock,
  Play,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { playClickSound, playWinSound, playBetPlacedSound } from '../utils/audio';

interface KenoProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  isStandaloneModal?: boolean;
  onClose?: () => void;
}

export interface KenoTicket {
  id: string;
  roundNumber: number;
  type: 'standard' | 'special';
  specialType?: 'sum_over' | 'sum_under' | 'even_majority' | 'odd_majority' | 'first_even' | 'first_odd';
  selectedNumbers: number[];
  stake: number;
  matchingNumbers: number[];
  multiplierWon: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
  timestamp: string;
}

// Certified Keno 20/80 Paytable (Payout multipliers based on selected count & matched count)
const KENO_PAYTABLE: Record<number, Record<number, number>> = {
  1: { 1: 3.5 },
  2: { 2: 12.0 },
  3: { 2: 2.5, 3: 45.0 },
  4: { 2: 1.5, 3: 8.0, 4: 100.0 },
  5: { 3: 3.0, 4: 15.0, 5: 400.0 },
  6: { 3: 2.0, 4: 7.0, 5: 70.0, 6: 1500.0 },
  7: { 4: 4.0, 5: 20.0, 6: 250.0, 7: 4000.0 },
  8: { 4: 2.0, 5: 10.0, 6: 80.0, 7: 750.0, 8: 10000.0 },
  9: { 4: 1.5, 5: 6.0, 6: 30.0, 7: 200.0, 8: 2000.0, 9: 25000.0 },
  10: { 5: 4.0, 6: 15.0, 7: 80.0, 8: 500.0, 9: 5000.0, 10: 50000.0 }
};

export const KenoCompleteGame: React.FC<KenoProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  isStandaloneModal = false,
  onClose
}) => {
  // Round state matching Keno 2m30s specification
  const [roundNumber, setRoundNumber] = useState<number>(266);
  const [phase, setPhase] = useState<'betting' | 'drawing' | 'result'>('betting');
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [countdownTimer, setCountdownTimer] = useState<number>(150); // 2 minutes et 30 secondes en secondes (2 * 60 + 30 = 150s)

  // Drawn Balls: 20 balls drawn out of 80
  const [drawnBalls, setDrawnBalls] = useState<number[]>([]);
  const [currentDrawnBall, setCurrentDrawnBall] = useState<number | null>(44);
  const [currentBallProgress, setCurrentBallProgress] = useState<number>(65);

  // User Selection
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([18, 33, 44, 52, 62, 75]);
  const [stake, setStake] = useState<number>(25.0);

  // Active Navigation Tab: 'les_paris' | 'paris_speciaux' | 'mes_paris'
  const [activeTab, setActiveTab] = useState<'les_paris' | 'paris_speciaux' | 'mes_paris'>('les_paris');

  // Quick Pick dropdown (1 to 10)
  const [quickPickCount, setQuickPickCount] = useState<number>(1);
  const [showQuickPickMenu, setShowQuickPickMenu] = useState<boolean>(false);

  // Special Bets Selection
  const [selectedSpecialBet, setSelectedSpecialBet] = useState<
    'sum_over' | 'sum_under' | 'even_majority' | 'odd_majority' | 'first_even' | 'first_odd' | null
  >(null);

  // User Tickets
  const [activeTickets, setActiveTickets] = useState<KenoTicket[]>([]);
  const [ticketHistory, setTicketHistory] = useState<KenoTicket[]>([]);
  const [showTicketModal, setShowTicketModal] = useState<boolean>(false);

  // Sound
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Notification / Feedback banner
  const [infoMessage, setInfoMessage] = useState<string>(
    'Sélectionnez le résultat correspondant pour commencer le pari'
  );

  // Refs for timers & drawing animation
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const drawingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const roundTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullTargetDrawRef = useRef<number[]>([]);
  const startKenoRoundRef = useRef<() => void>(() => {});
  const startBreakPeriodRef = useRef<() => void>(() => {});

  // Sound effect for ball draw
  const playBallSound = () => {
    if (!soundEnabled) return;
    try {
      playClickSound();
    } catch {
      // ignore
    }
  };

  // Generate 20 unique random balls between 1 and 80
  const generate20Balls = (): number[] => {
    const all = Array.from({ length: 80 }, (_, i) => i + 1);
    // Fisher-Yates shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.slice(0, 20);
  };

  // Start Break Period (Pause de 2 minutes et 30 secondes = 150s)
  const startBreakPeriod = useCallback(() => {
    setIsPaused(true);
    setPhase('betting');
    setCountdownTimer(150);
    setDrawnBalls([]);
    setCurrentDrawnBall(null);
    setCurrentBallProgress(0);
    setInfoMessage('Début de la pause de 2:30. Placez vos paris pour le prochain tour !');
    console.log("Fin du round. Début de la pause de 2:30.");

    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);

    breakIntervalRef.current = setInterval(() => {
      setCountdownTimer(prev => {
        if (prev > 1) {
          const nextTime = prev - 1;
          const minutes = Math.floor(nextTime / 60);
          const seconds = nextTime % 60;
          console.log(`Prochain round dans : ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
          return nextTime;
        } else {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          setIsPaused(false);
          console.log("Fin de la pause ! Lancement du prochain round.");
          startKenoRoundRef.current();
          return 0;
        }
      });
    }, 1000);
  }, []);

  // Start Drawing 20 Balls (Tirage du Keno)
  const startKenoRound = useCallback(() => {
    console.log("Le tirage du Keno commence...");
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    setIsPaused(false);
    setPhase('drawing');
    setInfoMessage('Le tirage du Keno commence... 20 boules parmi 80');
    const target20 = generate20Balls();
    fullTargetDrawRef.current = target20;

    let ballIndex = 0;
    const drawnAccumulator: number[] = [];

    if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);

    drawingIntervalRef.current = setInterval(() => {
      if (ballIndex >= 20) {
        if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);
        // Draw complete -> go to results phase
        resolveRoundResults(drawnAccumulator);
        return;
      }

      const ball = target20[ballIndex];
      drawnAccumulator.push(ball);
      setDrawnBalls([...drawnAccumulator]);
      setCurrentDrawnBall(ball);
      setCurrentBallProgress(Math.round(((ballIndex + 1) / 20) * 100));
      playBallSound();

      ballIndex++;
    }, 1200);
  }, [soundEnabled]);

  useEffect(() => {
    startKenoRoundRef.current = startKenoRound;
    startBreakPeriodRef.current = startBreakPeriod;
  }, [startKenoRound, startBreakPeriod]);

  // Resolve Round Tickets & Winnings
  const resolveRoundResults = (drawn: number[]) => {
    setPhase('result');

    // Calculate sum and parity of drawn balls
    const sum = drawn.reduce((a, b) => a + b, 0);
    const evenCount = drawn.filter(n => n % 2 === 0).length;
    const oddCount = 20 - evenCount;
    const firstBall = drawn[0];

    let totalWonInRound = 0;

    // Check each active ticket
    setActiveTickets(prev => {
      const updated = prev.map(ticket => {
        let won = false;
        let mult = 0;

        if (ticket.type === 'standard') {
          const matches = ticket.selectedNumbers.filter(n => drawn.includes(n));
          const selectedLen = ticket.selectedNumbers.length;
          const matchedLen = matches.length;

          const payTableForLen = KENO_PAYTABLE[selectedLen] || {};
          mult = payTableForLen[matchedLen] || 0;

          if (mult > 0) {
            won = true;
          }

          const payout = +(ticket.stake * mult).toFixed(2);
          if (won) totalWonInRound += payout;

          return {
            ...ticket,
            matchingNumbers: matches,
            multiplierWon: mult,
            payout,
            status: won ? ('won' as const) : ('lost' as const)
          };
        } else {
          // Special Bet
          switch (ticket.specialType) {
            case 'sum_over':
              won = sum > 810;
              mult = 1.95;
              break;
            case 'sum_under':
              won = sum < 810;
              mult = 1.95;
              break;
            case 'even_majority':
              won = evenCount > oddCount;
              mult = 1.95;
              break;
            case 'odd_majority':
              won = oddCount > evenCount;
              mult = 1.95;
              break;
            case 'first_even':
              won = firstBall % 2 === 0;
              mult = 1.90;
              break;
            case 'first_odd':
              won = firstBall % 2 !== 0;
              mult = 1.90;
              break;
          }

          const payout = won ? +(ticket.stake * mult).toFixed(2) : 0;
          if (won) totalWonInRound += payout;

          return {
            ...ticket,
            multiplierWon: won ? mult : 0,
            payout,
            status: won ? ('won' as const) : ('lost' as const)
          };
        }
      });

      // Transfer to history
      setTicketHistory(h => [...updated, ...h.slice(0, 30)]);
      return updated;
    });

    if (totalWonInRound > 0) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
      playWinSound();
      onUpdateBalance(
        +(user.balanceHTG + totalWonInRound).toFixed(2),
        `Keno Round #${roundNumber} - Gain Total (+${totalWonInRound} HTG)`
      );
      setInfoMessage(`Félicitations ! Vous avez gagné ${totalWonInRound.toFixed(2)} HTG au Keno !`);
    } else {
      setInfoMessage(`Fin du tour #${roundNumber}. Somme des 20 boules: ${sum}`);
    }

    // Fin du round. Début de la pause de 2:30 après 5s
    if (roundTransitionTimeoutRef.current) clearTimeout(roundTransitionTimeoutRef.current);
    roundTransitionTimeoutRef.current = setTimeout(() => {
      console.log("Fin du round. Début de la pause de 2:30.");
      setRoundNumber(r => r + 1);
      setActiveTickets([]);
      startBreakPeriodRef.current();
    }, 5000);
  };

  // Initial mount : Démarrer la pause de 2:30 et le premier cycle
  useEffect(() => {
    startBreakPeriod();
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
      if (drawingIntervalRef.current) clearInterval(drawingIntervalRef.current);
      if (roundTransitionTimeoutRef.current) clearTimeout(roundTransitionTimeoutRef.current);
    };
  }, [startBreakPeriod]);

  // Handle number click on 1-80 grid
  const toggleNumber = (num: number) => {
    if (!isPaused && phase !== 'betting') return;
    playClickSound();

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= 10) {
        setInfoMessage('Maximum 10 numéros autorisés par ticket Keno.');
        return;
      }
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  // Random Quick Pick of N numbers
  const handleRandomPick = (count: number) => {
    playClickSound();
    const numbers: number[] = [];
    while (numbers.length < count) {
      const rand = Math.floor(Math.random() * 80) + 1;
      if (!numbers.includes(rand)) {
        numbers.push(rand);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
    setShowQuickPickMenu(false);
    setInfoMessage(`${count} numéro(s) sélectionné(s) aléatoirement`);
  };

  // Clear selection
  const clearSelection = () => {
    playClickSound();
    setSelectedNumbers([]);
    setSelectedSpecialBet(null);
    setInfoMessage('Sélection effacée. Choisissez vos numéros.');
  };

  // All-in stake
  const handleAllIn = () => {
    playClickSound();
    const maxAllowed = Math.min(user.balanceHTG, 5000);
    setStake(Math.max(25, Math.floor(maxAllowed)));
  };

  // Place Ticket
  const handlePlaceTicket = () => {
    if (!isPaused && phase !== 'betting') {
      alert('Le tirage est en cours. Veuillez patienter pour le prochain tour.');
      return;
    }

    if (activeTab === 'les_paris' && selectedNumbers.length === 0) {
      alert('Veuillez sélectionner au moins 1 numéro (jusqu’à 10).');
      return;
    }

    if (activeTab === 'paris_speciaux' && !selectedSpecialBet) {
      alert('Veuillez choisir une option de pari spécial.');
      return;
    }

    if (user.balanceHTG < stake) {
      alert(`Solde insuffisant pour placer cette mise (${stake.toFixed(2)} HTG).`);
      onOpenWallet();
      return;
    }

    // Deduct stake
    onUpdateBalance(
      +(user.balanceHTG - stake).toFixed(2),
      `Keno Round #${roundNumber} - Ticket (${stake} HTG)`
    );

    playBetPlacedSound();

    const newTicket: KenoTicket = {
      id: `KN-${roundNumber}-${Date.now().toString().slice(-4)}`,
      roundNumber,
      type: activeTab === 'les_paris' ? 'standard' : 'special',
      specialType: activeTab === 'paris_speciaux' ? selectedSpecialBet || undefined : undefined,
      selectedNumbers: activeTab === 'les_paris' ? [...selectedNumbers] : [],
      stake,
      matchingNumbers: [],
      multiplierWon: 0,
      payout: 0,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setActiveTickets(prev => [...prev, newTicket]);
    setInfoMessage(`Ticket ${newTicket.id} validé avec succès ! Bonne chance !`);
  };

  // Potential Max Win calculation
  const getPotentialMaxWin = (): number => {
    if (activeTab === 'les_paris') {
      const len = selectedNumbers.length;
      if (len === 0) return 0;
      const paytable = KENO_PAYTABLE[len] || {};
      const maxMult = paytable[len] || 0;
      return +(stake * maxMult).toFixed(2);
    } else {
      if (selectedSpecialBet?.includes('first')) return +(stake * 1.90).toFixed(2);
      return +(stake * 1.95).toFixed(2);
    }
  };

  // Countdown formatting for 2:30 break period
  const countdownMinutes = Math.floor(countdownTimer / 60);
  const countdownSeconds = countdownTimer % 60;
  const formattedCountdown = `${countdownMinutes}:${countdownSeconds < 10 ? '0' : ''}${countdownSeconds}`;
  const circularProgress = isPaused
    ? Math.round(((150 - countdownTimer) / 150) * 100)
    : currentBallProgress;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto rounded-3xl bg-[#141822] border border-slate-800 shadow-2xl overflow-hidden font-sans select-none text-white">
      {/* ================= 1. HEADER (Speedometer Icon, Sound, Round Number 266) ================= */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#090d16] border-b border-slate-900 text-xs">
        {/* Speedometer / Clock Icon */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 border border-slate-700 shadow-inner">
            <span className="text-sm">⏱</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              title="Son"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isPaused && `Pause / Paris : ${formattedCountdown}`}
              {!isPaused && phase === 'drawing' && `Tirage (${drawnBalls.length}/20)`}
              {!isPaused && phase === 'result' && 'Résultats'}
            </span>
          </div>
        </div>

        {/* Round Number matching screenshot: "NUMÉRO DE ROUND 266" */}
        <div className="flex items-center gap-1 text-right">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none">
            NUMÉRO DE<br />ROUND
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono text-slate-100 ml-1">
            {roundNumber}
          </span>

          {isStandaloneModal && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. TIRAGE KENO ARENA (Deep Royal Blue Background, Left/Right Balls, Center Big Ball) ================= */}
      <div className="relative w-full py-4 px-3 sm:px-6 bg-gradient-to-b from-[#104085] via-[#0b2b64] to-[#071f48] overflow-hidden flex items-center justify-between border-b border-slate-900 shadow-inner">
        {/* LEFT COLUMN: 2 columns of 5 balls (1 to 10) */}
        <div className="grid grid-cols-2 gap-2 z-10">
          {Array.from({ length: 10 }).map((_, idx) => {
            const ballNumber = drawnBalls[idx];
            const isUserMatch = ballNumber && selectedNumbers.includes(ballNumber);

            return (
              <div
                key={idx}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-black text-sm transition-all duration-300 ${
                  ballNumber
                    ? isUserMatch
                      ? 'bg-gradient-to-b from-emerald-300 to-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-105 ring-2 ring-white'
                      : 'bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#ca8a04] text-slate-950 shadow-[0_3px_8px_rgba(0,0,0,0.5)]'
                    : 'bg-[#081b3c]/80 border border-[#1b3d75] shadow-inner'
                }`}
              >
                {ballNumber ? ballNumber : ''}
              </div>
            );
          })}
        </div>

        {/* CENTER BIG BALL WITH CIRCULAR PROGRESS ARC (Matching screenshot: "44") */}
        <div className="relative flex flex-col items-center justify-center my-auto px-2 z-10">
          {/* Radial glow background */}
          <div className="absolute w-36 h-36 rounded-full bg-blue-500/20 blur-xl pointer-events-none" />

          {/* Circular progress container */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center">
            {/* SVG Arc for Drawing Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="4"
              />
              {/* Progress Yellow Arc */}
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#facc15"
                strokeWidth="5"
                strokeDasharray="276"
                strokeDashoffset={276 - (276 * circularProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Inner Big Ball Display */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#ca8a04] shadow-[0_0_24px_rgba(250,204,21,0.6)] flex flex-col items-center justify-center text-slate-950 select-none transform transition-transform active:scale-95">
              {phase === 'drawing' && currentDrawnBall !== null ? (
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight drop-shadow-sm">
                  {currentDrawnBall}
                </span>
              ) : isPaused || phase === 'betting' ? (
                <div className="text-center px-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-950 block leading-tight">
                    PAUSE 2:30
                  </span>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight leading-none text-slate-950">
                    {formattedCountdown}
                  </span>
                  <span className="text-[8px] font-bold text-amber-900 uppercase block mt-0.5 leading-tight">
                    PROCHAIN ROUND
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-xs font-black uppercase text-amber-900">FIN</span>
                  <span className="text-2xl font-black font-mono">20/20</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 columns of 5 balls (11 to 20) */}
        <div className="grid grid-cols-2 gap-2 z-10">
          {Array.from({ length: 10 }).map((_, idx) => {
            const ballNumber = drawnBalls[idx + 10];
            const isUserMatch = ballNumber && selectedNumbers.includes(ballNumber);

            return (
              <div
                key={idx + 10}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono font-black text-sm transition-all duration-300 ${
                  ballNumber
                    ? isUserMatch
                      ? 'bg-gradient-to-b from-emerald-300 to-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-105 ring-2 ring-white'
                      : 'bg-gradient-to-b from-[#fde047] via-[#facc15] to-[#ca8a04] text-slate-950 shadow-[0_3px_8px_rgba(0,0,0,0.5)]'
                    : 'bg-[#081b3c]/80 border border-[#1b3d75] shadow-inner'
                }`}
              >
                {ballNumber ? ballNumber : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 3. NAVIGATION TABS (Les paris | Paris spéciaux | Mes paris) ================= */}
      <div className="grid grid-cols-3 bg-[#111622] border-b border-slate-800 text-xs font-bold text-center">
        <button
          onClick={() => {
            playClickSound();
            setActiveTab('les_paris');
          }}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'les_paris'
              ? 'text-[#fbc02d] font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Les paris
          {activeTab === 'les_paris' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fbc02d]" />
          )}
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab('paris_speciaux');
          }}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'paris_speciaux'
              ? 'text-[#fbc02d] font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Paris spéciaux
          {activeTab === 'paris_speciaux' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fbc02d]" />
          )}
        </button>

        <button
          onClick={() => {
            playClickSound();
            setActiveTab('mes_paris');
          }}
          className={`py-3 transition-colors relative cursor-pointer ${
            activeTab === 'mes_paris'
              ? 'text-[#fbc02d] font-extrabold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Mes paris ({activeTickets.length})
          {activeTab === 'mes_paris' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fbc02d]" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: LES PARIS (Official Keno 1-80 Grid & Quick Picks) ================= */}
      {activeTab === 'les_paris' && (
        <div className="p-3 space-y-2.5">
          {/* Quick Controls Bar: [Sélection aléat... 1 ▾] [Système ▾] & [Pas de tirage] [All in] */}
          <div className="space-y-1.5">
            {/* Ligne 1 : Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              {/* Quick Pick Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickPickMenu(!showQuickPickMenu)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1d2332] hover:bg-[#252d40] border border-slate-700/80 text-xs font-bold text-slate-200 transition-colors"
                >
                  <span className="truncate">Sélection aléat... {quickPickCount}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </button>

                {showQuickPickMenu && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-[#1a202e] border border-slate-700 rounded-xl p-1 shadow-2xl grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cnt => (
                      <button
                        key={cnt}
                        onClick={() => {
                          setQuickPickCount(cnt);
                          handleRandomPick(cnt);
                        }}
                        className={`py-1.5 text-xs font-mono font-bold rounded-lg ${
                          quickPickCount === cnt
                            ? 'bg-[#fbc02d] text-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Système Dropdown */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1d2332] border border-slate-700/80 text-xs font-bold text-slate-400">
                <span>Système</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>

            {/* Ligne 2 : [Pas de tirage / Effacer] & [All in] */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={clearSelection}
                className="py-2 px-3 rounded-xl bg-[#1d2332] hover:bg-[#252d40] border border-slate-700/80 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Effacer la sélection
              </button>

              <button
                onClick={handleAllIn}
                className="py-2 px-3 rounded-xl bg-[#1d2332] hover:bg-[#252d40] border border-slate-700/80 text-xs font-black text-[#fbc02d] hover:bg-amber-400/10 transition-colors uppercase tracking-wider"
              >
                All in
              </button>
            </div>
          </div>

          {/* KENO NUMBER GRID (1 TO 80) in 8 columns matching screenshot */}
          <div className="bg-[#111622] p-2 rounded-2xl border border-slate-800 shadow-inner">
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2 max-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin">
              {Array.from({ length: 80 }, (_, i) => i + 1).map(num => {
                const isSelected = selectedNumbers.includes(num);
                const isDrawn = drawnBalls.includes(num);
                const isMatch = isSelected && isDrawn;

                let btnStyle = 'bg-[#212735] text-slate-200 border-slate-700/60 hover:bg-slate-700';

                if (isMatch) {
                  btnStyle = 'bg-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse border-white';
                } else if (isSelected) {
                  btnStyle = 'bg-[#fbc02d] text-slate-950 font-black shadow-[0_2px_8px_rgba(251,192,45,0.4)] border-[#fbc02d]';
                } else if (isDrawn) {
                  btnStyle = 'bg-[#182a47] text-amber-300 border-amber-400/40';
                }

                return (
                  <button
                    key={num}
                    onClick={() => toggleNumber(num)}
                    disabled={phase !== 'betting'}
                    className={`h-9 sm:h-10 rounded-xl border text-xs sm:text-sm font-mono font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed ${btnStyle}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paytable Preview if numbers selected */}
          {selectedNumbers.length > 0 && (
            <div className="p-2 rounded-xl bg-[#0c101a] border border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">
                Choix : <strong className="text-amber-400">{selectedNumbers.length}/10</strong> numéros
              </span>
              <span className="text-slate-400">
                Cote max :{' '}
                <strong className="text-emerald-400 font-mono">
                  {KENO_PAYTABLE[selectedNumbers.length]?.[selectedNumbers.length]}x
                </strong>
              </span>
              <span className="text-slate-400">
                Gain potentiel :{' '}
                <strong className="text-[#fbc02d] font-mono">{getPotentialMaxWin()} HTG</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PARIS SPÉCIAUX (Over/Under, Parité Pair/Impair...) ================= */}
      {activeTab === 'paris_speciaux' && (
        <div className="p-3 sm:p-4 space-y-3">
          <div className="text-xs text-slate-300 font-bold mb-1">
            Misez sur les propriétés mathématiques des 20 boules tirées :
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Somme > 810 */}
            <button
              onClick={() => setSelectedSpecialBet('sum_over')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'sum_over'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">Somme des 20 boules</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">Plus de 810.5</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.95</div>
            </button>

            {/* Somme < 810 */}
            <button
              onClick={() => setSelectedSpecialBet('sum_under')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'sum_under'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">Somme des 20 boules</div>
              <div className="text-sm font-black text-amber-400 mt-0.5">Moins de 810.5</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.95</div>
            </button>

            {/* Majorité Pair */}
            <button
              onClick={() => setSelectedSpecialBet('even_majority')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'even_majority'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">Parité (Majorité)</div>
              <div className="text-sm font-black text-blue-400 mt-0.5">Plus de Pairs</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.95</div>
            </button>

            {/* Majorité Impair */}
            <button
              onClick={() => setSelectedSpecialBet('odd_majority')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'odd_majority'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">Parité (Majorité)</div>
              <div className="text-sm font-black text-purple-400 mt-0.5">Plus d'Impairs</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.95</div>
            </button>

            {/* 1ère boule paire */}
            <button
              onClick={() => setSelectedSpecialBet('first_even')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'first_even'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">1ère Boule Tirée</div>
              <div className="text-sm font-black text-cyan-400 mt-0.5">Numéro Pair</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.90</div>
            </button>

            {/* 1ère boule impaire */}
            <button
              onClick={() => setSelectedSpecialBet('first_odd')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedSpecialBet === 'first_odd'
                  ? 'bg-amber-400/10 border-amber-400 text-white'
                  : 'bg-[#182030] border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-bold text-slate-400">1ère Boule Tirée</div>
              <div className="text-sm font-black text-rose-400 mt-0.5">Numéro Impair</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-1">Cote : 1.90</div>
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 3: MES PARIS (User tickets) ================= */}
      {activeTab === 'mes_paris' && (
        <div className="p-3 max-h-64 overflow-y-auto space-y-2">
          {activeTickets.length === 0 && ticketHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-1.5 text-slate-600" />
              Aucun pari enregistré. Sélectionnez vos numéros pour parier !
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active tickets */}
              {activeTickets.map(t => (
                <div key={t.id} className="p-2.5 rounded-xl bg-[#1a2233] border border-amber-400/40 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-amber-300">Ticket #{t.id}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      En attente
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Mise : <strong className="text-white">{t.stake} HTG</strong>
                  </div>
                  {t.type === 'standard' && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {t.selectedNumbers.map(n => (
                        <span key={n} className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[11px] font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* History tickets */}
              {ticketHistory.map(t => (
                <div key={t.id} className="p-2.5 rounded-xl bg-[#121824] border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-400">Round #{t.roundNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.status === 'won' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {t.status === 'won' ? `Gagné (+${t.payout} HTG)` : 'Non gagnant'}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Mise : <span className="text-slate-200">{t.stake} HTG</span> • Multiplicateur :{' '}
                    <strong className="text-white">{t.multiplierWon}x</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= 4. INSTRUCTION HINT BAR (Matching screenshot) ================= */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#090d16] border-t border-slate-900 text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="truncate">{infoMessage}</span>
      </div>

      {/* ================= 5. BOTTOM ACTION / BETTING BAR ================= */}
      <div className="flex items-center justify-between p-3 bg-[#0d121c] border-t border-slate-800 gap-2">
        {/* Total de mises & Selector Stepper matching screenshot: Total de mises 25.00 */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col justify-center px-3 py-1.5 rounded-xl bg-[#1b2232] border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none">
              Total de mises
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-white leading-none mt-1">
              {stake.toFixed(2)}
            </span>
          </div>

          {/* Stepper + button */}
          <button
            onClick={() => {
              playClickSound();
              setStake(s => (s >= 500 ? 25 : s + 25));
            }}
            className="w-10 h-10 rounded-xl bg-[#1b2232] hover:bg-[#252f44] border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-200 transition-colors cursor-pointer active:scale-95"
            title="Augmenter la mise"
          >
            +
          </button>
        </div>

        {/* Big Action Button matching red "Connexion" / "PARIER 25.00" button with quick launch option */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2">
          {isPaused || phase === 'betting' ? (
            <>
              <button
                onClick={handlePlaceTicket}
                className="flex-1 max-w-[190px] sm:max-w-[220px] py-3 px-3 rounded-xl bg-gradient-to-r from-[#e53935] via-[#d32f2f] to-[#c62828] hover:from-[#f44336] hover:to-[#d32f2f] text-white font-black text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(229,57,53,0.4)] transition-all active:scale-95 cursor-pointer uppercase text-center"
              >
                PARIER {stake.toFixed(2)} HTG
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  startKenoRound();
                }}
                className="py-3 px-2.5 rounded-xl bg-[#28a745] hover:bg-green-600 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                title="Lancer le tirage maintenant (Passer la pause de 2:30)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lancer</span>
              </button>
            </>
          ) : (
            <div className="flex-1 max-w-[200px] sm:max-w-[240px] py-3 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 font-bold text-xs sm:text-sm text-center uppercase">
              Tirage en cours...
            </div>
          )}

          {/* Ticket Receipt Icon Button matching screenshot */}
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('mes_paris');
            }}
            className="w-10 h-10 rounded-xl bg-[#1b2232] hover:bg-[#252f44] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Voir mes tickets Keno"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
