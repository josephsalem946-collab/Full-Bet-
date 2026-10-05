import {
  UserProfile,
  Transaction,
  MatchEvent,
  PlacedBet,
  BorletteTicket,
  BorletteDrawResult,
  AdminSettings,
  AppNotification
} from '../types';

export const HTG_TO_USD_RATE = 132.5; // 1 USD ≈ 132.50 HTG

export const DEFAULT_USER: UserProfile = {
  id: 'usr-80491',
  fullName: 'Utilisateur',
  phone: 'Numéro masqué',
  email: 'Non renseigné',
  balanceHTG: 12500, // Solde initial
  isVerified18: true,
  biometricsEnabled: true,
  isBlocked: false,
  joinedDate: '2026-09-01',
  moncashNumber: 'Numéro masqué',
  natcashNumber: 'Numéro masqué'
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminEmail: 'josephsalem946@gmail.com',
  welcomeBonusHTG: 500,
  borletteLot1Multiplier: 50,
  borletteLot2Multiplier: 20,
  borletteLot3Multiplier: 10,
  borletteMariageMultiplier: 1000,
  maintenanceMode: false,
  supportContactEmail: 'fullbet509@gmail.com'
};

export const INITIAL_MATCHES: MatchEvent[] = [
  {
    id: 'evt_101',
    sport: 'football',
    league: 'UEFA Champions League',
    country: 'Europe',
    homeTeam: 'Real Madrid',
    awayTeam: 'Manchester City',
    homeScore: 2,
    awayScore: 1,
    isLive: true,
    minute: 72,
    isNew: true,
    createdAt: new Date().toISOString(),
    startTime: "72' En Direct",
    odds: {
      '1X2': [
        { id: 'odd_1', name: '1', marketName: '1X2', rate: 1.65, trend: 'up' },
        { id: 'odd_x', name: 'X', marketName: '1X2', rate: 3.80, trend: 'stable' },
        { id: 'odd_2', name: '2', marketName: '1X2', rate: 4.75, trend: 'down' }
      ],
      'totalGoals': [
        { id: 'odd_over_35', name: '+3.5', marketName: 'Total Buts', rate: 1.85, trend: 'stable' },
        { id: 'odd_under_35', name: '-3.5', marketName: 'Total Buts', rate: 1.95, trend: 'stable' }
      ]
    },
    sideMarkets: [
      {
        id: 'mkt_total_goals',
        name: 'Total Buts (Plus/Moins 3.5)',
        odds: [
          { label: 'Plus de 3.5', value: 1.85 },
          { label: 'Moins de 3.5', value: 1.95 }
        ]
      }
    ]
  },
  {
    id: 'evt_102',
    sport: 'football',
    league: 'La Liga',
    country: 'Espagne',
    homeTeam: 'FC Barcelone',
    awayTeam: 'Atlético Madrid',
    homeScore: 0,
    awayScore: 0,
    isLive: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    startTime: '20:00',
    odds: {
      '1X2': [
        { id: 'odd_fcb_1', name: '1', marketName: '1X2', rate: 1.95, trend: 'stable' },
        { id: 'odd_fcb_x', name: 'X', marketName: '1X2', rate: 3.40, trend: 'stable' },
        { id: 'odd_fcb_2', name: '2', marketName: '1X2', rate: 3.90, trend: 'stable' }
      ]
    }
  },
  {
    id: 'match_classic_fr',
    sport: 'football',
    league: 'Ligue 1',
    country: 'France',
    homeTeam: 'Paris SG',
    awayTeam: 'Marseille',
    homeScore: 2,
    awayScore: 1,
    isLive: true,
    minute: 64,
    isNew: true,
    createdAt: new Date().toISOString(),
    startTime: '64\' En Direct',
    odds: {
      '1X2': [
        { id: 'm_fr_1', name: '1', marketName: '1X2', rate: 1.85 },
        { id: 'm_fr_x', name: 'N', marketName: '1X2', rate: 3.60 },
        { id: 'm_fr_2', name: '2', marketName: '1X2', rate: 4.20 }
      ],
      'totalGoals': [
        { id: 'm_fr_o25', name: '+2.5', marketName: 'Total Buts', rate: 1.70 },
        { id: 'm_fr_u25', name: '-2.5', marketName: 'Total Buts', rate: 2.05 }
      ],
      'doubleChance': [
        { id: 'm_fr_1x', name: '1N', marketName: 'Double Chance', rate: 1.22 },
        { id: 'm_fr_12', name: '12', marketName: 'Double Chance', rate: 1.28 },
        { id: 'm_fr_x2', name: 'N2', marketName: 'Double Chance', rate: 1.90 }
      ]
    },
    sideMarkets: [
      {
        id: 'double_chance',
        name: 'Double Chance',
        odds: [
          { label: '1N', value: 1.22 },
          { label: '12', value: 1.28 },
          { label: 'N2', value: 1.90 }
        ]
      },
      {
        id: 'over_under_2_5',
        name: 'Total Buts (Plus/Moins 2.5)',
        odds: [
          { label: '+ 2.5', value: 1.70 },
          { label: '- 2.5', value: 2.05 }
        ]
      },
      {
        id: 'btts',
        name: 'Les deux équipes marquent',
        odds: [
          { label: 'Oui', value: 1.62 },
          { label: 'Non', value: 2.10 }
        ]
      }
    ]
  },
  {
    id: 'm-uefa-2',
    sport: 'football',
    league: 'Ligue des Champions',
    country: 'Europe',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Paris Saint-Germain',
    homeScore: 1,
    awayScore: 1,
    isLive: true,
    minute: 54,
    isNew: false,
    startTime: 'En Direct',
    odds: {
      '1X2': [
        { id: 'm2-1', name: '1', marketName: '1X2', rate: 2.45 },
        { id: 'm2-x', name: 'N', marketName: '1X2', rate: 3.10 },
        { id: 'm2-2', name: '2', marketName: '1X2', rate: 2.85 }
      ],
      'totalGoals': [
        { id: 'm2-o25', name: '+2.5', marketName: 'Total Buts', rate: 1.70 },
        { id: 'm2-u25', name: '-2.5', marketName: 'Total Buts', rate: 2.10 }
      ]
    },
    sideMarkets: [
      {
        id: 'btts',
        name: 'Les 2 équipes marquent (BTTS)',
        odds: [
          { label: 'Oui', value: 1.65 },
          { label: 'Non', value: 2.15 }
        ]
      },
      {
        id: 'over_under_2_5',
        name: 'Total de buts (Plus / Moins de 2.5)',
        odds: [
          { label: '+ 2.5', value: 1.70 },
          { label: '- 2.5', value: 2.10 }
        ]
      },
      {
        id: 'double_chance',
        name: 'Double Chance',
        odds: [
          { label: '1X', value: 1.40 },
          { label: '12', value: 1.30 },
          { label: 'X2', value: 1.55 }
        ]
      }
    ]
  },
  {
    id: 'm-epl-1',
    sport: 'football',
    league: 'Premier League',
    country: 'Angleterre',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    isLive: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    startTime: 'Aujourd\'hui 15:00',
    odds: {
      '1X2': [
        { id: 'm3-1', name: '1', marketName: '1X2', rate: 1.85 },
        { id: 'm3-x', name: 'N', marketName: '1X2', rate: 3.65 },
        { id: 'm3-2', name: '2', marketName: '1X2', rate: 4.10 }
      ],
      'totalGoals': [
        { id: 'm3-o25', name: '+2.5', marketName: 'Total Buts', rate: 1.80 },
        { id: 'm3-u25', name: '-2.5', marketName: 'Total Buts', rate: 1.95 }
      ],
      'doubleChance': [
        { id: 'm3-1x', name: '1X', marketName: 'Double Chance', rate: 1.22 },
        { id: 'm3-x2', name: 'X2', marketName: 'Double Chance', rate: 1.92 }
      ]
    },
    sideMarkets: [
      {
        id: 'btts',
        name: 'Les 2 équipes marquent (BTTS)',
        odds: [
          { label: 'Oui', value: 1.72 },
          { label: 'Non', value: 2.02 }
        ]
      },
      {
        id: 'double_chance',
        name: 'Double Chance',
        odds: [
          { label: '1X', value: 1.22 },
          { label: '12', value: 1.28 },
          { label: 'X2', value: 1.92 }
        ]
      }
    ]
  },
  {
    id: 'm-epl-2',
    sport: 'football',
    league: 'Premier League',
    country: 'Angleterre',
    homeTeam: 'Liverpool',
    awayTeam: 'Manchester United',
    isLive: false,
    isNew: false,
    startTime: 'Aujourd\'hui 17:30',
    odds: {
      '1X2': [
        { id: 'm4-1', name: '1', marketName: '1X2', rate: 1.60 },
        { id: 'm4-x', name: 'N', marketName: '1X2', rate: 4.20 },
        { id: 'm4-2', name: '2', marketName: '1X2', rate: 5.00 }
      ],
      'totalGoals': [
        { id: 'm4-o25', name: '+2.5', marketName: 'Total Buts', rate: 1.50 },
        { id: 'm4-u25', name: '-2.5', marketName: 'Total Buts', rate: 2.50 }
      ]
    },
    sideMarkets: [
      {
        id: 'over_under_2_5',
        name: 'Total de buts (Plus / Moins de 2.5)',
        odds: [
          { label: '+ 2.5', value: 1.50 },
          { label: '- 2.5', value: 2.50 }
        ]
      },
      {
        id: 'btts',
        name: 'Les 2 équipes marquent (BTTS)',
        odds: [
          { label: 'Oui', value: 1.60 },
          { label: 'Non', value: 2.20 }
        ]
      }
    ]
  },
  {
    id: 'm-laliga-1',
    sport: 'football',
    league: 'La Liga',
    country: 'Espagne',
    homeTeam: 'FC Barcelone',
    awayTeam: 'Atletico Madrid',
    isLive: false,
    isNew: true,
    createdAt: new Date().toISOString(),
    startTime: 'Demain 20:45',
    odds: {
      '1X2': [
        { id: 'm5-1', name: '1', marketName: '1X2', rate: 1.92 },
        { id: 'm5-x', name: 'N', marketName: '1X2', rate: 3.50 },
        { id: 'm5-2', name: '2', marketName: '1X2', rate: 3.90 }
      ]
    },
    sideMarkets: [
      {
        id: 'btts',
        name: 'Les 2 équipes marquent (BTTS)',
        odds: [
          { label: 'Oui', value: 1.70 },
          { label: 'Non', value: 2.05 }
        ]
      },
      {
        id: 'double_chance',
        name: 'Double Chance',
        odds: [
          { label: '1X', value: 1.25 },
          { label: '12', value: 1.28 },
          { label: 'X2', value: 1.80 }
        ]
      }
    ]
  },
  {
    id: 'm-nba-1',
    sport: 'basketball',
    league: 'NBA',
    country: 'USA',
    homeTeam: 'LA Lakers',
    awayTeam: 'Golden State Warriors',
    homeScore: 88,
    awayScore: 92,
    isLive: true,
    minute: 38,
    isNew: false,
    startTime: 'Q3 En Direct',
    odds: {
      '1X2': [
        { id: 'm6-1', name: '1', marketName: 'Vainqueur', rate: 2.05 },
        { id: 'm6-2', name: '2', marketName: 'Vainqueur', rate: 1.75 }
      ]
    },
    sideMarkets: [
      {
        id: 'total_points',
        name: 'Total Points (+/- 224.5)',
        odds: [
          { label: '+ 224.5', value: 1.88 },
          { label: '- 224.5', value: 1.88 }
        ]
      }
    ]
  },
  {
    id: 'm-nba-2',
    sport: 'basketball',
    league: 'NBA',
    country: 'USA',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Milwaukee Bucks',
    isLive: false,
    isNew: false,
    startTime: 'Ce Soir 21:00',
    odds: {
      '1X2': [
        { id: 'm7-1', name: '1', marketName: 'Vainqueur', rate: 1.48 },
        { id: 'm7-2', name: '2', marketName: 'Vainqueur', rate: 2.65 }
      ]
    }
  }
];

