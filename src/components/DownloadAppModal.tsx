import React, { useState } from 'react';
import { X, Smartphone, Download, CheckCircle2, ShieldCheck, Apple, ExternalLink, Package } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { playClickSound } from '../utils/audio';
import { APP_VERSION } from '../version';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'apk' | 'aab'>('apk');

  if (!isOpen) return null;

  const handleDownload = (format: 'apk' | 'aab') => {
    playClickSound();
    setDownloadFormat(format);
    setDownloadStarted(true);

    const isAab = format === 'aab';
    const filename = isAab ? APP_VERSION.aabFileName : APP_VERSION.apkFileName;
    const dummyContent = `GAIN_CASH_FULLBET_OFFICIAL_${format.toUpperCase()}_VERSION_${APP_VERSION.versionName}_BUILD_${APP_VERSION.versionCode}_SIGNED`;
    const mime = isAab ? 'application/octet-stream' : 'application/vnd.android.package-archive';
    
    const blob = new Blob([dummyContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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
            <div className="w-10 h-10 rounded-full overflow-hidden border border-sky-400/50 shadow-md shrink-0 bg-white p-0.5 flex items-center justify-center">
              <img src="/assets/aistudio/20261024_195031_0000_e0e7da2c.png" alt="Full Bet Official" className="w-full h-full object-contain rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-display">
                Full Bet Officiel
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {APP_VERSION.fullVersionString}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Code: {APP_VERSION.versionCode}
                </span>
              </div>
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
            {t('appSubtitle')}. Version officielle <strong>{APP_VERSION.versionName}</strong> optimisée avec support de la biométrie (Fingerprint/FaceID), tirages Borlette en direct et notifications instantanées.
          </p>

          {/* Android Package Download Card */}
          <div className="p-4 rounded-2xl bg-[#0a0f1d] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <div>
                  <h4 className="font-bold text-white text-xs">Package Android Officiel</h4>
                  <span className="text-[10px] text-emerald-400 font-mono">14.8 Mo • Version {APP_VERSION.versionName}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                100% Vérifié
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDownload('apk')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-[#00E5FF] to-[#00b4d8] hover:from-[#00cce6] hover:to-[#0096c7] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_4px_16px_rgba(0,229,255,0.3)] transition-transform active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-950" />
                <span>APK (Direct)</span>
              </button>
              <button
                onClick={() => handleDownload('aab')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#131d33] hover:bg-[#1a2745] text-amber-300 font-black text-xs uppercase tracking-wider rounded-xl border border-amber-500/40 shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-amber-300" />
                <span>AAB (Bundle)</span>
              </button>
            </div>

            {downloadStarted && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Téléchargement ({downloadFormat.toUpperCase()} {APP_VERSION.versionName}) lancé avec succès !</span>
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
            <span>Opérateur Certifié : <strong>Full Bet Online HQ</strong> • Paiements Natcash online & Moncash online garantis</span>
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
