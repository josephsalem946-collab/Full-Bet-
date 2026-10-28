import React, { useState } from 'react';
import { Wifi, WifiOff, Zap, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { useNetworkQuality } from '../hooks/useNetworkQuality';
import { getQueuedOfflineActions } from '../utils/offlineResilience';
import { playClickSound } from '../utils/audio';

interface NetworkResilienceBannerProps {
  inDrawer?: boolean;
}

export const NetworkResilienceBanner: React.FC<NetworkResilienceBannerProps> = ({ inDrawer = false }) => {
  const { isOnline, isWeak, effectiveType, lowDataMode, setLowDataMode, rtt } = useNetworkQuality();
  const [isExpanded, setIsExpanded] = useState(false);
  const queuedActions = getQueuedOfflineActions();

  // If inDrawer is false and connection is 4G/WiFi and not weak and not lowDataMode, hide
  if (!inDrawer && isOnline && !isWeak && !lowDataMode && queuedActions.length === 0) {
    return null;
  }

  // Drawer layout styling
  if (inDrawer) {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">
              État de la Connexion & Services
            </span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              setIsExpanded(!isExpanded);
            }}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isExpanded ? 'Fèmen' : 'Detay'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Status badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {!isOnline ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold">
                <WifiOff className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                <span>Mòd San Entènèt (Offline)</span>
              </div>
            ) : isWeak ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5 text-amber-600" />
                <span>Rezo Fèb ({effectiveType.toUpperCase()} • {rtt}ms)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rezo Nòmal ({effectiveType.toUpperCase()} • {rtt}ms)</span>
              </div>
            )}

            {queuedActions.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold">
                {queuedActions.length} an atant
              </span>
            )}
          </div>

          {/* Toggle Ekonomi Done */}
          <button
            onClick={() => {
              playClickSound();
              setLowDataMode(!lowDataMode);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-xs ${
              lowDataMode
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
            }`}
            title="Activer/désactiver l'économie de données pour zones à faible débit"
          >
            <Zap className={`w-3.5 h-3.5 ${lowDataMode ? 'text-slate-950 fill-current' : 'text-amber-500'}`} />
            <span>{lowDataMode ? 'Ekonomi Done: ON' : 'Ekonomi Done: OFF'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500 leading-snug">
          {!isOnline
            ? 'Aplikasyon an fonksyone ak done lokal yo. Pari yo ap anrejistre le rezo a retounen.'
            : lowDataMode
            ? 'Mòd ekonomi aktif : konsomasyon done redwi pou vitès maksimòm sou rezo ralanti.'
            : 'Optimizasyon pou rezo Ayiti (Natcom / Digicel) ak fonksyonman menm lè entènèt fèb.'}
        </p>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] space-y-1.5">
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700"><strong>Kach Lokal Aktif:</strong> Tout match ak rezilta bòlèt yo rete vizib san entènèt.</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-slate-700"><strong>Rediksyon Done:</strong> Imaj lou ak requêtes inutiles bloke pou garanti likidite.</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-slate-700"><strong>Senkronizasyon Otomatik:</strong> Tous les paris et transactions sont envoyés dès reconnexion.</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Classic top banner layout (when used elsewhere)
  return (
    <div className="w-full bg-[#0b1324] border-b border-amber-500/30 px-3 py-1.5 transition-all text-xs text-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span>Mòd San Entènèt (Offline)</span>
            </div>
          ) : isWeak ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              <Wifi className="w-3.5 h-3.5 text-amber-400" />
              <span>Rezo Fèb ({effectiveType.toUpperCase()} • {rtt}ms)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Mòd Ekonomi Done</span>
            </div>
          )}

          <span className="hidden sm:inline text-slate-300 text-[11px]">
            {!isOnline
              ? 'Aplikasyon an fonksyone ak done lokal ki anrejistre yo.'
              : lowDataMode
              ? 'Optimizasyon pou zòn ki gen rezo fèb aktive.'
              : 'Deteksyon rezo ralanti: app la redwi konsomasyon megabaýt.'}
          </span>

          {queuedActions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
              {queuedActions.length} aksyon an atant
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              playClickSound();
              setLowDataMode(!lowDataMode);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              lowDataMode
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>{lowDataMode ? 'Ekonomi Done: ON' : 'Aktive Mòd Fèb'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Detay koneksyon"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800 text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Kach Lokal Aktif:</strong> Tout match ak rezilta bòlèt yo rete vizib san entènèt.</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Frè Done Redwi:</strong> Imaj lou ak demann twò souvan bloke pou akselere vitès la.</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400 shrink-0" />
            <span><strong>Senkronizasyon Otomatik:</strong> Lè rezo a retounen, tout aksyon yo voye otomatikman.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkResilienceBanner;
