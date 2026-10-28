/**
 * Full Bet - Modil Rezilyans pou Entènèt Fèb ak Mòd San Entènèt (Offline)
 * Asire tout done match, bòlèt, kazino, ak fich yo toujou disponib menm lè rezo Ayiti a koupe oswa ralanti.
 */

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_PREFIX = 'fb_cache_';
const QUEUE_KEY = 'fb_offline_action_queue';

export function saveToOfflineCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(envelope));
  } catch (err) {
    console.warn('[OfflineCache] Impossible de sauvegarder en cache local:', err);
  }
}

export function getFromOfflineCache<T>(key: string, fallback?: T): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return fallback ?? null;
    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    return envelope.data;
  } catch {
    return fallback ?? null;
  }
}

export function getCacheAgeSeconds(key: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const envelope = JSON.parse(raw);
    return Math.round((Date.now() - envelope.timestamp) / 1000);
  } catch {
    return null;
  }
}

export interface QueuedAction {
  id: string;
  type: 'place_bet' | 'borlette_ticket' | 'deposit_proof' | 'profile_update';
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
}

export function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>): QueuedAction {
  const item: QueuedAction = {
    ...action,
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    retries: 0
  };

  try {
    const existing: QueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    existing.push(item);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('[OfflineQueue] Erreur d’ajout à la file d’attente:', err);
  }

  return item;
}

export function getQueuedOfflineActions(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function removeQueuedOfflineAction(id: string): void {
  try {
    const existing: QueuedAction[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('[OfflineQueue] Erreur de suppression:', err);
  }
}

/**
 * Resilient fetch:
 * En cas de réseau lent ou hors-ligne, répond immédiatement depuis le cache local
 * tout en rafraîchissant les données en arrière-plan (Stale-While-Revalidate).
 */
export async function resilientFetch<T>(
  url: string,
  options?: RequestInit & {
    cacheKey?: string;
    timeoutMs?: number;
    fallbackData?: T;
  }
): Promise<{ data: T; fromCache: boolean; cacheAgeSec?: number }> {
  const cacheKey = options?.cacheKey || url;
  const timeoutMs = options?.timeoutMs || 4500; // 4.5s max pou rezo fèb
  const cachedData = getFromOfflineCache<T>(cacheKey, options?.fallbackData);
  const cacheAge = getCacheAgeSeconds(cacheKey) ?? undefined;

  // Si appareil hors ligne, retour direct du cache local
  if (typeof navigator !== 'undefined' && !navigator.onLine && cachedData !== null) {
    return { data: cachedData, fromCache: true, cacheAgeSec: cacheAge };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data: T = await response.json();
    // Sauvegarder dans le cache local hors-ligne
    saveToOfflineCache(cacheKey, data);
    return { data, fromCache: false };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[ResilientFetch] Rezo fèb oswa echèk pou ${url}. Itilize done lokal:`, err);

    if (cachedData !== null) {
      return { data: cachedData, fromCache: true, cacheAgeSec: cacheAge };
    }

    if (options?.fallbackData !== undefined) {
      return { data: options.fallbackData, fromCache: true };
    }

    throw err;
  }
}
