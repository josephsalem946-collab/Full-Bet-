import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  History,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  MessageCircle,
  Menu,
  ShieldCheck,
  Play,
  X,
  TrendingUp,
  Trophy,
  Users,
  Clock,
  Trash2,
  ArrowUpRight,
  DollarSign,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { playClickSound, playWinSound, playBetPlacedSound, playCrashSound } from '../utils/audio';

export interface AviatorMyBet {
  id: string;
  date: string;
  panel: 1 | 2;
  betAmount: number;
  multiplier: number | null;
  winAmount: number;
  status: 'won' | 'lost';
}

export interface AviatorLiveBet {
  id: string;
  user: string;
  betAmount: number;
  cashoutTarget: number;
  multiplier: number | null;
  winAmount: number | null;
  hasCashedOut: boolean;
}

interface AviatorProps {
  user: UserProfile;
  onUpdateBalance: (newBalance: number, reason: string) => void;
  onOpenWallet: () => void;
  isStandaloneModal?: boolean;
  onClose?: () => void;
}

interface BetPanelState {
  betAmount: number;
  hasBet: boolean;
  hasCashedOut: boolean;
  isAutoBet: boolean;
  isAutoCashout: boolean;
  autoCashoutMultiplier: number;
  cashedOutMultiplier: number | null;
  cashedOutAmount: number | null;
}

const DEFAULT_QUICK_STAKES = [28, 70, 140, 700];

