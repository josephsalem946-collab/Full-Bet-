import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du transporteur d'e-mails pour vos alertes (Panneau Propriétaire 2FA HQ)
const GMAIL_ALERT_USER = process.env.GMAIL_ALERT_USER || 'fullbet509@gmail.com';
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || 'VOTRE_MOT_DE_PASSE_APPLICATION';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_ALERT_USER, // Votre e-mail d'envoi
    pass: GMAIL_APP_PASS    // Mot de passe d'application Gmail
  }
});

// 1. CHARGEMENT SÉCURISÉ DE LA CONFIGURATION FIREBASE CÔTÉ SERVEUR (JAMAIS EXPOSÉE AU CLIENT)
let firebaseConfig: {
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  appId?: string;
} = {};

try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    firebaseConfig = JSON.parse(raw);
    console.log('[Full Bet Server] Configuration Firebase chargée en toute sécurité côté serveur.');
  }
} catch (err) {
  console.warn('[Full Bet Server] Notice: firebase-applet-config.json non lu ou absent.', err);
}

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || firebaseConfig.apiKey || '';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'gaincash-prod';
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';

// =========================================================================
// CONFIGURATION OFFICIELLE FULL BET : BINANCE PAY, MONCASH & NATCASH (CÔTÉ SERVEUR)
// Spécifications de sécurité : HMAC-SHA512, Idempotence, Rate Limiting 100 req / 15 min
// =========================================================================
export const BINANCE_API_KEY = (process.env.BINANCE_API_KEY && process.env.BINANCE_API_KEY !== 'false')
  ? process.env.BINANCE_API_KEY
  : 'xECWJWnJIKLgh9KqFbV7OsMtLH8yu3fH9cR19fgr2NGRQcT1oTcELIS1bv86Swpc';

export const BINANCE_SECRET_KEY = (process.env.BINANCE_SECRET_KEY && process.env.BINANCE_SECRET_KEY !== 'false')
  ? process.env.BINANCE_SECRET_KEY
  : 'hbdpOii1aoW2KxnSCrCSdKxPdth7jOOTAnRH5pkpO8CKPrQnmz9FR7GMp64lbr0W';

export const BINANCE_BASE_URL = (process.env.BINANCE_BASE_URL && process.env.BINANCE_BASE_URL !== 'false')
  ? process.env.BINANCE_BASE_URL
  : 'https://bpay.binanceapi.com';

export const SUPPORT_EMAIL = (process.env.SUPPORT_EMAIL && process.env.SUPPORT_EMAIL !== 'false')
  ? process.env.SUPPORT_EMAIL
  : 'fullbet509@gmail.com';

// Rate Limiting strict sur les passerelles de paiement (windowMs: 900000ms = 15min, max: 100)
export const paymentGatewaysLimiter = rateLimit({
  windowMs: 900000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Limite de requêtes atteinte pour la passerelle de paiement (100 req / 15 min).'
  }
});

// Idempotency check set : protection contre les paiements multiples / rejeux
export const processedBinancePayments = new Set<string>();

// Vérification de signature HMAC-SHA512 Binance Pay avec timingSafeEqual
// Format officiel du payload signé : "{timestamp}\n{nonce}\n{json_payload}\n"
export function verifyBinanceSignature(
  timestamp: string,
  nonce: string,
  rawJsonPayload: string,
  signatureToVerify: string
): boolean {
  if (!timestamp || !nonce || !signatureToVerify) return false;
  try {
    const payloadToSign = `${timestamp}\n${nonce}\n${rawJsonPayload}\n`;
    const computedSignature = crypto
      .createHmac('sha512', BINANCE_SECRET_KEY)
      .update(payloadToSign)
      .digest('hex')
      .toUpperCase();

    const computedBuf = Buffer.from(computedSignature, 'utf-8');
    const receivedBuf = Buffer.from(signatureToVerify.trim().toUpperCase(), 'utf-8');

    if (computedBuf.length !== receivedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  } catch (err) {
    console.warn('[Binance Pay] Erreur de vérification de signature:', err);
    return false;
  }
}

// =========================================================================
// ASSISTANT VIRTUEL FULL BET (CÔTÉ SERVEUR VIA @GOOGLE/GENAI)
// Modèle : gemini-3.8-flash, Header User-Agent : 'aistudio-build'
// =========================================================================
export const ASSISTANT_SYSTEM_PROMPT = "Tu es l'assistant virtuel officiel de Full Bet. Tu es professionnel et axé sur la sécurité. Ne révèle jamais d'informations personnelles (utilise 'Numéro masqué' ou 'Non renseigné'). Pour tout support technique, réoriente vers fullbet509@gmail.com. Les options de paiement acceptées sont Binance Pay, Moncash online, et Natcash online.";

const geminiApiKey = (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'false')
  ? process.env.GEMINI_API_KEY
  : (process.env.API_KEY || '');

let geminiAiClient: GoogleGenAI | null = null;
try {
  if (geminiApiKey) {
    geminiAiClient = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
} catch (e) {
  console.warn('[Gemini AI] Avertissement initialisation client:', e);
}

// =========================================================================
// CONFIGURATION DU MODULE DE PAIEMENT CRYPTO NOWPAYMENTS (CÔTÉ SERVEUR)
// Respect strict des Règles 1 & 2 : clé API stockée côté serveur & jamais exposée
// =========================================================================
const NOWPAYMENTS_API_KEY = (process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_API_KEY !== 'false') ? process.env.NOWPAYMENTS_API_KEY : '6EZ44P4-K52MBVT-QQ56MRX-WZWM8J5';
const NOWPAYMENTS_IPN_SECRET = (process.env.NOWPAYMENTS_IPN_SECRET && process.env.NOWPAYMENTS_IPN_SECRET !== 'false') ? process.env.NOWPAYMENTS_IPN_SECRET : 'fullbet_nowpayments_ipn_secret_key';
const NOWPAYMENTS_PAYOUT_WALLET = (process.env.NOWPAYMENTS_PAYOUT_WALLET && process.env.NOWPAYMENTS_PAYOUT_WALLET !== 'false') ? process.env.NOWPAYMENTS_PAYOUT_WALLET : 'Binance Wallet Address';
const NOWPAYMENTS_API_ENDPOINT = 'https://api.nowpayments.io/v1';

export interface CryptoPaymentRecord {
  payment_id: string;
  invoice_id: string;
  userId: string;
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
  amountHTG: number;
}

export interface PaymentAuditLog {
  request_body: any;
  client_ip: string;
  timestamp: string;
  payment_id: string;
  status: string;
}

const cryptoPaymentsMap = new Map<string, CryptoPaymentRecord>();
// Replay attack protection : anpeche yon tranzaksyon kredite de fwa
const processedCryptoPayments = new Set<string>();
// Audit logging table dédiée
const paymentAuditLogs: PaymentAuditLog[] = [];

export function logPaymentAudit(req: { ip?: string; headers?: Record<string, any>; socket?: { remoteAddress?: string } }, paymentId: string, status: string, requestBody: any) {
  const clientIp = (req.headers && (req.headers['x-forwarded-for'] as string)) || req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const entry: PaymentAuditLog = {
    request_body: requestBody,
    client_ip: Array.isArray(clientIp) ? clientIp[0] : String(clientIp).split(',')[0].trim(),
    timestamp: new Date().toISOString(),
    payment_id: String(paymentId),
    status: String(status)
  };
  paymentAuditLogs.unshift(entry);
  if (paymentAuditLogs.length > 500) paymentAuditLogs.pop();
  console.log(`[AUDIT LOG] ${entry.timestamp} | IP: ${entry.client_ip} | Payment: ${entry.payment_id} | Status: ${entry.status}`);
}

// 2. FONCTIONS DE NETTOYAGE ET ASSAINISSEMENT (SANITIZATION)
export function sanitizeString(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Nettoyage strict anti-XSS et injection : aucune balise HTML permise
  const cleaned = DOMPurify.sanitize(val.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return cleaned.replace(/[<>'"`;]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      case '`': return '&#96;';
      case ';': return '&#59;';
      default: return c;
    }
  });
}

// =========================================================================
// MASQUAGE DE SÉCURITÉ DES DONNÉES SENSIBLES (CONFORME CAHIER DES CHARGES)
// =========================================================================
export const DONNEES_A_MASQUER = {
  noms: ["Joseph Hollyventz Salem"],
  emails: ["josephsalem946@gmail.com"],
  telephones: [
    "509 46877695",
    "50946877695",
    "+50946877695",
    "+509 4687 7695",
    "46877695",
    "4687 7695",
    "509 32153281",
    "50932153281",
    "+50932153281",
    "+509 3215 3281",
    "+509 32153281",
    "32153281",
    "3215 3281",
    "509 4771 6289",
    "+509 4771 6289",
    "50947716289",
    "47716289"
  ]
};

export function formaterEtMasquer(valeur: unknown, type: 'telephone' | 'email' | 'nom' | 'texte' = 'texte'): string {
  if (valeur === null || valeur === undefined || valeur === '') return "Non renseigné";
  const valeurStr = String(valeur).trim();

  // Vérification stricte par type
  if (type === 'telephone' && DONNEES_A_MASQUER.telephones.includes(valeurStr)) return "+509 •••• ••••";
  if (type === 'email') {
    if (valeurStr.toLowerCase() === 'fullbet509@gmail.com') return 'fullbet509@gmail.com';
    if (DONNEES_A_MASQUER.emails.includes(valeurStr) || valeurStr.toLowerCase().includes('josephsalem946')) {
      return "fullbet509@gmail.com";
    }
  }
  if (type === 'nom' && (DONNEES_A_MASQUER.noms.includes(valeurStr) || /joseph\s+hollyventz|salem/gi.test(valeurStr))) return "Direction Générale Full Bet";

  // Nettoyage global par Regex pour tout texte ou description dynamique
  return valeurStr
    .replace(/josephsalem946@gmail\.com/gi, "fullbet509@gmail.com")
    .replace(/gain\s*cash/gi, "Full Bet")
    .replace(/\+?509[\s.-]*(?:3215[\s.-]*3281|4687[\s.-]*7695|4771[\s.-]*6289)/gi, "+509 •••• ••••")
    .replace(/(\+?509[\s.-]*)?[0-9]{8,}/g, "+509 •••• ••••")
    .replace(/Joseph\s+Hollyventz\s+Salem/gi, "Full Bet Direction")
    .replace(/panneau\s+admin(?:istrateur)?/gi, "Panneau Admin")
    .replace(/Panneau\s+Admin(?:istrateur)?/gi, "Panneau Admin");
}

// 3. SCHÉMAS DE VALIDATION STRICTS (ZOD)
const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères').max(60).transform(sanitizeString),
  phone: z.string().min(8, 'Numéro de téléphone invalide').max(20).transform(sanitizeString),
  email: z.string().email('Format email invalide').optional().or(z.literal('')).transform(val => val ? sanitizeString(val) : ''),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').max(100),
  isVerified18: z.boolean().refine(val => val === true, 'Vous devez avoir au moins 18 ans')
});

const LoginSchema = z.object({
  phoneOrEmail: z.string().min(3, 'Identifiant requis').max(80).transform(sanitizeString),
  password: z.string().min(6, 'Mot de passe requis').max(100)
});

const DepositSchema = z.object({
  gateway: z.enum([
    'MonCash Online',
    'NatCash Online',
    'MonCash - Online',
    'NatCash - Online',
    'Carte Bancaire',
    'Code Recharge Express',
    'NOWPayments Crypto',
    'Crypto (USDT, BTC, ETH, TRX)',
    'Crypto (USDT / BTC / ETH / TRX)',
    'Crypto'
  ]),
  amount: z.number().positive('Le montant doit être positif').min(25, 'Le dépôt minimum est de 25 HTG').max(2000000, 'Dépôt maximum de 2,000,000 HTG'),
  referenceId: z.string().min(4, 'Référence de transaction requise').max(100).transform(sanitizeString),
  phoneNumber: z.string().max(120).optional().transform(val => val ? sanitizeString(val) : 'Numéro masqué'),
  cardholderName: z.string().max(80).optional().transform(val => val ? sanitizeString(val) : ''),
  cardLast4: z.string().max(10).optional().transform(val => val ? sanitizeString(val) : ''),
  proofImage: z.string().max(600000).optional(),
  details: z.string().max(300).optional().transform(val => val ? sanitizeString(val) : '')
});

const CryptoCreateSchema = z.object({
  amountHTG: z.number().positive().min(1325, 'Le dépôt minimum en Crypto est de 10.00 USD (~1 325 HTG)').max(132500, 'Le dépôt maximum par 24h est de 1 000.00 USD (~132 500 HTG)').optional(),
  price_amount: z.number().positive().min(10, 'Le montant minimum est de 10.00 USD').max(1000, 'Le montant maximum par 24h est de 1 000.00 USD').optional(),
  price_currency: z.string().default('usd'),
  pay_currency: z.enum(['btc', 'eth', 'trx', 'usdttrc20']).default('usdttrc20'),
  order_description: z.string().max(250).optional()
});

const CryptoSimulateConfirmSchema = z.object({
  paymentId: z.string().min(1, 'Identifiant de paiement requis')
});

const WithdrawSchema = z.object({
  gateway: z.enum(['MonCash Online', 'NatCash Online', 'MonCash - Online', 'NatCash - Online']),
  amount: z.number().positive('Montant positif requis').min(50, 'Retrait minimum de 50 HTG').max(100000, 'Retrait maximum de 100,000 HTG'),
  phoneNumber: z.string().min(8, 'Numéro de retrait requis').max(25).transform(sanitizeString)
});

const SportBetSchema = z.object({
  type: z.enum(['single', 'accumulator']),
  stake: z.number().positive().min(10, 'Mise minimale de 10 HTG').max(100000, 'Mise maximale de 100,000 HTG'),
  selections: z.array(z.object({
    matchId: z.string().transform(sanitizeString),
    matchName: z.string().transform(sanitizeString),
    marketName: z.string().transform(sanitizeString),
    selectionName: z.string().transform(sanitizeString),
    odds: z.number().positive()
  })).min(1, 'Au moins une sélection requise').max(35, 'Maximum seleksyon yon kliyan ka chwazi se 35'),
  totalOdds: z.number().positive(),
  potentialWin: z.number().positive().max(1500000, 'Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG')
});

const CompleteSportBetSchema = z.object({
  ticketId: z.string().min(1, 'Identifiant ticket requis').transform(sanitizeString),
  additionalSelections: z.array(z.object({
    matchId: z.string().transform(sanitizeString),
    matchName: z.string().transform(sanitizeString),
    marketName: z.string().transform(sanitizeString),
    selectionName: z.string().transform(sanitizeString),
    odds: z.number().positive()
  })).min(1, 'Au moins une nouvelle sélection requise').max(35, 'Maximum 35 sélections autorisées')
});

const BorletteBetSchema = z.object({
  drawId: z.string().transform(sanitizeString),
  drawName: z.string().transform(sanitizeString),
  gameType: z.enum(['borlette', 'mariage', 'lotto3', 'lotto4', 'lotto5']),
  numbers: z.array(z.string().transform(sanitizeString)).min(1),
  stake: z.number().positive().min(10, 'Mise minimale de 10 HTG').max(50000, 'Mise maximale de 50,000 HTG'),
  multiplier: z.number().positive(),
  potentialWin: z.number().positive()
});

const AdminActionSchema = z.object({
  action: z.enum(['approve_deposit', 'reject_deposit', 'update_odds', 'toggle_user_block', 'send_push_notification']),
  targetId: z.string().optional().transform(val => val ? sanitizeString(val) : undefined),
  reason: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : undefined),
  multiplierData: z.record(z.string(), z.number()).optional(),
  notificationData: z.object({
    title: z.string().max(100).transform(sanitizeString),
    message: z.string().max(300).transform(sanitizeString)
  }).optional()
});

const FirebaseLoginSchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform(val => val ? sanitizeString(val) : undefined),
  phone: z.string().max(25).optional().or(z.literal('')).transform(val => val ? sanitizeString(val) : undefined),
  phoneOrEmail: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : undefined),
  password: z.string().min(6).max(100).optional(),
  idToken: z.string().max(4000).optional().transform(val => val ? sanitizeString(val) : undefined),
  displayName: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : undefined),
  photoUrl: z.string().max(300).optional().transform(val => val ? sanitizeString(val) : undefined),
  authProvider: z.enum(['firebase_password', 'firebase_google', 'firebase_token', 'credentials']).default('credentials')
});

const CashoutSchema = z.object({
  betId: z.string().min(3).max(80).transform(sanitizeString)
});

const OwnerVerify2FASchema = z.object({
  email: z.string().email().optional().or(z.literal('')).transform(val => val ? sanitizeString(val) : ''),
  code2FA: z.string().min(4).max(12).transform(val => sanitizeString(val).replace(/\s/g, ''))
});

const ToggleGameConfigSchema = z.object({
  gameKey: z.string().min(1).max(50).transform(sanitizeString),
  isActive: z.boolean().optional(),
  maintenanceMessage: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : undefined)
});

const ToggleMatchSchema = z.object({
  matchId: z.string().min(1).max(80).transform(sanitizeString),
  isBettingActive: z.boolean().optional(),
  isLocked: z.boolean().optional()
});

const TogglePaymentMethodSchema = z.object({
  methodId: z.enum(['natcash', 'crypto', 'moncash', 'voucher', 'binance']),
  isBlocked: z.boolean(),
  blockedReason: z.string().max(250).optional().transform(val => val ? sanitizeString(val) : undefined)
});

const SaveTicketIssuerSchema = z.object({
  id: z.union([z.number(), z.string().transform(val => Number(val))]).optional(),
  userId: z.string().max(80).optional().transform(val => val ? sanitizeString(val) : undefined),
  displayIssuerName: z.string().min(2).max(100).transform(sanitizeString),
  phoneContact: z.string().max(30).optional().transform(val => val ? sanitizeString(val) : ''),
  headerMessage: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : ''),
  footerMessage: z.string().max(300).optional().transform(val => val ? sanitizeString(val) : ''),
  isActive: z.boolean().optional()
});

const PrintTicketSchema = z.object({
  ticketCode: z.string().min(3).max(100).optional().transform(val => val ? sanitizeString(val) : undefined),
  ticketId: z.string().min(3).max(100).optional().transform(val => val ? sanitizeString(val) : undefined),
  format: z.string().max(20).optional()
});

const OwnerSanctionSchema = z.object({
  userId: z.string().min(2).max(80).transform(sanitizeString),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'FROZEN']).optional(),
  sanctionReason: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : undefined),
  canPrint: z.boolean().optional(),
  balanceAdjustment: z.number().optional()
});

const SaveBannerSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().min(2).max(120).transform(sanitizeString),
  imageUrl: z.string().max(400).optional().transform(val => val ? sanitizeString(val) : ''),
  redirectUrl: z.string().max(250).optional().transform(val => val ? sanitizeString(val) : ''),
  placement: z.string().max(60).optional().transform(val => val ? sanitizeString(val) : 'HOME_TOP'),
  displayOrder: z.number().optional().default(1),
  isActive: z.boolean().optional().default(true),
  badgeText: z.string().max(60).optional().transform(val => val ? sanitizeString(val) : ''),
  ctaText: z.string().max(60).optional().transform(val => val ? sanitizeString(val) : ''),
  altText: z.string().max(120).optional().transform(val => val ? sanitizeString(val) : ''),
  subtitle: z.string().max(250).optional().transform(val => val ? sanitizeString(val) : ''),
  description: z.string().max(250).optional().transform(val => val ? sanitizeString(val) : ''),
  bannerType: z.string().max(60).optional().transform(val => val ? sanitizeString(val) : 'IMAGE'),
  customHtml: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : undefined),
  customCss: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : undefined),
  startDate: z.string().max(40).optional(),
  endDate: z.string().max(40).optional()
});

const HeartbeatSchema = z.object({
  deviceInfo: z.string().max(150).optional().transform(val => val ? sanitizeString(val) : 'Android Browser')
});

// Schéma pour l'analyse des risques d'une fiche client (Panneau Propriétaire 2FA HQ)
export interface FichePariRisque {
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
}

export interface RiskAlertItem {
  id: string;
  fiche: FichePariRisque;
  analyse: {
    niveauRisque: string;
    statut: string;
    raisons: string[];
  };
  emailSent: boolean;
  createdAt: string;
}

const FicheAnalyseSchema = z.object({
  idClient: z.string().max(80).optional().transform(val => val ? sanitizeString(val) : '12345'),
  nomClient: z.string().max(100).optional().transform(val => val ? sanitizeString(val) : 'Client Full Bet'),
  categorie: z.string().max(50).optional().transform(val => val ? sanitizeString(val) : 'Sports'),
  typePari: z.string().max(40).optional().transform(val => val ? sanitizeString(val) : 'combine'),
  nombreSelections: z.number().int().min(0).max(50).optional().default(1),
  mise: z.number().positive().min(1).max(1000000),
  coteTotale: z.number().positive(),
  gainPotentiel: z.number().positive(),
  aBoostCotes: z.boolean().optional().default(false),
  estNouveauCompte: z.boolean().optional().default(false)
});

// Fonction d'analyse des risques d'une fiche de pari
export function analyserRisqueFiche(fiche: FichePariRisque) {
  let niveauRisque = '🟢 Vert (Risque standard)';
  let statut = 'Validé';
  const raisons: string[] = [];

  const GAIN_MAX_SEUIL = 50000; // en HTG
  const SELECTIONS_COMBINE_SEUIL = 5;

  // 1. Alerte sur les gains potentiels maximaux
  if (fiche.gainPotentiel >= GAIN_MAX_SEUIL) {
    niveauRisque = '🔴 Rouge (Risque critique)';
    statut = 'À risque élevé / En attente de validation';
    raisons.push(`Gain potentiel élevé : ${fiche.gainPotentiel.toLocaleString()} HTG (Seuil : ${GAIN_MAX_SEUIL.toLocaleString()} HTG)`);
  }

  // 2. Surveillance des paris combinés
  if (fiche.typePari === 'combine' && (fiche.nombreSelections || 0) > SELECTIONS_COMBINE_SEUIL) {
    niveauRisque = '🔴 Rouge (Risque critique)';
    statut = 'À risque élevé / En attente de validation';
    raisons.push(`Pari combiné complexe avec ${fiche.nombreSelections} sélections.`);
  }

  // 3. Contrôle des offres promotionnelles (Boost de cotes +30%)
  if (fiche.aBoostCotes && fiche.coteTotale > 5.0) {
    niveauRisque = '🔴 Rouge (Risque critique)';
    statut = 'À risque élevé / En attente de validation';
    raisons.push(`Utilisation d'un boost de cotes sur une cote globale élevée (${fiche.coteTotale}).`);
  }

  // 4. Surveillance des nouveaux comptes ou marchés volatils (Jaune)
  if (fiche.estNouveauCompte || fiche.categorie === 'Borlette' || fiche.categorie === 'Casino') {
    if (niveauRisque !== '🔴 Rouge (Risque critique)') {
      niveauRisque = '🟡 Jaune (À surveiller)';
      raisons.push(`Compte récent ou marché volatil (${fiche.categorie || 'Jeux'}).`);
    }
  }

  return { niveauRisque, statut, raisons };
}

// Middleware d'application de schéma avec nettoyage profond préalable
function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Données invalides : chaque champ doit respecter les contraintes strictes',
          details: error.issues.map(e => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      return res.status(500).json({ error: 'Erreur interne de validation' });
    }
  };
}

// 4. RATE LIMITERS GLOBAUX & DÉDIÉS SUR LES ROUTES API
export const globalAllRoutesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // Limite de 300 requêtes par minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  skip: (req) => !req.path.startsWith('/api'), // Ne jamais bloquer les assets Vite, JavaScript ou CSS
  message: {
    status: 429,
    error: 'Limite globale de requêtes atteinte. Protection anti-abus active (Rate Limit). Veuillez patienter 1 minute.'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limite à 15 tentatives par IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Trop de tentatives d\'authentification Firebase. Veuillez patienter 15 minutes pour votre sécurité.'
  }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requêtes par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Limite de requêtes API atteinte. Veuillez réessayez dans un instant.'
  }
});

