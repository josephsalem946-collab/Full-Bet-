export interface GameItem {
  id: number;
  title: string;
  category: string;
  description: string;
  emoji: string;
  badge?: string;
  badgeColor?: string;
  casinoId?: 'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix';
  targetModule?: 'sports' | 'casino' | 'borlette';
  multiplier?: string;
}

export const TOP_15_GAMES: GameItem[] = [
  {
    id: 1,
    title: 'Gates of Olympus',
    category: 'Machine à Sous',
    description: 'Mekanik Pay Anywhere ak miltiplikatè Zeus.',
    emoji: '⚡',
    badge: 'x5000',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: '5 000x'
  },
  {
    id: 2,
    title: 'Lightning Roulette',
    category: 'Casino en Direct',
    description: 'Woulet ak zèklè ki bay miltiplikatè jiska 500x.',
    emoji: '🎡',
    badge: '500x',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    casinoId: 'roulette',
    targetModule: 'casino',
    multiplier: '500x'
  },
  {
    id: 3,
    title: 'Aviator',
    category: 'Jeu Crash',
    description: 'Avyon an ap monte, retire lajan w anvan l vole ale.',
    emoji: '✈️',
    badge: 'x1000',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    casinoId: 'crash',
    targetModule: 'casino',
    multiplier: '100x+'
  },
  {
    id: 4,
    title: 'Crazy Time',
    category: 'Live Show',
    description: 'Wou fòtin ak mini-jeux an 3D.',
    emoji: '🎪',
    badge: 'Bonus 3D',
    badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    casinoId: 'roulette',
    targetModule: 'casino',
    multiplier: 'x2000'
  },
  {
    id: 5,
    title: 'Le Blackjack en Ligne',
    category: 'Stratégie & Table',
    description: 'Taux de retour (RTP) ki toupre 99%.',
    emoji: '🃏',
    badge: '99% RTP',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: '3:2'
  },
  {
    id: 6,
    title: 'Sweet Bonanza',
    category: 'Machine à Sous',
    description: 'Linivè bonbon ak kaskad ak bonm miltiplikatè.',
    emoji: '🍭',
    badge: 'x100 Bonm',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: 'x100'
  },
  {
    id: 7,
    title: 'Les Paris Sportifs en Direct',
    category: 'Paris en Ligne',
    description: 'Pari an tan reyèl sou foutbòl ak lòt espò.',
    emoji: '⚽',
    badge: 'Live Odds',
    badgeColor: 'bg-blue-500/20 text-cyan-400 border-cyan-500/30',
    targetModule: 'sports',
    multiplier: 'Cotes Max'
  },
  {
    id: 8,
    title: "Le Poker Texas Hold'em",
    category: 'Jeu de Compétition',
    description: 'Jwèt kat PvP kote blòf ak estrateji konte.',
    emoji: '♠️',
    badge: 'PvP',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: 'Pot Total'
  },
  {
    id: 9,
    title: 'Mega Moolah',
    category: 'Jackpot Progressif',
    description: 'Cagnottes rekò mondyal ki gen plizyè milyon.',
    emoji: '💰',
    badge: 'Jackpot M$',
    badgeColor: 'bg-amber-500/20 text-yellow-300 border-yellow-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: 'Progressif'
  },
  {
    id: 10,
    title: 'Monopoly Live',
    category: 'Live Show',
    description: 'Monopoly an reyalite ogmante sou rou fòtin.',
    emoji: '🎩',
    badge: 'AR 3D',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    casinoId: 'roulette',
    targetModule: 'casino',
    multiplier: 'x500'
  },
  {
    id: 11,
    title: 'Le Baccara en Direct',
    category: 'Jeu de Table',
    description: 'Senp, rapid, san komisyon sou bankye a.',
    emoji: '🎴',
    badge: '0% Comm',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    casinoId: 'roulette',
    targetModule: 'casino',
    multiplier: '1:1'
  },
  {
    id: 12,
    title: 'Plinko',
    category: 'Jeu Instantané',
    description: 'Boul k ap desann sou yon piramid pikòt.',
    emoji: '📍',
    badge: '1 000x',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    casinoId: 'crash',
    targetModule: 'casino',
    multiplier: '1 000x'
  },
  {
    id: 13,
    title: 'Book of Dead',
    category: 'Machine à Sous',
    description: 'Klasik peyi Lejip ak senbòl extensible.',
    emoji: '📜',
    badge: 'Free Spins',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: 'x5000'
  },
  {
    id: 14,
    title: "L'Ultimate Texas Hold'em",
    category: 'Poker de Casino',
    description: 'Jwèt pokè dirèkteman kont bank la/kroupye.',
    emoji: '♥️',
    badge: 'vs Dealer',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: 'x500'
  },
  {
    id: 15,
    title: 'Le Vidéo Poker (Jacks or Better)',
    category: 'Jeu de Table',
    description: 'Melanj ant plas ak pokè fèmen a 5 kat.',
    emoji: '🂡',
    badge: 'Jacks+',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    casinoId: 'slots',
    targetModule: 'casino',
    multiplier: '800:1'
  },
  // Arcades exclusives Full Bet
  {
    id: 16,
    title: 'Lucky Six 6/48',
    category: 'Arcade Loto',
    description: 'Loto Visuel 6/48 Officiel avec cotes dynamiques.',
    emoji: '🎱',
    badge: '10 000x',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    casinoId: 'luckysix',
    targetModule: 'casino',
    multiplier: '10 000x'
  },
  {
    id: 17,
    title: 'Lucky X (50 Boules)',
    category: 'Arcade Rapide',
    description: 'Matrice 5x10 et tirage éclair de 50 boules.',
    emoji: '⚡',
    badge: 'HOT',
    badgeColor: 'bg-cyan-500/20 text-[#00E5FF] border-cyan-500/30',
    casinoId: 'luckyx',
    targetModule: 'casino',
    multiplier: 'HOT'
  },
  {
    id: 18,
    title: 'JetX (SmartSoft Gaming)',
    category: 'Jeu Crash Supersonique',
    description: 'Chasseur à réaction, éjection de parachutistes et multiplicateurs jusqu’à 10 000x.',
    emoji: '🚀',
    badge: 'SMARTSOFT',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    casinoId: 'jetx',
    targetModule: 'casino',
    multiplier: '10 000x'
  },
  {
    id: 19,
    title: 'Keno (20/80)',
    category: 'Loterie Éclair',
    description: 'Tirage de 20 boules parmi 80 avec paris spéciaux Over/Under et parité.',
    emoji: '🎯',
    badge: '50 000x',
    badgeColor: 'bg-blue-500/20 text-cyan-300 border-cyan-500/40',
    casinoId: 'keno',
    targetModule: 'casino',
    multiplier: '50 000x'
  }
];
