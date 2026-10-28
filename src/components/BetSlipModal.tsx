import React, { useState } from 'react';
import {
  X,
  Trash2,
  Ticket,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Printer,
  Sparkles,
  Lock,
  PlusCircle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BetSlipItem, PlacedBet, UserProfile } from '../types';
import { serverPlaceSportBet, serverCashoutSportBet } from '../utils/api';
import { playClickSound, playBetPlacedSound, playWinSound } from '../utils/audio';
import { TicketPrintModal, PrintableTicketData } from './TicketPrintModal';

interface BetSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBets: BetSlipItem[];
  onRemoveBet: (index: number) => void;
  onClearAll: () => void;
  user: UserProfile;
  placedBets: PlacedBet[];
  onPlaceBet: (newBet: PlacedBet) => void;
  onCashOut: (betId: string, cashOutAmount: number) => void;
  onOpenWallet: () => void;
  isLimitBlocked?: boolean;
  completingBet?: PlacedBet | null;
  onStartCompleteBet?: (betId: string) => void;
  onCancelCompleteBet?: () => void;
  onConfirmCompleteBet?: (betId: string, additionalItems: BetSlipItem[]) => void;
}

// Détection des FunBets (pure helper outside component)
export const isItemFunBet = (item: BetSlipItem): boolean => {
  return Boolean(
    item.isFunBet ||
    item.matchId?.startsWith('fb-') ||
    item.league?.includes('HOT 🎲') ||
    item.league?.includes('SPECIAL 🔥') ||
    item.league?.includes('COMBO 🎯') ||
    item.league?.includes('MEGA ODD ⚡') ||
    item.marketName?.includes('Chans') ||
    item.marketName?.includes('Super Ranplasan') ||
    item.marketName?.includes('Fou Lanmou') ||
    item.marketName?.includes('FunBet') ||
    item.matchTitle?.includes('FunBet')
  );
};