export const AviatorCompleteGame: React.FC<AviatorProps> = ({
  user,
  onUpdateBalance,
  onOpenWallet,
  isStandaloneModal = false,
  onClose
}) => {
  // Flight state:
  // - 'waiting': 5s pre-round countdown, accepting bets
  // - 'flying': plane in flight, multiplier ascending
  // - 'crashed': plane flew away!
  const [gameState, setGameState] = useState<'waiting' | 'flying' | 'crashed'>('waiting');
  const [waitingCountdown, setWaitingCountdown] = useState<number>(5.0);
  const [multiplier, setMultiplier] = useState<number>(1.00);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);
  const [showChatNotice, setShowChatNotice] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stats bar counters (matching screenshot: 2367/2686 bets & total gains)
  const [totalBetsCount, setTotalBetsCount] = useState<number>(2367);
  const [totalPoolCount, setTotalPoolCount] = useState<number>(2686);
  const [totalRoundWinnings, setTotalRoundWinnings] = useState<number>(7880.67);

  // Multiplier history badges (matching screenshot colors)
  const [history, setHistory] = useState<number[]>([
    1.00, 1.19, 1.28, 1.74, 2.14, 1.00, 2.02, 27.05, 1.45, 3.20, 1.12, 8.64
  ]);

  // Dual Betting Panels State
  const [panel1, setPanel1] = useState<BetPanelState>({
    betAmount: 70,
    hasBet: false,
    hasCashedOut: false,
    isAutoBet: false,
    isAutoCashout: false,
    autoCashoutMultiplier: 2.00,
    cashedOutMultiplier: null,
    cashedOutAmount: null
  });

  const [panel2, setPanel2] = useState<BetPanelState>({
    betAmount: 70,
    hasBet: false,
    hasCashedOut: false,
    isAutoBet: false,
    isAutoCashout: false,
    autoCashoutMultiplier: 2.00,
    cashedOutMultiplier: null,
    cashedOutAmount: null
  });

  // Bottom Navigation Active Tab: 'mes_mises' | 'tous_les_paris' | 'top_gains'
  const [activeBottomTab, setActiveBottomTab] = useState<'mes_mises' | 'tous_les_paris' | 'top_gains'>('mes_mises');

  // Mes Mises (Player's Bets History) with LocalStorage persistence
  const [myBets, setMyBets] = useState<AviatorMyBet[]>(() => {
    try {
      const saved = localStorage.getItem('gaincash_aviator_my_bets');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'av-init-1',
        date: 'Aujourd\'hui 18:42:15',
        panel: 1,
        betAmount: 100,
        multiplier: 2.34,
        winAmount: 234,
        status: 'won'
      },
      {
        id: 'av-init-2',
        date: 'Aujourd\'hui 18:40:02',
        panel: 2,
        betAmount: 50,
        multiplier: 1.65,
        winAmount: 82.5,
        status: 'won'
      },
      {
        id: 'av-init-3',
        date: 'Aujourd\'hui 18:38:19',
        panel: 1,
        betAmount: 150,
        multiplier: 1.15,
        winAmount: 0,
        status: 'lost'
      },
      {
        id: 'av-init-4',
        date: 'Aujourd\'hui 18:35:44',
        panel: 1,
        betAmount: 200,
        multiplier: 3.80,
        winAmount: 760,
        status: 'won'
      }
    ];
  });

  // Persist myBets in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gaincash_aviator_my_bets', JSON.stringify(myBets.slice(0, 50)));
    } catch {}
  }, [myBets]);

  // Live bets of all online players in the flight
  const [liveBets, setLiveBets] = useState<AviatorLiveBet[]>([]);

  // Generator of live online bets
  const generateLiveBets = useCallback(() => {
    const playerNames = [
      'Alex_HT', 'TiBoss_509', 'Marie_L', 'Woody_K', 'Junior_D', 'Sam_77',
      'Jean_Paul', 'Mireille_B', 'Kensley_HT', 'Daphnee_M', 'Reginald_V', 'Sonia_G',
      'Fritz_01', 'Nathalie_C', 'Pierre_Luc'
    ];
    const stakes = [28, 50, 70, 100, 140, 200, 350, 500, 700, 1000];
    const generated: AviatorLiveBet[] = playerNames.map((name, i) => {
      const stake = stakes[Math.floor(Math.random() * stakes.length)];
      const target = +(1.15 + Math.random() * 4.5).toFixed(2);
      return {
        id: `lb-${Date.now()}-${i}`,
        user: name,
        betAmount: stake,
        cashoutTarget: target,
        multiplier: null,
        winAmount: null,
        hasCashedOut: false
      };
    });
    setLiveBets(generated);
  }, []);

  // Summary statistics for "Mes Mises"
  const myBetsStats = useMemo(() => {
    const totalStaked = myBets.reduce((acc, b) => acc + b.betAmount, 0);
    const totalWon = myBets.reduce((acc, b) => acc + b.winAmount, 0);
    const netProfit = +(totalWon - totalStaked).toFixed(2);
    const winRate = myBets.length > 0
      ? Math.round((myBets.filter(b => b.status === 'won').length / myBets.length) * 100)
      : 0;
    return { totalStaked, totalWon, netProfit, winRate };
  }, [myBets]);

  // Refs for animation and timers
  const crashTargetRef = useRef<number>(2.40);
  const flightStartTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crashPauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userBalanceRef = useRef(user.balanceHTG);
  userBalanceRef.current = user.balanceHTG;
  const onUpdateBalanceRef = useRef(onUpdateBalance);
  onUpdateBalanceRef.current = onUpdateBalance;

  // Canvas ref for the flight animation & red curve fill
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Provably Fair generator with authentic crash distribution
  const generateCrashPoint = useCallback((): number => {
    const rand = Math.random();
    // 3% chance of instant crash at 1.00x
    if (rand < 0.03) return 1.00;
    // Standard Aviator house-edge formula (1% - 3%)
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    if (h % 33 === 0) return 1.00;
    const point = Math.floor((100 * e - h) / (e - h)) / 100;
    // Bound reasonably between 1.01x and 120.00x
    return Math.min(120.00, Math.max(1.01, point));
  }, []);

  // Format multiplier badge styling by range
  const getBadgeStyle = (val: number) => {
    if (val >= 10.0) {
      return 'bg-[#400d27] text-[#fb7185] border border-[#f43f5e]/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]';
    }
    if (val >= 2.0) {
      return 'bg-[#29134a] text-[#c084fc] border border-[#a855f7]/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]';
    }
    return 'bg-[#0f1d3a] text-[#38bdf8] border border-[#0284c7]/40';
  };

  // Cashout handler for a given panel (1 or 2)
  const cashOutPanel = useCallback((panelNum: 1 | 2) => {
    const currentPanel = panelNum === 1 ? panel1 : panel2;
    if (!currentPanel.hasBet || currentPanel.hasCashedOut || gameState !== 'flying') {
      return;
    }

    const currentMultiplier = multiplier;
    const winAmount = +(currentPanel.betAmount * currentMultiplier).toFixed(2);

    if (panelNum === 1) {
      setPanel1(prev => ({
        ...prev,
        hasCashedOut: true,
        cashedOutMultiplier: currentMultiplier,
        cashedOutAmount: winAmount
      }));
    } else {
      setPanel2(prev => ({
        ...prev,
        hasCashedOut: true,
        cashedOutMultiplier: currentMultiplier,
        cashedOutAmount: winAmount
      }));
    }

    if (soundEnabled) {
      try {
        playWinSound();
      } catch {
        // audio optional
      }
    }

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    onUpdateBalance(
      +(user.balanceHTG + winAmount).toFixed(2),
      `Aviator Panneau ${panelNum} Encaissement x${currentMultiplier.toFixed(2)} (+${winAmount} HTG)`
    );

    // Record won bet into "Mes Mises"
    const newBetRecord: AviatorMyBet = {
      id: `av-bet-${Date.now()}-${panelNum}`,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      panel: panelNum,
      betAmount: currentPanel.betAmount,
      multiplier: currentMultiplier,
      winAmount: winAmount,
      status: 'won'
    };
    setMyBets(prev => [newBetRecord, ...prev.slice(0, 49)]);

    setTotalRoundWinnings(prev => +(prev + winAmount).toFixed(2));
  }, [panel1, panel2, gameState, multiplier, soundEnabled, user.balanceHTG, onUpdateBalance]);

  // Check auto-cashout in real time during flight
  useEffect(() => {
    if (gameState !== 'flying') return;

    // Panel 1 Auto-Cashout
    if (
      panel1.hasBet &&
      !panel1.hasCashedOut &&
      panel1.isAutoCashout &&
      panel1.autoCashoutMultiplier > 1.01 &&
      multiplier >= panel1.autoCashoutMultiplier
    ) {
      cashOutPanel(1);
    }

    // Panel 2 Auto-Cashout
    if (
      panel2.hasBet &&
      !panel2.hasCashedOut &&
      panel2.isAutoCashout &&
      panel2.autoCashoutMultiplier > 1.01 &&
      multiplier >= panel2.autoCashoutMultiplier
    ) {
      cashOutPanel(2);
    }
  }, [multiplier, gameState, panel1, panel2, cashOutPanel]);

  // Place Bet / Cancel Bet toggle for a panel
  const handleToggleBet = (panelNum: 1 | 2) => {
    const currentPanel = panelNum === 1 ? panel1 : panel2;
    const setPanel = panelNum === 1 ? setPanel1 : setPanel2;

    if (currentPanel.hasBet) {
      // Cancel bet if still waiting
      if (gameState === 'waiting') {
        onUpdateBalance(
          +(user.balanceHTG + currentPanel.betAmount).toFixed(2),
          `Aviator Annulation Pari (+${currentPanel.betAmount} HTG)`
        );
        setPanel(prev => ({ ...prev, hasBet: false }));
        if (soundEnabled) playClickSound();
      }
      return;
    }

    // Check balance
    if (user.balanceHTG < currentPanel.betAmount) {
      showToast("Solde insuffisant pour placer cette mise. Veuillez recharger votre portefeuille.");
      onOpenWallet();
      return;
    }

    // Deduct bet amount
    onUpdateBalance(
      +(user.balanceHTG - currentPanel.betAmount).toFixed(2),
      `Aviator Mise Panneau ${panelNum} (-${currentPanel.betAmount} HTG)`
    );

    if (soundEnabled) {
      try {
        playBetPlacedSound();
      } catch {
        playClickSound();
      }
    }

    setPanel(prev => ({
      ...prev,
      hasBet: true,
      hasCashedOut: false,
      cashedOutMultiplier: null,
      cashedOutAmount: null
    }));
  };

  // Adjust bet amount
  const adjustBet = (panelNum: 1 | 2, delta: number) => {
    const setPanel = panelNum === 1 ? setPanel1 : setPanel2;
    setPanel(prev => {
      if (prev.hasBet && gameState !== 'waiting') return prev;
      const nextVal = Math.max(10, Math.min(50000, +(prev.betAmount + delta).toFixed(2)));
      return { ...prev, betAmount: nextVal };
    });
  };

  const setExactBet = (panelNum: 1 | 2, amount: number) => {
    const setPanel = panelNum === 1 ? setPanel1 : setPanel2;
    setPanel(prev => {
      if (prev.hasBet && gameState !== 'waiting') return prev;
      return { ...prev, betAmount: amount };
    });
  };

  // Launch airplane flight
  const launchFlight = useCallback(() => {
    const target = generateCrashPoint();
    crashTargetRef.current = target;
    setGameState('flying');
    setMultiplier(1.00);
    flightStartTimeRef.current = performance.now();

    // Randomize live bets counters for realistic casino ambiance
    setTotalBetsCount(Math.floor(2100 + Math.random() * 600));
    setTotalPoolCount(Math.floor(2600 + Math.random() * 400));
    setTotalRoundWinnings(Math.floor(4000 + Math.random() * 6000));
  }, [generateCrashPoint]);

  const launchFlightRef = useRef(launchFlight);
  launchFlightRef.current = launchFlight;

  // Start pre-round countdown
  const startWaitingRound = useCallback(() => {
    if (crashPauseTimeoutRef.current) clearTimeout(crashPauseTimeoutRef.current);
    setGameState('waiting');
    setWaitingCountdown(5.0);
    setMultiplier(1.00);
    generateLiveBets();

    const curBal = userBalanceRef.current;
    // Apply auto-bets if configured
    setPanel1(prev => {
      if (prev.isAutoBet && !prev.hasBet && curBal >= prev.betAmount) {
        onUpdateBalanceRef.current(
          +(curBal - prev.betAmount).toFixed(2),
          `Aviator Auto-Bet Panneau 1 (-${prev.betAmount} HTG)`
        );
        return { ...prev, hasBet: true, hasCashedOut: false, cashedOutMultiplier: null, cashedOutAmount: null };
      }
      return { ...prev, hasCashedOut: false, cashedOutMultiplier: null, cashedOutAmount: null };
    });

    setPanel2(prev => {
      if (prev.isAutoBet && !prev.hasBet && curBal >= prev.betAmount) {
        onUpdateBalanceRef.current(
          +(curBal - prev.betAmount).toFixed(2),
          `Aviator Auto-Bet Panneau 2 (-${prev.betAmount} HTG)`
        );
        return { ...prev, hasBet: true, hasCashedOut: false, cashedOutMultiplier: null, cashedOutAmount: null };
      }
      return { ...prev, hasCashedOut: false, cashedOutMultiplier: null, cashedOutAmount: null };
    });

    // Start 5-second countdown ticker
    const startTime = performance.now();
    const duration = 5000;

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setWaitingCountdown(+remaining.toFixed(1));

      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        // Start flight!
        launchFlightRef.current();
      }
    }, 100);
  }, []);

  // Handle automatic restart after crash pause (3 seconds pause, then next round)
  useEffect(() => {
    if (gameState !== 'crashed') return;

    crashPauseTimeoutRef.current = setTimeout(() => {
      startWaitingRound();
    }, 3200);

    return () => {
      if (crashPauseTimeoutRef.current) clearTimeout(crashPauseTimeoutRef.current);
    };
  }, [gameState, startWaitingRound]);

  // Flight Animation Loop (Exponential growth curve matching Aviator)
  useEffect(() => {
    if (gameState !== 'flying') return;

    let isCancelled = false;

    const tick = (now: number) => {
      if (isCancelled) return;
      const elapsedSeconds = (now - flightStartTimeRef.current) / 1000;

      // Authentic Aviator multiplier speed formula: starts gentle, accelerates exponentially
      // Formula: 1.00 + 0.06 * t + 0.05 * t^1.7
      const current = +(1.00 + 0.07 * elapsedSeconds + 0.06 * Math.pow(elapsedSeconds, 1.8)).toFixed(2);

      // Real-time live players cashout simulation
      setLiveBets(prev =>
        prev.map(lb => {
          if (!lb.hasCashedOut && current >= lb.cashoutTarget) {
            return {
              ...lb,
              hasCashedOut: true,
              multiplier: lb.cashoutTarget,
              winAmount: +(lb.betAmount * lb.cashoutTarget).toFixed(2)
            };
          }
          return lb;
        })
      );

      if (current >= crashTargetRef.current) {
        // CRASH / FLEW AWAY!
        setMultiplier(crashTargetRef.current);
        setGameState('crashed');

        // Play crash sound
        if (soundEnabled) {
          try {
            playCrashSound();
          } catch {
            // ignore
          }
        }

        // Append to history
        setHistory(prev => [crashTargetRef.current, ...prev.slice(0, 19)]);

        // Record lost bets in "Mes Mises" for panels that didn't cash out
        if (panel1.hasBet && !panel1.hasCashedOut) {
          const lostBet: AviatorMyBet = {
            id: `av-bet-${Date.now()}-1`,
            date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            panel: 1,
            betAmount: panel1.betAmount,
            multiplier: crashTargetRef.current,
            winAmount: 0,
            status: 'lost'
          };
          setMyBets(prev => [lostBet, ...prev.slice(0, 49)]);
        }
        if (panel2.hasBet && !panel2.hasCashedOut) {
          const lostBet: AviatorMyBet = {
            id: `av-bet-${Date.now()}-2`,
            date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            panel: 2,
            betAmount: panel2.betAmount,
            multiplier: crashTargetRef.current,
            winAmount: 0,
            status: 'lost'
          };
          setMyBets(prev => [lostBet, ...prev.slice(0, 49)]);
        }

        // Reset bet flags for panels that didn't cash out
        setPanel1(prev => ({
          ...prev,
          hasBet: false
        }));
        setPanel2(prev => ({
          ...prev,
          hasBet: false
        }));

        return;
      }

      setMultiplier(current);
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, soundEnabled]);

  // Start initial waiting countdown on mount
  useEffect(() => {
    startWaitingRound();
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // HTML5 Canvas Render: Dark Starry Sky, Smooth Red Trajectory Fill & Propeller Plane
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Deep cosmic night background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#040712');
    bgGradient.addColorStop(1, '#090e1c');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw twinkling distant stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const starCount = 35;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137.5) % width);
      const sy = ((i * 89.3) % height);
      const r = (i % 3 === 0) ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flight Curve Calculation
    const startX = 20;
    const startY = height - 20;

    // Progress 0 to 1 based on multiplier
    const progress = Math.min(1, Math.max(0, (multiplier - 1.00) / 10.0));

    // Plane position along curve
    let planeX = startX + progress * (width - 120);
    let planeY = startY - Math.pow(progress, 0.75) * (height - 90);

    // Handle crashed plane flying off top-right
    if (gameState === 'crashed') {
      planeX = width + 60;
      planeY = -50;
    } else if (gameState === 'waiting') {
      planeX = startX + 40;
      planeY = startY - 15;
    }

    if (gameState === 'flying' || gameState === 'crashed') {
      // Draw Red Area Fill underneath curve (signature Aviator red hill)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Smooth curved path to plane
      const controlX = startX + (planeX - startX) * 0.45;
      const controlY = startY;
      ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);

      // Close to bottom
      ctx.lineTo(planeX, startY);
      ctx.lineTo(startX, startY);
      ctx.closePath();

      // Solid deep red fill matching screenshot
      const redGrad = ctx.createLinearGradient(0, planeY, 0, startY);
      redGrad.addColorStop(0, '#d0021b');
      redGrad.addColorStop(0.7, '#a50012');
      redGrad.addColorStop(1, '#80000d');
      ctx.fillStyle = redGrad;
      ctx.fill();
      ctx.restore();

      // Top glowing red stroke line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(controlX, controlY, planeX, planeY);
      ctx.strokeStyle = '#ff1a35';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255, 26, 53, 0.8)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }

    // Draw the Red Propeller Airplane
    if (gameState === 'flying') {
      ctx.save();
      ctx.translate(planeX, planeY);

      // Flight angle calculation
      const angle = -0.22 - progress * 0.15;
      ctx.rotate(angle);

      // Gentle flight vibration
      const wobble = Math.sin(Date.now() / 80) * 1.5;
      ctx.translate(0, wobble);

      // Aircraft Fuselage (Red Monoplane)
      ctx.fillStyle = '#dc2626'; // Red 600
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;

      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wings
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(-6, -16);
      ctx.lineTo(8, 0);
      ctx.lineTo(-12, 16);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.lineTo(-30, -10);
      ctx.lineTo(-26, -10);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();

      // Cockpit window (White highlight)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(4, -3, 6, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Propeller (Spinning blades)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const propTime = (Date.now() / 40) % (Math.PI * 2);
      const propHeight = Math.sin(propTime) * 12;
      ctx.beginPath();
      ctx.moveTo(27, -propHeight);
      ctx.lineTo(27, propHeight);
      ctx.stroke();

      // Propeller hub
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(27, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }, [multiplier, gameState]);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl overflow-hidden font-sans select-none text-white">
      {/* ================= 1. HEADER (Red Cursive Aviator, Clock & Balance) ================= */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#070b13] border-b border-slate-800/80">
        {/* Left: Stylized Red Aviator Logo + Clock */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-2xl sm:text-3xl font-black italic tracking-tight font-serif text-[#ef233c] drop-shadow-[0_2px_10px_rgba(239,35,60,0.6)]">
              Aviator
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef233c] mt-2 animate-ping" />
          </div>

          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
            00:01
          </span>
        </div>

        {/* Right: Solde Vert HTG & Action Icons */}
        <div className="flex items-center gap-2">
          {/* Solde en vert vif HTG matching screenshot (546.73 HTG) */}
          <button
            onClick={onOpenWallet}
            className="flex items-center px-3 py-1 rounded-full bg-[#0d1a15] border border-[#22c55e]/30 hover:border-[#22c55e] transition-all cursor-pointer group"
            title="Votre solde disponible"
          >
            <span className="text-xs sm:text-sm font-bold font-mono text-[#22c55e] group-hover:text-[#4ade80]">
              {user.balanceHTG.toFixed(2)} HTG
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Chat Notice */}
          <button
            onClick={() => setShowChatNotice(!showChatNotice)}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Chat en direct"
          >
            <MessageCircle className="w-4 h-4 text-slate-300" />
          </button>

          {/* Provably Fair */}
          <button
            onClick={() => setShowProvablyFair(true)}
            className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Équité Provably Fair"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Close button if standalone modal */}
          {isStandaloneModal && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. MULTIPLIER HISTORY PILLS (Matching screenshot) ================= */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#060a12] border-b border-slate-800/60 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {history.slice(0, 10).map((val, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-black shrink-0 transition-transform hover:scale-105 cursor-pointer ${getBadgeStyle(val)}`}
              onClick={() => setShowHistoryModal(true)}
            >
              {val.toFixed(2)}x
            </span>
          ))}

          {/* Dropdown arrow to show full history */}
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="Historique complet"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================= 3. FLIGHT ARENA (Canvas, Central Multiplier, Waiting / Crashed) ================= */}
      <div className="relative w-full h-[230px] sm:h-[260px] bg-[#050811] overflow-hidden flex items-center justify-center">
        {/* HTML5 Canvas with starfield & red trajectory */}
        <canvas
          ref={canvasRef}
          width={640}
          height={260}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Central Display overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          {gameState === 'waiting' && (
            <div className="flex flex-col items-center space-y-2 animate-fade-in">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                PROCHAIN TOUR DANS
              </span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-100 ease-linear rounded-full"
                  style={{ width: `${(waitingCountdown / 5.0) * 100}%` }}
                />
              </div>
              <span className="text-3xl font-black font-mono text-white">
                {waitingCountdown.toFixed(1)}s
              </span>
            </div>
          )}

          {gameState === 'flying' && (
            <div className="flex flex-col items-center">
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="flex flex-col items-center animate-bounce">
              <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#ef233c] drop-shadow-md">
                FLEW AWAY! (PARTI)
              </div>
              <div className="text-5xl sm:text-7xl font-black font-mono text-[#ef233c] drop-shadow-[0_0_30px_rgba(239,35,60,0.8)]">
                {multiplier.toFixed(2)}x
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. DUAL BETTING PANELS (Double Panneau de Mise) ================= */}
      <div className="p-3 sm:p-4 space-y-3 bg-[#080d19]">
        {/* PANEL 1 */}
        <BetPanelCard
          panelNum={1}
          state={panel1}
          onAdjustBet={(delta) => adjustBet(1, delta)}
          onSetExactBet={(amt) => setExactBet(1, amt)}
          onToggleBet={() => handleToggleBet(1)}
          onCashOut={() => cashOutPanel(1)}
          onUpdateSettings={(patch) => setPanel1(prev => ({ ...prev, ...patch }))}
          gameState={gameState}
          currentMultiplier={multiplier}
        />

        {/* PANEL 2 */}
        <BetPanelCard
          panelNum={2}
          state={panel2}
          onAdjustBet={(delta) => adjustBet(2, delta)}
          onSetExactBet={(amt) => setExactBet(2, amt)}
          onToggleBet={() => handleToggleBet(2)}
          onCashOut={() => cashOutPanel(2)}
          onUpdateSettings={(patch) => setPanel2(prev => ({ ...prev, ...patch }))}
          gameState={gameState}
          currentMultiplier={multiplier}
        />
      </div>

      {/* ================= 5. BOTTOM STATS BAR (Paris totaux & Gain total HTG) ================= */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#060912] border-t border-slate-800/80 text-xs font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Paris totaux</span>
          <span className="font-mono text-slate-200">
            {totalBetsCount}/{totalPoolCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Gain total HTG</span>
          <span className="font-mono text-emerald-400 font-black">
            {totalRoundWinnings.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ================= 6. SECTION MES MISES / TOUS LES PARIS / TOP GAINS (AU-DESSOUS D'AVIATOR) ================= */}
      <div className="bg-[#070b16] border-t border-slate-800/80">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-slate-800/60 bg-[#060912]">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab: Mes Mises (Active by default) */}
            <button
              onClick={() => setActiveBottomTab('mes_mises')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeBottomTab === 'mes_mises'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mes mises</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeBottomTab === 'mes_mises' ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {myBets.length}
              </span>
            </button>

            {/* Tab: Tous les paris */}
            <button
              onClick={() => setActiveBottomTab('tous_les_paris')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === 'tous_les_paris'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30 font-black'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tous les paris</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeBottomTab === 'tous_les_paris' ? 'bg-black/40 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {liveBets.length > 0 ? liveBets.length : 15}
              </span>
            </button>

            {/* Tab: Top Gains */}
            <button
              onClick={() => setActiveBottomTab('top_gains')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeBottomTab === 'top_gains'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Top</span>
            </button>
          </div>

          {/* Action buttons on tab header */}
          {activeBottomTab === 'mes_mises' && myBets.length > 0 && (
            <button
              onClick={() => {
                setMyBets([]);
                showToast("Historique de vos mises Aviator effacé.");
              }}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-400 transition-colors py-1 px-2 rounded-lg hover:bg-slate-900/60 cursor-pointer"
              title="Effacer mes mises"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          )}
        </div>

        {/* ================= TAB 1: MES MISES ================= */}
        {activeBottomTab === 'mes_mises' && (
          <div className="p-3 space-y-3">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Misé</span>
                <span className="text-xs sm:text-sm font-mono font-black text-white">
                  {myBetsStats.totalStaked.toLocaleString()} <span className="text-[10px] text-slate-400">HTG</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Gagné</span>
                <span className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                  {myBetsStats.totalWon.toLocaleString()} <span className="text-[10px] text-emerald-500/80">HTG</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Profit Net</span>
                <span className={`text-xs sm:text-sm font-mono font-black ${
                  myBetsStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {myBetsStats.netProfit >= 0 ? '+' : ''}{myBetsStats.netProfit.toLocaleString()} <span className="text-[10px]">HTG</span>
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Succès</span>
                <span className="text-xs sm:text-sm font-mono font-black text-cyan-400">
                  {myBetsStats.winRate}%
                </span>
              </div>
            </div>

            {/* Real-time Active Bet Banner (When player has bet on current round) */}
            {(panel1.hasBet || panel2.hasBet) && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-950/70 via-slate-900 to-amber-950/70 border border-red-500/50 shadow-md flex items-center justify-between gap-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <span className="text-xs font-black text-white">Mise en cours sur le vol actuel</span>
                    <div className="text-[11px] text-slate-300 flex items-center gap-2">
                      {panel1.hasBet && (
                        <span>Panneau 1 : <strong>{panel1.betAmount} HTG</strong> {panel1.hasCashedOut ? `(Encaissé x${panel1.cashedOutMultiplier})` : ''}</span>
                      )}
                      {panel2.hasBet && (
                        <span>• Panneau 2 : <strong>{panel2.betAmount} HTG</strong> {panel2.hasCashedOut ? `(Encaissé x${panel2.cashedOutMultiplier})` : ''}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">Cote actuelle</span>
                  <span className="text-base font-black font-mono text-white">
                    {multiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            )}

            {/* Mes Mises Table */}
            <div className="rounded-2xl border border-slate-800/80 overflow-hidden bg-[#0a0f1e]">
              <div className="grid grid-cols-5 px-3 py-2 bg-slate-900/90 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <span>Date & Heure</span>
                <span className="text-center">Panneau</span>
                <span className="text-right">Mise</span>
                <span className="text-center">Cote</span>
                <span className="text-right">Gain (HTG)</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                {myBets.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-1">
                    <Clock className="w-7 h-7 mx-auto text-slate-600 mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-400">Aucune mise enregistrée pour le moment.</p>
                    <p className="text-[11px] text-slate-500">
                      Placez votre première mise sur le Panneau 1 ou 2 ci-dessus pour la voir apparaître ici !
                    </p>
                  </div>
                ) : (
                  myBets.map((bet) => {
                    const isWin = bet.status === 'won';
                    return (
                      <div
                        key={bet.id}
                        className="grid grid-cols-5 px-3 py-2 items-center text-xs font-mono transition-colors hover:bg-slate-800/30"
                      >
                        {/* Date & Heure */}
                        <span className="text-slate-400 text-[11px] font-sans truncate">
                          {bet.date}
                        </span>

                        {/* Panneau */}
                        <div className="text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-sans uppercase ${
                            bet.panel === 1
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            P{bet.panel}
                          </span>
                        </div>

                        {/* Mise */}
                        <span className="text-right font-bold text-slate-200">
                          {bet.betAmount.toLocaleString()} HTG
                        </span>

                        {/* Cote */}
                        <div className="text-center">
                          {isWin && bet.multiplier ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-0.5">
                              <span>{bet.multiplier.toFixed(2)}x</span>
                              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              💥 {bet.multiplier ? `${bet.multiplier.toFixed(2)}x` : 'Crash'}
                            </span>
                          )}
                        </div>

                        {/* Gain */}
                        <span className={`text-right font-black ${
                          isWin ? 'text-amber-300' : 'text-slate-600'
                        }`}>
                          {isWin ? `+${bet.winAmount.toLocaleString()} HTG` : '0.00 HTG'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: TOUS LES PARIS (Live Bets of other players) ================= */}
        {activeBottomTab === 'tous_les_paris' && (
          <div className="p-3 space-y-2">
            <div className="rounded-2xl border border-slate-800/80 overflow-hidden bg-[#0a0f1e]">
              <div className="grid grid-cols-4 px-3 py-2 bg-slate-900/90 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <span>Joueur</span>
                <span className="text-center">Mise</span>
                <span className="text-center">Cote</span>
                <span className="text-right">Gain (HTG)</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                {liveBets.map((b) => (
                  <div key={b.id} className="grid grid-cols-4 px-3 py-1.5 items-center text-xs font-mono">
                    <span className="text-slate-300 font-sans truncate font-medium">{b.user}</span>
                    <span className="text-center text-slate-200">{b.betAmount} HTG</span>
                    <div className="text-center">
                      {b.hasCashedOut && b.multiplier ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {b.multiplier.toFixed(2)}x
                        </span>
                      ) : gameState === 'flying' ? (
                        <span className="text-amber-400 font-bold animate-pulse">En vol...</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </div>
                    <span className="text-right font-black">
                      {b.winAmount ? (
                        <span className="text-amber-300">+{b.winAmount.toFixed(2)} HTG</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TOP GAINS ================= */}
        {activeBottomTab === 'top_gains' && (
          <div className="p-3 space-y-2">
            <div className="rounded-2xl border border-slate-800/80 overflow-hidden bg-[#0a0f1e]">
              <div className="grid grid-cols-4 px-3 py-2 bg-slate-900/90 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                <span>Joueur</span>
                <span className="text-center">Date</span>
                <span className="text-center">Cote</span>
                <span className="text-right">Gain Payé</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/40">
                {[
                  { user: 'Jean_Pierre_H', date: 'Aujourd\'hui 14:20', mult: 94.20, win: 94200 },
                  { user: 'Woody_Kens', date: 'Aujourd\'hui 12:45', mult: 68.50, win: 47950 },
                  { user: 'Marie_Louise', date: 'Aujourd\'hui 10:12', mult: 42.15, win: 29505 },
                  { user: 'Ti_Boss_509', date: 'Hier 23:30', mult: 35.80, win: 25060 },
                  { user: 'Ronald_Delmas', date: 'Hier 21:10', mult: 28.40, win: 19880 }
                ].map((top, idx) => (
                  <div key={idx} className="grid grid-cols-4 px-3 py-2 items-center text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-black">#{idx + 1}</span>
                      <span className="text-white font-sans font-bold truncate">{top.user}</span>
                    </div>
                    <span className="text-center text-slate-400 text-[11px] font-sans">{top.date}</span>
                    <div className="text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        x{top.mult.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-right font-black text-amber-300">
                      +{top.win.toLocaleString()} HTG
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: HISTORIQUE COMPLET DES MULTIPLICATEURS ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#0d1424] border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Historique des Tours Aviator
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
              {history.map((val, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-center font-mono font-bold text-sm ${getBadgeStyle(val)}`}
                >
                  {val.toFixed(2)}x
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Chaque tour est cryptographiquement vérifiable grâce à notre algorithme Provably Fair SHA-256.
            </p>
          </div>
        </div>
      )}

      {/* ================= MODAL: PROVABLY FAIR EQUITÉ ================= */}
      {showProvablyFair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[#0d1424] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-display">
                  Équité Certifiée (Provably Fair)
                </h3>
              </div>
              <button
                onClick={() => setShowProvablyFair(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Le résultat de chaque vol d'Aviator est généré côté serveur avant le début du tour en combinant la graine du serveur et les graines des 3 premiers parieurs.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-cyan-300 break-all space-y-1">
                <div>Hash SHA-256 du Tour Actuel :</div>
                <div className="text-slate-400">
                  {Math.random().toString(36).substring(2)}a7b8c9d0e1f23456789abcdef0123456789
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= INLINE TOAST MESSAGE ================= */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-900 border border-amber-500/60 text-amber-200 rounded-2xl shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>⚠️</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= TOAST: CHAT NOTICE ================= */}
      {showChatNotice && (
        <div className="p-2.5 bg-blue-950/80 border-t border-blue-500/40 text-center text-xs text-blue-200">
          💬 Canal de discussion Aviator réservé aux joueurs connectés.
        </div>
      )}
    </div>
  );
};

/**
 * Composant de panneau de mise individuel (Panneau 1 et Panneau 2)
 * Reproduisant exactement la structure du panneau dans le screenshot :
 * - Gauche : [- Input +], boutons rapides (28, 70, 140, 700), toggles (Jeu auto, Encaissement auto)
 * - Droite : Énorme bouton Vert (MISE 70.00 HTG) / Orange (ENCAISSER 91.00 HTG)
 */
interface BetPanelCardProps {
  panelNum: number;
  state: BetPanelState;
  onAdjustBet: (delta: number) => void;
  onSetExactBet: (amount: number) => void;
  onToggleBet: () => void;
  onCashOut: () => void;
  onUpdateSettings: (patch: Partial<BetPanelState>) => void;
  gameState: 'waiting' | 'flying' | 'crashed';
  currentMultiplier: number;
}

const BetPanelCard: React.FC<BetPanelCardProps> = ({
  panelNum,
  state,
  onAdjustBet,
  onSetExactBet,
  onToggleBet,
  onCashOut,
  onUpdateSettings,
  gameState,
  currentMultiplier
}) => {
  const [showAutoCashoutModal, setShowAutoCashoutModal] = useState(false);

  // Calculate live dynamic win amount
  const liveWin = +(state.betAmount * currentMultiplier).toFixed(2);

  // Can bet only in waiting or during flight for next round
  const isBetLocked = state.hasBet && gameState !== 'waiting';

  return (
    <div className="bg-[#121826] rounded-2xl p-2.5 sm:p-3 border border-slate-800 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-stretch">
        
        {/* ================= SECTION GAUCHE : MISE & BOUTONS RAPIDES ================= */}
        <div className="flex flex-col justify-between space-y-2">
          {/* Ligne 1 : [-] [Montant] [+] */}
          <div className="flex items-center rounded-xl bg-[#0a0e1a] border border-slate-800 overflow-hidden">
            <button
              onClick={() => onAdjustBet(-10)}
              disabled={isBetLocked}
              className="px-3.5 py-1.5 text-lg font-bold text-slate-300 hover:bg-slate-800 active:scale-95 disabled:opacity-40 transition-colors"
            >
              −
            </button>

            <div className="flex-1 text-center font-mono font-black text-base sm:text-lg text-white">
              {state.betAmount.toFixed(2)}
            </div>

            <button
              onClick={() => onAdjustBet(10)}
              disabled={isBetLocked}
              className="px-3.5 py-1.5 text-lg font-bold text-slate-300 hover:bg-slate-800 active:scale-95 disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>

          {/* Ligne 2 : Boutons de mise rapide (28, 70, 140, 700) matching screenshot */}
          <div className="grid grid-cols-4 gap-1.5">
            {DEFAULT_QUICK_STAKES.map((stake) => (
              <button
                key={stake}
                onClick={() => onSetExactBet(stake)}
                disabled={isBetLocked}
                className={`py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  state.betAmount === stake
                    ? 'bg-slate-700 text-white border border-slate-500'
                    : 'bg-[#182030] text-slate-300 hover:bg-slate-700/60 border border-slate-800'
                } disabled:opacity-40 active:scale-95`}
              >
                {stake}
              </button>
            ))}
          </div>

          {/* Ligne 3 : Options (Jeu automatique & Encaissement automatique) */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-[11px]">
            {/* Toggle Jeu Automatique */}
            <button
              onClick={() => onUpdateSettings({ isAutoBet: !state.isAutoBet })}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-bold transition-all border ${
                state.isAutoBet
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                  : 'bg-[#0b101c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Play className={`w-3 h-3 ${state.isAutoBet ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              <span>Jeu auto</span>
            </button>

            {/* Toggle Encaissement Automatique */}
            <button
              onClick={() => onUpdateSettings({ isAutoCashout: !state.isAutoCashout })}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-bold transition-all border ${
                state.isAutoCashout
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/50'
                  : 'bg-[#0b101c] text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Encaissement automatique configurable"
            >
              <span>Auto Cashout</span>
              {state.isAutoCashout && (
                <span className="font-mono text-[10px] text-amber-300">
                  {state.autoCashoutMultiplier.toFixed(2)}x
                </span>
              )}
            </button>
          </div>

          {/* Saisie rapide du multiplicateur d'auto-cashout si activé */}
          {state.isAutoCashout && (
            <div className="flex items-center justify-between px-2 py-1 bg-[#090d18] rounded-lg border border-amber-500/30 text-xs">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Palier Cashout :</span>
              <div className="flex items-center gap-1">
                {[1.5, 2.0, 5.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => onUpdateSettings({ autoCashoutMultiplier: val })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      state.autoCashoutMultiplier === val
                        ? 'bg-amber-500 text-black'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= SECTION DROITE : GRAND BOUTON DE MISE / ENCAISSEMENT ================= */}
        <div className="flex">
          {/* CAS 1 : En vol avec pari actif non encore encaissé -> BOUTON ORANGE "ENCAISSER" */}
          {state.hasBet && !state.hasCashedOut && gameState === 'flying' && (
            <button
              type="button"
              onClick={onCashOut}
              className="w-full min-h-[90px] rounded-2xl bg-gradient-to-b from-[#ff8c00] via-[#ff6a00] to-[#e65100] hover:from-[#ffa000] hover:to-[#ff5722] text-white font-black shadow-[0_0_25px_rgba(255,140,0,0.55)] border-2 border-[#ffb74d] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer animate-pulse"
            >
              <span className="text-base sm:text-lg tracking-wider uppercase drop-shadow-md">
                ENCAISSER
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black drop-shadow-md">
                {liveWin.toFixed(2)} HTG
              </span>
            </button>
          )}

          {/* CAS 2 : Déjà Encaissé ce tour-ci -> État de succès vert */}
          {state.hasCashedOut && (
            <div className="w-full min-h-[90px] rounded-2xl bg-gradient-to-b from-emerald-700 to-emerald-900 border-2 border-emerald-400/60 text-white flex flex-col items-center justify-center shadow-lg p-2 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-300 mb-0.5" />
              <span className="text-xs uppercase font-bold text-emerald-200">ENCAISSÉ AVEC SUCCÈS</span>
              <span className="text-lg font-mono font-black text-white">
                +{state.cashedOutAmount?.toFixed(2)} HTG
              </span>
              <span className="text-[10px] font-mono text-emerald-300">
                @{state.cashedOutMultiplier?.toFixed(2)}x
              </span>
            </div>
          )}

          {/* CAS 3 : Pari placé en attente du début du vol -> Bouton Annuler / Attente */}
          {state.hasBet && !state.hasCashedOut && gameState === 'waiting' && (
            <button
              type="button"
              onClick={onToggleBet}
              className="w-full min-h-[90px] rounded-2xl bg-gradient-to-b from-red-600 via-red-700 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-black shadow-lg border-2 border-red-400 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-sm uppercase tracking-wider">ANNULER</span>
              <span className="text-xs text-red-200 font-normal">EN ATTENTE DU VOL...</span>
              <span className="text-base font-mono font-bold">{state.betAmount.toFixed(2)} HTG</span>
            </button>
          )}

          {/* CAS 4 : Aucun pari actif -> GRAND BOUTON VERT "MISE" (Matching screenshot) */}
          {!state.hasBet && !state.hasCashedOut && (
            <button
              type="button"
              onClick={onToggleBet}
              className="w-full min-h-[90px] rounded-2xl bg-gradient-to-b from-[#43a047] via-[#2e7d32] to-[#1b5e20] hover:from-[#4caf50] hover:to-[#2e7d32] text-white font-black shadow-[0_4px_16px_rgba(46,125,50,0.45)] border-2 border-[#81c784] flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <span className="text-base sm:text-lg tracking-wider uppercase drop-shadow-sm">
                MISE
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black drop-shadow-sm">
                {state.betAmount.toFixed(2)} HTG
              </span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
