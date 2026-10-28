/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  GameModule,
  BetSlipItem,
  PlacedBet,
  BorletteTicket,
  Transaction,
  UserProfile,
  AdminSettings,
  AppNotification
} from './types';
import {
  DEFAULT_USER,
  getStoredUser,
  saveUser,
  getStoredTransactions,
  saveTransactions,
  getStoredBets,
  saveBets,
  getStoredBorletteTickets,
  saveBorletteTickets,
  getStoredNotifications,
  saveNotifications,
  getStoredAdminSettings,
  saveAdminSettings,
  INITIAL_MATCHES,
  INITIAL_BORLETTE_RESULTS
} from './utils/storage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GainCashSlidingMenu } from './components/GainCashSlidingMenu';
import { SportsScreen } from './components/SportsScreen';
import { CasinoScreen } from './components/CasinoScreen';
import { BorletteScreen } from './components/BorletteScreen';
import { BetSlipModal, isItemFunBet } from './components/BetSlipModal';
import { WalletModal } from './components/WalletModal';
import { RulesAndTermsModal } from './components/RulesAndTermsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ProfileModal } from './components/ProfileModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { FirebaseLoginModal } from './components/FirebaseLoginModal';
import { ScrollToTopButton } from './components/ScrollToTopButton';
import { DownloadAppModal } from './components/DownloadAppModal';
import { LanguageProvider } from './context/LanguageContext';
import { FeaturesProvider } from './context/FeaturesContext';
import { OwnerSuperAdminModal } from './components/OwnerSuperAdminModal';
import { FullBetTop15Modal } from './components/FullBetTop15Modal';
import { MultiLiveModal } from './components/MultiLiveModal';
import { TransactionLimitBanner } from './components/TransactionLimitBanner';
import { TicketVerificationModal } from './components/TicketVerificationModal';
import { TicketPrintModal, PrintableTicketData } from './components/TicketPrintModal';
import { FullBetAiAssistantModal } from './components/FullBetAiAssistantModal';
import { check24hTransactionLimit } from './utils/transactionLimit';
import { serverFetchProfile, serverCompleteSportBet, clearSessionToken, fetchPaymentMethodsStatus } from './utils/api';
import { playClickSound, playWinSound, playBetPlacedSound } from './utils/audio';
import confetti from 'canvas-confetti';
import { Wrench, AlertTriangle, ShieldCheck, Phone, Mail, LogIn, Bot } from 'lucide-react';
import { formaterEtMasquer } from './utils/securityMasking';

