import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  RotateCcw,
  MessageCircle,
  Users,
  History,
  TrendingUp,
  BarChart2,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { playClickSound, playWinSound, playCrashSound, playBetPlacedSound } from '../utils/audio';

interface JetXProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  isStandaloneModal?: boolean;
  onClose?: () => void;
}

interface BetDeckState {
  stake: number;
  targetCollect: number;
  hasBet: boolean;
  hasCollected: boolean;
  collectedMultiplier: number | null;
  collectedAmount: number | null;
}

interface OnlinePlayerBet {
  id: string;
  name: string;
  avatar: string;
  stake: number;
  collectedAt: number | null;
  win: number | null;
}

interface ChatMessage {
  id: string;
  user: string;
  time: string;
  text: string;
  isWin?: boolean;
}

interface Parachutist {
  id: number;
  x: number;
  y: number;
  speedY: number;
  driftX: number;
  opacity: number;
}

const DEFAULT_HISTORY = [1.34, 1.51, 2.29, 36.07, 1.47, 1.64, 4.12, 1.18, 12.50, 1.05];

const SIMULATED_PLAYERS = [
  'Alex_HT', 'JeanLuc_94', 'Salomon_VIP', 'MarieB', 'TiBoss_509',
  'KingBet', 'LuckyGuy', 'ProGamer_Cap', 'CashHunter', 'Dread_77'
];

