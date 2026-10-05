import React, { useRef, useState } from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Download, Share2, FileText, ChevronRight } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { AGENCY_INFO, SUPPORTED_PRINT_FORMATS } from '../data/gamingHubData';
import { UniversalFullBetTicket, UniversalTicketProps } from './UniversalFullBetTicket';

export { UniversalFullBetTicket };
export type { UniversalTicketProps };

export interface PrintableTicketData {
  ticketCode: string;
  date: string;
  userId: string;
  gameType: string;
  odds: number;
  betAmount: number;
  potentialPayout: number;
  status?: 'PENDING' | 'WON' | 'LOST' | 'CANCELLED' | 'active' | 'in_play' | 'validated' | 'won' | 'lost';
  details?: string;
  securityCode?: string;
  barcodeData?: string;
  matches?: {
    match: string;
    selection: string;
    odds: number;
    match_time?: string;
  }[];
  plays?: {
    play_type: string;
    numbers: string[];
    stake_htg: number;
    potential_gain_htg: number;
  }[];
  gameDetails?: {
    auto_cashout_multiplier?: number;
    session_state?: string;
    game_round_id?: string;
  };
  drawDetails?: {
    lottery_city: string;
    draw_session: string;
    draw_date: string;
    draw_time?: string;
  };
}

interface TicketPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: PrintableTicketData | null;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({ isOpen, onClose, ticket }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedFormat, setSelectedFormat] = useState<'pos_thermal_80mm' | 'pos_thermal_58mm' | 'standard_paper'>('pos_thermal_80mm');

  if (!isOpen || !ticket) return null;

  const formatType: '80mm' | '58mm' | 'A4' =
    selectedFormat === 'pos_thermal_58mm'
      ? '58mm'
      : selectedFormat === 'standard_paper'
      ? 'A4'
      : '80mm';

  // Category calculation matching UniversalTicketProps
  const getCategory = (t: PrintableTicketData): 'Paris sportifs combinés' | 'Paris sports' | 'Casino' | 'Borlette' => {
    const gType = (t.gameType || '').toLowerCase();
    if (gType.includes('combin') || (t.matches && t.matches.length > 1)) {
      return 'Paris sportifs combinés';
    }
    if (
      gType.includes('casino') ||
      gType.includes('crash') ||
      gType.includes('aviator') ||
      gType.includes('jetx') ||
      gType.includes('roulette') ||
      gType.includes('slots') ||
      t.gameDetails
    ) {
      return 'Casino';
    }
    if (
      gType.includes('borlette') ||
      gType.includes('loto') ||
      gType.includes('maryaj') ||
      t.plays ||
      t.drawDetails
    ) {
      return 'Borlette';
    }
    return 'Paris sports';
  };

  // Selections calculation matching UniversalTicketProps
  const getSelections = (t: PrintableTicketData): { label: string; details: string }[] => {
    const list: { label: string; details: string }[] = [];
    if (t.matches && t.matches.length > 0) {
      t.matches.forEach(m => {
        list.push({
          label: m.match,
          details: `${m.selection} (Cote @${m.odds.toFixed(2)})`
        });
      });
    } else if (t.plays && t.plays.length > 0) {
      t.plays.forEach(p => {
        list.push({
          label: `${p.play_type} (${p.numbers.join('-')})`,
          details: `Miz: ${p.stake_htg} HTG`
        });
      });
    } else if (t.gameDetails) {
      list.push({
        label: `Jeu / Round: ${t.gameDetails.game_round_id || 'ROUND-LIVE'}`,
        details: `Multiplicateur: x${t.gameDetails.auto_cashout_multiplier?.toFixed(2) || (t.odds || 2).toFixed(2)}`
      });
    } else if (t.details) {
      list.push({
        label: 'Sélection du Pari',
        details: t.details
      });
    } else {
      list.push({
        label: 'Pari Validé',
        details: `Cote @${(t.odds || 1.85).toFixed(2)}`
      });
    }
    return list;
  };

  const category = getCategory(ticket);
  const selections = getSelections(ticket);
  const appliedOdds = Math.min(ticket.odds || 1.0, 50000);
  const coteOrMultiplier =
    category === 'Casino'
      ? `x${(ticket.gameDetails?.auto_cashout_multiplier || appliedOdds).toFixed(2)}`
      : appliedOdds.toFixed(2);
  const totalStake = ticket.betAmount || 100;
  const potentialWin = Math.min(
    ticket.potentialPayout || Math.round(totalStake * appliedOdds),
    1000000
  );
  const securityCode =
    ticket.securityCode ||
    `SEC-${ticket.ticketCode.replace(/[^0-9A-Z]/g, '').slice(-6) || '4921'}`;

  const currentFormatObj = SUPPORTED_PRINT_FORMATS.find(f => f.format_id === selectedFormat) || SUPPORTED_PRINT_FORMATS[0];

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#0b132b] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-display flex items-center gap-1.5">
                <span>Modil Enpresyon Tikè POS</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                  v2.4.0
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {AGENCY_INFO.name} • {AGENCY_INFO.pos_id}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5 px-1 flex items-center justify-between">
            <span>Chwazi Fòma Enprimant lan :</span>
            <span className="text-sky-700 font-mono font-bold text-[10px]">{currentFormatObj.format_name}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SUPPORTED_PRINT_FORMATS.map(fmt => (
              <button
                key={fmt.format_id}
                onClick={() => {
                  playClickSound();
                  setSelectedFormat(fmt.format_id as any);
                }}
                className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer ${
                  selectedFormat === fmt.format_id
                    ? 'bg-[#0b132b] text-[#ffb703] font-bold shadow-xs border border-amber-400/60'
                    : 'bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-300 font-medium'
                }`}
              >
                <div className="text-xs truncate">{fmt.format_id === 'pos_thermal_80mm' ? 'Tèmik 80mm' : fmt.format_id === 'pos_thermal_58mm' ? 'Tèmik 58mm' : 'Papye A4'}</div>
                <div className="text-[9px] opacity-75">{fmt.roll_width_mm}mm</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Print Action Bar */}
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2 text-xs">
          <span className="text-amber-900 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Rekòmande: {currentFormatObj.recommended_for}</span>
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b132b] hover:bg-[#1c2541] text-[#ffb703] font-bold rounded-xl border border-[#ffb703] shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Enprime Kounye a</span>
          </button>
        </div>

        {/* Scrollable Receipt Preview (Printable Area with UniversalFullBetTicket) */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-200/80 flex justify-center items-start">
          <div ref={receiptRef} id="printable-ticket" className="w-full flex justify-center py-1">
            <UniversalFullBetTicket
              ticketNumber={ticket.ticketCode}
              dateTime={ticket.date}
              playerId={ticket.userId}
              status={ticket.status ? String(ticket.status).toUpperCase() : 'VALIDE'}
              category={category}
              selections={selections}
              coteOrMultiplier={coteOrMultiplier}
              totalStake={totalStake}
              potentialWin={potentialWin}
              securityCode={securityCode}
              formatType={formatType}
            />
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fèmen
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0b132b] hover:bg-[#1c2541] text-[#ffb703] border border-[#ffb703] text-xs font-bold rounded-xl shadow-xs transition-colors active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Enprime Tikè a ({currentFormatObj.format_name})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
