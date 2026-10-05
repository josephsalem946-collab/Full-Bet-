import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Gauge,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  History,
  Trash2,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Undo2,
  Clock,
  Play,
  Pause,
  Timer,
  Printer,
  Receipt,
  ChevronDown,
  ChevronUp,
  Check,
  XCircle,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { TicketPrintModal, PrintableTicketData } from './TicketPrintModal';
import {
  playClickSound,
  playWinSound,
  playCrashSound,
  playRouletteClick,
  playChipSound,
  playBallDropSound
} from '../utils/audio';

// 38 Pockets of American Roulette in exact wheel order (0 and 00 opposite)
export const AMERICAN_WHEEL_ORDER = [
  '0', '28', '9', '26', '30', '11', '7', '20', '32', '17', '5', '22', '34',
  '15', '3', '24', '36', '13', '1', '00', '27', '10', '25', '29', '12', '8',
  '19', '31', '18', '6', '21', '33', '16', '4', '23', '35', '14', '2'
];

export const RED_NUMBERS = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

export const BLACK_NUMBERS = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
];

export function getPocketColor(pocket: string): 'green' | 'red' | 'black' {
  if (pocket === '0' || pocket === '00') return 'green';
  const num = parseInt(pocket, 10);
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
}

// Available Chips Denominations in HTG
export interface ChipConfig {
  value: number;
  label: string;
  bg: string;
  border: string;
  textColor: string;
  ring: string;
  accent: string;
}

export const CHIPS: ChipConfig[] = [
  {
    value: 25,
    label: '25',
    bg: 'bg-gradient-to-tr from-blue-700 via-blue-600 to-blue-500',
    border: 'border-blue-300',
    textColor: 'text-white',
    ring: 'ring-blue-400',
    accent: '#3b82f6'
  },
  {
    value: 50,
    label: '50',
    bg: 'bg-gradient-to-tr from-emerald-800 via-emerald-700 to-emerald-600',
    border: 'border-emerald-300',
    textColor: 'text-white',
    ring: 'ring-emerald-400',
    accent: '#10b981'
  },
  {
    value: 100,
    label: '100',
    bg: 'bg-gradient-to-tr from-neutral-900 via-zinc-800 to-neutral-700',
    border: 'border-amber-400',
    textColor: 'text-amber-300',
    ring: 'ring-amber-400',
    accent: '#f59e0b'
  },
  {
    value: 500,
    label: '500',
    bg: 'bg-gradient-to-tr from-purple-900 via-purple-700 to-purple-600',
    border: 'border-purple-300',
    textColor: 'text-white',
    ring: 'ring-purple-400',
    accent: '#a855f7'
  },
  {
    value: 1000,
    label: '1000',
    bg: 'bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-500',
    border: 'border-amber-200',
    textColor: 'text-slate-950 font-black',
    ring: 'ring-amber-300',
    accent: '#f97316'
  }
];

// Helper: Formats seconds into MM:SS (e.g. 150s -> 02:30)
export function formatCountdown(totalSecs: number): string {
  const m = Math.floor(Math.max(0, totalSecs) / 60);
  const s = Math.max(0, totalSecs) % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export interface RouletteTicketItem {
  spot: string;
  spotLabel: string;
  stake: number;
  potentialMultiplier: number;
  won?: boolean;
  payout?: number;
}

export interface RouletteTicket {
  id: string;
  roundNumber: number;
  date: string;
  totalStake: number;
  winningPocket?: string;
  winningColor?: 'green' | 'red' | 'black';
  payout: number;
  status: 'pending' | 'won' | 'lost';
  items: RouletteTicketItem[];
}

export function getSpotMultiplier(spot: string): number {
  if (spot.startsWith('num_')) return 36;
  if (spot === '1st_12' || spot === '2nd_12' || spot === '3rd_12' || spot.startsWith('col_')) return 3;
  return 2;
}

interface AmericanRouletteProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  onBack?: () => void;
}