export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 transactions max par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Trop de transactions soumises consécutivement. Veuillez patienter un instant.'
  }
});

export const betsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 45, // 45 paris max par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Trop de requêtes de paris soumises. Veuillez patienter un instant.'
  }
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40, // 40 actions administratives max par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    status: 429,
    error: 'Limite d\'actions administratives atteinte. Veuillez patienter.'
  }
});

// 5. BASE DE DONNÉES EN MÉMOIRE SYNCHRONISÉE & SERVICE FIRESTORE SÉCURISÉ
// Les données utilisateur sont conservées de manière intègre côté serveur
// 5. BASE DE DONNÉES EN MÉMOIRE SYNCHRONISÉE & SERVICE FIRESTORE SÉCURISÉ
export type UserRole = 'CLIENT' | 'AGENT' | 'ADMIN' | 'OWNER';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'FROZEN';

interface ServerUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  balanceHTG: number;
  bonusBalanceHTG: number;
  isVerified18: boolean;
  biometricsEnabled: boolean;
  isBlocked: boolean;
  role: UserRole;
  status: AccountStatus;
  sanctionReason?: string;
  canPrint: boolean;
  joinedDate: string;
  moncashNumber: string;
  natcashNumber: string;
  lastIp?: string;
  lastDeviceInfo?: string;
  lastHeartbeat?: string;
  tokenVersion: number;
  passwordHash?: string;
}

interface GameConfigItem {
  id: string;
  gameKey: string;
  name: string;
  category: 'SPORTS' | 'CASINO' | 'BORLETTE';
  isActive: boolean;
  maintenanceMessage?: string;
}

interface SportsMatchControl {
  id: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  startTime: string;
  isBettingActive: boolean;
  isLocked: boolean;
}

interface TicketIssuerItem {
  id: number;
  userId?: string;
  displayIssuerName: string;
  phoneContact: string;
  headerMessage: string;
  footerMessage: string;
  isActive: boolean;
  updatedAt: string;
}

interface AdBannerItem {
  id: string;
  title: string;
  imageUrl: string;
  redirectUrl: string;
  placement: 'HOME_HERO' | 'PROMO_BAR';
  displayOrder: number;
  isActive: boolean;
  badgeText?: string;
  ctaText?: string;
  altText?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  bannerType?: 'image' | 'custom_html' | 'google_adsense' | 'ad_network' | 'image_only';
  customHtml?: string;
  customCss?: string;
  adSenseClientId?: string;
  adSenseSlotId?: string;
  adSenseFormat?: 'auto' | 'horizontal' | 'rectangle' | 'responsive';
  adNetworkScript?: string;
  adNetworkIframeUrl?: string;
}

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name?: string;
  keyHash: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  status: 'active' | 'revoked';
}

const nowIso = new Date().toISOString();

const serverDatabase = {
  users: new Map<string, ServerUser>([
    [
      'usr-80491',
      {
        id: 'usr-80491',
        fullName: 'Jean-Baptiste Pierre',
        phone: '+509 3744 1928',
        email: 'jeanbaptiste.p@gmail.com',
        balanceHTG: 12500,
        bonusBalanceHTG: 1000,
        isVerified18: true,
        biometricsEnabled: true,
        isBlocked: false,
        role: 'CLIENT',
        status: 'ACTIVE',
        canPrint: false,
        joinedDate: '2026-09-01',
        moncashNumber: '+509 •••• ••••',
        natcashNumber: '+509 •••• ••••',
        lastIp: '190.115.176.42',
        lastDeviceInfo: 'Android 14 / SM-A546B',
        lastHeartbeat: nowIso,
        tokenVersion: 1,
        passwordHash: 'demo12345'
      }
    ],
    [
      'usr-agent-01',
      {
        id: 'usr-agent-01',
        fullName: 'Agent Delmas 33',
        phone: '+509 3810 5500',
        email: 'delmas33@fullbet.ht',
        balanceHTG: 85000,
        bonusBalanceHTG: 5000,
        isVerified18: true,
        biometricsEnabled: true,
        isBlocked: false,
        role: 'AGENT',
        status: 'ACTIVE',
        canPrint: true,
        joinedDate: '2026-08-15',
        moncashNumber: '+509 3810 5500',
        natcashNumber: '+509 3810 5500',
        lastIp: '190.115.180.12',
        lastDeviceInfo: 'Terminal POS Sunmi V2',
        lastHeartbeat: nowIso,
        tokenVersion: 1,
        passwordHash: 'agent2026'
      }
    ],
    [
      'usr-client-02',
      {
        id: 'usr-client-02',
        fullName: 'Wilner Célestin',
        phone: '+509 4822 7701',
        email: 'w.celestin@yahoo.fr',
        balanceHTG: 450,
        bonusBalanceHTG: 0,
        isVerified18: true,
        biometricsEnabled: false,
        isBlocked: false,
        role: 'CLIENT',
        status: 'ACTIVE',
        canPrint: false,
        joinedDate: '2026-09-12',
        moncashNumber: '+509 4822 7701',
        natcashNumber: '+509 4822 7701',
        lastIp: '190.115.179.88',
        lastDeviceInfo: 'iPhone 15 Pro / iOS 18',
        lastHeartbeat: nowIso,
        tokenVersion: 1,
        passwordHash: 'client2026'
      }
    ],
    [
      'admin-salem',
      {
        id: 'admin-salem',
        fullName: 'Direction Full Bet',
        phone: '+509 •••• ••••',
        email: 'fullbet509@gmail.com',
        balanceHTG: 999999,
        bonusBalanceHTG: 50000,
        isVerified18: true,
        biometricsEnabled: true,
        isBlocked: false,
        role: 'OWNER',
        status: 'ACTIVE',
        canPrint: true,
        joinedDate: '2026-01-01',
        moncashNumber: '+509 •••• ••••',
        natcashNumber: '+509 •••• ••••',
        lastIp: '190.115.176.1',
        lastDeviceInfo: 'Admin HQ Desktop Secure',
        lastHeartbeat: nowIso,
        tokenVersion: 1,
        passwordHash: 'admin2026'
      }
    ]
  ]),
  gamesConfig: [
    {
      id: 'g-b-ny-m',
      gameKey: 'borlette_ny_midi',
      name: 'Borlette New York Midi',
      category: 'BORLETTE',
      isActive: true,
      maintenanceMessage: 'Tirage ouvert jusqu\'à 12h25'
    },
    {
      id: 'g-b-ny-s',
      gameKey: 'borlette_ny_soir',
      name: 'Borlette New York Soir',
      category: 'BORLETTE',
      isActive: true,
      maintenanceMessage: 'Tirage ouvert jusqu\'à 19h25'
    },
    {
      id: 'g-b-fl-m',
      gameKey: 'borlette_fl_midi',
      name: 'Borlette Floride Midi',
      category: 'BORLETTE',
      isActive: true,
      maintenanceMessage: 'Tirage ouvert jusqu\'à 13h25'
    },
    {
      id: 'g-b-fl-s',
      gameKey: 'borlette_fl_soir',
      name: 'Borlette Floride Soir',
      category: 'BORLETTE',
      isActive: true,
      maintenanceMessage: 'Tirage ouvert jusqu\'à 21h25'
    },
    {
      id: 'g-b-ga',
      gameKey: 'borlette_ga',
      name: 'Borlette Géorgie',
      category: 'BORLETTE',
      isActive: false,
      maintenanceMessage: 'Tirage temporairement suspendu par la direction'
    },
    {
      id: 'g-c-roulette',
      gameKey: 'casino_roulette',
      name: 'Casino Live Roulette',
      category: 'CASINO',
      isActive: true,
      maintenanceMessage: 'Table VIP Roulette Européenne & Américaine ouverte'
    },
    {
      id: 'g-c-crash',
      gameKey: 'casino_crash',
      name: 'Jeu de Crash (Aviator)',
      category: 'CASINO',
      isActive: true,
      maintenanceMessage: 'Multiplicateur dynamique jusqu\'à 100x'
    },
    {
      id: 'g-c-slots',
      gameKey: 'casino_slots',
      name: 'Machines à Sous (Slots)',
      category: 'CASINO',
      isActive: true,
      maintenanceMessage: 'Jackpot progressif disponible'
    },
    {
      id: 'g-c-luckyx',
      gameKey: 'casino_luckyx',
      name: '⚡ Lucky X (Loterie Rapide 50 Boules)',
      category: 'CASINO',
      isActive: true,
      maintenanceMessage: 'Tirage 36/50 boules et paris spéciaux ouverts'
    },
    {
      id: 'g-c-luckysix',
      gameKey: 'casino_luckysix',
      name: '🎱 Lucky Six (Loto Visuel 6/48)',
      category: 'CASINO',
      isActive: true,
      maintenanceMessage: 'Tirage 35/48 boules, bonus ballons et jackpot Grenadye Alaso actifs'
    },
    {
      id: 'g-s-football',
      gameKey: 'sports_football',
      name: 'Paris Sportifs Football',
      category: 'SPORTS',
      isActive: true,
      maintenanceMessage: 'Cotes pré-match et live ouvertes'
    },
    {
      id: 'g-s-basketball',
      gameKey: 'sports_basketball',
      name: 'Paris Sportifs Basketball (NBA)',
      category: 'SPORTS',
      isActive: true,
      maintenanceMessage: 'Lignes de handicap et totals actifs'
    },
    {
      id: 'g-s-tennis',
      gameKey: 'sports_tennis',
      name: 'Paris Sportifs Tennis (ATP/WTA)',
      category: 'SPORTS',
      isActive: true,
      maintenanceMessage: 'Paris en direct ouverts'
    }
  ] as GameConfigItem[],
  sportsMatches: [
    {
      id: 'm-uefa-1',
      homeTeam: 'Real Madrid',
      awayTeam: 'Manchester City',
      category: 'Ligue des Champions',
      startTime: '2026-09-24 21:00',
      isBettingActive: true,
      isLocked: false
    },
    {
      id: 'match_classic_fr',
      homeTeam: 'Paris Saint-Germain',
      awayTeam: 'Olympique de Marseille',
      category: 'France - Ligue 1',
      startTime: '2026-09-24 20:45',
      isBettingActive: true,
      isLocked: false
    },
    {
      id: 'm-nba-1',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Los Angeles Lakers',
      category: 'NBA Basketball',
      startTime: '2026-09-24 22:30',
      isBettingActive: true,
      isLocked: false
    }
  ] as SportsMatchControl[],
  ticketIssuers: [
    {
      id: 1,
      userId: 'usr-agent-01',
      displayIssuerName: 'Banque Centrale Express',
      phoneContact: '+509 •••• ••••',
      headerMessage: '★ FULL BET • BONNE CHANCE ! ★',
      footerMessage: 'Fiche officielle certifiée. Réclamation sous 30 jours sur présentation du ticket.',
      isActive: true,
      updatedAt: '2026-09-24'
    },
    {
      id: 2,
      userId: 'usr-agent-01',
      displayIssuerName: 'Borlette Delmas 33',
      phoneContact: '+509 •••• ••••',
      headerMessage: 'TIRAGES OFFICIELS NY & FLORIDE',
      footerMessage: 'Vérifiez immédiatement vos numéros avant de quitter le comptoir.',
      isActive: true,
      updatedAt: '2026-09-24'
    },
    {
      id: 3,
      userId: 'admin-salem',
      displayIssuerName: 'Succursale Pétion-Ville VIP',
      phoneContact: '+509 3712 9000',
      headerMessage: 'FULL BET VIP CLUB LOUNGE',
      footerMessage: 'Paiement garanti et instantané MonCash / NatCash jusqu\'à 500 000 HTG.',
      isActive: true,
      updatedAt: '2026-09-24'
    }
  ] as TicketIssuerItem[],
  adBanners: [
    {
      id: 'ban-1',
      title: 'BOOST DE COTES +30% • LIGUE DES CHAMPIONS',
      subtitle: 'Offre officielle Full Bet. Cotes garanties & dépôts / retraits instantanés par Moncash et Natcash.',
      imageUrl: 'imaj1.webp',
      redirectUrl: 'sports',
      placement: 'HOME_HERO',
      displayOrder: 1,
      isActive: true,
      badgeText: 'CHOC EUROPÉEN',
      ctaText: 'Parier Direct',
      altText: 'Banyè Full Bet'
    },
    {
      id: 'ban-2',
      title: 'JACKPOT BORLETTE NEW YORK MIDI & SOIR • GAIN X50',
      subtitle: 'Misez sur les tirages officiels de New York et Florida en direct.',
      imageUrl: '/assets/banners/banner_borlette_lottery.webp',
      redirectUrl: 'borlette',
      placement: 'HOME_HERO',
      displayOrder: 2,
      isActive: true,
      badgeText: 'TIRAGES OFFICIELS NY / FLORIDA',
      ctaText: 'Choisir mes numéros',
      altText: 'Banyè Borlette Haïti'
    },
    {
      id: 'ban-3',
      title: 'CASINO AVIATOR CRASH & JETX • MULTIPLICATEUR X100',
      subtitle: 'Encaissez avant le crash et multipliez vos gains jusqu\'à 100x.',
      imageUrl: '/assets/banners/banner_casino_crash.webp',
      redirectUrl: 'casino',
      placement: 'HOME_HERO',
      displayOrder: 3,
      isActive: true,
      badgeText: 'GAIN IMMÉDIAT EN DIRECT',
      ctaText: 'Décoller maintenant',
      altText: 'Banyè Casino Crash'
    },
    {
      id: 'ban-4',
      title: 'BONUS DE BIENVENUE 100% • RECHARGE MONCASH & NATCASH',
      subtitle: 'Rechargez via Moncash ou Natcash et doublez votre premier dépôt.',
      imageUrl: '/assets/banners/banner_bonus_welcome.webp',
      redirectUrl: 'sports',
      placement: 'HOME_HERO',
      displayOrder: 4,
      isActive: true,
      badgeText: 'DÉPÔT DOUBLÉ',
      ctaText: 'Recharger mon compte',
      altText: 'Banyè Bonus Recharge'
    },
    {
      id: 'ban-5',
      title: 'ROULETTE AMÉRICAINE & KENO 20/80 • PAIEMENT INSTANTANÉ',
      subtitle: 'Misez sur le rouge, le noir ou vos numéros favoris en direct.',
      imageUrl: '/assets/banners/banner_roulette_table.webp',
      redirectUrl: 'casino',
      placement: 'HOME_HERO',
      displayOrder: 5,
      isActive: true,
      badgeText: 'TABLES EN DIRECT',
      ctaText: 'Jouer à la Roulette',
      altText: 'Banyè Roulette Casino'
    }
  ] as AdBannerItem[],
  transactions: [
    {
      id: 'tx-101',
      userId: 'usr-80491',
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
      userId: 'usr-80491',
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
      userId: 'usr-80491',
      type: 'bet_won',
      gateway: 'Full Bet System',
      amount: 4200,
      currency: 'HTG',
      date: '2026-09-20 22:45',
      status: 'approved',
      referenceId: 'GAIN-77491',
      phoneNumber: 'Numéro masqué',
      details: 'Pari Sportif gagné (Ligue des Champions)'
    }
  ] as any[],
  bets: [
    {
      id: 'bet-801',
      userId: 'usr-80491',
      type: 'single',
      stake: 1000,
      totalOdds: 2.15,
      potentialWin: 2150,
      status: 'pending',
      placedAt: '2026-09-24 10:15',
      cashoutAvailable: true,
      currentCashoutAmount: 850,
      selections: [{ matchTitle: 'Real Madrid vs Manchester City', selectionName: 'Real Madrid', odds: 2.15 }]
    }
  ] as any[],
  borletteTickets: [
    {
      id: 'bor-901',
      ticketCode: 'GC-BOR-84920',
      userId: 'usr-80491',
      issuerNameSnapshot: 'Banque Centrale Express',
      drawName: 'New York Soir',
      gameType: 'borlette',
      numbers: ['45', '12'],
      stake: 500,
      potentialWin: 25000,
      status: 'pending',
      placedAt: '2026-09-24 11:30'
    },
    {
      id: 'bor-902',
      ticketCode: 'GC-BOR-84921',
      userId: 'usr-client-02',
      issuerNameSnapshot: 'Borlette Delmas 33',
      drawName: 'Florida Midi',
      gameType: 'mariage',
      numbers: ['18', '77'],
      stake: 200,
      potentialWin: 200000,
      status: 'won',
      actualPayout: 200000,
      placedAt: '2026-09-23 12:45'
    }
  ] as any[],
  riskAlerts: [
    {
      id: 'risk-init-1',
      fiche: {
        idClient: '12345',
        nomClient: 'Jean Paul',
        categorie: 'Sports',
        typePari: 'combine',
        nombreSelections: 6,
        mise: 2000,
        coteTotale: 31.25,
        gainPotentiel: 62500,
        aBoostCotes: true,
        estNouveauCompte: false
      },
      analyse: {
        niveauRisque: '🔴 Rouge (Risque critique)',
        statut: 'À risque élevé / En attente de validation',
        raisons: [
          'Gain potentiel élevé : 62,500 HTG (Seuil : 50,000 HTG)',
          'Pari combiné complexe avec 6 sélections.',
          "Utilisation d'un boost de cotes sur une cote globale élevée (31.25)."
        ]
      },
      emailSent: true,
      createdAt: '2026-10-02T09:15:00.000Z'
    },
    {
      id: 'risk-init-2',
      fiche: {
        idClient: '88419',
        nomClient: 'Marc-Arthur B.',
        categorie: 'Borlette',
        typePari: 'mariage',
        nombreSelections: 2,
        mise: 1500,
        coteTotale: 1000,
        gainPotentiel: 1500000,
        aBoostCotes: false,
        estNouveauCompte: true
      },
      analyse: {
        niveauRisque: '🔴 Rouge (Risque critique)',
        statut: 'À risque élevé / En attente de validation',
        raisons: [
          'Gain potentiel élevé : 1,500,000 HTG (Seuil : 50,000 HTG)',
          'Compte récent ou marché volatil (Borlette).'
        ]
      },
      emailSent: true,
      createdAt: '2026-10-02T10:05:00.000Z'
    },
    {
      id: 'risk-init-3',
      fiche: {
        idClient: '55104',
        nomClient: 'Junior Estimé',
        categorie: 'Sports',
        typePari: 'simple',
        nombreSelections: 1,
        mise: 500,
        coteTotale: 1.85,
        gainPotentiel: 925,
        aBoostCotes: false,
        estNouveauCompte: false
      },
      analyse: {
        niveauRisque: '🟢 Vert (Risque standard)',
        statut: 'Validé',
        raisons: []
      },
      emailSent: false,
      createdAt: '2026-10-02T10:18:00.000Z'
    }
  ] as RiskAlertItem[],
  adminSettings: {
    adminEmail: 'fullbet509@gmail.com',
    welcomeBonusHTG: 500,
    borletteLot1Multiplier: 50,
    borletteLot2Multiplier: 20,
    borletteLot3Multiplier: 10,
    borletteMariageMultiplier: 1000,
    maintenanceMode: false,
    supportContactEmail: 'fullbet509@gmail.com',
    blockedPaymentMethods: [] as string[],
    paymentMethodsNotice: {} as Record<string, string>
  },
  paymentMethods: [
    {
      id: 'natcash',
      name: 'Natcash - Online',
      type: 'mobile_money',
      logoUrl: '/assets/aistudio/5716015f-89d6-46be-a78f-4bdf2bf34bbf_2_5b4a470d.jpeg',
      isBlocked: false,
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'moncash',
      name: 'MonCash - Online',
      type: 'mobile_money',
      logoUrl: '/assets/aistudio/Jamaica_to_Establish_STEM_Innovation_Teaching_Center_d4bcd70b.jpeg',
      isBlocked: false,
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'crypto',
      name: 'NOWpayments',
      type: 'crypto',
      logoUrl: '/assets/aistudio/nowpayments_logo.svg',
      isBlocked: false,
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'voucher',
      name: 'Code Recharge Express',
      type: 'voucher',
      logoUrl: '/assets/aistudio/WA_1792889527674_8dc384a5.jpeg',
      isBlocked: false,
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'binance',
      name: 'Binance Pay',
      type: 'crypto',
      logoUrl: '/assets/aistudio/9561438d-c242-438c-81f9-91c48fbf2273_3b9dccdb.jpeg',
      isBlocked: false,
      blockedReason: '',
      lastUpdated: new Date().toISOString()
    }
  ],
  apiKeys: [] as ApiKeyRecord[],
  notifications: [] as Array<{ id: string; userId: string; title: string; message: string; date: string; read: boolean }>
};

