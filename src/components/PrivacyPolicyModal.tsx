import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Smartphone,
  UserCheck,
  FileText,
  Search,
  Printer,
  ExternalLink,
  ChevronRight,
  Eye,
  Database,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Award
} from 'lucide-react';
import { GainCashLogo } from './GainCashLogo';
import { playClickSound } from '../utils/audio';
import { APP_VERSION } from '../version';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenRules
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'engagement' | 'donnees' | 'paiements' | 'securite' | 'droits' | 'cookies' | 'jeu_responsable'>('all');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'engagement',
      title: '1. Engagement de la Direction & Responsable du Traitement',
      badge: 'Direction Officielle',
      icon: <Award className="w-4 h-4 text-amber-500" />,
      content: [
        {
          subTitle: 'Identité de l’Éditeur & Plateforme',
          text: 'La plateforme de jeux en ligne « FULL BET » (fullbet.com) est exploitée sous la direction de Direction Générale Full Bet (e-mail officiel : fullbet509@gmail.com). Nous fournissons des services régulés de paris sportifs, de jeux de casino et de borlette haïtienne (tirages officiels de New York et Floride).'
        },
        {
          subTitle: 'Délégué à la Protection des Données (DPO)',
          text: 'Pour toute question relative à vos données personnelles, l’exercice de vos droits ou la sécurité de vos informations, notre Délégué à la Protection des Données est joignable directement par courrier électronique à : fullbet509@gmail.com. Toute demande est traitée avec accusé de réception sous 24 à 48 heures ouvrées.'
        },
        {
          subTitle: 'Principe Fondamental de Minimisation',
          text: 'Full Bet applique le principe strict de minimisation : nous ne collectons que les informations strictement nécessaires à l\'exécution de vos prises de paris, au crédit de vos dépôts et au versement sécurisé de vos gains.'
        }
      ]
    },
    {
      id: 'donnees',
      title: '2. Données Personnelles Collectées & Finalités',
      badge: 'Collecte Conforme',
      icon: <Database className="w-4 h-4 text-sky-500" />,
      content: [
        {
          subTitle: 'Données d’Identification & Inscription',
          text: 'Lors de la création de votre compte, nous enregistrons votre nom complet, votre numéro de téléphone mobile actif (+509) servant d’identifiant unique de compte, ainsi que votre mot de passe sous forme cryptée irréversible (hachage sécurisé).'
        },
        {
          subTitle: 'Attestation de Majorité (18 Ans Révolus)',
          text: 'L’accès à la plateforme est strictement réservé aux personnes physiques âgées de 18 ans et plus. Une vérification d’âge obligatoire est effectuée lors de l’inscription. Les comptes de mineurs sont immédiatement bloqués et leurs fonds retournés à l’émetteur d’origine.'
        },
        {
          subTitle: 'Données Techniques de Navigation & Biométrie Locale',
          text: 'L’application prend en charge la biométrie (empreinte digitale ou FaceID). La vérification biométrique est réalisée STRICTEMENT en local sur la puce sécurisée de votre smartphone. Aucune donnée d’empreinte digitale ou de visage ne transite sur nos serveurs ni n\'est stockée en base de données.'
        }
      ]
    },
    {
      id: 'paiements',
      title: '3. Sécurité des Paiements Mobiles (MonCash, Natcash, Binance Pay)',
      badge: 'Zéro Fuite Bancaire',
      icon: <Lock className="w-4 h-4 text-emerald-500" />,
      content: [
        {
          subTitle: 'Passerelles Officielles & Règle d’Or « Zéro Code Secret »',
          text: 'Full Bet collabore avec les passerelles mobiles haïtiennes : Natcash (+509 •••• ••••) et Moncash (+509 •••• ••••). RÈGLE ABSOLUE : Ni l’application ni aucun membre du personnel de Full Bet ne vous demandera JAMAIS votre code secret personnel, code PIN MonCash ou mot de passe NatPay. Les validations s’effectuent exclusivement sur les interfaces bancaires officielles sécurisées.'
        },
        {
          subTitle: 'Vérification des Retraits & Numéro Lié',
          text: 'Par mesure de protection contre l’usurpation d’identité et le blanchiment, les demandes de retrait sont automatiquement bridées et exécutées uniquement vers le numéro de téléphone enregistré sur votre compte certifié Full Bet.'
        },
        {
          subTitle: 'Paiements Cryptomonnaies (Binance Pay / NOWPayments)',
          text: 'Les dépôts effectués en cryptomonnaies (USDT, BTC, ETH, TRX) sont enregistrés publiquement sur la blockchain sans exposer votre identité personnelle. Un chronomètre d’expiration de 20 minutes protège votre facture contre la volatilité des cours du marché.'
        }
      ]
    },
    {
      id: 'securite',
      title: '4. Architecture de Sécurité & Hébergement Cloud Sécurisé',
      badge: 'SSL 256-Bit & BFF',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-500" />,
      content: [
        {
          subTitle: 'Architecture Backend BFF (Backend-For-Frontend)',
          text: 'Toutes les requêtes sensibles transitent par un serveur d’API Node.js / Express sécurisé. Aucune clé secrète, jeton d’administration ou clé d’accès Firebase n’est exposé côté client dans le navigateur ou dans le code de l’application mobile.'
        },
        {
          subTitle: 'Cryptage des Flux en Transit & au Repos',
          text: 'L’ensemble des communications entre votre application et nos serveurs est protégé par un chiffrement SSL/TLS 256-bit hautement sécurisé (norme PCI-DSS). Vos données de transactions sont hébergées sur Google Cloud Firestore avec règles d’isolation stricts par utilisateur.'
        },
        {
          subTitle: 'Contrôle 2FA Propriétaire & Alertes Automatisées',
          text: 'Le panneau Super-Admin du Propriétaire est isolé par une double authentification 2FA TOTP obligatoire. Toute transaction atypique ou fiche à haut risque déclenche une alerte temps réel par notification Nodemailer sécurisée.'
        }
      ]
    },
    {
      id: 'droits',
      title: '5. Vos Droits d’Accès, de Rectification et de Suppression',
      badge: 'Contrôle Total',
      icon: <UserCheck className="w-4 h-4 text-purple-500" />,
      content: [
        {
          subTitle: 'Droit d’Accès & Historique Complet',
          text: 'À tout moment, vous pouvez consulter l’historique intégral de vos paris, tirages borlette et mouvements de caisse depuis l’onglet « Historique » du portefeuille ou dans « Fich Mwen Yo ».'
        },
        {
          subTitle: 'Droit de Rectification & Mise à Jour',
          text: 'Vous avez le droit d’actualiser vos coordonnées téléphoniques ou de mettre à jour les informations de votre profil en vous adressant au service client ou depuis la section Mon Profil.'
        },
        {
          subTitle: 'Droit à l’Oubli (Suppression de Compte)',
          text: 'Vous pouvez solliciter la clôture définitive de votre compte et la purge de vos données personnelles en envoyant un e-mail à : fullbet509@gmail.com. Dès validation de l’absence de litige financier ou de retrait en cours, vos données sont anonymisées sous 48 heures.'
        }
      ]
    },
    {
      id: 'cookies',
      title: '6. Utilisation du Cache Local, Cookies & Traceurs',
      badge: 'Zéro Traceur Tiers',
      icon: <Eye className="w-4 h-4 text-indigo-500" />,
      content: [
        {
          subTitle: 'Stockage Local Nécessaire au Fonctionnement',
          text: 'Full Bet utilise le stockage local de votre appareil (localStorage) pour conserver vos préférences d’affichage (langue kreyòl / français, mode masque de confidentialité, dernier module consulté) et maintenir votre jeton de session active.'
        },
        {
          subTitle: 'Refus de la Vente de Données Personnelles',
          text: 'Nous ne vendons, ne louons et ne cédons AUCUNE donnée personnelle ou numéro de téléphone à des régies publicitaires externes, courtiers en données ou tiers non autorisés.'
        }
      ]
    },
    {
      id: 'jeu_responsable',
      title: '7. Jeu Responsable, Plafonds 24h & Protection des Joueurs',
      badge: 'Modération & 18+',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      content: [
        {
          subTitle: 'Plafonds de Transactions sur 24 Heures',
          text: 'Afin d’encourager une pratique saine du divertissement, Full Bet intègre des garde-fous automatiques sur les montants de dépôt et de prise de paris cumulés sur 24 heures glissantes.'
        },
        {
          subTitle: 'Option d’Auto-Exclusion Temporaire ou Définitive',
          text: 'Tout joueur ressentant le besoin de suspendre son activité peut demander une auto-exclusion immédiate (pour 7 jours, 30 jours ou à durée indéterminée) en écrivant à fullbet509@gmail.com avec objet « AUTO-EXCLUSION ».'
        }
      ]
    }
  ];

  const filteredSections = sections.map(sec => {
    const matchesFilter = activeTab === 'all' || activeTab === sec.id;
    if (!matchesFilter) return null;

    if (!searchQuery.trim()) return sec;

    const query = searchQuery.toLowerCase();
    const matchedContent = sec.content.filter(
      c => c.subTitle.toLowerCase().includes(query) || c.text.toLowerCase().includes(query)
    );

    if (matchedContent.length > 0 || sec.title.toLowerCase().includes(query)) {
      return {
        ...sec,
        content: matchedContent.length > 0 ? matchedContent : sec.content
      };
    }

    return null;
  }).filter(Boolean) as typeof sections;

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 text-slate-800">
        
        {/* ========================================================= */}
        {/* EN-TÊTE MODAL (BRANDING OFFICIEL FULL BET & LOGO CIRCULAIRE) */}
        {/* ========================================================= */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1322] via-[#101b33] to-[#0a1120] text-white border-b border-sky-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo officiel Full Bet */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-sky-400 bg-white flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)] shrink-0">
              <img
                src="/assets/aistudio/20261024_195031_0000_e0e7da2c.png"
                alt="Logo Officiel Full Bet"
                className="w-full h-full object-contain object-center p-0.5"
              />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-wide font-display text-white">
                  POLITIQUE DE CONFIDENTIALITÉ • FULL BET
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% SÉCURISÉ & CONFORME
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                Protection des données, sécurité financière des transactions et respect de votre vie privée
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              aria-label="Fermer la politique de confidentialité"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BANDEAU RECHERCHE & ONGLET RAPIDE                         */}
        {/* ========================================================= */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Barre de recherche */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans la politique (MonCash, Natcash, suppression, 18+, SSL...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-8 py-2 border border-slate-200 focus:border-sky-500 focus:outline-hidden transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Version & Badge Date */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
              <span className="font-bold text-slate-700">Version {APP_VERSION.versionName}</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">Mise à jour : Octobre 2026</span>
            </div>
          </div>

          {/* Filtres de catégorie */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-xs font-semibold">
            {[
              { id: 'all', label: 'Toutes les rubriques' },
              { id: 'engagement', label: 'Direction & DPO' },
              { id: 'donnees', label: 'Données collectées' },
              { id: 'paiements', label: 'Sécurité Paiements' },
              { id: 'securite', label: 'Architecture & SSL' },
              { id: 'droits', label: 'Vos Droits Légaux' },
              { id: 'cookies', label: 'Cookies & Cache' },
              { id: 'jeu_responsable', label: 'Jeu Responsable' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CORPS PRINCIPAL : ARTICLES DÉTAILLÉS                      */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#fbfcfd]">
          
          {/* Key Commitments Highlight Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>SSL 256-Bit</span>
              </div>
              <p className="text-[11px] text-slate-600">Transactions chiffrées de bout en bout</p>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Zéro Code PIN</span>
              </div>
              <p className="text-[11px] text-slate-600">Aucun mot de passe bancaire conservé</p>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Droit à l'Oubli</span>
              </div>
              <p className="text-[11px] text-slate-600">Suppression et anonymisation sous 48h</p>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Majeurs 18+</span>
              </div>
              <p className="text-[11px] text-slate-600">Protection absolue des mineurs</p>
            </div>
          </div>

          {/* Detailed Content Sections */}
          {filteredSections.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Aucun résultat trouvé pour « {searchQuery} »</p>
              <p className="text-xs text-slate-500">Essayez un autre mot-clé ou réinitialisez le filtre de recherche.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredSections.map(sec => (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Section Header */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      {sec.icon}
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {sec.title}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {sec.badge}
                  </span>
                </div>

                {/* Section Articles */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {sec.content.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                        <span>{item.subTitle}</span>
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed pl-3 border-l-2 border-slate-100">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Dedicated Customer Service & DPO Contact Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0e1628] text-white space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Contact du Service Client & Confidentialité Full Bet
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Une équipe d'assistance technique dédiée à votre écoute 7j/7
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="mailto:fullbet509@gmail.com?subject=Question%20Confidentialite%20Full%20Bet"
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Écrire au DPO</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-semibold">E-mail Officiel :</span>
                <span className="font-mono text-sky-400 font-bold select-all">fullbet509@gmail.com</span>
              </div>

              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-semibold">Passerelle Natcash :</span>
                <span className="font-mono text-emerald-400 font-bold select-all">+509 •••• ••••</span>
              </div>

              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-semibold">Passerelle Moncash :</span>
                <span className="font-mono text-red-400 font-bold select-all">+509 •••• ••••</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Propriétaire responsable : <strong>Direction Générale Full Bet</strong> (Contact officiel : <span className="text-amber-400 font-mono">fullbet509@gmail.com</span>). Tous les droits de propriété intellectuelle, marques et algorithmes de la plateforme Full Bet sont strictement protégés.
            </p>
          </div>

        </div>

        {/* ========================================================= */}
        {/* PIED DE MODAL                                             */}
        {/* ========================================================= */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">En utilisant Full Bet, vous acceptez notre politique de protection des données.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenRules && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRules();
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Règles & Conditions Générales
              </button>
            )}

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
            >
              J'ai compris
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
