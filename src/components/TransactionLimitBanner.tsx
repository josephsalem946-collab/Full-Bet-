import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ShieldAlert, Sparkles, X } from 'lucide-react';
import { Transaction } from '../types';
import { check24hTransactionLimit, formatCountdown } from '../utils/transactionLimit';
import { useLanguage } from '../context/LanguageContext';

interface TransactionLimitBannerProps {
  transactions: Transaction[];
  onOpenRules?: () => void;
}

export const TransactionLimitBanner: React.FC<TransactionLimitBannerProps> = ({
  transactions,
  onOpenRules
}) => {
  const { lang } = useLanguage();
  const [limitStatus, setLimitStatus] = useState(() => check24hTransactionLimit(transactions));
  const [remainingTimeMs, setRemainingTimeMs] = useState(limitStatus.remainingMs);
  const [isDismissed, setIsDismissed] = useState(false);

  // Recalculate on transactions change
  useEffect(() => {
    const updated = check24hTransactionLimit(transactions);
    setLimitStatus(updated);
    setRemainingTimeMs(updated.remainingMs);
    setIsDismissed(false);
  }, [transactions]);

  // Live ticking countdown every second
  useEffect(() => {
    if (limitStatus.status !== 'CRITICAL_LIMIT_REACHED' && limitStatus.status !== 'BLOCKED') {
      return;
    }

    const interval = setInterval(() => {
      setRemainingTimeMs((prev) => {
        if (prev <= 1000) {
          // Recheck limit
          const fresh = check24hTransactionLimit(transactions);
          setLimitStatus(fresh);
          return fresh.remainingMs;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [limitStatus.status, transactions]);

  if (limitStatus.status === 'NORMAL' || (isDismissed && limitStatus.status === 'WARNING')) {
    return null;
  }

  const isCritical = limitStatus.status === 'CRITICAL_LIMIT_REACHED' || limitStatus.status === 'BLOCKED';
  const countdown = formatCountdown(remainingTimeMs);

  const title = lang === 'ht' ? limitStatus.titleHt : limitStatus.titleFr;
  const message = lang === 'ht' ? limitStatus.mesajHt : limitStatus.mesajFr;

  return (
    <div
      className={`w-full border-b transition-all animate-in fade-in duration-300 ${
        isCritical
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-500 shadow-md'
          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-xs">
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wide uppercase font-display text-[13px]">
                {title}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-white/25 font-mono font-bold text-[10px]">
                {limitStatus.count24h}/15
              </span>
            </div>
            <p className="text-white/95 text-[11px] leading-snug mt-0.5">
              {message}
            </p>
          </div>
        </div>

        {/* Action & Countdown */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {isCritical ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 backdrop-blur-xs font-mono shadow-xs">
              <Clock className="w-4 h-4 text-amber-300 animate-spin" />
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 block">
                  {lang === 'ht' ? 'Deblokaj nan' : 'Déblocage dans'}
                </span>
                <span className="text-sm font-black text-amber-300 tracking-wider">
                  {countdown}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-white/90 bg-black/20 px-2.5 py-1 rounded-lg">
              {lang === 'ht' ? '1 tranzaksyon rete' : '1 transaction restante'}
            </span>
          )}

          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="px-2.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-[11px] transition-transform active:scale-95 shadow-xs"
            >
              {lang === 'ht' ? 'Règ 24h' : 'Règles 24h'}
            </button>
          )}

          {!isCritical && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
