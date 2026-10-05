import React, { useState } from 'react';
import {
  X,
  Mail,
  Search,
  BookOpen,
  HelpCircle,
  Shield,
  Trophy,
  Dices,
  Gamepad2,
  Gift,
  ArrowRight,
  ExternalLink,
  Printer
} from 'lucide-react';
import { GainCashLogo } from './GainCashLogo';
import { playClickSound } from '../utils/audio';

interface RulesAndTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: string;
  onOpenWallet?: (tab?: 'deposit' | 'withdraw') => void;
  onOpenBetSlip?: () => void;
  onOpenProfile?: () => void;
  onSelectModule?: (mod: 'sports' | 'casino' | 'borlette') => void;
}

export const RulesAndTermsModal: React.FC<RulesAndTermsModalProps> = ({
  isOpen,
  onClose,
  onOpenWallet,
  onOpenBetSlip,
  onOpenProfile,
  onSelectModule
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'aide',
      title: '📚 Aide et Mode d\'Emploi',
      badge: 'Mode d\'emploi',
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
      items: [
        {
          question: 'Création de compte',
          description: 'Comment vous inscrire et valider votre profil étape par étape.',
          response: 'Cliquez sur le bouton d\'inscription, remplissez les champs requis (nom, numéro de téléphone, mot de passe) et validez votre compte via le code de confirmation reçu.',
          actionLabel: 'Créer / Vérifier mon compte',
          actionType: 'profile'
        },
        {
          question: 'Dépôts et Retraits',
          description: 'Guide sur l\'utilisation des méthodes de paiement disponibles (ex. Moncash online, Natcash online ou cartes bancaires) pour approvisionner votre compte ou récupérer vos gains en toute sécurité.',
          response: 'Rendez-vous dans la section "Portefeuille" ou "Dépôt/Retrait", choisissez votre moyen de paiement (comme Moncash online ou Natcash online), entrez le montant et suivez les instructions. Les transactions sont traitées rapidement.',
          actionLabel: 'Accéder au Portefeuille',
          actionType: 'wallet'
        },
        {
          question: 'Placer un pari',
          description: 'Explications simples sur la façon de sélectionner un match, de choisir une cote et de valider votre coupon de pari.',
          response: 'Naviguez dans les sports, cliquez sur la cote de votre choix pour l\'ajouter automatiquement à votre coupon de pari, indiquez votre montant de mise et confirmez.',
          actionLabel: 'Voir les Matchs & Cotes',
          actionType: 'sports'
        }
      ]
    },
    {
      id: 'faq',
      title: '❓ FAQ (Foire Aux Questions)',
      badge: 'FAQ',
      icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
      items: [
        {
          question: 'Que se passe-t-il si un match est interrompu ou reporté ?',
          description: 'Règlementation en cas d\'interruption technique ou météorologique d\'un événement.',
          response: 'En cas d\'interruption, si le match ne reprend pas dans les délais réglementaires (généralement 48h), les paris concernés sont annulés et la mise est remboursée, sauf si le résultat de l\'événement était déjà acquis au moment de l\'interruption.'
        },
        {
          question: 'Comment suivre l\'évolution de mon pari en direct (Live) ?',
          description: 'Suivi des scores et statistiques en direct.',
          response: 'Utilisez l\'onglet "En direct" ou "Live" de la plateforme pour suivre les scores en temps réel, les statistiques du match et l\'évolution dynamique des cotes.',
          actionLabel: 'Aller aux matchs en direct',
          actionType: 'sports'
        },
        {
          question: 'Où puis-je retrouver mes tickets de paris gagnants ou en cours ?',
          description: 'Consultation de l\'historique des fiches et coupons.',
          response: 'Vos tickets se trouvent dans l\'historique de votre compte, accessible généralement via le menu principal ou la section "Mes paris" / "Fiches".',
          actionLabel: 'Ouvrir mes fiches',
          actionType: 'fiches'
        }
      ]
    },
    {
      id: 'jeu-responsable',
      title: '🛡️ Jeu Responsable',
      badge: '18+ & Sécurité',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      items: [
        {
          question: 'Protection des mineurs',
          description: 'L\'accès à la plateforme est strictement interdit aux personnes de moins de 18 ans.',
          response: 'Des vérifications d\'identité peuvent être effectuées pour bloquer l\'accès aux mineurs et protéger les plus jeunes.'
        },
        {
          question: 'Contrôle du budget',
          description: 'Fixez vos propres limites de dépôt et de mise pour garder le contrôle sur vos dépenses.',
          response: 'Vous pouvez configurer des plafonds journaliers, hebdomadaires ou mensuels directement depuis les paramètres de sécurité de votre profil.'
        },
        {
          question: 'Auto-exclusion',
          description: 'Possibilité de suspendre ou de fermer temporairement votre compte en cas de besoin.',
          response: 'Contactez le support à fullbet509@gmail.com ou activez l\'option d\'auto-exclusion dans vos paramètres pour bloquer l\'accès à votre compte de manière temporaire ou définitive.'
        }
      ]
    },
    {
      id: 'paris-sportifs',
      title: '⚽ Règles - Paris Sportifs',
      badge: 'Sports',
      icon: <Trophy className="w-4 h-4 text-sky-400" />,
      items: [
        {
          question: 'Résultat du match (1X2)',
          description: 'Sauf mention contraire, les paris portent sur le temps réglementaire (90 minutes plus les arrêts de jeu), hors prolongations et tirs au but.',
          response: 'Le pari "1" désigne la victoire de l\'équipe à domicile, "X" le match nul, et "2" la victoire de l\'équipe à l\'extérieur.'
        },
        {
          question: 'Cotes et modifications',
          description: 'Les cotes peuvent varier en direct selon le déroulement de la rencontre. Le pari est validé au moment de l\'enregistrement de votre ticket.',
          response: 'Si une cote change pendant que vous validez votre coupon, le site peut vous demander de confirmer la nouvelle cote ou refuser la modification selon vos préférences.'
        },
        {
          question: 'Paris combinés et simples (Accu)',
          description: 'Modalités de calcul des gains selon le type de pari sélectionné.',
          response: 'Le pari simple comporte une seule sélection (gains = mise × cote). Le pari combiné (Accu) regroupe plusieurs sélections distinctes (les cotes se multiplient entre elles, mais toutes les sélections doivent être gagnantes pour remporter le coupon).'
        },
        {
          question: 'Règle de Compatibilité (Éviter les Conflits)',
          description: 'Interdiction de combiner plusieurs sélections interdépendantes du même match dans un combiné classique.',
          response: 'Dans les paris sportifs, les règlements interdisent de combiner plusieurs événements issus d\'un même match dans un combiné classique (accumulateur). Par exemple, vous ne pouvez pas associer "Victoire Équipe A" et "Plus de 2.5 buts dans le match" dans un combo normal car leurs résultats sont fortement corrélés.'
        },
        {
          question: 'Option "Bet Builder" (Same Game Combo) & Paris Système',
          description: 'Comment associer plusieurs pronostics sur une seule et même rencontre.',
          response: 'Pour combiner plusieurs choix sur un même match, utilisez l\'option officielle "⚡ Bet Builder" : le système calcule une cote adaptée tenant compte de la corrélation. En dehors du Bet Builder, le coupon vous propose de séparer vos choix en paris simples individuels ou de les jouer sous forme de pari système (Trixie/Yankee/2 sur 3).'
        }
      ]
    },
    {
      id: 'loterie-borlette',
      title: '🎰 Règles - Loterie & Borlette',
      badge: 'Borlette',
      icon: <Dices className="w-4 h-4 text-amber-400" />,
      items: [
        {
          question: 'Validation des numéros',
          description: 'Les paris doivent être validés avant l\'heure limite de fermeture des jeux pour chaque tirage (ex. Borlette NY/FL).',
          response: 'Aucun pari n\'est accepté après le lancement officiel du tirage ou l\'heure de clôture affichée.',
          actionLabel: 'Accéder aux tirages Borlette',
          actionType: 'borlette'
        },
        {
          question: 'Paiement des gains',
          description: 'Les lots sont crédités automatiquement sur votre solde principal dès l\'officialisation des résultats officiels.',
          response: 'En cas de gain, l\'argent est viré sur votre compte joueur, d\'où vous pourrez effectuer un retrait via Moncash online ou Natcash online.'
        }
      ]
    },
    {
      id: 'jeux-virtuels',
      title: '🎮 Règles - Jeux Virtuels',
      badge: 'Virtuel / Casino',
      icon: <Gamepad2 className="w-4 h-4 text-purple-400" />,
      items: [
        {
          question: 'Événements simulés',
          description: 'Les matchs virtuels sont générés par un logiciel certifié indépendant garantissant l\'équité et le hasard des résultats.',
          response: 'Les résultats reposent sur un générateur de nombres aléatoires (RNG) et ne dépendent pas de faits réels.',
          actionLabel: 'Découvrir les jeux Arcade / Casino',
          actionType: 'casino'
        },
        {
          question: 'Règlement rapide',
          description: 'Les paris sont réglés immédiatement à la fin de chaque simulation virtuelle.',
          response: 'Les matchs durent quelques minutes, permettant un crédit instantané des gains sur les tickets gagnants.'
        }
      ]
    },
    {
      id: 'selections-fiches',
      title: '📋 Sélections de Paris & Mises Totales',
      badge: 'Fiches & Sélections',
      icon: <Trophy className="w-4 h-4 text-amber-400" />,
      items: [
        {
          question: 'Toutes les sélections de chaque fiche client sur Full Bet',
          description: 'Composition, validation et suivi en temps réel de tous vos pronostics.',
          response: 'Sur chaque fiche de pari client, vous pouvez ajouter une ou plusieurs sélections distinctes (paris simples ou combinés jusqu\'à 30 choix). Chaque sélection est enregistrée avec son événement, son intitulé de marché et sa cote officielle en temps réel.',
          actionLabel: 'Créer une fiche de pari',
          actionType: 'sports'
        },
        {
          question: 'Quels sont les paris les plus communs sur l\'application ?',
          description: 'Les types de paris les plus populaires et fréquemment choisis par les joueurs.',
          response: 'Les paris les plus communs incluent : 1. Le Résultat Final 1X2 (Victoire Domicile / Nul / Victoire Extérieur), 2. Le Plus / Moins de 2.5 buts (Over/Under), 3. La Double Chance (1X, X2, 12), 4. Les Deux Équipes Marquent (BTTS), et 5. Les tirages de Borlette (1er Lot, 2ème Lot, 3ème Lot et Mariage New York & Floride).',
          actionLabel: 'Voir les matchs populaires',
          actionType: 'sports'
        },
        {
          question: 'Comment sont calculées les mises totales et les gains potentiels ?',
          description: 'Règles de calcul de la mise engagée et du gain maximal autorisé.',
          response: 'La mise totale (en HTG) correspond au montant exact débité de votre solde pour valider la fiche. Pour les combinés, la mise totale est multipliée par le produit de toutes les cotes retenues. Les fiches sont plafonnées pour garantir un paiement sécurisé et instantané via Moncash online ou Natcash online dès confirmation du résultat.'
        },
        {
          question: 'Offres promotionnelles et Boost de Cotes (+30%)',
          description: 'Majoration de gains sans exigences contraignantes de rollover.',
          response: 'Sur Full Bet, les cotes boostées (+30%) s\'appliquent directement sur votre fiche dès 3 sélections éligibles. Vos gains sont crédités en argent réel directement retirable, sans conditions restrictives de bonus.'
        }
      ]
    }
  ];

  const handleAction = (type?: string) => {
    playClickSound();
    onClose();
    if (type === 'profile') onOpenProfile?.();
    else if (type === 'wallet') onOpenWallet?.('deposit');
    else if (type === 'sports') onSelectModule?.('sports');
    else if (type === 'fiches') onOpenBetSlip?.();
    else if (type === 'borlette') onSelectModule?.('borlette');
    else if (type === 'casino') onSelectModule?.('casino');
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  // Filter sections by search or active category
  const filteredSections = sections
    .map(section => {
      const matchSectionFilter = activeSectionFilter === 'all' || activeSectionFilter === section.id;
      if (!matchSectionFilter) return null;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return section;

      const titleMatches = section.title.toLowerCase().includes(q);
      const filteredItems = section.items.filter(item =>
        item.question.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.response.toLowerCase().includes(q)
      );

      if (titleMatches) return section;
      if (filteredItems.length > 0) return { ...section, items: filteredItems };
      return null;
    })
    .filter(Boolean) as typeof sections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-[#0f172a] text-[#f8fafc] rounded-3xl shadow-2xl overflow-hidden border border-[#334155] flex flex-col max-h-[94vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#1e293b] border-b border-[#334155] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <GainCashLogo size="sm" showSubtitle={false} />
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#f59e0b] tracking-wide font-display">
                Centre d'Assistance & Règles - Full Bet
              </h2>
              <p className="text-[11px] text-[#cbd5e1] hidden sm:block">
                Aide, FAQ, Mode d'Emploi et Conditions Générales d'Utilisation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#0f172a] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] transition-all cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-semibold"
              title="Imprimer le règlement"
            >
              <Printer className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Imprimer</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-2 rounded-xl bg-[#0f172a] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-[#334155] transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 bg-[#172033] border-b border-[#334155] space-y-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une règle, une question (ex: Dépôts, 1X2, Match interrompu, Retrait)..."
              className="w-full pl-9 pr-8 py-2 bg-[#0f172a] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#38bdf8] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Nav Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs">
            <button
              onClick={() => {
                playClickSound();
                setActiveSectionFilter('all');
              }}
              className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                activeSectionFilter === 'all'
                  ? 'bg-[#f59e0b] text-slate-950 shadow-xs'
                  : 'bg-[#0f172a] text-slate-300 border border-[#334155] hover:bg-[#334155]'
              }`}
            >
              Tous
            </button>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  playClickSound();
                  setActiveSectionFilter(s.id);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  activeSectionFilter === s.id
                    ? 'bg-[#38bdf8] text-slate-950 font-bold shadow-xs'
                    : 'bg-[#0f172a] text-slate-300 border border-[#334155] hover:bg-[#334155]'
                }`}
              >
                <span>{s.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0f172a]">
          
          {/* Main Container Card matching HTML spec */}
          <div className="max-w-3xl mx-auto bg-[#1e293b] p-4 sm:p-8 rounded-2xl shadow-xl border border-[#334155]">
            
            {/* Title & Introduction */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-black text-[#f59e0b] tracking-wide mb-2">
                Centre d'Assistance & Règles - Full Bet
              </h1>
              <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed text-left sm:text-center">
                Bienvenue sur notre centre d'assistance. Vous trouverez ici toutes les informations nécessaires pour naviguer et parier en toute sérénité. Pour toute assistance supplémentaire, vous pouvez nous contacter directement par e-mail à :{' '}
                <a
                  href="mailto:fullbet509@gmail.com"
                  className="text-[#38bdf8] font-bold hover:underline"
                >
                  fullbet509@gmail.com
                </a>.
              </p>
            </div>

            {/* Sections Content */}
            <div className="space-y-8">
              {filteredSections.map(sec => (
                <div key={sec.id} className="space-y-4">
                  
                  {/* Section Title with bottom border line */}
                  <h2 className="text-base sm:text-lg font-bold text-[#38bdf8] border-b-2 border-[#334155] pb-2 flex items-center justify-between">
                    <span>{sec.title}</span>
                  </h2>

                  {/* Section Items */}
                  <div className="space-y-4">
                    {sec.items.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <h3 className="text-sm font-bold text-[#f8fafc] flex items-center gap-1.5">
                          <span>{item.question}</span>
                        </h3>
                        {item.description && (
                          <p className="text-xs text-[#cbd5e1] leading-relaxed">
                            {item.description}
                          </p>
                        )}
                        <div className="bg-[#0f172a] p-3 text-xs border-l-4 border-[#f59e0b] rounded-r-md text-[#f8fafc] leading-relaxed mt-1">
                          <strong className="text-[#f59e0b]">Réponse : </strong>
                          <span>{item.response}</span>
                          
                          {/* Optional Quick Action button */}
                          {item.actionLabel && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleAction(item.actionType)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/40 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                <span>{item.actionLabel}</span>
                                <ArrowRight className="w-3 h-3 text-[#38bdf8]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>

            {/* Contact Box matching spec */}
            <div className="bg-[#334155] p-4 rounded-xl text-center mt-8 text-xs sm:text-sm text-[#f8fafc] space-y-1 shadow-md">
              <p>
                Besoin d'aide supplémentaire ? Contactez notre équipe de support à l'adresse :{' '}
                <a
                  href="mailto:fullbet509@gmail.com"
                  className="text-[#38bdf8] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5 inline" />
                  <span>fullbet509@gmail.com</span>
                </a>
              </p>
              <p className="text-[11px] text-slate-300 font-mono pt-1">
                Passerelles de paiement sécurisées : Natcash online: +509 •••• •••• • Moncash online: +509 •••• ••••
              </p>
            </div>

          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-3 bg-[#1e293b] border-t border-[#334155] flex items-center justify-between gap-3 text-xs">
          <span className="text-[#cbd5e1] font-mono text-[11px] truncate">
            Full Bet / Gain Cash POS • Support: fullbet509@gmail.com
          </span>
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-5 py-2 bg-[#f59e0b] hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