export const INITIAL_BORLETTE_RESULTS: BorletteDrawResult[] = [
  {
    id: 'dr-ny-eve-1',
    drawName: 'New York Soir',
    date: 'Aujourd\'hui',
    time: '20:30',
    lot1: '42',
    lot2: '87',
    lot3: '19',
    mariageWin: ['42 × 87', '42 × 19', '87 × 19'],
    isLatest: true
  },
  {
    id: 'dr-fl-eve-1',
    drawName: 'Florida Soir',
    date: 'Aujourd\'hui',
    time: '21:45',
    lot1: '09',
    lot2: '63',
    lot3: '74',
    mariageWin: ['09 × 63', '09 × 74'],
    isLatest: true
  },
  {
    id: 'dr-ny-mid-1',
    drawName: 'New York Midi',
    date: 'Aujourd\'hui',
    time: '14:30',
    lot1: '78',
    lot2: '34',
    lot3: '51',
    mariageWin: ['78 × 34']
  },
  {
    id: 'dr-fl-mid-1',
    drawName: 'Florida Midi',
    date: 'Aujourd\'hui',
    time: '13:30',
    lot1: '25',
    lot2: '90',
    lot3: '11',
    mariageWin: ['25 × 90']
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101',
    type: 'deposit',
    gateway: 'MonCash - Online',
    amount: 5000,
    currency: 'HTG',
    date: '2026-09-22 18:30',
    status: 'approved',
    referenceId: 'MC-98421048',
    phoneNumber: 'Numéro masqué',
    details: 'Recharge MonCash Online confirmée'
  },
  {
    id: 'tx-102',
    type: 'deposit',
    gateway: 'NatCash - Online',
    amount: 3500,
    currency: 'HTG',
    date: '2026-09-21 14:15',
    status: 'approved',
    referenceId: 'NC-58210344',
    phoneNumber: 'Numéro masqué',
    details: 'Recharge NatCash Online confirmée'
  },
  {
    id: 'tx-103',
    type: 'bet_won',
    amount: 4200,
    currency: 'HTG',
    date: '2026-09-20 22:45',
    status: 'approved',
    referenceId: 'GAIN-77491',
    details: 'Pari Sportif gagné (Ligue des Champions)'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Bienvenue sur Full Bet (fullbet.com) !',
    message: 'Votre compte est prêt. Bénéficiez des meilleures cotes sportives, du Casino Crash, de Lucky Six et de la Borlette NY/Florida.',
    time: 'Il y a 2h',
    read: false,
    type: 'admin_announcement'
  },
  {
    id: 'notif-2',
    title: 'Dépôt validé avec succès',
    message: 'Votre recharge de 5,000 HTG via MonCash - Online a été créditée.',
    time: 'Il y a 5h',
    read: true,
    type: 'deposit'
  },
  {
    id: 'notif-3',
    title: 'Résultats New York Soir disponibles',
    message: 'Tirage NY Soir : 1er Lot: 42, 2ème: 87, 3ème: 19. Consultez vos gains !',
    time: 'Hier',
    read: true,
    type: 'borlette_draw'
  }
];

