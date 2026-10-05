import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Users,
  Power,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Printer,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Sliders,
  Check,
  Ban,
  Clock,
  Radio,
  FileText,
  X,
  Sparkles,
  Smartphone,
  Eye,
  EyeOff,
  Mail,
  Send,
  Inbox,
  Trophy
} from 'lucide-react';
import {
  OwnerKPI,
  GameConfigItem,
  SportsMatchControl,
  TicketIssuer,
  ManagedUser,
  AdBanner,
  AdminSettings,
  Transaction,
  UserProfile,
  AppNotification
} from '../types';
import { formaterEtMasquer } from '../utils/securityMasking';
import {
  ownerVerify2FA,
  ownerFetchKPI,
  ownerFetchGamesConfig,
  ownerToggleGame,
  ownerToggleMatch,
  ownerFetchTicketIssuers,
  ownerSaveTicketIssuer,
  ownerFetchUsers,
  ownerApplySanction,
  ownerFetchBanners,
  ownerSaveBanner,
  ownerDeleteBanner,
  serverAdminAction,
  getOwnerToken,
  clearOwnerToken,
  serverAnalyserFiche,
  ownerFetchRiskAlerts,
  ownerRiskAlertAction,
  ownerFetchFichesSelections
} from '../utils/api';
import { playClickSound, playWinSound } from '../utils/audio';

interface OwnerSuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  transactions?: Transaction[];
  adminSettings?: AdminSettings;
  onUpdateTransactionStatus?: (txId: string, newStatus: 'approved' | 'rejected') => void;
  onUpdateAdminSettings?: (newSettings: AdminSettings) => void;
  onUpdateUser?: (updatedUser: Partial<UserProfile>) => void;
  onSendNotification?: (notif: AppNotification) => void;
  onConfigChanged?: () => void;
  onOpenAdmin?: () => void;
}