export const BetSlipModal: React.FC<BetSlipModalProps> = ({
  isOpen,
  onClose,
  selectedBets,
  onRemoveBet,
  onClearAll,
  user,
  placedBets,
  onPlaceBet,
  onCashOut,
  onOpenWallet,
  isLimitBlocked = false,
  completingBet,
  onStartCompleteBet,
  onCancelCompleteBet,
  onConfirmCompleteBet
}) => {
  const [activeTab, setActiveTab] = useState<'slip' | 'myBets'>('slip');
  const [betType, setBetType] = useState<'simple' | 'combine' | 'bet_builder' | 'system'>('combine');
  const [currencyMode, setCurrencyMode] = useState<'EUR' | 'HTG'>('HTG');
  const [stake, setStake] = useState<number>(10.00);
  const [printTicketData, setPrintTicketData] = useState<PrintableTicketData | null>(null);

  // Group selections by matchId to check compatibility (avoid same-match conflict in classic accumulator)
  const matchGroups = React.useMemo(() => {
    const groups: Record<string, BetSlipItem[]> = {};
    selectedBets.forEach(item => {
      if (!groups[item.matchId]) {
        groups[item.matchId] = [];
      }
      groups[item.matchId].push(item);
    });
    return groups;
  }, [selectedBets]);

  const hasSameMatchConflict = React.useMemo(() => {
    return Object.values(matchGroups).some(items => items.length > 1);
  }, [matchGroups]);

  const conflictedMatchTitles = React.useMemo(() => {
    return Object.values(matchGroups)
      .filter(items => items.length > 1)
      .map(items => items[0].matchTitle);
  }, [matchGroups]);

  // Odds calculation depending on betType
  const totalRate = (() => {
    if (selectedBets.length === 0) return 1.0;
    if (betType === 'simple') {
      const avg = selectedBets.reduce((a, b) => a + b.rate, 0) / selectedBets.length;
      return Number(avg.toFixed(2));
    }
    if (betType === 'bet_builder') {
      // Bet builder applies correlated compounding factor for selections on same match
      const raw = selectedBets.reduce((acc, curr) => acc * curr.rate, 1);
      const adjusted = raw * (hasSameMatchConflict ? 0.90 : 1.0);
      return Math.min(Number(adjusted.toFixed(2)), 50000.0);
    }
    if (betType === 'system') {
      // System bet risk discount
      const raw = selectedBets.reduce((acc, curr) => acc * curr.rate, 1);
      return Math.min(Number((raw * 0.75).toFixed(2)), 50000.0);
    }
    // Classic accumulator
    const rawOdds = selectedBets.reduce((acc, curr) => acc * curr.rate, 1);
    return Math.min(Number(rawOdds.toFixed(2)), 50000.0);
  })();
  
  // 5% bonus calculation for combined bets as requested in SportsBet Pro
  const bonusPercentage = betType === 'combine' && selectedBets.length > 1 && !hasSameMatchConflict ? 5 : 0;
  const baseWin = Number((stake * totalRate).toFixed(2));
  const bonusAmount = Number((baseWin * (bonusPercentage / 100)).toFixed(2));
  const potentialPayout = baseWin + bonusAmount;
  const potentialNetProfit = Math.max(0, Number((potentialPayout - stake).toFixed(2)));
  const currencySymbol = currencyMode === 'EUR' ? '€' : 'HTG';

  // Plafond maximum officiel : 1,500,000 HTG
  const MAX_SPORTS_PAYOUT_HTG = 1500000;
  const maxPayoutAllowed = currencyMode === 'EUR' ? MAX_SPORTS_PAYOUT_HTG / 150 : MAX_SPORTS_PAYOUT_HTG;
  const isPayoutExceeded = potentialPayout > maxPayoutAllowed;
  const overPayoutAmount = isPayoutExceeded ? Number((potentialPayout - maxPayoutAllowed).toFixed(2)) : 0;

  // Détection des FunBets
  const hasAnyFunBet = React.useMemo(() => {
    return selectedBets.some(isItemFunBet);
  }, [selectedBets]);

  // Règle formelle : Funbets pa dwe ka konbine ! (Simple uniquement)
  const hasFunBetConflict = React.useMemo(() => {
    return hasAnyFunBet && (selectedBets.length > 1 || betType !== 'simple');
  }, [hasAnyFunBet, selectedBets.length, betType]);

  // Mise maximale calculée pour respecter le plafond de 1,500,000 HTG
  const effectiveMultiplier = totalRate * (1 + bonusPercentage / 100);
  const maxAllowedStake = React.useMemo(() => {
    if (effectiveMultiplier <= 0) return 10;
    const calculated = Math.floor(maxPayoutAllowed / effectiveMultiplier);
    return Math.max(currencyMode === 'HTG' ? 10 : 1, calculated);
  }, [effectiveMultiplier, maxPayoutAllowed, currencyMode]);

  // Si un FunBet est seul dans le coupon, basculer automatiquement en pari simple
  React.useEffect(() => {
    if (hasAnyFunBet && betType !== 'simple') {
      setBetType('simple');
    }
  }, [hasAnyFunBet, betType]);

  // Switch to slip tab if completingBet is activated
  React.useEffect(() => {
    if (completingBet) {
      setActiveTab('slip');
    }
  }, [completingBet]);

  // Selections limit logic (Max 35)
  const MAX_SELECTIONS = 35;
  const currentTotalSelections = (completingBet ? completingBet.items.length : 0) + selectedBets.length;
  const isSelectionsExceeded = currentTotalSelections > MAX_SELECTIONS;

  // Completing Bet Odds and Payout Calculations
  const completingAdditionalOdds = React.useMemo(() => {
    if (!completingBet || selectedBets.length === 0) return 1.0;
    return selectedBets.reduce((acc, curr) => acc * curr.rate, 1);
  }, [completingBet, selectedBets]);

  const completingTotalOdds = React.useMemo(() => {
    if (!completingBet) return 1.0;
    return Math.min(Number((completingBet.totalRate * completingAdditionalOdds).toFixed(2)), 50000.0);
  }, [completingBet, completingAdditionalOdds]);

  const rawCompletingPayout = React.useMemo(() => {
    if (!completingBet) return 0;
    return Math.round(completingBet.stake * (completingBet.totalRate * completingAdditionalOdds));
  }, [completingBet, completingAdditionalOdds]);

  const completingPotentialPayout = React.useMemo(() => {
    return Math.min(rawCompletingPayout, 1500000.0);
  }, [rawCompletingPayout]);

  const isCompletingPayoutExceeded = rawCompletingPayout > 1500000;
  const completingOverPayoutAmount = isCompletingPayoutExceeded ? (rawCompletingPayout - 1500000) : 0;

  const handleConfirmCompleteBetAction = () => {
    if (!completingBet) return;
    if (selectedBets.length === 0) {
      alert("Tanpri chwazi omwen yon nouvo seleksyon pou ajoute sou fich la.");
      return;
    }
    if (currentTotalSelections > MAX_SELECTIONS) {
      alert(`⚠️ Maximum seleksyon yon kliyan ka chwazi se 35. Fich sa a deja gen ${completingBet.items.length} seleksyon, ou pa ka depase 35 (total kalkile : ${currentTotalSelections}).`);
      return;
    }
    if (hasAnyFunBet) {
      alert("⚠️ Règle FunBets : Funbets pa dwe ka konbine ! Ou pa ka ajoute yon FunBet sou yon fich ki deja fèt.");
      return;
    }
    if (isCompletingPayoutExceeded) {
      alert(`⚠️ Plafon Maksimòm Depase : Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG. Fich la t ap rapòte ${rawCompletingPayout.toLocaleString()} HTG (+${completingOverPayoutAmount.toLocaleString()} HTG depasman). Tanpri retire kèk seleksyon anvan ou valide.`);
      return;
    }

    if (onConfirmCompleteBet) {
      onConfirmCompleteBet(completingBet.id, selectedBets);
    }
  };

  const userBalanceInMode = currencyMode === 'EUR'
    ? (user.balanceHTG ? user.balanceHTG / 150 : 150.00)
    : user.balanceHTG;

  const canAfford = userBalanceInMode >= stake;

  const handleConfirmBet = async () => {
    // Si on est en mode "Compléter une fiche existante"
    if (completingBet) {
      handleConfirmCompleteBetAction();
      return;
    }

    if (selectedBets.length === 0) return;
    if (selectedBets.length > MAX_SELECTIONS) {
      alert(`⚠️ Limit Seleksyon Atteint : Maximum seleksyon yon kliyan ka chwazi se 35. Fich sa a gen ${selectedBets.length} seleksyon kounye a.`);
      return;
    }
    if (stake <= 0) return;

    const minRequired = currencyMode === 'HTG' ? 10 : 1;
    if (stake < minRequired) {
      alert(`⚠️ Miz minimòm lan se ${minRequired} ${currencySymbol}. Minimum kòb yon kliyan ka mete anba yon fich sports se 10 HTG.`);
      return;
    }

    // 1. Contrôle strict du Plafond de Gains (Max 1,500,000 HTG)
    if (isPayoutExceeded) {
      alert(
        `⚠️ Plafon Maksimòm Depase : Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG.\n\nFich sa a ta rapòte ${potentialPayout.toLocaleString()} ${currencySymbol} (depasman de +${overPayoutAmount.toLocaleString()} ${currencySymbol}).\nFich la pa ka valide toutotan li depase montan sa.\n\nTanpri diminye miz lan (maksimòm rekòmande : ${maxAllowedStake.toLocaleString()} ${currencySymbol}) oswa modifye seleksyon yo anvan ou valide.`
      );
      return;
    }

    // 2. Contrôle strict de la règle FunBets (Ne peuvent pas être combinés)
    if (hasFunBetConflict) {
      alert(
        `⚠️ Règle FunBets : Funbets pa dwe ka konbine !\nYon FunBet dwe jwe an Pari Senp (Simple) poukont li san melanje ak lòt match oswa lòt paryaj.\n\nTanpri retire lòt seleksyon yo anvan ou valide fich sa a.`
      );
      return;
    }

    if (isLimitBlocked) {
      alert("Alerte SportsBet Pro : Limite de 15 transactions par 24h atteinte. Veuillez patienter avant de valider un nouveau pari.");
      return;
    }

    // Strict Compatibility Rule Enforcement:
    if (betType === 'combine' && hasSameMatchConflict) {
      alert(
        `⚠️ Règle de compatibilité (Conflit de match) : Il est strictement interdit de combiner plusieurs sélections du même match (${conflictedMatchTitles.join(
          ', '
        )}) dans un combiné classique car les issues sont interdépendantes.\n\nVeuillez choisir l'option '⚡ Bet Builder' ou 'Simple'.`
      );
      return;
    }

    if (!canAfford) {
      alert("Solde insuffisant. Veuillez recharger votre portefeuille.");
      return;
    }

    playBetPlacedSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `SP-${p1}-${p2}`;

    const newBet: PlacedBet = {
      id: ticketCode,
      type: selectedBets.length === 1 ? 'simple' : betType,
      items: [...selectedBets],
      stake,
      totalRate,
      potentialWin: potentialPayout,
      placedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      cashOutValue: Math.round(stake * 0.85) // Initial cash out offer
    };

    try {
      // Validation & sanitization côté serveur
      serverPlaceSportBet({
        type: selectedBets.length === 1 ? 'single' : betType === 'bet_builder' ? 'accumulator' : 'accumulator',
        stake,
        selections: selectedBets.map(b => ({
          matchId: b.matchId,
          matchName: b.matchTitle,
          marketName: b.marketName,
          selectionName: b.selectionName,
          odds: b.rate
        })),
        totalOdds: totalRate,
        potentialWin: potentialPayout
      }).catch(err => console.warn('[Server Bet Sync]', err));
    } catch (e) {
      console.warn(e);
    }

    onPlaceBet(newBet);
    onClearAll();
    setActiveTab('myBets');

    const categoryTitle =
      newBet.type === 'bet_builder'
        ? 'Paris sportifs combinés'
        : newBet.type === 'system'
        ? 'Paris sportifs combinés'
        : newBet.type === 'combine'
        ? 'Paris sportifs combinés'
        : 'Paris sports';

    setPrintTicketData({
      ticketCode: newBet.id,
      date: new Date().toLocaleString('fr-FR'),
      userId: user.id || 'usr-80491',
      gameType: categoryTitle,
      odds: newBet.totalRate,
      betAmount: newBet.stake,
      potentialPayout: newBet.potentialWin,
      status: 'PENDING',
      matches: newBet.items.map(item => ({
        match: item.matchTitle,
        selection: `${item.marketName} : ${item.selectionName}`,
        odds: item.rate,
        match_time: item.league
      })),
      details: newBet.items.map((i, idx) => `${idx + 1}. ${i.matchTitle}: ${i.selectionName} (@${i.rate.toFixed(2)})`).join(' | ')
    });
  };

  const handleCashOutClick = async (bet: PlacedBet) => {
    if (!bet.cashOutValue) return;
    playWinSound();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });
    try {
      serverCashoutSportBet(bet.id).catch(err => console.warn('[Server Cashout Sync]', err));
    } catch (e) {
      console.warn(e);
    }
    onCashOut(bet.id, bet.cashOutValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog with Safe Area Padding */}
      <div className="relative w-full max-w-lg bg-[#0c1322] text-slate-100 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-800 safe-bottom">
        
        {/* Header */}
        <div className="p-4 bg-[#0F172A] flex items-center justify-between border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#10B981]" />
            <h3 className="font-black text-base text-white tracking-tight">
              {completingBet ? `Konplete Fich #${completingBet.id}` : 'SportsBet Pro • Coupon'}
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#10B981] text-[#0F172A] font-mono">
              {completingBet ? `${currentTotalSelections}/35` : `${selectedBets.length}/35`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Mode Switcher */}
            <div className="flex items-center bg-[#1E293B] rounded-lg p-0.5 border border-[#334155]">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrencyMode('HTG');
                  setStake(10.00);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  currencyMode === 'HTG' ? 'bg-[#10B981] text-[#0F172A]' : 'text-slate-400 hover:text-white'
                }`}
              >
                HTG
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setCurrencyMode('EUR');
                  setStake(1.00);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  currencyMode === 'EUR' ? 'bg-[#10B981] text-[#0F172A]' : 'text-slate-400 hover:text-white'
                }`}
              >
                EUR (€)
              </button>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1 rounded-lg bg-[#1E293B] text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch: New Slip vs Placed Bets */}
        <div className="grid grid-cols-2 bg-[#0F172A] p-1.5 border-b border-[#1E293B]">
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('slip');
            }}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'slip'
                ? 'bg-[#10B981] text-[#0F172A] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {completingBet ? `Konplete Fich (${currentTotalSelections}/35)` : `Nouveau Pari (${selectedBets.length}/35)`}
          </button>
          <button
            onClick={() => {
              playClickSound();
              setActiveTab('myBets');
            }}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === 'myBets'
                ? 'bg-[#10B981] text-[#0F172A] shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes Paris en Cours ({placedBets.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0F172A]">
          {activeTab === 'slip' ? (
            completingBet ? (
              /* Dedicated Mode Konplete Fich En Kour */
              <div className="space-y-4">
                {/* Mode Banner */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-[#0d2238] to-[#0c1322] border-2 border-emerald-500/70 rounded-2xl space-y-2 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-black text-xs text-emerald-300 uppercase tracking-wide">
                        Mòd Konplete Fich En Kour
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700">
                      #{completingBet.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Fich sa a genyen <b className="text-white font-mono">{completingBet.items.length}</b> seleksyon ki deja anrejistre. Ou ka ajoute jiska <b className="text-emerald-400 font-mono">{Math.max(0, MAX_SELECTIONS - completingBet.items.length)}</b> nouvo seleksyon pou konplete l (Limit: 35 seleksyon maksimòm). Miz inisyal ou (<b className="text-white font-mono">{completingBet.stake} HTG</b>) rete konsève san frè anplis !
                  </p>
                  <div className="flex items-center justify-between pt-1.5 border-t border-emerald-900/70 text-xs">
                    <span className="text-slate-400">Total Seleksyon Fich la :</span>
                    <span className={`font-mono font-black ${currentTotalSelections > MAX_SELECTIONS ? 'text-red-400' : 'text-emerald-400'}`}>
                      {currentTotalSelections} / {MAX_SELECTIONS} {currentTotalSelections > MAX_SELECTIONS && '🛑 (Depase!)'}
                    </span>
                  </div>
                </div>

                {/* Locked items already in bet */}
                <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5 text-slate-200">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Seleksyon ki deja nan fich la ({completingBet.items.length})</span>
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
                      🔒 Anrejistre
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {completingBet.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-slate-300 font-medium">{item.matchTitle}</div>
                          <div className="text-[10px] text-slate-500">{item.marketName} : <span className="text-cyan-400 font-bold">{item.selectionName}</span></div>
                        </div>
                        <span className="font-mono font-bold text-amber-400 text-xs shrink-0">@{item.rate.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New selections to add */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nouvo seleksyon pou ajoute ({selectedBets.length})</span>
                    </span>
                    {selectedBets.length > 0 && (
                      <button onClick={onClearAll} className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1 cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                        <span>Retire nouvo yo</span>
                      </button>
                    )}
                  </div>

                  {selectedBets.length === 0 ? (
                    <div className="p-4 bg-slate-900/60 rounded-2xl border border-dashed border-emerald-500/40 text-center space-y-2.5">
                      <p className="text-xs text-slate-300">
                        Ou poko chwazi nouvo seleksyon. Chwazi match nan lis la pou ajoute sou fich #{completingBet.id} (jiska {Math.max(0, MAX_SELECTIONS - completingBet.items.length)} seleksyon anplis).
                      </p>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
                      >
                        ➕ Chwazi match nan lis la
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedBets.map((item, index) => (
                        <div key={index} className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/50 flex items-center justify-between shadow-xs">
                          <div className="min-w-0 pr-2">
                            <div className="truncate text-xs font-bold text-white">{item.matchTitle}</div>
                            <div className="text-[10px] text-slate-400">{item.marketName} : <span className="text-emerald-400 font-bold">{item.selectionName}</span></div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-black text-emerald-400 text-xs">@{item.rate.toFixed(2)}</span>
                            <button onClick={() => onRemoveBet(index)} className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Calculation and Action bar */}
                <div className="bg-[#10182c] p-3.5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Còt Ansyen :</span>
                    <span className="font-mono font-bold text-slate-300">{completingBet.totalRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Còt Nouvo Seleksyon :</span>
                    <span className="font-mono font-bold text-cyan-400">x{completingAdditionalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 text-white font-bold">
                    <span>Nouvo Còt Total :</span>
                    <span className="font-mono text-amber-400 font-black text-sm">{completingTotalOdds.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Ansyen Gain Potansyèl :</span>
                    <span className="font-mono text-slate-400">{completingBet.potentialWin.toLocaleString()} HTG</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-black text-sm border-t border-slate-800 pt-1.5">
                    <span>Nouvo Gain Potansyèl :</span>
                    <span className="font-mono">{completingPotentialPayout.toLocaleString()} HTG</span>
                  </div>

                  {isCompletingPayoutExceeded && (
                    <div className="p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-300 leading-snug">
                      🛑 <b>Plafon 1,500,000 HTG Depase :</b> Fich la t ap rapòte {rawCompletingPayout.toLocaleString()} HTG (+{completingOverPayoutAmount.toLocaleString()} HTG depasman). Tanpri retire kèk seleksyon pou pa depase plafon 1,500,000 HTG anvan ou valide.
                    </div>
                  )}

                  {currentTotalSelections > MAX_SELECTIONS && (
                    <div className="p-2.5 bg-red-950/80 border border-red-500/60 rounded-xl text-xs text-red-300 leading-snug">
                      🛑 <b>Limit 35 Seleksyon Depase :</b> Total fich la ta genyen {currentTotalSelections} seleksyon. Maximum seleksyon yon kliyan ka chwazi se 35.
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      disabled={selectedBets.length === 0 || currentTotalSelections > MAX_SELECTIONS || isCompletingPayoutExceeded}
                      onClick={() => {
                        playClickSound();
                        handleConfirmCompleteBetAction();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfime & Valide Konplete Fich ({currentTotalSelections}/{MAX_SELECTIONS})</span>
                    </button>

                    {onCancelCompleteBet && (
                      <button
                        onClick={() => {
                          playClickSound();
                          onCancelCompleteBet();
                        }}
                        className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Anile
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <>
              {selectedBets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Ticket className="w-12 h-12 text-slate-600 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-medium">Votre coupon est vide.</p>
                  <p className="text-xs text-slate-500">
                    Sélectionnez des cotes dans le module sport pour composer votre ticket (Max 35 sélections).
                  </p>
                </div>
              ) : (
                <>
                  {/* Bet Type: Combiné vs Bet Builder vs Simple vs Système */}
                  {selectedBets.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-[#334155] overflow-x-auto">
                        <button
                          onClick={() => {
                            if (hasAnyFunBet) return;
                            setBetType('combine');
                          }}
                          disabled={hasAnyFunBet}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            hasAnyFunBet
                              ? 'opacity-40 text-slate-500 cursor-not-allowed'
                              : betType === 'combine'
                              ? hasSameMatchConflict
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-[#10B981] text-[#0F172A] shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={hasAnyFunBet ? "FunBets pa dwe ka konbine" : undefined}
                        >
                          Combiné Accu {hasAnyFunBet ? '🔒' : hasSameMatchConflict ? '⚠️' : '(+5%)'}
                        </button>
                        <button
                          onClick={() => {
                            if (hasAnyFunBet) return;
                            setBetType('bet_builder');
                          }}
                          disabled={hasAnyFunBet}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            hasAnyFunBet
                              ? 'opacity-40 text-slate-500 cursor-not-allowed'
                              : betType === 'bet_builder'
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={hasAnyFunBet ? "FunBets pa dwe ka konbine" : "Bet Builder (Same Game Combo)"}
                        >
                          ⚡ Bet Builder {hasAnyFunBet ? '🔒' : ''}
                        </button>
                        <button
                          onClick={() => setBetType('simple')}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            betType === 'simple'
                              ? 'bg-[#10B981] text-[#0F172A] shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Simple
                        </button>
                        <button
                          onClick={() => {
                            if (hasAnyFunBet) return;
                            setBetType('system');
                          }}
                          disabled={hasAnyFunBet}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            hasAnyFunBet
                              ? 'opacity-40 text-slate-500 cursor-not-allowed'
                              : betType === 'system'
                              ? 'bg-purple-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title={hasAnyFunBet ? "FunBets pa dwe ka konbine" : undefined}
                        >
                          Système {hasAnyFunBet ? '🔒' : ''}
                        </button>
                      </div>

                      {/* FunBet Conflict Notice Banner */}
                      {hasFunBetConflict && (
                        <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs space-y-2 animate-in fade-in shadow-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-amber-300 font-bold">
                                Règle FunBets (Combinaison Interdite) :
                              </strong>
                              <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
                                <strong>Funbets pa dwe ka konbine.</strong> Ou genyen seleksyon FunBet nan fich la. Yo dwe jwe an <strong>Pari Senp (Simple)</strong> poukont yo, ou pa ka melanje yo nan yon combiné ak lòt match.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-amber-500/30">
                            <span className="text-[10px] text-amber-300 font-bold">Remak :</span>
                            <span className="text-[10px] text-slate-300">
                              Klike sou kwaze (X) pou retire lòt match yo oswa retire FunBet la.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Compatibility Conflict Notice Banner */}
                      {!hasFunBetConflict && hasSameMatchConflict && betType === 'combine' && (
                        <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs space-y-2 animate-in fade-in">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-amber-300 font-bold">
                                Règle de Compatibilité (Éviter les Conflits) :
                              </strong>
                              <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
                                Vous avez sélectionné plusieurs événements sur le même match ({conflictedMatchTitles.join(', ')}).
                                Les règlements interdisent de combiner des issues interdépendantes dans un combiné classique.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1 border-t border-amber-500/30">
                            <span className="text-[10px] text-amber-300 font-bold">Options recommandées :</span>
                            <button
                              onClick={() => setBetType('bet_builder')}
                              className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] transition-all"
                            >
                              ⚡ Activer Bet Builder
                            </button>
                            <button
                              onClick={() => setBetType('simple')}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] transition-all"
                            >
                              Séparer en Simples
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Items List with Emerald Border and Glow */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Sélections actives ({selectedBets.length})</span>
                      <button
                        onClick={onClearAll}
                        className="text-red-400 hover:text-red-300 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tout effacer</span>
                      </button>
                    </div>

                    {selectedBets.map((item, index) => {
                      const isFun = isItemFunBet(item);
                      return (
                        <div
                          key={index}
                          className={`p-3 bg-[#1E232B] rounded-xl relative group border shadow-xs ${
                            isFun
                              ? 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                              : 'border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold block ${isFun ? 'text-purple-400' : 'text-[#00E676]'}`}>
                                  {item.league}
                                </span>
                                {isFun && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 text-[9px] font-bold">
                                    🎲 FunBet • Simple sèlman
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                                {item.matchTitle}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-slate-400">{item.marketName} :</span>
                                <span className="text-white font-bold bg-[#131B28] px-2 py-0.5 rounded border border-[#334155]">
                                  {item.selectionName}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className={`font-mono font-black text-sm ${isFun ? 'text-purple-400' : 'text-[#00E676]'}`}>
                                {item.rate.toFixed(2)}
                              </span>
                              <button
                                onClick={() => onRemoveBet(index)}
                                className="text-slate-500 hover:text-red-400 p-1"
                                title="Retirer cette sélection"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stake Configuration (Dark Emerald Sports) */}
                  <div className="bg-[#18202F] p-3.5 rounded-2xl border border-[#334155] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-300">Mise ({currencySymbol})</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                          Min: {currencyMode === 'HTG' ? '10 HTG' : '1 €'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Solde: <strong className="text-[#00E676]">{userBalanceInMode.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={currencyMode === 'HTG' ? 10 : 1}
                        step={currencyMode === 'HTG' ? 5 : 1}
                        max={userBalanceInMode}
                        value={stake}
                        onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                        className="flex-1 bg-[#131B28] text-white font-mono font-bold text-sm px-3 py-2 rounded-xl border border-[#334155] outline-hidden focus:border-[#10B981]"
                      />
                      <span className="text-xs font-bold text-slate-400">{currencySymbol}</span>
                    </div>

                    {/* Quick Stake Buttons */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {(currencyMode === 'EUR' ? [1, 2, 5, 10, 20] : [10, 25, 50, 100, 250]).map(amt => (
                        <button
                          key={amt}
                          onClick={() => setStake(amt)}
                          className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                            stake === amt
                              ? 'bg-[#10B981] text-[#0F172A] font-bold shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                              : 'bg-[#1E293B] text-slate-300 hover:bg-[#283850]'
                          }`}
                        >
                          +{amt} {currencySymbol}
                        </button>
                      ))}
                    </div>

                    {/* Calculation Summary with 5% Bonus Breakdown & 1.5M Cap Notice */}
                    <div className="pt-2 border-t border-[#334155] space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Cote Totale</span>
                        <span className="font-mono font-bold text-white">
                          {totalRate.toFixed(2)}
                        </span>
                      </div>

                      {bonusPercentage > 0 && (
                        <div className="flex justify-between text-amber-400">
                          <span className="flex items-center gap-1">
                            <span>🎁 Bonus Combiné ({bonusPercentage}%)</span>
                          </span>
                          <span className="font-mono font-bold">
                            +{bonusAmount.toFixed(2)} {currencySymbol}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold">Gains Potentiels</span>
                        <div className="text-right">
                          <span className={`font-mono font-black text-sm ${isPayoutExceeded ? 'text-red-400' : 'text-[#00E676]'}`}>
                            {potentialPayout.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}
                          </span>
                          {isPayoutExceeded && (
                            <span className="block text-[9px] font-bold text-red-400 uppercase tracking-tight">
                              🛑 Plafon Depase (Max 1,500,000 HTG)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Profit net potentiel</span>
                        <span className="font-mono font-bold text-slate-200">
                          +{potentialNetProfit.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Banner for Max Sports Payout Exceeded (1,500,000 HTG) */}
                  {isPayoutExceeded && (
                    <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-2.5 animate-in fade-in shadow-lg">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <strong className="block text-red-300 font-bold text-xs">
                            Plafon Maksimòm Depase (Max 1,500,000 HTG) :
                          </strong>
                          <p className="text-[11px] text-red-200/90 leading-snug">
                            Maximum kòb yon kliyan ka fè anba yon fich sports se <strong>1,500,000 HTG</strong>. Fich sa a ta rapòte <strong>{potentialPayout.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}</strong> (depasman de <strong>+{overPayoutAmount.toLocaleString()} {currencySymbol}</strong>). Fich la pa dwe depase montan sa ousinon ou dwe modifye l pou l pa depase montan an anvan fich la valide.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-red-500/30">
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setStake(maxAllowedStake);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-slate-950" />
                          <span>⚡ Ajuster automatiquement la mise à {maxAllowedStake.toLocaleString()} {currencySymbol}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Warning Banner for Max 35 Selections */}
                  {selectedBets.length > MAX_SELECTIONS && (
                    <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs space-y-1.5 animate-in fade-in shadow-lg">
                      <strong className="block text-red-300 font-bold text-xs">
                        🛑 Limit Seleksyon Depase (Max 35) :
                      </strong>
                      <p className="text-[11px] text-red-200/90 leading-snug">
                        Maximum seleksyon yon kliyan ka chwazi se <strong>35</strong>. Ou genyen <strong>{selectedBets.length}</strong> seleksyon sou koupon sa a. Tanpri retire omwen {selectedBets.length - MAX_SELECTIONS} seleksyon anvan ou valide fich la.
                      </p>
                    </div>
                  )}

                  {/* Submit Button (Dark Emerald) */}
                  {canAfford ? (
                    <button
                      onClick={handleConfirmBet}
                      disabled={Boolean((hasSameMatchConflict && betType === 'combine') || isPayoutExceeded || hasFunBetConflict || selectedBets.length > MAX_SELECTIONS)}
                      className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                        selectedBets.length > MAX_SELECTIONS
                          ? 'bg-red-950/80 text-red-300 border border-red-500/60 cursor-not-allowed shadow-none'
                          : isPayoutExceeded
                          ? 'bg-red-950/80 text-red-300 border border-red-500/60 cursor-not-allowed shadow-none'
                          : hasFunBetConflict
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 cursor-not-allowed shadow-none'
                          : hasSameMatchConflict && betType === 'combine'
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-not-allowed shadow-none'
                          : 'bg-[#10B981] hover:bg-[#059669] text-[#0F172A] shadow-[#10B981]/25'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {selectedBets.length > MAX_SELECTIONS
                          ? `🛑 Depasman Limit : Max 35 seleksyon (${selectedBets.length}/35)`
                          : isPayoutExceeded
                          ? '🛑 Dépassement Plafond : Max 1,500,000 HTG (Réduire mise)'
                          : hasFunBetConflict
                          ? '⚠️ Combinaison FunBet Interdite (Simple Uniquement)'
                          : hasSameMatchConflict && betType === 'combine'
                          ? '⚠️ Conflit détecté • Choisissez Bet Builder'
                          : `Valider le coupon (${selectedBets.length}/35) • ${stake.toFixed(2)} ${currencySymbol}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWallet();
                      }}
                      className="w-full py-3.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Solde Insuffisant - Recharger</span>
                    </button>
                  )}
                </>
              )}
            </>
          )) : (
            /* My Placed Bets Tab with Cashout Feature */
            <div className="space-y-3">
              {placedBets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-medium">Aucun pari en cours pour l'instant.</p>
                </div>
              ) : (
                placedBets.map(bet => (
                  <div
                    key={bet.id}
                    className="p-3.5 bg-[#10182c] rounded-xl space-y-2.5 odd-active-underline"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-cyan-400">{bet.id}</span>
                        <span className="text-slate-500">• {bet.placedAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {bet.isCompleted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Konplete</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            bet.status === 'won'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : bet.status === 'cashed_out'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : bet.status === 'lost'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800'
                          }`}
                        >
                          {bet.status === 'pending'
                            ? 'En Cours'
                            : bet.status === 'cashed_out'
                            ? 'Cash Out'
                            : bet.status === 'won'
                            ? 'Gagné'
                            : 'Perdu'}
                        </span>
                      </div>
                    </div>

                    {/* Match items in ticket */}
                    <div className="space-y-1">
                      {bet.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-300">
                          <span className="truncate pr-2">{item.matchTitle}</span>
                          <span className="font-semibold text-cyan-300 font-mono-num">
                            {item.selectionName} ({item.rate.toFixed(2)})
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Mise</span>
                        <span className="font-bold text-white">{bet.stake} HTG</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Gain Potentiel</span>
                        <span className="font-black text-emerald-400 font-mono-num">
                          {bet.potentialWin.toLocaleString()} HTG
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {/* Konplete Fich Button si fich la en kour */}
                        {bet.status === 'pending' && onStartCompleteBet && (
                          <button
                            onClick={() => {
                              playClickSound();
                              onStartCompleteBet(bet.id);
                              setActiveTab('slip');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            title="Konplete fich sa a (Ajoute seleksyon menm si fich la fin fèt depi l en kour)"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Konplete ({bet.items.length}/35)</span>
                          </button>
                        )}

                        {/* Cash Out Button if pending */}
                        {bet.status === 'pending' && bet.cashOutValue && (
                          <button
                            onClick={() => handleCashOutClick(bet)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Cash Out {bet.cashOutValue} HTG</span>
                          </button>
                        )}

                        {/* Receipt Print button */}
                        <button
                          onClick={() => {
                            playClickSound();
                            const categoryTitle =
                              bet.type === 'bet_builder'
                                ? 'Paris sportifs combinés'
                                : bet.type === 'system'
                                ? 'Paris sportifs combinés'
                                : bet.type === 'combine'
                                ? 'Paris sportifs combinés'
                                : 'Paris sports';

                            setPrintTicketData({
                              ticketCode: bet.id.startsWith('FB-') ? bet.id : `FB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
                              date: new Date().toLocaleString('fr-FR'),
                              userId: user.id || 'usr-80491',
                              gameType: categoryTitle,
                              odds: bet.totalRate,
                              betAmount: bet.stake,
                              potentialPayout: bet.potentialWin,
                              status: bet.status === 'won' ? 'WON' : bet.status === 'lost' ? 'LOST' : 'PENDING',
                              matches: bet.items.map(item => ({
                                match: item.matchTitle,
                                selection: `${item.marketName} : ${item.selectionName}`,
                                odds: item.rate,
                                match_time: item.league
                              })),
                              details: bet.items.map((i, idx) => `${idx + 1}. ${i.matchTitle}: ${i.selectionName} (@${i.rate.toFixed(2)})`).join(' | ')
                            });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Imprimer Fiche / Reçu POS 80mm"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Real POS 80mm Print Modal */}
        {printTicketData && (
          <TicketPrintModal
            isOpen={true}
            onClose={() => setPrintTicketData(null)}
            ticket={printTicketData}
          />
        )}

      </div>
    </div>
  );
};