export const AmericanRoulette: React.FC<AmericanRouletteProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  onBack
}) => {
  // 2 minutes 30 seconds pause between each round as specified by user
  const PAUSE_SECONDS = 150; // 02:30

  // Game & Round states
  const [roundNumber, setRoundNumber] = useState<number>(519);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [phase, setPhase] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [countdown, setCountdown] = useState<number>(PAUSE_SECONDS);
  const [isAutoEnabled, setIsAutoEnabled] = useState<boolean>(true);

  const [winningPocket, setWinningPocket] = useState<string | null>(null);
  const [lastWinAmount, setLastWinAmount] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>(
    'Phase de paris : 02:30 restant avant le tirage automatique.'
  );

  // Chips & Bets state
  const [selectedChipValue, setSelectedChipValue] = useState<number>(25);
  // Map of spot -> total bet amount
  const [bets, setBets] = useState<Record<string, number>>({});
  // History of chip placements for Undo (spot, amount)
  const [betHistory, setBetHistory] = useState<Array<{ spot: string; amount: number }>>([]);
  // Last round bets for Rebet
  const [lastRoundBets, setLastRoundBets] = useState<Record<string, number>>({});

  // History of winning outcomes
  const [recentOutcomes, setRecentOutcomes] = useState<string[]>([
    '16', '00', '27', '4', '0', '32', '19', '15'
  ]);

  // User's tickets / Fiches history (won/lost)
  const [tickets, setTickets] = useState<RouletteTicket[]>([
    {
      id: 'RL-7819-204',
      roundNumber: 518,
      date: '18:32:10',
      totalStake: 100,
      winningPocket: '16',
      winningColor: 'red',
      payout: 200,
      status: 'won',
      items: [
        {
          spot: 'red',
          spotLabel: 'Rouge',
          stake: 100,
          potentialMultiplier: 2,
          won: true,
          payout: 200
        }
      ]
    },
    {
      id: 'RL-7818-192',
      roundNumber: 517,
      date: '18:28:45',
      totalStake: 50,
      winningPocket: '00',
      winningColor: 'green',
      payout: 0,
      status: 'lost',
      items: [
        {
          spot: 'black',
          spotLabel: 'Noir',
          stake: 50,
          potentialMultiplier: 2,
          won: false,
          payout: 0
        }
      ]
    }
  ]);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [printTicketData, setPrintTicketData] = useState<PrintableTicketData | null>(null);

  // Wheel animation states
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [ballAngle, setBallAngle] = useState<number>(0);
  const [ballRadiusPercent, setBallRadiusPercent] = useState<number>(42); // 42% = outer track, 30% = pocket
  const [isBallDropping, setIsBallDropping] = useState<boolean>(false);

  const animFrameRef = useRef<number | null>(null);
  const clickSoundThrottleRef = useRef<number>(0);

  // Up-to-date refs for timer callback
  const betsRef = useRef(bets);
  betsRef.current = bets;
  const totalBet = useMemo(() => {
    return Object.values(bets).reduce((a, b) => a + b, 0);
  }, [bets]);
  const totalBetRef = useRef(totalBet);
  totalBetRef.current = totalBet;
  const userBalanceRef = useRef(user.balanceHTG);
  userBalanceRef.current = user.balanceHTG;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // Handle placing a chip on a spot
  const handlePlaceBet = useCallback(
    (spotKey: string) => {
      if (phaseRef.current !== 'betting') return;

      const newTotal = totalBetRef.current + selectedChipValue;
      if (newTotal > userBalanceRef.current) {
        if (soundEnabled) playCrashSound();
        setStatusMessage('Solde insuffisant pour placer ce jeton !');
        return;
      }

      if (soundEnabled) playChipSound();

      setBets(prev => ({
        ...prev,
        [spotKey]: (prev[spotKey] || 0) + selectedChipValue
      }));

      setBetHistory(prev => [...prev, { spot: spotKey, amount: selectedChipValue }]);
      setStatusMessage(`Pari ajouté (${selectedChipValue} HTG sur ${formatSpotName(spotKey)}).`);
    },
    [selectedChipValue, soundEnabled]
  );

  // Double all bets (x2)
  const handleDoubleBets = useCallback(() => {
    if (phaseRef.current !== 'betting' || totalBetRef.current === 0) return;
    if (totalBetRef.current * 2 > userBalanceRef.current) {
      if (soundEnabled) playCrashSound();
      setStatusMessage('Solde insuffisant pour doubler les mises.');
      return;
    }

    if (soundEnabled) playChipSound();
    setBets(prev => {
      const doubled: Record<string, number> = {};
      Object.entries(prev).forEach(([spot, amt]) => {
        doubled[spot] = amt * 2;
      });
      return doubled;
    });

    setStatusMessage('Toutes les mises ont été doublées !');
  }, [soundEnabled]);

  // Undo last placed chip
  const handleUndo = useCallback(() => {
    if (phaseRef.current !== 'betting' || betHistory.length === 0) return;
    if (soundEnabled) playClickSound();

    const lastAction = betHistory[betHistory.length - 1];
    setBets(prev => {
      const current = prev[lastAction.spot] || 0;
      const next = current - lastAction.amount;
      const copy = { ...prev };
      if (next <= 0) {
        delete copy[lastAction.spot];
      } else {
        copy[lastAction.spot] = next;
      }
      return copy;
    });

    setBetHistory(prev => prev.slice(0, prev.length - 1));
    setStatusMessage('Dernier jeton retiré.');
  }, [betHistory, soundEnabled]);

  // Rebet previous round
  const handleRebet = useCallback(() => {
    if (phaseRef.current !== 'betting' || Object.keys(lastRoundBets).length === 0) return;

    const previousTotal = Object.values(lastRoundBets).reduce((a, b) => a + b, 0);
    if (previousTotal > userBalanceRef.current) {
      if (soundEnabled) playCrashSound();
      setStatusMessage('Solde insuffisant pour répéter la mise précédente.');
      return;
    }

    if (soundEnabled) playChipSound();
    setBets({ ...lastRoundBets });
    const newHistory: Array<{ spot: string; amount: number }> = [];
    Object.entries(lastRoundBets).forEach(([spot, amount]) => {
      newHistory.push({ spot, amount });
    });
    setBetHistory(newHistory);
    setStatusMessage('Mises du tour précédent restaurées.');
  }, [lastRoundBets, soundEnabled]);

  // Clear all bets
  const handleClearBets = useCallback(() => {
    if (phaseRef.current !== 'betting') return;
    if (soundEnabled) playClickSound();
    setBets({});
    setBetHistory([]);
    setStatusMessage('Tapis nettoyé. Placez vos jetons.');
  }, [soundEnabled]);

  // Evaluate all bets against the winning pocket
  const evaluateWinnings = useCallback(
    (pocket: string, activeBets: Record<string, number>, currentTotalBet: number) => {
      const pocketNum = parseInt(pocket, 10);
      const isZero = pocket === '0' || pocket === '00';
      const isRed = !isZero && RED_NUMBERS.includes(pocketNum);
      const isBlack = !isZero && BLACK_NUMBERS.includes(pocketNum);
      const isEven = !isZero && pocketNum % 2 === 0;
      const isOdd = !isZero && pocketNum % 2 !== 0;
      const isLow = !isZero && pocketNum >= 1 && pocketNum <= 18;
      const isHigh = !isZero && pocketNum >= 19 && pocketNum <= 36;
      const is1st12 = !isZero && pocketNum >= 1 && pocketNum <= 12;
      const is2nd12 = !isZero && pocketNum >= 13 && pocketNum <= 24;
      const is3rd12 = !isZero && pocketNum >= 25 && pocketNum <= 36;

      const isCol1 = !isZero && pocketNum % 3 === 1;
      const isCol2 = !isZero && pocketNum % 3 === 2;
      const isCol3 = !isZero && pocketNum % 3 === 0;

      let totalWon = 0;

      Object.entries(activeBets).forEach(([spot, stake]) => {
        if (stake <= 0) return;

        // Straight number bet: 35 to 1 payout (stake * 36 returned)
        if (spot === `num_${pocket}`) {
          totalWon += stake * 36;
        }
        // Color bets: 1 to 1 payout (stake * 2)
        else if (spot === 'red' && isRed) {
          totalWon += stake * 2;
        } else if (spot === 'black' && isBlack) {
          totalWon += stake * 2;
        }
        // Even / Odd bets: 1 to 1
        else if (spot === 'even' && isEven) {
          totalWon += stake * 2;
        } else if (spot === 'odd' && isOdd) {
          totalWon += stake * 2;
        }
        // Low / High: 1 to 1
        else if (spot === 'low' && isLow) {
          totalWon += stake * 2;
        } else if (spot === 'high' && isHigh) {
          totalWon += stake * 2;
        }
        // Dozens: 2 to 1 (stake * 3)
        else if (spot === '1st_12' && is1st12) {
          totalWon += stake * 3;
        } else if (spot === '2nd_12' && is2nd12) {
          totalWon += stake * 3;
        } else if (spot === '3rd_12' && is3rd12) {
          totalWon += stake * 3;
        }
        // Columns: 2 to 1 (stake * 3)
        else if (spot === 'col_1' && isCol1) {
          totalWon += stake * 3;
        } else if (spot === 'col_2' && isCol2) {
          totalWon += stake * 3;
        } else if (spot === 'col_3' && isCol3) {
          totalWon += stake * 3;
        }
      });

      const colorLabel = isZero ? 'Vert' : isRed ? 'Rouge' : 'Noir';

      if (totalWon > 0) {
        if (soundEnabled) playWinSound();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setLastWinAmount(totalWon);
        setStatusMessage(
          `BRAVO ! Numéro ${pocket} (${colorLabel}) gagnant ! Vous gagnez ${totalWon.toLocaleString()} HTG !`
        );
        const updatedBalance = user.balanceHTG + totalWon;
        onUpdateBalance(updatedBalance, `Gain Roulette #${roundNumber} [${pocket}] (+${totalWon} HTG)`);
      } else {
        if (currentTotalBet > 0 && soundEnabled) playCrashSound();
        setLastWinAmount(0);
        setStatusMessage(
          `Numéro gagnant : ${pocket} (${colorLabel}). ${
            currentTotalBet > 0 ? 'Aucun gain sur ce tour.' : 'Tour officiel achevé.'
          }`
        );
      }

      // Update tickets history with the outcome of this round
      setTickets(prev =>
        prev.map(ticket => {
          if (ticket.roundNumber !== roundNumber || ticket.status !== 'pending') return ticket;

          const updatedItems = ticket.items.map(item => {
            let itemWon = false;
            let itemPayout = 0;
            if (item.spot === `num_${pocket}`) {
              itemWon = true;
              itemPayout = item.stake * 36;
            } else if (item.spot === 'red' && isRed) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === 'black' && isBlack) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === 'even' && isEven) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === 'odd' && isOdd) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === 'low' && isLow) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === 'high' && isHigh) {
              itemWon = true;
              itemPayout = item.stake * 2;
            } else if (item.spot === '1st_12' && is1st12) {
              itemWon = true;
              itemPayout = item.stake * 3;
            } else if (item.spot === '2nd_12' && is2nd12) {
              itemWon = true;
              itemPayout = item.stake * 3;
            } else if (item.spot === '3rd_12' && is3rd12) {
              itemWon = true;
              itemPayout = item.stake * 3;
            } else if (item.spot === 'col_1' && isCol1) {
              itemWon = true;
              itemPayout = item.stake * 3;
            } else if (item.spot === 'col_2' && isCol2) {
              itemWon = true;
              itemPayout = item.stake * 3;
            } else if (item.spot === 'col_3' && isCol3) {
              itemWon = true;
              itemPayout = item.stake * 3;
            }

            return {
              ...item,
              won: itemWon,
              payout: itemPayout
            };
          });

          return {
            ...ticket,
            winningPocket: pocket,
            winningColor: isZero ? 'green' : isRed ? 'red' : 'black',
            status: totalWon > 0 ? 'won' : 'lost',
            payout: totalWon,
            items: updatedItems
          };
        })
      );
    },
    [roundNumber, user.balanceHTG, onUpdateBalance, soundEnabled]
  );

  // Core Spin execution routine
  const triggerSpinRoutine = useCallback(() => {
    if (phaseRef.current === 'spinning') return;

    const currentTotalBet = totalBetRef.current;
    const currentBets = { ...betsRef.current };
    const currentBalance = userBalanceRef.current;

    // If player placed bets, deduct stake and record ticket
    if (currentTotalBet > 0) {
      if (currentTotalBet > currentBalance) {
        setStatusMessage('Solde insuffisant pour la mise en cours.');
        return;
      }
      const newBalance = currentBalance - currentTotalBet;
      onUpdateBalance(newBalance, `Mise Roulette Américaine #${roundNumber} (${currentTotalBet} HTG)`);
      setLastRoundBets({ ...currentBets });

      const ticketId = `RL-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTicket: RouletteTicket = {
        id: ticketId,
        roundNumber,
        date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        totalStake: currentTotalBet,
        payout: 0,
        status: 'pending',
        items: Object.entries(currentBets).map(([spot, stake]) => ({
          spot,
          spotLabel: formatSpotName(spot),
          stake,
          potentialMultiplier: getSpotMultiplier(spot),
          won: false,
          payout: 0
        }))
      };
      setTickets(prev => [newTicket, ...prev]);
    }

    setPhase('spinning');
    setWinningPocket(null);
    setLastWinAmount(null);
    setIsBallDropping(false);
    setStatusMessage('Rien ne va plus ! La bille est lancée...');

    // Pick random winning pocket from AMERICAN_WHEEL_ORDER
    const targetPocket =
      AMERICAN_WHEEL_ORDER[Math.floor(Math.random() * AMERICAN_WHEEL_ORDER.length)];
    const pocketIndex = AMERICAN_WHEEL_ORDER.indexOf(targetPocket);
    const totalPockets = AMERICAN_WHEEL_ORDER.length; // 38
    const sectorAngle = 360 / totalPockets; // ~9.473684 degrees

    // Local angle of the winning pocket on the unrotated wheel:
    const pocketLocalAngle = pocketIndex * sectorAngle;

    // Wheel rotation: Clockwise with random end angle
    const wheelTurns = 5;
    const randomWheelOffset = Math.floor(Math.random() * 360);
    const targetWheelTotalAngle = 360 * wheelTurns + randomWheelOffset;
    const finalWheelRotation = targetWheelTotalAngle % 360;

    // Exact world angle of the winning pocket when wheel stops:
    const finalWinningPocketWorldAngle = (finalWheelRotation + pocketLocalAngle) % 360;

    // Ball rotates counter-clockwise opposite to the wheel:
    // It spins 7 full revolutions counter-clockwise, then aligns mathematically with finalWinningPocketWorldAngle!
    const targetBallTotalAngle = -(360 * 7 + ((360 - (finalWinningPocketWorldAngle % 360)) % 360));

    const startTime = performance.now();
    const duration = 4800; // 4.8 seconds

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Deceleration easing for wheel & ball
      const easeOutWheel = 1 - Math.pow(1 - progress, 3);
      const currentWAngle = targetWheelTotalAngle * easeOutWheel;

      const easeOutBall = 1 - Math.pow(1 - progress, 3.5);
      const currentBAngle = targetBallTotalAngle * easeOutBall;

      setWheelRotation(currentWAngle % 360);
      setBallAngle(currentBAngle);

      // Sound ticks throttle
      if (progress < 0.85 && currentTime - clickSoundThrottleRef.current > 70 + progress * 200) {
        if (soundEnabled) playRouletteClick();
        clickSoundThrottleRef.current = currentTime;
      }

      // Ball drops inward in final 32% of animation and settles in pocket (from 42% down to 38%)
      if (progress > 0.68) {
        const dropProgress = (progress - 0.68) / 0.32;
        const bounce = Math.sin(dropProgress * Math.PI * 3) * (1 - dropProgress) * 2.2;
        const currentRadius = 42 - dropProgress * (42 - 38) + bounce;
        setBallRadiusPercent(currentRadius);
        setIsBallDropping(true);
      } else {
        setBallRadiusPercent(42);
        setIsBallDropping(false);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished! Guaranteed exact mathematical and visual landing on winning pocket
        setWheelRotation(finalWheelRotation);
        setBallAngle(finalWinningPocketWorldAngle);
        setBallRadiusPercent(38);
        setIsBallDropping(false);

        if (soundEnabled) playBallDropSound();
        setWinningPocket(targetPocket);
        setRecentOutcomes(prev => [targetPocket, ...prev.slice(0, 9)]);
        setPhase('result');

        // Evaluate winnings
        evaluateWinnings(targetPocket, currentBets, currentTotalBet);

        // Schedule next round: After 6 seconds of result display, start 2:30 pause automatically!
        setTimeout(() => {
          setPhase('betting');
          setCountdown(PAUSE_SECONDS); // Reset to 2:30
          setRoundNumber(r => r + 1);
          setWinningPocket(null);
          setLastWinAmount(null);
          setBets({});
          setBetHistory([]);
          setStatusMessage('Nouveau Round démarré. Placez vos jetons (Pause 02:30).');
        }, 6000);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [roundNumber, onUpdateBalance, soundEnabled, evaluateWinnings, PAUSE_SECONDS]);

  // 2:30 Auto-Countdown Effect
  useEffect(() => {
    if (phase !== 'betting' || !isAutoEnabled) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerSpinRoutine();
          return 0;
        }

        // Warning alerts at 10s and 5s
        if (prev === 11) {
          setStatusMessage('⚠️ Rien ne va plus ! Fermeture des mises dans 10 secondes...');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isAutoEnabled, triggerSpinRoutine]);

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#121418] text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col select-none">
      {/* ===================== TOP HEADER (Exact Screenshot Layout + 2:30 Auto Pause) ===================== */}
      <div className="px-4 py-3 bg-[#0d1015] border-b border-slate-800/80 flex items-center justify-between gap-2">
        {/* Left: Back Arrow, Sound Toggle & Auto 2:30 Mode Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onBack && (
            <button
              onClick={() => {
                playClickSound();
                onBack();
              }}
              className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
              title="Retour aux jeux"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0"
            title={soundEnabled ? 'Couper le son' : 'Activer le son'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Mode Auto 2:30 Toggle Badge */}
          <button
            onClick={() => {
              playClickSound();
              setIsAutoEnabled(prev => !prev);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 shrink-0 ${
              isAutoEnabled
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
            title="Activer ou suspendre la pause automatique 2:30"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isAutoEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="hidden sm:inline">Pause Auto 2:30</span>
            <span className="sm:hidden">Auto</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40">
              {isAutoEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Center: Speedometer / Tachometer Icon with Dynamic 2:30 Countdown Badge */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#1a202c] border border-slate-600/60 shadow-inner flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5 text-slate-200" />
          </div>

          {/* Live Chronometer Countdown Display */}
          <div className="flex flex-col text-left px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
            <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>
                {phase === 'betting'
                  ? 'Pause Mises'
                  : phase === 'spinning'
                  ? 'Rotation'
                  : 'Résultat'}
              </span>
            </div>
            <div
              className={`font-mono-num font-black text-sm leading-tight ${
                phase === 'betting' && countdown <= 10
                  ? 'text-red-400 animate-pulse'
                  : phase === 'betting'
                  ? 'text-amber-300'
                  : 'text-cyan-300'
              }`}
            >
              {phase === 'betting' ? formatCountdown(countdown) : phase === 'spinning' ? '00:00' : '02:30...'}
            </div>
          </div>
        </div>

        {/* Right: NUMÉRO DE ROUND 519 */}
        <div className="text-right shrink-0">
          <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 leading-none">
            NUMÉRO DE ROUND
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono leading-tight tracking-wider">
            {roundNumber}
          </div>
        </div>
      </div>

      {/* ===================== ROULETTE WHEEL STAGE (Top Half) ===================== */}
      <div className="relative w-full bg-[#072818] overflow-hidden py-4 px-2 flex flex-col items-center justify-center border-b border-emerald-950/60">
        {/* Realistic casino table green felt pattern & vignette */}
        <div className="absolute inset-0 bg-radial from-[#0e4b2d] via-[#08301c] to-[#04160c] opacity-95 pointer-events-none" />

        {/* Subtle grid lines in background mimicking casino table felt perspective */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* The American Roulette Wheel Container */}
        <div className="relative z-10 w-64 h-64 sm:w-76 sm:h-76 md:w-84 md:h-84 flex items-center justify-center">
          {/* Outer Mahogany Wooden Ring with golden brass bezel */}
          <div
            className="w-full h-full rounded-full p-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] border-4 border-[#3d2314] relative flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, #5c2f16 0%, #2e1408 70%, #170701 100%)'
            }}
          >
            {/* 8 Brass Diamonds (Directional diamonds on outer rim) */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-3 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 rounded-[1px] shadow-sm transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${50 - 46 * Math.cos((i * 45 * Math.PI) / 180)}%`,
                  left: `${50 + 46 * Math.sin((i * 45 * Math.PI) / 180)}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg)`
                }}
              />
            ))}

            {/* Inner Metallic Track Ring where ball spins */}
            <div className="w-full h-full rounded-full p-2 border-2 border-amber-500/40 relative flex items-center justify-center bg-[#111]">
              {/* Rotating Sector Wheel */}
              <div
                className="w-full h-full rounded-full relative overflow-hidden transition-transform duration-75 will-change-transform"
                style={{
                  transform: `rotate(${wheelRotation}deg)`
                }}
              >
                {/* 38 Numbered Pockets SVG */}
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    <radialGradient id="brassCone" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="45%" stopColor="#ca8a04" />
                      <stop offset="85%" stopColor="#713f12" />
                      <stop offset="100%" stopColor="#3f2208" />
                    </radialGradient>
                    <radialGradient id="woodCenter" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#78350f" />
                      <stop offset="70%" stopColor="#451a03" />
                      <stop offset="100%" stopColor="#1f0902" />
                    </radialGradient>
                  </defs>

                  {/* Draw 38 Pocket Slices */}
                  {AMERICAN_WHEEL_ORDER.map((pocket, idx) => {
                    const totalPockets = AMERICAN_WHEEL_ORDER.length; // 38
                    const sliceAngle = 360 / totalPockets;
                    const startAngle = (idx * sliceAngle - sliceAngle / 2) * (Math.PI / 180);
                    const endAngle = (idx * sliceAngle + sliceAngle / 2) * (Math.PI / 180);
                    const radius = 145;
                    const innerRadius = 75;

                    const x1 = 150 + radius * Math.sin(startAngle);
                    const y1 = 150 - radius * Math.cos(startAngle);
                    const x2 = 150 + radius * Math.sin(endAngle);
                    const y2 = 150 - radius * Math.cos(endAngle);

                    const x3 = 150 + innerRadius * Math.sin(endAngle);
                    const y3 = 150 - innerRadius * Math.cos(endAngle);
                    const x4 = 150 + innerRadius * Math.sin(startAngle);
                    const y4 = 150 - innerRadius * Math.cos(startAngle);

                    const color = getPocketColor(pocket);
                    const fillColor =
                      color === 'green'
                        ? '#059669' // Green for 0 and 00
                        : color === 'red'
                        ? '#dc2626' // Red
                        : '#111827'; // Black

                    const isWinningThisPocket = winningPocket === pocket;

                    // Text position
                    const textAngle = idx * sliceAngle;
                    const textRad = (textAngle * Math.PI) / 180;
                    const textX = 150 + 115 * Math.sin(textRad);
                    const textY = 150 - 115 * Math.cos(textRad);

                    return (
                      <g key={pocket}>
                        <path
                          d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`}
                          fill={isWinningThisPocket ? '#f59e0b' : fillColor}
                          stroke={isWinningThisPocket ? '#fef08a' : '#d97706'}
                          strokeWidth={isWinningThisPocket ? '3.5' : '1.2'}
                          className={isWinningThisPocket ? 'filter drop-shadow-[0_0_12px_#fde047]' : ''}
                        />

                        {/* Number label oriented along radius */}
                        <text
                          x={textX}
                          y={textY}
                          fill={isWinningThisPocket ? '#000000' : '#ffffff'}
                          fontSize={isWinningThisPocket ? '11' : '10'}
                          fontWeight={isWinningThisPocket ? '900' : 'bold'}
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          dominantBaseline="central"
                          transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                        >
                          {pocket}
                        </text>
                      </g>
                    );
                  })}

                  {/* Central Wooden Cone */}
                  <circle cx="150" cy="150" r="75" fill="url(#woodCenter)" stroke="#b45309" strokeWidth="2" />

                  {/* Brass Turret Center Cone */}
                  <circle cx="150" cy="150" r="42" fill="url(#brassCone)" stroke="#fef08a" strokeWidth="1.5" />

                  {/* 4-spoke Cross Turret */}
                  <line x1="150" y1="120" x2="150" y2="180" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
                  <line x1="120" y1="150" x2="180" y2="150" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="150" cy="150" r="10" fill="#fde047" stroke="#854d0e" strokeWidth="2" />
                </svg>
              </div>

              {/* The White Ivory Ball - Lands directly on winning pocket */}
              {(phase === 'spinning' || winningPocket !== null) && (
                <div
                  className={`absolute rounded-full pointer-events-none transition-all duration-75 z-20 ${
                    winningPocket ? 'w-4 h-4 ring-2 ring-yellow-300' : 'w-3.5 h-3.5'
                  } ${isBallDropping ? 'scale-90 animate-pulse' : 'scale-100'}`}
                  style={{
                    top: `${50 - (winningPocket ? 38 : ballRadiusPercent) * Math.cos(((winningPocket ? (wheelRotation + AMERICAN_WHEEL_ORDER.indexOf(winningPocket) * (360 / 38)) : ballAngle) * Math.PI) / 180)}%`,
                    left: `${50 + (winningPocket ? 38 : ballRadiusPercent) * Math.sin(((winningPocket ? (wheelRotation + AMERICAN_WHEEL_ORDER.indexOf(winningPocket) * (360 / 38)) : ballAngle) * Math.PI) / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f8fafc 40%, #cbd5e1 75%, #475569 100%)',
                    boxShadow: winningPocket
                      ? '0 0 14px 4px rgba(250, 204, 21, 0.95), 0 3px 8px rgba(0,0,0,0.9)'
                      : '0 2px 8px rgba(0,0,0,0.85), 0 0 8px rgba(255,255,255,0.9)'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Winning Pocket Result Display Pill */}
        {winningPocket && (
          <div className="mt-2.5 z-10 animate-in zoom-in-75 duration-300 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5 ${
                getPocketColor(winningPocket) === 'green'
                  ? 'bg-emerald-600 text-white'
                  : getPocketColor(winningPocket) === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-black text-white border border-slate-700'
              }`}
            >
              <span>Numéro Gagnant : {winningPocket}</span>
              <span className="text-[10px] uppercase font-bold opacity-90">
                ({getPocketColor(winningPocket) === 'green' ? 'Vert' : getPocketColor(winningPocket) === 'red' ? 'Rouge' : 'Noir'})
              </span>
            </span>

            {lastWinAmount !== null && lastWinAmount > 0 && (
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs animate-bounce shadow-lg shadow-emerald-500/30">
                +{lastWinAmount.toLocaleString()} HTG !
              </span>
            )}
          </div>
        )}

        {/* Recent Outcomes Horizontal Pill Bar */}
        <div className="mt-2 z-10 flex items-center gap-1 overflow-x-auto max-w-full px-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Récents :</span>
          {recentOutcomes.slice(0, 8).map((outc, i) => {
            const col = getPocketColor(outc);
            return (
              <div
                key={i}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono-num font-black text-[11px] shadow-sm shrink-0 ${
                  col === 'green'
                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                    : col === 'red'
                    ? 'bg-red-600 text-white ring-1 ring-red-400'
                    : 'bg-black text-white border border-slate-700'
                }`}
              >
                {outc}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== BETTING FELT TABLE (Exact Screenshot Layout) ===================== */}
      <div className="p-3 sm:p-5 bg-[#171a20] relative flex-1 flex flex-col justify-between">
        <div className="flex gap-2 sm:gap-4 items-start justify-between">
          {/* Left + Center Area: American Roulette Table Grid */}
          <div className="flex-1 max-w-[500px] mx-auto space-y-1">
            {/* --- TOP ROW: 0 and 00 (Green block split in two equal cells) --- */}
            <div className="flex">
              {/* Spacer matching outside bets width on left */}
              <div className="w-[84px] sm:w-[104px] shrink-0" />

              {/* 0 and 00 cells directly above columns 1, 2, 3 */}
              <div className="flex-1 grid grid-cols-2 gap-[2px]">
                {/* Pocket 0 */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('num_0')}
                  className={`h-11 sm:h-12 bg-[#059669] hover:bg-[#10b981] active:bg-[#047857] text-white font-black text-lg sm:text-xl font-mono flex items-center justify-center border-2 border-white rounded-[4px] relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['num_0'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span>0</span>
                  {bets['num_0'] && renderChipBadge(bets['num_0'])}
                </button>

                {/* Pocket 00 */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('num_00')}
                  className={`h-11 sm:h-12 bg-[#059669] hover:bg-[#10b981] active:bg-[#047857] text-white font-black text-lg sm:text-xl font-mono flex items-center justify-center border-2 border-white rounded-[4px] relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['num_00'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span>00</span>
                  {bets['num_00'] && renderChipBadge(bets['num_00'])}
                </button>
              </div>
            </div>

            {/* --- MAIN NUMBERS & OUTSIDE BETS SECTION --- */}
            <div className="flex gap-[2px]">
              {/* Outside Bets (Left Column A: Low, Even, Red, Black, Odd, High) */}
              <div className="w-[42px] sm:w-[52px] grid grid-rows-6 gap-[2px] shrink-0 text-[10px] sm:text-[11px] font-black uppercase">
                {/* LOW (1-18) */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('low')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['low'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">LOW</span>
                  {bets['low'] && renderChipBadge(bets['low'])}
                </button>

                {/* EVEN */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('even')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['even'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">EVEN</span>
                  {bets['even'] && renderChipBadge(bets['even'])}
                </button>

                {/* RED */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('red')}
                  className={`bg-[#b91c1c] hover:bg-[#dc2626] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['red'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  title="Rouge (Red)"
                >
                  <div className="w-4 h-4 bg-red-400 rotate-45 border border-white" />
                  {bets['red'] && renderChipBadge(bets['red'])}
                </button>

                {/* BLACK */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('black')}
                  className={`bg-black hover:bg-neutral-900 text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['black'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  title="Noir (Black)"
                >
                  <div className="w-4 h-4 bg-neutral-950 rotate-45 border border-slate-500" />
                  {bets['black'] && renderChipBadge(bets['black'])}
                </button>

                {/* ODD */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('odd')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['odd'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">ODD</span>
                  {bets['odd'] && renderChipBadge(bets['odd'])}
                </button>

                {/* HIGH (19-36) */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('high')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['high'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">HIGH</span>
                  {bets['high'] && renderChipBadge(bets['high'])}
                </button>
              </div>

              {/* Outside Bets (Left Column B: 1st 12, 2nd 12, 3rd 12) */}
              <div className="w-[42px] sm:w-[52px] grid grid-rows-3 gap-[2px] shrink-0 text-[10px] sm:text-[11px] font-black uppercase">
                {/* 1st 12 */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('1st_12')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['1st_12'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">1st 12</span>
                  {bets['1st_12'] && renderChipBadge(bets['1st_12'])}
                </button>

                {/* 2nd 12 */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('2nd_12')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['2nd_12'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">2nd 12</span>
                  {bets['2nd_12'] && renderChipBadge(bets['2nd_12'])}
                </button>

                {/* 3rd 12 */}
                <button
                  type="button"
                  disabled={phase !== 'betting'}
                  onClick={() => handlePlaceBet('3rd_12')}
                  className={`bg-[#1e232d] hover:bg-[#28303e] text-white border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                    bets['3rd_12'] ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <span className="[writing-mode:vertical-lr] rotate-180 tracking-wider">3rd 12</span>
                  {bets['3rd_12'] && renderChipBadge(bets['3rd_12'])}
                </button>
              </div>

              {/* 36 Numbers Grid (12 rows x 3 columns) */}
              <div className="flex-1 grid grid-cols-3 gap-[2px]">
                {/* 12 Rows of 3 numbers */}
                {Array.from({ length: 12 }).map((_, rowIdx) => {
                  const num1 = rowIdx * 3 + 1;
                  const num2 = rowIdx * 3 + 2;
                  const num3 = rowIdx * 3 + 3;

                  return (
                    <React.Fragment key={rowIdx}>
                      {[num1, num2, num3].map(num => {
                        const isRed = RED_NUMBERS.includes(num);
                        const spotKey = `num_${num}`;
                        const isWinning = winningPocket === num.toString();

                        return (
                          <button
                            key={num}
                            type="button"
                            disabled={phase !== 'betting'}
                            onClick={() => handlePlaceBet(spotKey)}
                            className={`h-10 sm:h-11 font-mono-num font-black text-base sm:text-lg flex items-center justify-center border-2 border-white rounded-[3px] relative transition-all active:scale-95 disabled:opacity-85 ${
                              isRed
                                ? 'bg-[#b91c1c] hover:bg-[#dc2626] active:bg-[#991b1b] text-white'
                                : 'bg-black hover:bg-neutral-900 active:bg-neutral-950 text-white'
                            } ${isWinning ? 'ring-4 ring-yellow-300 animate-pulse z-10' : ''} ${
                              bets[spotKey] ? 'ring-2 ring-yellow-400' : ''
                            }`}
                          >
                            <span>{num}</span>
                            {bets[spotKey] && renderChipBadge(bets[spotKey])}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* --- BOTTOM ROW: 2 to 1 for each column --- */}
            <div className="flex gap-[2px]">
              <div className="w-[84px] sm:w-[104px] shrink-0" />
              <div className="flex-1 grid grid-cols-3 gap-[2px]">
                {['col_1', 'col_2', 'col_3'].map(colKey => (
                  <button
                    key={colKey}
                    type="button"
                    disabled={phase !== 'betting'}
                    onClick={() => handlePlaceBet(colKey)}
                    className={`h-9 bg-[#1e232d] hover:bg-[#28303e] text-white text-[11px] font-black border-2 border-white rounded-[3px] flex items-center justify-center relative transition-all active:scale-95 disabled:opacity-75 ${
                      bets[colKey] ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <span>2 to 1</span>
                    {bets[colKey] && renderChipBadge(bets[colKey])}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===================== RIGHT SIDE CONTROL COLUMN (Exact Screenshot) ===================== */}
          <div className="flex flex-col items-center gap-3 shrink-0 pt-1">
            {/* Double Button x2 */}
            <button
              type="button"
              disabled={phase !== 'betting' || totalBet === 0}
              onClick={handleDoubleBets}
              className="w-11 h-11 rounded-2xl bg-[#1e2430] hover:bg-[#2a3242] active:bg-[#151a24] text-slate-200 border border-slate-700/80 font-black text-sm flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40"
              title="Doubler les mises (x2)"
            >
              <span>x2</span>
            </button>

            {/* Rebet Button */}
            <button
              type="button"
              disabled={phase !== 'betting' || Object.keys(lastRoundBets).length === 0}
              onClick={handleRebet}
              className="w-11 h-11 rounded-2xl bg-[#1e2430] hover:bg-[#2a3242] active:bg-[#151a24] text-slate-200 border border-slate-700/80 flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40"
              title="Répéter la mise précédente"
            >
              <RotateCcw className="w-5 h-5 text-slate-300" />
            </button>

            {/* Undo Button */}
            <button
              type="button"
              disabled={phase !== 'betting' || betHistory.length === 0}
              onClick={handleUndo}
              className="w-11 h-11 rounded-2xl bg-[#1e2430] hover:bg-[#2a3242] active:bg-[#151a24] text-slate-200 border border-slate-700/80 flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-40"
              title="Annuler le dernier jeton"
            >
              <Undo2 className="w-5 h-5 text-slate-300" />
            </button>

            {/* Clear All Bets */}
            {totalBet > 0 && phase === 'betting' && (
              <button
                type="button"
                onClick={handleClearBets}
                className="w-11 h-11 rounded-2xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 flex items-center justify-center shadow-lg transition-all active:scale-95"
                title="Effacer tous les jetons"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}

            {/* Chips Stack (25, 50, 100, 500, 1000) */}
            <div className="pt-2 flex flex-col items-center gap-2">
              {CHIPS.map(chip => {
                const isSelected = selectedChipValue === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    disabled={phase !== 'betting'}
                    onClick={() => {
                      playClickSound();
                      setSelectedChipValue(chip.value);
                    }}
                    className={`w-12 h-12 rounded-full relative flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'scale-110 ring-4 ring-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)] z-10'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    } disabled:opacity-50`}
                  >
                    {/* Realistic 3D Casino Chip Outer Rim */}
                    <div
                      className={`w-full h-full rounded-full ${chip.bg} p-1 border-2 ${chip.border} shadow-lg flex items-center justify-center relative overflow-hidden`}
                    >
                      {/* Segmented dashed edge markings */}
                      <div className="absolute inset-0 rounded-full border border-dashed border-white/60 pointer-events-none" />

                      {/* Inner Circle with Value */}
                      <div className="w-7 h-7 rounded-full bg-white/95 text-slate-950 font-mono-num font-black text-xs flex items-center justify-center shadow-inner">
                        {chip.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===================== INFO NOTICE BANNER (Dynamic Countdown Warning) ===================== */}
        <div className="mt-4 py-2.5 px-3 rounded-xl bg-[#0d1015] border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            {phase === 'betting' && countdown <= 10 ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span
              className={`truncate font-medium ${
                phase === 'betting' && countdown <= 10 ? 'text-red-300 font-bold' : ''
              }`}
            >
              {statusMessage}
            </span>
          </div>

          {/* Quick timer indicator on the right of info bar */}
          {phase === 'betting' && (
            <div className="flex items-center gap-1 shrink-0 font-mono-num font-black text-xs px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/60">
              <span className="text-slate-400 text-[10px] hidden sm:inline">Pause :</span>
              <span className={countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'}>
                {formatCountdown(countdown)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================== BOTTOM ACTION BAR (Exact Screenshot Layout) ===================== */}
      <div className="px-4 py-3 bg-[#0a0d12] border-t border-slate-800 flex items-center justify-between gap-4">
        {/* Left: Paiement total / Mise totale */}
        <div>
          <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider leading-none">
            {lastWinAmount !== null && lastWinAmount > 0 ? 'Paiement total' : 'Mise totale'}
          </div>
          <div className="text-lg sm:text-xl font-mono-num font-black text-white leading-tight">
            {lastWinAmount !== null && lastWinAmount > 0 ? (
              <span className="text-emerald-400">+{lastWinAmount.toFixed(2)} HTG</span>
            ) : (
              <span>{totalBet.toFixed(2)} HTG</span>
            )}
          </div>
        </div>

        {/* Right: Big Action Button with Instant Spin or Auto Countdown Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={phase === 'spinning'}
            onClick={triggerSpinRoutine}
            className={`px-6 sm:px-8 py-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
              phase === 'spinning'
                ? 'bg-blue-800/50 text-blue-200 cursor-not-allowed'
                : totalBet > 0
                ? 'bg-[#1d64d8] hover:bg-[#2563eb] text-white shadow-blue-600/30 ring-1 ring-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {phase === 'spinning' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Rotation en cours...</span>
              </>
            ) : totalBet > 0 ? (
              <>
                <Play className="w-4 h-4 fill-current text-white" />
                <span>Tourner Maintenant ({totalBet} HTG)</span>
              </>
            ) : (
              <>
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Tirage Auto dans {formatCountdown(countdown)}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ===================== MES PARIS & FICHES ROULETTE (GAGNÉ / PERDU) ===================== */}
      <div className="bg-[#0b0e14] border-t border-slate-800 p-4 sm:p-5 space-y-3.5">
        
        {/* Header Bar: Title, Count, Summary Stats & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-display">
                  Mes Paris & Fiches Roulette
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  {tickets.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Historique en direct de vos fiches gagnées, perdues et en cours
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons: Tous, Gagnés, Perdus */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#131722] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                playClickSound();
                setTicketFilter('all');
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                ticketFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous ({tickets.length})
            </button>
            <button
              onClick={() => {
                playClickSound();
                setTicketFilter('won');
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                ticketFilter === 'won'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Gagnés ({tickets.filter(t => t.status === 'won').length})</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                setTicketFilter('lost');
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                ticketFilter === 'lost'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Perdus ({tickets.filter(t => t.status === 'lost').length})</span>
            </button>
          </div>
        </div>

        {/* Tickets List */}
        {tickets.filter(t => ticketFilter === 'all' || t.status === ticketFilter).length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-[#0f131c] rounded-2xl border border-slate-800/80 space-y-1">
            <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-xs font-bold text-slate-300">Aucune fiche dans cette catégorie</p>
            <p className="text-[11px] text-slate-500">Placez vos jetons sur le tapis pour générer vos fiches de jeu !</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {tickets
              .filter(t => ticketFilter === 'all' || t.status === ticketFilter)
              .map(ticket => {
                const isWon = ticket.status === 'won';
                const isLost = ticket.status === 'lost';
                const isPending = ticket.status === 'pending';

                return (
                  <div
                    key={ticket.id}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      isWon
                        ? 'bg-gradient-to-r from-[#0d2319] via-[#0d1f19] to-[#0f172a] border-emerald-500/40 shadow-emerald-950/20'
                        : isLost
                        ? 'bg-[#12151e] border-slate-800/90 hover:border-slate-700'
                        : 'bg-gradient-to-r from-[#17223b] via-[#10192e] to-[#0d1424] border-blue-500/40 animate-pulse'
                    }`}
                  >
                    {/* Top Line: ID, Round, Date, Winning Ball and Status Badge */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400">
                          {ticket.id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          Round #{ticket.roundNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {ticket.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Winning pocket badge if available */}
                        {ticket.winningPocket && (
                          <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-lg border border-slate-700 font-mono text-[10px]">
                            <span className="text-slate-400">Sortie :</span>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] text-white ${
                                ticket.winningColor === 'green'
                                ? 'bg-emerald-600'
                                : ticket.winningColor === 'red'
                                ? 'bg-red-600'
                                : 'bg-neutral-800'
                              }`}
                            >
                              {ticket.winningPocket}
                            </span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase font-mono flex items-center gap-1 ${
                            isWon
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isLost
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {isWon ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>GAGNÉ</span>
                            </>
                          ) : isLost ? (
                            <>
                              <XCircle className="w-3 h-3 text-red-400" />
                              <span>PERDU</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                              <span>EN ROTATION</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Middle Line: Selections Summary */}
                    <div className="py-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ticket.items.map((item, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              item.won
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 font-bold'
                                : isLost
                                ? 'bg-slate-900/60 text-slate-400 border-slate-800'
                                : 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            <span>{item.spotLabel} :</span>
                            <strong className="text-white">{item.stake} HTG</strong>
                            {item.won && (
                              <span className="text-emerald-400 ml-0.5">
                                (+{item.payout} HTG)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Line: Total Stake, Payout & Print Button */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Mise totale</span>
                          <strong className="text-white">{ticket.totalStake} HTG</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Paiement</span>
                          <strong
                            className={isWon ? 'text-emerald-400 font-black' : isLost ? 'text-slate-400' : 'text-blue-300'}
                          >
                            {isWon ? `+${ticket.payout.toLocaleString('fr-FR')} HTG` : isLost ? '0 HTG' : 'En calcul...'}
                          </strong>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playClickSound();
                          const appliedOdds =
                            ticket.status === 'won' && ticket.totalStake > 0
                              ? +(ticket.payout / ticket.totalStake).toFixed(2)
                              : 2.0;
                          setPrintTicketData({
                            ticketCode: ticket.id,
                            date: ticket.date,
                            userId: user.id || 'USR-8821',
                            gameType: 'Casino • Roulette Américaine',
                            odds: appliedOdds,
                            betAmount: ticket.totalStake,
                            potentialPayout: ticket.status === 'won' ? ticket.payout : ticket.totalStake * 2,
                            status: ticket.status === 'won' ? 'WON' : ticket.status === 'lost' ? 'LOST' : 'PENDING',
                            gameDetails: {
                              game_round_id: `ROULETTE-ROUND-#${ticket.roundNumber}`,
                              auto_cashout_multiplier: appliedOdds
                            },
                            details: ticket.items.map(it => `${it.spotLabel}: ${it.stake} HTG`).join(' | ')
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172033] hover:bg-[#202c45] text-[#38bdf8] hover:text-white border border-[#38bdf8]/40 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                        title="Enprimer la fiche officielle (Universal Ticket 80mm)"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span>Fiche POS</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>

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

// Helper: Formats spot name nicely for notification messages
function formatSpotName(spotKey: string): string {
  if (spotKey.startsWith('num_')) {
    return `Numéro ${spotKey.replace('num_', '')}`;
  }
  switch (spotKey) {
    case 'red':
      return 'Rouge';
    case 'black':
      return 'Noir';
    case 'even':
      return 'Pair';
    case 'odd':
      return 'Impair';
    case 'low':
      return 'Passe (1-18)';
    case 'high':
      return 'Manque (19-36)';
    case '1st_12':
      return '1ère Douzaine';
    case '2nd_12':
      return '2ème Douzaine';
    case '3rd_12':
      return '3ème Douzaine';
    case 'col_1':
      return '1ère Colonne';
    case 'col_2':
      return '2ème Colonne';
    case 'col_3':
      return '3ème Colonne';
    default:
      return spotKey;
  }
}

// Helper: Renders 3D chip overlay badge on any placed bet spot
function renderChipBadge(amount: number) {
  let chipColor = 'bg-blue-600 text-white border-blue-300';
  if (amount >= 1000) chipColor = 'bg-orange-600 text-white border-amber-300';
  else if (amount >= 500) chipColor = 'bg-purple-600 text-white border-purple-300';
  else if (amount >= 100) chipColor = 'bg-neutral-900 text-amber-300 border-amber-400';
  else if (amount >= 50) chipColor = 'bg-emerald-700 text-white border-emerald-300';

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-in zoom-in-50 duration-150">
      <div
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${chipColor} border-2 shadow-[0_2px_8px_rgba(0,0,0,0.9)] flex items-center justify-center font-mono-num font-black text-[9px] sm:text-[10px] leading-none ring-1 ring-white/50`}
      >
        {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
      </div>
    </div>
  );
}