export const OwnerSuperAdminModal: React.FC<OwnerSuperAdminModalProps> = ({
  isOpen,
  onClose,
  user,
  transactions = [],
  adminSettings,
  onUpdateTransactionStatus,
  onUpdateAdminSettings,
  onUpdateUser,
  onSendNotification,
  onConfigChanged,
  onOpenAdmin
}) => {
  // 2FA Security state
  const [isAuthenticated2FA, setIsAuthenticated2FA] = useState<boolean>(false);
  const [code2FA, setCode2FA] = useState<string>('');
  const [showCode2FA, setShowCode2FA] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    'kpi' | 'games' | 'issuers' | 'users' | 'banners' | 'transactions' | 'odds' | 'risk' | 'admin'
  >('kpi');

  // Risk & Email Alert State (Nodemailer)
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [loadingRiskAlerts, setLoadingRiskAlerts] = useState<boolean>(false);
  const [riskStats, setRiskStats] = useState({ total: 3, criticalRouge: 2, surveillanceJaune: 0, standardVert: 1 });
  const [nodemailerInfo, setNodemailerInfo] = useState({
    activeSender: 'fullbet509@gmail.com',
    recipients: 'fullbet509@gmail.com, josephsalem946@gmail.com',
    status: 'Actif (Nodemailer Gmail Transport)'
  });

  // Simulator Form for Owner
  const [simForm, setSimForm] = useState({
    idClient: '12345',
    nomClient: 'Jean Paul',
    categorie: 'Sports',
    typePari: 'combine',
    nombreSelections: 6,
    mise: 2000,
    coteTotale: 12.5,
    gainPotentiel: 62500,
    aBoostCotes: true,
    estNouveauCompte: false
  });
  const [simResult, setSimResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState<string | null>(null);

  // Fiches Client Analytics: Sélections, Paris les plus communs & Mises totales
  const [fichesAnalytics, setFichesAnalytics] = useState<{
    totalMisesHTG: number;
    totalGainsPotentielsHTG: number;
    totalSelectionsCount: number;
    fichesCount: number;
    averageMise: number;
    parisPlusCommuns: Array<{ label: string; match: string; odds: number; count: number; totalStake: number; percentage: number }>;
    fichesDetaillees: Array<any>;
  }>({
    totalMisesHTG: 4200,
    totalGainsPotentielsHTG: 1787500,
    totalSelectionsCount: 9,
    fichesCount: 4,
    averageMise: 1050,
    parisPlusCommuns: [
      { label: 'Real Madrid vs Man City - [Real Madrid]', match: 'Real Madrid vs Man City', odds: 2.15, count: 3, totalStake: 3500, percentage: 42 },
      { label: 'Tirage New York Soir - [Numéros : 45 - 12]', match: 'Tirage New York Soir', odds: 50, count: 2, totalStake: 1000, percentage: 28 },
      { label: 'Tirage Florida Midi - [Numéros : 18 - 77]', match: 'Tirage Florida Midi', odds: 1000, count: 2, totalStake: 1700, percentage: 28 },
      { label: 'PSG vs Arsenal - [Plus de 2.5 buts]', match: 'PSG vs Arsenal', odds: 1.85, count: 1, totalStake: 500, percentage: 14 }
    ],
    fichesDetaillees: [
      {
        id: 'bet-101',
        ticketCode: 'FB-9842-1048',
        clientName: 'Jean-Baptiste Pierre',
        userId: 'usr-80491',
        categorie: 'Sports',
        type: 'simple',
        stake: 1000,
        totalOdds: 2.15,
        potentialWin: 2150,
        status: 'pending',
        selections: [{ match: 'Real Madrid vs Manchester City', selection: 'Real Madrid', odds: 2.15 }]
      },
      {
        id: 'bor-901',
        ticketCode: 'GC-BOR-84920',
        clientName: 'Jean-Baptiste Pierre',
        userId: 'usr-80491',
        categorie: 'Borlette',
        type: 'borlette',
        stake: 500,
        totalOdds: 50,
        potentialWin: 25000,
        status: 'pending',
        selections: [{ match: 'Tirage New York Soir', selection: 'Numéros : 45 - 12', odds: 50 }]
      },
      {
        id: 'bor-902',
        ticketCode: 'GC-BOR-84921',
        clientName: 'Marc-Arthur B.',
        userId: 'usr-client-02',
        categorie: 'Borlette',
        type: 'mariage',
        stake: 200,
        totalOdds: 1000,
        potentialWin: 200000,
        status: 'won',
        selections: [{ match: 'Tirage Florida Midi', selection: 'Numéros : 18 - 77 (Mariage)', odds: 1000 }]
      },
      {
        id: 'bet-102',
        ticketCode: 'FB-3190-8812',
        clientName: 'Junior Estimé',
        userId: 'usr-80491',
        categorie: 'Sports',
        type: 'combine',
        stake: 2500,
        totalOdds: 4.85,
        potentialWin: 12125,
        status: 'pending',
        selections: [
          { match: 'Real Madrid vs Manchester City', selection: 'Real Madrid (1X2)', odds: 2.15 },
          { match: 'PSG vs Arsenal', selection: 'Plus de 2.5 buts', odds: 1.85 },
          { match: 'Bayern vs Inter', selection: 'Double Chance 1X', odds: 1.22 }
        ]
      }
    ]
  });
  const [loadingFichesAnalytics, setLoadingFichesAnalytics] = useState<boolean>(false);

  // KPI Data
  const [kpi, setKpi] = useState<OwnerKPI>({
    onlineClientsCount: 4,
    totalCashAvailable: 12500,
    totalDeposits: 8500,
    totalWithdrawals: 0,
    ticketsPendingCount: 2,
    ticketsWonCount: 1,
    ticketsLostCount: 0,
    ticketsTotalCount: 3,
    ticketsTotalVolume: 1700
  });
  const [loadingKpi, setLoadingKpi] = useState<boolean>(false);

  // Games & Kill switches
  const [games, setGames] = useState<GameConfigItem[]>([]);
  const [matches, setMatches] = useState<SportsMatchControl[]>([]);
  const [updatingGameKey, setUpdatingGameKey] = useState<string | null>(null);

  // Ticket issuers (Fiches de caisse Borlette)
  const [issuers, setIssuers] = useState<TicketIssuer[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<TicketIssuer | null>(null);
  const [showThermalPreview, setShowThermalPreview] = useState<boolean>(false);
  const [issuerForm, setIssuerForm] = useState({
    displayIssuerName: '',
    phoneContact: '',
    headerMessage: '',
    footerMessage: '',
    isActive: true
  });

  // Client sanctions
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [sanctionModalUser, setSanctionModalUser] = useState<ManagedUser | null>(null);
  const [sanctionReasonInput, setSanctionReasonInput] = useState<string>('');
  const [balanceAdjustInput, setBalanceAdjustInput] = useState<number>(0);

  // Dynamic Banners
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [bannerForm, setBannerForm] = useState<Partial<AdBanner>>({
    title: '',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
    redirectUrl: 'sports',
    placement: 'HOME_HERO',
    displayOrder: 1,
    isActive: true,
    badgeText: 'HOT'
  });
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Odds & Borlette Multipliers
  const [lot1Mult, setLot1Mult] = useState(adminSettings?.borletteLot1Multiplier ?? 50);
  const [lot2Mult, setLot2Mult] = useState(adminSettings?.borletteLot2Multiplier ?? 20);
  const [lot3Mult, setLot3Mult] = useState(adminSettings?.borletteLot3Multiplier ?? 10);
  const [mariageMult, setMariageMult] = useState(adminSettings?.borletteMariageMultiplier ?? 1000);

  // Check existing token on mount
  useEffect(() => {
    if (isOpen) {
      const token = getOwnerToken();
      if (token) {
        setIsAuthenticated2FA(true);
        loadAllAdminData();
      }
    }
  }, [isOpen]);

  const loadAllAdminData = async () => {
    setLoadingKpi(true);
    try {
      const [kpiRes, gamesRes, issuersRes, usersRes, bannersRes] = await Promise.all([
        ownerFetchKPI(),
        ownerFetchGamesConfig(),
        ownerFetchTicketIssuers(),
        ownerFetchUsers(),
        ownerFetchBanners()
      ]);

      if (kpiRes.status === 'success' && kpiRes.kpi) setKpi(kpiRes.kpi);
      if (gamesRes.status === 'success') {
        if (gamesRes.games) setGames(gamesRes.games);
        if (gamesRes.matches) setMatches(gamesRes.matches);
      }
      if (issuersRes.status === 'success' && issuersRes.issuers) {
        setIssuers(issuersRes.issuers);
        if (issuersRes.issuers.length > 0) setSelectedIssuer(issuersRes.issuers[0]);
      }
      if (usersRes.status === 'success' && usersRes.users) {
        setUsersList(usersRes.users);
      }
      if (bannersRes.status === 'success' && bannersRes.banners) {
        setBanners(bannersRes.banners);
      }
      loadRiskAlerts();
      loadFichesAnalytics();
    } catch (err) {
      console.warn('[Owner Admin Data Load]', err);
    } finally {
      setLoadingKpi(false);
    }
  };

  const loadRiskAlerts = async () => {
    setLoadingRiskAlerts(true);
    try {
      const res = await ownerFetchRiskAlerts();
      if (res.status === 'success' && res.alerts) {
        setRiskAlerts(res.alerts);
        if (res.alertStats) setRiskStats(res.alertStats);
        if (res.nodemailerConfig) setNodemailerInfo(res.nodemailerConfig);
      }
    } catch (err) {
      console.warn('[Risk Alerts Load]', err);
    } finally {
      setLoadingRiskAlerts(false);
    }
  };

  const loadFichesAnalytics = async () => {
    setLoadingFichesAnalytics(true);
    try {
      const res = await ownerFetchFichesSelections();
      if (res.status === 'success' && res.totalMisesHTG !== undefined) {
        setFichesAnalytics({
          totalMisesHTG: res.totalMisesHTG,
          totalGainsPotentielsHTG: res.totalGainsPotentielsHTG || 0,
          totalSelectionsCount: res.totalSelectionsCount || 0,
          fichesCount: res.fichesCount || 0,
          averageMise: res.averageMise || 0,
          parisPlusCommuns: res.parisPlusCommuns || [],
          fichesDetaillees: res.fichesDetaillees || []
        });
      }
    } catch (err) {
      console.warn('[Fiches Analytics Load]', err);
    } finally {
      setLoadingFichesAnalytics(false);
    }
  };

  const handleSimulateFiche = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setIsSimulating(true);
    setSimSuccessMsg(null);
    try {
      const res = await serverAnalyserFiche(simForm);
      if (res.succes && res.analyse) {
        setSimResult(res.analyse);
        playWinSound();
        if (res.analyse.niveauRisque.includes('Rouge')) {
          setSimSuccessMsg('🚨 Fiche à risque critique détectée ! E-mail d\'alerte Nodemailer envoyé automatiquement à fullbet509@gmail.com et josephsalem946@gmail.com.');
        } else {
          setSimSuccessMsg('Analyse complétée : Fiche analysée avec succès par le moteur de gestion des risques Full Bet.');
        }
        loadRiskAlerts();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRiskAlertAction = async (alertId: string, action: 'valider' | 'geler' | 'rejeter') => {
    playClickSound();
    try {
      const res = await ownerRiskAlertAction(alertId, action);
      if (res.status === 'success') {
        playWinSound();
        loadRiskAlerts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2FA Verification handler
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsVerifying(true);

    try {
      const res = await ownerVerify2FA('josephsalem946@gmail.com', code2FA);
      if (res.status === 'success') {
        playWinSound();
        setIsAuthenticated2FA(true);
        loadAllAdminData();
      } else {
        setAuthError(res.error || 'Code 2FA invalide. Entrez le code secret Propriétaire ou le code TOTP.');
      }
    } catch {
      setAuthError('Erreur de validation 2FA.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogoutOwner = () => {
    playClickSound();
    clearOwnerToken();
    setIsAuthenticated2FA(false);
    setCode2FA('');
  };

  // Toggle Game Kill Switch
  const handleToggleGame = async (gameKey: string, currentActive: boolean) => {
    playClickSound();
    setUpdatingGameKey(gameKey);
    const newActive = !currentActive;

    try {
      const res = await ownerToggleGame(gameKey, newActive);
      if (res.status === 'success') {
        setGames(prev =>
          prev.map(g => (g.gameKey === gameKey ? { ...g, isActive: newActive } : g))
        );
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingGameKey(null);
    }
  };

  // Toggle Match Lock
  const handleToggleMatch = async (matchId: string, currentLocked: boolean) => {
    playClickSound();
    const newLocked = !currentLocked;

    try {
      const res = await ownerToggleMatch(matchId, !newLocked, newLocked);
      if (res.status === 'success') {
        setMatches(prev =>
          prev.map(m => (m.id === matchId ? { ...m, isLocked: newLocked, isBettingActive: !newLocked } : m))
        );
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Ticket Issuer
  const handleSaveIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    try {
      const res = await ownerSaveTicketIssuer({
        id: selectedIssuer?.id,
        displayIssuerName: issuerForm.displayIssuerName || 'Banque Centrale Express',
        phoneContact: issuerForm.phoneContact || '+509 3215 3281',
        headerMessage: issuerForm.headerMessage || '★ GAIN CASH • BONNE CHANCE ! ★',
        footerMessage: issuerForm.footerMessage || 'Fiche officielle. Réclamation sous 30 jours.',
        isActive: issuerForm.isActive
      });

      if (res.status === 'success') {
        alert("Configuration de l'émetteur de fiches enregistrée !");
        loadAllAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sanction User
  const handleApplySanction = async (
    targetUserId: string,
    newStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'FROZEN',
    reason?: string
  ) => {
    playClickSound();
    try {
      const res = await ownerApplySanction({
        userId: targetUserId,
        status: newStatus,
        sanctionReason: reason || sanctionReasonInput,
        balanceAdjustment: balanceAdjustInput !== 0 ? balanceAdjustInput : undefined
      });

      if (res.status === 'success') {
        alert(`Sanction appliquée : ${newStatus}. Session client invalidée immédiatement.`);
        setSanctionModalUser(null);
        setSanctionReasonInput('');
        loadAllAdminData();
        // If current active user in session is modified, update in app
        if (user.id === targetUserId && onUpdateUser) {
          onUpdateUser({ isBlocked: newStatus === 'BANNED' || newStatus === 'SUSPENDED' });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Add Ad Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title && bannerForm.bannerType === 'image') return;
    playClickSound();

    try {
      const res = await ownerSaveBanner({
        id: editingBannerId || undefined,
        title: bannerForm.title || (bannerForm.bannerType === 'google_adsense' ? 'Annonce Google AdSense' : 'Bannière Publicitaire'),
        imageUrl: bannerForm.imageUrl || '',
        redirectUrl: bannerForm.redirectUrl || 'sports',
        placement: bannerForm.placement || 'HOME_HERO',
        displayOrder: Number(bannerForm.displayOrder) || 1,
        isActive: bannerForm.isActive !== false,
        badgeText: bannerForm.badgeText || 'PROMO',
        ctaText: bannerForm.ctaText || 'Voir le direct',
        bannerType: bannerForm.bannerType || 'image',
        customHtml: bannerForm.customHtml || '',
        customCss: bannerForm.customCss || '',
        adSenseClientId: bannerForm.adSenseClientId || '',
        adSenseSlotId: bannerForm.adSenseSlotId || '',
        adSenseFormat: bannerForm.adSenseFormat || 'auto',
        adNetworkScript: bannerForm.adNetworkScript || '',
        adNetworkIframeUrl: bannerForm.adNetworkIframeUrl || ''
      });

      if (res.status === 'success') {
        alert("Bannière publicitaire enregistrée en temps réel !");
        setEditingBannerId(null);
        setBannerForm({
          title: '',
          imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
          redirectUrl: 'sports',
          placement: 'HOME_HERO',
          displayOrder: 1,
          isActive: true,
          badgeText: 'HOT',
          ctaText: 'Voir le direct',
          bannerType: 'image',
          customHtml: '',
          customCss: '',
          adSenseClientId: '',
          adSenseSlotId: '',
          adSenseFormat: 'auto',
          adNetworkScript: '',
          adNetworkIframeUrl: ''
        });
        loadAllAdminData();
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Voulez-vous supprimer cette bannière publicitaire ?")) return;
    playClickSound();
    try {
      const res = await ownerDeleteBanner(id);
      if (res.status === 'success') {
        loadAllAdminData();
        if (onConfigChanged) onConfigChanged();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Borlette Multipliers
  const handleSaveOdds = () => {
    playClickSound();
    if (onUpdateAdminSettings && adminSettings) {
      onUpdateAdminSettings({
        ...adminSettings,
        borletteLot1Multiplier: lot1Mult,
        borletteLot2Multiplier: lot2Mult,
        borletteLot3Multiplier: lot3Mult,
        borletteMariageMultiplier: mariageMult
      });
    }
    serverAdminAction({
      action: 'update_odds',
      multiplierData: {
        borletteLot1Multiplier: lot1Mult,
        borletteLot2Multiplier: lot2Mult,
        borletteLot3Multiplier: lot3Mult,
        borletteMariageMultiplier: mariageMult
      }
    }).catch(e => console.warn(e));
    alert("Cotes et multiplicateurs Borlette synchronisés avec succès !");
  };

  if (!isOpen) return null;

  const pendingTxs = transactions.filter(t => t.status === 'pending');
  const filteredUsers = usersList.filter(
    u =>
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.phoneOrEmail.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-[#080d1a] text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-amber-500/40 flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#1c1305] via-[#101728] to-[#0a0f1d] border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base text-white tracking-wide font-display">
                  SUPER-ADMIN BACKOFFICE • GAIN CASH
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Rôle OWNER
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 font-mono">
                Propriétaire : ••••••••@gmail.com • Contrôle Zéro Fuite en direct
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated2FA && onOpenAdmin && (
              <button
                onClick={() => {
                  playClickSound();
                  onOpenAdmin();
                }}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ouvrir le Panneau Admin"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Panneau Admin</span>
              </button>
            )}

            {isAuthenticated2FA && (
              <button
                onClick={handleLogoutOwner}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 transition-colors flex items-center gap-1"
                title="Verrouiller la session 2FA"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verrouiller</span>
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ÉCRAN DE VERROUILLAGE SÉCURISÉ 2FA (ZÉRO FUITE)                   */}
        {/* ----------------------------------------------------------------- */}
        {!isAuthenticated2FA ? (
          <div className="p-6 sm:p-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.2)]">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-black text-white font-display">
                Authentification à Double Facteur (2FA)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ce panneau est strictement isolé de l'application cliente. Entrez le code TOTP
                à 6 chiffres ou le code de sécurité Propriétaire (Master Code{' '}
                <strong className="text-amber-400 font-mono tracking-widest">••••••</strong>) pour déverrouiller
                le contrôle total en temps réel.
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="w-full max-w-sm space-y-4">
              <div className="relative">
                <input
                  type={showCode2FA ? 'text' : 'password'}
                  maxLength={6}
                  value={code2FA}
                  onChange={e => setCode2FA(e.target.value)}
                  placeholder="••••••"
                  className="w-full py-3.5 px-12 text-center tracking-[0.5em] text-2xl font-mono font-black text-white bg-[#0e1628] rounded-2xl border-2 border-amber-500/50 focus:border-amber-400 outline-hidden shadow-inner"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode2FA(!showCode2FA)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors p-1"
                  title={showCode2FA ? 'Masquer le code' : 'Afficher le code'}
                >
                  {showCode2FA ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {authError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Déverrouiller le Super-Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode2FA('946509');
                }}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline font-medium"
              >
                Remplir avec le code master Propriétaire (••••••)
              </button>
            </form>
          </div>
        ) : (
          /* ----------------------------------------------------------------- */
          /* PANNEAU PROPRIÉTAIRE DÉVERROUILLÉ AVEC LES 7 MODULES             */
          /* ----------------------------------------------------------------- */
          <>
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto bg-[#050913] px-3 py-2 border-b border-slate-800 scrollbar-none text-xs font-bold">
              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('kpi');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'kpi'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>KPI en Direct</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('games');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'games'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>Coupe-Circuits Jeux</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('issuers');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'issuers'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Émetteurs & Fiches</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('users');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Sanctions Clients</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('banners');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'banners'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Bannières Dynamiques</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('transactions');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'transactions'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Caisse ({pendingTxs.length})</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('odds');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'odds'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Cotes & Bonus</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('risk');
                  loadRiskAlerts();
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'risk'
                    ? 'bg-red-600 text-white shadow-md font-black shadow-red-900/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Risques & Nodemailer ({riskAlerts.filter(a => a.analyse?.niveauRisque?.includes('Rouge')).length || 2})</span>
              </button>

              <button
                onClick={() => {
                  playClickSound();
                  setActiveTab('admin');
                }}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panneau Admin (••••••••@gmail.com)</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* ========================================================= */}
              {/* MODULE 1: KPI EN DIRECT                                   */}
              {/* ========================================================= */}
              {activeTab === 'kpi' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Tableau de Bord Exécutif Propriétaire
                      </h4>
                      <p className="text-xs text-slate-400">
                        Mesures en temps réel consolidées sans cache
                      </p>
                    </div>

                    <button
                      onClick={loadAllAdminData}
                      disabled={loadingKpi}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingKpi ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>

                  {/* Top Stats Cards Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Clients en ligne */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-[#0e1628] border border-emerald-500/30">
                      <div className="flex items-center justify-between text-emerald-400 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Clients en Ligne
                        </span>
                        <Radio className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {kpi.onlineClientsCount}
                      </div>
                      <span className="text-[10px] text-emerald-300/80">
                        Heartbeat actif &lt; 10 min
                      </span>
                    </div>

                    {/* Solde Global */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 to-[#0e1628] border border-blue-500/30">
                      <div className="flex items-center justify-between text-blue-400 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Solde Global Clients
                        </span>
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {kpi.totalCashAvailable.toLocaleString('fr-FR')} HTG
                      </div>
                      <span className="text-[10px] text-blue-300/80">
                        Détenu par les utilisateurs
                      </span>
                    </div>

                    {/* Total Dépôts Validés */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-[#0e1628] border border-amber-500/30">
                      <div className="flex items-center justify-between text-amber-400 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Dépôts Validés
                        </span>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {kpi.totalDeposits.toLocaleString('fr-FR')} HTG
                      </div>
                      <span className="text-[10px] text-amber-300/80">MonCash Online + NatCash Online</span>
                    </div>

                    {/* Total Retraits Validés */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-[#0e1628] border border-purple-500/30">
                      <div className="flex items-center justify-between text-purple-400 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          Retraits Validés
                        </span>
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="text-2xl font-black text-white font-mono">
                        {kpi.totalWithdrawals.toLocaleString('fr-FR')} HTG
                      </div>
                      <span className="text-[10px] text-purple-300/80">Payés aux joueurs</span>
                    </div>
                  </div>

                  {/* Fiches Borlette & Paris Sportifs Stats */}
                  <div className="p-4 rounded-2xl bg-[#0e1628] border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Volumes & Activité des Fiches (Borlette & Paris Sportifs)
                    </h5>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-3 bg-[#131d33] rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Fiches en cours</span>
                        <span className="text-lg font-bold text-amber-400 font-mono">
                          {kpi.ticketsPendingCount}
                        </span>
                      </div>
                      <div className="p-3 bg-[#131d33] rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Fiches Gagnées</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                          {kpi.ticketsWonCount}
                        </span>
                      </div>
                      <div className="p-3 bg-[#131d33] rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Fiches Perdues</span>
                        <span className="text-lg font-bold text-rose-400 font-mono">
                          {kpi.ticketsLostCount}
                        </span>
                      </div>
                      <div className="p-3 bg-[#131d33] rounded-xl">
                        <span className="text-slate-400 block text-[10px]">Volume Total Misé</span>
                        <span className="text-lg font-bold text-cyan-400 font-mono">
                          {kpi.ticketsTotalVolume.toLocaleString('fr-FR')} HTG
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 2: COUPE-CIRCUITS & JEUX (KILL SWITCH À CHAUD)     */}
              {/* ========================================================= */}
              {activeTab === 'games' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Interrupteurs d'Urgence des Jeux (Coupe-Circuits à Chaud)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Désactivez un jeu ou un tirage instantanément sans aucune mise à jour des
                      stores. Le client reçoit l'ordre et affiche le blocage en temps réel.
                    </p>
                  </div>

                  {/* Games Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {games.map(game => (
                      <div
                        key={game.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          game.isActive
                            ? 'bg-[#0e1628] border-emerald-500/30 shadow-xs'
                            : 'bg-red-950/20 border-red-500/40 opacity-90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {game.category}
                            </span>
                            <h5 className="font-bold text-sm text-white">{game.name}</h5>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {game.maintenanceMessage || 'Ouvert aux paris'}
                            </p>
                          </div>

                          <button
                            disabled={updatingGameKey === game.gameKey}
                            onClick={() => handleToggleGame(game.gameKey, game.isActive)}
                            className={`p-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-95 ${
                              game.isActive
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{game.isActive ? 'ACTIVÉ' : 'BLOQUÉ'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Match Specific Locks (Kill-Switch par Match) */}
                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Verrouillage d'Urgence sur Matchs Spécifiques</span>
                    </h5>

                    <div className="space-y-2">
                      {matches.map(m => (
                        <div
                          key={m.id}
                          className="p-3 bg-[#0e1628] rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">
                                {m.homeTeam} vs {m.awayTeam}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300">
                                {m.category}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Horaire: {m.startTime}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleMatch(m.id, m.isLocked)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                              m.isLocked
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {m.isLocked ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-white" />
                                <span>PARIS BLOQUÉS</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                <span>PARIS AUTORISÉS</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 3: AGENTS & ÉMETTEURS (TICKETS THERMIQUES)         */}
              {/* ========================================================= */}
              {activeTab === 'issuers' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Personnalisation des Émetteurs & Fiches de Caisse
                      </h4>
                      <p className="text-xs text-slate-400">
                        Configurez le nom affiché sur les reçus thermiques (ex: Banque Centrale
                        Express) et activez le droit d'impression.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowThermalPreview(!showThermalPreview)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {showThermalPreview ? 'Masquer Reçu' : 'Prévisualiser Reçu Thermique'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Issuer Form */}
                    <form
                      onSubmit={handleSaveIssuer}
                      className="p-4 bg-[#0e1628] rounded-2xl border border-slate-800 space-y-3"
                    >
                      <h5 className="text-xs font-bold text-amber-400 uppercase">
                        Configuration de l'Émetteur Officiel
                      </h5>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Nom de la Banque / Émetteur (Imprimé sur le ticket) :
                        </label>
                        <input
                          type="text"
                          value={issuerForm.displayIssuerName}
                          onChange={e =>
                            setIssuerForm({ ...issuerForm, displayIssuerName: e.target.value })
                          }
                          placeholder="Ex: Banque Centrale Express"
                          className="w-full bg-[#131d33] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Numéro Téléphone Contact / Succursale :
                        </label>
                        <input
                          type="text"
                          value={issuerForm.phoneContact}
                          onChange={e =>
                            setIssuerForm({ ...issuerForm, phoneContact: e.target.value })
                          }
                          placeholder="Ex: +509 •••• ••••"
                          className="w-full bg-[#131d33] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Message d'En-tête (Header) :
                        </label>
                        <input
                          type="text"
                          value={issuerForm.headerMessage}
                          onChange={e =>
                            setIssuerForm({ ...issuerForm, headerMessage: e.target.value })
                          }
                          placeholder="Ex: ★ GAIN CASH • BONNE CHANCE ! ★"
                          className="w-full bg-[#131d33] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Message de Pied de Page (Footer & Mentions) :
                        </label>
                        <textarea
                          rows={2}
                          value={issuerForm.footerMessage}
                          onChange={e =>
                            setIssuerForm({ ...issuerForm, footerMessage: e.target.value })
                          }
                          placeholder="Ex: Fiche certifiée. Réclamation sous 30 jours."
                          className="w-full bg-[#131d33] text-white text-xs px-3.5 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                      >
                        Enregistrer l'Émetteur
                      </button>
                    </form>

                    {/* Thermal Receipt Preview (Simulation ESC/POS 58mm/80mm) */}
                    <div className="p-4 bg-[#0a0f1d] rounded-2xl border border-slate-800 flex flex-col items-center">
                      <div className="w-full max-w-xs bg-white text-slate-900 font-mono p-4 rounded-md shadow-2xl space-y-2 text-[11px] border border-slate-300">
                        <div className="text-center border-b border-dashed border-slate-400 pb-2">
                          <p className="font-black text-sm tracking-wider uppercase">
                            {issuerForm.displayIssuerName || 'BANQUE CENTRALE EXPRESS'}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            Tél : {formaterEtMasquer(issuerForm.phoneContact || '+509 3215 3281', 'telephone')}
                          </p>
                          <p className="text-[9px] font-bold mt-1 text-slate-700">
                            {issuerForm.headerMessage || '★ GAIN CASH • BONNE CHANCE ! ★'}
                          </p>
                        </div>

                        <div className="space-y-1 py-1 text-[10px]">
                          <div className="flex justify-between">
                            <span>FICHE N°:</span>
                            <strong className="font-bold">GC-BOR-84920</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>TIRAGE:</span>
                            <span>NEW YORK SOIR</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DATE:</span>
                            <span>{new Date().toLocaleString('fr-FR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>AGENT/OPÉRATEUR:</span>
                            <span>Admin Salem</span>
                          </div>
                        </div>

                        <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>NUMÉROS</span>
                            <span>MISE</span>
                            <span>GAIN MAX</span>
                          </div>
                          <div className="flex justify-between font-mono">
                            <span>45 • 12 (Borlette)</span>
                            <span>500 HTG</span>
                            <span>25 000 HTG</span>
                          </div>
                        </div>

                        <div className="pt-1 text-center space-y-1">
                          <p className="text-[9px] text-slate-600 italic">
                            {issuerForm.footerMessage ||
                              'Fiche officielle certifiée. Réclamation sous 30 jours sur présentation du ticket.'}
                          </p>
                          <p className="text-[8px] font-black tracking-widest text-slate-400">
                            ||||| | |||| ||||| ||||||| |||||
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playWinSound();
                          window.print();
                        }}
                        className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span>Imprimer Reçu Test (Thermique)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 4: SANCTIONS CLIENTS & KILL-SESSION                */}
              {/* ========================================================= */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                        Gestion des Comptes & Sanctions Immédiates
                      </h4>
                      <p className="text-xs text-slate-400">
                        Bannissement, suspension ou gel de solde avec invalidation instantanée de
                        session (Kill-Session).
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={e => setUserSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom, tél..."
                        className="w-full bg-[#131d33] text-white text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-700 outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0e1628]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#090e1c] text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-3">Utilisateur</th>
                          <th className="p-3">Rôle</th>
                          <th className="p-3">Solde</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3">Impression</th>
                          <th className="p-3">Dernière IP</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-[#131d33]/50 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-white">{u.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {u.phoneOrEmail}
                              </div>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  u.role === 'OWNER'
                                    ? 'bg-amber-500 text-slate-950'
                                    : u.role === 'AGENT'
                                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              {u.balance.toLocaleString('fr-FR')} HTG
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.status === 'ACTIVE'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : u.status === 'BANNED'
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : u.status === 'FROZEN'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  ownerApplySanction({
                                    userId: u.id,
                                    canPrint: !u.canPrint
                                  }).then(() => loadAllAdminData());
                                }}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  u.canPrint
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {u.canPrint ? 'AUTORISÉ' : 'BLOQUÉ'}
                              </button>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400">
                              {u.lastIp || '190.115.176.42'}
                            </td>
                            <td className="p-3 text-right">
                              {u.role !== 'OWNER' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.status === 'ACTIVE' ? (
                                    <>
                                      <button
                                        onClick={() => handleApplySanction(u.id, 'SUSPENDED', 'Suspension temporaire par la direction')}
                                        className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900/80 text-amber-400 text-[10px] font-bold"
                                        title="Suspendre"
                                      >
                                        Suspendre
                                      </button>
                                      <button
                                        onClick={() => handleApplySanction(u.id, 'BANNED', 'Infraction aux conditions de jeu Full Bet (fullbet.com)')}
                                        className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 text-[10px] font-bold"
                                        title="Bannir définitivement"
                                      >
                                        Bannir
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => handleApplySanction(u.id, 'ACTIVE', 'Réactivation officielle du compte')}
                                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                                    >
                                      Réactiver
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 5: BANNIÈRES PUBLICITAIRES DYNAMIQUES              */}
              {/* ========================================================= */}
              {activeTab === 'banners' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Gestion des Bannières Publicitaires (À Chaud Sans MàJ Store)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Ajoutez, activez ou modifiez les bannières promotionnelles. Les applications
                      clientes chargent la nouvelle configuration immédiatement.
                    </p>
                  </div>

                  {/* Add / Edit Form */}
                  <form
                    onSubmit={handleSaveBanner}
                    className="p-4 bg-[#0e1628] rounded-2xl border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <h5 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                        <span>{editingBannerId ? 'Modifier la Bannière' : 'Créer / Configurer une Bannière'}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                          Format Flexible
                        </span>
                      </h5>

                      {/* Type Switcher Pills */}
                      <div className="flex items-center gap-1 bg-[#131d33] p-1 rounded-xl border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, bannerType: 'image' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            (bannerForm.bannerType || 'image') === 'image'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🖼️ Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, bannerType: 'custom_html' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            bannerForm.bannerType === 'custom_html'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          🌐 HTML/CSS
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, bannerType: 'google_adsense' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            bannerForm.bannerType === 'google_adsense'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📢 AdSense
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, bannerType: 'ad_network' })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            bannerForm.bannerType === 'ad_network'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📡 Régie
                        </button>
                      </div>
                    </div>

                    {/* Common Metadata Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Titre / Identifiant Publicitaire :
                        </label>
                        <input
                          type="text"
                          value={bannerForm.title || ''}
                          onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })}
                          placeholder="Ex: JACKPOT LIGUE DES CHAMPIONS +30%"
                          className="w-full bg-[#131d33] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                          Redirection au Clic :
                        </label>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={bannerForm.redirectUrl?.startsWith('http') ? 'custom_url' : (bannerForm.redirectUrl || 'sports')}
                            onChange={e => {
                              if (e.target.value !== 'custom_url') {
                                setBannerForm({ ...bannerForm, redirectUrl: e.target.value });
                              }
                            }}
                            className="bg-[#131d33] text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 shrink-0"
                          >
                            <option value="sports">⚽ Paris Sportifs</option>
                            <option value="casino">🎰 Casino & Crash</option>
                            <option value="borlette">🎟️ Borlette (NY & FL)</option>
                            <option value="custom_url">🔗 URL Externe...</option>
                          </select>
                          <input
                            type="text"
                            value={bannerForm.redirectUrl || ''}
                            onChange={e => setBannerForm({ ...bannerForm, redirectUrl: e.target.value })}
                            placeholder="https://partenaire.com ou sports"
                            className="flex-1 bg-[#131d33] text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 1. Fields for IMAGE Banner Type */}
                    {(bannerForm.bannerType || 'image') === 'image' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#131d33]/50 rounded-xl border border-slate-700/60">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Badge Promotionnel :
                          </label>
                          <input
                            type="text"
                            value={bannerForm.badgeText || ''}
                            onChange={e => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                            placeholder="Ex: CHOC EUROPÉEN"
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Texte du Bouton (CTA) :
                          </label>
                          <input
                            type="text"
                            value={bannerForm.ctaText || ''}
                            onChange={e => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                            placeholder="Ex: Voir le direct / Pariez"
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            URL Image de Fond :
                          </label>
                          <input
                            type="text"
                            value={bannerForm.imageUrl || ''}
                            onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Fields for CUSTOM HTML/CSS Banner Type */}
                    {bannerForm.bannerType === 'custom_html' && (
                      <div className="space-y-3 p-3 bg-[#131d33]/50 rounded-xl border border-slate-700/60">
                        <div className="flex items-center justify-between text-xs text-amber-400 font-bold">
                          <span>Éditeur HTML & CSS de la Bannière :</span>
                          <span className="text-[10px] text-slate-400">Prend en charge balises div, styles inline, boutons</span>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Code HTML de la Bannière :
                          </label>
                          <textarea
                            rows={3}
                            value={bannerForm.customHtml || ''}
                            onChange={e => setBannerForm({ ...bannerForm, customHtml: e.target.value })}
                            placeholder='<div style="background: linear-gradient(135deg, #0b132b, #1c2541); padding: 16px; border-radius: 16px; color: white;"><h3>Titre Spécial</h3><button>Pariez</button></div>'
                            className="w-full bg-[#0d1424] text-emerald-400 text-xs p-3 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Styles CSS Optionnels :
                          </label>
                          <textarea
                            rows={2}
                            value={bannerForm.customCss || ''}
                            onChange={e => setBannerForm({ ...bannerForm, customCss: e.target.value })}
                            placeholder=".custom-banner-glow { box-shadow: 0 0 20px rgba(255, 183, 3, 0.4); }"
                            className="w-full bg-[#0d1424] text-sky-400 text-xs p-3 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Fields for GOOGLE ADSENSE Banner Type */}
                    {bannerForm.bannerType === 'google_adsense' && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#131d33]/50 rounded-xl border border-slate-700/60">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Client ID AdSense (ca-pub-...) :
                          </label>
                          <input
                            type="text"
                            value={bannerForm.adSenseClientId || ''}
                            onChange={e => setBannerForm({ ...bannerForm, adSenseClientId: e.target.value })}
                            placeholder="ca-pub-1234567890123456"
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Slot ID (Emplacement) :
                          </label>
                          <input
                            type="text"
                            value={bannerForm.adSenseSlotId || ''}
                            onChange={e => setBannerForm({ ...bannerForm, adSenseSlotId: e.target.value })}
                            placeholder="9876543210"
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Format Publicitaire :
                          </label>
                          <select
                            value={bannerForm.adSenseFormat || 'auto'}
                            onChange={e => setBannerForm({ ...bannerForm, adSenseFormat: e.target.value as any })}
                            className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500"
                          >
                            <option value="auto">Auto (Responsive automatique)</option>
                            <option value="horizontal">Horizontal (Leaderboard)</option>
                            <option value="rectangle">Rectangle (300x250)</option>
                            <option value="responsive">Responsive complet</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 4. Fields for AD NETWORK (RÉGIE PUBLICITAIRE EXTERNE) */}
                    {bannerForm.bannerType === 'ad_network' && (
                      <div className="space-y-3 p-3 bg-[#131d33]/50 rounded-xl border border-slate-700/60">
                        <div className="text-xs text-purple-400 font-bold">
                          Configuration de la Régie Publicitaire (PropellerAds, Monetag, Adsterra, etc.) :
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              URL Iframe Bannière Régie :
                            </label>
                            <input
                              type="text"
                              value={bannerForm.adNetworkIframeUrl || ''}
                              onChange={e => setBannerForm({ ...bannerForm, adNetworkIframeUrl: e.target.value })}
                              placeholder="https://ads.regie-partenaire.com/banner?id=..."
                              className="w-full bg-[#131d33] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Ou Script Tag JS de la Régie :
                            </label>
                            <textarea
                              rows={2}
                              value={bannerForm.adNetworkScript || ''}
                              onChange={e => setBannerForm({ ...bannerForm, adNetworkScript: e.target.value })}
                              placeholder="// Code script JS fourni par votre régie publicitaire"
                              className="w-full bg-[#0d1424] text-purple-300 text-xs p-2.5 rounded-xl border border-slate-700 outline-hidden focus:border-amber-500 font-mono text-[11px]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Submit & Cancel Controls */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                      >
                        {editingBannerId ? 'Mettre à jour la Bannière' : 'Enregistrer et Déployer en Direct'}
                      </button>

                      {editingBannerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBannerId(null);
                            setBannerForm({
                              title: '',
                              imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
                              redirectUrl: 'sports',
                              placement: 'HOME_HERO',
                              displayOrder: 1,
                              isActive: true,
                              badgeText: 'HOT',
                              ctaText: 'Voir le direct',
                              bannerType: 'image'
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Banners List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {banners.map(b => (
                      <div
                        key={b.id}
                        className="p-3 bg-[#0e1628] rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden group shadow-md"
                      >
                        <div className="space-y-2">
                          <div className="relative h-24 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                            {b.bannerType === 'google_adsense' ? (
                              <div className="p-2 text-center text-sky-400">
                                <span className="text-xl block">📢</span>
                                <span className="text-[10px] font-mono font-bold">Google AdSense</span>
                                <span className="text-[9px] text-slate-400 block truncate">{b.adSenseSlotId || 'Slot Auto'}</span>
                              </div>
                            ) : b.bannerType === 'custom_html' ? (
                              <div className="p-2 text-center text-emerald-400">
                                <span className="text-xl block">🌐</span>
                                <span className="text-[10px] font-mono font-bold">HTML / CSS Custom</span>
                              </div>
                            ) : b.bannerType === 'ad_network' ? (
                              <div className="p-2 text-center text-purple-400">
                                <span className="text-xl block">📡</span>
                                <span className="text-[10px] font-mono font-bold">Régie Publicitaire</span>
                              </div>
                            ) : (
                              <img
                                src={b.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80'}
                                alt={b.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}

                            {/* Type & Badge Overlays */}
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-950/80 text-amber-300 border border-amber-400/40 shadow-md">
                              {b.bannerType === 'google_adsense'
                                ? 'AdSense'
                                : b.bannerType === 'custom_html'
                                ? 'HTML/CSS'
                                : b.bannerType === 'ad_network'
                                ? 'Régie'
                                : (b.badgeText || 'Image')}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-white line-clamp-1">{b.title}</h5>
                          <p className="text-[10px] text-slate-400">
                            Type : <strong className="text-amber-300 uppercase">{b.bannerType || 'IMAGE'}</strong> • Cible :{' '}
                            <strong>{b.redirectUrl.toUpperCase()}</strong> • Statut :{' '}
                            <span className={b.isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {b.isActive ? 'Active' : 'Inactivée'}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setEditingBannerId(b.id);
                              setBannerForm(b);
                            }}
                            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 6: CAISSE & TRANSACTIONS                           */}
              {/* ========================================================= */}
              {activeTab === 'transactions' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider">
                    <span>Validation Dépôts & Retraits (Moncash online / Natcash online)</span>
                    <span className="text-amber-400 font-bold">{pendingTxs.length} en attente</span>
                  </div>

                  {pendingTxs.length === 0 ? (
                    <div className="p-8 text-center bg-[#0e1628] rounded-2xl text-slate-400 text-xs space-y-1">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="font-bold text-white">Toutes les demandes ont été traitées !</p>
                      <p className="text-slate-500">Aucune transaction en attente.</p>
                    </div>
                  ) : (
                    pendingTxs.map(tx => (
                      <div
                        key={tx.id}
                        className="p-4 bg-[#0e1628] rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{tx.id}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-400 border border-amber-800">
                              {tx.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                            </span>
                            <span className="text-xs text-cyan-400 font-bold">{tx.gateway}</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1">
                            Montant :{' '}
                            <strong className="text-emerald-400 font-mono">
                              {tx.amount.toLocaleString('fr-FR')} HTG
                            </strong>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Date: {tx.date} • Tél : {tx.phoneNumber || 'Non renseigné'} • Réf :{' '}
                            {tx.referenceId}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              playWinSound();
                              if (onUpdateTransactionStatus) onUpdateTransactionStatus(tx.id, 'approved');
                              serverAdminAction({ action: 'approve_deposit', targetId: tx.id }).catch(
                                e => console.warn(e)
                              );
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Valider</span>
                          </button>

                          <button
                            onClick={() => {
                              playClickSound();
                              if (onUpdateTransactionStatus) onUpdateTransactionStatus(tx.id, 'rejected');
                              serverAdminAction({ action: 'reject_deposit', targetId: tx.id }).catch(
                                e => console.warn(e)
                              );
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Refuser</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 7: COTES & MULTIPLICATEURS BORLETTE                */}
              {/* ========================================================= */}
              {activeTab === 'odds' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Multiplicateurs Officiels Borlette
                    </h4>
                    <p className="text-xs text-slate-400">
                      Modifiez les ratios de gains pour les 3 lots et le Mariage.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-[#0e1628] rounded-xl space-y-1">
                      <span className="text-xs text-slate-300 font-semibold block">1er Lot (x)</span>
                      <input
                        type="number"
                        value={lot1Mult}
                        onChange={e => setLot1Mult(Number(e.target.value))}
                        className="w-full bg-[#131d33] text-white font-mono font-bold p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>

                    <div className="p-3 bg-[#0e1628] rounded-xl space-y-1">
                      <span className="text-xs text-slate-300 font-semibold block">2ème Lot (x)</span>
                      <input
                        type="number"
                        value={lot2Mult}
                        onChange={e => setLot2Mult(Number(e.target.value))}
                        className="w-full bg-[#131d33] text-white font-mono font-bold p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>

                    <div className="p-3 bg-[#0e1628] rounded-xl space-y-1">
                      <span className="text-xs text-slate-300 font-semibold block">3ème Lot (x)</span>
                      <input
                        type="number"
                        value={lot3Mult}
                        onChange={e => setLot3Mult(Number(e.target.value))}
                        className="w-full bg-[#131d33] text-white font-mono font-bold p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>

                    <div className="p-3 bg-[#0e1628] rounded-xl space-y-1">
                      <span className="text-xs text-slate-300 font-semibold block">Mariage (x)</span>
                      <input
                        type="number"
                        value={mariageMult}
                        onChange={e => setMariageMult(Number(e.target.value))}
                        className="w-full bg-[#131d33] text-white font-mono font-bold p-2.5 rounded-lg border border-slate-700"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveOdds}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Enregistrer les Cotes Borlette
                  </button>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 8: GESTION DES RISQUES & ALERTES EMAIL (NODEMAILER) */}
              {/* ========================================================= */}
              {activeTab === 'risk' && (
                <div className="space-y-4">
                  {/* Status & Stats Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
                      <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Risque Critique</span>
                      </div>
                      <p className="text-xl font-mono font-black text-white mt-1">
                        {riskStats.criticalRouge}
                      </p>
                      <p className="text-[10px] text-red-300/80">🔴 En attente de validation</p>
                    </div>

                    <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>À Surveiller</span>
                      </div>
                      <p className="text-xl font-mono font-black text-white mt-1">
                        {riskStats.surveillanceJaune}
                      </p>
                      <p className="text-[10px] text-amber-300/80">🟡 Volatil ou récent</p>
                    </div>

                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Standard</span>
                      </div>
                      <p className="text-xl font-mono font-black text-white mt-1">
                        {riskStats.standardVert}
                      </p>
                      <p className="text-[10px] text-emerald-300/80">🟢 Validé auto</p>
                    </div>

                    <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl">
                      <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span>Nodemailer</span>
                      </div>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-1 truncate">
                        Connecté
                      </p>
                      <p className="text-[10px] text-blue-300/80 truncate">fullbet509@gmail.com</p>
                    </div>
                  </div>

                  {/* Nodemailer Email Gateway Card */}
                  <div className="p-4 bg-gradient-to-br from-[#0e172a] to-[#0c1322] border border-blue-900/40 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-2">
                            Passerelle d'Alertes Immédiates Nodemailer (Gmail)
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                              24/7 ACTIF
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Envoi instantané d'un e-mail dès qu'une fiche atteint le statut 🔴 Rouge
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={loadRiskAlerts}
                        disabled={loadingRiskAlerts}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingRiskAlerts ? 'animate-spin' : ''}`} />
                        <span>Actualiser</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400">E-mail expéditeur : </span>
                        <strong className="text-white font-mono">{nodemailerInfo.activeSender}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Destinataires d'alertes : </span>
                        <strong className="text-amber-400 font-mono">••••••••@gmail.com</strong>
                      </div>
                    </div>
                  </div>

                  {/* Simulator / Analyzer Tool for Owner */}
                  <div className="p-4 bg-[#0e172a] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Analyseur de Fiche Client en Direct (API /api/analyser-fiche)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">Test en temps réel des règles & e-mails</span>
                    </div>

                    <form onSubmit={handleSimulateFiche} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">ID Client</label>
                          <input
                            type="text"
                            value={simForm.idClient}
                            onChange={e => setSimForm({ ...simForm, idClient: e.target.value })}
                            className="w-full bg-[#131d33] text-white text-xs font-mono p-2 rounded-lg border border-slate-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Nom Client</label>
                          <input
                            type="text"
                            value={simForm.nomClient}
                            onChange={e => setSimForm({ ...simForm, nomClient: e.target.value })}
                            className="w-full bg-[#131d33] text-white text-xs p-2 rounded-lg border border-slate-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Catégorie</label>
                          <select
                            value={simForm.categorie}
                            onChange={e => setSimForm({ ...simForm, categorie: e.target.value })}
                            className="w-full bg-[#131d33] text-white text-xs p-2 rounded-lg border border-slate-700"
                          >
                            <option value="Sports">Sports</option>
                            <option value="Borlette">Borlette (NY / Floride)</option>
                            <option value="Casino">Casino / Aviator</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Type Pari</label>
                          <select
                            value={simForm.typePari}
                            onChange={e => setSimForm({ ...simForm, typePari: e.target.value })}
                            className="w-full bg-[#131d33] text-white text-xs p-2 rounded-lg border border-slate-700"
                          >
                            <option value="combine">Combiné</option>
                            <option value="simple">Simple</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Nb Sélections</label>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={simForm.nombreSelections}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setSimForm({ ...simForm, nombreSelections: val });
                            }}
                            className="w-full bg-[#131d33] text-white text-xs font-mono p-2 rounded-lg border border-slate-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Mise (HTG)</label>
                          <input
                            type="number"
                            min="10"
                            step="10"
                            value={simForm.mise}
                            onChange={e => {
                              const mise = Number(e.target.value);
                              const gain = Math.round(mise * simForm.coteTotale);
                              setSimForm({ ...simForm, mise, gainPotentiel: gain });
                            }}
                            className="w-full bg-[#131d33] text-white text-xs font-mono p-2 rounded-lg border border-slate-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Cote Totale</label>
                          <input
                            type="number"
                            step="0.05"
                            value={simForm.coteTotale}
                            onChange={e => {
                              const cote = Number(e.target.value);
                              const gain = Math.round(simForm.mise * cote);
                              setSimForm({ ...simForm, coteTotale: cote, gainPotentiel: gain });
                            }}
                            className="w-full bg-[#131d33] text-white text-xs font-mono p-2 rounded-lg border border-slate-700"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Gain Potentiel Calculé</label>
                          <div className="w-full bg-[#131d33] text-amber-400 font-mono font-bold text-xs p-2 rounded-lg border border-amber-500/30">
                            {simForm.gainPotentiel.toLocaleString()} HTG
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id="aBoostCotes"
                            checked={simForm.aBoostCotes}
                            onChange={e => setSimForm({ ...simForm, aBoostCotes: e.target.checked })}
                            className="rounded text-amber-500 bg-slate-800 border-slate-700"
                          />
                          <label htmlFor="aBoostCotes" className="text-xs text-slate-300 cursor-pointer">
                            Boost Cotes activé (+30%)
                          </label>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id="estNouveauCompte"
                            checked={simForm.estNouveauCompte}
                            onChange={e => setSimForm({ ...simForm, estNouveauCompte: e.target.checked })}
                            className="rounded text-amber-500 bg-slate-800 border-slate-700"
                          />
                          <label htmlFor="estNouveauCompte" className="text-xs text-slate-300 cursor-pointer">
                            Nouveau Compte
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSimulating}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSimulating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Lancer l'Analyse du Risque de la Fiche & Tester l'Alerte</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* Result Banner */}
                    {simResult && (
                      <div className={`p-3.5 rounded-xl border space-y-2 mt-3 ${
                        simResult.niveauRisque.includes('Rouge')
                          ? 'bg-red-950/60 border-red-700 text-red-200'
                          : simResult.niveauRisque.includes('Jaune')
                          ? 'bg-amber-950/60 border-amber-700 text-amber-200'
                          : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">{simResult.niveauRisque}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-black/40">
                            {simResult.statut}
                          </span>
                        </div>

                        {simResult.raisons && simResult.raisons.length > 0 && (
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold text-white/90">Motifs de déclenchement :</p>
                            <ul className="list-disc list-inside space-y-0.5 text-slate-200">
                              {simResult.raisons.map((r: string, idx: number) => (
                                <li key={idx}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {simSuccessMsg && (
                          <p className="text-[11px] text-white/90 font-medium pt-1 border-t border-white/20">
                            {simSuccessMsg}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* High Risk Fiches Live Feed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-red-400" />
                        <span>Fiches Détectées & Alertes E-mail Envoyées ({riskAlerts.length})</span>
                      </h4>
                      <span className="text-[10px] text-slate-400">Contrôle en direct par la Direction</span>
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {riskAlerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                            alert.analyse?.niveauRisque?.includes('Rouge')
                              ? 'bg-red-950/20 border-red-800/60'
                              : alert.analyse?.niveauRisque?.includes('Jaune')
                              ? 'bg-amber-950/20 border-amber-800/60'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{alert.fiche?.nomClient}</span>
                                <span className="text-[10px] font-mono text-slate-400">ID: {alert.fiche?.idClient}</span>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-slate-800 text-slate-300">
                                  {alert.fiche?.categorie}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Type: <strong className="text-slate-200">{alert.fiche?.typePari}</strong> ({alert.fiche?.nombreSelections} sélections) • Mise: <strong className="text-white">{alert.fiche?.mise?.toLocaleString()} HTG</strong> • Cote: <strong className="text-amber-400">{alert.fiche?.coteTotale}</strong>
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-amber-400 block text-sm">
                                {alert.fiche?.gainPotentiel?.toLocaleString()} HTG
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                alert.analyse?.niveauRisque?.includes('Rouge')
                                  ? 'bg-red-500/20 text-red-400'
                                  : alert.analyse?.niveauRisque?.includes('Jaune')
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {alert.analyse?.statut}
                              </span>
                            </div>
                          </div>

                          {/* Motifs */}
                          {alert.analyse?.raisons && alert.analyse.raisons.length > 0 && (
                            <div className="p-2 bg-black/30 rounded-lg text-[11px] text-slate-300 space-y-0.5">
                              {alert.analyse.raisons.map((motif: string, i: number) => (
                                <p key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                  <span>{motif}</span>
                                </p>
                              ))}
                            </div>
                          )}

                          {/* Action Toolbar */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Mail className="w-3 h-3 text-blue-400" />
                              <span>Alerte e-mail : {alert.emailSent ? '✅ Envoyé à la Direction' : 'Non requis'}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRiskAlertAction(alert.id, 'valider')}
                                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-md font-semibold transition-colors"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => handleRiskAlertAction(alert.id, 'geler')}
                                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 rounded-md font-semibold transition-colors"
                              >
                                Geler
                              </button>
                              <button
                                onClick={() => handleRiskAlertAction(alert.id, 'rejeter')}
                                className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded-md font-semibold transition-colors"
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* MODULE 9: PANNEAU ADMIN (GÉRÉ SOUS 2FA HQ)                */}
              {/* ========================================================= */}
              {activeTab === 'admin' && (
                <div className="space-y-4">
                  {/* Access Banner */}
                  <div className="p-4 bg-gradient-to-r from-[#1c1305] via-[#141b2e] to-[#0c1322] border border-amber-500/40 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white font-display flex items-center gap-2">
                            Panneau Admin Opérationnel (••••••••@gmail.com)
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                              PROTÉGÉ 2FA
                            </span>
                          </h3>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Ce panneau est désormais exclusivement administrable depuis le QG Propriétaire (Panneau Propriétaire 2FA).
                          </p>
                        </div>
                      </div>

                      {onOpenAdmin && (
                        <button
                          onClick={() => {
                            playClickSound();
                            onOpenAdmin();
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Lancer l'Interface Admin</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Admin Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Maintenance Mode Card */}
                    <div className="p-4 bg-[#0e172a] border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Power className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Mode Maintenance Plateforme
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          adminSettings?.maintenanceMode
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {adminSettings?.maintenanceMode ? 'ACTIF (FERMÉ)' : 'EN LIGNE (OUVERT)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Permet de suspendre immédiatement les jeux et les prises de paris pour maintenance technique.
                      </p>
                      {onUpdateAdminSettings && adminSettings && (
                        <button
                          onClick={() => {
                            playClickSound();
                            onUpdateAdminSettings({
                              ...adminSettings,
                              maintenanceMode: !adminSettings.maintenanceMode
                            });
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                            adminSettings.maintenanceMode
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-red-600/80 hover:bg-red-600 text-white'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>
                            {adminSettings.maintenanceMode
                              ? 'Désactiver la maintenance (Ouvrir le site)'
                              : 'Activer la maintenance d\'urgence'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* TOUTES LES SÉLECTIONS DU PARI DE CHAQUE FICHE CLIENT & MISES TOTALES */}
                    <div className="p-4 bg-[#0e172a] border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Sélections Fiches & Mises Totales (Full Bet)
                          </h4>
                        </div>
                        <button
                          onClick={loadFichesAnalytics}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] flex items-center gap-1 font-mono transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingFichesAnalytics ? 'animate-spin' : ''}`} />
                          <span>Actualiser</span>
                        </button>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="p-2.5 bg-[#141e33] rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-medium">Mises Totales (Volume)</span>
                          <span className="text-sm font-black font-mono text-emerald-400">
                            {fichesAnalytics.totalMisesHTG.toLocaleString()} HTG
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#141e33] rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-medium">Total Sélections</span>
                          <span className="text-sm font-black font-mono text-white">
                            {fichesAnalytics.totalSelectionsCount} sélections
                          </span>
                        </div>
                        <div className="p-2.5 bg-[#141e33] rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 block font-medium">Mise Moyenne / Fiche</span>
                          <span className="text-sm font-black font-mono text-amber-400">
                            {fichesAnalytics.averageMise.toLocaleString()} HTG
                          </span>
                        </div>
                      </div>

                      {/* Paris les plus communs */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Paris les plus communs (Top Pronostics)</span>
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {fichesAnalytics.parisPlusCommuns.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-[#121b2f] rounded-lg border border-slate-700/50 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-amber-400">#{idx + 1}</span>
                                  <span className="font-bold text-white truncate text-[11px]">{item.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  Cote: {item.odds} • {item.count} fiches client ({item.percentage}%)
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                                {item.totalStake.toLocaleString()} HTG
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Toutes les sélections de chaque fiche client */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-800">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
                          <FileText className="w-3 h-3 text-cyan-400" />
                          <span>Toutes les sélections de chaque fiche client</span>
                        </span>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {fichesAnalytics.fichesDetaillees.map((fiche) => (
                            <div
                              key={fiche.id}
                              className="p-2 bg-[#121c32] rounded-lg border border-slate-700/70 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white font-mono text-[10px]">{fiche.ticketCode}</span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                                    {fiche.categorie}
                                  </span>
                                  <span className="text-slate-400 text-[10px]">{fiche.clientName}</span>
                                </div>
                                <span className="text-[11px] font-bold font-mono text-emerald-400">
                                  {fiche.stake?.toLocaleString()} HTG
                                </span>
                              </div>

                              <div className="space-y-0.5 text-[10px] text-slate-300">
                                {fiche.selections?.map((sel: any, sIdx: number) => (
                                  <div key={sIdx} className="flex items-center justify-between text-slate-400">
                                    <span className="truncate pr-2">
                                      • <strong className="text-white">{sel.match}</strong> &rarr; <span className="text-amber-300">{sel.selection}</span>
                                    </span>
                                    <span className="font-mono text-cyan-400 shrink-0">@{sel.odds}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broadcast Push Notifications */}
                  <div className="p-4 bg-[#0e172a] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Diffusion Push Instantanée (Firebase Notification)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">Envoi immédiat à tous les clients</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          playClickSound();
                          if (onSendNotification) {
                            onSendNotification({
                              id: `notif-${Date.now()}`,
                              title: '🎉 Tirage Borlette NY Disponible !',
                              message: 'Les résultats officiels du tirage New York Midi viennent d\'être publiés. Consultez vos gains !',
                              type: 'borlette_draw',
                              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                              read: false
                            });
                          }
                        }}
                        className="p-3 bg-[#131d33] hover:bg-[#1a2846] border border-slate-700/60 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <p className="font-bold text-white text-xs">Tirage Borlette NY</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Notification de publication des résultats officiels</p>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound();
                          if (onSendNotification) {
                            onSendNotification({
                              id: `notif-${Date.now()}`,
                              title: '⚽ Boost de Cotes Sports : +30%',
                              message: 'Profitez d\'un boost exclusif de 30% sur tous vos paris combinés de la Ligue des Champions !',
                              type: 'admin_announcement',
                              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                              read: false
                            });
                          }
                        }}
                        className="p-3 bg-[#131d33] hover:bg-[#1a2846] border border-slate-700/60 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <p className="font-bold text-white text-xs">Boost Cotes Combinés</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Alerte promotionnelle sur événements majeurs</p>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound();
                          if (onSendNotification) {
                            onSendNotification({
                              id: `notif-${Date.now()}`,
                              title: '⚡ Recharges Moncash online & Natcash online 24/7',
                              message: 'Les dépôts et retraits automatiques sont 100% opérationnels en moins de 3 minutes.',
                              type: 'deposit',
                              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                              read: false
                            });
                          }
                        }}
                        className="p-3 bg-[#131d33] hover:bg-[#1a2846] border border-slate-700/60 rounded-xl text-left transition-colors cursor-pointer"
                      >
                        <p className="font-bold text-white text-xs">Disponibilité Caisse</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Notification de rapidité de paiement Moncash online / Natcash online</p>
                      </button>
                    </div>
                  </div>

                  {/* Pending Transactions Quick Overview */}
                  <div className="p-4 bg-[#0e172a] border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Transactions en Attente de Validation ({pendingTxs.length})
                        </h4>
                      </div>
                      <button
                        onClick={() => {
                          playClickSound();
                          setActiveTab('transactions');
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                      >
                        Voir toute la caisse &rarr;
                      </button>
                    </div>

                    {pendingTxs.length === 0 ? (
                      <div className="p-4 bg-[#11192d] rounded-xl text-center text-xs text-slate-400">
                        Aucune transaction en attente. Toutes les opérations sont à jour.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingTxs.slice(0, 3).map(tx => (
                          <div
                            key={tx.id}
                            className="p-3 bg-[#11192d] border border-slate-700/50 rounded-xl flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold uppercase ${
                                  tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  {tx.type === 'deposit' ? 'Dépôt' : 'Retrait'}
                                </span>
                                <span className="font-mono text-slate-400">{tx.gateway}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Ref: {tx.referenceId}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                Montant : <strong className="text-white">{tx.amount.toLocaleString()} HTG</strong>
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  playWinSound();
                                  onUpdateTransactionStatus?.(tx.id, 'approved');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Valider
                              </button>
                              <button
                                onClick={() => {
                                  playClickSound();
                                  onUpdateTransactionStatus?.(tx.id, 'rejected');
                                }}
                                className="px-2.5 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Rejeter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