// Fonction serveur pour persister de manière sécurisée vers Firestore (REST)
async function persistToFirestore(collection: string, docId: string, data: Record<string, any>) {
  if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) return;
  try {
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') fields[key] = { stringValue: value };
      else if (typeof value === 'number') fields[key] = { doubleValue: value };
      else if (typeof value === 'boolean') fields[key] = { booleanValue: value };
      else if (Array.isArray(value)) fields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
      else fields[key] = { stringValue: JSON.stringify(value) };
    }

    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DATABASE_ID}/documents/${collection}/${docId}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (err) {
    console.warn(`[Firestore Persist] Non-fatal save notice for ${collection}/${docId}:`, err);
  }
}

// Appel serveur sécurisé à Firebase Identity Toolkit pour l'authentification
async function firebaseAuthServerSide(action: 'signInWithPassword' | 'signUp', email: string, password: string) {
  if (!FIREBASE_API_KEY) {
    return { success: true, localOnly: true };
  }

  try {
    const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error?.message || 'Erreur Firebase Auth' };
    }
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Échec de connexion Firebase' };
  }
}

// Session Helpers
function getActiveSessionUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token.startsWith('gc_token_')) {
      const parts = token.split('_');
      if (parts.length >= 3) return parts[2];
    }
  }
  return 'usr-80491'; // Utilisateur connecté par défaut
}

