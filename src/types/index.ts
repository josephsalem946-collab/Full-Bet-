export type GameModule = 'sports' | 'casino' | 'borlette';

export type SportType = 'football' | 'basketball' | 'tennis' | 'baseball';

export interface OddItem {
  id: string;
  name: string; // e.g. "1", "N" / "X", "2", "+2.5", "-2.5", "Oui", "Non"
  marketName: string; // e.g. "1X2", "Total Buts", "Les 2 Marquent"
  rate: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface SideMarketItem {
  id: string;
  name: string; // e.g. "Double Chance", "Total de buts (Plus / Moins de 2.5)", "Les 2 équipes marquent (BTTS)"
  odds: { label: string; value: number }[];
}

export interface MatchEvent {
  id: string;
  sport: SportType;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  isLive: boolean;
  isNew?: boolean;
  createdAt?: string;
  minute?: number;
  startTime: string;
  odds: {
    '1X2': OddItem[];
    'totalGoals'?: OddItem[];
    'doubleChance'?: OddItem[];
    'btts'?: OddItem[];
  };
  sideMarkets?: SideMarketItem[];
}

export interface BetSlipItem {
  matchId: string;
  matchTitle: string;
  league: string;
  marketName: string;
  selectionName: string;
  rate: number;
}

export interface PlacedBet {
  id: string;
  type: 'simple' | 'combine' | 'bet_builder' | 'system';
  items: BetSlipItem[];
  stake: number;
  totalRate: number;
  potentialWin: number;
  placedAt: string;
  status: 'pending' | 'won' | 'lost' | 'cashed_out';
  cashOutValue?: number;
}

export interface BorletteTicketItem {
  type: 'borlette' | 'mariage' | 'lotto3' | 'lotto4' | 'lotto5';
  numbers: string[];
  stake: number;
  potentialWin: number;
}

export interface BorletteTicket {
  id: string;
  drawId: string;
  drawName: string; // e.g. "New York Soir", "Florida Midi"
  date: string;
  items: BorletteTicketItem[];
  totalStake: number;
  potentialWin?: number;
  status: 'pending' | 'won' | 'lost';
  payout?: number;
  placedAt: string;
}

export interface BorletteDrawResult {
  id: string;
  drawName: string;
  date: string;
  time: string;
  lot1: string; // e.g. "45"
  lot2: string; // e.g. "12"
  lot3: string; // e.g. "89"
  mariageWin?: string[];
  isLatest?: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'withdraw' | 'bet_won' | 'bet_stake' | 'bonus';
  gateway?: 'MonCash Online' | 'NatCash Online' | 'NatCash - Online' | 'MonCash - Online' | 'Carte Bancaire' | 'Code Recharge Express' | 'Système' | string;
  amount: number;
  currency: 'HTG';
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  referenceId: string;
  phoneNumber?: string;
  proofImage?: string | null;
  details?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  balanceHTG: number;
  isVerified18: boolean;
  biometricsEnabled: boolean;
  isBlocked: boolean;
  joinedDate: string;
  moncashNumber: string;
  natcashNumber: string;
  role?: 'admin' | 'user';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'deposit' | 'withdrawal' | 'sports_win' | 'borlette_draw' | 'admin_announcement';
}

export interface AdminSettings {
  adminEmail: string;
  welcomeBonusHTG: number;
  borletteLot1Multiplier: number; // 50x
  borletteLot2Multiplier: number; // 20x
  borletteLot3Multiplier: number; // 10x
  borletteMariageMultiplier: number; // 1000x
  maintenanceMode: boolean;
  supportContactEmail: string;
}

// ==========================================
// PANNEAU PROPRIÉTAIRE (SUPER-ADMIN BACKOFFICE)
// ==========================================
export type UserRole = 'CLIENT' | 'AGENT' | 'ADMIN' | 'OWNER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'FROZEN';

export interface ManagedUser {
  id: string;
  phoneOrEmail: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  sanctionReason?: string;
  canPrint: boolean;
  balance: number;
  bonusBalance: number;
  lastIp?: string;
  lastDeviceInfo?: string;
  lastHeartbeat?: string;
  tokenVersion: number;
  createdAt: string;
}

export interface TicketIssuer {
  id: number;
  userId?: string;
  displayIssuerName: string; // Ex: "Banque Centrale Express", "Borlette Delmas 33"
  phoneContact: string;
  headerMessage: string; // Ex: "Bonne Chance !"
  footerMessage: string; // Mentions légales
  isActive: boolean;
  updatedAt: string;
}

export type GameCategoryType = 'SPORTS' | 'CASINO' | 'BORLETTE';

export interface GameConfigItem {
  id: string;
  gameKey: string; // 'borlette_ny_midi', 'casino_roulette', etc.
  name: string;
  category: GameCategoryType;
  isActive: boolean;
  maintenanceMessage?: string;
}

export interface SportsMatchControl {
  id: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  startTime: string;
  isBettingActive: boolean; // Coupe les paris sur CE match
  isLocked: boolean; // Verrouillage d'urgence
}

export type BannerType = 'image' | 'custom_html' | 'google_adsense' | 'ad_network';

export interface AdBanner {
  id: string;
  title: string;
  imageUrl: string;
  redirectUrl: string; // 'sports', 'casino', 'borlette', or external URL
  placement: 'HOME_HERO' | 'PROMO_BAR';
  displayOrder: number;
  isActive: boolean;
  badgeText?: string;
  ctaText?: string;
  startDate?: string;
  endDate?: string;
  // Options avancées pour HTML/CSS, Google AdSense & Régie Publicitaire
  bannerType?: BannerType;
  customHtml?: string;
  customCss?: string;
  adSenseClientId?: string; // ex: 'ca-pub-1234567890123456'
  adSenseSlotId?: string; // ex: '9876543210'
  adSenseFormat?: 'auto' | 'horizontal' | 'rectangle' | 'responsive';
  adNetworkScript?: string; // code/tag script de la régie
  adNetworkIframeUrl?: string; // url iframe de la régie
}

export interface OwnerKPI {
  onlineClientsCount: number;
  totalCashAvailable: number;
  totalDeposits: number;
  totalWithdrawals: number;
  ticketsPendingCount: number;
  ticketsWonCount: number;
  ticketsLostCount: number;
  ticketsTotalCount: number;
  ticketsTotalVolume: number;
}

export interface ActiveFeaturesConfig {
  games: Record<string, boolean>; // { [gameKey]: boolean }
  maintenanceMessages: Record<string, string>;
  lockedMatches: string[];
  banners: AdBanner[];
  ticketIssuerDefault?: TicketIssuer;
}
