import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-2 text-xs font-black text-black shadow-md hover:from-amber-400 hover:to-yellow-400 active:scale-95 transition-all cursor-pointer ${className}`}
        title="Enstale Aplikasyon Full Bet sou Telefòn ou"
      >
        <Smartphone className="w-4 h-4 text-black shrink-0" />
        <span>{variant === 'full' ? 'Enstale Full Bet sou Telefòn' : 'Enstale App'}</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{variant === 'full' ? 'Enstale sou iPhone' : 'Enstale App'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-amber-500/40 p-6 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Enstale sou iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Peze sou bouton <strong>Pataje (Share)</strong> ki anba nan navigatè Safari a.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Desann nan lis opsyon yo epi chwazi <strong>Ajoute sou ekran lakay (Sur l'écran d'accueil)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Peze <strong>Ajouter</strong> anwo adwat. Full Bet ap louvri tankou yon vrè aplikasyon natif menm si pa gen bon rezo !</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-black text-black hover:bg-amber-400 active:scale-95 transition-all"
              >
                Mwen konprann
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default PWAInstallButton;
