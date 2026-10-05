// Client API Service for Full Bet (fullbet.com)
// Toutes les clés d'API passent STRICTEMENT par le serveur Node.js / Express.
// Aucune clé secrète ni clé Firebase n'est exposée au navigateur client.

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  error?: string;
  details?: any[];
  user?: any;
  users?: any[];
  sessionToken?: string;
  newBalance?: number;
  transaction?: any;
  transactions?: any[];
  bet?: any;
  ticket?: any;
  cashoutAmount?: number;
  data?: T;
  kpi?: any;
  games?: any;
  matches?: any[];
  lockedMatches?: string[];
  issuers?: any[];
  banners?: any[];
  ticketIssuerDefault?: any;
  maintenanceMessages?: any;
  forceLogout?: boolean;
  alerts?: any[];
  alertStats?: any;
  nodemailerConfig?: any;
  succes?: boolean;
  analyse?: any;
  totalMisesHTG?: number;
  totalGainsPotentielsHTG?: number;
  totalSelectionsCount?: number;
  fichesCount?: number;
  averageMise?: number;
  parisPlusCommuns?: any[];
  fichesDetaillees?: any[];
}

function getStoredSessionToken(): string {
  try {
    return localStorage.getItem('gaincash_session_token') || '';
  } catch {
    return '';
  }
}

export function saveSessionToken(token: string) {
  try {
    localStorage.setItem('gaincash_session_token', token);
  } catch (e) {
    console.error(e);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 429) {
      return {
        status: 'error',
        error: data.error || 'Trop de requêtes. Veuillez patienter un instant avant de réessayer (Rate Limit).'
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        error: data.error || data.message || `Erreur serveur (${res.status})`,
        details: data.details
      };
    }

    return {
      status: 'success',
      ...data
    };
  } catch (err: any) {
    console.warn('[Full Bet API Client] Fallback mode or network error:', err);
    return {
      status: 'error',
      error: 'Impossible de joindre le serveur sécurisé. Vérifiez votre connexion.'
    };
  }
}

// 1. Authentification Firebase via le serveur
export async function serverFirebaseLogin(
  phoneOrEmail: string,
  password?: string,
  extra?: { authProvider?: string; displayName?: string; email?: string }
): Promise<ApiResponse> {
  const res = await apiRequest('/api/auth/firebase-login', {
    method: 'POST',
    body: JSON.stringify({
      phoneOrEmail,
      password,
      authProvider: extra?.authProvider || 'credentials',
      displayName: extra?.displayName,
      email: extra?.email
    })
  });

  if (res.status === 'success' && res.sessionToken) {
    saveSessionToken(res.sessionToken);
  }
  return res;
}

export async function serverFirebaseRegister(payload: {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  isVerified18: boolean;
}): Promise<ApiResponse> {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (res.status === 'success' && res.sessionToken) {
    saveSessionToken(res.sessionToken);
  }
  return res;
}

export async function serverFetchProfile(): Promise<ApiResponse> {
  return apiRequest('/api/auth/profile');
}