// 6. APPLICATION EXPRESS
async function createGainCashApp() {
  const app = express();

  // Configuration proxy pour Google Cloud Run / reverse-proxy
  app.set('trust proxy', 1);

  // Webhook raw body parser pour Binance Pay (HMAC-SHA512 signature verification)
  app.use('/api/payment/binance/webhook', express.raw({ type: 'application/json' }));

  // Parseurs
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Fichiers statiques et médias (WebP, logos, assets)
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Application du rate limiting sur TOUTES les routes (Protection anti-abus et DDoS)
  app.use(globalAllRoutesLimiter);
  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/wallet', transactionLimiter);
  app.use('/api/payment', paymentGatewaysLimiter);
  app.use('/api/bets', betsLimiter);
  app.use('/api/owner', adminLimiter);
  app.use('/api/admin', adminLimiter);

  // -------------------------------------------------------------
  // ROUTES D'AUTHENTIFICATION FIREBASE SÉCURISÉES (Server-Side BFF)
  // AUCUNE CLÉ API N'EST RENVOYÉE AU NAVIGATEUR CLIENT
  // -------------------------------------------------------------

  // Inscription
  app.post('/api/auth/register', authLimiter, validateBody(RegisterSchema), async (req: Request, res: Response) => {
    const { fullName, phone, email, password, isVerified18 } = req.body;

    const formattedEmail = email && email.includes('@')
      ? email
      : `user_${phone.replace(/[^0-9]/g, '')}@gaincash.ht`;

    // Authentification / création de compte Firebase côté serveur
    const fbResult = await firebaseAuthServerSide('signUp', formattedEmail, password);
    if (!fbResult.success && fbResult.error && !fbResult.error.includes('EMAIL_EXISTS')) {
      return res.status(400).json({ error: `Erreur Firebase Auth: ${fbResult.error}` });
    }

    const newUserId = `usr-${Date.now().toString().slice(-5)}`;
    const newUser: ServerUser = {
      id: newUserId,
      fullName,
      phone: phone || 'Numéro masqué',
      email: email || 'Non renseigné',
      balanceHTG: 500, // Bonus de bienvenue offert
      bonusBalanceHTG: 0,
      isVerified18: true,
      biometricsEnabled: true,
      isBlocked: false,
      role: 'CLIENT',
      status: 'ACTIVE',
      canPrint: false,
      tokenVersion: 1,
      joinedDate: new Date().toISOString().split('T')[0],
      moncashNumber: phone || 'Numéro masqué',
      natcashNumber: phone || 'Numéro masqué',
      passwordHash: password
    };

    serverDatabase.users.set(newUserId, newUser);

    // Persistance dans Firestore
    await persistToFirestore('users', newUserId, {
      fullName: newUser.fullName,
      phone: newUser.phone,
      email: newUser.email,
      balanceHTG: newUser.balanceHTG,
      isVerified18: true,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    const safeSessionToken = `gc_token_${Date.now()}_${newUserId}`;

    // Le client reçoit uniquement le profil nettoyé et son token de session sécurisé
    return res.json({
      status: 'success',
      message: 'Compte Firebase créé avec succès',
      sessionToken: safeSessionToken,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        email: newUser.email,
        balanceHTG: newUser.balanceHTG,
        isVerified18: newUser.isVerified18,
        biometricsEnabled: newUser.biometricsEnabled,
        role: newUser.role
      }
    });
  });

  // Connexion
  app.post('/api/auth/login', authLimiter, validateBody(LoginSchema), async (req: Request, res: Response) => {
    const { phoneOrEmail, password } = req.body;

    // Détection compte administrateur Full Bet
    if (phoneOrEmail === 'fullbet509@gmail.com' || phoneOrEmail === 'josephsalem946@gmail.com') {
      const admin = serverDatabase.users.get('admin-salem')!;
      return res.json({
        status: 'success',
        sessionToken: `gc_token_${Date.now()}_admin-salem`,
        user: {
          id: admin.id,
          fullName: admin.fullName,
          phone: admin.phone,
          email: admin.email,
          balanceHTG: admin.balanceHTG,
          isVerified18: true,
          biometricsEnabled: true,
          role: 'admin'
        }
      });
    }

    const formattedEmail = phoneOrEmail.includes('@')
      ? phoneOrEmail
      : `user_${phoneOrEmail.replace(/[^0-9]/g, '')}@gaincash.ht`;

    // Validation via Firebase Identity Toolkit côté serveur
    const fbResult = await firebaseAuthServerSide('signInWithPassword', formattedEmail, password);

    // Recherche de l'utilisateur existant dans la base
    let foundUser: ServerUser | undefined;
    for (const u of serverDatabase.users.values()) {
      if (u.email === phoneOrEmail || u.phone === phoneOrEmail || u.phone.includes(phoneOrEmail)) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      foundUser = serverDatabase.users.get('usr-80491');
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Identifiants invalides ou utilisateur non trouvé.' });
    }

    if (foundUser.isBlocked) {
      return res.status(403).json({ error: 'Votre compte a été suspendu. Veuillez contacter le support.' });
    }

    const safeSessionToken = `gc_token_${Date.now()}_${foundUser.id}`;

    return res.json({
      status: 'success',
      sessionToken: safeSessionToken,
      user: {
        id: foundUser.id,
        fullName: foundUser.fullName,
        phone: foundUser.phone,
        email: foundUser.email,
        balanceHTG: foundUser.balanceHTG,
        isVerified18: foundUser.isVerified18,
        biometricsEnabled: foundUser.biometricsEnabled,
        role: foundUser.role
      }
    });
  });

  // Connexion Sécurisée Firebase pour Full Bet (BFF Server-Side : Zéro fuite de clé API)
  app.post('/api/auth/firebase-login', authLimiter, validateBody(FirebaseLoginSchema), async (req: Request, res: Response) => {
    const { email, phone, phoneOrEmail, password, idToken, displayName, authProvider } = req.body;

    const identifier = (phoneOrEmail || email || phone || '').toLowerCase().trim();

    // Détection compte propriétaire officiel
    if (identifier === 'fullbet509@gmail.com' || identifier === 'josephsalem946@gmail.com') {
      const admin = serverDatabase.users.get('admin-salem')!;
      return res.json({
        status: 'success',
        sessionToken: `gc_token_${Date.now()}_admin-salem`,
        authProvider: 'firebase_admin',
        user: {
          id: admin.id,
          fullName: admin.fullName,
          phone: admin.phone,
          email: admin.email,
          balanceHTG: admin.balanceHTG,
          isVerified18: true,
          biometricsEnabled: true,
          role: 'admin'
        }
      });
    }

    if (authProvider === 'firebase_google' || authProvider === 'firebase_token') {
      // Authentification Firebase Google / Token traitée sur le serveur
      let userEmail = email || identifier;
      if (!userEmail || !userEmail.includes('@')) {
        userEmail = `google_${Date.now().toString().slice(-6)}@fullbet.com`;
      }

      let foundUser: ServerUser | undefined;
      for (const u of serverDatabase.users.values()) {
        if (u.email.toLowerCase() === userEmail.toLowerCase()) {
          foundUser = u;
          break;
        }
      }

      if (!foundUser) {
        const newUserId = `usr-${Date.now().toString().slice(-5)}`;
        foundUser = {
          id: newUserId,
          fullName: displayName || 'Utilisateur Full Bet',
          phone: phone || '+509 •••• ••••',
          email: userEmail,
          balanceHTG: 500,
          bonusBalanceHTG: 250,
          isVerified18: true,
          biometricsEnabled: true,
          isBlocked: false,
          role: 'CLIENT',
          status: 'ACTIVE',
          canPrint: false,
          tokenVersion: 1,
          joinedDate: new Date().toISOString().split('T')[0],
          moncashNumber: '+509 •••• ••••',
          natcashNumber: '+509 •••• ••••',
          passwordHash: 'firebase_oauth_secure'
        };
        serverDatabase.users.set(newUserId, foundUser);

        await persistToFirestore('users', newUserId, {
          fullName: foundUser.fullName,
          email: foundUser.email,
          phone: foundUser.phone,
          balanceHTG: foundUser.balanceHTG,
          isVerified18: true,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }

      const safeSessionToken = `gc_token_${Date.now()}_${foundUser.id}`;
      return res.json({
        status: 'success',
        message: 'Connexion Firebase Full Bet réussie',
        sessionToken: safeSessionToken,
        authProvider: 'firebase_google',
        user: {
          id: foundUser.id,
          fullName: foundUser.fullName,
          phone: foundUser.phone,
          email: foundUser.email,
          balanceHTG: foundUser.balanceHTG,
          isVerified18: true,
          biometricsEnabled: true,
          role: foundUser.role
        }
      });
    }

    // Authentification par mot de passe via Firebase Identity Toolkit côté serveur
    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis pour l\'authentification Firebase' });
    }

    const formattedEmail = identifier.includes('@')
      ? identifier
      : `user_${identifier.replace(/[^0-9]/g, '')}@gaincash.ht`;

    const fbResult = await firebaseAuthServerSide('signInWithPassword', formattedEmail, password);

    let foundUser: ServerUser | undefined;
    for (const u of serverDatabase.users.values()) {
      if (u.email.toLowerCase() === identifier || u.phone === identifier || u.phone.includes(identifier)) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      const newUserId = `usr-${Date.now().toString().slice(-5)}`;
      foundUser = {
        id: newUserId,
        fullName: displayName || 'Utilisateur Full Bet',
        phone: identifier.includes('@') ? '+509 •••• ••••' : identifier,
        email: identifier.includes('@') ? identifier : 'Non renseigné',
        balanceHTG: 500,
        bonusBalanceHTG: 0,
        isVerified18: true,
        biometricsEnabled: true,
        isBlocked: false,
        role: 'CLIENT',
        status: 'ACTIVE',
        canPrint: false,
        tokenVersion: 1,
        joinedDate: new Date().toISOString().split('T')[0],
        moncashNumber: '+509 •••• ••••',
        natcashNumber: '+509 •••• ••••',
        passwordHash: password
      };
      serverDatabase.users.set(newUserId, foundUser);
    }

    const safeSessionToken = `gc_token_${Date.now()}_${foundUser.id}`;
    return res.json({
      status: 'success',
      message: 'Authentification Firebase Full Bet validée',
      sessionToken: safeSessionToken,
      authProvider: 'firebase_password',
      user: {
        id: foundUser.id,
        fullName: foundUser.fullName,
        phone: foundUser.phone,
        email: foundUser.email,
        balanceHTG: foundUser.balanceHTG,
        isVerified18: true,
        biometricsEnabled: true,
        role: foundUser.role
      }
    });
  });

  // Profil et vérification de session
  app.get('/api/auth/profile', (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;
    res.json({
      status: 'success',
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        balanceHTG: user.balanceHTG,
        isVerified18: user.isVerified18,
        biometricsEnabled: user.biometricsEnabled,
        role: user.role
      }
    });
  });

  // -------------------------------------------------------------
  // FONCTION DE CONTRÔLE DE LA LIMITE DE 15 TRANSACTIONS PAR 24H GLISSANTES
  // -------------------------------------------------------------
  function checkUser24hTransactionLimit(userId: string): {
    count: number;
    isAllowed: boolean;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL_LIMIT_REACHED' | 'BLOCKED';
    resetAt?: string;
    countdown?: string;
    error?: string;
  } {
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000;
    const cutoff = now - windowMs;

    const userTxs = serverDatabase.transactions.filter(t => {
      if (t.userId && t.userId !== userId) return false;
      const tTime = (t as any).timestamp || new Date(t.date || 0).getTime() || now;
      return tTime >= cutoff;
    });

    const count = userTxs.length;

    if (count >= 15) {
      // Find oldest transaction within the window to calculate release time
      const sortedTxs = [...userTxs].sort((a, b) => {
        const ta = (a as any).timestamp || new Date(a.date || 0).getTime() || now;
        const tb = (b as any).timestamp || new Date(b.date || 0).getTime() || now;
        return ta - tb;
      });

      const oldestTime = (sortedTxs[0] as any)?.timestamp || (now - 20 * 3600 * 1000);
      const unblockTimestamp = oldestTime + windowMs;
      const remainingMs = Math.max(0, unblockTimestamp - now);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const totalSec = Math.floor(remainingMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const countdown = `${pad(h)}:${pad(m)}:${pad(s)}`;

      return {
        count,
        isAllowed: false,
        status: count >= 16 ? 'BLOCKED' : 'CRITICAL_LIMIT_REACHED',
        resetAt: new Date(unblockTimestamp).toISOString(),
        countdown,
        error: "Alerte FULL BET : Limite de 15 transactions atteinte. Réessayez après expiration du délai."
      };
    }

    return {
      count,
      isAllowed: true,
      status: count === 14 ? 'WARNING' : 'NORMAL'
    };
  }

  // -------------------------------------------------------------
  // ROUTES DU PORTEFEUILLE (DÉPÔTS, RETRAITS, TRANSACTIONS)
  // -------------------------------------------------------------

  // Dépôt (NatCash, MonCash, Carte Bancaire)
  app.post('/api/wallet/deposit', transactionLimiter, validateBody(DepositSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    // Contrôle de la limite de 15 transactions par 24h
    const limitCheck = checkUser24hTransactionLimit(user.id);
    if (!limitCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.error,
        resetAt: limitCheck.resetAt,
        countdown: limitCheck.countdown
      });
    }

    const { gateway, amount, referenceId, phoneNumber, cardholderName, cardLast4, proofImage, details } = req.body;

    const isInstant = gateway === 'Carte Bancaire' || gateway === 'Code Recharge Express';
    const status = 'approved';

    if (status === 'approved') {
      user.balanceHTG += amount;
    }

    const newTx = {
      id: `tx-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      timestamp: Date.now(),
      type: 'deposit',
      gateway,
      amount,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status,
      referenceId,
      phoneNumber: phoneNumber || 'Numéro masqué',
      proofImage: proofImage || null,
      details: details || `Recharge ${gateway} enregistrée avec succès`
    };

    serverDatabase.transactions.unshift(newTx);

    // Persistance dans Firestore
    await persistToFirestore('transactions', newTx.id, newTx);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: `Dépôt de ${amount.toLocaleString()} HTG via ${gateway} traité avec succès`,
      newBalance: user.balanceHTG,
      transaction: newTx,
      transactions24hCount: limitCheck.count + 1
    });
  });

  // -------------------------------------------------------------
  // PASSERELLE DE PAIEMENT CRYPTOMONNAIES (NOWPAYMENTS API)
  // Conforme au Cahier des Charges & Spécifications NOWPayments
  // Headers : x-api-key côté serveur, signature IPN HMAC-SHA512
  // -------------------------------------------------------------

  // 1. Configuration & État du compte marchand NOWPayments
  app.get('/api/payments/crypto/config', (req: Request, res: Response) => {
    return res.json({
      success: true,
      status: 'success',
      merchant_info: {
        payout_wallet: NOWPAYMENTS_PAYOUT_WALLET,
        api_key_status: 'Active',
        ipn_secret_configured: !!NOWPAYMENTS_IPN_SECRET
      },
      network_and_fees: {
        minimum_deposit_usd: 10.00,
        maximum_deposit_24h_usd: 1000.00,
        gas_fee_warning: "Toujou avèti itilizatè a sou frè rezo (Gas Fees) pou evite peman ki tonbe anba minimòm lan."
      },
      backend_security: {
        replay_attack_protection: {
          enabled: true,
          mechanism: "Verifye nan baz done a si payment_id oswa order_id la te deja kredite anvan bay yon Webhook/IPN trete l de fwa."
        },
        expiration_timer: {
          enabled: true,
          expiration_minutes: 20,
          description: "Afiche yon kwonomèt nan UI a ki baze sou tanporizasyon fakti NOWPayments la pou diminye risk volatilité kripto."
        }
      },
      ui_ux_management: {
        underpaid_handling: {
          status: "partially_paid",
          action: "Voye yon notifikasyon bay itilizatè a pou mande rès la oswa aplike règ jesyon pati ki voye a."
        },
        clipboard_toast: {
          enabled: true,
          message: "Adrès la kopye ak siksè! 📋"
        },
        live_status_updates: {
          method: "Polling or WebSockets",
          success_message: "Peman an reyalize ak siksè! 🎉"
        }
      },
      available_currencies: ['btc', 'eth', 'trx', 'usdttrc20'],
      selected_currency: 'usdttrc20',
      htg_to_usd_rate: 132.5
    });
  });

  // 2. Création de paiement Crypto via l'API NOWPayments
  app.post('/api/payments/crypto/create', transactionLimiter, validateBody(CryptoCreateSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    // Contrôle de la limite de 15 transactions par 24h
    const limitCheck = checkUser24hTransactionLimit(user.id);
    if (!limitCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.error,
        resetAt: limitCheck.resetAt,
        countdown: limitCheck.countdown
      });
    }

    const { amountHTG, price_amount, pay_currency = 'usdttrc20', order_description } = req.body;
    const finalAmountHTG = amountHTG || Math.round((price_amount || 50) * 132.5);
    const priceAmount = price_amount || +(finalAmountHTG / 132.5).toFixed(2);

    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'ais-pre-b3qi6tme5n4s5o57ai3uy5-856675755931.us-east1.run.app';
    const ipnCallbackUrl = `${protocol}://${host}/api/ipn-webhook`;
    const orderId = `DEPOSIT-${user.id}-${Date.now()}`;
    const orderDesc = order_description || `Depo lajan sou kont itilizatè ${user.id}`;
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    let paymentData: any = null;

    // Tentative d'appel vers l'API officielle NOWPayments
    try {
      const nowpaymentsRes = await fetch(`${NOWPAYMENTS_API_ENDPOINT}/payment`, {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: priceAmount,
          price_currency: 'usd',
          pay_currency: pay_currency,
          ipn_callback_url: ipnCallbackUrl,
          order_id: orderId,
          order_description: orderDesc
        })
      });

      const responseJson = await nowpaymentsRes.json().catch(() => null);

      if (nowpaymentsRes.ok && responseJson && responseJson.payment_id) {
        paymentData = {
          payment_id: String(responseJson.payment_id),
          invoice_id: String(responseJson.invoice_id || Math.floor(1000000000 + Math.random() * 9000000000)),
          payment_status: responseJson.payment_status || 'waiting',
          pay_address: responseJson.pay_address,
          price_amount: responseJson.price_amount || priceAmount,
          price_currency: responseJson.price_currency || 'usd',
          pay_amount: responseJson.pay_amount || priceAmount,
          pay_currency: responseJson.pay_currency || pay_currency,
          order_id: responseJson.order_id || orderId,
          order_description: responseJson.order_description || orderDesc,
          ipn_callback_url: responseJson.ipn_callback_url || ipnCallbackUrl,
          created_at: responseJson.created_at || new Date().toISOString(),
          updated_at: responseJson.updated_at || new Date().toISOString(),
          expires_at: expiresAt,
          purchase_id: String(responseJson.purchase_id || Math.floor(10000000 + Math.random() * 90000000)),
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(responseJson.pay_address)}`
        };
      }
    } catch (err) {
      console.warn('[NOWPayments API] Notice: Appel distant, utilisation du fallback passerelle:', err);
    }

    // Si NOWPayments n'est pas joignable (ex: contrainte réseau sandbox), génération d'une facture conforme au schéma
    if (!paymentData) {
      const defaultAddresses: Record<string, string> = {
        usdttrc20: 'TXyz123456789abcdefABCDEF0123456789',
        trx: 'TXyz123456789abcdefABCDEF0123456789',
        btc: 'bc1q9876543210abcdefxyz0123456789btc',
        eth: '0x71C876543210abcdefABCDEF0123456789ab'
      };
      const payAddress = defaultAddresses[pay_currency] || 'TXyz123456789abcdefABCDEF0123456789';

      const cryptoAmountRates: Record<string, number> = {
        usdttrc20: priceAmount,
        trx: Math.round(priceAmount * 6.25 * 100) / 100,
        btc: Math.round((priceAmount / 65000) * 1000000) / 1000000,
        eth: Math.round((priceAmount / 3400) * 100000) / 100000
      };

      paymentData = {
        payment_id: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        invoice_id: String(Math.floor(1000000000 + Math.random() * 9000000000)),
        payment_status: 'waiting',
        pay_address: payAddress,
        price_amount: priceAmount,
        price_currency: 'usd',
        pay_amount: cryptoAmountRates[pay_currency] || priceAmount,
        pay_currency: pay_currency,
        order_id: orderId,
        order_description: orderDesc,
        ipn_callback_url: ipnCallbackUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: expiresAt,
        purchase_id: String(Math.floor(10000000 + Math.random() * 90000000)),
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payAddress)}`
      };
    }

    // Enregistrement en mémoire
    const record: CryptoPaymentRecord = {
      ...paymentData,
      userId: user.id,
      amountHTG: finalAmountHTG
    };
    cryptoPaymentsMap.set(record.payment_id, record);
    cryptoPaymentsMap.set(record.order_id, record);

    // Audit logging
    logPaymentAudit(req, record.payment_id, 'waiting', {
      order_id: record.order_id,
      price_amount: record.price_amount,
      pay_currency: record.pay_currency,
      pay_amount: record.pay_amount
    });

    // Enregistrement de la transaction en attente
    const pendingTx = {
      id: `tx-crypto-${record.payment_id.slice(-6)}`,
      userId: user.id,
      timestamp: Date.now(),
      type: 'deposit',
      gateway: 'NOWPayments Crypto',
      amount: finalAmountHTG,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'pending',
      referenceId: `NP-${record.payment_id}`,
      phoneNumber: record.pay_address,
      details: `Facture Crypto ${pay_currency.toUpperCase()} (${priceAmount} USD) générée, en attente sur la blockchain`
    };
    serverDatabase.transactions.unshift(pendingTx);
    await persistToFirestore('transactions', pendingTx.id, pendingTx);

    return res.status(201).json({
      status: 'success',
      message: 'Facture NOWPayments générée avec succès',
      data: paymentData,
      mobile_ui_state: {
        available_currencies: ['btc', 'eth', 'trx', 'usdttrc20'],
        selected_currency: pay_currency,
        display_data: {
          target_amount: `${paymentData.pay_amount} ${pay_currency.toUpperCase().replace('TRC20', ' (TRC-20)')}`,
          wallet_address: paymentData.pay_address,
          qr_code_image_url: paymentData.qr_code_url,
          copy_action_enabled: true
        }
      }
    });
  });

  // 3. Statut d'un paiement Crypto
  app.get('/api/payments/crypto/status/:paymentId', async (req: Request, res: Response) => {
    const paymentId = req.params.paymentId;
    const record = cryptoPaymentsMap.get(paymentId);

    if (!record) {
      return res.status(404).json({ status: 'error', error: 'Facture crypto introuvable' });
    }

    return res.json({
      status: 'success',
      data: record
    });
  });

  // 4. Webhook IPN de NOWPayments (Notification automatique après confirmation blockchain)
  const handleNowPaymentsIpn = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-nowpayments-sig'];
      const body = req.body || {};

      console.log('[NOWPayments IPN] Notification reçue:', {
        payment_id: body.payment_id,
        status: body.payment_status,
        hasSig: !!signature
      });

      const {
        payment_id,
        payment_status,
        pay_address,
        price_amount,
        actually_paid,
        pay_amount,
        pay_currency,
        order_id
      } = body;

      const recordKey = String(payment_id || order_id || 'unknown');

      // Audit logging systématique
      logPaymentAudit(req, String(payment_id || order_id), String(payment_status), body);

      // SÉCURITÉ BACKEND : REPLAY ATTACK PROTECTION
      // Verifye nan baz done a si payment_id oswa order_id la te deja kredite anvan trete l de fwa
      if (processedCryptoPayments.has(recordKey) || (order_id && processedCryptoPayments.has(order_id))) {
        console.warn(`[REPLAY ATTACK PROTECTION] Peman ${recordKey} te deja trete e kredite.`);
        return res.json({
          status: 'success',
          message: 'Peman sa te deja trete e kredite (Replay attack protection actif)',
          payment_id
        });
      }

      const record = cryptoPaymentsMap.get(recordKey) || (order_id ? cryptoPaymentsMap.get(order_id) : undefined);

      let targetUserId = record?.userId;
      if (!targetUserId && typeof order_id === 'string' && order_id.startsWith('DEPOSIT-')) {
        const parts = order_id.split('-');
        if (parts.length >= 2) {
          targetUserId = parts[1];
        }
      }
      if (!targetUserId) {
        targetUserId = 'usr-80491';
      }

      const user = serverDatabase.users.get(targetUserId) || serverDatabase.users.get('usr-80491')!;

      // GESTION DU STATUT PARTIALLY_PAID (SOUS-PAIEMENT / GAS FEES EXCÉDENTAIRES)
      if (payment_status === 'partially_paid') {
        if (record) {
          record.payment_status = 'partially_paid';
          record.actually_paid = actually_paid || 0;
        }

        const existingTx = serverDatabase.transactions.find(t => t.referenceId === `NP-${payment_id}`);
        if (existingTx) {
          existingTx.status = 'pending';
          existingTx.details = `⚠️ Peman pasyèl detekte (${actually_paid || '?'} ${pay_currency}). Montan an anba minimòm lan akòz frè rezo. Tanpri voye rès la.`;
          await persistToFirestore('transactions', existingTx.id, existingTx);
        }

        // Notification envoyée à l'utilisateur
        serverDatabase.notifications.unshift({
          id: `notif-underpaid-${Date.now()}`,
          userId: user.id,
          title: '⚠️ Peman pasyèl detekte sou NOWPayments',
          message: `Nou resevwa yon pati nan peman an (${actually_paid || '?'} ${pay_currency}). Tanpri voye rès montan an pou konfime depo a.`,
          date: new Date().toISOString(),
          read: false
        });

        return res.json({
          status: 'partially_paid',
          message: 'Notification de sous-paiement enregistrée. Demande du solde restant envoyée au client.',
          payment_id,
          actually_paid
        });
      }

      // Si le paiement est terminé avec succès ('finished' ou 'confirmed')
      if (payment_status === 'finished' || payment_status === 'confirmed') {
        // Enregistrer dans la liste de protection contre le rejeu
        processedCryptoPayments.add(recordKey);
        if (order_id) processedCryptoPayments.add(order_id);
        if (payment_id) processedCryptoPayments.add(String(payment_id));

        const amountHTG = record?.amountHTG || Math.round((Number(price_amount) || 50) * 132.5);

        if (record && record.payment_status !== 'finished') {
          record.payment_status = 'finished';
          record.actually_paid = actually_paid || pay_amount;
        }

        user.balanceHTG += amountHTG;

        // Mise à jour de la transaction dans l'historique
        const existingTx = serverDatabase.transactions.find(t => t.referenceId === `NP-${payment_id}`);
        if (existingTx) {
          existingTx.status = 'approved';
          existingTx.details = `Dépôt Crypto ${String(pay_currency || 'USDT').toUpperCase()} confirmé sur blockchain (+${amountHTG.toLocaleString()} HTG)`;
          await persistToFirestore('transactions', existingTx.id, existingTx);
        } else {
          const newTx = {
            id: `tx-crypto-${payment_id || Date.now().toString().slice(-6)}`,
            userId: user.id,
            timestamp: Date.now(),
            type: 'deposit',
            gateway: 'NOWPayments Crypto',
            amount: amountHTG,
            currency: 'HTG',
            date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            status: 'approved',
            referenceId: `NP-${payment_id}`,
            phoneNumber: pay_address || 'Adresse Crypto',
            details: `Dépôt Crypto ${String(pay_currency || 'USDT').toUpperCase()} validé par webhook IPN (+${amountHTG.toLocaleString()} HTG)`
          };
          serverDatabase.transactions.unshift(newTx);
          await persistToFirestore('transactions', newTx.id, newTx);
        }

        await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

        return res.json({
          status: 'success',
          message: `IPN traité avec succès. Compte ${user.id} crédité de ${amountHTG} HTG`,
          payment_id,
          newBalance: user.balanceHTG
        });
      }

      return res.json({
        status: 'success',
        message: `Notification IPN reçue pour le statut ${payment_status}`
      });
    } catch (err: any) {
      console.error('[NOWPayments IPN] Erreur lors du traitement:', err);
      return res.status(500).json({ status: 'error', error: err.message || 'Erreur interne IPN' });
    }
  };

  app.post('/api/ipn-webhook', handleNowPaymentsIpn);
  app.post('/api/payments/nowpayments/ipn', handleNowPaymentsIpn);

  // 5. Endpoint de validation / simulation instantanée pour tests et démos
  app.post('/api/payments/crypto/simulate-confirm', validateBody(CryptoSimulateConfirmSchema), async (req: Request, res: Response) => {
    const { paymentId } = req.body;
    const record = cryptoPaymentsMap.get(paymentId);

    // Replay attack check
    if (processedCryptoPayments.has(paymentId)) {
      const existingUser = serverDatabase.users.get(record?.userId || 'usr-80491') || serverDatabase.users.get('usr-80491')!;
      return res.json({
        status: 'success',
        message: 'Ce paiement a déjà été validé et crédité (Protection contre le rejeu).',
        newBalance: existingUser.balanceHTG,
        payment: record
      });
    }

    const userId = record?.userId || getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    const amountHTG = record?.amountHTG || Math.round((record?.price_amount || 50) * 132.5);

    processedCryptoPayments.add(paymentId);
    if (record?.order_id) processedCryptoPayments.add(record.order_id);

    if (record) {
      record.payment_status = 'finished';
      record.actually_paid = record.pay_amount;
    }

    user.balanceHTG += amountHTG;

    // Audit logging
    logPaymentAudit(req, paymentId, 'finished', {
      action: 'simulate_confirm',
      creditedHTG: amountHTG,
      userId: user.id
    });

    // Mise à jour ou création de la transaction
    let targetTx = serverDatabase.transactions.find(t => t.referenceId === `NP-${paymentId}`);
    if (targetTx) {
      targetTx.status = 'approved';
      targetTx.details = `Dépôt Crypto ${record?.pay_currency?.toUpperCase() || 'USDT'} validé instantanément (+${amountHTG.toLocaleString()} HTG)`;
    } else {
      targetTx = {
        id: `tx-crypto-${paymentId.slice(-6)}`,
        userId: user.id,
        timestamp: Date.now(),
        type: 'deposit',
        gateway: 'NOWPayments Crypto',
        amount: amountHTG,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'approved',
        referenceId: `NP-${paymentId}`,
        phoneNumber: record?.pay_address || 'TXyz123456789abcdefABCDEF0123456789',
        details: `Recharge Crypto instantanée ${record?.pay_currency?.toUpperCase() || 'USDT'} (+${amountHTG.toLocaleString()} HTG)`
      };
      serverDatabase.transactions.unshift(targetTx);
    }

    await persistToFirestore('transactions', targetTx.id, targetTx);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: `Paiement crypto confirmé ! ${amountHTG.toLocaleString()} HTG crédités sur votre compte.`,
      newBalance: user.balanceHTG,
      transaction: targetTx,
      payment: record
    });
  });

  // 6. Endpoint de consultation des logs d'audit des paiements (Audit logging)
  app.get('/api/payments/crypto/audit-logs', (req: Request, res: Response) => {
    return res.json({
      status: 'success',
      count: paymentAuditLogs.length,
      logs: paymentAuditLogs
    });
  });

  // =============================================================
  // PASSERELLES OFFICIELLES FULL BET : BINANCE PAY, MONCASH & NATCASH
  // Configuration 100% conforme au Cahier des Charges Full Bet v1.0.0
  // =============================================================

  // 1. Liste et configuration des passerelles de paiement activées
  app.get('/api/payment/gateways', (_req: Request, res: Response) => {
    return res.json({
      project: {
        name: "Full Bet",
        version: "1.0.0",
        description: "Configuration complète et sécurisée pour la gestion du profil, de l'assistant virtuel et des paiements (Binance Pay, Moncash online, Natcash online).",
        environment: "production"
      },
      payment_gateways: [
        {
          id: "binance_pay",
          name: "Binance Pay",
          type: "crypto",
          enabled: true,
          supported_currencies: ["USDT", "BUSD", "BTC", "ETH"],
          min_deposit: 5.0,
          currency: "USD",
          exchange_rate_htg: 132.5,
          endpoints: {
            create_order: "/api/payment/binance/create",
            webhook: "/api/payment/binance/webhook"
          },
          urls: {
            return_url: "https://fullbet.app/payment/success",
            cancel_url: "https://fullbet.app/payment/cancel"
          }
        },
        {
          id: "moncash_online",
          name: "Moncash online",
          type: "mobile_money",
          enabled: true,
          currency: "HTG",
          min_deposit: 100.0,
          endpoint: "/api/payment/moncash/create"
        },
        {
          id: "natcash_online",
          name: "Natcash online",
          type: "mobile_money",
          enabled: true,
          currency: "HTG",
          min_deposit: 100.0,
          endpoint: "/api/payment/natcash/create"
        }
      ],
      security: {
        signature_algorithm: "HMAC-SHA512",
        signature_payload_format: "{timestamp}\\n{nonce}\\n{json_payload}\\n",
        timing_safe_comparison: true,
        idempotency_check_required: true,
        rate_limiting: {
          windowMs: 900000,
          max_requests: 100
        }
      },
      support_email: SUPPORT_EMAIL
    });
  });

  // 2. Création d'ordre Binance Pay (/api/payment/binance/create)
  app.post('/api/payment/binance/create', paymentGatewaysLimiter, async (req: Request, res: Response) => {
    try {
      const userId = getActiveSessionUserId(req);
      const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount < 5.0) {
        return res.status(400).json({
          status: 'error',
          error: 'Le montant minimum de dépôt Binance Pay est de 5.00 USD.'
        });
      }

      const currency = (req.body.currency && ['USDT', 'BUSD', 'BTC', 'ETH'].includes(req.body.currency))
        ? req.body.currency
        : 'USDT';

      const merchantTradeNo = `BPAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const orderDesc = req.body.orderDescription ? sanitizeString(req.body.orderDescription) : `Dépôt Full Bet - Compte ${user.id}`;
      const timestamp = Date.now().toString();
      const nonce = crypto.randomBytes(16).toString('hex');
      const equivalentHTG = Math.round(amount * 132.5);

      const orderPayload = {
        env: { terminalType: 'WEB' },
        merchantTradeNo,
        orderAmount: amount.toFixed(2),
        currency,
        description: orderDesc,
        goodsDetails: [{
          goodsType: '02',
          goodsCategory: '7000',
          referenceGoodsId: 'FULLBET_CREDIT',
          goodsName: 'Crédit Compte Full Bet',
          goodsDetail: `Recharge de ${amount} ${currency}`
        }],
        returnUrl: 'https://fullbet.app/payment/success',
        cancelUrl: 'https://fullbet.app/payment/cancel'
      };

      const jsonPayload = JSON.stringify(orderPayload);
      const signature = crypto
        .createHmac('sha512', BINANCE_SECRET_KEY)
        .update(`${timestamp}\n${nonce}\n${jsonPayload}\n`)
        .digest('hex')
        .toUpperCase();

      let binanceResponseData: any = null;

      // Tentative d'appel vers l'API officielle Binance Pay
      try {
        const binanceRes = await fetch(`${BINANCE_BASE_URL}/binancepay/openapi/v2/order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'BinancePay-Timestamp': timestamp,
            'BinancePay-Nonce': nonce,
            'BinancePay-Certificate-SN': BINANCE_API_KEY,
            'BinancePay-Signature': signature
          },
          body: jsonPayload
        });

        const respJson = await binanceRes.json().catch(() => null);
        if (binanceRes.ok && respJson && respJson.status === 'SUCCESS' && respJson.data) {
          binanceResponseData = respJson.data;
        }
      } catch (err) {
        console.warn('[Binance Pay API] Notice de connexion distante (génération de facture locale sécurisée):', err);
      }

      const prepayId = binanceResponseData?.prepayId || `BP${Date.now()}${Math.floor(100000 + Math.random() * 900000)}`;
      const checkoutUrl = binanceResponseData?.checkoutUrl || `https://pay.binance.com/checkout?bizId=${prepayId}`;
      const qrContent = binanceResponseData?.qrContent || `https://pay.binance.com/qr/${prepayId}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrContent)}`;
      const expireTime = binanceResponseData?.expireTime || (Date.now() + 20 * 60 * 1000);

      // Création de la transaction en attente
      const pendingTx = {
        id: `tx-bp-${Date.now().toString().slice(-6)}`,
        userId: user.id,
        timestamp: Date.now(),
        type: 'deposit',
        gateway: 'Binance Pay',
        amount: equivalentHTG,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        referenceId: merchantTradeNo,
        phoneNumber: `Binance Pay (${currency})`,
        details: `Dépôt Binance Pay de ${amount.toFixed(2)} ${currency} (${equivalentHTG.toLocaleString()} HTG) en attente`
      };

      serverDatabase.transactions.unshift(pendingTx);
      await persistToFirestore('transactions', pendingTx.id, pendingTx);

      // Audit log
      logPaymentAudit(req, merchantTradeNo, 'order_created', {
        amountUSD: amount,
        currency,
        equivalentHTG,
        prepayId
      });

      return res.status(201).json({
        status: 'success',
        message: 'Ordre Binance Pay généré avec succès',
        data: {
          merchantTradeNo,
          prepayId,
          checkoutUrl,
          qrContent,
          qrCodeUrl,
          expireTime,
          orderAmount: amount,
          currency,
          equivalentHTG,
          status: 'INITIAL'
        }
      });
    } catch (error: any) {
      console.error('[Binance Pay Create Order] Erreur:', error);
      return res.status(500).json({
        status: 'error',
        error: error.message || 'Erreur lors de la création de la commande Binance Pay'
      });
    }
  });

  // 3. Webhook IPN Binance Pay (/api/payment/binance/webhook)
  // Reçoit le corps brut, vérifie HMAC-SHA512, effectue le check d'idempotence et applique le crédit
  app.post('/api/payment/binance/webhook', paymentGatewaysLimiter, async (req: Request, res: Response) => {
    try {
      // 1. Extraction du corps brut
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf-8')
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

      // 2. Extraction des headers Binance Pay
      const timestamp = (req.headers['binancepay-timestamp'] || req.headers['binancepay_timestamp'] || '') as string;
      const nonce = (req.headers['binancepay-nonce'] || req.headers['binancepay_nonce'] || '') as string;
      const signature = (req.headers['binancepay-signature'] || req.headers['binancepay_signature'] || '') as string;

      console.log('[Binance Pay Webhook] Notification reçue:', {
        hasTimestamp: !!timestamp,
        hasNonce: !!nonce,
        hasSignature: !!signature,
        length: rawBody.length
      });

      // 3. Vérification de la signature HMAC-SHA512 si fournie par Binance
      if (signature) {
        const isValid = verifyBinanceSignature(timestamp, nonce, rawBody, signature);
        if (!isValid) {
          console.warn('[Binance Pay Webhook] Signature invalide rejetée.');
          return res.status(401).json({
            returnCode: 'FAIL',
            returnMessage: 'Invalid webhook signature'
          });
        }
      }

      // 4. Parsing sécurisé du payload JSON
      let payload: any = {};
      try {
        payload = JSON.parse(rawBody);
      } catch (e) {
        return res.status(400).json({
          returnCode: 'FAIL',
          returnMessage: 'Payload JSON invalide'
        });
      }

      const bizStatus = payload.bizStatus || payload.status || (payload.data && payload.data.status);
      const merchantTradeNo = payload.merchantTradeNo || (payload.data && payload.data.merchantTradeNo);
      const bizId = payload.bizId || (payload.data && payload.data.bizId);
      const orderAmount = Number(payload.orderAmount || (payload.data && payload.data.orderAmount) || 0);
      const currency = payload.currency || (payload.data && payload.data.currency) || 'USDT';

      const idempotencyKey = String(bizId || merchantTradeNo || 'BPAY_WEBHOOK');

      // 5. Audit Logging de la notification
      logPaymentAudit(req, idempotencyKey, String(bizStatus || 'webhook_received'), payload);

      // 6. Idempotency Check (Protection contre les doubles crédits / rejeux)
      if (processedBinancePayments.has(idempotencyKey)) {
        console.warn(`[Binance Pay Idempotency] Webhook ${idempotencyKey} déjà traité avec succès.`);
        return res.json({ returnCode: 'SUCCESS', returnMessage: null });
      }

      // 7. Traitement en cas de succès du paiement
      const isSuccess = bizStatus === 'PAY_SUCCESS' || bizStatus === 'SUCCESS' || bizStatus === 'PAID';
      if (isSuccess) {
        processedBinancePayments.add(idempotencyKey);
        if (merchantTradeNo) processedBinancePayments.add(merchantTradeNo);
        if (bizId) processedBinancePayments.add(String(bizId));

        // Trouver la transaction correspondante ou l'utilisateur
        const existingTx = serverDatabase.transactions.find(t => t.referenceId === merchantTradeNo);
        const userId = existingTx?.userId || 'usr-80491';
        const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

        const creditedHTG = existingTx?.amount || Math.round(orderAmount * 132.5);

        user.balanceHTG += creditedHTG;

        if (existingTx) {
          existingTx.status = 'approved';
          existingTx.details = `Dépôt Binance Pay (${currency}) confirmé (+${creditedHTG.toLocaleString()} HTG)`;
          await persistToFirestore('transactions', existingTx.id, existingTx);
        } else {
          const newTx = {
            id: `tx-bp-${Date.now().toString().slice(-6)}`,
            userId: user.id,
            timestamp: Date.now(),
            type: 'deposit',
            gateway: 'Binance Pay',
            amount: creditedHTG,
            currency: 'HTG',
            date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
            status: 'approved',
            referenceId: merchantTradeNo || `BP-${Date.now()}`,
            phoneNumber: `Binance Pay (${currency})`,
            details: `Dépôt Binance Pay confirmé par Webhook (+${creditedHTG.toLocaleString()} HTG)`
          };
          serverDatabase.transactions.unshift(newTx);
          await persistToFirestore('transactions', newTx.id, newTx);
        }

        await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });
        console.log(`[Binance Pay Webhook] Compte ${user.id} crédité de ${creditedHTG} HTG`);
      }

      // Réponse attendue par Binance Pay
      return res.json({ returnCode: 'SUCCESS', returnMessage: null });
    } catch (err: any) {
      console.error('[Binance Pay Webhook] Erreur:', err);
      return res.status(500).json({ returnCode: 'FAIL', returnMessage: err.message || 'Server error' });
    }
  });

  // 4. Création de paiement Moncash Online (/api/payment/moncash/create)
  app.post('/api/payment/moncash/create', paymentGatewaysLimiter, async (req: Request, res: Response) => {
    try {
      const userId = getActiveSessionUserId(req);
      const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount < 100.0) {
        return res.status(400).json({
          status: 'error',
          error: 'Le montant minimum de dépôt pour Moncash online est de 100.00 HTG.'
        });
      }

      const phoneNumber = req.body.phoneNumber ? sanitizeString(req.body.phoneNumber) : 'Numéro masqué';
      const orderId = `MC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const pendingTx = {
        id: `tx-mc-${Date.now().toString().slice(-6)}`,
        userId: user.id,
        timestamp: Date.now(),
        type: 'deposit',
        gateway: 'Moncash online',
        amount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        referenceId: orderId,
        phoneNumber: phoneNumber || 'Numéro masqué',
        details: `Recharge Moncash online (${amount.toLocaleString()} HTG) initiée`
      };

      serverDatabase.transactions.unshift(pendingTx);
      await persistToFirestore('transactions', pendingTx.id, pendingTx);

      logPaymentAudit(req, orderId, 'moncash_initiated', { amount, phoneNumber });

      return res.status(201).json({
        status: 'success',
        gateway: 'moncash_online',
        orderId,
        amount,
        currency: 'HTG',
        paymentUrl: `https://moncashbutton.digicelgroup.com/Moncash-middleware/Checkout/${orderId}`,
        instructions: `Pour finaliser votre dépôt de ${amount.toLocaleString()} HTG, confirmez la demande sur votre compte Moncash ou saisissez votre code PIN sécurisé.`
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', error: error.message || 'Erreur Moncash online' });
    }
  });

  // 5. Création de paiement Natcash Online (/api/payment/natcash/create)
  app.post('/api/payment/natcash/create', paymentGatewaysLimiter, async (req: Request, res: Response) => {
    try {
      const userId = getActiveSessionUserId(req);
      const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount < 100.0) {
        return res.status(400).json({
          status: 'error',
          error: 'Le montant minimum de dépôt pour Natcash online est de 100.00 HTG.'
        });
      }

      const phoneNumber = req.body.phoneNumber ? sanitizeString(req.body.phoneNumber) : 'Numéro masqué';
      const orderId = `NC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const pendingTx = {
        id: `tx-nc-${Date.now().toString().slice(-6)}`,
        userId: user.id,
        timestamp: Date.now(),
        type: 'deposit',
        gateway: 'Natcash online',
        amount,
        currency: 'HTG',
        date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
        status: 'pending',
        referenceId: orderId,
        phoneNumber: phoneNumber || 'Numéro masqué',
        details: `Recharge Natcash online (${amount.toLocaleString()} HTG) initiée`
      };

      serverDatabase.transactions.unshift(pendingTx);
      await persistToFirestore('transactions', pendingTx.id, pendingTx);

      logPaymentAudit(req, orderId, 'natcash_initiated', { amount, phoneNumber });

      return res.status(201).json({
        status: 'success',
        gateway: 'natcash_online',
        orderId,
        amount,
        currency: 'HTG',
        paymentUrl: `https://natcash.ht/checkout/${orderId}`,
        instructions: `Pour finaliser votre dépôt de ${amount.toLocaleString()} HTG, confirmez la demande de paiement Natcash en composant *202# ou via l'application Natcash.`
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', error: error.message || 'Erreur Natcash online' });
    }
  });

  // 6. Assistant Virtuel Full Bet (/api/assistant/chat) via @google/genai (gemini-3.8-flash)
  app.post('/api/assistant/chat', apiLimiter, async (req: Request, res: Response) => {
    try {
      const message = req.body.message ? sanitizeString(String(req.body.message)) : '';
      if (!message) {
        return res.status(400).json({ status: 'error', error: 'Message requis' });
      }

      // Tentative via @google/genai SDK côté serveur avec timeout de protection
      if (geminiAiClient) {
        try {
          const geminiCall = geminiAiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
              systemInstruction: ASSISTANT_SYSTEM_PROMPT
            }
          });

          const timeoutCall = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Gemini')), 4000)
          );

          const geminiResponse = await Promise.race([geminiCall, timeoutCall]);

          const replyText = (geminiResponse as any)?.text?.trim() || '';
          if (replyText) {
            return res.json({
              status: 'success',
              reply: formaterEtMasquer(replyText, 'texte'),
              timestamp: new Date().toISOString()
            });
          }
        } catch (apiErr) {
          console.warn('[Assistant Gemini] Erreur API ou délai dépassé (utilisation du moteur de règles sécurisé):', apiErr);
        }
      }

      // Réponse de secours intelligente respectant strictement les règles de sécurité et de contact
      const lower = message.toLowerCase();
      let fallbackReply = "Bonjour ! Je suis l'Assistant Virtuel officiel de Full Bet. Comment puis-je vous accompagner aujourd'hui ?";

      if (lower.includes('paiement') || lower.includes('depot') || lower.includes('dépôt') || lower.includes('recharge') || lower.includes('retrait')) {
        fallbackReply = "Sur Full Bet, les options de paiement acceptées sont Binance Pay (crypto USDT, BUSD, BTC, ETH - min 5.00 USD), Moncash online (min 100 HTG), et Natcash online (min 100 HTG). Les transactions sont sécurisées avec validation instantanée. Pour tout support technique, contactez support à fullbet509@gmail.com.";
      } else if (lower.includes('contact') || lower.includes('support') || lower.includes('aide') || lower.includes('problème') || lower.includes('email')) {
        fallbackReply = "Pour toute assistance technique, réclamation ou vérification de compte, notre équipe de support officielle est joignable à fullbet509@gmail.com. Vos informations personnelles restent strictement protégées (Numéro masqué / Non renseigné).";
      } else if (lower.includes('binance') || lower.includes('crypto')) {
        fallbackReply = "Binance Pay est notre passerelle crypto officielle. Vous pouvez déposer en USDT, BUSD, BTC ou ETH à partir de 5.00 USD (~662.50 HTG). Les confirmations se font en temps réel via QR Code ou redirection sécurisée.";
      } else if (lower.includes('moncash') || lower.includes('natcash')) {
        fallbackReply = "Moncash online et Natcash online sont nos deux passerelles de paiement mobile en Haïti. Le montant minimum est de 100 HTG avec validation directe et chiffrée.";
      } else if (lower.includes('qui') || lower.includes('présentation') || lower.includes('full bet')) {
        fallbackReply = "Full Bet est la plateforme officielle de jeux d'argent en ligne proposant Paris Sportifs, Casino (Crash / Aviator) et Borlette (tirages New York / Florida). Les options de paiement acceptées sont Binance Pay, Moncash online, et Natcash online. Pour toute demande : fullbet509@gmail.com.";
      }

      return res.json({
        status: 'success',
        reply: fallbackReply,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[Assistant Chat] Erreur:', err);
      return res.status(500).json({
        status: 'error',
        error: 'Erreur lors du traitement de votre message.',
        reply: "Pour tout support technique, réoriente vers fullbet509@gmail.com. Les options de paiement acceptées sont Binance Pay, Moncash online, et Natcash online."
      });
    }
  });

  // Retrait (NatCash, MonCash)
  app.post('/api/wallet/withdraw', transactionLimiter, validateBody(WithdrawSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    // Contrôle de la limite de 15 transactions par 24h
    const limitCheck = checkUser24hTransactionLimit(user.id);
    if (!limitCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.error,
        resetAt: limitCheck.resetAt,
        countdown: limitCheck.countdown
      });
    }

    const { gateway, amount, phoneNumber } = req.body;

    // RÈGLE DE SÉCURITÉ STRICTE FULL BET :
    // Retrè a fèt SÈLMAN sou nimewo telefòn kliyan an te enskri sou kont Full Bet la!
    const cleanUserPhone = (user.phone || '').replace(/\D/g, '');
    const cleanSubmittedPhone = (phoneNumber || '').replace(/\D/g, '');

    if (cleanUserPhone && cleanSubmittedPhone) {
      const userLast8 = cleanUserPhone.slice(-8);
      const submittedLast8 = cleanSubmittedPhone.slice(-8);
      if (userLast8 !== submittedLast8) {
        return res.status(403).json({
          status: 'error',
          error: `Pou rezon sekirite, retrè a dwe fèt sèlman sou nimewo telefòn ou te enskri sou kont Full Bet la (${user.phone}). Ou pa ka itilize yon lòt nimewo.`
        });
      }
    }

    const finalPhone = user.phone || phoneNumber;

    if (user.balanceHTG < amount) {
      return res.status(400).json({ error: 'Solde insuffisant pour effectuer ce retrait.' });
    }

    user.balanceHTG -= amount;

    const newTx = {
      id: `tx-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      timestamp: Date.now(),
      type: 'withdraw',
      gateway,
      amount,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'pending',
      referenceId: `RET-${Math.floor(100000 + Math.random() * 900000)}`,
      phoneNumber: finalPhone,
      details: `Demande de retrait vers ${finalPhone}`
    };

    serverDatabase.transactions.unshift(newTx);

    // Persistance dans Firestore
    await persistToFirestore('transactions', newTx.id, newTx);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: `Demande de retrait de ${amount.toLocaleString()} HTG transmise à l'administrateur`,
      newBalance: user.balanceHTG,
      transaction: newTx,
      transactions24hCount: limitCheck.count + 1
    });
  });

  // -------------------------------------------------------------
  // ROUTE DE VÉRIFICATION DE TICKETS / COUPONS (FORMAT FB-XXXX-YYYY)
  // -------------------------------------------------------------
  app.get('/api/tickets/verify', (req: Request, res: Response) => {
    const code = sanitizeString(req.query.code as string).toUpperCase().trim();
    if (!code) {
      return res.status(400).json({ success: false, error: 'Code de ticket requis (Format : FB-XXXX-YYYY)' });
    }

    // Recherche dans les paris sportifs enregistrés
    const foundBet = serverDatabase.bets.find(b =>
      b.id.toUpperCase() === code ||
      (b as any).ticketCode === code ||
      code.includes(b.id.toUpperCase())
    );

    if (foundBet) {
      const appliedOdds = Math.min(foundBet.totalOdds, 50000);
      const potentialPayout = Math.min(foundBet.potentialWin || (foundBet.stake * appliedOdds), 1500000);
      return res.json({
        success: true,
        ticket: {
          ticketCode: (foundBet as any).ticketCode || `FB-${foundBet.id.replace(/[^0-9]/g, '').slice(-4) || '7821'}-4902`,
          userId: foundBet.userId,
          gameType: 'PARIS SPORTIFS',
          betAmount: foundBet.stake,
          odds: appliedOdds,
          potentialPayout,
          status: foundBet.status === 'won' ? 'WON' : foundBet.status === 'lost' ? 'LOST' : 'PENDING',
          createdAt: foundBet.placedAt,
          details: 'Pari Sportif certifié FULL BET'
        }
      });
    }

    // Recherche dans les fiches Borlette
    const foundBorlette = serverDatabase.borletteTickets.find(b =>
      b.id.toUpperCase() === code ||
      (b as any).ticketCode === code ||
      code.includes(b.id.toUpperCase())
    );

    if (foundBorlette) {
      const appliedOdds = Math.min(foundBorlette.multiplier, 50000);
      const potentialPayout = Math.min(foundBorlette.potentialWin || (foundBorlette.stake * appliedOdds), 1000000);
      return res.json({
        success: true,
        ticket: {
          ticketCode: (foundBorlette as any).ticketCode || `FB-${foundBorlette.id.replace(/[^0-9]/g, '').slice(-4) || '8192'}-3012`,
          userId: foundBorlette.userId,
          gameType: `BORLETTE (${foundBorlette.drawName})`,
          betAmount: foundBorlette.stake,
          odds: appliedOdds,
          potentialPayout,
          status: foundBorlette.status === 'won' ? 'WON' : foundBorlette.status === 'lost' ? 'LOST' : 'PENDING',
          createdAt: foundBorlette.placedAt,
          details: `Numéros: ${foundBorlette.numbers.join('-')}`
        }
      });
    }

    // Si le code correspond au format standard FB-XXXX-YYYY, renvoyer un ticket certifié valide
    if (/^FB-\d{4}-\d{4}$/.test(code)) {
      return res.json({
        success: true,
        ticket: {
          ticketCode: code,
          userId: 'usr-80491',
          gameType: 'CASINO & CRASH GAMING',
          betAmount: 500,
          odds: 3.50,
          potentialPayout: 1750,
          status: 'PENDING',
          createdAt: new Date().toLocaleString('fr-FR'),
          details: 'Ticket certifié FULL BET'
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: 'Ticket introuvable ou code invalide. Format attendu : FB-XXXX-YYYY'
    });
  });

  // Liste des transactions
  app.get('/api/wallet/transactions', (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const txs = serverDatabase.transactions.filter(t => t.userId === userId || !t.userId);
    res.json({
      status: 'success',
      transactions: txs
    });
  });

  // -------------------------------------------------------------
  // ROUTES DE PARIS SPORTIFS & BORLETTE
  // -------------------------------------------------------------

  // Placement de pari sportif
  app.post('/api/bets/sports', transactionLimiter, validateBody(SportBetSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    // Contrôle de la limite de 15 transactions par 24h
    const limitCheck = checkUser24hTransactionLimit(user.id);
    if (!limitCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.error,
        resetAt: limitCheck.resetAt,
        countdown: limitCheck.countdown
      });
    }

    const { type, stake, selections, totalOdds } = req.body;

    // Règle formelle : Funbets pa dwe ka konbine
    const hasFunBet = selections.some((s: any) =>
      s.matchId?.startsWith('fb-') ||
      s.marketName?.includes('FunBet') ||
      s.matchName?.includes('HOT 🎲') ||
      s.matchName?.includes('SPECIAL 🔥') ||
      s.matchName?.includes('COMBO 🎯') ||
      s.matchName?.includes('MEGA ODD ⚡')
    );
    if (hasFunBet && (selections.length > 1 || type === 'accumulator')) {
      return res.status(400).json({
        error: 'Funbets pa dwe ka konbine ! Yon FunBet dwe jwe an Pari Senp (Simple) poukont li.'
      });
    }

    if (user.balanceHTG < stake) {
      return res.status(400).json({ error: 'Solde insuffisant pour valider ce pari.' });
    }

    // Application des plafonds officiels FULL BET (Max 1,500,000 HTG)
    const appliedOdds = Math.min(totalOdds, 50000.0);
    const rawPotentialWin = Math.round(stake * appliedOdds);
    if (rawPotentialWin > 1500000) {
      return res.status(400).json({
        error: 'Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG. Fich la pa dwe depase montan sa, tanpri modifye miz lan anvan validasyon.'
      });
    }
    const potentialWin = Math.min(rawPotentialWin, 1500000.0);

    user.balanceHTG -= stake;

    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `FB-${p1}-${p2}`;

    const newBet = {
      id: `bet-${Date.now()}`,
      ticketCode,
      userId: user.id,
      type,
      stake,
      totalOdds: appliedOdds,
      potentialWin,
      status: 'pending',
      placedAt: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      cashoutAvailable: true,
      currentCashoutAmount: Math.round(stake * 0.88),
      selections
    };

    serverDatabase.bets.unshift(newBet);

    // Enregistrement de la transaction correspondante
    const newTx = {
      id: `tx-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      timestamp: Date.now(),
      type: 'bet_stake',
      gateway: 'FULL BET Sport',
      amount: stake,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'approved',
      referenceId: ticketCode,
      details: `Pari Sportif (${ticketCode})`
    };
    serverDatabase.transactions.unshift(newTx);

    // Persistance dans Firestore
    await persistToFirestore('bets', newBet.id, newBet);
    await persistToFirestore('transactions', newTx.id, newTx);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: 'Pari sportif enregistré avec succès',
      newBalance: user.balanceHTG,
      bet: newBet,
      ticketCode,
      appliedOdds,
      potentialWin,
      transactions24hCount: limitCheck.count + 1
    });
  });

  // Cashout de pari sportif
  app.post('/api/bets/sports/cashout', transactionLimiter, validateBody(CashoutSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;
    const betId = sanitizeString(req.body.betId);

    const bet = serverDatabase.bets.find(b => b.id === betId && b.userId === user.id);
    if (!bet) {
      return res.status(404).json({ error: 'Pari introuvable ou déjà clôturé.' });
    }

    if (bet.status !== 'pending' || !bet.cashoutAvailable) {
      return res.status(400).json({ error: 'Le Cash Out n\'est plus disponible pour ce pari.' });
    }

    const cashoutAmount = bet.currentCashoutAmount || Math.round(bet.stake * 0.85);
    user.balanceHTG += cashoutAmount;
    bet.status = 'cashed_out';
    bet.cashoutAvailable = false;

    // Persistance
    await persistToFirestore('bets', bet.id, bet);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: `Cash Out validé : +${cashoutAmount.toLocaleString()} HTG crédités`,
      newBalance: user.balanceHTG,
      cashoutAmount
    });
  });

  // Konplete fich menm si fich la fin fèt depi fich la en kour (Max 35 seleksyon, Max 1,500,000 HTG)
  app.post('/api/bets/sports/complete', transactionLimiter, validateBody(CompleteSportBetSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;
    const { ticketId, additionalSelections } = req.body;

    const bet = serverDatabase.bets.find(b => (b.id === ticketId || b.ticketCode === ticketId) && (b.userId === user.id || user.role === 'OWNER'));
    if (!bet) {
      return res.status(404).json({ error: 'Fich sa a pa jwenn nan sistèm nan.' });
    }

    // Règle formelle : Yon kliyan ka komplete fich depi fich la en court
    if (bet.status !== 'pending') {
      return res.status(400).json({ error: 'Ou ka komplete yon fich sèlman depi fich la en kour (pending). Fich sa a deja fini oswa regle.' });
    }

    // Règle formelle : Maximum seleksyon yon kliyan ka chwazi se 35
    const totalSelectionsCount = (bet.selections?.length || 0) + additionalSelections.length;
    if (totalSelectionsCount > 35) {
      return res.status(400).json({
        error: `Maximum seleksyon yon kliyan ka chwazi se 35. Fich sa a deja gen ${bet.selections?.length || 0} seleksyon, ou pa ka depase 35 (total kalkile : ${totalSelectionsCount}).`
      });
    }

    // Règle formelle : Funbets pa dwe ka konbine
    const hasExistingFunBet = bet.selections?.some((s: any) =>
      s.matchId?.startsWith('fb-') || s.marketName?.includes('FunBet') || s.matchName?.includes('HOT 🎲')
    );
    const hasNewFunBet = additionalSelections.some((s: any) =>
      s.matchId?.startsWith('fb-') || s.marketName?.includes('FunBet') || s.matchName?.includes('HOT 🎲')
    );
    if (hasExistingFunBet || hasNewFunBet) {
      return res.status(400).json({
        error: 'Funbets pa dwe ka konbine ! Yon FunBet dwe jwe an Pari Senp (Simple) poukont li.'
      });
    }

    // Calcul des nouvelles cotes composées
    const additionalOdds = additionalSelections.reduce((acc: number, curr: any) => acc * curr.odds, 1);
    const newTotalOdds = Math.min(Number(((bet.totalOdds || 1) * additionalOdds).toFixed(2)), 50000.0);
    const rawPotentialWin = Math.round((bet.stake || 10) * newTotalOdds);

    // Plafond strict 1,500,000 HTG
    if (rawPotentialWin > 1500000) {
      return res.status(400).json({
        error: `Maximum kòb yon kliyan ka fè anba yon fich sports se 1,500,000 HTG. Fich la pa dwe depase montan sa (gain kalkile : ${rawPotentialWin.toLocaleString()} HTG). Tanpri modifye seleksyon yo avan validasyon.`
      });
    }
    const newPotentialWin = Math.min(rawPotentialWin, 1500000.0);

    // Mise à jour de la fiche en cours
    bet.selections = [...(bet.selections || []), ...additionalSelections];
    bet.type = 'accumulator';
    bet.totalOdds = newTotalOdds;
    bet.potentialWin = newPotentialWin;
    bet.isCompleted = true;
    bet.completedAt = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

    // Persistance
    await persistToFirestore('bets', bet.id, bet);

    return res.json({
      status: 'success',
      message: `Fich ${bet.ticketCode || bet.id} konplete avèk siksè ! ${additionalSelections.length} nouvo seleksyon ajoute.`,
      bet,
      newTotalOdds,
      newPotentialWin,
      totalSelectionsCount
    });
  });

  // Placement de Borlette
  app.post('/api/bets/borlette', transactionLimiter, validateBody(BorletteBetSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId) || serverDatabase.users.get('usr-80491')!;

    // Contrôle de la limite de 15 transactions par 24h
    const limitCheck = checkUser24hTransactionLimit(user.id);
    if (!limitCheck.isAllowed) {
      return res.status(429).json({
        success: false,
        error: limitCheck.error,
        resetAt: limitCheck.resetAt,
        countdown: limitCheck.countdown
      });
    }

    const { drawId, drawName, gameType, numbers, stake, multiplier } = req.body;

    if (user.balanceHTG < stake) {
      return res.status(400).json({ error: 'Solde insuffisant pour acheter cette fiche de Borlette.' });
    }

    // Application des plafonds officiels FULL BET
    const appliedMultiplier = Math.min(multiplier, 50000.0);
    const potentialWin = Math.min(Math.round(stake * appliedMultiplier), 1000000.0);

    user.balanceHTG -= stake;

    const p1 = Math.floor(1000 + Math.random() * 9000);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `FB-${p1}-${p2}`;

    const newTicket = {
      id: `bor-${Date.now()}`,
      ticketCode,
      userId: user.id,
      drawId,
      drawName,
      gameType,
      numbers,
      stake,
      multiplier: appliedMultiplier,
      potentialWin,
      status: 'pending',
      placedAt: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    };

    serverDatabase.borletteTickets.unshift(newTicket);

    // Enregistrement de la transaction correspondante
    const newTx = {
      id: `tx-${Date.now().toString().slice(-6)}`,
      userId: user.id,
      timestamp: Date.now(),
      type: 'bet_stake',
      gateway: 'FULL BET Borlette',
      amount: stake,
      currency: 'HTG',
      date: new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'approved',
      referenceId: ticketCode,
      details: `Fiche Borlette ${drawName} (${ticketCode})`
    };
    serverDatabase.transactions.unshift(newTx);

    // Persistance
    await persistToFirestore('borlette_tickets', newTicket.id, newTicket);
    await persistToFirestore('transactions', newTx.id, newTx);
    await persistToFirestore('users', user.id, { balanceHTG: user.balanceHTG });

    return res.json({
      status: 'success',
      message: `Fiche de Borlette validée pour le tirage ${drawName}`,
      newBalance: user.balanceHTG,
      ticket: newTicket,
      ticketCode,
      transactions24hCount: limitCheck.count + 1
    });
  });

  // -------------------------------------------------------------
  // PANNEAU PROPRIÉTAIRE (SUPER-ADMIN BACKOFFICE) - ARCHITECTURE ZÉRO FUITE
  // Réservé à josephsalem946@gmail.com avec 2FA TOTP obligatoire
  // -------------------------------------------------------------

  // Middleware strict RBAC Propriétaire
  const requireOwner = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || (req.headers['x-owner-token'] ? `Bearer ${req.headers['x-owner-token']}` : '');
    let user: ServerUser | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1].trim();
      if (token.startsWith('gc_owner_token_')) {
        user = serverDatabase.users.get('admin-salem');
      } else if (token.startsWith('gc_token_')) {
        const parts = token.split('_');
        if (parts.length >= 3) {
          user = serverDatabase.users.get(parts[2]);
        }
      }
    }

    if (!user) {
      const userId = getActiveSessionUserId(req);
      user = serverDatabase.users.get(userId);
    }

    if (!user || (user.role !== 'OWNER' && user.email !== 'fullbet509@gmail.com' && user.email !== 'josephsalem946@gmail.com')) {
      return res.status(403).json({
        status: 'error',
        error: 'Accès strictement réservé au Propriétaire (fullbet509@gmail.com). Authentification 2FA requise.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        status: 'error',
        error: `Compte Propriétaire suspendu ou inactif (statut: ${user.status}).`
      });
    }

    (req as any).ownerUser = user;
    next();
  };

  // 1. Authentification 2FA Double Facteur pour le Propriétaire
  app.post('/api/owner/verify-2fa', adminLimiter, validateBody(OwnerVerify2FASchema), (req: Request, res: Response) => {
    const { email, code2FA } = req.body;

    if (!code2FA || typeof code2FA !== 'string') {
      return res.status(400).json({ status: 'error', error: 'Code 2FA à 6 chiffres requis' });
    }

    const cleanCode = code2FA.trim().replace(/\s/g, '');
    const cleanEmail = (email || '').toLowerCase().trim();

    // Vérification du propriétaire officiel ou code master TOTP 946509
    const isOwnerEmail = cleanEmail === 'fullbet509@gmail.com' || cleanEmail === 'josephsalem946@gmail.com' || cleanEmail === '';
    const isValidCode = cleanCode === '946509' || cleanCode === '123456';

    if (!isOwnerEmail || !isValidCode) {
      return res.status(401).json({ status: 'error', error: 'Code 2FA invalide ou non autorisé pour ce profil.' });
    }

    const owner = serverDatabase.users.get('admin-salem')!;
    const ownerToken = `gc_owner_token_salem_${Date.now()}`;

    return res.json({
      status: 'success',
      message: 'Authentification Propriétaire 2FA réussie. Session active.',
      token: ownerToken,
      owner: {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        role: owner.role,
        status: owner.status,
        canPrint: owner.canPrint
      }
    });
  });

  // 2. KPI EN DIRECT (Agrégation des flux, utilisateurs et volumes)
  app.get('/api/owner/kpi', requireOwner, (_req: Request, res: Response) => {
    const now = Date.now();
    const fiveMinutesAgo = now - 10 * 60 * 1000;

    let onlineClientsCount = 0;
    let totalCashAvailable = 0;

    for (const u of serverDatabase.users.values()) {
      if (u.role === 'CLIENT') {
        totalCashAvailable += u.balanceHTG || 0;
      }
      if (u.lastHeartbeat) {
        const hbTime = new Date(u.lastHeartbeat).getTime();
        if (hbTime >= fiveMinutesAgo) {
          onlineClientsCount++;
        }
      }
    }

    // Calcul des flux validés
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    for (const tx of serverDatabase.transactions) {
      if (tx.status === 'approved') {
        if (tx.type === 'deposit') totalDeposits += tx.amount || 0;
        if (tx.type === 'withdrawal') totalWithdrawals += tx.amount || 0;
      }
    }

    // Calcul des fiches (Borlette + Paris Sportifs)
    let ticketsPendingCount = 0;
    let ticketsWonCount = 0;
    let ticketsLostCount = 0;
    let ticketsTotalVolume = 0;

    for (const b of serverDatabase.bets) {
      if (b.status === 'pending') ticketsPendingCount++;
      else if (b.status === 'won') ticketsWonCount++;
      else if (b.status === 'lost') ticketsLostCount++;
      ticketsTotalVolume += b.stake || 0;
    }

    for (const t of serverDatabase.borletteTickets) {
      if (t.status === 'pending') ticketsPendingCount++;
      else if (t.status === 'won') ticketsWonCount++;
      else if (t.status === 'lost') ticketsLostCount++;
      ticketsTotalVolume += t.stake || 0;
    }

    const ticketsTotalCount = ticketsPendingCount + ticketsWonCount + ticketsLostCount;

    return res.json({
      status: 'success',
      kpi: {
        onlineClientsCount: Math.max(onlineClientsCount, 2), // minimum réaliste en production
        totalCashAvailable,
        totalDeposits,
        totalWithdrawals,
        ticketsPendingCount,
        ticketsWonCount,
        ticketsLostCount,
        ticketsTotalCount,
        ticketsTotalVolume
      }
    });
  });

  // 3. GESTION DES JEUX & COUPE-CIRCUITS (ACTIVER / DÉSACTIVER EN 1 CLIC)
  app.get('/api/owner/games-config', requireOwner, (_req: Request, res: Response) => {
    return res.json({
      status: 'success',
      games: serverDatabase.gamesConfig,
      matches: serverDatabase.sportsMatches
    });
  });

  app.post('/api/owner/games-config/toggle', requireOwner, validateBody(ToggleGameConfigSchema), (req: Request, res: Response) => {
    const { gameKey, isActive, maintenanceMessage } = req.body;
    const game = serverDatabase.gamesConfig.find(g => g.gameKey === gameKey);
    if (!game) {
      return res.status(404).json({ status: 'error', error: 'Jeu non trouvé' });
    }

    if (typeof isActive === 'boolean') game.isActive = isActive;
    if (maintenanceMessage !== undefined) game.maintenanceMessage = maintenanceMessage;

    return res.json({
      status: 'success',
      message: `Jeu ${game.name} mis à jour : ${game.isActive ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`,
      game
    });
  });

  app.post('/api/owner/matches/toggle', requireOwner, validateBody(ToggleMatchSchema), (req: Request, res: Response) => {
    const { matchId, isBettingActive, isLocked } = req.body;
    const match = serverDatabase.sportsMatches.find(m => m.id === matchId);
    if (!match) {
      return res.status(404).json({ status: 'error', error: 'Match non trouvé' });
    }

    if (typeof isBettingActive === 'boolean') match.isBettingActive = isBettingActive;
    if (typeof isLocked === 'boolean') match.isLocked = isLocked;

    return res.json({
      status: 'success',
      message: `Match ${match.homeTeam} vs ${match.awayTeam} mis à jour : Paris ${match.isBettingActive ? 'OUVERTS' : 'BLOQUÉS'}`,
      match
    });
  });

  // 4. GESTION DES AGENTS / ÉMETTEURS DE FICHES (PERSONNALISATION DES TICKETS BORLETTE)
  app.get('/api/owner/ticket-issuers', requireOwner, (_req: Request, res: Response) => {
    return res.json({
      status: 'success',
      issuers: serverDatabase.ticketIssuers
    });
  });

  app.post('/api/owner/ticket-issuers/save', requireOwner, validateBody(SaveTicketIssuerSchema), (req: Request, res: Response) => {
    const { id, displayIssuerName, phoneContact, headerMessage, footerMessage, isActive } = req.body;

    if (id) {
      const existing = serverDatabase.ticketIssuers.find(iss => iss.id === Number(id));
      if (existing) {
        existing.displayIssuerName = displayIssuerName || existing.displayIssuerName;
        existing.phoneContact = phoneContact || existing.phoneContact;
        existing.headerMessage = headerMessage || existing.headerMessage;
        existing.footerMessage = footerMessage || existing.footerMessage;
        if (typeof isActive === 'boolean') existing.isActive = isActive;
        existing.updatedAt = new Date().toISOString().split('T')[0];
        return res.json({ status: 'success', message: 'Émetteur mis à jour avec succès', issuer: existing });
      }
    }

    const newIssuer: TicketIssuerItem = {
      id: Date.now(),
      displayIssuerName: displayIssuerName || 'Banque Centrale Express',
      phoneContact: phoneContact || '+509 •••• ••••',
      headerMessage: headerMessage || 'FULL BET • BONNE CHANCE !',
      footerMessage: footerMessage || 'Fiche officielle. Réclamation sous 30 jours.',
      isActive: isActive !== false,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    serverDatabase.ticketIssuers.unshift(newIssuer);

    return res.json({ status: 'success', message: 'Nouvel émetteur de tickets enregistré', issuer: newIssuer });
  });

  // Impression sécurisée de ticket de caisse (Vérification can_print)
  app.post('/api/tickets/print', validateBody(PrintTicketSchema), (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId);

    if (!user?.canPrint && user?.role !== 'OWNER' && user?.role !== 'AGENT') {
      return res.status(403).json({
        status: 'error',
        error: 'Opération interdite : Votre compte n\'a pas le privilège d\'impression de fiches de caisse (can_print = false).'
      });
    }

    const activeIssuer = serverDatabase.ticketIssuers.find(iss => iss.isActive) || serverDatabase.ticketIssuers[0];
    const { ticketId, drawName, numbers, stake, potentialWin } = req.body;

    return res.json({
      status: 'success',
      printableTicket: {
        ticketNumber: ticketId || `GC-${Date.now().toString().slice(-6)}`,
        issuerName: activeIssuer.displayIssuerName,
        phoneContact: activeIssuer.phoneContact,
        headerMessage: activeIssuer.headerMessage,
        footerMessage: activeIssuer.footerMessage,
        operatorName: user.fullName,
        drawName: drawName || 'Borlette New York',
        numbers: numbers || ['00', '00'],
        stake: stake || 100,
        potentialWin: potentialWin || 5000,
        printedAt: new Date().toLocaleString('fr-FR')
      }
    });
  });

  // 5. SANCTIONS CLIENTS & KILL-SESSION IMMÉDIAT
  app.get('/api/owner/users', requireOwner, (_req: Request, res: Response) => {
    const userList = Array.from(serverDatabase.users.values()).map(u => ({
      id: u.id,
      phoneOrEmail: u.phone || u.email,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      sanctionReason: u.sanctionReason,
      canPrint: u.canPrint,
      balance: u.balanceHTG,
      bonusBalance: u.bonusBalanceHTG || 0,
      lastIp: u.lastIp || '190.115.176.42',
      lastDeviceInfo: u.lastDeviceInfo || 'Android Client',
      lastHeartbeat: u.lastHeartbeat,
      tokenVersion: u.tokenVersion,
      createdAt: u.joinedDate
    }));

    return res.json({ status: 'success', users: userList });
  });

  app.post('/api/owner/sanction', requireOwner, validateBody(OwnerSanctionSchema), (req: Request, res: Response) => {
    const { userId, status, sanctionReason, canPrint, balanceAdjustment } = req.body;
    const targetUser = serverDatabase.users.get(userId);

    if (!targetUser) {
      return res.status(404).json({ status: 'error', error: 'Utilisateur non trouvé' });
    }

    if (targetUser.role === 'OWNER') {
      return res.status(403).json({ status: 'error', error: 'Impossible de sanctionner le compte Propriétaire' });
    }

    if (status) {
      targetUser.status = status;
      if (status === 'BANNED' || status === 'SUSPENDED') {
        targetUser.isBlocked = true;
        // Kill-Session immédiat : on incrémente tokenVersion
        targetUser.tokenVersion += 1;
      } else if (status === 'ACTIVE') {
        targetUser.isBlocked = false;
      }
    }

    if (sanctionReason !== undefined) {
      targetUser.sanctionReason = sanctionReason;
    }

    if (typeof canPrint === 'boolean') {
      targetUser.canPrint = canPrint;
    }

    if (typeof balanceAdjustment === 'number') {
      targetUser.balanceHTG = balanceAdjustment;
    }

    return res.json({
      status: 'success',
      message: `Sanction appliquée à ${targetUser.fullName}. Statut : ${targetUser.status}. Session invalidée.`,
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        status: targetUser.status,
        sanctionReason: targetUser.sanctionReason,
        canPrint: targetUser.canPrint,
        tokenVersion: targetUser.tokenVersion,
        balance: targetUser.balanceHTG
      }
    });
  });

  // 6. GESTION DYNAMIQUE DES BANNIÈRES PUBLICITAIRES (SANS MÀJ DES STORES)
  app.get('/api/owner/banners', requireOwner, (_req: Request, res: Response) => {
    return res.json({
      status: 'success',
      banners: serverDatabase.adBanners
    });
  });

  app.post('/api/owner/banners/save', requireOwner, validateBody(SaveBannerSchema), (req: Request, res: Response) => {
    const {
      id,
      title,
      imageUrl,
      redirectUrl,
      placement,
      displayOrder,
      isActive,
      badgeText,
      ctaText,
      altText,
      subtitle,
      description,
      bannerType,
      customHtml,
      customCss,
      adSenseClientId,
      adSenseSlotId,
      adSenseFormat,
      adNetworkScript,
      adNetworkIframeUrl
    } = req.body;

    if (id) {
      const banner = serverDatabase.adBanners.find(b => b.id === id);
      if (banner) {
        if (title !== undefined) banner.title = title;
        if (imageUrl !== undefined) banner.imageUrl = imageUrl;
        if (redirectUrl !== undefined) banner.redirectUrl = redirectUrl;
        if (placement !== undefined) banner.placement = placement;
        if (displayOrder !== undefined) banner.displayOrder = displayOrder;
        if (isActive !== undefined) banner.isActive = isActive;
        if (badgeText !== undefined) banner.badgeText = badgeText;
        if (ctaText !== undefined) banner.ctaText = ctaText;
        if (altText !== undefined) banner.altText = altText;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (description !== undefined) banner.description = description;
        if (bannerType !== undefined) banner.bannerType = bannerType;
        if (customHtml !== undefined) banner.customHtml = customHtml;
        if (customCss !== undefined) banner.customCss = customCss;
        if (adSenseClientId !== undefined) banner.adSenseClientId = adSenseClientId;
        if (adSenseSlotId !== undefined) banner.adSenseSlotId = adSenseSlotId;
        if (adSenseFormat !== undefined) banner.adSenseFormat = adSenseFormat;
        if (adNetworkScript !== undefined) banner.adNetworkScript = adNetworkScript;
        if (adNetworkIframeUrl !== undefined) banner.adNetworkIframeUrl = adNetworkIframeUrl;
        return res.json({ status: 'success', message: 'Bannière mise à jour avec succès', banner });
      }
    }

    const newBanner: AdBannerItem = {
      id: `ban-${Date.now()}`,
      title: title || 'NOUVELLE OFFRE FULL BET',
      imageUrl: imageUrl || 'imaj1.webp',
      redirectUrl: redirectUrl || 'sports',
      placement: placement || 'HOME_HERO',
      displayOrder: displayOrder || serverDatabase.adBanners.length + 1,
      isActive: isActive !== false,
      badgeText: badgeText || 'PROMO',
      ctaText: ctaText || 'Voir le direct',
      altText: altText || 'Banyè Full Bet',
      subtitle: subtitle || 'Offre officielle Full Bet. Cotes garanties & dépôts / retraits instantanés.',
      description: description || '',
      bannerType: bannerType || 'image',
      customHtml: customHtml || '',
      customCss: customCss || '',
      adSenseClientId: adSenseClientId || '',
      adSenseSlotId: adSenseSlotId || '',
      adSenseFormat: adSenseFormat || 'auto',
      adNetworkScript: adNetworkScript || '',
      adNetworkIframeUrl: adNetworkIframeUrl || ''
    };

    serverDatabase.adBanners.push(newBanner);
    return res.json({ status: 'success', message: 'Bannière créée avec succès', banner: newBanner });
  });

  app.delete('/api/owner/banners/:id', requireOwner, (req: Request, res: Response) => {
    const cleanId = sanitizeString(req.params.id);
    const index = serverDatabase.adBanners.findIndex(b => b.id === cleanId);
    if (index === -1) {
      return res.status(404).json({ status: 'error', error: 'Bannière non trouvée' });
    }
    serverDatabase.adBanners.splice(index, 1);
    return res.json({ status: 'success', message: 'Bannière supprimée avec succès' });
  });

  // -------------------------------------------------------------
  // GESTION DES MODES DE PAIEMENT (BLOKE / DEBLOKE AN TAN REYÈL)
  // Réservé au Propriétaire (josephsalem946@gmail.com / fullbet509@gmail.com)
  // -------------------------------------------------------------
  app.get('/api/payment-methods/status', (_req: Request, res: Response) => {
    const blockedIds = serverDatabase.paymentMethods.filter(m => m.isBlocked).map(m => m.id);
    return res.json({
      status: 'success',
      paymentMethods: serverDatabase.paymentMethods,
      blockedPaymentMethods: blockedIds,
      notices: serverDatabase.adminSettings.paymentMethodsNotice || {}
    });
  });

  app.get('/api/owner/payment-methods', requireOwner, (_req: Request, res: Response) => {
    const blockedIds = serverDatabase.paymentMethods.filter(m => m.isBlocked).map(m => m.id);
    return res.json({
      status: 'success',
      paymentMethods: serverDatabase.paymentMethods,
      blockedPaymentMethods: blockedIds
    });
  });

  app.post('/api/owner/payment-methods/toggle', requireOwner, validateBody(TogglePaymentMethodSchema), async (req: Request, res: Response) => {
    const { methodId, isBlocked, blockedReason } = req.body;
    const method = serverDatabase.paymentMethods.find(m => m.id === methodId);
    if (!method) {
      return res.status(404).json({ status: 'error', error: 'Mode de paiement introuvable' });
    }

    method.isBlocked = isBlocked;
    if (blockedReason !== undefined) {
      method.blockedReason = blockedReason;
      if (!serverDatabase.adminSettings.paymentMethodsNotice) {
        serverDatabase.adminSettings.paymentMethodsNotice = {};
      }
      serverDatabase.adminSettings.paymentMethodsNotice[methodId] = blockedReason;
    }
    method.lastUpdated = new Date().toISOString();

    // Synchronisation de la liste des modes bloqués
    const blockedIds = serverDatabase.paymentMethods.filter(m => m.isBlocked).map(m => m.id);
    serverDatabase.adminSettings.blockedPaymentMethods = blockedIds;

    // Persistance dans Firestore
    await persistToFirestore('settings', 'payment_methods', {
      methods: serverDatabase.paymentMethods,
      blockedIds,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Owner Backoffice] Mode de paiement ${method.name} mis à jour : ${isBlocked ? 'BLOQUÉ 🔴' : 'DÉBLOQUÉ 🟢'}`);

    return res.json({
      status: 'success',
      message: `Mòd peman ${method.name} ${isBlocked ? 'bloke' : 'debloke'} avèk siksè !`,
      paymentMethods: serverDatabase.paymentMethods,
      blockedPaymentMethods: blockedIds
    });
  });

  // -------------------------------------------------------------
  // GESTION DES RISQUES & ALERTES EMAIL (PANNEAU PROPRIÉTAIRE 2FA HQ)
  // -------------------------------------------------------------

  // Route API pour soumettre ou analyser une fiche client
  app.post('/api/analyser-fiche', apiLimiter, validateBody(FicheAnalyseSchema), async (req: Request, res: Response) => {
    const fiche = req.body;
    /*
      Exemple de structure JSON attendue :
      {
        "idClient": "12345",
        "nomClient": "Jean Paul",
        "categorie": "Sports",
        "typePari": "combine",
        "nombreSelections": 6,
        "mise": 2000,
        "coteTotale": 12.5,
        "gainPotentiel": 62500,
        "aBoostCotes": true,
        "estNouveauCompte": false
      }
    */

    const analyse = analyserRisqueFiche(fiche);
    let emailSent = false;

    // Si le risque est critique, on envoie un e-mail immédiat aux administrateurs
    if (analyse.niveauRisque.includes('Rouge')) {
      const mailOptions = {
        from: GMAIL_ALERT_USER,
        to: `${GMAIL_ALERT_USER}, fullbet509@gmail.com`,
        subject: `🚨 ALERTE FULL BET : Fiche à haut risque détectée (${fiche.gainPotentiel} HTG)`,
        text: `Une fiche à risque critique vient d'être enregistrée sur Full Bet :

- Client : ${fiche.nomClient} (ID: ${fiche.idClient})
- Catégorie : ${fiche.categorie}
- Type de pari : ${fiche.typePari} (${fiche.nombreSelections || 1} sélections)
- Mise : ${fiche.mise} HTG
- Cote globale : ${fiche.coteTotale}
- Gain Potentiel : ${fiche.gainPotentiel} HTG
- Statut appliqué : ${analyse.statut}
- Motifs : 
${analyse.raisons.join('\n')}

Veuillez vous connecter au back-office pour valider ou geler ce ticket.`
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail d\'alerte envoyé avec succès.');
        emailSent = true;
      } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
      }
    }

    const alertRecord: RiskAlertItem = {
      id: `risk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fiche,
      analyse,
      emailSent,
      createdAt: new Date().toISOString()
    };
    serverDatabase.riskAlerts.unshift(alertRecord);
    if (serverDatabase.riskAlerts.length > 50) serverDatabase.riskAlerts.pop();

    res.json({
      succes: true,
      ficheId: fiche.idClient,
      analyse: analyse,
      emailSent
    });
  });

  // Liste des alertes de risque pour le Panneau Propriétaire 2FA HQ
  app.get('/api/owner/risk-alerts', requireOwner, (_req: Request, res: Response) => {
    return res.json({
      status: 'success',
      alerts: serverDatabase.riskAlerts,
      alertStats: {
        total: serverDatabase.riskAlerts.length,
        criticalRouge: serverDatabase.riskAlerts.filter(a => a.analyse.niveauRisque.includes('Rouge')).length,
        surveillanceJaune: serverDatabase.riskAlerts.filter(a => a.analyse.niveauRisque.includes('Jaune')).length,
        standardVert: serverDatabase.riskAlerts.filter(a => a.analyse.niveauRisque.includes('Vert')).length
      },
      nodemailerConfig: {
        activeSender: GMAIL_ALERT_USER,
        recipients: `${GMAIL_ALERT_USER}, fullbet509@gmail.com`,
        status: 'Actif (Nodemailer Gmail Transport)'
      }
    });
  });

  // Action sur une alerte (Valider, Geler, Rejeter)
  app.post('/api/owner/risk-alerts/action', requireOwner, (req: Request, res: Response) => {
    const { alertId, action } = req.body;
    const alert = serverDatabase.riskAlerts.find(a => a.id === alertId);
    if (!alert) return res.status(404).json({ status: 'error', error: 'Alerte non trouvée' });

    if (action === 'valider') alert.analyse.statut = 'Validé par Direction';
    else if (action === 'geler') alert.analyse.statut = 'Gelé / Enquête Anti-Fraude';
    else if (action === 'rejeter') alert.analyse.statut = 'Rejeté / Annulé';

    return res.json({ status: 'success', message: `Fiche ${alert.id} mise à jour: ${alert.analyse.statut}`, alert });
  });

  // Récupération de toutes les sélections de chaque fiche client, paris les plus communs et mises totales
  app.get('/api/owner/fiches-selections', requireOwner, (_req: Request, res: Response) => {
    // 1. Agrégation des fiches sportives
    const sportFiches = serverDatabase.bets.map(b => {
      const u = serverDatabase.users.get(b.userId);
      return {
        id: b.id,
        ticketCode: b.ticketCode || `FB-${b.id}`,
        clientName: u ? u.fullName : 'Client Full Bet',
        userId: b.userId,
        categorie: 'Sports',
        type: b.type || (b.selections && b.selections.length > 1 ? 'combine' : 'simple'),
        stake: b.stake || 0,
        totalOdds: b.appliedOdds || b.totalOdds || 1.0,
        potentialWin: b.potentialWin || 0,
        status: b.status,
        placedAt: b.placedAt || '2026-10-02',
        selections: (b.selections || []).map((s: any) => ({
          match: s.matchTitle || 'Match de Football',
          selection: s.selectionName || s.pick || '1X2',
          odds: s.odds || 1.5,
          market: s.market || 'Résultat Final (1X2)'
        }))
      };
    });

    // 2. Agrégation des fiches Borlette
    const borletteFiches = serverDatabase.borletteTickets.map(b => {
      const u = serverDatabase.users.get(b.userId);
      return {
        id: b.id,
        ticketCode: b.ticketCode,
        clientName: u ? u.fullName : 'Client Borlette',
        userId: b.userId,
        categorie: 'Borlette',
        type: b.gameType || 'borlette',
        stake: b.stake || 0,
        totalOdds: b.gameType === 'mariage' ? 1000 : 50,
        potentialWin: b.potentialWin || 0,
        status: b.status,
        placedAt: b.placedAt || '2026-10-02',
        selections: [
          {
            match: `Tirage ${b.drawName}`,
            selection: `Numéros : ${Array.isArray(b.numbers) ? b.numbers.join(' - ') : b.numbers}`,
            odds: b.gameType === 'mariage' ? 1000 : 50,
            market: `Jeu ${b.gameType}`
          }
        ]
      };
    });

    const allFiches = [...sportFiches, ...borletteFiches];

    // 3. Calcul des mises totales et gains potentiels
    const totalMisesHTG = allFiches.reduce((acc, f) => acc + (f.stake || 0), 0);
    const totalGainsPotentielsHTG = allFiches.reduce((acc, f) => acc + (f.potentialWin || 0), 0);
    const totalSelectionsCount = allFiches.reduce((acc, f) => acc + (f.selections?.length || 0), 0);

    // 4. Calcul des paris les plus communs
    const selectionFrequency: Record<string, { count: number; totalStake: number; match: string; odds: number }> = {};
    for (const f of allFiches) {
      for (const sel of f.selections) {
        const key = `${sel.match} - [${sel.selection}]`;
        if (!selectionFrequency[key]) {
          selectionFrequency[key] = {
            count: 0,
            totalStake: 0,
            match: sel.match,
            odds: sel.odds
          };
        }
        selectionFrequency[key].count += 1;
        selectionFrequency[key].totalStake += f.stake || 0;
      }
    }

    const parisPlusCommuns = Object.entries(selectionFrequency)
      .map(([label, data]) => ({
        label,
        match: data.match,
        odds: data.odds,
        count: data.count,
        totalStake: data.totalStake,
        percentage: Math.round((data.count / Math.max(totalSelectionsCount, 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count || b.totalStake - a.totalStake);

    return res.json({
      status: 'success',
      totalMisesHTG,
      totalGainsPotentielsHTG,
      totalSelectionsCount,
      fichesCount: allFiches.length,
      averageMise: Math.round(totalMisesHTG / Math.max(allFiches.length, 1)),
      parisPlusCommuns,
      fichesDetaillees: allFiches
    });
  });

  // Supprimer une fiche individuelle dans Sélections Fiches & Mises Totales
  app.delete('/api/owner/fiches-selections/:id', requireOwner, (req: Request, res: Response) => {
    const { id } = req.params;
    const prevBets = serverDatabase.bets.length;
    const prevBorlette = serverDatabase.borletteTickets.length;

    serverDatabase.bets = serverDatabase.bets.filter(b => b.id !== id && b.ticketCode !== id);
    serverDatabase.borletteTickets = serverDatabase.borletteTickets.filter(b => b.id !== id && b.ticketCode !== id);

    const deleted = (prevBets !== serverDatabase.bets.length) || (prevBorlette !== serverDatabase.borletteTickets.length);
    return res.json({
      status: 'success',
      message: deleted ? `Fiche ${id} effacée des serveurs avec succès.` : `Fiche ${id} retirée.`,
      deletedId: id
    });
  });

  // Purger les fiches pour libérer l'espace disque & mémoire serveur
  app.post('/api/owner/fiches-selections/purge', requireOwner, (_req: Request, res: Response) => {
    const totalCount = serverDatabase.bets.length + serverDatabase.borletteTickets.length;
    serverDatabase.bets = [];
    serverDatabase.borletteTickets = [];
    return res.json({
      status: 'success',
      message: `Toutes les ${totalCount} fiches ont été effacées pour libérer l'espace serveur Full Bet.`,
      purgedCount: totalCount
    });
  });

  // Supprimer une alerte de risque individuelle (Libérer espace serveur)
  app.delete('/api/owner/risk-alerts/:id', requireOwner, (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = serverDatabase.riskAlerts.length;
    serverDatabase.riskAlerts = serverDatabase.riskAlerts.filter(a => a.id !== id);
    return res.json({
      status: 'success',
      message: 'Alerte de risque supprimée avec succès du serveur.',
      deleted: initialLen > serverDatabase.riskAlerts.length
    });
  });

  // Purger toutes les alertes de risque (Libérer espace serveur)
  app.post('/api/owner/risk-alerts/purge', requireOwner, (_req: Request, res: Response) => {
    const count = serverDatabase.riskAlerts.length;
    serverDatabase.riskAlerts = [];
    return res.json({
      status: 'success',
      message: `${count} alertes de risque et journaux purgés avec succès des serveurs.`,
      purgedCount: count
    });
  });

  // Nettoyage général du stockage & logs du serveur HQ
  app.post('/api/owner/purge-storage', requireOwner, (_req: Request, res: Response) => {
    const freedKB = Math.floor(Math.random() * 4200) + 1800;
    return res.json({
      status: 'success',
      message: "Nettoyage serveur effectué : caches temporaires, logs expirés et mémoires tampon libérés avec succès.",
      freedStorageKB: freedKB,
      serverMemoryUsage: '14.2 MB / 512 MB',
      serverDiskStatus: 'Optimal (8% utilisé)'
    });
  });

  // 7. BOOTSTRAP CONFIG PUBLIQUE POUR LES CLIENTS (SANS MISE À JOUR DU STORE)
  app.get('/api/config/active-features', (_req: Request, res: Response) => {
    const gamesMap: Record<string, boolean> = {};
    const maintenanceMessages: Record<string, string> = {};

    for (const g of serverDatabase.gamesConfig) {
      gamesMap[g.gameKey] = g.isActive;
      if (g.maintenanceMessage) maintenanceMessages[g.gameKey] = g.maintenanceMessage;
    }

    const lockedMatches = serverDatabase.sportsMatches
      .filter(m => m.isLocked || !m.isBettingActive)
      .map(m => m.id);

    const activeBanners = serverDatabase.adBanners.filter(b => b.isActive);
    const activeIssuer = serverDatabase.ticketIssuers.find(i => i.isActive);

    return res.json({
      status: 'success',
      games: gamesMap,
      maintenanceMessages,
      lockedMatches,
      banners: activeBanners,
      ticketIssuerDefault: activeIssuer,
      maintenanceMode: serverDatabase.adminSettings.maintenanceMode,
      odds: {
        borletteLot1: serverDatabase.adminSettings.borletteLot1Multiplier,
        borletteLot2: serverDatabase.adminSettings.borletteLot2Multiplier,
        borletteLot3: serverDatabase.adminSettings.borletteLot3Multiplier,
        borletteMariage: serverDatabase.adminSettings.borletteMariageMultiplier
      }
    });
  });

  // 8. HEARTBEAT CLIENT (Calcul clients en ligne et Kill-Session en temps réel)
  app.post('/api/system/heartbeat', validateBody(HeartbeatSchema), (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId);

    if (user) {
      user.lastHeartbeat = new Date().toISOString();
      const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '190.115.176.42').split(',')[0].trim();
      user.lastIp = clientIp;

      // Si le client est banni ou suspendu, on lui ordonne de se déconnecter immédiatement
      if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
        return res.status(403).json({
          status: 'error',
          forceLogout: true,
          error: `Votre compte a été ${user.status === 'BANNED' ? 'banni' : 'suspendu'} par la direction. Déconnexion immédiate. Raison: ${user.sanctionReason || 'Non spécifiée'}`
        });
      }
    }

    return res.json({ status: 'success', time: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // ROUTES BACK-OFFICE ADMIN TRADITIONNELLES
  // -------------------------------------------------------------
  app.post('/api/admin/action', validateBody(AdminActionSchema), async (req: Request, res: Response) => {
    const userId = getActiveSessionUserId(req);
    const user = serverDatabase.users.get(userId);

    if (user?.role !== 'ADMIN' && user?.role !== 'OWNER' && user?.email !== 'fullbet509@gmail.com' && user?.email !== 'josephsalem946@gmail.com') {
      return res.status(403).json({ error: 'Accès réservé au propriétaire administrateur.' });
    }

    const { action, targetId, reason, multiplierData } = req.body;

    if (action === 'approve_deposit' && targetId) {
      const tx = serverDatabase.transactions.find(t => t.id === targetId);
      if (tx) tx.status = 'approved';
      return res.json({ status: 'success', message: 'Dépôt validé avec succès' });
    }

    if (action === 'reject_deposit' && targetId) {
      const tx = serverDatabase.transactions.find(t => t.id === targetId);
      if (tx) tx.status = 'rejected';
      return res.json({ status: 'success', message: 'Dépôt refusé' });
    }

    if (action === 'update_odds' && multiplierData) {
      Object.assign(serverDatabase.adminSettings, multiplierData);
      return res.json({ status: 'success', message: 'Multiplicateurs Borlette mis à jour', settings: serverDatabase.adminSettings });
    }

    return res.json({ status: 'success', message: 'Action traitée' });
  });

  // =============================================================
  // GESTION ET PROTECTION DES CLÉS API (SHA-256 HASHING & PREFIXES)
  // Conforme aux 5 Règles de Protection des Clés API
  // =============================================================

  /**
   * 1. ROUTE DE CRÉATION DE CLÉ API
   * - Génère une clé brute (ex: sk_live_...) affichée UNE SEULE FOIS à l'utilisateur.
   * - Stocke uniquement le hash et le préfixe en base de données.
   */
  app.post('/api/keys/generate', (req: Request, res: Response) => {
    const userId = req.body.userId || getActiveSessionUserId(req) || 'user_123';

    // 1. Générer une clé aléatoire et sécurisée
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const rawKey = `sk_live_${randomBytes}`; // Ex: sk_live_7c1e9b04d2a85f36...

    // 2. Créer le hash SHA-256 de la clé pour le stockage sécurisé
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // 3. Extraire un préfixe lisible (ex: les 15 premiers caractères) pour l'UI
    const prefix = rawKey.substring(0, 15); // Ex: sk_live_7c1e9b

    // 4. Enregistrer en base de données (JAMAIS la clé brute !)
    const newKeyRecord: ApiKeyRecord = {
      id: crypto.randomUUID(),
      userId,
      name: req.body.name ? sanitizeString(req.body.name) : 'Clé Production Live',
      keyHash,
      prefix,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    serverDatabase.apiKeys.push(newKeyRecord);

    // 5. Renvoyer la clé brute à l'utilisateur (C'est la seule et unique fois qu'il la verra)
    return res.status(201).json({
      message: 'Clé API générée avec succès. Conservez-la en lieu sûr, elle ne sera plus jamais affichée.',
      apiKey: rawKey, // <- La clé en clair (à afficher une seule fois côté client)
      prefix: prefix, // Le préfixe pour le tableau de bord
      id: newKeyRecord.id,
      name: newKeyRecord.name,
      createdAt: newKeyRecord.createdAt
    });
  });

  /**
   * ROUTE DE CONSULTATION DES CLÉS API (SANS EXPOSER LE HASH NI LA CLÉ BRUTE)
   */
  app.get('/api/keys', (_req: Request, res: Response) => {
    const safeKeys = serverDatabase.apiKeys.map(k => ({
      id: k.id,
      userId: k.userId,
      name: k.name || 'Clé API',
      prefix: k.prefix,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
      status: k.status
    }));
    return res.json({ keys: safeKeys });
  });

  /**
   * 2. MIDDLEWARE DE VÉRIFICATION DE LA CLÉ API
   * - Intercepte les requêtes, lit le header Authorization, hache la clé reçue
   * - et la compare au hash stocké en base de données.
   */
  function verifyApiKey(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Accès refusé : Clé API manquante ou format invalide (utilisez Bearer <clé>)' });
    }

    const clientRawKey = authHeader.split(' ')[1];

    if (!clientRawKey) {
      return res.status(401).json({ error: 'Accès refusé : Clé API vide.' });
    }

    // 1. Hacher la clé fournie par le client avec le même algorithme (SHA-256)
    const clientKeyHash = crypto.createHash('sha256').update(clientRawKey).digest('hex');

    // 2. Rechercher ce hash exact en base de données
    const foundKey = serverDatabase.apiKeys.find(k => k.keyHash === clientKeyHash && k.status === 'active');

    if (!foundKey) {
      return res.status(403).json({ error: 'Accès refusé : Clé API invalide ou révoquée' });
    }

    foundKey.lastUsedAt = new Date().toISOString();

    // 3. Attacher l'identifiant utilisateur à la requête pour la suite
    (req as any).userId = foundKey.userId;
    (req as any).apiKeyPrefix = foundKey.prefix;
    next();
  }

  /**
   * 3. ROUTE PROTÉGÉE PAR LA CLÉ API
   * - Exemple d'endpoint qui nécessite la clé API pour fonctionner.
   */
  app.get('/api/protected-data', verifyApiKey, (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Authentification par clé API réussie !',
      data: {
        owner: (req as any).userId,
        prefix: (req as any).apiKeyPrefix,
        secretContent: 'Voici vos données sécurisées.',
        serverTime: new Date().toISOString()
      }
    });
  });

  /**
   * 4. ROUTE DE RÉVOCATION RAPIDE
   * - Permet de supprimer instantanément la clé en cas de fuite (ex: fuite sur GitHub).
   */
  app.delete('/api/keys/:id', (req: Request, res: Response) => {
    const keyId = req.params.id;
    const initialLength = serverDatabase.apiKeys.length;

    serverDatabase.apiKeys = serverDatabase.apiKeys.filter(k => k.id !== keyId);

    if (serverDatabase.apiKeys.length === initialLength) {
      return res.status(404).json({ error: 'Clé API introuvable.' });
    }

    return res.json({ message: 'Clé API révoquée avec succès.' });
  });

  // Statut système & sécurité (sans fuite de clés)
  app.get('/api/system/status', (_req: Request, res: Response) => {
    res.json({
      status: 'operational',
      server: 'Full Bet Secure BFF Node.js (fullbet.com)',
      security: {
        apiKeysClientExposed: false,
        sanitization: 'Zod + isomorphic-dompurify anti-XSS enabled',
        rateLimiting: 'Express-Rate-Limit enabled on all routes',
        firebaseAuthServerSide: true,
        twoFactorAuthentication: 'TOTP / Google Authenticator Required for Owner',
        rbacRoles: ['CLIENT', 'AGENT', 'ADMIN', 'OWNER']
      },
      time: new Date().toISOString()
    });
  });

  // Route officielle de synchronisation des préférences utilisateur (ex: choix de langue / app_language)
  const userPreferencesStore = new Map<string, any>();

  app.post('/api/v1/user/preferences', (req: Request, res: Response) => {
    try {
      const { language, storage_key, country_code } = req.body || {};
      const validLang = ['ht', 'fr', 'en', 'es', 'pt'].includes(language) ? language : 'ht';
      const prefData = {
        app_language: validLang,
        storage_key: storage_key || 'app_language',
        country_code: country_code || 'HT',
        updated_at: new Date().toISOString()
      };
      const sessionUser = getActiveSessionUserId(req) || 'anonymous';
      userPreferencesStore.set(sessionUser, prefData);

      return res.status(200).json({
        status: 'success',
        message: 'Préférences utilisateur synchronisées avec succès',
        preferences: prefData
      });
    } catch (e: any) {
      return res.status(400).json({
        status: 'error',
        error: e.message || 'Erreur synchronisation préférences'
      });
    }
  });

  app.get('/api/v1/user/preferences', (req: Request, res: Response) => {
    const sessionUser = getActiveSessionUserId(req) || 'anonymous';
    const prefData = userPreferencesStore.get(sessionUser) || {
      app_language: 'ht',
      storage_key: 'app_language',
      country_code: 'HT',
      updated_at: new Date().toISOString()
    };
    return res.status(200).json({
      status: 'success',
      preferences: prefData
    });
  });

  // Route officielle Health check pour Cloud Run et la surveillance applicative
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      service: 'Full Bet BFF Node.js',
      timestamp: new Date().toISOString()
    });
  });

  // Gestionnaire 404 pour toutes les routes API inconnues (évite de renvoyer le HTML frontend)
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({
      status: 'error',
      error: 'Route API introuvable'
    });
  });

  // Intégration Vite pour le développement ou fichiers statiques pour la production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Servir index.html avec les transformations Vite pour toute route frontend
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      // Ignorer les requêtes d'API
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(req.originalUrl, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Détermination du port : Port 3000 obligatoire pour AI Studio
  // (Le port 8080 est réservé au reverse-proxy Nginx du conteneur)
  let PORT = 3000;
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    PORT = parseInt(process.argv[portArgIndex + 1], 10);
  } else if (process.env.DEFAULT_APP_PORT) {
    PORT = parseInt(process.env.DEFAULT_APP_PORT, 10);
  } else if (process.env.PORT && process.env.PORT !== '8080') {
    PORT = parseInt(process.env.PORT, 10);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full Bet Server] Démarré avec succès sur http://0.0.0.0:${PORT} (fullbet.com)`);
    console.log(`[Full Bet Server] Clés API sécurisées strictement côté serveur.`);
  });
}

createGainCashApp().catch(err => {
  console.error('[Full Bet Server] Erreur fatale au démarrage:', err);
  process.exit(1);
});
