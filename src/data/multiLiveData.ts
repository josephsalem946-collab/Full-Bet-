export interface MultiLiveGameDef {
  id: string;
  name: string;
  category: string;
  icon: string;
  badge: string;
  badgeColor: string;
  description: string;
}

export const ALL_MULTILIVE_GAMES: MultiLiveGameDef[] = [
  {
    id: 'keno',
    name: 'Keno 20/80',
    category: 'Loto & Arcade',
    icon: '🎲',
    badge: 'LIVE',
    badgeColor: 'bg-amber-500 text-slate-950',
    description: 'Tirage 20 boul sou 80 chak 30 segonn'
  },
  {
    id: 'jetx',
    name: 'JetX Smartsoft',
    category: 'Crash & Multiplikatè',
    icon: '🚀',
    badge: 'LIVE',
    badgeColor: 'bg-cyan-500 text-slate-950',
    description: 'Fizé ki monte ak multiplikatè dinamik'
  },
  {
    id: 'borlette',
    name: 'Borlette NY / FL',
    category: 'Loto Ofisyèl',
    icon: '🎟️',
    badge: 'LIVE',
    badgeColor: 'bg-emerald-500 text-slate-950',
    description: 'Tirajes New York ak Florida Midi/Soir'
  },
  {
    id: 'sports',
    name: 'Paris Sportifs (Live)',
    category: 'Moun Dirèk',
    icon: '⚽',
    badge: 'LIVE',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Match foutbòl an dirèk ak kòt an tan reyèl'
  },
  {
    id: 'crash',
    name: 'Aviator Crash',
    category: 'Crash Game',
    icon: '✈️',
    badge: 'LIVE',
    badgeColor: 'bg-rose-500 text-white',
    description: 'Avyon k ap monte ak Cash Out an dirèk'
  },
  {
    id: 'roulette',
    name: 'Roulette Européenne',
    category: 'Casino Live',
    icon: '🎡',
    badge: 'LIVE',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Wou live ak nimewo wouj/nwa'
  },
  {
    id: 'slots',
    name: 'Machines à Sous 777',
    category: 'Jackpot Slots',
    icon: '🎰',
    badge: 'LIVE',
    badgeColor: 'bg-yellow-500 text-slate-950',
    description: 'Jackpot pwogresif ak roulo k ap vire'
  },
  {
    id: 'lucky6',
    name: 'Lucky 6 Loto',
    category: 'Tirage Boul',
    icon: '🎱',
    badge: 'LIVE',
    badgeColor: 'bg-orange-500 text-white',
    description: 'Tirage 35 boul sou 48 koulè'
  }
];

export const DEFAULT_MULTILIVE_GAME_IDS = ['keno', 'jetx', 'borlette', 'sports'];

export const MULTILIVE_STORAGE_KEY = 'fullbet_multilive_active_games';

export function getStoredMultiLiveGames(): string[] {
  try {
    const raw = localStorage.getItem(MULTILIVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_MULTILIVE_GAME_IDS;
}

export function saveStoredMultiLiveGames(gameIds: string[]): void {
  try {
    localStorage.setItem(MULTILIVE_STORAGE_KEY, JSON.stringify(gameIds));
  } catch {}
}
