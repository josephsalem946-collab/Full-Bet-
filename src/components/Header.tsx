import React, { useState } from 'react';
import { Menu, Plus, Ticket, ShieldCheck, User, Flame, Globe, Smartphone, Printer, Receipt } from 'lucide-react';
import { UserProfile, GameModule } from '../types';
import { GainCashLogo } from './GainCashLogo';
import { HTG_TO_USD_RATE } from '../utils/storage';
import { playClickSound } from '../utils/audio';
import { useTranslation, LANGUAGES, LanguageCode } from '../context/LanguageContext';
import { formaterEtMasquer } from '../utils/securityMasking';
import { PrintableTicketData } from './TicketPrintModal';

interface HeaderProps {
  user: UserProfile;
  activeModule: GameModule;
  onSelectModule: (mod: GameModule) => void;
  onOpenDrawer: () => void;
  onOpenWallet: (tab?: 'deposit' | 'withdraw') => void;
  onOpenBetSlip: () => void;
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenFirebaseLogin?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenPrintTicket?: () => void;
  onPrintTicketData?: (ticket: PrintableTicketData) => void;
  onOpenTicketVerify?: () => void;
  activeBetsCount: number;
  unreadNotifsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeModule,
  onSelectModule,
  onOpenDrawer,
  onOpenWallet,
  onOpenBetSlip,
  onOpenNotifications,
  onOpenAdmin,
  onOpenProfile,
  onOpenFirebaseLogin,
  onOpenDownloadApp,
  onOpenPrintTicket,
  onPrintTicketData,
  onOpenTicketVerify,
  activeBetsCount,
  unreadNotifsCount
}) => {
  const { t, lang, changeLanguage } = useTranslation();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const usdEquivalent = (user.balanceHTG / HTG_TO_USD_RATE).toFixed(2);
  const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-30 w-full h-[60px] shrink-0 bg-[#0D1322]/95 backdrop-blur-md border-b border-[#1E88E5]/30 shadow-lg font-sans">
      {/* Top Bar: Brand, Balance, Actions (matching Compose FullBetMaskedSymbolsScreen) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-full flex items-center justify-between gap-2 min-w-0">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              onOpenDrawer();
            }}
            className="w-10 h-10 rounded-lg bg-[#151D30] hover:bg-[#1E88E5]/20 border border-[#1E88E5]/30 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label={t('menu')}
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <div
            onClick={() => onSelectModule('sports')}
            className="cursor-pointer shrink-0 flex items-center gap-2"
          >
            <GainCashLogo size="sm" showSubtitle={false} />
          </div>
        </div>

        {/* Center: Module Nav for Tablets & Desktops with AccentBlue Active Underline */}
        <nav className="hidden md:flex items-center gap-4 bg-[#151D30]/80 px-3 py-1.5 rounded-xl border border-[#1E88E5]/30 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              onSelectModule('sports');
            }}
            className={`pb-1 px-3 text-xs font-bold transition-all ${
              activeModule === 'sports'
                ? 'text-white border-b-[3px] border-[#1E88E5] shadow-[0_4px_12px_rgba(30,136,229,0.35)]'
                : 'text-[#94A3B8] hover:text-white border-b-[3px] border-transparent'
            }`}
          >
            ⚽ {t('sports')}
          </button>
          <button
            onClick={() => {
              playClickSound();
              onSelectModule('casino');
            }}
            className={`pb-1 px-3 text-xs font-bold transition-all ${
              activeModule === 'casino'
                ? 'text-white border-b-[3px] border-[#1E88E5] shadow-[0_4px_12px_rgba(30,136,229,0.35)]'
                : 'text-[#94A3B8] hover:text-white border-b-[3px] border-transparent'
            }`}
          >
            🎰 {t('casino')}
          </button>
          <button
            onClick={() => {
              playClickSound();
              onSelectModule('borlette');
            }}
            className={`pb-1 px-3 text-xs font-bold transition-all ${
              activeModule === 'borlette'
                ? 'text-white border-b-[3px] border-[#1E88E5] shadow-[0_4px_12px_rgba(30,136,229,0.35)]'
                : 'text-[#94A3B8] hover:text-white border-b-[3px] border-transparent'
            }`}
          >
            🎟️ {t('borlette')}
          </button>
        </nav>

        {/* Right: Header Actions */}
        <div className="header-actions">
          {/* Minimalist Technical Firebase Online Status Element */}
          <button
            onClick={() => {
              playClickSound();
              if (onOpenFirebaseLogin) {
                onOpenFirebaseLogin();
              } else {
                onOpenProfile();
              }
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0B101B] hover:bg-[#121826] border border-slate-800 hover:border-emerald-500/40 text-slate-300 transition-all text-[11px] font-mono shadow-xs active:scale-95 cursor-pointer group"
            title="Firebase System Online • Klike pou estati / koneksyon"
          >
            {/* Ti pwen (dot) vèt tou piti ak efè an liy */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>

            {/* Ti ikon flanm teknik */}
            <Flame className="w-3 h-3 text-amber-400/90 group-hover:text-amber-400 shrink-0 transition-colors" />

            <span className="font-semibold text-slate-300 group-hover:text-white tracking-tight hidden xs:inline">
              Firebase
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0">
              Online
            </span>
          </button>

          {/* Minimalist Technical Fiches Element */}
          <button
            onClick={() => {
              playClickSound();
              onOpenBetSlip();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0B101B] hover:bg-[#121826] border border-slate-800 hover:border-amber-500/40 text-slate-300 transition-all text-[11px] font-mono shadow-xs active:scale-95 cursor-pointer group"
            title="Fich & Paryaj • Klike pou louvri panyen fich ou yo"
          >
            <Receipt className="w-3 h-3 text-amber-400 group-hover:scale-110 shrink-0 transition-transform" />
            <span className="font-semibold text-slate-300 group-hover:text-white tracking-tight">
              Fiches
            </span>
            {activeBetsCount > 0 ? (
              <span className="text-[9px] font-bold font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-1 py-0.2 rounded shrink-0">
                {activeBetsCount}
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 font-mono font-medium">
                0
              </span>
            )}
          </button>

          {/* Minimalist Technical Enprime Fiches Element */}
          <button
            onClick={() => {
              playClickSound();
              if (onOpenPrintTicket) {
                onOpenPrintTicket();
              } else {
                onOpenBetSlip();
              }
            }}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0B101B] hover:bg-[#121826] border border-slate-800 hover:border-sky-500/40 text-slate-400 hover:text-slate-200 transition-all text-[11px] font-mono shadow-xs active:scale-95 cursor-pointer"
            title="Enprime fiches POS"
            aria-label="Enprime fiches"
          >
            <Printer className="w-3 h-3 text-sky-400" />
            <span className="text-[9px] font-mono hidden md:inline text-slate-400">POS</span>
          </button>

          {/* Quick Language Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#151D30] hover:bg-slate-700/80 text-xs font-bold text-slate-200 border border-[#1E88E5]/30 transition-colors"
              title={t('selectLanguage')}
            >
              <span>{currentLangObj.flag}</span>
              <span className="uppercase">{currentLangObj.code}</span>
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1 w-36 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-1 z-50 space-y-0.5">
                {LANGUAGES.map(item => (
                  <button
                    key={item.code}
                    onClick={() => {
                      playClickSound();
                      changeLanguage(item.code as LanguageCode);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                      lang === item.code
                        ? 'bg-[#1E88E5]/20 text-[#1E88E5] font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.flag}</span>
                      <span>{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download App Trigger Button (Desktop/Tablet) */}
          {onOpenDownloadApp && (
            <button
              onClick={() => {
                playClickSound();
                onOpenDownloadApp();
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151D30] hover:bg-[#1E88E5]/20 text-[#1E88E5] border border-[#1E88E5]/30 transition-all text-xs font-bold shadow-xs active:scale-95"
              title={t('downloadApp')}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#1E88E5]" />
              <span>App</span>
            </button>
          )}

          {/* Profile / Admin Quick Access */}
          <button
            onClick={() => {
              playClickSound();
              onOpenProfile();
            }}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 transition-colors hidden sm:flex"
            title={t('profile')}
          >
            <User className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar for Quick Switching with Turquoise underline active state */}
      <div className="flex md:hidden items-center justify-around bg-[#070b14] px-2 py-1 border-t border-slate-800/60">
        <button
          onClick={() => {
            playClickSound();
            onSelectModule('sports');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-bold transition-all ${
            activeModule === 'sports'
              ? 'text-white border-b-[3px] border-[#00E5FF] shadow-[0_4px_12px_rgba(0,229,255,0.35)]'
              : 'text-slate-400 hover:text-white border-b-[3px] border-transparent'
          }`}
        >
          ⚽ {t('sports')}
        </button>
        <button
          onClick={() => {
            playClickSound();
            onSelectModule('casino');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-bold transition-all ${
            activeModule === 'casino'
              ? 'text-white border-b-[3px] border-[#00E5FF] shadow-[0_4px_12px_rgba(0,229,255,0.35)]'
              : 'text-slate-400 hover:text-white border-b-[3px] border-transparent'
          }`}
        >
          🎰 {t('casino')}
        </button>
        <button
          onClick={() => {
            playClickSound();
            onSelectModule('borlette');
          }}
          className={`flex-1 py-1.5 text-center text-xs font-bold transition-all ${
            activeModule === 'borlette'
              ? 'text-white border-b-[3px] border-[#00E5FF] shadow-[0_4px_12px_rgba(0,229,255,0.35)]'
              : 'text-slate-400 hover:text-white border-b-[3px] border-transparent'
          }`}
        >
          🎟️ {t('borlette')}
        </button>
      </div>
    </header>
  );
};

