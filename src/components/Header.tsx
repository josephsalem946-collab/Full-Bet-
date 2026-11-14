import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Receipt,
  User,
  Bell,
  Trophy,
  Gamepad2,
  Ticket,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile, GameModule } from '../types';
import { GainCashLogo } from './GainCashLogo';
import { playClickSound } from '../utils/audio';
import { useTranslation } from '../context/LanguageContext';
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
  onOpenAssistant?: () => void;
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
  onOpenProfile,
  activeBetsCount,
  unreadNotifsCount
}) => {
  const { t } = useTranslation();
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fullbet_hide_balance') === 'true';
    } catch {
      return false;
    }
  });

  const toggleBalanceVisibility = () => {
    playClickSound();
    setIsBalanceHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fullbet_hide_balance', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const navItems: { id: GameModule; label: string; icon: React.ReactNode }[] = [
    { id: 'sports', label: t('sports'), icon: <Trophy className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} /> },
    { id: 'casino', label: t('casino'), icon: <Gamepad2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} /> },
    { id: 'borlette', label: t('borlette'), icon: <Ticket className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} /> }
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0d1526]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      {/* Primary Single-Row Header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 min-w-0">
        {/* Left: Drawer & Logo */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => {
              playClickSound();
              onOpenDrawer();
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-colors cursor-pointer active:scale-95 flex items-center justify-center"
            aria-label={t('menu')}
          >
            <Menu className="w-4 h-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectModule('sports');
            }}
            className="cursor-pointer shrink-0 flex items-center text-left"
          >
            <GainCashLogo size="sm" showSubtitle={false} />
          </button>
        </div>

        {/* Center: Module Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shrink-0">
          {navItems.map(item => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playClickSound();
                  onSelectModule(item.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Balance (with Eye toggle), Deposit, Minimalist Actions */}
        <div className="header-actions shrink-0">
          {/* Balance, Mask Toggle & Deposit Pill */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-0.5 sm:p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenWallet('deposit');
              }}
              className="pl-2 pr-1 py-1 text-left cursor-pointer"
              title="Mon Portefeuille"
            >
              <span className="font-mono-num font-black text-xs sm:text-sm text-amber-400 whitespace-nowrap block">
                {isBalanceHidden ? '••••• HTG' : `${user.balanceHTG.toLocaleString()} HTG`}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleBalanceVisibility}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
              aria-label={isBalanceHidden ? 'Afficher le montant' : 'Masquer le montant'}
              title={isBalanceHidden ? 'Afficher le montant' : 'Masquer le montant'}
            >
              {isBalanceHidden ? (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
              ) : (
                <Eye className="w-3.5 h-3.5 text-slate-300" strokeWidth={1.75} />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenWallet('deposit');
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              title="Dépôt rapide"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden xs:inline">Dépôt</span>
            </button>
          </div>

          {/* Fiches / BetSlip Button */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenBetSlip();
            }}
            className={`relative px-2 py-1.5 rounded-xl border inline-flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              activeBetsCount > 0
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Ouvrir votre coupon de paris"
          >
            <Receipt className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span className="hidden sm:inline">Fiches</span>
            <span className={`font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeBetsCount > 0 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-300'
            }`}>
              {activeBetsCount}
            </span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenNotifications();
            }}
            className="relative p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white hidden sm:inline-flex items-center justify-center transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" strokeWidth={1.75} />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenProfile();
            }}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white hidden sm:inline-flex items-center justify-center transition-colors cursor-pointer"
            title={t('profile')}
          >
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Mobile Compact Module Tabs */}
      <nav className="flex md:hidden items-center bg-[#090e1a] px-2 py-1.5 border-t border-slate-800/80 gap-1.5">
        {navItems.map(item => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playClickSound();
                onSelectModule(item.id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg inline-flex items-center justify-center gap-1.5 text-[11px] font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
