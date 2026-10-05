import { Transaction } from '../types';

export interface TransactionLimitStatus {
  count24h: number;
  max24h: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL_LIMIT_REACHED' | 'BLOCKED';
  firstTxDate: Date | null;
  resetAt: string | null;
  remainingMs: number;
  countdownFormatted: string; // HH:MM:SS
  canTransact: boolean;
  titleHt: string;
  mesajHt: string;
  titleFr: string;
  mesajFr: string;
}

/**
 * Format milliseconds into HH:MM:SS
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Parses transaction date string into timestamp
 */
function parseTxTimestamp(dateStr: string): number {
  if (!dateStr) return Date.now();
  // Try standard Date parsing
  const parsed = new Date(dateStr).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // Try extracting french format DD/MM/YYYY HH:MM:SS
  const match = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    const [, d, m, y, h, min, s] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(h || 0), Number(min || 0), Number(s || 0));
    return dt.getTime();
  }

  return Date.now();
}

/**
 * Checks sliding 24-hour limit of 15 transactions per account
 */
export function check24hTransactionLimit(transactions: Transaction[]): TransactionLimitStatus {
  const MAX_LIMIT = 15;
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000;
  const windowStart = now - windowMs;

  // Filter transactions in the last 24 hours
  const recentTxs = transactions
    .map(tx => ({
      ...tx,
      timestamp: parseTxTimestamp(tx.date)
    }))
    .filter(tx => tx.timestamp >= windowStart)
    .sort((a, b) => a.timestamp - b.timestamp); // Oldest first

  const count24h = recentTxs.length;

  let firstTxDate: Date | null = null;
  let resetAt: string | null = null;
  let remainingMs = 0;

  if (recentTxs.length > 0) {
    const oldestTimestamp = recentTxs[0].timestamp;
    firstTxDate = new Date(oldestTimestamp);
    const unblockTimestamp = oldestTimestamp + windowMs;
    remainingMs = Math.max(0, unblockTimestamp - now);
    resetAt = new Date(unblockTimestamp).toISOString();
  }

  const countdownFormatted = formatCountdown(remainingMs);

  let status: 'NORMAL' | 'WARNING' | 'CRITICAL_LIMIT_REACHED' | 'BLOCKED' = 'NORMAL';
  let canTransact = true;

  if (count24h >= 16) {
    status = 'BLOCKED';
    canTransact = false;
  } else if (count24h === 15) {
    status = 'CRITICAL_LIMIT_REACHED';
    canTransact = false;
  } else if (count24h === 14) {
    status = 'WARNING';
    canTransact = true;
  }

  return {
    count24h,
    max24h: MAX_LIMIT,
    status,
    firstTxDate,
    resetAt,
    remainingMs,
    countdownFormatted,
    canTransact,
    titleHt: count24h >= 15
      ? 'ALÈT FULL BET : LIMIT 15 TRANZAKSYON ATENN'
      : 'ATANSYON : 14/15 TRANZAKSYON ITILIZE',
    mesajHt: count24h >= 15
      ? 'Ou atenn limit maksimòm 15 tranzaksyon autorize pa 24 èdtan. Nouvo tranzaksyon yo bloke tanporèman.'
      : 'Ou fin fè 14 tranzaksyon nan 24 èdtan ki sot pase yo. Rete sèlman 1 tranzaksyon disponib anvan kont lan bloke tanporèman pou sekirite.',
    titleFr: count24h >= 15
      ? 'ALERTE FULL BET : LIMITE DE 15 TRANSACTIONS ATTEINTE'
      : 'ATTENTION : 14/15 TRANSACTIONS UTILISÉES',
    mesajFr: count24h >= 15
      ? 'Alerte FULL BET : Vous avez atteint la limite maximale de 15 transactions autorisées par 24 heures.'
      : "Attention : Vous avez effectué 14 transactions dans les dernières 24h. Il ne vous reste qu'une seule transaction disponible."
  };
}
