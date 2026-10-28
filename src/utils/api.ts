// Client API Service for Full Bet (fullbet.com)
// Toutes les clés d'API passent STRICTEMENT par le serveur Node.js / Express.
// Aucune clé secrète ni clé Firebase n'est exposée au navigateur client.

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  error?: string;
  reply?: string;
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
  success?: boolean;
  keys?: any[];
  analyse?: any;
  paymentMethods?: any[];
  blockedPaymentMethods?: string[];
  notices?: Record<string, string>;
  totalMisesHTG?: number;
  totalGainsPotentielsHTG?: number;
  totalSelectionsCount?: number;
  fichesCount?: number;
  averageMise?: number;
  parisPlusCommuns?: any[];
  fichesDetaillees?: any[];
  freedStorageKB?: number;
  serverMemoryUsage?: string;
  serverDiskStatus?: string;
  [key: string]: any;
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

export function clearSessionToken() {
  try {
    localStorage.removeItem('gaincash_session_token');
  } catch (e) {
    console.error(e);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number; allowOfflineCache?: boolean } = {}
): Promise<ApiResponse<T>> {
  const token = getStoredSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const cacheKey = `fb_api_cache_${endpoint}`;

  // Si appareil hors-ligne et requête GET, servir immédiatement le cache local
  if (typeof navigator !== 'undefined' && !navigator.onLine && isGet) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { status: 'success', ...parsed, _fromOfflineCache: true };
      }
    } catch {}
  }

  const timeoutMs = options.timeoutMs || (typeof navigator !== 'undefined' && !navigator.onLine ? 1500 : 5000);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

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

    // Sauvegarder les données GET valides en cache local
    if (isGet && data) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}
    }

    return {
      status: 'success',
      ...data
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn('[Full Bet API Client] Rezo fèb oswa erè rezo pou ' + endpoint, err);

    // Fallback vers le cache local si disponible
    if (isGet) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { status: 'success', ...parsed, _fromOfflineCache: true };
        }
      } catch {}
    }

    return {
      status: 'error',
      error: 'Koneksyon an fèb oswa entènèt la koupe. Done ki anrejistre yo rete disponib.'
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
  gateway: 'MonCash Online' | 'NatCash Online' | 'MonCash - Online' | 'NatCash - Online' | 'Carte Bancaire' | 'Code Recharge Express' | 'NOWPayments Crypto' | 'Crypto (USDT, BTC, ETH, TRX)' | 'Crypto';
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

// ==============================================================
// NOWPayments Crypto Integration (USDT TRC20, BTC, ETH, TRX)
// ==============================================================
export interface NowPaymentsInvoiceData {
  payment_id: string;
  invoice_id: string;
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'finished' | 'failed' | 'expired' | 'partially_paid';
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid?: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  purchase_id: string;
  qr_code_url: string;
}

export interface CryptoMobileUiState {
  available_currencies: Array<'btc' | 'eth' | 'trx' | 'usdttrc20'>;
  selected_currency: 'btc' | 'eth' | 'trx' | 'usdttrc20';
  display_data: {
    target_amount: string;
    wallet_address: string;
    qr_code_image_url: string;
    copy_action_enabled: boolean;
  };
}

export interface NowPaymentsCreateResponse {
  status: 'success' | 'error';
  message?: string;
  data?: NowPaymentsInvoiceData;
  mobile_ui_state?: CryptoMobileUiState;
  error?: string;
}

export async function serverCreateCryptoPayment(payload: {
  amountHTG?: number;
  price_amount?: number;
  pay_currency: 'btc' | 'eth' | 'trx' | 'usdttrc20';
  order_description?: string;
}): Promise<ApiResponse<NowPaymentsInvoiceData>> {
  return apiRequest('/api/payments/crypto/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function serverGetCryptoPaymentStatus(paymentId: string): Promise<ApiResponse<NowPaymentsInvoiceData>> {
  return apiRequest(`/api/payments/crypto/status/${paymentId}`);
}

export async function serverSimulateCryptoConfirm(paymentId: string): Promise<ApiResponse> {
  return apiRequest('/api/payments/crypto/simulate-confirm', {
    method: 'POST',
    body: JSON.stringify({ paymentId })
  });
}

export async function serverGetCryptoConfig(): Promise<ApiResponse> {
  return apiRequest('/api/payments/crypto/config');
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

export async function serverCompleteSportBet(payload: {
  ticketId: string;
  additionalSelections: Array<{
    matchId: string;
    matchName: string;
    marketName: string;
    selectionName: string;
    odds: number;
  }>;
}): Promise<ApiResponse> {
  return apiRequest('/api/bets/sports/complete', {
    method: 'POST',
    body: JSON.stringify(payload)
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
  altText?: string;
  subtitle?: string;
  description?: string;
  bannerType?: 'image' | 'custom_html' | 'google_adsense' | 'ad_network' | 'image_only';
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

export async function ownerDeleteFicheSelection(id: string): Promise<ApiResponse> {
  return ownerRequest(`/api/owner/fiches-selections/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function ownerPurgeFichesSelections(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/fiches-selections/purge', {
    method: 'POST'
  });
}

export async function ownerDeleteRiskAlert(id: string): Promise<ApiResponse> {
  return ownerRequest(`/api/owner/risk-alerts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

export async function ownerPurgeRiskAlerts(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/risk-alerts/purge', {
    method: 'POST'
  });
}

export async function ownerPurgeServerStorage(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/purge-storage', {
    method: 'POST'
  });
}

// 9. Gestion Sécurisée des Clés API (Conformité SHA-256 & Préfixes)
export interface ClientApiKeyItem {
  id: string;
  userId: string;
  name?: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

export async function serverGenerateApiKey(name?: string, userId?: string): Promise<ApiResponse> {
  return apiRequest('/api/keys/generate', {
    method: 'POST',
    body: JSON.stringify({ name, userId })
  });
}

export async function serverFetchApiKeys(): Promise<ApiResponse> {
  return apiRequest('/api/keys');
}

export async function serverRevokeApiKey(id: string): Promise<ApiResponse> {
  return apiRequest(`/api/keys/${id}`, {
    method: 'DELETE'
  });
}

export async function serverTestProtectedEndpoint(rawApiKey: string): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/protected-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rawApiKey}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { status: 'error', success: false, error: data.error || `Erreur HTTP ${response.status}`, data };
    }
    return { status: 'success', success: true, data };
  } catch (err: any) {
    return { status: 'error', success: false, error: err.message || 'Échec de connexion réseau' };
  }
}

// 10. Passerelles de Paiement Full Bet (Binance Pay, Moncash Online, Natcash Online)
export async function serverFetchPaymentGateways(): Promise<ApiResponse> {
  return apiRequest('/api/payment/gateways');
}

export async function serverCreateBinanceOrder(amount: number, currency: string = 'USDT', orderDescription?: string): Promise<ApiResponse> {
  return apiRequest('/api/payment/binance/create', {
    method: 'POST',
    body: JSON.stringify({ amount, currency, orderDescription })
  });
}

export async function serverCreateMoncashOnlinePayment(amount: number, phoneNumber?: string): Promise<ApiResponse> {
  return apiRequest('/api/payment/moncash/create', {
    method: 'POST',
    body: JSON.stringify({ amount, phoneNumber })
  });
}

export async function serverCreateNatcashOnlinePayment(amount: number, phoneNumber?: string): Promise<ApiResponse> {
  return apiRequest('/api/payment/natcash/create', {
    method: 'POST',
    body: JSON.stringify({ amount, phoneNumber })
  });
}

// 11. Assistant Virtuel Full Bet
export async function serverAskAssistant(message: string): Promise<ApiResponse> {
  return apiRequest('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

// 12. Contrôle et Blocage des Modes de Paiement (Panneau Propriétaire 2FA)
export async function ownerFetchPaymentMethods(): Promise<ApiResponse> {
  return ownerRequest('/api/owner/payment-methods');
}

export async function ownerTogglePaymentMethod(
  methodId: 'natcash' | 'crypto' | 'moncash' | 'voucher' | 'binance',
  isBlocked: boolean,
  blockedReason?: string
): Promise<ApiResponse> {
  return ownerRequest('/api/owner/payment-methods/toggle', {
    method: 'POST',
    body: JSON.stringify({ methodId, isBlocked, blockedReason })
  });
}

export async function fetchPaymentMethodsStatus(): Promise<ApiResponse> {
  return apiRequest('/api/payment-methods/status');
}