// 2. Portefeuille (Wallet) via le serveur avec validation & assainissement
export async function serverSubmitDeposit(payload: {
  gateway: 'MonCash Online' | 'NatCash Online' | 'MonCash - Online' | 'NatCash - Online' | 'Carte Bancaire' | 'Code Recharge Express';
  amount: number;
  referenceId: string;
  phoneNumber?: string;
  cardholderName?: string;
  cardLast4?: string;
  proofImage?: string;
  details?: string;
}): Promise<ApiResponse> {
  return apiRequest('/api/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function serverSubmitWithdraw(payload: {
  gateway: 'MonCash Online' | 'NatCash Online' | 'MonCash - Online' | 'NatCash - Online';
  amount: number;
  phoneNumber: string;
}): Promise<ApiResponse> {
  return apiRequest('/api/wallet/withdraw', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function serverFetchTransactions(): Promise<ApiResponse> {
  return apiRequest('/api/wallet/transactions');
}

// 3. Paris Sportifs & Borlette via le serveur
export async function serverPlaceSportBet(payload: {
  type: 'single' | 'accumulator';
  stake: number;
  selections: Array<{
    matchId: string;
    matchName: string;
    marketName: string;
    selectionName: string;
    odds: number;
  }>;
  totalOdds: number;
  potentialWin: number;
}): Promise<ApiResponse> {
  return apiRequest('/api/bets/sports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function serverCashoutSportBet(betId: string): Promise<ApiResponse> {
  return apiRequest('/api/bets/sports/cashout', {
    method: 'POST',
    body: JSON.stringify({ betId })
  });
}

export async function serverPlaceBorletteBet(payload: {
  drawId: string;
  drawName: string;
  gameType: 'borlette' | 'mariage' | 'lotto3' | 'lotto4' | 'lotto5';
  numbers: string[];
  stake: number;
  multiplier: number;
  potentialWin: number;
}): Promise<ApiResponse> {
  return apiRequest('/api/bets/borlette', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 4. Back-Office Admin & Panneau Propriétaire
export async function serverAdminAction(actionData: {
  action: 'approve_deposit' | 'reject_deposit' | 'update_odds' | 'toggle_user_block' | 'send_push_notification';
  targetId?: string;
  reason?: string;
  multiplierData?: Record<string, number>;
  notificationData?: { title: string; message: string };
}): Promise<ApiResponse> {
  return apiRequest('/api/admin/action', {
    method: 'POST',
    body: JSON.stringify(actionData)
  });
}

// ==========================================
// PANNEAU PROPRIÉTAIRE (SUPER-ADMIN BACKOFFICE)
// ==========================================

export function saveOwnerToken(token: string) {
  try {
    sessionStorage.setItem('gaincash_owner_token', token);
  } catch (e) {
    console.error(e);
  }
}

export function getOwnerToken(): string {
  try {
    return sessionStorage.getItem('gaincash_owner_token') || '';
  } catch {
    return '';
  }
}

export function clearOwnerToken() {
  try {
    sessionStorage.removeItem('gaincash_owner_token');
  } catch (e) {
    console.error(e);
  }
}

export async function ownerRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const ownerToken = getOwnerToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (ownerToken) {
    headers['Authorization'] = `Bearer ${ownerToken}`;
  }

  return apiRequest<T>(endpoint, {
    ...options,
    headers
  });
}

// 1. Vérification 2FA Double Facteur Propriétaire
export async function ownerVerify2FA(email: string, code2FA: string): Promise<ApiResponse> {
  const res = await apiRequest('/api/owner/verify-2fa', {
    method: 'POST',
    body: JSON.stringify({ email, code2FA })
  });
  if (res.status === 'success' && (res as any).token) {
    saveOwnerToken((res as any).token);
  }
  return res;
}

// 2. Récupération des KPI en direct
export async function ownerFetchKPI(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/kpi');
}

// 3. Gestion des jeux & coupe-circuits
export async function ownerFetchGamesConfig(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/games-config');
}

export async function ownerToggleGame(gameKey: string, isActive: boolean, maintenanceMessage?: string): Promise<ApiResponse> {
  return ownerRequest('/api/owner/games-config/toggle', {
    method: 'POST',
    body: JSON.stringify({ gameKey, isActive, maintenanceMessage })
  });
}

export async function ownerToggleMatch(matchId: string, isBettingActive?: boolean, isLocked?: boolean): Promise<ApiResponse> {
  return ownerRequest('/api/owner/matches/toggle', {
    method: 'POST',
    body: JSON.stringify({ matchId, isBettingActive, isLocked })
  });
}

// 4. Émetteurs de fiches (Personnalisation tickets Borlette)
export async function ownerFetchTicketIssuers(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/ticket-issuers');
}

export async function ownerSaveTicketIssuer(payload: {
  id?: number;
  displayIssuerName: string;
  phoneContact: string;
  headerMessage: string;
  footerMessage: string;
  isActive?: boolean;
}): Promise<ApiResponse> {
  return ownerRequest('/api/owner/ticket-issuers/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function requestPrintThermalTicket(payload: {
  ticketId?: string;
  drawName?: string;
  numbers?: string[];
  stake?: number;
  potentialWin?: number;
}): Promise<ApiResponse> {
  return apiRequest('/api/tickets/print', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 5. Sanctions Clients & Invalidation de Session
export async function ownerFetchUsers(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/users');
}

export async function ownerApplySanction(payload: {
  userId: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'FROZEN';
  sanctionReason?: string;
  canPrint?: boolean;
  balanceAdjustment?: number;
}): Promise<ApiResponse> {
  return ownerRequest('/api/owner/sanction', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// 6. Bannières Publicitaires Dynamiques (sans mise à jour des stores)
export async function ownerFetchBanners(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/banners');
}

export async function ownerSaveBanner(payload: {
  id?: string;
  title: string;
  imageUrl?: string;
  redirectUrl?: string;
  placement?: 'HOME_HERO' | 'PROMO_BAR';
  displayOrder?: number;
  isActive?: boolean;
  badgeText?: string;
  ctaText?: string;
  bannerType?: 'image' | 'custom_html' | 'google_adsense' | 'ad_network';
  customHtml?: string;
  customCss?: string;
  adSenseClientId?: string;
  adSenseSlotId?: string;
  adSenseFormat?: 'auto' | 'horizontal' | 'rectangle' | 'responsive';
  adNetworkScript?: string;
  adNetworkIframeUrl?: string;
}): Promise<ApiResponse> {
  return ownerRequest('/api/owner/banners/save', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function ownerDeleteBanner(id: string): Promise<ApiResponse> {
  return ownerRequest(`/api/owner/banners/${id}`, {
    method: 'DELETE'
  });
}

// 7. Bootstrap public & Heartbeat
export async function fetchActiveFeaturesConfig(): Promise<ApiResponse> {
  return apiRequest('/api/config/active-features');
}

export async function sendClientHeartbeat(): Promise<ApiResponse> {
  return apiRequest('/api/system/heartbeat', {
    method: 'POST'
  });
}

// 8. Gestion des Risques & Alertes E-mail Nodemailer (Panneau Propriétaire 2FA HQ)
export async function serverAnalyserFiche(payload: {
  idClient?: string;
  nomClient?: string;
  categorie?: string;
  typePari?: string;
  nombreSelections?: number;
  mise: number;
  coteTotale: number;
  gainPotentiel: number;
  aBoostCotes?: boolean;
  estNouveauCompte?: boolean;
}): Promise<ApiResponse> {
  return apiRequest('/api/analyser-fiche', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function ownerFetchRiskAlerts(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/risk-alerts');
}

export async function ownerRiskAlertAction(alertId: string, action: 'valider' | 'geler' | 'rejeter'): Promise<ApiResponse> {
  return ownerRequest('/api/owner/risk-alerts/action', {
    method: 'POST',
    body: JSON.stringify({ alertId, action })
  });
}

export async function ownerFetchFichesSelections(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/fiches-selections');
}