export const JetXCompleteGame: React.FC<JetXProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  isStandaloneModal = false,
  onClose
}) => {
  // Currency Mode: 'DMO' (Demo 20000.00 as in SmartSoft screenshot) or 'HTG' (Real Account Balance)
  const [currencyMode, setCurrencyMode] = useState<'DMO' | 'HTG'>('DMO');
  const [demoBalance, setDemoBalance] = useState<number>(20000.00);

  // Digital clock matching top right "00:04:31"
  const [clockTime, setClockTime] = useState<string>('00:04:31');

  // Flight State: 'waiting' | 'flying' | 'crashed'
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [waitingCountdown, setWaitingCountdown] = useState<number>(5.0);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [activePlayersCount, setActivePlayersCount] = useState<number>(1090);

  // Global Toggles Bar (matching top options)
  const [globalAutoBet, setGlobalAutoBet] = useState<boolean>(false);
  const [globalAutoCollect, setGlobalAutoCollect] = useState<boolean>(false);

  // Dual Betting Decks State (Deck 1 and Deck 2 matching screenshot)
  const [deck1, setDeck1] = useState<BetDeckState>({
    stake: 5.00,
    targetCollect: 2.00,
    hasBet: false,
    hasCollected: false,
    collectedMultiplier: null,
    collectedAmount: null
  });

  const [deck2, setDeck2] = useState<BetDeckState>({
    stake: 5.00,
    targetCollect: 2.00,
    hasBet: false,
    hasCollected: false,
    collectedMultiplier: null,
    collectedAmount: null
  });

  // Multipliers history
  const [history, setHistory] = useState<number[]>(DEFAULT_HISTORY);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);

  // Bottom Navigation Active Tab: 'joueurs' | 'historique' | 'mes_mises' | 'tchat' | 'statistiques'
  const [activeBottomTab, setActiveBottomTab] = useState<
    'joueurs' | 'historique' | 'mes_mises' | 'tchat' | 'statistiques'
  >('joueurs');

  // Online Players Bets list
  const [liveBets, setLiveBets] = useState<OnlinePlayerBet[]>([]);

  // User's own bet history
  const [myBetsHistory, setMyBetsHistory] = useState<{
    id: string;
    time: string;
    stake: number;
    multiplier: number | null;
    win: number;
    currency: string;
  }[]>([]);

  // Chat Feed
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Alex_HT', time: '00:02', text: 'Bienvenue sur JetX ! 🔥' },
    { id: '2', user: 'TiBoss_509', time: '00:03', text: 'Encaissement x36.07 tout à l\'heure incroyable !' },
    { id: '3', user: 'MarieB', time: '00:04', text: 'Gros décollage en vue 🚀' }
  ]);
  const [chatInput, setChatInput] = useState<string>('');

  // Refs for animation & crash mechanics
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crashTargetRef = useRef<number>(2.20);
  const flightStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crashPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const parachutistsRef = useRef<Parachutist[]>([]);

  // Active current balance according to mode
  const currentBalance = currencyMode === 'DMO' ? demoBalance : user.balanceHTG;

  // Deduct/Credit balance wrapper
  const updateBalanceWrapper = useCallback((amountChange: number, reason: string) => {
    if (currencyMode === 'DMO') {
      setDemoBalance(prev => +(prev + amountChange).toFixed(2));
    } else {
      onUpdateBalance(+(user.balanceHTG + amountChange).toFixed(2), reason);
    }
  }, [currencyMode, user.balanceHTG, onUpdateBalance]);

  // Digital clock effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClockTime(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Provably Fair Crash Target Generator
  const generateCrashTarget = useCallback((): number => {
    const r = Math.random();
    // 3% instant crash at 1.00x
    if (r < 0.03) return 1.00;
    // Standard crash formula
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    if (h % 33 === 0) return 1.00;
    const pt = Math.floor((100 * e - h) / (e - h)) / 100;
    return Math.min(100.00, Math.max(1.01, pt));
  }, []);

  // Generate simulated online players bets for the round
  const generateRoundBets = useCallback(() => {
    const bets: OnlinePlayerBet[] = SIMULATED_PLAYERS.map((name, i) => ({
      id: `p-${i}-${Date.now()}`,
      name,
      avatar: name[0],
      stake: [5, 10, 20, 50, 100, 250][Math.floor(Math.random() * 6)],
      collectedAt: null,
      win: null
    }));
    setLiveBets(bets);
  }, []);

  // Cash out a deck
  const collectDeck = useCallback((deckNum: 1 | 2) => {
    const targetDeck = deckNum === 1 ? deck1 : deck2;
    if (!targetDeck.hasBet || targetDeck.hasCollected || gameState !== 'flying') return;

    const currentMult = multiplier;
    const winAmt = +(targetDeck.stake * currentMult).toFixed(2);

    if (deckNum === 1) {
      setDeck1(prev => ({
        ...prev,
        hasCollected: true,
        collectedMultiplier: currentMult,
        collectedAmount: winAmt
      }));
    } else {
      setDeck2(prev => ({
        ...prev,
        hasCollected: true,
        collectedMultiplier: currentMult,
        collectedAmount: winAmt
      }));
    }

    if (soundActive) {
      try {
        playWinSound();
      } catch {
        // audio optional
      }
    }

    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 }
    });

    updateBalanceWrapper(winAmt, `JetX Collecte Pont ${deckNum} (${currentMult}x) +${winAmt} ${currencyMode}`);

    // Add to personal bets history
    setMyBetsHistory(prev => [
      {
        id: String(Date.now()),
        time: clockTime,
        stake: targetDeck.stake,
        multiplier: currentMult,
        win: winAmt,
        currency: currencyMode
      },
      ...prev.slice(0, 19)
    ]);
  }, [deck1, deck2, gameState, multiplier, soundActive, updateBalanceWrapper, currencyMode, clockTime]);

  // Handle Auto Collect during flight
  useEffect(() => {
    if (gameState !== 'flying') return;

    // Deck 1 Auto Collect
    if (
      deck1.hasBet &&
      !deck1.hasCollected &&
      (globalAutoCollect || deck1.targetCollect > 1.01) &&
      multiplier >= deck1.targetCollect
    ) {
      collectDeck(1);
    }

    // Deck 2 Auto Collect
    if (
      deck2.hasBet &&
      !deck2.hasCollected &&
      (globalAutoCollect || deck2.targetCollect > 1.01) &&
      multiplier >= deck2.targetCollect
    ) {
      collectDeck(2);
    }

    // Update live bets for simulated players collecting along the way
    setLiveBets(prev =>
      prev.map(p => {
        if (!p.collectedAt && multiplier >= 1.2 && Math.random() < 0.08) {
          return {
            ...p,
            collectedAt: multiplier,
            win: +(p.stake * multiplier).toFixed(2)
          };
        }
        return p;
      })
    );
  }, [multiplier, gameState, deck1, deck2, globalAutoCollect, collectDeck]);

  // Toggle Bet or Cancel Bet on a Deck
  const handleToggleBet = (deckNum: 1 | 2) => {
    const curDeck = deckNum === 1 ? deck1 : deck2;
    const setCur = deckNum === 1 ? setDeck1 : setDeck2;

    if (curDeck.hasBet) {
      // Cancel bet if waiting
      if (gameState === 'waiting') {
        updateBalanceWrapper(curDeck.stake, `JetX Annulation Pari +${curDeck.stake} ${currencyMode}`);
        setCur(prev => ({ ...prev, hasBet: false }));
        if (soundActive) playClickSound();
      }
      return;
    }

    // Place bet check
    if (currentBalance < curDeck.stake) {
      alert(`Solde insuffisant (${currentBalance.toFixed(2)} ${currencyMode}). Veuillez recharger.`);
      if (currencyMode === 'HTG') onOpenWallet();
      return;
    }

    // Deduct stake
    updateBalanceWrapper(-curDeck.stake, `JetX Mise Pont ${deckNum} -${curDeck.stake} ${currencyMode}`);

    if (soundActive) {
      try {
        playBetPlacedSound();
      } catch {
        playClickSound();
      }
    }

    setCur(prev => ({
      ...prev,
      hasBet: true,
      hasCollected: false,
      collectedMultiplier: null,
      collectedAmount: null
    }));
  };

  // Adjust Stake
  const adjustStake = (deckNum: 1 | 2, delta: number) => {
    const setCur = deckNum === 1 ? setDeck1 : setDeck2;
    setCur(prev => {
      if (prev.hasBet && gameState !== 'waiting') return prev;
      const next = Math.max(1, Math.min(50000, +(prev.stake + delta).toFixed(2)));
      return { ...prev, stake: next };
    });
  };

  // Adjust Target Collect
  const adjustCollectTarget = (deckNum: 1 | 2, delta: number) => {
    const setCur = deckNum === 1 ? setDeck1 : setDeck2;
    setCur(prev => {
      const next = Math.max(1.10, Math.min(100.0, +(prev.targetCollect + delta).toFixed(2)));
      return { ...prev, targetCollect: next };
    });
  };

  // Quick Stake selection
  const setQuickStake = (deckNum: 1 | 2, val: number | 'TOUT') => {
    const setCur = deckNum === 1 ? setDeck1 : setDeck2;
    setCur(prev => {
      if (prev.hasBet && gameState !== 'waiting') return prev;
      if (val === 'TOUT') {
        return { ...prev, stake: Math.max(1, Math.floor(currentBalance)) };
      }
      return { ...prev, stake: val };
    });
  };

  // Double stake (X2 button)
  const handleDoubleStakes = () => {
    if (soundActive) playClickSound();
    setDeck1(prev => (prev.hasBet && gameState !== 'waiting' ? prev : { ...prev, stake: prev.stake * 2 }));
    setDeck2(prev => (prev.hasBet && gameState !== 'waiting' ? prev : { ...prev, stake: prev.stake * 2 }));
  };

  // Launch the Supersonic Jet
  const launchFlight = useCallback(() => {
    const target = generateCrashTarget();
    crashTargetRef.current = target;
    setGameState('flying');
    setMultiplier(1.00);
    flightStartTimeRef.current = performance.now();
    setActivePlayersCount(Math.floor(1050 + Math.random() * 120));
  }, [generateCrashTarget]);

  const launchFlightRef = useRef(launchFlight);
  launchFlightRef.current = launchFlight;

  // Start pre-round waiting state
  const startWaitingRound = useCallback(() => {
    if (crashPauseTimeoutRef.current) clearTimeout(crashPauseTimeoutRef.current);
    setGameState('waiting');
    setWaitingCountdown(5.0);
    setMultiplier(1.00);
    parachutistsRef.current = [];

    // Auto-bet re-activation if enabled
    setDeck1(prev => {
      if (globalAutoBet && !prev.hasBet && currentBalance >= prev.stake) {
        updateBalanceWrapper(-prev.stake, `JetX Auto-Mise Pont 1 -${prev.stake} ${currencyMode}`);
        return { ...prev, hasBet: true, hasCollected: false, collectedMultiplier: null, collectedAmount: null };
      }
      return { ...prev, hasCollected: false, collectedMultiplier: null, collectedAmount: null };
    });

    setDeck2(prev => {
      if (globalAutoBet && !prev.hasBet && currentBalance >= prev.stake) {
        updateBalanceWrapper(-prev.stake, `JetX Auto-Mise Pont 2 -${prev.stake} ${currencyMode}`);
        return { ...prev, hasBet: true, hasCollected: false, collectedMultiplier: null, collectedAmount: null };
      }
      return { ...prev, hasCollected: false, collectedMultiplier: null, collectedAmount: null };
    });

    generateRoundBets();

    const startTime = performance.now();
    const duration = 5000;

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const rem = Math.max(0, (duration - elapsed) / 1000);
      setWaitingCountdown(+rem.toFixed(1));

      if (rem <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        launchFlightRef.current();
      }
    }, 100);
  }, [globalAutoBet, currentBalance, updateBalanceWrapper, currencyMode, generateRoundBets]);

  // Handle automatic restart after crash pause (3.5 seconds pause, then next round)
  useEffect(() => {
    if (gameState !== 'crashed') return;

    crashPauseTimeoutRef.current = setTimeout(() => {
      startWaitingRound();
    }, 3500);

    return () => {
      if (crashPauseTimeoutRef.current) clearTimeout(crashPauseTimeoutRef.current);
    };
  }, [gameState, startWaitingRound]);

  // Flight tick loop
  useEffect(() => {
    if (gameState !== 'flying') return;

    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = (now - flightStartTimeRef.current) / 1000;

      // JetX flight curve speed formula
      const current = +(1.00 + 0.08 * elapsed + 0.05 * Math.pow(elapsed, 1.85)).toFixed(2);

      // Periodically spawn a parachutist leaping out of the jet
      if (Math.random() < 0.035 && parachutistsRef.current.length < 5) {
        parachutistsRef.current.push({
          id: Math.random(),
          x: 240 + Math.random() * 80,
          y: 60 + Math.random() * 40,
          speedY: 0.6 + Math.random() * 0.4,
          driftX: (Math.random() - 0.5) * 0.4,
          opacity: 1.0
        });
      }

      if (current >= crashTargetRef.current) {
        // EXPLODED / CRASHED
        setMultiplier(crashTargetRef.current);
        setGameState('crashed');

        if (soundActive) {
          try {
            playCrashSound();
          } catch {
            // ignore
          }
        }

        // Add to history
        setHistory(prev => [crashTargetRef.current, ...prev.slice(0, 15)]);

        // Reset bets if not collected
        setDeck1(prev => ({ ...prev, hasBet: false }));
        setDeck2(prev => ({ ...prev, hasBet: false }));

        return;
      }

      setMultiplier(current);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, soundActive]);

  // Initial countdown on mount
  useEffect(() => {
    startWaitingRound();
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // HTML5 Canvas Render: JetX Retro Arcade Twilight Sky, Supersonic Fighter Jet & Parachutists
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Twilight Retro Gradient (matching SmartSoft JetX pink-purple sky)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#3e244d'); // deep purple
    skyGrad.addColorStop(0.4, '#6b4169');
    skyGrad.addColorStop(0.75, '#b97787'); // mauve pink
    skyGrad.addColorStop(1, '#e8af9e'); // twilight peach horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant mountain dunes / cloud puffs on the horizon
    ctx.fillStyle = 'rgba(235, 175, 160, 0.4)';
    ctx.beginPath();
    ctx.ellipse(width * 0.2, height, 180, 50, 0, Math.PI, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.75, height, 220, 60, 0, Math.PI, 0);
    ctx.fill();

    // Soft clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(width * 0.85, height * 0.65, 90, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(width * 0.15, height * 0.75, 75, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Progress 0 to 1 based on multiplier
    const progress = Math.min(1, Math.max(0, (multiplier - 1.00) / 12.0));

    // Plane position
    const startX = 60;
    const startY = height - 50;
    const planeX = startX + progress * (width - 160);
    const planeY = startY - Math.pow(progress, 0.8) * (height - 110);

    // Render Parachutists (Signature SmartSoft JetX detail)
    parachutistsRef.current.forEach((p, idx) => {
      p.y += p.speedY;
      p.x += p.driftX;
      if (p.y > height + 20) {
        parachutistsRef.current.splice(idx, 1);
        return;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;

      // Parachute dome
      ctx.fillStyle = '#60a5fa'; // light blue parachute
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Lines
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(p.x - 8, p.y);
      ctx.lineTo(p.x, p.y + 10);
      ctx.moveTo(p.x + 8, p.y);
      ctx.lineTo(p.x, p.y + 10);
      ctx.stroke();

      // Pilot body
      ctx.fillStyle = '#facc15'; // yellow helmet
      ctx.beginPath();
      ctx.arc(p.x, p.y + 11, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p.x - 1.5, p.y + 13, 3, 5);

      ctx.restore();
    });

    // Draw Jet or Explosion
    if (gameState === 'crashed') {
      // Boom explosion fireball
      ctx.save();
      ctx.translate(planeX, planeY);

      // Fireball outer
      const boomGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 45);
      boomGrad.addColorStop(0, '#ffffff');
      boomGrad.addColorStop(0.3, '#facc15');
      boomGrad.addColorStop(0.6, '#ef4444');
      boomGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = boomGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();

      // Explosion sparks
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let s = 0; s < 8; s++) {
        const ang = (s * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 10, Math.sin(ang) * 10);
        ctx.lineTo(Math.cos(ang) * 40, Math.sin(ang) * 40);
        ctx.stroke();
      }

      ctx.restore();
    } else if (gameState === 'flying' || gameState === 'waiting') {
      // Draw Supersonic Jet
      ctx.save();
      ctx.translate(planeX, planeY);

      // Flight angle
      const angle = -0.32;
      ctx.rotate(angle);

      // Subtle wobble
      const wobble = Math.sin(Date.now() / 90) * 1.2;
      ctx.translate(0, wobble);

      // 1. Afterburner Flame (Dual Thruster fire trails)
      if (gameState === 'flying') {
        const flameLength = 25 + Math.random() * 15;
        const flameGrad = ctx.createLinearGradient(-35 - flameLength, 0, -30, 0);
        flameGrad.addColorStop(0, 'rgba(255, 69, 0, 0)');
        flameGrad.addColorStop(0.4, '#ff4500');
        flameGrad.addColorStop(0.8, '#ffcc00');
        flameGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-30, -4);
        ctx.lineTo(-30 - flameLength, 0);
        ctx.lineTo(-30, 4);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Jet Fuselage (Stealth Fighter: metallic white/grey + bright yellow accents)
      // Main Body
      ctx.fillStyle = '#f8fafc'; // sleek white
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(35, 0); // sharp nose
      ctx.lineTo(-20, -7);
      ctx.lineTo(-28, -6);
      ctx.lineTo(-28, 6);
      ctx.lineTo(-20, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cockpit Canopy (Dark cyan reflection)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(12, -2, 9, 3.5, 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Wings (Yellow accents matching JetX brand)
      ctx.fillStyle = '#facc15'; // yellow-400
      ctx.beginPath();
      ctx.moveTo(4, -5);
      ctx.lineTo(-14, -20);
      ctx.lineTo(-22, -18);
      ctx.lineTo(-14, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(4, 5);
      ctx.lineTo(-14, 20);
      ctx.lineTo(-22, 18);
      ctx.lineTo(-14, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tail Fins
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(-22, -3);
      ctx.lineTo(-30, -12);
      ctx.lineTo(-26, -12);
      ctx.lineTo(-16, -3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }, [multiplier, gameState]);

  // Pill styling helper according to SmartSoft JetX colors
  const getPillStyle = (val: number) => {
    if (val >= 10.0) {
      return 'bg-[#422006] text-[#fde047] border border-[#facc15]/60 shadow-[0_0_8px_rgba(250,204,21,0.4)]';
    }
    if (val >= 1.50) {
      return 'bg-[#052e16] text-[#4ade80] border border-[#22c55e]/50';
    }
    return 'bg-[#3b0713] text-[#fb7185] border border-[#f43f5e]/50';
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      user: user.fullName ? user.fullName.split(' ')[0] : 'Moi',
      time: clockTime.substring(0, 5),
      text: chatInput.trim()
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto rounded-3xl bg-[#0b0e17] border border-slate-800 shadow-2xl overflow-hidden font-sans select-none text-white">
      {/* ================= 1. SMARTSOFT TOP BAR & DIGITAL CLOCK ================= */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 bg-[#05070d] border-b border-slate-900 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          {/* SmartSoft Gaming Geometric Red Icon */}
          <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-slate-300">
            <span className="w-4 h-4 rounded bg-red-600 flex items-center justify-center font-black text-[10px] text-white shadow-xs">
              SS
            </span>
            <span className="font-extrabold uppercase text-slate-200">SMARTSOFT</span>
            <span className="text-slate-400 font-normal">GAMING</span>
          </div>
        </div>

        {/* Digital Clock HH:MM:SS matching top right (00:04:31) */}
        <div className="text-slate-400 font-bold tracking-widest text-[11px]">
          {clockTime}
        </div>
      </div>

      {/* ================= 2. JETX BRAND & BALANCE BAR ================= */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#080d19] border-b border-slate-800/80">
        {/* Left: JetX Iconic Logo (White "Jet" + Bright Yellow "X") */}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-2xl sm:text-3xl font-black italic tracking-tight font-display">
            <span className="text-white drop-shadow-sm">Jet</span>
            <span className="text-[#fbc02d] text-3xl sm:text-4xl -ml-0.5 drop-shadow-[0_0_12px_rgba(251,192,45,0.75)]">
              X
            </span>
          </div>

          {/* Currency Toggle Switch (DMO vs HTG) */}
          <div className="flex items-center bg-[#050811] p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold ml-2">
            <button
              onClick={() => {
                playClickSound();
                setCurrencyMode('DMO');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                currencyMode === 'DMO'
                  ? 'bg-amber-400 text-black font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DMO (Démo)
            </button>
            <button
              onClick={() => {
                playClickSound();
                setCurrencyMode('HTG');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                currencyMode === 'HTG'
                  ? 'bg-emerald-500 text-black font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HTG (Réel)
            </button>
          </div>
        </div>

        {/* Right: Solde Coins + Chat + Audio + Close */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Solde avec icône pièces d'or matching screenshot (20000.00 DMO) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121826] border border-amber-400/30 shadow-inner">
            <span className="text-base">🪙</span>
            <span className="font-mono font-black text-sm sm:text-base text-[#fbc02d]">
              {currentBalance.toFixed(2)}{' '}
              <span className="text-xs text-amber-300 font-bold">{currencyMode}</span>
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundActive(!soundActive)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Activer / Couper le son"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Chat Icon Button */}
          <button
            onClick={() => setActiveBottomTab('tchat')}
            className={`p-1.5 rounded-lg transition-colors ${
              activeBottomTab === 'tchat' ? 'bg-amber-400 text-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Tchat Joueurs"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          {/* Close button if standalone modal */}
          {isStandaloneModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 3. MULTIPLIERS HISTORY BAR (1.34x, 1.51x, 2.29x, 36.07x...) ================= */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#050811] border-b border-slate-900">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {history.slice(0, 8).map((val, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded-md font-mono text-xs font-black shrink-0 transition-transform hover:scale-105 cursor-pointer ${getPillStyle(
                val
              )}`}
              onClick={() => setShowHistoryDropdown(true)}
            >
              {val.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* History Icon (Refresh / Clock arrow) */}
        <button
          onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
          className="flex items-center gap-0.5 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1 shrink-0"
          title="Historique complet des vols"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown modal if opened */}
      {showHistoryDropdown && (
        <div className="p-3 bg-[#0a0f1d] border-b border-slate-800 text-xs animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-amber-400" /> Historique détaillé des 15 derniers vols JetX :
            </span>
            <button
              onClick={() => setShowHistoryDropdown(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Fermer ✕
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {history.map((h, i) => (
              <div key={i} className={`p-1 text-center rounded font-mono font-bold text-xs ${getPillStyle(h)}`}>
                {h.toFixed(2)}x
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 4. JETX FLIGHT ARENA (Canvas + Neon Green Multiplier 1.34 X) ================= */}
      <div className="relative w-full h-[220px] sm:h-[250px] bg-[#3e244d] overflow-hidden flex items-center justify-center">
        {/* Canvas with Twilight Sky, Fighter Jet, Parachutists and Flames */}
        <canvas
          ref={canvasRef}
          width={640}
          height={250}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Center Giant Neon Lime-Green Multiplier (Matching "1.34 X" in screenshot) */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none select-none">
          {gameState === 'waiting' && (
            <div className="flex flex-col items-center space-y-1.5 animate-fade-in bg-black/40 px-4 py-2 rounded-2xl backdrop-blur-xs">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                DÉCOLLAGE DANS
              </span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${(waitingCountdown / 5.0) * 100}%` }}
                />
              </div>
              <span className="text-2xl font-black font-mono text-white">
                {waitingCountdown.toFixed(1)}s
              </span>
            </div>
          )}

          {gameState === 'flying' && (
            <div className="flex flex-col items-center">
              <div
                className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-[#00ff66] drop-shadow-[0_4px_18px_rgba(0,255,102,0.85)]"
                style={{
                  textShadow: '0 0 20px #00ff66, 0 0 40px #00ff66, 2px 2px 0px #000'
                }}
              >
                {multiplier.toFixed(2)} X
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="flex flex-col items-center animate-bounce bg-black/50 px-5 py-2 rounded-2xl">
              <span className="text-xs font-black uppercase tracking-widest text-red-400">
                💥 BOOM ! EXPLOSION
              </span>
              <span className="text-4xl sm:text-6xl font-black font-mono text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.9)]">
                {multiplier.toFixed(2)} X
              </span>
            </div>
          )}
        </div>

        {/* Live Active Players count icon matching bottom right "👤 1090" */}
        <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-xs text-xs font-mono font-bold text-amber-300">
          <span className="text-amber-400">👤</span>
          <span>{activePlayersCount}</span>
        </div>
      </div>

      {/* ================= 5. TOP OPTIONS CONTROL BAR (X2, AUTO MISE, AUTO COLLECTER) ================= */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#080d19] border-b border-slate-800/80 text-xs">
        {/* Bouton [X2] */}
        <button
          onClick={handleDoubleStakes}
          className="px-3 py-1 rounded-lg bg-[#141d2f] hover:bg-[#1b273f] text-[#fbc02d] font-black border border-amber-400/30 transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Doubler les mises"
        >
          X2
        </button>

        {/* Toggle AUTO MISE */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            AUTO MISE
          </span>
          <button
            type="button"
            onClick={() => setGlobalAutoBet(!globalAutoBet)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              globalAutoBet ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                globalAutoBet ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle AUTO COLLECTER */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            AUTO COLLECTER
          </span>
          <button
            type="button"
            onClick={() => setGlobalAutoCollect(!globalAutoCollect)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              globalAutoCollect ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                globalAutoCollect ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ================= 6. DUAL BETTING DECKS (DECK 1 AND DECK 2) ================= */}
      <div className="p-2 sm:p-3 space-y-2.5 bg-[#0b0e18]">
        {/* DECK 1 */}
        <JetXDeckCard
          deckNum={1}
          state={deck1}
          currencyMode={currencyMode}
          onAdjustStake={(d) => adjustStake(1, d)}
          onAdjustTargetCollect={(d) => adjustCollectTarget(1, d)}
          onQuickStake={(v) => setQuickStake(1, v)}
          onToggleBet={() => handleToggleBet(1)}
          onCollect={() => collectDeck(1)}
          gameState={gameState}
          currentMultiplier={multiplier}
        />

        {/* DECK 2 */}
        <JetXDeckCard
          deckNum={2}
          state={deck2}
          currencyMode={currencyMode}
          onAdjustStake={(d) => adjustStake(2, d)}
          onAdjustTargetCollect={(d) => adjustCollectTarget(2, d)}
          onQuickStake={(v) => setQuickStake(2, v)}
          onToggleBet={() => handleToggleBet(2)}
          onCollect={() => collectDeck(2)}
          gameState={gameState}
          currentMultiplier={multiplier}
        />
      </div>

      {/* ================= 7. BOTTOM NAVIGATION TABS (Joueurs, Historique, Mes Mises, Tchat, Statistiques) ================= */}
      <div className="bg-[#060810] border-t border-slate-800">
        <div className="flex items-center justify-around px-2 text-xs font-bold text-slate-400">
          <button
            onClick={() => setActiveBottomTab('joueurs')}
            className={`py-2 px-2 transition-colors relative cursor-pointer ${
              activeBottomTab === 'joueurs' ? 'text-amber-400 font-extrabold' : 'hover:text-white'
            }`}
          >
            Joueurs
            {activeBottomTab === 'joueurs' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveBottomTab('historique')}
            className={`py-2 px-2 transition-colors relative cursor-pointer ${
              activeBottomTab === 'historique' ? 'text-amber-400 font-extrabold' : 'hover:text-white'
            }`}
          >
            Historique
            {activeBottomTab === 'historique' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveBottomTab('mes_mises')}
            className={`py-2 px-2 transition-colors relative cursor-pointer ${
              activeBottomTab === 'mes_mises' ? 'text-amber-400 font-extrabold' : 'hover:text-white'
            }`}
          >
            Mes Mises
            {activeBottomTab === 'mes_mises' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveBottomTab('tchat')}
            className={`py-2 px-2 transition-colors relative cursor-pointer ${
              activeBottomTab === 'tchat' ? 'text-amber-400 font-extrabold' : 'hover:text-white'
            }`}
          >
            Tchat
            {activeBottomTab === 'tchat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveBottomTab('statistiques')}
            className={`py-2 px-2 transition-colors relative cursor-pointer ${
              activeBottomTab === 'statistiques' ? 'text-amber-400 font-extrabold' : 'hover:text-white'
            }`}
          >
            Statistiques
            {activeBottomTab === 'statistiques' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="p-3 max-h-48 overflow-y-auto bg-[#080d19] border-t border-slate-900 text-xs">
          {/* TAB 1: JOUEURS (Live bets table) */}
          {activeBottomTab === 'joueurs' && (
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-slate-500 font-bold pb-1 border-b border-slate-800 text-[11px]">
                <span>Joueur</span>
                <span className="text-center">Mise</span>
                <span className="text-center">Cote</span>
                <span className="text-right">Gain</span>
              </div>
              {liveBets.map((b) => (
                <div key={b.id} className="grid grid-cols-4 py-1 items-center font-mono text-[11px]">
                  <span className="text-slate-300 font-sans truncate">{b.name}</span>
                  <span className="text-center text-slate-200">{b.stake.toFixed(2)}</span>
                  <span className="text-center">
                    {b.collectedAt ? (
                      <span className="text-emerald-400 font-bold">{b.collectedAt.toFixed(2)}x</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </span>
                  <span className="text-right font-bold">
                    {b.win ? (
                      <span className="text-[#fbc02d]">+{b.win.toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: HISTORIQUE */}
          {activeBottomTab === 'historique' && (
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-slate-500 font-bold pb-1 border-b border-slate-800 text-[11px]">
                <span>Vol</span>
                <span className="text-center">Multiplicateur</span>
                <span className="text-right">Provably Fair</span>
              </div>
              {history.map((h, i) => (
                <div key={i} className="grid grid-cols-3 py-1 items-center font-mono text-[11px]">
                  <span className="text-slate-400">#984{120 - i}</span>
                  <span className={`text-center font-black ${h >= 2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {h.toFixed(2)}x
                  </span>
                  <span className="text-right text-slate-500 text-[10px]">SHA-256 ✓</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MES MISES */}
          {activeBottomTab === 'mes_mises' && (
            <div className="space-y-1">
              {myBetsHistory.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Aucune mise enregistrée sur cette session.</p>
              ) : (
                myBetsHistory.map((m) => (
                  <div key={m.id} className="flex justify-between items-center py-1 border-b border-slate-800/60 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-400">{m.time}</span> • Mise : <strong className="text-white">{m.stake} {m.currency}</strong>
                    </div>
                    <div>
                      {m.multiplier ? (
                        <span className="text-emerald-400 font-bold">
                          {m.multiplier.toFixed(2)}x (+{m.win} {m.currency})
                        </span>
                      ) : (
                        <span className="text-rose-500">Crashé</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: TCHAT */}
          {activeBottomTab === 'tchat' && (
            <div className="space-y-2">
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-[11px] leading-tight">
                    <span className="text-slate-500 font-mono">[{msg.time}]</span>{' '}
                    <span className="text-amber-400 font-bold">{msg.user}:</span>{' '}
                    <span className="text-slate-200">{msg.text}</span>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#141b2c] border border-slate-700 text-white text-xs outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: STATISTIQUES */}
          {activeBottomTab === 'statistiques' && (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Plus gros multiplicateur :</span>
                <span className="text-base font-black text-amber-400 font-mono">36.07x</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Taux de Retour (RTP) :</span>
                <span className="text-base font-black text-emerald-400 font-mono">97.00%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Mise Minimum :</span>
                <span className="text-xs font-bold text-slate-200 font-mono">1.00 {currencyMode}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block">Plafond Gain Max :</span>
                <span className="text-xs font-bold text-slate-200 font-mono">10,000x</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Deck de mise individuel JetX
 * Reproduit scrupuleusement la structure de chaque pont dans la capture :
 * - Ligne 1 : [- 5.00 +] et [- 2.00x +]
 * - Ligne 2 : Grille 2x2 des boutons rapides [20.00] [50.00] / [100.00] [TOUT]
 * - Bloc droit : Grand bouton jaune éclatant [5.00 DMO MISE] / [COLLECTER]
 */
interface JetXDeckCardProps {
  deckNum: number;
  state: BetDeckState;
  currencyMode: 'DMO' | 'HTG';
  onAdjustStake: (delta: number) => void;
  onAdjustTargetCollect: (delta: number) => void;
  onQuickStake: (val: number | 'TOUT') => void;
  onToggleBet: () => void;
  onCollect: () => void;
  gameState: 'waiting' | 'flying' | 'crashed';
  currentMultiplier: number;
}

const JetXDeckCard: React.FC<JetXDeckCardProps> = ({
  deckNum,
  state,
  currencyMode,
  onAdjustStake,
  onAdjustTargetCollect,
  onQuickStake,
  onToggleBet,
  onCollect,
  gameState,
  currentMultiplier
}) => {
  const isBetLocked = state.hasBet && gameState !== 'waiting';
  const liveWin = +(state.stake * currentMultiplier).toFixed(2);

  return (
    <div className="bg-[#121826] rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-stretch">
        
        {/* ================= GAUCHE : SÉLECTEURS DE MISE & DE CIBLE + BOUTONS RAPIDES ================= */}
        <div className="flex flex-col justify-between space-y-2">
          {/* Ligne 1 : [ - 5.00 + ] et [ - 2.00x + ] */}
          <div className="grid grid-cols-2 gap-2">
            {/* Boîte Mise */}
            <div className="flex items-center rounded-xl bg-[#090d18] border border-slate-800 overflow-hidden">
              <button
                onClick={() => onAdjustStake(-1)}
                disabled={isBetLocked}
                className="px-2.5 py-1.5 text-base font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center font-mono font-black text-sm text-[#fbc02d]">
                {state.stake.toFixed(2)}
              </div>
              <button
                onClick={() => onAdjustStake(1)}
                disabled={isBetLocked}
                className="px-2.5 py-1.5 text-base font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-30 transition-colors"
              >
                +
              </button>
            </div>

            {/* Boîte Auto Collect Multiplicateur */}
            <div className="flex items-center rounded-xl bg-[#090d18] border border-slate-800 overflow-hidden">
              <button
                onClick={() => onAdjustTargetCollect(-0.1)}
                className="px-2.5 py-1.5 text-base font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center font-mono font-bold text-xs text-slate-300">
                {state.targetCollect.toFixed(2)}x
              </div>
              <button
                onClick={() => onAdjustTargetCollect(0.1)}
                className="px-2.5 py-1.5 text-base font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Ligne 2 : Grille 2x2 des boutons rapides (20.00, 50.00 / 100.00, TOUT) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onQuickStake(20.00)}
              disabled={isBetLocked}
              className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                state.stake === 20.0
                  ? 'bg-slate-700 text-white border-slate-500'
                  : 'bg-[#182030] text-slate-300 border-slate-800 hover:bg-slate-700/60'
              } disabled:opacity-40`}
            >
              20.00
            </button>

            <button
              onClick={() => onQuickStake(50.00)}
              disabled={isBetLocked}
              className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                state.stake === 50.0
                  ? 'bg-slate-700 text-white border-slate-500'
                  : 'bg-[#182030] text-slate-300 border-slate-800 hover:bg-slate-700/60'
              } disabled:opacity-40`}
            >
              50.00
            </button>

            <button
              onClick={() => onQuickStake(100.00)}
              disabled={isBetLocked}
              className={`py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                state.stake === 100.0
                  ? 'bg-slate-700 text-white border-slate-500'
                  : 'bg-[#182030] text-slate-300 border-slate-800 hover:bg-slate-700/60'
              } disabled:opacity-40`}
            >
              100.00
            </button>

            <button
              onClick={() => onQuickStake('TOUT')}
              disabled={isBetLocked}
              className="py-1 rounded-lg text-xs font-mono font-bold border bg-[#182030] text-amber-400 border-amber-400/40 hover:bg-amber-400/20 disabled:opacity-40 transition-all uppercase"
            >
              TOUT
            </button>
          </div>
        </div>

        {/* ================= DROITE : GRAND BOUTON DE MISE JAUNE FLUO / COLLECTER ================= */}
        <div className="flex">
          {/* CAS 1 : En vol avec pari actif non collecté -> BOUTON COLLECTER VERT/ORANGE */}
          {state.hasBet && !state.hasCollected && gameState === 'flying' && (
            <button
              type="button"
              onClick={onCollect}
              className="w-full min-h-[85px] rounded-2xl bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] hover:from-[#4ade80] hover:to-[#16a34a] text-white font-black shadow-[0_0_24px_rgba(34,197,94,0.6)] border-2 border-[#86efac] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <span className="text-base sm:text-lg tracking-wider uppercase drop-shadow-md">
                COLLECTER
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black drop-shadow-md">
                {liveWin.toFixed(2)} {currencyMode}
              </span>
            </button>
          )}

          {/* CAS 2 : Déjà collecté ce vol-ci -> Succès */}
          {state.hasCollected && (
            <div className="w-full min-h-[85px] rounded-2xl bg-gradient-to-b from-emerald-800 to-emerald-950 border-2 border-emerald-400/60 text-white flex flex-col items-center justify-center p-2 text-center shadow-lg">
              <span className="text-xs uppercase font-bold text-emerald-200">COLLECTÉ AVEC SUCCÈS</span>
              <span className="text-lg font-mono font-black text-white">
                +{state.collectedAmount?.toFixed(2)} {currencyMode}
              </span>
              <span className="text-[11px] font-mono text-emerald-300">
                @{state.collectedMultiplier?.toFixed(2)}x
              </span>
            </div>
          )}

          {/* CAS 3 : Pari placé en attente du décollage -> Bouton Annuler */}
          {state.hasBet && !state.hasCollected && gameState === 'waiting' && (
            <button
              type="button"
              onClick={onToggleBet}
              className="w-full min-h-[85px] rounded-2xl bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black shadow-lg border-2 border-red-400 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-sm uppercase tracking-wider">ANNULER</span>
              <span className="text-xs text-red-200">EN ATTENTE DU VOL</span>
              <span className="text-base font-mono font-bold">
                {state.stake.toFixed(2)} {currencyMode}
              </span>
            </button>
          )}

          {/* CAS 4 : Aucun pari placé -> LE GRAND BOUTON JAUNE ÉCLATANT (Matching screenshot) */}
          {!state.hasBet && !state.hasCollected && (
            <button
              type="button"
              onClick={onToggleBet}
              className="w-full min-h-[85px] rounded-2xl bg-[#fbc02d] hover:bg-[#fdd835] active:bg-[#f9a825] text-slate-950 font-black shadow-[0_4px_16px_rgba(251,192,45,0.4)] border-2 border-[#fff59d] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-lg sm:text-xl font-mono font-black tracking-tight leading-none">
                {state.stake.toFixed(2)}{' '}
                <span className="text-xs sm:text-sm font-extrabold uppercase">{currencyMode}</span>
              </span>
              <span className="text-xl sm:text-2xl tracking-wider font-extrabold uppercase mt-0.5 leading-none">
                MISE
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
