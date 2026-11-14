import React from 'react';
import { Menu, User, Bot } from 'lucide-react';
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
  onSelectModule,
  onOpenDrawer,
  onOpenProfile,
  onOpenAssistant
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0d1526]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="flex items-center justify-between w-full px-4 h-14">
        {/* À gauche : Icône hamburger (3 lignes blanches) + Logo Full Bet et écriture Full Bet */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenDrawer();
            }}
            className="text-white hover:text-slate-200 transition-colors cursor-pointer active:scale-95 flex items-center justify-center p-1"
            aria-label={t('menu')}
          >
            <Menu className="w-6 h-6 text-white" strokeWidth={2} />
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

        {/* Au centre : Grand espace vide totalement libre */}
        <div className="flex-1" aria-hidden="true" />

        {/* À l'extrême droite : Icône d'assistance (taille minime) juste à côté de l'icône de profil */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenAssistant && (
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenAssistant();
              }}
              className="text-slate-200 hover:text-white transition-colors cursor-pointer active:scale-95 shrink-0 flex items-center justify-center p-1"
              aria-label="Assistant Virtuel Full Bet"
              title="Assistant Virtuel Full Bet (Paiements, Support, Aide)"
            >
              <Bot className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenProfile();
            }}
            className="text-white hover:text-slate-200 transition-colors cursor-pointer active:scale-95 shrink-0 flex items-center justify-center p-1"
            aria-label={t('profile')}
            title={t('profile')}
          >
            <User className="w-6 h-6 text-white" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
};

