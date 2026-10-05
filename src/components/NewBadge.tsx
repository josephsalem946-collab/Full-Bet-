import React from 'react';
import { useTranslation } from '../context/LanguageContext';

export interface BetNewProps {
  isNew?: boolean;
  createdAt?: string;
}

export function isBetNew(bet?: BetNewProps | null): boolean {
  if (!bet) return false;
  if (bet.isNew === true) return true;

  if (bet.createdAt) {
    const betDate = new Date(bet.createdAt).getTime();
    const now = Date.now();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return (now - betDate) <= twentyFourHoursInMs;
  }

  return false;
}

export function NewBadge({ isNew, createdAt, label }: BetNewProps & { label?: string }) {
  const { t } = useTranslation();
  const shouldDisplay = isBetNew({ isNew, createdAt });

  if (!shouldDisplay) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-black bg-[#00E5FF] rounded-full shadow-[0_0_8px_rgba(0,229,255,0.6)] animate-pulse select-none">
      {label || t('new')}
    </span>
  );
}
