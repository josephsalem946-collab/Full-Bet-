import React, { useEffect, useRef } from 'react';
import { Flame, Activity, ExternalLink, Settings, Sparkles, Code2, Globe, Megaphone } from 'lucide-react';
import { AdBanner } from '../types';
import { playClickSound } from '../utils/audio';

interface DynamicAdBannerProps {
  banner?: AdBanner;
  isAdmin?: boolean;
  onEditBanner?: () => void;
  onNavigate?: (destination: string) => void;
}

export const DynamicAdBanner: React.FC<DynamicAdBannerProps> = ({
  banner,
  isAdmin = false,
  onEditBanner,
  onNavigate
}) => {
  const adSenseRef = useRef<HTMLDivElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // Load Google AdSense script dynamically when required
  useEffect(() => {
    if (banner?.bannerType === 'google_adsense' && banner.adSenseClientId) {
      const scriptId = 'google-adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(banner.adSenseClientId)}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Try triggering adsbygoogle push
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // In local or sandbox, adsbygoogle might throw if already loaded or blocked
      }
    }
  }, [banner?.bannerType, banner?.adSenseClientId, banner?.adSenseSlotId]);

  // Execute Ad Network custom script safely when specified
  useEffect(() => {
    if (banner?.bannerType === 'ad_network' && banner.adNetworkScript && scriptContainerRef.current) {
      scriptContainerRef.current.innerHTML = '';
      const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.text = banner.adNetworkScript;
      scriptContainerRef.current.appendChild(scriptEl);
    }
  }, [banner?.bannerType, banner?.adNetworkScript]);

  const handleBannerClick = () => {
    playClickSound();
    if (!banner?.redirectUrl) return;

    if (banner.redirectUrl.startsWith('http://') || banner.redirectUrl.startsWith('https://')) {
      window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigate) {
      onNavigate(banner.redirectUrl);
    }
  };

  // Admin Quick Edit Button
  const adminEditButton = isAdmin && onEditBanner && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        playClickSound();
        onEditBanner();
      }}
      className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-amber-400/50 text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer"
      title="Modifier la bannière publicitaire (HTML/CSS, Google AdSense, Régie)"
    >
      <Settings className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
      <span>Modifier la Bannière</span>
    </button>
  );

  // 1. Google AdSense Banner Type
  if (banner?.bannerType === 'google_adsense') {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0d162a] p-3 shadow-xl">
        {adminEditButton}
        
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-sky-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Publicité Google AdSense</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {banner.adSenseClientId || 'Client non configuré'}
          </span>
        </div>

        {/* Real AdSense Ins Element */}
        <div ref={adSenseRef} className="w-full flex justify-center items-center min-h-[90px] bg-slate-900/60 rounded-xl overflow-hidden p-2 border border-slate-800">
          {banner.adSenseClientId && banner.adSenseSlotId ? (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '90px' }}
              data-ad-client={banner.adSenseClientId}
              data-ad-slot={banner.adSenseSlotId}
              data-ad-format={banner.adSenseFormat || 'auto'}
              data-full-width-responsive="true"
            />
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs space-y-1">
              <Megaphone className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-pulse" />
              <div className="font-bold text-slate-200">Emplacement Google AdSense</div>
              <div className="text-[11px] text-slate-400">
                Configurez votre ID Client (ca-pub-...) et Slot ID dans le panneau Super-Admin.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Custom HTML / CSS Banner Type
  if (banner?.bannerType === 'custom_html') {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d162a] shadow-xl">
        {adminEditButton}

        {/* Inject custom CSS if defined */}
        {banner.customCss && (
          <style dangerouslySetInnerHTML={{ __html: banner.customCss }} />
        )}

        {/* Custom HTML container */}
        <div
          className="w-full p-4 sm:p-5"
          dangerouslySetInnerHTML={{
            __html: banner.customHtml || `
              <div style="background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); color: #ffffff; padding: 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="background: #ffb703; color: #0b132b; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">PROMO SPÉCIALE</span>
                  <h3 style="font-size: 20px; font-weight: 900; margin: 8px 0 4px 0; color: #ffffff;">${banner.title || 'FULL BET BONUS EXCLUSIF'}</h3>
                  <p style="font-size: 12px; color: #8d99ae; margin: 0;">HTML/CSS Personnalisé par la régie ou l'administrateur.</p>
                </div>
                <button style="background: #ffb703; color: #0b132b; font-weight: bold; font-size: 13px; padding: 10px 18px; border-radius: 12px; border: none; cursor: pointer;">
                  ${banner.ctaText || 'Profiter'}
                </button>
              </div>
            `
          }}
          onClick={handleBannerClick}
        />
      </div>
    );
  }

  // 3. Ad Network (Régie Publicitaire Externe) Type
  if (banner?.bannerType === 'ad_network') {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0d162a] p-3 shadow-xl">
        {adminEditButton}

        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-purple-400">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Régie Publicitaire Externe</span>
          </span>
          <span className="text-[10px] text-slate-500">Tag & Script Réseau</span>
        </div>

        {banner.adNetworkIframeUrl ? (
          <div className="w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex justify-center">
            <iframe
              src={banner.adNetworkIframeUrl}
              title="Publicité Régie"
              className="w-full min-h-[100px] border-0"
              scrolling="no"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        ) : (
          <div ref={scriptContainerRef} className="w-full min-h-[90px] bg-slate-900/60 rounded-xl p-3 flex flex-col justify-center items-center text-center text-xs text-slate-300">
            <Code2 className="w-6 h-6 text-purple-400 mb-1" />
            <div className="font-bold">Emplacement Script Régie Publicitaire</div>
            <div className="text-[11px] text-slate-400">
              {banner.adNetworkScript ? 'Script régie injecté' : 'Aucun script ou tag de régie configuré'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. Standard / Hero Image Banner Type (Default)
  const defaultBannerTitle = banner?.title || 'JACKPOT LIGUE DES CHAMPIONS • BOOST DE COTES +30%';
  const defaultImageUrl = banner?.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80';
  const defaultBadge = banner?.badgeText || 'OFFRE DU JOUR';
  const defaultCta = banner?.ctaText || 'Voir le direct';

  return (
    <div
      onClick={handleBannerClick}
      className="relative overflow-hidden rounded-2xl border border-blue-500/30 shadow-xl min-h-[140px] flex items-center group cursor-pointer transition-transform duration-300 hover:border-amber-400/50"
    >
      {adminEditButton}

      {/* Background Image with Dark Vignette Overlay */}
      <img
        src={defaultImageUrl}
        alt={defaultBannerTitle}
        className="absolute inset-0 w-full h-full object-cover brightness-[0.32] group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b]/95 via-[#0b132b]/75 to-transparent" />

      {/* Banner Content */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#ffb703] text-xs font-semibold border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{defaultBadge}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide drop-shadow-md">
            {defaultBannerTitle}
          </h2>

          <p className="text-xs text-slate-300 drop-shadow-sm leading-relaxed">
            Offre gérée en direct par Full Bet (fullbet.com). Cotes boostées & dépôts instantanés Moncash online / Natcash online.
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBannerClick();
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ffb703] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Activity className="w-4 h-4 text-slate-950" />
          <span>{defaultCta}</span>
        </button>
      </div>
    </div>
  );
};