export default function App() {
  // Main states
  const [user, setUser] = useState<UserProfile>(getStoredUser);
  const [activeModule, setActiveModule] = useState<GameModule>('sports');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string | null>(null);
  const [selectedCasinoGame, setSelectedCasinoGame] = useState<'crash' | 'jetx' | 'keno' | 'roulette' | 'slots' | 'luckyx' | 'luckysix'>('keno');

  // Data states
  const [matches] = useState(INITIAL_MATCHES);
  const [borletteResults] = useState(INITIAL_BORLETTE_RESULTS);
  const [selectedBets, setSelectedBets] = useState<BetSlipItem[]>([]);
  const [placedBets, setPlacedBets] = useState<PlacedBet[]>(getStoredBets);
  const [borletteTickets, setBorletteTickets] = useState<BorletteTicket[]>(getStoredBorletteTickets);
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(getStoredAdminSettings);

  // Mòd Konplete Fich En Kour (ID ticket an kour)
  const [completingBetId, setCompletingBetId] = useState<string | null>(null);
  const completingBet = placedBets.find(b => b.id === completingBetId && b.status === 'pending') || null;

  // Dialog modals states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBetSlipOpen, setIsBetSlipOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletInitialTab, setWalletInitialTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOwnerSuperAdminOpen, setIsOwnerSuperAdminOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isFirebaseLoginOpen, setIsFirebaseLoginOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isTop15ModalOpen, setIsTop15ModalOpen] = useState(false);
  const [isMultiLiveOpen, setIsMultiLiveOpen] = useState(false);
  const [isTicketVerifyOpen, setIsTicketVerifyOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activePrintTicket, setActivePrintTicket] = useState<PrintableTicketData | null>(null);

  // Sync session with secure server on mount
  useEffect(() => {
    serverFetchProfile().then(res => {
      if (res.status === 'success' && res.user) {
        setUser(prev => ({
          ...prev,
          id: res.user.id || prev.id,
          fullName: res.user.fullName || prev.fullName,
          phone: res.user.phone || prev.phone,
          balanceHTG: typeof res.user.balanceHTG === 'number' ? res.user.balanceHTG : prev.balanceHTG,
          role: res.user.role || prev.role
        }));
      }
    }).catch(() => {});
  }, []);

  // Sync payment methods blocked status on mount
  useEffect(() => {
    fetchPaymentMethodsStatus().then(res => {
      if (res.status === 'success' && res.blockedPaymentMethods) {
        setAdminSettings(prev => ({
          ...prev,
          blockedPaymentMethods: res.blockedPaymentMethods,
          paymentMethodsNotice: res.notices || prev.paymentMethodsNotice
        }));
      }
    }).catch(() => {});
  }, []);

  // Synchronize storage
  useEffect(() => {
    saveUser(user);
  }, [user]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveBets(placedBets);
  }, [placedBets]);

  useEffect(() => {
    saveBorletteTickets(borletteTickets);
  }, [borletteTickets]);

  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    saveAdminSettings(adminSettings);
  }, [adminSettings]);

  // Odd toggling (Max 35 selections limit & support completing active bets)
  const handleToggleBetSelection = (item: BetSlipItem) => {
    setSelectedBets(prev => {
      const exists = prev.some(
        b => b.matchId === item.matchId && b.marketName === item.marketName && b.selectionName === item.selectionName
      );
      if (exists) {
        return prev.filter(
          b => !(b.matchId === item.matchId && b.marketName === item.marketName && b.selectionName === item.selectionName)
        );
      } else {
        const currentCount = (completingBet ? completingBet.items.length : 0) + prev.length;
        if (currentCount >= 35) {
          alert(`⚠️ Limit Seleksyon Atteint : Maximum seleksyon yon kliyan ka chwazi se 35.\n${completingBet ? `Fich #${completingBet.id} deja gen ${completingBet.items.length} seleksyon, ou ka ajoute sèlman ${35 - completingBet.items.length} seleksyon anplis.` : 'Yon fich pa ka depase 35 seleksyon.'}`);
          return prev;
        }

        // Si fich la en kour ap konplete, evite double chwa menm match la si l te deja ladan l
        if (completingBet && completingBet.items.some(b => b.matchId === item.matchId && b.marketName === item.marketName && b.selectionName === item.selectionName)) {
          alert("Match ak pronostik sa a deja anrejistre sou fich sa a !");
          return prev;
        }

        // Règle formelle : Funbets pa dwe ka konbine
        const isItemFun = isItemFunBet(item);
        if (completingBet && isItemFun) {
          alert("⚠️ Règle FunBets : Funbets pa dwe ka konbine ! Ou pa ka ajoute yon FunBet sou yon fich ki deja fèt.");
          return prev;
        }

        // Si yon FunBet ap ajoute pandan gen lòt seleksyon deja nan fich la
        if (isItemFun && prev.length > 0) {
          alert("⚠️ Règle FunBets : Funbets pa dwe ka konbine !\nYon FunBet dwe jwe an Pari Senp (Simple) poukont li. Ou pa ka konbine li ak lòt match oswa lòt paryaj.");
          return prev;
        }

        // Si gen yon FunBet deja nan fich la epi n ap eseye ajoute yon lòt seleksyon
        if (prev.some(isItemFunBet)) {
          alert("⚠️ Règle FunBets : Funbets pa dwe ka konbine !\nFich sa a gen yon FunBet deja. Yon FunBet dwe jwe an Pari Senp (Simple) poukont li san okenn lòt seleksyon.");
          return prev;
        }

        return [...prev, item];
      }
    });
  };

  const handleRemoveBet = (index: number) => {
    setSelectedBets(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllBets = () => {
    setSelectedBets([]);
  };

  // Mòd Konplete Fich En Kour Handlers
  const handleStartCompleteBet = (ticketId: string) => {
    const bet = placedBets.find(b => b.id === ticketId);
    if (!bet) {
      alert("Fich sa a pa jwenn.");
      return;
    }
    if (bet.status !== 'pending') {
      alert("Ou ka komplete yon fich sèlman depi fich la en kour (pending). Fich sa a deja fèmen oswa regle.");
      return;
    }
    if (bet.items.length >= 35) {
      alert("Fich sa a deja genyen 35 seleksyon (limit maksimòm). Ou pa ka ajoute plis seleksyon.");
      return;
    }
    setCompletingBetId(ticketId);
    setSelectedBets([]);
    setIsBetSlipOpen(true);
  };

  const handleCancelCompleteBet = () => {
    setCompletingBetId(null);
    setSelectedBets([]);
  };

  const handleConfirmCompleteBet = async (ticketId: string, additionalItems: BetSlipItem[]) => {
    const bet = placedBets.find(b => b.id === ticketId);
    if (!bet || bet.status !== 'pending') {
      alert("Fich sa a pa ka konplete ankò (pa en kour).");
      return;
    }
    if (additionalItems.length === 0) {
      alert("Tanpri chwazi omwen yon nouvo seleksyon pou ajoute.");
      return;
    }
    const totalCount = bet.items.length + additionalItems.length;
    if (totalCount > 35) {
      alert(`⚠️ Maximum seleksyon yon kliyan ka chwazi se 35. Total seleksyon fich la t ap depase limit la (${totalCount}/35).`);
      return;
    }

    // Contrôle strict de la règle FunBets (Ne peuvent jamais être combinés)
    const hasFunInOriginal = bet.items.some(isItemFunBet);
    const hasFunInAdditional = additionalItems.some(isItemFunBet);
    if (hasFunInOriginal || hasFunInAdditional) {
      alert("⚠️ Règle FunBets : Funbets pa dwe ka konbine !\nLi entèdi pou konbine oswa ajoute FunBets nan yon fich konplete.");
      return;
    }

    // Calcul des nouvelles cotes et gains
    const additionalOdds = additionalItems.reduce((acc, curr) => acc * curr.rate, 1);
    const newTotalOdds = Math.min(Number((bet.totalRate * additionalOdds).toFixed(2)), 50000.0);
    const rawPotentialWin = Math.round(bet.stake * newTotalOdds);
    if (rawPotentialWin > 1500000) {
      alert(`⚠️ Plafon Maksimòm Depase : Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG (gain kalkile : ${rawPotentialWin.toLocaleString()} HTG). Fich la pa dwe depase montan sa, tanpri retire kèk seleksyon pou pa depase plafon an.`);
      return;
    }
    const newPotentialWin = Math.min(rawPotentialWin, 1500000.0);

    const updatedBet: PlacedBet = {
      ...bet,
      type: 'combine',
      items: [...bet.items, ...additionalItems],
      totalRate: newTotalOdds,
      potentialWin: newPotentialWin,
      isCompleted: true,
      completedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      originalOdds: bet.originalOdds || bet.totalRate
    };

    setPlacedBets(prev => prev.map(b => (b.id === ticketId ? updatedBet : b)));
    setCompletingBetId(null);
    setSelectedBets([]);

    // Call server endpoint
    try {
      serverCompleteSportBet({
        ticketId,
        additionalSelections: additionalItems.map(item => ({
          matchId: item.matchId,
          matchName: item.matchTitle,
          marketName: item.marketName,
          selectionName: item.selectionName,
          odds: item.rate
        }))
      }).catch(err => console.warn('[Server Complete Bet Sync]', err));
    } catch (e) {
      console.warn(e);
    }

    playBetPlacedSound();
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Enprime fich konplete a touswit
    setActivePrintTicket({
      ticketCode: updatedBet.id,
      date: new Date().toLocaleString('fr-FR'),
      userId: user.id || 'usr-80491',
      gameType: 'Paris sportifs combinés (Konplete)',
      odds: updatedBet.totalRate,
      betAmount: updatedBet.stake,
      potentialPayout: updatedBet.potentialWin,
      status: 'PENDING',
      matches: updatedBet.items.map(item => ({
        match: item.matchTitle,
        selection: `${item.marketName} : ${item.selectionName}`,
        odds: item.rate,
        match_time: item.league
      })),
      details: updatedBet.items.map((i, idx) => `${idx + 1}. ${i.matchTitle}: ${i.selectionName} (@${i.rate.toFixed(2)})`).join(' | ')
    });
  };

  // Déconnexion sécurisée de la session utilisateur
  const handleLogout = () => {
    playClickSound();
    clearSessionToken();
    const guestUser: UserProfile = {
      ...DEFAULT_USER,
      id: `usr-${Math.floor(10000 + Math.random() * 90000)}`,
      fullName: 'Utilisateur Invité',
      phone: 'Non connecté',
      balanceHTG: 0
    };
    setUser(guestUser);
    setSelectedBets([]);
    setCompletingBetId(null);
    setIsProfileOpen(false);
    setIsDrawerOpen(false);

    const logoutNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: '🔒 Déconnexion sécurisée',
      message: 'Votre session a été fermée en toute sécurité. Vos données et soldes sont protégés.',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: 'admin_announcement'
    };
    setNotifications(prev => [logoutNotif, ...prev]);
  };

  // Check sliding 24-hour limit of 15 transactions
  const limitStatus = check24hTransactionLimit(transactions);
  const isLimitBlocked = !limitStatus.canTransact;

  // Place bet
  const handlePlaceBet = (newBet: PlacedBet) => {
    if (isLimitBlocked) {
      alert("Alerte FULL BET : Limite de 15 transactions atteinte. Réessayez après expiration du délai.");
      return;
    }

    // 1. Contrôle strict de la règle FunBets (Interdiction absolue de combiner des FunBets)
    const hasFunBet = newBet.items.some(isItemFunBet);
    if (hasFunBet && (newBet.items.length > 1 || newBet.type !== 'simple')) {
      alert(
        "⚠️ Règle FunBets : Funbets pa dwe ka konbine !\nYon FunBet dwe jwe an Pari Senp (Simple) poukont li san melanje ak lòt match oswa lòt paryaj.\n\nFich sa a pa ka valide."
      );
      return;
    }

    // 2. Contrôle strict du Plafond de Gains (La somme des gains ne doit jamais dépasser 1 500 000 HTG)
    const appliedOdds = Math.min(newBet.totalRate, 50000.0);
    const rawPotentialWin = Math.round(newBet.stake * appliedOdds);
    if (rawPotentialWin > 1500000 || newBet.potentialWin > 1500000) {
      alert(
        `⚠️ Plafon Maksimòm Depase : La somme des gains ne doit jamais dépasser le plafond de 1 500 000 HTG (gain kalkile : ${rawPotentialWin.toLocaleString()} HTG).\n\nFich la pa ka valide toutotan li depase montan sa. Tanpri diminye miz lan oswa modifye seleksyon yo anvan validasyon.`
      );
      return;
    }

    const potentialWin = Math.min(rawPotentialWin, 1500000.0);
    const cappedBet: PlacedBet = {
      ...newBet,
      totalRate: appliedOdds,
      potentialWin
    };

    setUser(prev => ({
      ...prev,
      balanceHTG: prev.balanceHTG - cappedBet.stake
    }));
    setPlacedBets(prev => [cappedBet, ...prev]);

    // Add transaction record
    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      type: 'bet_stake',
      amount: cappedBet.stake,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR'),
      status: 'approved',
      referenceId: cappedBet.id,
      details: `Pari Sportif (${cappedBet.type === 'combine' ? 'Combiné' : 'Simple'}) [${cappedBet.id}]`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Cash out
  const handleCashOut = (betId: string, cashOutAmount: number) => {
    setPlacedBets(prev =>
      prev.map(b => (b.id === betId ? { ...b, status: 'cashed_out' } : b))
    );
    setUser(prev => ({
      ...prev,
      balanceHTG: prev.balanceHTG + cashOutAmount
    }));
    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      type: 'bet_won',
      amount: cashOutAmount,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR'),
      status: 'approved',
      referenceId: betId,
      details: `Cash Out validé (+${cashOutAmount} HTG)`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Update balance
  const handleUpdateBalance = (newBalance: number, reason: string) => {
    setUser(prev => ({ ...prev, balanceHTG: newBalance }));
  };

  // Borlette Ticket
  const handlePlaceBorletteTicket = (newTicket: BorletteTicket) => {
    if (isLimitBlocked) {
      alert("Alerte FULL BET : Limite de 15 transactions atteinte. Réessayez après expiration du délai.");
      return;
    }

    const rawPotentialWin = newTicket.potentialWin || newTicket.items.reduce((acc, curr) => acc + curr.potentialWin, 0);
    const appliedPotentialWin = Math.min(rawPotentialWin, 1000000.0);
    const cappedTicket: BorletteTicket = {
      ...newTicket,
      potentialWin: appliedPotentialWin
    };

    setUser(prev => ({
      ...prev,
      balanceHTG: prev.balanceHTG - cappedTicket.totalStake
    }));
    setBorletteTickets(prev => [cappedTicket, ...prev]);

    const newTx: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      type: 'bet_stake',
      amount: cappedTicket.totalStake,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR'),
      status: 'approved',
      referenceId: cappedTicket.id,
      details: `Fiche Borlette (${cappedTicket.drawName}) [${cappedTicket.id}]`
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Admin updates
  const handleUpdateTransactionStatus = (txId: string, newStatus: 'approved' | 'rejected') => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === txId) {
          // If approved and was deposit, ensure credited if not yet
          return { ...tx, status: newStatus };
        }
        return tx;
      })
    );
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
  };

  const handleSendNotification = (notif: AppNotification) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleOpenWallet = (tab: 'deposit' | 'withdraw' = 'deposit') => {
    setWalletInitialTab(tab);
    setIsWalletOpen(true);
  };

  const unreadNotifsCount = notifications.filter(n => !n.read).length;
  const isUserAdminOrOwner = user.role === 'admin' || user.role === 'OWNER' || user.email === 'fullbet509@gmail.com' || user.email === 'josephsalem946@gmail.com';

  const handleForceLogout = (reason: string) => {
    setUser(prev => ({
      ...prev,
      isLoggedIn: false,
      sessionToken: undefined
    }));
    alert(`⚠️ Déconnexion de sécurité : ${reason}`);
  };

  return (
    <LanguageProvider>
      <FeaturesProvider user={user} onForceLogout={handleForceLogout}>
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-cyan-500 selection:text-black">
          {/* Global Maintenance Warning for Admin / Owner */}
          {adminSettings.maintenanceMode && isUserAdminOrOwner && (
            <div className="bg-gradient-to-r from-amber-600/90 to-red-600/90 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping"></span>
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span>
                  <strong>MODE MAINTENANCE GLOBAL ACTIF :</strong> L'accès public est restreint. Vous naviguez en mode Super-Admin.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOwnerSuperAdminOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-white text-red-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Super-Admin HQ
                </button>
                <button
                  onClick={() => {
                    handleUpdateAdminSettings({ ...adminSettings, maintenanceMode: false });
                  }}
                  className="px-2.5 py-1 rounded-md bg-black/40 text-white hover:bg-black/60 transition-colors"
                >
                  Désactiver la maintenance
                </button>
              </div>
            </div>
          )}

          {/* Top Application Bar */}
          <Header
            user={user}
            activeModule={activeModule}
            onSelectModule={(mod) => {
              setActiveModule(mod);
              setSelectedLeagueFilter(null);
            }}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenWallet={handleOpenWallet}
            onOpenBetSlip={() => setIsBetSlipOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenFirebaseLogin={() => setIsFirebaseLoginOpen(true)}
            onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
            onOpenPrintTicket={() => setIsTicketVerifyOpen(true)}
            onPrintTicketData={(ticketData) => setActivePrintTicket(ticketData)}
            onOpenTicketVerify={() => setIsTicketVerifyOpen(true)}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            activeBetsCount={selectedBets.length}
            unreadNotifsCount={unreadNotifsCount}
          />

          {/* 24-Hour Sliding Transaction Limit Warning & Critical Countdown Banner */}
          <TransactionLimitBanner
            transactions={transactions}
            onOpenRules={() => setIsRulesOpen(true)}
          />

          {/* If Platform is in Maintenance and user is NOT Admin/Owner */}
          {adminSettings.maintenanceMode && !isUserAdminOrOwner ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto my-12">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl animate-pulse">
                <Wrench className="w-10 h-10" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
                Intervention Technique en Cours
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 mb-3">
                Full Bet (fullbet.com) est momentanément en maintenance
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Nos ingénieurs procèdent actuellement à des améliorations de l'infrastructure et au calibrage des flux officiels de tirages. Vos soldes et tickets sont 100% sécurisés.
              </p>

              <div className="w-full bg-[#0d1424] border border-slate-800 rounded-2xl p-4 text-left space-y-3 mb-6">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Passerelles & Contacts Officiels de Support</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Passerelle Natcash</span>
                    <strong className="text-emerald-400 font-mono">{formaterEtMasquer('+509 3215 3281', 'telephone')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Passerelle Moncash</span>
                    <strong className="text-red-400 font-mono">{formaterEtMasquer('+509 4687 7695', 'telephone')}</strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Direction & Support : <strong>fullbet509@gmail.com</strong></span>
                </div>
              </div>

              <button
                onClick={() => setIsFirebaseLoginOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Accès Direction / Connexion Admin</span>
              </button>
            </div>
          ) : (
            /* Main Content Area Based on Active Game Module */
            <main className="flex-1">
              {activeModule === 'sports' && (
                <SportsScreen
                  matches={matches}
                  selectedBets={selectedBets}
                  onToggleBetSelection={handleToggleBetSelection}
                  selectedLeagueFilter={selectedLeagueFilter}
                  onClearLeagueFilter={() => setSelectedLeagueFilter(null)}
                  onOpenBetSlip={() => setIsBetSlipOpen(true)}
                  isAdmin={isUserAdminOrOwner}
                  onOpenAdmin={() => setIsAdminOpen(true)}
                  onNavigateModule={(mod) => {
                    setActiveModule(mod);
                    setSelectedLeagueFilter(null);
                  }}
                  completingBet={completingBet}
                  onCancelCompleteBet={handleCancelCompleteBet}
                />
              )}

              {activeModule === 'casino' && (
                <CasinoScreen
                  user={user}
                  onUpdateBalance={handleUpdateBalance}
                  onOpenWallet={() => handleOpenWallet('deposit')}
                  selectedGame={selectedCasinoGame}
                  onSelectGame={setSelectedCasinoGame}
                  onNavigateModule={(mod) => setActiveModule(mod)}
                />
              )}

              {activeModule === 'borlette' && (
                <BorletteScreen
                  user={user}
                  results={borletteResults}
                  tickets={borletteTickets}
                  onPlaceBorletteTicket={handlePlaceBorletteTicket}
                  onOpenWallet={() => handleOpenWallet('deposit')}
                  onNavigateModule={(mod) => setActiveModule(mod)}
                />
              )}
            </main>
          )}

        {/* Pied de page (Footer / Informations techniques & Mentions légales) */}
        <Footer
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
          onOpenTicketVerify={() => setIsTicketVerifyOpen(true)}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
        />

        {/* Sliding Menu (Drawer) */}
        <GainCashSlidingMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          user={user}
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            setSelectedLeagueFilter(null);
          }}
          onSelectCasinoGame={(game) => {
            setSelectedCasinoGame(game);
            setActiveModule('casino');
            setSelectedLeagueFilter(null);
          }}
          onSelectLeague={(league) => {
            setSelectedLeagueFilter(league);
            setActiveModule('sports');
          }}
          onOpenWallet={handleOpenWallet}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenOwnerSuperAdmin={() => setIsOwnerSuperAdminOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenFirebaseLogin={() => setIsFirebaseLoginOpen(true)}
          onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
          onOpenTop15Modal={() => setIsTop15ModalOpen(true)}
          onOpenBetSlip={() => setIsBetSlipOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenTicketVerify={() => setIsTicketVerifyOpen(true)}
          onOpenMultiLive={() => setIsMultiLiveOpen(true)}
          onPrintTicketData={setActivePrintTicket}
          onLogout={handleLogout}
          unreadNotifsCount={unreadNotifsCount}
        />

        {/* Bet Slip Modal */}
        <BetSlipModal
          isOpen={isBetSlipOpen}
          onClose={() => setIsBetSlipOpen(false)}
          selectedBets={selectedBets}
          onRemoveBet={handleRemoveBet}
          onClearAll={handleClearAllBets}
          user={user}
          placedBets={placedBets}
          onPlaceBet={handlePlaceBet}
          onCashOut={handleCashOut}
          onOpenWallet={() => handleOpenWallet('deposit')}
          isLimitBlocked={isLimitBlocked}
          completingBet={completingBet}
          onStartCompleteBet={handleStartCompleteBet}
          onCancelCompleteBet={handleCancelCompleteBet}
          onConfirmCompleteBet={handleConfirmCompleteBet}
        />

        {/* Wallet / Caisse Modal */}
        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          user={user}
          initialTab={walletInitialTab}
          transactions={transactions}
          onAddTransaction={(tx) => setTransactions(prev => [tx, ...prev])}
          onUpdateBalance={handleUpdateBalance}
          blockedPaymentMethods={adminSettings.blockedPaymentMethods || []}
          paymentMethodsNotice={adminSettings.paymentMethodsNotice || {}}
        />

        {/* Rules & Conditions Modal (Full Bet v1.0.0 FAQ & Help Center) */}
        <RulesAndTermsModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          onOpenWallet={handleOpenWallet}
          onOpenBetSlip={() => setIsBetSlipOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            setSelectedLeagueFilter(null);
          }}
        />

        {/* Privacy Policy Modal (Full Bet RGPD, Sécurité, Biométrie, Protection des Joueurs) */}
        <PrivacyPolicyModal
          isOpen={isPrivacyPolicyOpen}
          onClose={() => setIsPrivacyPolicyOpen(false)}
          onOpenRules={() => {
            setIsPrivacyPolicyOpen(false);
            setIsRulesOpen(true);
          }}
        />

        {/* Admin Panel Modal */}
        <AdminPanelModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          user={user}
          transactions={transactions}
          adminSettings={adminSettings}
          onUpdateTransactionStatus={handleUpdateTransactionStatus}
          onUpdateUser={handleUpdateUser}
          onUpdateAdminSettings={handleUpdateAdminSettings}
          onSendNotification={handleSendNotification}
          onOpenOwnerSuperAdmin={() => setIsOwnerSuperAdminOpen(true)}
        />

        {/* Owner Super-Admin Backoffice Modal (2FA & Contrôle Total) */}
        <OwnerSuperAdminModal
          isOpen={isOwnerSuperAdminOpen}
          onClose={() => setIsOwnerSuperAdminOpen(false)}
          user={user}
          transactions={transactions}
          adminSettings={adminSettings}
          onUpdateTransactionStatus={handleUpdateTransactionStatus}
          onUpdateAdminSettings={handleUpdateAdminSettings}
          onUpdateUser={handleUpdateUser}
          onSendNotification={handleSendNotification}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Profile Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onUpdateUser={handleUpdateUser}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenWallet={() => handleOpenWallet('deposit')}
        />

        {/* Firebase Login / Inscription Modal */}
        <FirebaseLoginModal
          isOpen={isFirebaseLoginOpen}
          onClose={() => setIsFirebaseLoginOpen(false)}
          currentUser={user}
          onLoginSuccess={(updatedUser) => {
            setUser(updatedUser);
          }}
        />

        {/* Notifications Drawer */}
        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllNotifsRead}
          onDeleteNotification={handleDeleteNotification}
          onClearAllNotifications={handleClearAllNotifications}
        />

        {/* Download App Modal (.APK / iOS / PWA) */}
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />

        {/* Full Bet Top 15 Jwèt & Aviator Screen Modal */}
        <FullBetTop15Modal
          isOpen={isTop15ModalOpen}
          onClose={() => setIsTop15ModalOpen(false)}
          userBalance={user.balanceHTG}
          onUpdateBalance={handleUpdateBalance}
          onSelectGame={(game) => {
            if (game.targetModule === 'sports') {
              setActiveModule('sports');
              setSelectedLeagueFilter(null);
            } else if (game.casinoId) {
              setSelectedCasinoGame(game.casinoId);
              setActiveModule('casino');
              setSelectedLeagueFilter(null);
            } else {
              setActiveModule('casino');
              setSelectedLeagueFilter(null);
            }
          }}
        />

        {/* Modal de Vérification de Coupon / Ticket (FB-XXXX-YYYY) */}
        <TicketVerificationModal
          isOpen={isTicketVerifyOpen}
          onClose={() => setIsTicketVerifyOpen(false)}
          onStartCompleteBet={handleStartCompleteBet}
        />

        {/* Multi-Live Gri (2x2 Multi-View - Keno, JetX, Borlette, Paris Sportifs) Modal */}
        <MultiLiveModal
          isOpen={isMultiLiveOpen}
          onClose={() => setIsMultiLiveOpen(false)}
          user={user}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            setSelectedLeagueFilter(null);
          }}
          onSelectCasinoGame={(game) => {
            setSelectedCasinoGame(game);
            setActiveModule('casino');
            setSelectedLeagueFilter(null);
          }}
        />

        {/* Modal d'Impression Thermique POS Multi-Formats (80mm / 58mm / A4) */}
        {activePrintTicket && (
          <TicketPrintModal
            isOpen={true}
            onClose={() => setActivePrintTicket(null)}
            ticket={activePrintTicket}
          />
        )}

        {/* Modal Assistant Virtuel Full Bet */}
        <FullBetAiAssistantModal
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          onOpenWallet={() => handleOpenWallet('deposit')}
        />

        {/* Bouton d'accès rapide flottant Assistant Full Bet */}
        <button
          onClick={() => {
            playClickSound();
            setIsAssistantOpen(true);
          }}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-[#eab308] to-amber-500 text-slate-950 font-bold shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40"
          title="Assistant Virtuel Full Bet (Paiements, Support, Aide)"
        >
          <Bot className="w-5 h-5 text-slate-950" />
          <span className="text-xs tracking-wide hidden xs:inline">Assistant Full Bet</span>
          <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
        </button>

        {/* Bouton Scroll-to-Top Global */}
        <ScrollToTopButton />
      </div>
    </FeaturesProvider>
  </LanguageProvider>
  );
}
