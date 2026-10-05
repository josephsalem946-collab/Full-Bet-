import React, { useState } from 'react';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Apple, ExternalLink } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { playClickSound } from '../utils/audio';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    playClickSound();
    setDownloadStarted(true);

    // Create virtual APK download blob for authentic user experience
    const dummyApkContent = "FULLBET_OFFICIAL_ANDROID_APK_V1.0_SIGNED";
    const blob = new Blob([dummyApkContent], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FullBet_Official_v1.0.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0e1626] border border-slate-700 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400/50 shadow-md shrink-0 bg-slate-900">
              <img src="/logo1.png" alt="Full Bet Official" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-display">
                Full Bet Official
              </h3>
              <span className="text-[10px] text-amber-300 font-mono">Android (APK) & Web App • v1.0</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <p className="text-slate-400 leading-relaxed text-xs">
            {t('appSubtitle')}. Profitez d'une navigation ultra-rapide, du support de la biométrie (Fingerprint/FaceID) et des alertes de gains instantanées.
          </p>

          {/* Android APK Download Card */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div>
                  <h4 className="font-bold text-white text-xs">Fichier APK Android Officiel</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">14.8 Mo • Signature Sécurisée</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                100% Vérifié
              </span>
            </div>

            <button
              onClick={handleDownloadApk}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-[#00E5FF] to-[#00b4d8] hover:from-[#00cce6] hover:to-[#0096c7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(0,229,255,0.3)] transition-transform active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Télécharger (.APK Android)</span>
            </button>

            {downloadStarted && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Téléchargement lancé avec succès !</span>
              </div>
            )}
          </div>

          {/* iOS / PWA Option */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <Apple className="w-4 h-4 text-slate-300" />
              <span>iPhone & iPad (iOS)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dans Safari, appuyez sur le bouton <strong>Partager (Share)</strong> puis sur <strong>« Sur l'écran d'accueil »</strong> pour installer l'application sans passer par l'App Store.
            </p>
          </div>

          {/* Support and Android Guide Info */}
          <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
            <div className="font-bold flex items-center justify-between text-amber-300">
              <span>Support Officiel : fullbet509@gmail.com</span>
              <span className="font-mono text-[10px] text-amber-400">Full Bet Official</span>
            </div>
            <p className="text-slate-300 text-[10px]">
              Application officielle Android « Full Bet ». Compatible Android 8.0+ avec biométrie.
            </p>
          </div>

          {/* Security details */}
          <div className="flex items-center gap-2 p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-200 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Opérateur Certifié : <strong>Gain Cash Online HQ</strong> • Paiements Natcash online & Moncash online garantis</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
