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
  Sparkles
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
}

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
  isLimitBlocked = false
}) => {
  const [activeTab, setActiveTab] = useState<'slip' | 'myBets'>('slip');
  const [betType, setBetType] = useState<'simple' | 'combine' | 'bet_builder' | 'system'>('combine');
  const [currencyMode, setCurrencyMode] = useState<'EUR' | 'HTG'>('EUR');
  const [stake, setStake] = useState<number>(20.00);
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

  if (!isOpen) return null;

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

  const userBalanceInMode = currencyMode === 'EUR'
    ? (user.balanceHTG ? user.balanceHTG / 150 : 150.00)
    : user.balanceHTG;

  const canAfford = userBalanceInMode >= stake;

  const handleConfirmBet = async () => {
    if (selectedBets.length === 0) return;
    if (stake <= 0) return;
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
            <h3 className="font-black text-base text-white tracking-tight">SportsBet Pro • Coupon</h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#10B981] text-[#0F172A] font-mono">
              {selectedBets.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Mode Switcher */}
            <div className="flex items-center bg-[#1E293B] rounded-lg p-0.5 border border-[#334155]">
              <button
                onClick={() => {
                  playClickSound();
                  setCurrencyMode('EUR');
                  setStake(20.00);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  currencyMode === 'EUR' ? 'bg-[#10B981] text-[#0F172A]' : 'text-slate-400 hover:text-white'
                }`}
              >
                EUR (€)
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setCurrencyMode('HTG');
                  setStake(500);
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  currencyMode === 'HTG' ? 'bg-[#10B981] text-[#0F172A]' : 'text-slate-400 hover:text-white'
                }`}
              >
                HTG
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
            Nouveau Pari ({selectedBets.length})
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
            <>
              {selectedBets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Ticket className="w-12 h-12 text-slate-600 mx-auto stroke-[1.5]" />
                  <p className="text-sm font-medium">Votre coupon est vide.</p>
                  <p className="text-xs text-slate-500">
                    Sélectionnez des cotes dans le module sport pour composer votre ticket.
                  </p>
                </div>
              ) : (
                <>
                  {/* Bet Type: Combiné vs Bet Builder vs Simple vs Système */}
                  {selectedBets.length > 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-[#334155] overflow-x-auto">
                        <button
                          onClick={() => setBetType('combine')}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            betType === 'combine'
                              ? hasSameMatchConflict
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-[#10B981] text-[#0F172A] shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Combiné Accu {hasSameMatchConflict ? '⚠️' : '(+5%)'}
                        </button>
                        <button
                          onClick={() => setBetType('bet_builder')}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            betType === 'bet_builder'
                              ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="Bet Builder (Same Game Combo)"
                        >
                          ⚡ Bet Builder
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
                          onClick={() => setBetType('system')}
                          className={`flex-1 py-1.5 px-2 text-[11px] font-black rounded-lg transition-all whitespace-nowrap ${
                            betType === 'system'
                              ? 'bg-purple-600 text-white font-bold shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Système
                        </button>
                      </div>

                      {/* Compatibility Conflict Notice Banner */}
                      {hasSameMatchConflict && betType === 'combine' && (
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

                    {selectedBets.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[#1E232B] rounded-xl relative group border border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="pr-4">
                            <span className="text-[10px] text-[#00E676] font-bold block">
                              {item.league}
                            </span>
                            <h4 className="text-xs font-bold text-slate-100">
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
                            <span className="font-mono font-black text-sm text-[#00E676]">
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
                    ))}
                  </div>

                  {/* Stake Configuration (Dark Emerald Sports) */}
                  <div className="bg-[#18202F] p-3.5 rounded-2xl border border-[#334155] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Mise ({currencySymbol})</span>
                      <span className="text-xs text-slate-400">
                        Solde: <strong className="text-[#00E676]">{userBalanceInMode.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currencySymbol}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        step={currencyMode === 'EUR' ? "1" : "25"}
                        max={userBalanceInMode}
                        value={stake}
                        onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                        className="flex-1 bg-[#131B28] text-white font-mono font-bold text-sm px-3 py-2 rounded-xl border border-[#334155] outline-hidden focus:border-[#10B981]"
                      />
                      <span className="text-xs font-bold text-slate-400">{currencySymbol}</span>
                    </div>

                    {/* Quick Stake Buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(currencyMode === 'EUR' ? [5, 10, 20, 50] : [100, 250, 500, 1000]).map(amt => (
                        <button
                          key={amt}
                          onClick={() => setStake(amt)}
                          className={`py-1 text-xs font-semibold rounded-lg transition-all ${
                            stake === amt
                              ? 'bg-[#10B981] text-[#0F172A] font-bold'
                              : 'bg-[#1E293B] text-slate-300 hover:bg-[#283850]'
                          }`}
                        >
                          +{amt} {currencySymbol}
                        </button>
                      ))}
                    </div>

                    {/* Calculation Summary with 5% Bonus Breakdown */}
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

                      <div className="flex justify-between text-slate-300">
                        <span className="font-semibold">Gains Potentiels</span>
                        <span className="font-mono font-black text-sm text-[#00E676]">
                          {potentialPayout.toFixed(2)} {currencySymbol}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Profit net potentiel</span>
                        <span className="font-mono font-bold text-slate-200">
                          +{potentialNetProfit.toFixed(2)} {currencySymbol}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button (Dark Emerald) */}
                  {canAfford ? (
                    <button
                      onClick={handleConfirmBet}
                      disabled={hasSameMatchConflict && betType === 'combine'}
                      className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                        hasSameMatchConflict && betType === 'combine'
                          ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                          : 'bg-[#10B981] hover:bg-[#059669] text-[#0F172A] shadow-[#10B981]/25'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {hasSameMatchConflict && betType === 'combine'
                          ? '⚠️ Conflit détecté • Choisissez Bet Builder'
                          : `Valider le coupon • ${stake.toFixed(2)} ${currencySymbol}`}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenWallet();
                      }}
                      className="w-full py-3.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Solde Insuffisant - Recharger</span>
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
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

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
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

                      {/* Cash Out Button if pending */}
                      {bet.status === 'pending' && bet.cashOutValue && (
                        <button
                          onClick={() => handleCashOutClick(bet)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1"
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
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Imprimer Fiche / Reçu POS 80mm"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
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
