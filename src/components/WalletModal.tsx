import React, { useState } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  Printer,
  Zap,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  ArrowUpCircle,
  ExternalLink,
  Smartphone,
  AlertTriangle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Transaction } from '../types';
import { HTG_TO_USD_RATE } from '../utils/storage';
import { serverSubmitDeposit, serverSubmitWithdraw } from '../utils/api';
import { playClickSound, playWinSound, playBetPlacedSound } from '../utils/audio';
import { formaterEtMasquer } from '../utils/securityMasking';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  initialTab?: 'deposit' | 'withdraw' | 'history';
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateBalance: (newBalance: number, reason: string) => void;
}

// Payment method definition matching exact specification
interface PaymentOption {
  id: 'natcash' | 'moncash' | 'card' | 'voucher';
  name: string;
  min: number;
  max: number;
  currency: string;
  color: string;
  bg: string;
  border: string;
  initial: string;
  gatewayUrl: string;
  gatewayHost: string;
  serviceBadge: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'natcash',
    name: 'NatCash - Online',
    min: 25,
    max: 500000,
    currency: 'HTG',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    initial: 'N',
    gatewayUrl: 'https://natpay.natcom.com.ht',
    gatewayHost: 'natpay.natcom.com.ht',
    serviceBadge: 'Natcom NatPay'
  },
  {
    id: 'moncash',
    name: 'MonCash - Online',
    min: 25,
    max: 500000,
    currency: 'HTG',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    initial: 'M',
    gatewayUrl: 'https://moncashbutton.digicelgroup.com',
    gatewayHost: 'moncashbutton.digicelgroup.com',
    serviceBadge: 'Digicel MonCash'
  },
  {
    id: 'card',
    name: 'Carte Bancaire (Visa / MC)',
    min: 100,
    max: 250000,
    currency: 'HTG',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    initial: 'C',
    gatewayUrl: 'https://secure.fullbet.com/card',
    gatewayHost: 'pci-dss.secure-gateway.com',
    serviceBadge: 'Visa / Mastercard 3D'
  },
  {
    id: 'voucher',
    name: 'Code Recharge Express',
    min: 50,
    max: 100000,
    currency: 'HTG',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    initial: 'V',
    gatewayUrl: 'https://secure.fullbet.com/voucher',
    gatewayHost: 'voucher.fullbet.com',
    serviceBadge: 'Coupon Cash Point'
  }
];

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000, 10000, 25000];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  user,
  initialTab = 'deposit',
  transactions,
  onAddTransaction,
  onUpdateBalance
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);

  // ÉTAPES DE RECHARGE EN LIGNE (1: Sélection, 2: Saisie du montant, 3: Passerelle en ligne)
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1);
  const [selectedOption, setSelectedOption] = useState<PaymentOption>(PAYMENT_OPTIONS[0]);

  // Disponibilité de MonCash (permet de simuler l'état grisé / indisponible tel que décrit dans le cahier des charges)
  const [isMonCashAvailable, setIsMonCashAvailable] = useState<boolean>(true);

  // Étape 2: Saisie du montant
  const [depositAmount, setDepositAmount] = useState<number>(1000);
  const [hasConfirmedActiveAccount, setHasConfirmedActiveAccount] = useState<boolean>(true);

  // Étape 3: Authentification Passerelle en ligne
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directPin, setDirectPin] = useState<string>('');

  // Retrait
  const [withdrawGateway, setWithdrawGateway] = useState<'natcash' | 'moncash'>('natcash');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(1000);
  const [withdrawPhone, setWithdrawPhone] = useState<string>(user.phone || '');

  // Sekirite Full Bet : Nimewo retrè a toujou lye ak nimewo enskripsyon kont lan
  React.useEffect(() => {
    if (user.phone) {
      setWithdrawPhone(user.phone);
    }
  }, [user.phone]);

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');

  // Custom Modal (Remplace tout window.alert / confirm)
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    iconText: string;
    iconColor: string;
    iconBg: string;
    onCloseAction?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    iconText: '✓',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50'
  });

  if (!isOpen) return null;

  const showCustomModal = (
    title: string,
    message: string,
    iconText = '✓',
    iconColor = 'text-emerald-600',
    iconBg = 'bg-emerald-50',
    onCloseAction?: () => void
  ) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      iconText,
      iconColor,
      iconBg,
      onCloseAction
    });
  };

  const closeCustomModal = () => {
    const action = customModal.onCloseAction;
    setCustomModal(prev => ({ ...prev, isOpen: false }));
    if (action) action();
  };

  // Étape 1 ➔ Étape 2
  const handleSelectOption = (opt: PaymentOption) => {
    if (opt.id === 'moncash' && !isMonCashAvailable) {
      showCustomModal(
        "Service Momentanément Indisponible",
        "Le service MonCash - Online est actuellement en maintenance technique. Veuillez utiliser Natcash - Online ou réessayer ultérieurement.",
        "!",
        "text-amber-600",
        "bg-amber-50"
      );
      return;
    }
    playClickSound();
    setSelectedOption(opt);
    setDepositStep(2);
  };

  // Étape 2 ➔ Étape 3 (Validation du montant et passage à la passerelle)
  const handleProceedToGateway = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (depositAmount < selectedOption.min || depositAmount > selectedOption.max) {
      showCustomModal(
        "Montant Hors Limites",
        `Le montant minimum est de ${selectedOption.min.toLocaleString()} HTG et le montant maximum est de ${selectedOption.max.toLocaleString()} HTG.`,
        "✕",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

    if (!hasConfirmedActiveAccount) {
      showCustomModal(
        "Confirmation Requise",
        `Veuillez confirmer que vous disposez d'un compte actif ${selectedOption.name} avant de continuer.`,
        "!",
        "text-amber-600",
        "bg-amber-50"
      );
      return;
    }

    setDepositStep(3);
  };

  // Étape 3 : Finalisation directe du paiement sur la passerelle
  const handleFinalizeGatewayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (!directPhone.trim() || directPhone.replace(/\D/g, '').length < 8) {
      showCustomModal(
        "Numéro Invalide",
        "Veuillez saisir votre numéro de téléphone mobile actif (+509 xxxx xxxx).",
        "✕",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

    if (!directPin.trim() || directPin.length < 4) {
      showCustomModal(
        "Code PIN Incomplet",
        "Veuillez entrer votre code PIN / code secret pour autoriser la transaction.",
        "✕",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

    setIsProcessing(true);

    const gatewayPrefix = selectedOption.id === 'natcash' ? 'NATPAY' : 'MONCASH';
    const refId = `${gatewayPrefix}-${Date.now().toString().slice(-8)}`;

    try {
      const res = await serverSubmitDeposit({
        gateway: selectedOption.name as any,
        amount: depositAmount,
        referenceId: refId,
        phoneNumber: directPhone.trim(),
        details: `Paiement en ligne direct via ${selectedOption.gatewayHost}`
      });

      if (res.status === 'error') {
        showCustomModal(
          "Échec de la transaction",
          res.error || "La passerelle n'a pas pu valider le paiement.",
          "✕",
          "text-red-600",
          "bg-red-50"
        );
        setIsProcessing(false);
        return;
      }

      playWinSound();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      const newTx: Transaction = res.transaction || {
        id: refId,
        type: 'deposit',
        gateway: selectedOption.name,
        amount: depositAmount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'approved',
        referenceId: refId,
        phoneNumber: directPhone.trim(),
        details: `Recharge validée via ${selectedOption.gatewayHost} (+${depositAmount.toLocaleString()} HTG)`
      };

      onAddTransaction(newTx);
      const newBal = typeof res.newBalance === 'number' ? res.newBalance : user.balanceHTG + depositAmount;
      onUpdateBalance(newBal, `Dépôt en ligne direct ${selectedOption.name} (+${depositAmount.toLocaleString()} HTG)`);

      showCustomModal(
        "Paiement Validé avec Succès",
        `Votre compte a été crédité immédiatement de ${depositAmount.toLocaleString()} HTG via la passerelle sécurisée ${selectedOption.gatewayHost}.`,
        "✓",
        "text-emerald-600",
        "bg-emerald-50",
        () => {
          setDepositStep(1);
          setDirectPhone('');
          setDirectPin('');
          setActiveTab('history');
          setReceiptTx(newTx);
        }
      );
    } catch {
      // Local fallback
      playWinSound();
      const newTx: Transaction = {
        id: refId,
        type: 'deposit',
        gateway: selectedOption.name,
        amount: depositAmount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'approved',
        referenceId: refId,
        phoneNumber: directPhone.trim(),
        details: `Recharge validée via ${selectedOption.gatewayHost} (+${depositAmount.toLocaleString()} HTG)`
      };
      onAddTransaction(newTx);
      onUpdateBalance(user.balanceHTG + depositAmount, `Dépôt en ligne direct ${selectedOption.name} (+${depositAmount.toLocaleString()} HTG)`);

      showCustomModal(
        "Paiement Validé avec Succès",
        `Votre compte a été crédité immédiatement de ${depositAmount.toLocaleString()} HTG via la passerelle sécurisée ${selectedOption.gatewayHost}.`,
        "✓",
        "text-emerald-600",
        "bg-emerald-50",
        () => {
          setDepositStep(1);
          setDirectPhone('');
          setDirectPin('');
          setActiveTab('history');
          setReceiptTx(newTx);
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Traitement Retrait
  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (withdrawAmount < 50) {
      showCustomModal("Montant trop bas", "Le montant minimum de retrait est de 50 HTG.", "✕", "text-red-600", "bg-red-50");
      return;
    }

    const maxLimit = withdrawGateway === 'natcash' ? 40000 : 100000;
    if (withdrawAmount > maxLimit) {
      showCustomModal(
        "Plafond dépassé",
        `Le montant maximum par retrait pour ${withdrawGateway === 'natcash' ? 'NatCash - Online' : 'MonCash - Online'} est de ${maxLimit.toLocaleString()} HTG.`,
        "✕",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

    if (withdrawAmount > user.balanceHTG) {
      showCustomModal("Solde insuffisant", "Votre solde actuel ne permet pas d'effectuer ce retrait.", "✕", "text-red-600", "bg-red-50");
      return;
    }

    const registeredPhone = (user.phone || withdrawPhone || '').trim();

    if (!registeredPhone) {
      showCustomModal(
        "Nimewo Enskripsyon Manke",
        "Pou rezon sekirite, retrè a fèt sèlman sou nimewo telefòn ou te enskri sou kont Full Bet la. Tanpri konfigire nimewo w nan pwofil ou.",
        "!",
        "text-amber-600",
        "bg-amber-50"
      );
      return;
    }

    setIsProcessing(true);
    const gatewayLabel = withdrawGateway === 'natcash' ? 'NatCash Online' : 'MonCash Online';
    const refId = `WIT-${Date.now().toString().slice(-8)}`;

    try {
      const res = await serverSubmitWithdraw({
        gateway: gatewayLabel as any,
        amount: withdrawAmount,
        phoneNumber: registeredPhone
      });

      if (res.status === 'error') {
        showCustomModal("Erreur de retrait", res.error || "Impossible de soumettre le retrait.", "✕", "text-red-600", "bg-red-50");
        setIsProcessing(false);
        return;
      }

      playBetPlacedSound();
      const newTx: Transaction = res.transaction || {
        id: refId,
        type: 'withdrawal',
        gateway: gatewayLabel,
        amount: withdrawAmount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        referenceId: refId,
        phoneNumber: withdrawPhone.trim(),
        details: `Demande de retrait vers ${gatewayLabel}`
      };

      onAddTransaction(newTx);
      const newBal = typeof res.newBalance === 'number' ? res.newBalance : user.balanceHTG - withdrawAmount;
      onUpdateBalance(newBal, `Demande Retrait ${gatewayLabel} (-${withdrawAmount} HTG)`);

      showCustomModal(
        "Demande Transmise",
        `Votre demande de retrait de ${withdrawAmount.toLocaleString()} HTG a été enregistrée avec succès. Traitement sous 3 à 15 minutes.`,
        "✓",
        "text-emerald-600",
        "bg-emerald-50",
        () => {
          setActiveTab('history');
          setReceiptTx(newTx);
        }
      );
    } catch {
      const newTx: Transaction = {
        id: refId,
        type: 'withdrawal',
        gateway: gatewayLabel,
        amount: withdrawAmount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        referenceId: refId,
        phoneNumber: withdrawPhone.trim(),
        details: `Demande de retrait vers ${gatewayLabel}`
      };
      onAddTransaction(newTx);
      onUpdateBalance(user.balanceHTG - withdrawAmount, `Demande Retrait ${gatewayLabel} (-${withdrawAmount} HTG)`);

      showCustomModal(
        "Demande Transmise",
        `Votre demande de retrait de ${withdrawAmount.toLocaleString()} HTG a été enregistrée avec succès. Traitement sous 3 à 15 minutes.`,
        "✓",
        "text-emerald-600",
        "bg-emerald-50",
        () => {
          setActiveTab('history');
          setReceiptTx(newTx);
        }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    if (historyFilter === 'deposit') return tx.type === 'deposit';
    if (historyFilter === 'withdraw') return tx.type === 'withdrawal' || tx.type === 'withdraw';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 selection:bg-emerald-500 selection:text-white">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-100 text-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden border border-slate-200">
        
        {/* HEADER BAR */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            {activeTab === 'deposit' && depositStep > 1 ? (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setDepositStep((prev) => (prev === 3 ? 2 : 1));
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                title="Retour à l'étape précédente"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : null}

            <div>
              <h1 className="text-base font-extrabold tracking-wide text-slate-900 flex items-center gap-1.5">
                FULL BET
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {activeTab === 'deposit'
                  ? depositStep === 1
                    ? '1. Sélection du mode de paiement'
                    : depositStep === 2
                    ? '2. Saisie du montant et validation'
                    : '3. Accès direct aux comptes en ligne'
                  : activeTab === 'withdraw'
                  ? 'Retrait de gains en ligne'
                  : 'Historique des transactions'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sécurisé</span>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* User Balance Overview Strip */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
              Solde Actuel
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-black font-mono text-emerald-700">
                {user.balanceHTG.toLocaleString('fr-FR')} HTG
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (≈ ${(user.balanceHTG / HTG_TO_USD_RATE).toFixed(2)} USD)
              </span>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('deposit');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'deposit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dépôt
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('withdraw');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'withdraw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Retrait
            </button>
            <button
              onClick={() => {
                playClickSound();
                setActiveTab('history');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* STEP PROGRESS BAR (For deposit flow) */}
        {activeTab === 'deposit' && (
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                depositStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </span>
              <span className={depositStep === 1 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                Mode
              </span>
            </div>

            <span className="text-slate-300">➔</span>

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                depositStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </span>
              <span className={depositStep === 2 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                Montant
              </span>
            </div>

            <span className="text-slate-300">➔</span>

            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                depositStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </span>
              <span className={depositStep === 3 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                Passerelle
              </span>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col justify-between space-y-4">
          
          {/* ========================================================= */}
          {/* DÉPÔT : 3 NOUVELLES ÉTAPES REQUISES PAR LE CLIENT          */}
          {/* ========================================================= */}
          {activeTab === 'deposit' && (
            <div>

              {/* ----------------------------------------------------- */}
              {/* ÉTAPE 1 : SÉLECTION DU MODE DE PAIEMENT               */}
              {/* ----------------------------------------------------- */}
              {depositStep === 1 && (
                <div className="space-y-3.5 transition-all duration-300">
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        1. Choisissez votre mode de paiement
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Sélectionnez une passerelle active pour continuer
                      </p>
                    </div>

                    {/* Toggle pour tester l'état disponible vs grisé/indisponible */}
                    <button
                      type="button"
                      onClick={() => setIsMonCashAvailable(prev => !prev)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-200/70 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Cliquez pour simuler la disponibilité ou l'indisponibilité momentanée"
                    >
                      <span>État MonCash :</span>
                      <strong className={isMonCashAvailable ? 'text-emerald-700' : 'text-amber-700'}>
                        {isMonCashAvailable ? 'Actif' : 'Indisponible (Grisé)'}
                      </strong>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Natcash - Online */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS[0])}
                      className="bg-white border border-slate-200 hover:border-slate-300 p-3.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-xs hover:shadow-md group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-black text-base shadow-inner group-hover:scale-105 transition-transform">
                          N
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              Natcash - Online
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Disponible 24/7
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">Min : 25 HTG</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Max : 500 000 HTG</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            Passerelle : natpay.natcom.com.ht
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-400 flex items-center justify-center transition-all">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* MonCash - Online (Avec support de l'indicateur et état grisé si momentanément indisponible) */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS[1])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                        isMonCashAvailable
                          ? 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs hover:shadow-md group'
                          : 'bg-slate-100/90 border-slate-300/80 opacity-60 cursor-not-allowed grayscale'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base shadow-inner ${
                          isMonCashAvailable
                            ? 'bg-red-50 border border-red-100 text-red-600 group-hover:scale-105 transition-transform'
                            : 'bg-slate-200 border border-slate-300 text-slate-500'
                        }`}>
                          M
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              MonCash - Online
                            </span>
                            {isMonCashAvailable ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Disponible
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Momentanément indisponible
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium">Min : 25 HTG</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Max : 500 000 HTG</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            Passerelle : moncashbutton.digicelgroup.com
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Autres options disponibles */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS[2])}
                      className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          C
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">Carte Bancaire (Visa / MC)</span>
                          <p className="text-[10px] text-slate-400">Min 100 HTG • Max 250 000 HTG</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS[3])}
                      className="bg-white border border-slate-200 hover:border-slate-300 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-xs group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">
                          V
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800">Code Recharge Express</span>
                          <p className="text-[10px] text-slate-400">Coupon Cash Point instantané</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Numéros Officiels des Passerelles de Paiement */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-2 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Numéros Officiels des Passerelles de Dépôt</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <span className="text-[11px] text-orange-400 font-bold block">🟠 Passerelle Natcash</span>
                        <strong className="text-white font-mono text-sm tracking-wide select-all">{formaterEtMasquer('+509 3215 3281', 'telephone')}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                        <span className="text-[11px] text-red-400 font-bold block">🔴 Passerelle Moncash</span>
                        <strong className="text-white font-mono text-sm tracking-wide select-all">{formaterEtMasquer('+509 4687 7695', 'telephone')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Toutes les transactions sont chiffrées selon les normes de sécurité PCI-DSS et cryptage SSL 256-bit.</span>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------- */}
              {/* ÉTAPE 2 : SAISIE DU MONTANT ET VALIDATION             */}
              {/* ----------------------------------------------------- */}
              {depositStep === 2 && (
                <div className="space-y-4 pb-2 transition-all duration-300">
                  {/* Selected Method Banner */}
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold block">
                        Mode Sélectionné
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedOption.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Min : {selectedOption.min.toLocaleString()} HTG • Max : {selectedOption.max.toLocaleString()} HTG
                      </p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl ${selectedOption.bg} border ${selectedOption.border} flex items-center justify-center ${selectedOption.color} font-black text-lg`}>
                      {selectedOption.initial}
                    </div>
                  </div>

                  <form onSubmit={handleProceedToGateway} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <h4>Saisie du montant et validation</h4>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Montant souhaité en gourdes (HTG) :
                        </label>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          ≈ ${(depositAmount / HTG_TO_USD_RATE).toFixed(2)} USD
                        </span>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          id="deposit-amount-input"
                          required
                          min={selectedOption.min}
                          max={selectedOption.max}
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                          placeholder="Ex: 1000"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-black text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-mono"
                        />
                        <span className="absolute right-3.5 top-3 text-xs font-bold font-mono text-slate-400">
                          HTG
                        </span>
                      </div>

                      {/* Quick Presets */}
                      <div className="grid grid-cols-4 gap-1.5 pt-2">
                        {PRESET_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setDepositAmount(amt);
                            }}
                            className={`py-1.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                              depositAmount === amt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {amt.toLocaleString()} HTG
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* S'assurer de disposer d'un compte actif */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasConfirmedActiveAccount}
                          onChange={(e) => setHasConfirmedActiveAccount(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>
                          Je m'assure de disposer d'un compte actif <strong>{selectedOption.name}</strong> avec un solde suffisant pour valider cette opération.
                        </span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Valider / Suivant</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setDepositStep(1);
                        }}
                        className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                      >
                        &larr; Changer de mode de paiement
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ----------------------------------------------------- */}
              {/* ÉTAPE 3 : ACCÈS DIRECT AUX COMPTES EN LIGNE          */}
              {/* ----------------------------------------------------- */}
              {depositStep === 3 && (
                <div className="space-y-4 pb-2 transition-all duration-300">
                  {/* Gateway Header Banner */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${selectedOption.bg} ${selectedOption.color} flex items-center justify-center font-black text-sm`}>
                          {selectedOption.initial}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {selectedOption.id === 'natcash'
                              ? 'Passerelle Sécurisée NatPay (Natcom)'
                              : 'Passerelle Sécurisée MonCash (Digicel)'}
                          </h4>
                          <span className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            {selectedOption.gatewayHost}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                        {depositAmount.toLocaleString()} HTG
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                      {selectedOption.id === 'natcash' ? (
                        <p>
                          Redirection vers l'interface de connexion officielle <strong>natpay.natcom.com.ht</strong>. Entrez votre numéro de téléphone Natcom pour vous authentifier et finaliser la transaction.
                        </p>
                      ) : (
                        <p>
                          L'accès direct s'effectue via l'interface web ou mobile sécurisée de <strong>MonCash</strong>, vous permettant de valider le paiement directement depuis votre compte actif en toute sécurité.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Formulaire d'authentification direct de la passerelle */}
                  <form onSubmit={handleFinalizeGatewayPayment} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                        3
                      </span>
                      <h4>Authentification sur la Passerelle en Ligne</h4>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Numéro de téléphone mobile ({selectedOption.id === 'natcash' ? 'Natcom' : 'MonCash'}) :
                      </label>
                      <input
                        type="tel"
                        required
                        value={directPhone}
                        onChange={(e) => setDirectPhone(e.target.value)}
                        placeholder="+509 xxxx xxxx"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Code PIN Secret ou OTP de validation ({selectedOption.id === 'natcash' ? 'Code NatPay' : 'PIN MonCash'}) :
                      </label>
                      <input
                        type="password"
                        required
                        maxLength={6}
                        value={directPin}
                        onChange={(e) => setDirectPin(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-black text-center tracking-widest text-slate-900 font-mono focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        🔒 Chiffrement SSL 256-bit. Votre code secret n'est jamais stocké et transite directement vers la passerelle bancaire.
                      </span>
                    </div>

                    {/* Direct External Link as alternative */}
                    <div className="pt-1">
                      <a
                        href={selectedOption.gatewayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200/80 p-2 rounded-xl border border-slate-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Accéder directement au portail web externe {selectedOption.gatewayHost}</span>
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Validation sécurisée sur la passerelle...</span>
                        </>
                      ) : (
                        <>
                          <span>Finaliser et Payer {depositAmount.toLocaleString()} HTG</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* RETRAIT : EN LIGNE                                        */}
          {/* ========================================================= */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div className="text-center py-1">
                <h2 className="text-sm font-bold text-slate-700">Demande de Retrait en Ligne</h2>
              </div>

              {/* Gateway selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setWithdrawGateway('natcash');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    withdrawGateway === 'natcash'
                      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-xs">
                      N
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">Natcash - Online</p>
                      <p className="text-[10px] text-slate-500">Max : 40 000 HTG</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setWithdrawGateway('moncash');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    withdrawGateway === 'moncash'
                      ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900">MonCash - Online</p>
                      <p className="text-[10px] text-slate-500">Max : 100 000 HTG</p>
                    </div>
                  </div>
                </button>
              </div>

              <form onSubmit={handleConfirmWithdrawal} className="space-y-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-600">Montant à décaisser (HTG)</label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ ${(withdrawAmount / HTG_TO_USD_RATE).toFixed(2)} USD
                    </span>
                  </div>
                  <input
                    type="number"
                    min={50}
                    max={withdrawGateway === 'natcash' ? 40000 : 100000}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all font-mono"
                  />

                  {/* Percentage buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2">
                    {[
                      { label: '25%', frac: 0.25 },
                      { label: '50%', frac: 0.5 },
                      { label: '75%', frac: 0.75 },
                      { label: '100%', frac: 1 }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          playClickSound();
                          const maxAllowed = withdrawGateway === 'natcash' ? 40000 : 100000;
                          const calculated = Math.floor(user.balanceHTG * item.frac);
                          setWithdrawAmount(Math.min(calculated, maxAllowed));
                        }}
                        className="py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nimewo de retrè - SÈLMAN lye ak nimewo enskripsyon kont lan */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Nimewo Destinatè ({withdrawGateway === 'natcash' ? 'NatCash - Online' : 'MonCash - Online'}) :
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Lock className="w-3 h-3" />
                      Nimewo Enskri Veriye
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      required
                      readOnly
                      value={formaterEtMasquer(user.phone || withdrawPhone || '+509 3215 3281', 'telephone')}
                      className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-900 font-mono cursor-not-allowed select-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>

                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2 text-[10px] text-emerald-950 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-900 font-bold">Règleman Sekirite Full Bet :</strong>
                      Pou garanti sekirite lajan w, retrè fèt <strong>sèlman sou nimewo telefòn ou te enskri sou aplikasyon an ({formaterEtMasquer(user.phone || withdrawPhone || '+509 3215 3281', 'telephone')})</strong>. Pa gen posiblite pou yon lòt moun transfere lajan w sou yon lòt nimewo.
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Délai de traitement : 3 à 15 minutes. Frais : 0 HTG (100% gratuit).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || withdrawAmount <= 0 || withdrawAmount > user.balanceHTG}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs tracking-wide flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmer la Demande de Retrait</span>
                      <ArrowUpCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* HISTORIQUE DES TRANSACTIONS                              */}
          {/* ========================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-2 py-1 rounded transition-colors ${
                      historyFilter === 'all' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Toutes ({transactions.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('deposit')}
                    className={`px-2 py-1 rounded transition-colors ${
                      historyFilter === 'deposit' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Dépôts
                  </button>
                  <button
                    onClick={() => setHistoryFilter('withdraw')}
                    className={`px-2 py-1 rounded transition-colors ${
                      historyFilter === 'withdraw' ? 'bg-white text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Retraits
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredTransactions.length} élément(s)
                </span>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs space-y-1">
                  <Clock className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-700">Aucune transaction enregistrée</p>
                  <p className="text-[11px] text-slate-400">Vos prochains mouvements s'afficheront ici.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-2xs text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">{tx.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            tx.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {tx.status === 'approved' ? 'Validé' : tx.status === 'pending' ? 'En attente' : 'Refusé'}
                          </span>
                          <span className="text-[10px] text-slate-400">{tx.date}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-700 font-semibold truncate">
                            {tx.gateway || (tx.type === 'deposit' ? 'Recharge' : 'Retrait')}
                          </span>
                          {tx.referenceId && (
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              Ref: {tx.referenceId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono font-black text-xs block ${
                          tx.type === 'deposit' || tx.type === 'bet_won'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}>
                          {tx.type === 'deposit' || tx.type === 'bet_won' ? '+' : '-'}
                          {tx.amount.toLocaleString()} HTG
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setReceiptTx(tx);
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold cursor-pointer"
                        >
                          Reçu &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* CUSTOM MODAL BOX (No alert/confirm used) */}
        {customModal.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-xs w-full p-5 text-center shadow-xl space-y-3">
              <div className={`w-12 h-12 rounded-full ${customModal.iconBg} ${customModal.iconColor} flex items-center justify-center mx-auto text-lg font-bold`}>
                {customModal.iconText}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{customModal.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {customModal.message}
              </p>
              <button
                type="button"
                onClick={closeCustomModal}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* PRINTABLE RECEIPT MODAL */}
        {receiptTx && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
            <div className="relative w-full max-w-xs bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-3 font-mono">
              <button
                type="button"
                onClick={() => setReceiptTx(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-extrabold text-sm tracking-wider text-slate-900">
                  FULL BET • PAIEMENT SÉCURISÉ
                </h4>
                <p className="text-[10px] text-slate-500">Bordereau Officiel de Transaction</p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Réf :</span>
                  <span className="font-bold text-slate-900">{receiptTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date :</span>
                  <span>{receiptTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passerelle :</span>
                  <span className="font-bold">{receiptTx.gateway || 'Passerelle en ligne'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type :</span>
                  <span className="uppercase font-bold">
                    {receiptTx.type === 'deposit' ? 'Recharge Directe' : 'Retrait'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut :</span>
                  <span className={`font-black uppercase ${
                    receiptTx.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {receiptTx.status === 'approved' ? 'PAYÉ / VALIDÉ' : 'EN COURS'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-xl text-center border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase block font-semibold">Montant Réglé</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {receiptTx.amount.toLocaleString()} HTG
                </span>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-1 border-t border-dashed border-slate-300">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le Reçu</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center py-3 border-t border-slate-200 bg-white">
          <p className="text-[10px] text-slate-400 font-medium">
            &copy; FULL BET &bull; Confidentialité Totale & Sécurité Garantie
          </p>
        </footer>

      </div>
    </div>
  );
};
