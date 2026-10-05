import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Ban,
  Users,
  DollarSign,
  Bell,
  Settings,
  AlertCircle,
  AlertTriangle,
  Send,
  Sliders,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Transaction, UserProfile, AdminSettings, AppNotification } from '../types';
import { playClickSound, playWinSound } from '../utils/audio';
import { serverAdminAction } from '../utils/api';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  transactions: Transaction[];
  adminSettings: AdminSettings;
  onUpdateTransactionStatus: (txId: string, newStatus: 'approved' | 'rejected') => void;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onUpdateAdminSettings: (newSettings: AdminSettings) => void;
  onSendNotification: (notif: AppNotification) => void;
  onOpenOwnerSuperAdmin?: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  user,
  transactions,
  adminSettings,
  onUpdateTransactionStatus,
  onUpdateUser,
  onUpdateAdminSettings,
  onSendNotification,
  onOpenOwnerSuperAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'users' | 'borlette_odds' | 'push'>('transactions');

  // Push notification input
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');

  // Borlette multiplier state
  const [lot1Mult, setLot1Mult] = useState(adminSettings.borletteLot1Multiplier);
  const [lot2Mult, setLot2Mult] = useState(adminSettings.borletteLot2Multiplier);
  const [lot3Mult, setLot3Mult] = useState(adminSettings.borletteLot3Multiplier);
  const [mariageMult, setMariageMult] = useState(adminSettings.borletteMariageMultiplier);
  const [maintenanceMode, setMaintenanceMode] = useState(adminSettings.maintenanceMode || false);

  // User balance adjustment
  const [balanceInput, setBalanceInput] = useState(user.balanceHTG);

  if (!isOpen) return null;

  const pendingTxs = transactions.filter(t => t.status === 'pending');

  const handleSaveSettings = () => {
    playClickSound();
    onUpdateAdminSettings({
      ...adminSettings,
      borletteLot1Multiplier: lot1Mult,
      borletteLot2Multiplier: lot2Mult,
      borletteLot3Multiplier: lot3Mult,
      borletteMariageMultiplier: mariageMult,
      maintenanceMode: maintenanceMode
    });
    serverAdminAction({
      action: 'update_odds',
      multiplierData: {
        borletteLot1Multiplier: lot1Mult,
        borletteLot2Multiplier: lot2Mult,
        borletteLot3Multiplier: lot3Mult,
        borletteMariageMultiplier: mariageMult
      }
    }).catch(e => console.warn('[Admin Odds Sync]', e));
    alert("Paramètres des cotes et mode maintenance enregistrés avec succès !");
  };

  const handleSendPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;

    playWinSound();
    onSendNotification({
      id: `push-${Date.now()}`,
      title: pushTitle,
      message: pushMessage,
      time: 'À l\'instant',
      read: false,
      type: 'admin_announcement'
    });

    setPushTitle('');
    setPushMessage('');
    alert("Notification Push envoyée avec succès à tous les utilisateurs !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0b101c] text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-amber-500/30 flex flex-col max-h-[90vh]">
        
        {/* Admin Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/60 via-[#161324] to-[#0d1424] flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white font-display">
                Panneau d'Administration Full Bet (fullbet.com)
              </h3>
              <span className="text-[10px] text-amber-300/80 font-mono">
                Propriétaire : {adminSettings.adminEmail}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenOwnerSuperAdmin && (
              <button
                onClick={() => {
                  playClickSound();
                  onClose();
                  onOpenOwnerSuperAdmin();
                }}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
                title="Accéder au Panneau Propriétaire Super-Admin sécurisé par 2FA"
              >
                <span>👑 Super-Admin HQ</span>
              </button>
            )}
            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-4 bg-[#080d17] p-1.5 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-2 rounded-xl font-bold transition-all ${
              activeTab === 'transactions'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Caisse ({pendingTxs.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 rounded-xl font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Utilisateurs
          </button>

          <button
            onClick={() => setActiveTab('borlette_odds')}
            className={`py-2 rounded-xl font-bold transition-all ${
              activeTab === 'borlette_odds'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cotes & Bonus
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`py-2 rounded-xl font-bold transition-all ${
              activeTab === 'push'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Push Alertes
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: VALIDATION DÉPÔTS & RETRAITS */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider">
                <span>Transactions en Attente de Validation</span>
                <span className="text-amber-400 font-bold">{pendingTxs.length} en attente</span>
              </div>

              {pendingTxs.length === 0 ? (
                <div className="p-8 text-center bg-[#0f172a] rounded-2xl text-slate-400 text-xs space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white">Toutes les transactions sont à jour !</p>
                  <p className="text-slate-500">Aucune demande en attente actuellement.</p>
                </div>
              ) : (
                pendingTxs.map(tx => (
                  <div
                    key={tx.id}
                    className="p-4 bg-[#0f172a] rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md"
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
                        Montant : <strong className="text-emerald-400 font-mono-num">{tx.amount.toLocaleString()} HTG</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Date: {tx.date} • Téléphone : {tx.phoneNumber || 'Non renseigné'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          playWinSound();
                          onUpdateTransactionStatus(tx.id, 'approved');
                          serverAdminAction({ action: 'approve_deposit', targetId: tx.id }).catch(e => console.warn(e));
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Valider</span>
                      </button>

                      <button
                        onClick={() => {
                          playClickSound();
                          onUpdateTransactionStatus(tx.id, 'rejected');
                          serverAdminAction({ action: 'reject_deposit', targetId: tx.id }).catch(e => console.warn(e));
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

          {/* TAB 2: GESTION DES UTILISATEURS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fiche Utilisateur Actuel
              </div>

              <div className="p-4 bg-[#0f172a] rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm text-white">{user.fullName}</h4>
                    <p className="text-xs text-slate-400 font-mono">ID: {user.id}</p>
                  </div>
                  <button
                    onClick={() => {
                      playClickSound();
                      onUpdateUser({ isBlocked: !user.isBlocked });
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      user.isBlocked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600/30 text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white'
                    }`}
                  >
                    {user.isBlocked ? 'Débloquer le Compte' : 'Bloquer le Compte'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-[#141f36] rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Statut Âge</span>
                    <span className="font-bold text-emerald-400">Vérifié 18+</span>
                  </div>
                  <div className="p-2.5 bg-[#141f36] rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Biométrie</span>
                    <span className="font-bold text-cyan-400">
                      {user.biometricsEnabled ? 'Activée (Face/Touch)' : 'Désactivée'}
                    </span>
                  </div>
                </div>

                {/* Adjust User Balance */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Modifier le Solde Utilisateur (HTG) :
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={balanceInput}
                      onChange={(e) => setBalanceInput(Number(e.target.value))}
                      className="flex-1 bg-[#16213c] text-white font-mono-num font-bold text-sm px-3.5 py-2 rounded-xl border border-slate-700"
                    />
                    <button
                      onClick={() => {
                        playClickSound();
                        onUpdateUser({ balanceHTG: balanceInput });
                        alert("Solde utilisateur mis à jour avec succès !");
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      Enregistrer Solde
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COTES BORLETTE ET BONUS */}
          {activeTab === 'borlette_odds' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Multiplicateurs de Gains Borlette
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0f172a] rounded-xl space-y-1">
                  <span className="text-xs text-slate-300 font-semibold block">1er Lot (x)</span>
                  <input
                    type="number"
                    value={lot1Mult}
                    onChange={(e) => setLot1Mult(Number(e.target.value))}
                    className="w-full bg-[#16213c] text-white font-mono font-bold p-2 rounded-lg border border-slate-700"
                  />
                </div>

                <div className="p-3 bg-[#0f172a] rounded-xl space-y-1">
                  <span className="text-xs text-slate-300 font-semibold block">2ème Lot (x)</span>
                  <input
                    type="number"
                    value={lot2Mult}
                    onChange={(e) => setLot2Mult(Number(e.target.value))}
                    className="w-full bg-[#16213c] text-white font-mono font-bold p-2 rounded-lg border border-slate-700"
                  />
                </div>

                <div className="p-3 bg-[#0f172a] rounded-xl space-y-1">
                  <span className="text-xs text-slate-300 font-semibold block">3ème Lot (x)</span>
                  <input
                    type="number"
                    value={lot3Mult}
                    onChange={(e) => setLot3Mult(Number(e.target.value))}
                    className="w-full bg-[#16213c] text-white font-mono font-bold p-2 rounded-lg border border-slate-700"
                  />
                </div>

                <div className="p-3 bg-[#0f172a] rounded-xl space-y-1">
                  <span className="text-xs text-slate-300 font-semibold block">Mariage (x)</span>
                  <input
                    type="number"
                    value={mariageMult}
                    onChange={(e) => setMariageMult(Number(e.target.value))}
                    className="w-full bg-[#16213c] text-white font-mono font-bold p-2 rounded-lg border border-slate-700"
                  />
                </div>
              </div>

              {/* Maintenance Mode Global Toggle */}
              <div className="p-3.5 bg-[#0f172a] rounded-xl border border-amber-500/20 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${maintenanceMode ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>Mode Maintenance Global</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Affiche un bandeau d'alerte et prévient les utilisateurs des opérations en cours.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    maintenanceMode
                      ? 'bg-amber-500 text-black font-black shadow-md'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  {maintenanceMode ? 'ACTIF (EN PAUSE)' : 'DÉSACTIVÉ (EN LIGNE)'}
                </button>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Mettre à jour les cotes et paramètres
              </button>
            </div>
          )}

          {/* TAB 4: PUSH NOTIFICATIONS */}
          {activeTab === 'push' && (
            <form onSubmit={handleSendPush} className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Diffusion de Notifications Push (Firebase)
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Titre de la Notification :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tirage Borlette NY Soir disponible !"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full bg-[#16213c] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Message Push :
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Les résultats officiels du tirage sont en ligne. Consultez vos gains sur Full Bet !"
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  className="w-full bg-[#16213c] text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-amber-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Diffuser la Notification Push</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
