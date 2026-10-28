import React, { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Activity,
  Settings,
  Code2,
  Globe,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Gift
} from 'lucide-react';
import { AdBanner } from '../types';
import { playClickSound } from '../utils/audio';

interface DynamicAdBannerProps {
  banner?: AdBanner;
  banners?: AdBanner[];
  isAdmin?: boolean;
  onEditBanner?: () => void;
  onNavigate?: (destination: string) => void;
  autoRotateInterval?: number; // milliseconds
}

export const DynamicAdBanner: React.FC<DynamicAdBannerProps> = ({
  banner,
  banners,
  isAdmin = false,
  onEditBanner,
  onNavigate,
  autoRotateInterval = 45000 // 45 segond pou chak banyè
}) => {
  // Normalize the list of banners
  const bannerList: AdBanner[] = React.useMemo(() => {
    if (banners && banners.length > 0) {
      return banners.filter(b => b.isActive !== false);
    }
    if (banner) {
      return [banner];
    }
    return [];
  }, [banners, banner]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotation if there are multiple banners
  useEffect(() => {
    if (bannerList.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerList.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [bannerList.length, isPaused, autoRotateInterval]);

  // Keep index in range
  useEffect(() => {
    if (currentIndex >= bannerList.length && bannerList.length > 0) {
      setCurrentIndex(0);
    }
  }, [bannerList.length, currentIndex]);

  const currentBanner = bannerList[currentIndex] || banner;

  const handleNextBanner = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playClickSound();
    if (bannerList.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % bannerList.length);
    }
  };

  const handlePrevBanner = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    playClickSound();
    if (bannerList.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + bannerList.length) % bannerList.length);
    }
  };

  const adSenseRef = useRef<HTMLDivElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  // Load Google AdSense script dynamically when required
  useEffect(() => {
    if (currentBanner?.bannerType === 'google_adsense' && currentBanner.adSenseClientId) {
      const scriptId = 'google-adsense-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(currentBanner.adSenseClientId)}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        // Silently catch blocked/local ads
      }
    }
  }, [currentBanner?.bannerType, currentBanner?.adSenseClientId, currentBanner?.adSenseSlotId]);

  // Execute Ad Network custom script safely when specified
  useEffect(() => {
    if (currentBanner?.bannerType === 'ad_network' && currentBanner.adNetworkScript && scriptContainerRef.current) {
      scriptContainerRef.current.innerHTML = '';
      const scriptEl = document.createElement('script');
      scriptEl.type = 'text/javascript';
      scriptEl.text = currentBanner.adNetworkScript;
      scriptContainerRef.current.appendChild(scriptEl);
    }
  }, [currentBanner?.bannerType, currentBanner?.adNetworkScript]);

  const handleBannerClick = () => {
    playClickSound();
    if (!currentBanner?.redirectUrl) return;

    if (currentBanner.redirectUrl.startsWith('http://') || currentBanner.redirectUrl.startsWith('https://')) {
      window.open(currentBanner.redirectUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigate) {
      onNavigate(currentBanner.redirectUrl);
    }
  };

  // Carousel Controls Component (Flèches discrètes sans indicateur de page / pagination)
  const carouselControls = bannerList.length > 1 && (
    <>
      {/* Prev / Next manual arrows */}
      <div className="absolute inset-y-0 left-1 z-20 flex items-center pointer-events-none">
        <button
          onClick={handlePrevBanner}
          className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-amber-400 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-90"
          title="Bannière précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-1 z-20 flex items-center pointer-events-none">
        <button
          onClick={handleNextBanner}
          className="pointer-events-auto p-1.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-amber-400 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-90"
          title="Bannière suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  // Note: Le bouton « Gérer les Bannières » a été retiré de l'interface publique/configuration
  // et est désormais exclusivement accessible dans le Panneau Propriétaire 2FA (HQ).
  const adminEditButton = null;

  // 1. Google AdSense Banner Type
  if (currentBanner?.bannerType === 'google_adsense') {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0d162a] p-3 shadow-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {adminEditButton}
        {carouselControls}
        
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-sky-400">
            <Globe className="w-3.5 h-3.5" />
            <span>Publicité Google AdSense</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {currentBanner.adSenseClientId || 'Client non configuré'}
          </span>
        </div>

        <div ref={adSenseRef} className="w-full flex justify-center items-center min-h-[90px] bg-slate-900/60 rounded-xl overflow-hidden p-2 border border-slate-800">
          {currentBanner.adSenseClientId && currentBanner.adSenseSlotId ? (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '90px' }}
              data-ad-client={currentBanner.adSenseClientId}
              data-ad-slot={currentBanner.adSenseSlotId}
              data-ad-format={currentBanner.adSenseFormat || 'auto'}
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
  if (currentBanner?.bannerType === 'custom_html') {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d162a] shadow-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {adminEditButton}
        {carouselControls}

        {currentBanner.customCss && (
          <style dangerouslySetInnerHTML={{ __html: currentBanner.customCss }} />
        )}

        <div
          className="w-full p-4 sm:p-5"
          dangerouslySetInnerHTML={{
            __html: currentBanner.customHtml || `
              <div style="background: linear-gradient(135deg, #0b132b 0%, #1c2541 100%); color: #ffffff; padding: 18px 22px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; gap: 16px;">
                <div>
                  <span style="background: #ffb703; color: #0b132b; font-weight: bold; font-size: 11px; padding: 2px 8px; border-radius: 10px; text-transform: uppercase;">PROMO SPÉCIALE</span>
                  <h3 style="font-size: 17px; font-weight: 800; margin: 6px 0 4px 0; color: #ffffff;">${currentBanner.title || 'FULL BET BONUS EXCLUSIF'}</h3>
                  <p style="font-size: 13px; color: #e2e8f0; margin: 0; line-height: 1.4;">${currentBanner.subtitle || currentBanner.description || 'HTML/CSS Personnalisé par la régie ou l\'administrateur.'}</p>
                </div>
                <button style="background: #ffb703; color: #0b132b; font-weight: bold; font-size: 13px; padding: 9px 18px; border-radius: 10px; border: none; cursor: pointer;">
                  ${currentBanner.ctaText || 'Profiter'}
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
  if (currentBanner?.bannerType === 'ad_network') {
    return (
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0d162a] p-3 shadow-xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {adminEditButton}
        {carouselControls}

        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-bold text-purple-400">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Régie Publicitaire Externe</span>
          </span>
          <span className="text-[10px] text-slate-500">Tag & Script Réseau</span>
        </div>

        {currentBanner.adNetworkIframeUrl ? (
          <div className="w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex justify-center">
            <iframe
              src={currentBanner.adNetworkIframeUrl}
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
              {currentBanner.adNetworkScript ? 'Script régie injecté' : 'Aucun script ou tag de régie configuré'}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3.5. Mode Image Pure / Direct Banner (sans texte par-dessus)
  if (currentBanner?.bannerType === 'image_only') {
    const rawImgUrl = currentBanner.imageUrl || 'imaj1.webp';
    return (
      <div
        onClick={handleBannerClick}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative overflow-hidden rounded-2xl border border-blue-500/30 shadow-xl group cursor-pointer transition-transform duration-300 hover:border-amber-400/50"
      >
        {adminEditButton}
        {carouselControls}
        <img
          src={rawImgUrl}
          alt={currentBanner.altText || "Banyè Full Bet"}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.getAttribute('src') === 'imaj1.webp') {
              img.src = '/imaj1.webp';
              return;
            }
          }}
          className="w-full h-auto max-h-[160px] sm:max-h-[180px] object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
    );
  }

  // 4. Standard / Hero Image Banner Type (Default)
  const defaultBannerTitle = currentBanner?.title || 'BOOST DE COTES +30% • LIGUE DES CHAMPIONS';
  const defaultImageUrl = currentBanner?.imageUrl || 'imaj1.webp';
  const defaultBadge = currentBanner?.badgeText || 'OFFRE DU JOUR';
  const defaultCta = currentBanner?.ctaText || 'Voir l\'offre';
  const defaultSubtitle = currentBanner?.subtitle || currentBanner?.description || 'Offre officielle Full Bet. Cotes garanties & dépôts / retraits instantanés par Moncash et Natcash.';

  return (
    <div
      onClick={handleBannerClick}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-2xl border border-blue-500/30 shadow-xl min-h-[140px] sm:min-h-[155px] flex items-center group cursor-pointer transition-transform duration-300 hover:border-amber-400/50"
    >
      {adminEditButton}
      {carouselControls}

      {/* Background Image with Dark Vignette Overlay & Fallback */}
      <img
        key={defaultImageUrl}
        src={defaultImageUrl}
        alt={currentBanner?.altText || defaultBannerTitle || 'Banyè Full Bet'}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.getAttribute('src') === 'imaj1.webp') {
            img.src = '/imaj1.webp';
            return;
          }
          img.style.display = 'none';
        }}
        className="absolute inset-0 w-full h-full object-cover brightness-[0.34] group-hover:scale-105 transition-all duration-700 animate-fadeIn"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b]/95 via-[#0b132b]/80 to-[#101d3b]/70" />

      {/* Banner Content */}
      <div className="relative z-10 p-4 sm:p-5 pl-7 sm:pl-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[#ffb703] text-[11px] sm:text-xs font-semibold border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{defaultBadge}</span>
          </div>

          {/* Titre ogmante yon ti gwosè (Heading / Title) */}
          <h2 className="text-base sm:text-lg md:text-xl font-black text-white font-display tracking-tight drop-shadow-md leading-tight">
            {defaultBannerTitle}
          </h2>

          {/* Sous-titre / Deskripsyon ogmante yon ti gwosè (Subtitle / Description) */}
          <p className="text-xs sm:text-sm text-slate-200/95 drop-shadow-sm leading-relaxed max-w-xl">
            {defaultSubtitle}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBannerClick();
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ffb703] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer mb-1 sm:mb-0 mr-1 sm:mr-0"
        >
          <Activity className="w-3.5 h-3.5 text-slate-950" />
          <span>{defaultCta}</span>
        </button>
      </div>
    </div>
  );
};
