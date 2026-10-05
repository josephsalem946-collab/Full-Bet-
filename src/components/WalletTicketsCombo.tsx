import React, { useState, useRef, useEffect } from 'react';
import {
  Wallet,
  Eye,
  EyeOff,
  Printer,
  ChevronDown,
  Plus,
  ShieldCheck,
  Ticket,
  Dices,
  Trophy,
  Flame,
  Zap,
  ArrowDownCircle,
  Clock,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';
import { playClickSound } from '../utils/audio';
import {
  FULLBET_GAMINGHUB_CONFIG,
  INITIAL_GAMINGHUB_TICKETS,
  GAMING_CATEGORIES_SUMMARY,
  GamingHubTicket,
  GAMINGHUB_BOTTOM_NAV
} from '../data/gamingHubData';
import { PrintableTicketData } from './TicketPrintModal';

export interface WalletTicketsComboProps {
  // Direct props from user specification
  balance?: number;
  currency?: string;
  ticketCount?: number;
  isFirebaseAuthenticated?: boolean;
  onDepositClick?: () => void;

  // Legacy / Integration props
  user?: UserProfile;
  onOpenWallet?: (tab?: 'deposit' | 'withdraw') => void;
  onOpenBetSlip?: () => void;
  onPrintTicket?: (ticket: PrintableTicketData) => void;
  onOpenTicketVerify?: () => void;
  customActiveCount?: number;
  onNavigateModule?: (module: 'sports' | 'casino' | 'borlette') => void;
}

export const WalletTicketsCombo: React.FC<WalletTicketsComboProps> = ({
  balance,
  currency = 'HTG',
  ticketCount,
  isFirebaseAuthenticated = true,
  onDepositClick,
  user,
  onOpenWallet,
  onOpenBetSlip,
  onPrintTicket,
  onOpenTicketVerify,
  customActiveCount,
  onNavigateModule
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const config = FULLBET_GAMINGHUB_CONFIG;

  // Determine effective balance and user data
  const effectiveBalance = balance !== undefined
    ? balance
    : (user?.balanceHTG !== undefined ? user.balanceHTG : config.user_account.balance.amount);

  const effectiveTicketCount = ticketCount !== undefined
    ? ticketCount
    : (customActiveCount !== undefined ? customActiveCount : config.dashboard_summary.active_tickets_indicator.count);

  const username = user?.fullName || config.user_account.username;
  const userId = user?.id || config.user_account.user_id;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formattedBalance = isVisible
    ? effectiveBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '••••••••';

  const handleDeposit = () => {
    playClickSound();
    if (onDepositClick) {
      onDepositClick();
    } else if (onOpenWallet) {
      onOpenWallet('deposit');
    }
    setIsOpen(false);
  };

  const handleWithdraw = () => {
    playClickSound();
    if (onOpenWallet) {
      onOpenWallet('withdraw');
    }
    setIsOpen(false);
  };

  const handleOpenTickets = () => {
    playClickSound();
    if (onOpenBetSlip) {
      onOpenBetSlip();
    }
    setIsOpen(false);
  };

  const handleCategoryClick = (actionUrl: string) => {
    playClickSound();
    setIsOpen(false);
    if (onNavigateModule) {
      if (actionUrl === '/bolet') onNavigateModule('borlette');
      else if (actionUrl === '/sports') onNavigateModule('sports');
      else if (actionUrl === '/casino') onNavigateModule('casino');
    } else if (onOpenBetSlip) {
      onOpenBetSlip();
    }
  };

  const handlePrintSpecific = (ticket: GamingHubTicket) => {
    playClickSound();
    if (onPrintTicket) {
      onPrintTicket({
        ticketCode: ticket.ticket_id,
        date: new Date(ticket.created_at).toLocaleString('fr-FR'),
        userId: userId,
        gameType: ticket.category_label || 'FULL BET Pari',
        odds: ticket.total_odds || ticket.multiplier_target || 1.0,
        betAmount: ticket.stake_htg || 100,
        potentialPayout: ticket.potential_gain_htg || 15000,
        status: ticket.status as any,
        securityCode: ticket.security_code,
        barcodeData: ticket.barcode_data,
        matches: ticket.matches,
        plays: ticket.plays,
        drawDetails: ticket.draw_details,
        details: ticket.game_title
      });
    }
  };

  return (
    <div className="relative inline-block font-sans" ref={dropdownRef}>
      {/* ============================================================== */}
      {/* 1. HEADER COMPACT TRIGGER (FULL BET / GamingHub Haïti)           */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1.5 bg-[#0D131F] hover:bg-[#121927] border border-emerald-500/30 rounded-2xl p-1 transition-all shadow-lg select-none">
        
        {/* Toggle Balance Visibility Eye Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            setIsVisible(!isVisible);
          }}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title={isVisible ? 'Kache solde a' : 'Montre solde a'}
          aria-label={isVisible ? 'Masquer le solde' : 'Afficher le solde'}
        >
          {isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Combined Main Button */}
        <button
          onClick={() => {
            playClickSound();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-2 px-2 py-1 rounded-xl text-left cursor-pointer group"
          title="FULL BET - Klike pou wè solde ak rezime 3 kategori yo"
        >
          {/* Overlapping Combo Icon: Wallet + Ticket */}
          <div className="relative flex items-center justify-center w-6 h-6">
            <Wallet className="w-4 h-4 text-emerald-400 absolute -left-0.5 top-1" />
            <Ticket className="w-4 h-4 text-amber-400 absolute -right-0.5 -top-0.5 drop-shadow-xs" />
          </div>

          {/* Solde Text */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-emerald-400 group-hover:text-emerald-300">
              {formattedBalance} {currency}
            </span>

            {/* Firebase Authentication Shield */}
            {isFirebaseAuthenticated && (
              <span title="Kont verifye epi sekirize ak Firebase" className="flex items-center text-emerald-400 ml-0.5">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          {/* Active Tickets Indicator Badge with Pulse Animation (Matching JSON) */}
          <span className="flex items-center gap-1 bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs font-mono">
            <Zap className="w-3 h-3 text-amber-400 animate-pulse fill-amber-400" />
            <span>{effectiveTicketCount} FICH AKTIF</span>
          </span>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Action Button: Dépôt (+ De...) */}
        <button
          onClick={handleDeposit}
          className="bg-[#10B981] hover:bg-emerald-600 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all active:scale-95 shrink-0"
          title="Fè yon depo rapid sou kont ou"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>{config.user_account.quick_actions[0]?.short_label || '+ De...'}</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. EXTENDED FULL BET DROPDOWN PANEL                            */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[345px] sm:w-[420px] bg-[#0D131F] text-white border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
          
          {/* Header Brand Bar: FULL BET (GamingHub Haïti) */}
          <div className="p-3 bg-[#121927] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-wider text-white">
                    {config.platform.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {config.platform.country_code}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/80 font-semibold block leading-tight">
                  Paryaj & Bòlèt Ofisyèl
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px]">
                {username}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {userId}
              </span>
            </div>
          </div>

          {/* Account Balance Card with Dépôt Action */}
          <div className="p-4 bg-gradient-to-r from-[#0D131F] via-[#121927] to-[#0D131F] border-b border-slate-800">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Solde Disponib ({config.platform.currency.name})</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-400 font-mono">
                    {formattedBalance} {currency}
                  </span>

                  <button
                    onClick={() => {
                      playClickSound();
                      setIsVisible(!isVisible);
                    }}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title={isVisible ? 'Masquer le solde' : 'Afficher le solde'}
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 block mt-1">
                  Valab pou Bòlèt, Paryaj Espòtif ak Kazino
                </span>
              </div>

              {/* Dépôt Button */}
              <button
                onClick={handleDeposit}
                className="bg-[#10B981] hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{config.user_account.quick_actions[0]?.label || 'Dépôt'}</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. REZIME 3 KATEGORI JWÈT YO (Dashboard Summary)               */}
          {/* ============================================================== */}
          <div className="p-3 bg-[#0f172a]/60 border-b border-slate-800">
            <div className="text-[11px] uppercase font-black text-slate-300 tracking-wider mb-2.5 flex items-center justify-between">
              <span>{config.dashboard_summary.categories_summary.title}</span>
              <span className="flex items-center gap-1 text-amber-400 font-mono text-[10px] font-bold">
                <Zap className="w-3 h-3 animate-pulse fill-amber-400" />
                <span>{config.dashboard_summary.active_tickets_indicator.badge_text}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {config.dashboard_summary.categories_summary.categories.map(cat => {
                let badgeClass = 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30';
                let iconSymbol = <Dices className="w-4 h-4 text-cyan-400" />;
                let subtitle = cat.available_draws?.join(', ') || '';

                if (cat.badge_color === 'emerald' || cat.id === 'paryaj_espotif') {
                  badgeClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
                  iconSymbol = <Trophy className="w-4 h-4 text-emerald-400" />;
                  subtitle = cat.popular_sports?.join(', ') || '';
                } else if (cat.badge_color === 'purple' || cat.id === 'kazino_jwèt') {
                  badgeClass = 'text-purple-400 bg-purple-400/10 border-purple-400/30';
                  iconSymbol = <Flame className="w-4 h-4 text-purple-400" />;
                  subtitle = cat.quick_access_games?.slice(0, 2).join(', ') || 'Aviator, Roulette';
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.action_url)}
                    className="p-2.5 rounded-2xl bg-[#121927] border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between text-left cursor-pointer group"
                    title={`Ale nan ${cat.name}`}
                  >
                    <div className="flex items-center justify-between mb-1 w-full">
                      {iconSymbol}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${badgeClass}`}>
                        {cat.active_items_count}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate w-full">
                      {cat.name}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5 w-full">
                      {subtitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* 4. TIKÈ KI VALIDE KOUNYE A (Active Tickets Section)            */}
          {/* ============================================================== */}
          <div className="p-3 max-h-60 overflow-y-auto space-y-2.5">
            <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1 flex items-center justify-between">
              <span>{config.active_tickets_section.title} ({config.active_tickets_section.total_active}) :</span>
              <span className="text-emerald-400 text-[10px] font-bold">Enpresyon Rapid</span>
            </div>

            {config.active_tickets_section.tickets.map(ticket => {
              const matchingHubTicket = INITIAL_GAMINGHUB_TICKETS.find(t => t.ticket_id === ticket.ticket_id);
              const isSports = ticket.category_id === 'paryaj_espotif';
              const isBorlette = ticket.category_id === 'bolet_loto';

              return (
                <div
                  key={ticket.ticket_id}
                  className="p-2.5 rounded-2xl bg-[#121927] border border-slate-800 hover:border-emerald-500/50 transition-colors flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Ticket ID + Category + Status */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-xs text-amber-400">
                        {ticket.ticket_id}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold truncate">
                        {ticket.category_label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                        {ticket.status}
                      </span>
                    </div>

                    {/* Middle Row: Details (Maryaj / Loto 3 Chif / Kòmbine matches) */}
                    <div className="text-xs text-slate-100 font-bold truncate mt-1">
                      {isBorlette && (
                        <span>
                          {ticket.lottery_name} • <span className="text-amber-300">{ticket.game_type} ({ticket.bet_details.combination})</span>
                        </span>
                      )}
                      {isSports && (
                        <span>
                          {ticket.sport} • <span className="text-emerald-300">{ticket.bet_type} ({ticket.selections_count} Matchs)</span>
                        </span>
                      )}
                    </div>

                    {/* Sports match selections if available */}
                    {isSports && ticket.bet_details.matches && (
                      <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5 font-mono">
                        {ticket.bet_details.matches.map((m, idx) => (
                          <div key={idx} className="truncate">
                            • {m.match}: <strong className="text-white">{m.selection}</strong> (@{m.odds})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Financials Row: Miz & Gain */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                      <span>Miz: <strong className="text-white">{ticket.financials.stake_formatted}</strong></span>
                      {ticket.financials.multiplier && (
                        <>
                          <span>•</span>
                          <span>Cote: <strong className="text-amber-400">x{ticket.financials.multiplier}</strong></span>
                        </>
                      )}
                      {ticket.financials.total_odds && (
                        <>
                          <span>•</span>
                          <span>Cote: <strong className="text-amber-400">{ticket.financials.total_odds}</strong></span>
                        </>
                      )}
                      <span>•</span>
                      <span>Gain: <strong className="text-emerald-400">{ticket.financials.potential_win_formatted}</strong></span>
                    </div>
                  </div>

                  {/* Instant Print Button */}
                  {matchingHubTicket && (
                    <button
                      onClick={() => handlePrintSpecific(matchingHubTicket)}
                      className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-sm"
                      title="Enprime fich sa a (POS 80mm / 58mm / A4)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono font-bold hidden sm:inline">Enprime</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* 5. BOTTOM NAVIGATION (Retrè, Istorik, Verifye)                 */}
          {/* ============================================================== */}
          <div className="p-3 bg-[#0D131F] border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
            {/* 1. Retrè (Retrait) */}
            <button
              onClick={handleWithdraw}
              className="py-2.5 px-2 text-center rounded-xl bg-[#121927] hover:bg-rose-950/40 text-rose-400 border border-rose-500/20 font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              title="Mande yon retrè vers Moncash oswa Natcash"
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-400" />
              <span>{config.bottom_navigation[0]?.label || 'Retrè'}</span>
            </button>

            {/* 2. Istorik (Historique) */}
            <button
              onClick={handleOpenTickets}
              className="py-2.5 px-2 text-center rounded-xl bg-[#121927] hover:bg-amber-950/40 text-amber-400 border border-amber-500/20 font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              title="Wè tout istorik tikè ou yo"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{config.bottom_navigation[1]?.label || 'Istorik'}</span>
            </button>

            {/* 3. Verifye (Vérification / Scanner) */}
            <button
              onClick={() => {
                playClickSound();
                setIsOpen(false);
                if (onOpenTicketVerify) {
                  onOpenTicketVerify();
                } else if (onOpenBetSlip) {
                  onOpenBetSlip();
                }
              }}
              className="py-2.5 px-2 text-center rounded-xl bg-[#121927] hover:bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              title="Verifye yon fich pa kòd oswa QR kòd"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>{config.bottom_navigation[2]?.label || 'Verifye'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