// Local storage key management
const USER_KEY = 'gaincash_user_data';
const TRANSACTIONS_KEY = 'gaincash_transactions';
const BETS_KEY = 'gaincash_bets';
const BORLETTE_TICKETS_KEY = 'gaincash_borlette_tickets';
const NOTIFS_KEY = 'gaincash_notifications';
const ADMIN_KEY = 'gaincash_admin_settings';

export function getStoredUser(): UserProfile {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_USER;
}

export function saveUser(user: UserProfile) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(txs: Transaction[]) {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredBets(): PlacedBet[] {
  try {
    const data = localStorage.getItem(BETS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveBets(bets: PlacedBet[]) {
  try {
    localStorage.setItem(BETS_KEY, JSON.stringify(bets));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredBorletteTickets(): BorletteTicket[] {
  try {
    const data = localStorage.getItem(BORLETTE_TICKETS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveBorletteTickets(tickets: BorletteTicket[]) {
  try {
    localStorage.setItem(BORLETTE_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredNotifications(): AppNotification[] {
  try {
    const data = localStorage.getItem(NOTIFS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifs: AppNotification[]) {
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error(e);
  }
}

export function getStoredAdminSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(ADMIN_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_ADMIN_SETTINGS;
}

export function saveAdminSettings(settings: AdminSettings) {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}
