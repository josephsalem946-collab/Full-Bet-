import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  Fingerprint,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { UserProfile } from '../types';
import { playClickSound, playWinSound } from '../utils/audio';
import { formaterEtMasquer } from '../utils/securityMasking';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenRules: () => void;
  onOpenWallet: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onOpenRules,
  onOpenWallet
}) => {
  const [name, setName] = useState(user.fullName || 'Utilisateur');
  const [biometrics, setBiometrics] = useState(user.biometricsEnabled);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onUpdateUser({
        fullName: name,
        biometricsEnabled: biometrics
      });
      playWinSound();
      alert("Profil mis à jour avec succès !");
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#0c1322] text-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-[#0f172a] flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white font-display">
              Mon Profil & Sécurité
            </h3>
          </div>
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

        {/* Profile Card Summary */}
        <div className="p-5 bg-gradient-to-r from-[#0d1c38] to-[#0c1322] border-b border-slate-800 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-black shadow-lg">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-base text-white">{formaterEtMasquer(name, 'nom')}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 18+ Vérifié
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {user.id}</span>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Full Name */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Nom ou Pseudonyme :
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#141f36] text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-500 outline-hidden"
            />
          </div>

          {/* Masked Phone Number as requested */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Numéro de Téléphone (Authentification) :
            </label>
            <div className="flex items-center justify-between bg-[#11192e] px-3.5 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono">
              <span>{formaterEtMasquer(user.phone, 'telephone') || 'Numéro masqué'}</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Sécurisé</span>
            </div>
          </div>

          {/* Masked Moncash online & Natcash online info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#11192e] p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MonCash Online Associé</span>
              <span className="font-mono text-slate-300 font-bold">Numéro masqué</span>
            </div>
            <div className="bg-[#11192e] p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px]">NatCash Online Associé</span>
              <span className="font-mono text-slate-300 font-bold">Numéro masqué</span>
            </div>
          </div>

          {/* Biometrics Toggle (TouchID / FaceID) */}
          <div className="bg-[#11192e] p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-cyan-400" />
              <div>
                <span className="font-bold text-white block">Biométrie (Empreinte / FaceID)</span>
                <span className="text-[11px] text-slate-400">Connexion rapide à l'application</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={biometrics}
              onChange={(e) => setBiometrics(e.target.checked)}
              className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Quick links */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRules();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#141f36] hover:bg-[#1a2846] text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Règles & Conditions d'utilisation</span>
              </div>
              <span className="text-cyan-400 text-xs">Consulter →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWallet();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#141f36] hover:bg-[#1a2846] text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Gérer les Passerelles de Paiement</span>
              </div>
              <span className="text-emerald-400 text-xs">Caisse →</span>
            </button>
          </div>

          {/* Save CTA */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all active:scale-98"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </button>
        </form>

      </div>
    </div>
  );
};
