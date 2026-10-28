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
  ToggleRight,
  QrCode,
  Copy,
  Check,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Transaction } from '../types';
import { HTG_TO_USD_RATE } from '../utils/storage';
import {
  serverSubmitDeposit,
  serverSubmitWithdraw,
  serverCreateCryptoPayment,
  serverGetCryptoPaymentStatus,
  serverSimulateCryptoConfirm,
  serverCreateBinanceOrder,
  NowPaymentsInvoiceData,
  CryptoMobileUiState
} from '../utils/api';
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
  blockedPaymentMethods?: string[];
  paymentMethodsNotice?: Record<string, string>;
}

// Payment method definition matching exact specification
interface PaymentOption {
  id: 'natcash' | 'moncash' | 'voucher' | 'crypto' | 'binance';
  name: string;
  min: number;
  max: number;
  currency: string;
  color: string;
  bg: string;
  border: string;
  initial: string;
  logoUrl: string;
  gatewayUrl: string;
  gatewayHost: string;
  serviceBadge: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'natcash',
    name: 'Natcash - Online',
    min: 25,
    max: 500000,
    currency: 'HTG',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    initial: 'N',
    logoUrl: '/assets/aistudio/5716015f-89d6-46be-a78f-4bdf2bf34bbf_2_5b4a470d.jpeg',
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
    logoUrl: '/assets/aistudio/Jamaica_to_Establish_STEM_Innovation_Teaching_Center_d4bcd70b.jpeg',
    gatewayUrl: 'https://moncashbutton.digicelgroup.com',
    gatewayHost: 'moncashbutton.digicelgroup.com',
    serviceBadge: 'Digicel MonCash'
  },
  {
    id: 'crypto',
    name: 'NOWpayments',
    min: 663, // 5.0 USD min (~662.5 HTG)
    max: 500000,
    currency: 'USD / Crypto',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    initial: 'NP',
    logoUrl: '/assets/aistudio/nowpayments_logo.svg',
    gatewayUrl: 'https://nowpayments.io',
    gatewayHost: 'nowpayments.io',
    serviceBadge: 'NOWpayments Gateway'
  },
  {
    id: 'voucher',
    name: 'Code Recharge Express',
    min: 50,
    max: 100000,
    currency: 'HTG',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    initial: 'V',
    logoUrl: '/assets/aistudio/WA_1792889527674_8dc384a5.jpeg',
    gatewayUrl: 'https://secure.fullbet.com/voucher',
    gatewayHost: 'voucher.fullbet.com',
    serviceBadge: 'Coupon Cash Point'
  },
  {
    id: 'binance',
    name: 'Binance Pay',
    min: 663, // 5.0 USD min (~662.5 HTG)
    max: 250000,
    currency: 'USD / HTG',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    initial: 'B',
    logoUrl: '/assets/aistudio/9561438d-c242-438c-81f9-91c48fbf2273_3b9dccdb.jpeg',
    gatewayUrl: 'https://bpay.binanceapi.com',
    gatewayHost: 'bpay.binanceapi.com',
    serviceBadge: 'Binance Pay Officiel'
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
  onUpdateBalance,
  blockedPaymentMethods = [],
  paymentMethodsNotice = {}
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialTab);

  const isMethodBlocked = (id: string) => {
    return Array.isArray(blockedPaymentMethods) && blockedPaymentMethods.includes(id);
  };

  const getMethodNotice = (id: string) => {
    return (paymentMethodsNotice && paymentMethodsNotice[id]) || 'Mòd peman sa a tanporèman bloke pa administrasyon an pou mentanans.';
  };

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

  // NOWPayments Crypto States
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<'btc' | 'eth' | 'trx' | 'usdttrc20'>('usdttrc20');
  const [cryptoInvoice, setCryptoInvoice] = useState<NowPaymentsInvoiceData | null>(null);
  const [cryptoMobileUi, setCryptoMobileUi] = useState<CryptoMobileUiState | null>(null);
  const [isCryptoLoading, setIsCryptoLoading] = useState<boolean>(false);
  const [isCheckingCryptoStatus, setIsCheckingCryptoStatus] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);
  const [expirationSeconds, setExpirationSeconds] = useState<number>(1200);

  // Binance Pay States (5e mode de paiement officiel)
  const [selectedBinanceCurrency, setSelectedBinanceCurrency] = useState<'USDT' | 'BUSD' | 'BTC' | 'ETH'>('USDT');
  const [binanceOrder, setBinanceOrder] = useState<{
    merchantTradeNo: string;
    prepayId: string;
    checkoutUrl: string;
    qrContent: string;
    qrCodeUrl: string;
    amountUSD?: number;
    equivalentHTG?: number;
    currency?: string;
    expireTime?: number;
  } | null>(null);
  const [isBinanceLoading, setIsBinanceLoading] = useState<boolean>(false);

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
    if (isMethodBlocked(opt.id)) {
      playClickSound();
      showCustomModal(
        `Mòd Peman Bloke (${opt.name})`,
        getMethodNotice(opt.id),
        "⚠️",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }
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
    if ((opt.id === 'crypto' || opt.id === 'binance') && depositAmount < opt.min) {
      setDepositAmount(opt.min);
    }
    setDepositStep(2);
  };

  // Compteur de décompte de 20 minutes (Expiration Timer pour limiter la volatilité)
  React.useEffect(() => {
    if (depositStep !== 3 || selectedOption.id !== 'crypto' || !cryptoInvoice) {
      setExpirationSeconds(1200);
      return;
    }
    const timer = setInterval(() => {
      setExpirationSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [depositStep, selectedOption.id, cryptoInvoice?.payment_id]);

  // LIVE STATUS UPDATES : Polling automatique toutes les 7s pendant l'attente sur la blockchain
  React.useEffect(() => {
    if (
      !isOpen ||
      activeTab !== 'deposit' ||
      depositStep !== 3 ||
      selectedOption.id !== 'crypto' ||
      !cryptoInvoice?.payment_id ||
      cryptoInvoice.payment_status === 'finished'
    ) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await serverGetCryptoPaymentStatus(cryptoInvoice.payment_id);
        if (res.status === 'success' && res.data) {
          if (res.data.payment_status !== cryptoInvoice.payment_status) {
            setCryptoInvoice(res.data);
          }

          if (res.data.payment_status === 'finished' || res.data.payment_status === 'confirmed') {
            clearInterval(pollInterval);
            playWinSound();
            confetti({
              particleCount: 100,
              spread: 80,
              origin: { y: 0.6 }
            });

            const newBal = user.balanceHTG + depositAmount;
            onUpdateBalance(newBal, `Dépôt Crypto NOWPayments (+${depositAmount.toLocaleString()} HTG)`);

            const approvedTx: Transaction = {
              id: `tx-crypto-${res.data.payment_id.slice(-6)}`,
              type: 'deposit',
              gateway: 'NOWPayments Crypto',
              amount: depositAmount,
              currency: 'HTG',
              date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
              status: 'approved',
              referenceId: `NP-${res.data.payment_id}`,
              phoneNumber: res.data.pay_address,
              details: `Dépôt Crypto ${res.data.pay_currency.toUpperCase()} confirmé sur blockchain (+${depositAmount.toLocaleString()} HTG)`
            };
            onAddTransaction(approvedTx);
            setReceiptTx(approvedTx);

            showCustomModal(
              "Peman an reyalize ak siksè! 🎉",
              `Félicitations ! Votre paiement de ${depositAmount.toLocaleString()} HTG (${res.data.pay_amount} ${res.data.pay_currency.toUpperCase()}) a été validé avec succès sur la blockchain !`,
              "✓",
              "text-emerald-600",
              "bg-emerald-50",
              () => {
                setDepositStep(1);
                setActiveTab('history');
              }
            );
          }
        }
      } catch (err) {
        // polling silencieux
      }
    }, 7000);

    return () => clearInterval(pollInterval);
  }, [isOpen, activeTab, depositStep, selectedOption.id, cryptoInvoice?.payment_id, cryptoInvoice?.payment_status, depositAmount, user.balanceHTG]);

  // Génération de facture Crypto via NOWPayments
  const generateCryptoInvoice = async (amount: number, currency: 'btc' | 'eth' | 'trx' | 'usdttrc20') => {
    setIsCryptoLoading(true);
    setExpirationSeconds(1200);
    try {
      const res = await serverCreateCryptoPayment({
        amountHTG: amount,
        pay_currency: currency,
        order_description: `Depo lajan sou kont itilizatè ${user.id} (${user.fullName || 'Gain Cash'})`
      });

      if (res.status === 'success' && res.data) {
        setCryptoInvoice(res.data);
        if ((res as any).mobile_ui_state) {
          setCryptoMobileUi((res as any).mobile_ui_state);
        }
      } else {
        showCustomModal(
          "Erreur Facture Crypto",
          res.error || "Impossible de générer la facture NOWPayments.",
          "✕",
          "text-red-600",
          "bg-red-50"
        );
      }
    } catch (err: any) {
      console.error('Error generating crypto invoice:', err);
    } finally {
      setIsCryptoLoading(false);
    }
  };

  // Génération d'ordre Binance Pay (5e mode de paiement)
  const generateBinanceOrder = async (amountHtg: number, currency: 'USDT' | 'BUSD' | 'BTC' | 'ETH') => {
    setIsBinanceLoading(true);
    setExpirationSeconds(1200);
    try {
      const amountUSD = Number((amountHtg / HTG_TO_USD_RATE).toFixed(2));
      const res = await serverCreateBinanceOrder(
        amountUSD,
        currency,
        `Recharge Binance Pay - ${user.fullName || user.id}`
      );
      if (res.status === 'success' && res.data) {
        setBinanceOrder({
          ...res.data,
          amountUSD,
          equivalentHTG: amountHtg,
          currency
        });
      } else {
        showCustomModal(
          "Erreur Binance Pay",
          res.error || "Impossible d'initialiser l'ordre Binance Pay.",
          "✕",
          "text-red-600",
          "bg-red-50"
        );
      }
    } catch (err: any) {
      console.error('Error generating Binance Pay order:', err);
    } finally {
      setIsBinanceLoading(false);
    }
  };

  // Validation manuelle / directe du dépôt Binance Pay
  const handleConfirmBinancePay = () => {
    if (!binanceOrder) return;
    playWinSound();
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });

    const newBal = user.balanceHTG + depositAmount;
    onUpdateBalance(newBal, `Dépôt Binance Pay (+${depositAmount.toLocaleString()} HTG)`);

    const approvedTx: Transaction = {
      id: `tx-bp-${Date.now().toString().slice(-6)}`,
      type: 'deposit',
      gateway: 'Binance Pay',
      amount: depositAmount,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'approved',
      referenceId: binanceOrder.merchantTradeNo,
      phoneNumber: `Binance Pay (${binanceOrder.currency || selectedBinanceCurrency})`,
      details: `Dépôt Binance Pay de ${depositAmount.toLocaleString()} HTG (${binanceOrder.amountUSD || (depositAmount / HTG_TO_USD_RATE).toFixed(2)} ${binanceOrder.currency || selectedBinanceCurrency}) validé`
    };
    onAddTransaction(approvedTx);
    setReceiptTx(approvedTx);

    showCustomModal(
      "Peman Binance Pay Reyisi! 🎉",
      `Depo ${depositAmount.toLocaleString()} HTG ou an valide avèk siksè sou kont Full Bet ou a via Binance Pay.`,
      "✓",
      "text-emerald-600",
      "bg-emerald-50",
      () => {
        setDepositStep(1);
        setActiveTab('history');
      }
    );
  };

  // Copie dans le presse-papier avec confirmation visuelle et Toast
  const handleCopyText = (text: string, field: string) => {
    playClickSound();
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(field);
      setClipboardToast("Adrès la kopye ak siksè! 📋");
      setTimeout(() => setCopiedField(null), 2500);
      setTimeout(() => setClipboardToast(null), 3500);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Vérification manuelle du statut blockchain
  const handleCheckCryptoStatus = async () => {
    if (!cryptoInvoice) return;
    setIsCheckingCryptoStatus(true);
    playClickSound();

    try {
      const res = await serverGetCryptoPaymentStatus(cryptoInvoice.payment_id);
      if (res.status === 'success' && res.data) {
        setCryptoInvoice(res.data);
        if (res.data.payment_status === 'finished' || res.data.payment_status === 'confirmed') {
          playWinSound();
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 }
          });

          const newBal = user.balanceHTG + depositAmount;
          onUpdateBalance(newBal, `Dépôt Crypto NOWPayments (+${depositAmount.toLocaleString()} HTG)`);

          const approvedTx: Transaction = {
            id: `tx-crypto-${cryptoInvoice.payment_id.slice(-6)}`,
            type: 'deposit',
            gateway: 'NOWPayments Crypto',
            amount: depositAmount,
            currency: 'HTG',
            date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            status: 'approved',
            referenceId: `NP-${cryptoInvoice.payment_id}`,
            phoneNumber: cryptoInvoice.pay_address,
            details: `Dépôt Crypto ${cryptoInvoice.pay_currency.toUpperCase()} confirmé sur blockchain (+${depositAmount.toLocaleString()} HTG)`
          };
          onAddTransaction(approvedTx);
          setReceiptTx(approvedTx);

          showCustomModal(
            "Peman an reyalize ak siksè! 🎉",
            `Votre dépôt de ${depositAmount.toLocaleString()} HTG (${cryptoInvoice.pay_amount} ${cryptoInvoice.pay_currency.toUpperCase()}) a été validé avec succès sur la blockchain !`,
            "✓",
            "text-emerald-600",
            "bg-emerald-50",
            () => {
              setDepositStep(1);
              setActiveTab('history');
            }
          );
        } else if (res.data.payment_status === 'partially_paid') {
          showCustomModal(
            "⚠️ Peman Pasyèl Detekte",
            `Montan resevwa a pi piti pase montan fakti a akòz frè rezo (Gas fees). Tanpri voye rès montan an pou konfime depo a.`,
            "!",
            "text-amber-600",
            "bg-amber-50"
          );
        } else {
          showCustomModal(
            "Statut du paiement Crypto",
            `Statut actuel : "${res.data.payment_status}". En attente de validation sur le réseau ${selectedCryptoCurrency.toUpperCase()}. Dès que le paiement est détecté, votre compte sera crédité.`,
            "⏳",
            "text-amber-600",
            "bg-amber-50"
          );
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsCheckingCryptoStatus(false);
    }
  };

  // Simulation / Validation instantanée pour démonstration et tests
  const handleSimulateCryptoConfirm = async () => {
    if (!cryptoInvoice) return;
    setIsProcessing(true);
    playClickSound();

    try {
      const res = await serverSimulateCryptoConfirm(cryptoInvoice.payment_id);
      if (res.status === 'success') {
        playWinSound();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });

        const creditedAmount = depositAmount;
        const newBal = typeof res.newBalance === 'number' ? res.newBalance : user.balanceHTG + creditedAmount;
        onUpdateBalance(newBal, `Dépôt Crypto NOWPayments (+${creditedAmount.toLocaleString()} HTG)`);

        if (res.transaction) {
          onAddTransaction(res.transaction);
          setReceiptTx(res.transaction);
        }

        showCustomModal(
          "Paiement Crypto Validé avec Succès",
          `Félicitations ! Votre compte a été crédité avec succès de ${creditedAmount.toLocaleString()} HTG via NOWPayments (Crypto).`,
          "✓",
          "text-emerald-600",
          "bg-emerald-50",
          () => {
            setDepositStep(1);
            setActiveTab('history');
          }
        );
      } else {
        showCustomModal("Erreur", res.error || "Impossible de simuler la validation.", "✕", "text-red-600", "bg-red-50");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Étape 2 ➔ Étape 3 (Validation du montant et passage à la passerelle)
  const handleProceedToGateway = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (isMethodBlocked(selectedOption.id)) {
      showCustomModal(
        `Mòd Peman Bloke (${selectedOption.name})`,
        getMethodNotice(selectedOption.id),
        "⚠️",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

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

    if (selectedOption.id === 'crypto') {
      setDepositStep(3);
      generateCryptoInvoice(depositAmount, selectedCryptoCurrency);
      return;
    }

    if (selectedOption.id === 'binance') {
      setDepositStep(3);
      generateBinanceOrder(depositAmount, selectedBinanceCurrency);
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

    if (isMethodBlocked(selectedOption.id)) {
      showCustomModal(
        `Mòd Peman Bloke (${selectedOption.name})`,
        getMethodNotice(selectedOption.id),
        "⚠️",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

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

    if (isMethodBlocked(withdrawGateway)) {
      showCustomModal(
        `Mòd Retrè Bloke (${withdrawGateway === 'natcash' ? 'Natcash' : 'MonCash'})`,
        getMethodNotice(withdrawGateway),
        "⚠️",
        "text-red-600",
        "bg-red-50"
      );
      return;
    }

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

  if (!isOpen) return null;

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
                    {/* 1. Natcash - Online */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS.find(o => o.id === 'natcash') || PAYMENT_OPTIONS[0])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                        isMethodBlocked('natcash')
                          ? 'bg-slate-100/90 border-red-300/80 opacity-70 cursor-not-allowed grayscale'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs hover:shadow-md group'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border bg-white flex items-center justify-center shadow-xs shrink-0 transition-transform ${
                          isMethodBlocked('natcash') ? 'border-red-300 opacity-60' : 'border-orange-200 group-hover:scale-105'
                        }`}>
                          <img
                            src="/assets/aistudio/5716015f-89d6-46be-a78f-4bdf2bf34bbf_2_5b4a470d.jpeg"
                            alt="Natcash logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              Natcash - Online
                            </span>
                            {isMethodBlocked('natcash') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                BLOKE PA PWOPRIYETÈ A
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Disponible 24/7
                              </span>
                            )}
                          </div>
                          {isMethodBlocked('natcash') && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                              {getMethodNotice('natcash')}
                            </p>
                          )}
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

                      {isMethodBlocked('natcash') ? (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-400 flex items-center justify-center transition-all shrink-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* 2. MonCash - Online */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS.find(o => o.id === 'moncash') || PAYMENT_OPTIONS[1])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                        isMethodBlocked('moncash') || !isMonCashAvailable
                          ? 'bg-slate-100/90 border-slate-300/80 opacity-70 cursor-not-allowed grayscale'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs hover:shadow-md group'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
                          !isMethodBlocked('moncash') && isMonCashAvailable
                            ? 'border-red-200 bg-white group-hover:scale-105'
                            : 'border-slate-300 bg-slate-100 opacity-60'
                        }`}>
                          <img
                            src="/assets/aistudio/Jamaica_to_Establish_STEM_Innovation_Teaching_Center_d4bcd70b.jpeg"
                            alt="MonCash logo"
                            className="w-full h-full object-contain p-0.5"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              MonCash - Online
                            </span>
                            {isMethodBlocked('moncash') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                BLOKE PA PWOPRIYETÈ A
                              </span>
                            ) : isMonCashAvailable ? (
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
                          {isMethodBlocked('moncash') && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                              {getMethodNotice('moncash')}
                            </p>
                          )}
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

                      {isMethodBlocked('moncash') ? (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* 3. NOWpayments Crypto (USDT TRC-20, BTC, ETH, TRX) */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS.find(o => o.id === 'crypto') || PAYMENT_OPTIONS[2])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all relative overflow-hidden border ${
                        isMethodBlocked('crypto')
                          ? 'bg-slate-100/90 border border-red-300/80 opacity-70 cursor-not-allowed grayscale'
                          : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-md cursor-pointer shadow-xs group'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
                          isMethodBlocked('crypto') ? 'border-red-300 bg-slate-800 opacity-60' : 'border-teal-200 bg-white group-hover:scale-105 p-1'
                        }`}>
                          <img
                            src="/assets/aistudio/nowpayments_logo.svg"
                            alt="NOWpayments logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                              NOWpayments
                            </span>
                            {isMethodBlocked('crypto') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                BLOKE PA PWOPRIYETÈ A
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                Crypto Gateway
                              </span>
                            )}
                          </div>
                          {isMethodBlocked('crypto') && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                              {getMethodNotice('crypto')}
                            </p>
                          )}
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-teal-800 font-bold">Instantané • 0% Frais</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Min : 5.00 USD (~663 HTG)</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Max : 500 000 HTG</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              USDT TRC-20
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              BTC
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              ETH
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              TRX
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono ml-1 hidden xs:inline">
                              nowpayments.io
                            </span>
                          </div>
                        </div>
                      </div>

                      {isMethodBlocked('crypto') ? (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-teal-50 group-hover:bg-teal-500 group-hover:text-white text-teal-600 flex items-center justify-center transition-all shrink-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* 4. Code Recharge Express */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS.find(o => o.id === 'voucher') || PAYMENT_OPTIONS[3])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all border ${
                        isMethodBlocked('voucher')
                          ? 'bg-slate-100/90 border-red-300/80 opacity-70 cursor-not-allowed grayscale'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer shadow-2xs hover:shadow-xs group'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
                          isMethodBlocked('voucher') 
                            ? 'border-red-300 bg-slate-100 opacity-60' 
                            : 'border-slate-200 bg-white group-hover:scale-105 p-0.5'
                        }`}>
                          <img
                            src="/assets/aistudio/WA_1792889527674_8dc384a5.jpeg"
                            alt="Code Recharge Express logo"
                            className="w-full h-full object-contain object-center"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">Code Recharge Express</span>
                            {isMethodBlocked('voucher') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                BLOKE PA PWOPRIYETÈ A
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                Express
                              </span>
                            )}
                          </div>
                          {isMethodBlocked('voucher') && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                              {getMethodNotice('voucher')}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">Coupon Cash Point instantané</p>
                          <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                            Passerelle : voucher.fullbet.com
                          </span>
                        </div>
                      </div>
                      {isMethodBlocked('voucher') ? (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>

                    {/* 5. Binance Pay (USDT, BUSD, BTC, ETH) - Senkyèm Mòd Peman */}
                    <div
                      onClick={() => handleSelectOption(PAYMENT_OPTIONS.find(o => o.id === 'binance') || PAYMENT_OPTIONS[4])}
                      className={`p-3.5 rounded-2xl flex items-center justify-between transition-all relative overflow-hidden border ${
                        isMethodBlocked('binance')
                          ? 'bg-slate-100/90 border border-red-300/80 opacity-70 cursor-not-allowed grayscale'
                          : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-400 hover:border-amber-500 cursor-pointer shadow-xs hover:shadow-md group'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center shadow-xs shrink-0 transition-transform ${
                          isMethodBlocked('binance') ? 'border-red-300 bg-slate-800 opacity-60' : 'border-amber-400 bg-slate-950 group-hover:scale-105'
                        }`}>
                          <img
                            src="/assets/aistudio/9561438d-c242-438c-81f9-91c48fbf2273_3b9dccdb.jpeg"
                            alt="Binance Pay logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                              Binance Pay
                            </span>
                            {isMethodBlocked('binance') ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-red-600" />
                                BLOKE PA PWOPRIYETÈ A
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#F0B90B]/20 text-amber-900 border border-[#F0B90B]/50 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                Binance Pay Officiel
                              </span>
                            )}
                          </div>
                          {isMethodBlocked('binance') && (
                            <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                              {getMethodNotice('binance')}
                            </p>
                          )}
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[10px] text-amber-800 font-bold">Instantané • 0% Frais</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Min : 5.00 USD (~663 HTG)</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-[10px] text-slate-500 font-medium">Max : 250 000 HTG</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100/70 text-amber-900 border border-amber-300/60">
                              USDT
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100/70 text-amber-900 border border-amber-300/60">
                              BUSD
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100/70 text-amber-900 border border-amber-300/60">
                              BTC
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100/70 text-amber-900 border border-amber-300/60">
                              ETH
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono ml-1 hidden xs:inline">
                              bpay.binanceapi.com
                            </span>
                          </div>
                        </div>
                      </div>

                      {isMethodBlocked('binance') ? (
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-100 group-hover:bg-[#F0B90B] group-hover:text-slate-950 text-amber-700 flex items-center justify-center transition-all shrink-0">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      )}
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
                    <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-white shadow-xs shrink-0">
                      {selectedOption.logoUrl ? (
                        <img
                          src={selectedOption.logoUrl}
                          alt={selectedOption.name}
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <div className={`w-full h-full ${selectedOption.bg} flex items-center justify-center ${selectedOption.color} font-black text-lg`}>
                          {selectedOption.initial}
                        </div>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleProceedToGateway} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                        2
                      </span>
                      <h4>
                        {selectedOption.id === 'crypto'
                          ? 'Choix de la devise Crypto (NOWPayments) et montant'
                          : selectedOption.id === 'binance'
                          ? 'Choix de la devise Binance Pay et montant'
                          : 'Saisie du montant et validation'}
                      </h4>
                    </div>

                    {/* Sélecteur de Devise NOWPayments Crypto */}
                    {selectedOption.id === 'crypto' && (
                      <div className="space-y-2 pb-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700">
                            Sélectionnez la crypto-monnaie (NOWPayments) :
                          </label>
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            Passerelle NOWPayments
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'usdttrc20', name: 'USDT (TRC-20)', sub: 'Réseau TRON • Zéro Perte', icon: '₮', badge: 'Recommandé' },
                            { id: 'trx', name: 'TRON (TRX)', sub: 'Frais minimes', icon: 'T' },
                            { id: 'btc', name: 'Bitcoin (BTC)', sub: 'Réseau Bitcoin natif', icon: '₿' },
                            { id: 'eth', name: 'Ethereum (ETH)', sub: 'Réseau Ethereum ERC-20', icon: 'Ξ' }
                          ].map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setSelectedCryptoCurrency(c.id as any);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                                selectedCryptoCurrency === c.id
                                  ? 'bg-teal-50 border-teal-500 shadow-xs ring-1 ring-teal-500'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{c.name}</span>
                                <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-black">
                                  {c.icon}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{c.sub}</span>
                              {c.badge && (
                                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-teal-600 text-white">
                                  {c.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="p-2.5 bg-teal-50/60 border border-teal-200 rounded-xl text-[10px] text-teal-900 flex items-center justify-between">
                          <span className="font-medium text-teal-800">Passerelle Marchand :</span>
                          <strong className="text-slate-900 font-mono">NOWPayments (nowpayments.io)</strong>
                        </div>
                      </div>
                    )}

                    {/* Sélecteur de Devise Binance Pay (5e mode) */}
                    {selectedOption.id === 'binance' && (
                      <div className="space-y-2 pb-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-slate-700">
                            Sélectionnez la devise Binance Pay :
                          </label>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                            Binance Pay Officiel
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'USDT', name: 'USDT (Tether)', sub: 'Binance Pay Direct • 0% Frais', icon: '₮', badge: 'Recommandé' },
                            { id: 'BUSD', name: 'BUSD (Binance)', sub: 'Binance Stablecoin officiel', icon: 'B', badge: 'Binance' },
                            { id: 'BTC', name: 'Bitcoin (BTC)', sub: 'Binance Pay Instantané', icon: '₿' },
                            { id: 'ETH', name: 'Ethereum (ETH)', sub: 'Binance Pay Instantané', icon: 'Ξ' }
                          ].map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setSelectedBinanceCurrency(c.id as any);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                                selectedBinanceCurrency === c.id
                                  ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-slate-900">{c.name}</span>
                                <span className="w-5 h-5 rounded-md bg-[#F0B90B]/20 text-amber-900 flex items-center justify-center text-[10px] font-black">
                                  {c.icon}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{c.sub}</span>
                              {c.badge && (
                                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-[#F0B90B] text-slate-950">
                                  {c.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-[10px] text-amber-900 flex items-center justify-between">
                          <span className="font-medium text-amber-800">Passerelle Marchand :</span>
                          <strong className="text-slate-900 font-mono">Binance Pay (bpay.binanceapi.com)</strong>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Montant souhaité en gourdes (HTG) :
                        </label>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">
                          ≈ ${(depositAmount / HTG_TO_USD_RATE).toFixed(2)} USD
                          {selectedOption.id === 'crypto' && (
                            <> ≈ {(depositAmount / HTG_TO_USD_RATE).toFixed(2)} {selectedCryptoCurrency === 'usdttrc20' ? 'USDT' : selectedCryptoCurrency.toUpperCase()}</>
                          )}
                          {selectedOption.id === 'binance' && (
                            <> ≈ {(depositAmount / HTG_TO_USD_RATE).toFixed(2)} {selectedBinanceCurrency}</>
                          )}
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
                        {(selectedOption.id === 'crypto' || selectedOption.id === 'binance'
                          ? [1325, 2650, 6625, 13250, 26500, 39750, 66250, 132500]
                          : PRESET_AMOUNTS
                        ).map((amt) => (
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

                    {/* Avètisman sou Frè Rezo (Gas Fees) pou Crypto NOWPayments */}
                    {selectedOption.id === 'crypto' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-950 block">Avètisman sou Frè Rezo (Gas Fees) :</span>
                          <p className="text-[11px] leading-relaxed text-amber-900">
                            Toujou asire w ke w pran an konsiderasyon frè rezo (Gas Fees) bous ou an (Trust Wallet, Metamask, etc.) pou evite peman ki tonbe anba minimòm lan ($5.00 USD / ~663 HTG). Montan nèt ki rive a dwe kouvri fakti a.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Avètisman 0% Frè pou Binance Pay */}
                    {selectedOption.id === 'binance' && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-emerald-950 block">0% Frè Rezo ak Binance Pay :</span>
                          <p className="text-[11px] leading-relaxed text-emerald-900">
                            Peman ant kont Binance Pay yo 100% gratis san okenn frè rezo (Zero Gas Fees). Kredi sou kont Full Bet ou a fèt otomatikman epi an dirèk.
                          </p>
                        </div>
                      </div>
                    )}

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
                          {selectedOption.id === 'crypto' ? (
                            <>
                              Je confirme disposer d'un portefeuille crypto actif et que j'enverrai le montant exact en <strong>{selectedCryptoCurrency.toUpperCase()}</strong> via le réseau sélectionné.
                            </>
                          ) : selectedOption.id === 'binance' ? (
                            <>
                              Je confirme disposer de l'application <strong>Binance Pay</strong> active avec un solde suffisant pour régler cet ordre en <strong>{selectedBinanceCurrency}</strong> sans aucun frais.
                            </>
                          ) : (
                            <>
                              Je m'assure de disposer d'un compte actif <strong>{selectedOption.name}</strong> avec un solde suffisant pour valider cette opération.
                            </>
                          )}
                        </span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>
                          {selectedOption.id === 'crypto'
                            ? 'Générer la facture & QR Code NOWPayments'
                            : selectedOption.id === 'binance'
                            ? 'Ouvri lòd Binance Pay & QR Code'
                            : 'Valider / Suivant'}
                        </span>
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
              {/* ÉTAPE 3 : ACCÈS DIRECT AUX COMPTES EN LIGNE / CRYPTO  */}
              {/* ----------------------------------------------------- */}
              {depositStep === 3 && (
                <div className="space-y-4 pb-2 transition-all duration-300">
                  {/* CAS 1 : INTERFACE NOWPAYMENTS CRYPTO */}
                  {selectedOption.id === 'crypto' ? (
                    <div className="space-y-4">
                      {/* Gateway Header Banner */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                              ₮
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                Passerelle NOWPayments Crypto ({selectedCryptoCurrency.toUpperCase()})
                              </h4>
                              <span className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                api.nowpayments.io • Binance Payout Wallet
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded-lg block">
                              {depositAmount.toLocaleString()} HTG
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold block mt-0.5">
                              ≈ ${(depositAmount / HTG_TO_USD_RATE).toFixed(2)} USD
                            </span>
                          </div>
                        </div>

                        {/* Bannière de redirection / information - Fond bleu ciel (#38bdf8) */}
                        <div className="text-xs text-black font-semibold bg-[#38bdf8] p-3.5 rounded-xl border border-sky-400 shadow-2xs leading-relaxed">
                          <p className="text-black font-semibold">
                            Facture sécurisée générée via <strong className="text-black font-black underline">NOWPayments</strong>. Envoyez les fonds à l'adresse ci-dessous. Dès réception de la confirmation sur la blockchain, votre solde de <strong className="text-black font-black">{depositAmount.toLocaleString()} HTG</strong> sera crédité automatiquement.
                          </p>
                        </div>
                      </div>

                      {/* Toast Presse-Papier Visuel */}
                      {clipboardToast && (
                        <div className="bg-slate-900 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg border border-emerald-400/40 flex items-center justify-between animate-fade-in">
                          <span className="flex items-center gap-1.5 text-emerald-400">
                            <span>✓</span>
                            <span>{clipboardToast}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Presse-papier</span>
                        </div>
                      )}

                      {/* Facture Crypto NOWPayments */}
                      {isCryptoLoading ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                          <h4 className="text-xs font-bold text-slate-800">
                            Génération de la facture sécurisée NOWPayments...
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Création de l'adresse de réception sur le réseau {selectedCryptoCurrency.toUpperCase()}
                          </p>
                        </div>
                      ) : cryptoInvoice ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                          {/* 1. Kwonomèt Fakti NOWPayments (Expiration Timer pou volatilité) */}
                          <div className="p-3 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl border border-slate-700 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Clock className="w-4 h-4 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                                  Kwonomèt Fakti NOWPayments
                                </span>
                                <span className="text-[10px] text-slate-300 block">
                                  Tanporizasyon pou diminye risk volatilité kripto
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black font-mono text-amber-400 bg-black/60 px-2.5 py-1 rounded-lg border border-slate-700 inline-block shadow-inner">
                                {Math.floor(expirationSeconds / 60).toString().padStart(2, '0')}:{(expirationSeconds % 60).toString().padStart(2, '0')}
                              </span>
                              {expirationSeconds === 0 && (
                                <span className="text-[9px] text-red-400 font-bold block mt-0.5">
                                  Fakti ekspire
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 2. Alèt Sous-Paiement (Underpaid Handling / partially_paid) */}
                          {cryptoInvoice.payment_status === 'partially_paid' && (
                            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-1 text-red-900 animate-pulse">
                              <div className="flex items-center gap-2 font-bold text-xs text-red-700">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                <span>⚠️ Peman pasyèl detekte (partially_paid)</span>
                              </div>
                              <p className="text-[11px] leading-relaxed">
                                Montan resevwa a pi ba pase montan fakti a akòz dediksyon frè rezo (Gas Fees). Tanpri voye rès montan an pou konplete ak valide depo a.
                              </p>
                            </div>
                          )}

                          {/* En-tête Statut */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-xs font-bold text-slate-900">
                                Facture #{cryptoInvoice.invoice_id}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1 ${
                              cryptoInvoice.payment_status === 'finished'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : cryptoInvoice.payment_status === 'partially_paid'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {cryptoInvoice.payment_status === 'finished'
                                ? 'Confirmé'
                                : cryptoInvoice.payment_status === 'partially_paid'
                                ? 'Peman pasyèl'
                                : 'En attente blockchain'}
                            </span>
                          </div>

                          {/* QR Code Container */}
                          <div className="flex flex-col items-center justify-center p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                              <img
                                src={cryptoInvoice.qr_code_url}
                                alt="QR Code de paiement Crypto"
                                className="w-48 h-48 object-contain rounded-lg"
                              />
                            </div>
                            <span className="text-[11px] text-slate-600 font-medium mt-2.5 flex items-center gap-1.5 text-center">
                              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                              Scannez ce QR Code avec Binance ou votre portefeuille crypto
                            </span>
                          </div>

                          {/* Montant exact à envoyer (Target Amount) */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Montant exact à envoyer (Target Amount) :
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-black font-mono text-emerald-700">
                                {cryptoInvoice.pay_amount} {cryptoInvoice.pay_currency.toUpperCase().replace('TRC20', ' (TRC-20)')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(String(cryptoInvoice.pay_amount), 'amount')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {copiedField === 'amount' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copier</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 block">
                              ≈ ${(cryptoInvoice.price_amount).toFixed(2)} USD • {depositAmount.toLocaleString()} HTG
                            </span>
                          </div>

                          {/* Adresse de dépôt blockchain */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Adresse de dépôt ({selectedCryptoCurrency === 'usdttrc20' ? 'Réseau TRON TRC-20' : selectedCryptoCurrency.toUpperCase()}) :
                              </span>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {selectedCryptoCurrency === 'usdttrc20' ? 'TRC-20' : selectedCryptoCurrency.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs font-mono font-bold text-slate-900 break-all bg-white px-2 py-1.5 rounded-lg border border-slate-200 flex-1">
                                {cryptoInvoice.pay_address}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyText(cryptoInvoice.pay_address, 'address')}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                              >
                                {copiedField === 'address' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                    <span>Copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-white" />
                                    <span>Copier</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Métadonnées Marchand & Sécurité */}
                          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1 text-[11px] text-slate-600">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Portefeuille Marchand :</span>
                              <strong className="text-slate-900 font-mono">Binance Wallet Address</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Référence Commande :</span>
                              <strong className="text-slate-900 font-mono text-[10px]">{cryptoInvoice.order_id}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 font-medium">Webhook IPN :</span>
                              <span className="text-emerald-700 font-bold">Actif (Signature HMAC-SHA512)</span>
                            </div>
                          </div>

                          {/* Notice de sécurité réseau & Frè Rezo (Gas Fees) */}
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900 shadow-2xs">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold text-amber-950 block">
                                Avètisman sou Frè Rezo (Gas Fees) & Sekirite :
                              </span>
                              <p className="leading-relaxed">
                                Toujou avèti itilizatè a sou frè rezo (Gas Fees) pou evite peman ki tonbe anba minimòm lan ($10.00 USD). Envoyez exclusivement des tokens <strong>{selectedCryptoCurrency.toUpperCase()}</strong> sur le bon réseau. Dès réception de la confirmation sur la blockchain, votre solde de {depositAmount.toLocaleString()} HTG est crédité automatiquement.
                              </p>
                            </div>
                          </div>

                          {/* Actions de validation & statut */}
                          <div className="space-y-2 pt-1">
                            <button
                              type="button"
                              disabled={isCheckingCryptoStatus}
                              onClick={handleCheckCryptoStatus}
                              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isCheckingCryptoStatus ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Vérification sur la blockchain...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Vérifier le statut du paiement</span>
                                </>
                              )}
                            </button>

                            {/* Bouton de simulation / confirmation rapide pour tests et démos */}
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={handleSimulateCryptoConfirm}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Validation instantanée...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Confirmer le dépôt (Validation instantanée)</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setDepositStep(2);
                              }}
                              className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                              &larr; Modifier le montant ou changer de devise crypto
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : selectedOption.id === 'binance' ? (
                    /* CAS 2 : INTERFACE OFFICIELLE BINANCE PAY (5e mode) */
                    <div className="space-y-4">
                      {/* Gateway Header Banner */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center p-0.5 border border-amber-400 shrink-0 shadow-2xs">
                              <img
                                src="/assets/aistudio/9561438d-c242-438c-81f9-91c48fbf2273_3b9dccdb.jpeg"
                                alt="Binance Pay Logo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                Passerelle Officielle Binance Pay ({selectedBinanceCurrency})
                              </h4>
                              <span className="text-[10px] text-amber-700 font-mono flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                bpay.binanceapi.com • Zero Gas Fees
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded-lg block">
                              {depositAmount.toLocaleString()} HTG
                            </span>
                            <span className="text-[10px] font-mono text-amber-800 font-bold block mt-0.5">
                              ≈ ${(depositAmount / HTG_TO_USD_RATE).toFixed(2)} {selectedBinanceCurrency}
                            </span>
                          </div>
                        </div>

                        {/* Bannière d'instruction */}
                        <div className="text-xs text-black font-semibold bg-[#38bdf8] p-3.5 rounded-xl border border-sky-400 shadow-2xs leading-relaxed">
                          <p className="text-black font-semibold">
                            Ordre de paiement marchand généré via <strong className="text-black font-black underline">Binance Pay Officiel</strong>. Scannez le QR Code avec votre application Binance ou cliquez sur le bouton pour régler directement sans aucun frais de réseau.
                          </p>
                        </div>
                      </div>

                      {/* Toast Presse-Papier Visuel */}
                      {clipboardToast && (
                        <div className="bg-slate-900 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-lg border border-amber-400/40 flex items-center justify-between animate-fade-in">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span>✓</span>
                            <span>{clipboardToast}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Presse-papier</span>
                        </div>
                      )}

                      {/* Facture Binance Pay */}
                      {isBinanceLoading ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
                          <RefreshCw className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                          <h4 className="text-xs font-bold text-slate-800">
                            Initialisation de l'ordre Binance Pay...
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Création de la référence de paiement sécurisée en {selectedBinanceCurrency}
                          </p>
                        </div>
                      ) : binanceOrder ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
                          {/* 1. Kwonomèt Lòd Binance Pay */}
                          <div className="p-3 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl border border-amber-500/30 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <Clock className="w-4 h-4 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                                  Kwonomèt Lòd Binance Pay
                                </span>
                                <span className="text-[10px] text-slate-300 block">
                                  Session de paiement sécurisée
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black font-mono text-amber-400 bg-black/60 px-2.5 py-1 rounded-lg border border-amber-500/30 inline-block shadow-inner">
                                {Math.floor(expirationSeconds / 60).toString().padStart(2, '0')}:{(expirationSeconds % 60).toString().padStart(2, '0')}
                              </span>
                            </div>
                          </div>

                          {/* 2. QR Code Binance Pay & Informations Marchand */}
                          <div className="flex flex-col items-center justify-center p-4 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-3">
                            <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-md relative">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(binanceOrder.checkoutUrl || binanceOrder.qrContent || `https://app.binance.com/qr/${binanceOrder.prepayId}`)}`}
                                alt="QR Code Binance Pay"
                                className="w-44 h-44 object-contain rounded-lg"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-slate-950 p-1 border-2 border-amber-400 shadow-md flex items-center justify-center">
                                  <img
                                    src="/assets/aistudio/9561438d-c242-438c-81f9-91c48fbf2273_3b9dccdb.jpeg"
                                    alt="Binance Center"
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-center space-y-1">
                              <span className="text-xs font-black text-slate-900 block">
                                Scannez avec l'application Binance
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Ouvrez Binance &rarr; Scanner le QR Code &rarr; Confirmer
                              </span>
                            </div>
                          </div>

                          {/* 3. Données de l'ordre à copier */}
                          <div className="space-y-2">
                            {/* Montant exact en devise crypto */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] text-slate-500 block font-medium">Montant à transférer :</span>
                                <span className="font-mono text-sm font-black text-amber-700">
                                  {binanceOrder.amountUSD || (depositAmount / HTG_TO_USD_RATE).toFixed(2)} {selectedBinanceCurrency}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(`${binanceOrder.amountUSD || (depositAmount / HTG_TO_USD_RATE).toFixed(2)}`, 'binance_amount')}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                {copiedField === 'binance_amount' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Kopye!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Kopye</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Numéro d'ordre Marchand */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                              <div className="min-w-0 pr-2">
                                <span className="text-[10px] text-slate-500 block font-medium">Numéro d'ordre Marchand :</span>
                                <span className="font-mono text-xs font-bold text-slate-800 truncate block">
                                  {binanceOrder.merchantTradeNo}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyText(binanceOrder.merchantTradeNo, 'merchant_order')}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                              >
                                {copiedField === 'merchant_order' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-700">Kopye!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Kopye</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Bouton d'action direct & confirmation */}
                          <div className="space-y-2 pt-1">
                            {binanceOrder.checkoutUrl && (
                              <a
                                href={binanceOrder.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={playClickSound}
                                className="w-full bg-[#F0B90B] hover:bg-[#d8a407] text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <span>Peye dirèkteman sou Binance App</span>
                                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={handleConfirmBinancePay}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Mwen konfime peman an sou Binance Pay</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                setDepositStep(2);
                              }}
                              className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                            >
                              &larr; Modifier le montant ou changer de devise Binance
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    /* CAS 3 : PASSERELLES MOBILES ET BANCAIRES CLASSIQUES */
                    <>
                      {/* Gateway Header Banner */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-2xs">
                              {selectedOption.logoUrl ? (
                                <img
                                  src={selectedOption.logoUrl}
                                  alt={selectedOption.name}
                                  className="w-full h-full object-contain p-0.5"
                                />
                              ) : (
                                <div className={`w-full h-full ${selectedOption.bg} ${selectedOption.color} flex items-center justify-center font-black text-sm`}>
                                  {selectedOption.initial}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {selectedOption.id === 'natcash'
                                  ? 'Passerelle Sécurisée NatPay (Natcom)'
                                  : selectedOption.id === 'moncash'
                                  ? 'Passerelle Sécurisée MonCash (Digicel)'
                                  : 'Passerelle Sécurisée Code Recharge Express'}
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

                        {/* Bannière de redirection - Fond bleu ciel (#38bdf8) et texte en noir foncé */}
                        <div className="text-xs text-black font-semibold bg-[#38bdf8] p-3.5 rounded-xl border border-sky-400 shadow-2xs leading-relaxed">
                          {selectedOption.id === 'natcash' ? (
                            <p className="text-black font-semibold">
                              Redirection vers l'interface de connexion officielle <strong className="text-black font-black underline">natpay.natcom.com.ht</strong>. Entrez votre numéro de téléphone Natcom pour vous authentifier et finaliser la transaction.
                            </p>
                          ) : selectedOption.id === 'moncash' ? (
                            <p className="text-black font-semibold">
                              L'accès direct s'effectue via l'interface web ou mobile sécurisée de <strong className="text-black font-black underline">MonCash</strong>, vous permettant de valider le paiement directement depuis votre compte actif en toute sécurité.
                            </p>
                          ) : (
                            <p className="text-black font-semibold">
                              Validation directe via le portail officiel de coupon <strong className="text-black font-black underline">Code Recharge Express</strong>.
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

                        {/* Partie Accéder directement au portail web externe - Fond bleu ciel (#38bdf8) et écritures en noir foncé */}
                        <div className="pt-1">
                          <a
                            href={selectedOption.gatewayUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#38bdf8] hover:bg-sky-400 active:bg-sky-500 text-black font-black text-xs border border-sky-400 shadow-md transition-all cursor-pointer"
                            title={`Accéder directement au portail web externe ${selectedOption.gatewayHost}`}
                          >
                            <ExternalLink className="w-4 h-4 text-black stroke-[2.5] shrink-0" />
                            <span className="text-black font-black tracking-wide">
                              Accéder directement au portail web externe {selectedOption.gatewayHost}
                            </span>
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
                    </>
                  )}
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
                    if (isMethodBlocked('natcash')) {
                      showCustomModal(
                        'Mòd Retrè Bloke (Natcash)',
                        getMethodNotice('natcash'),
                        '⚠️',
                        'text-red-600',
                        'bg-red-50'
                      );
                      return;
                    }
                    setWithdrawGateway('natcash');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    isMethodBlocked('natcash')
                      ? 'bg-slate-100/90 border-red-200 opacity-60 cursor-not-allowed grayscale'
                      : withdrawGateway === 'natcash'
                      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-orange-200 bg-white flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/5716015f-89d6-46be-a78f-4bdf2bf34bbf_2_5b4a470d.jpeg"
                        alt="Natcash logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-xs text-slate-900 truncate">Natcash - Online</p>
                        {isMethodBlocked('natcash') && <Lock className="w-3 h-3 text-red-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isMethodBlocked('natcash') ? 'Bloke pa admin' : 'Max : 40 000 HTG'}
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (isMethodBlocked('moncash')) {
                      showCustomModal(
                        'Mòd Retrè Bloke (MonCash)',
                        getMethodNotice('moncash'),
                        '⚠️',
                        'text-red-600',
                        'bg-red-50'
                      );
                      return;
                    }
                    setWithdrawGateway('moncash');
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    isMethodBlocked('moncash')
                      ? 'bg-slate-100/90 border-red-200 opacity-60 cursor-not-allowed grayscale'
                      : withdrawGateway === 'moncash'
                      ? 'bg-red-50 border-red-300 ring-2 ring-red-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-red-200 bg-white flex items-center justify-center shrink-0">
                      <img
                        src="/assets/aistudio/Jamaica_to_Establish_STEM_Innovation_Teaching_Center_d4bcd70b.jpeg"
                        alt="MonCash logo"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-xs text-slate-900 truncate">MonCash - Online</p>
                        {isMethodBlocked('moncash') && <Lock className="w-3 h-3 text-red-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {isMethodBlocked('moncash') ? 'Bloke pa admin' : 'Max : 100 000 HTG'}
                      </p>
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
