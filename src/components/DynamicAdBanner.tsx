import React, { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Activity,
  Code2,
  Globe,
  Megaphone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdBanner } from '../types';
import { playClickSound } from '../utils/audio';
import { FULLBET_BANNER_CSS } from './FullBetBannerComponent';

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
  const customHtmlRef = useRef<HTMLDivElement>(null);

  // Fallback image & click delegation pou Custom HTML Banners
  useEffect(() => {
    if (currentBanner?.bannerType === 'custom_html' && customHtmlRef.current) {
      const images = customHtmlRef.current.querySelectorAll('img');
      images.forEach((img) => {
        img.onerror = () => {
          if (!img.src.includes('imaj1.webp')) {
            img.src = '/imaj1.webp';
          }
        };
      });
      const links = customHtmlRef.current.querySelectorAll('a, .banner-button');
      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          handleBannerClick();
        });
      });
    }
  }, [currentBanner?.bannerType, currentBanner?.customHtml]);

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
      } catch {
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

  // Carousel Controls Component (Flèches ultra-konpak san dots pou kenbe tout banyè nan yon sèl gwosè)
  const carouselControls = bannerList.length > 1 && (
    <>
      {/* Prev / Next manual arrows */}
      <div className="absolute inset-y-0 left-0.5 sm:left-1 z-20 flex items-center pointer-events-none">
        <button
          onClick={handlePrevBanner}
          className="pointer-events-auto w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-slate-700/60 shadow-md backdrop-blur-xs transition-all active:scale-90 cursor-pointer"
          title="Bannière précédente"
        >
          <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0.5 sm:right-1 z-20 flex items-center pointer-events-none">
        <button
          onClick={handleNextBanner}
          className="pointer-events-auto w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-slate-700/60 shadow-md backdrop-blur-xs transition-all active:scale-90 cursor-pointer"
          title="Bannière suivante"
        >
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </>
  );

  if (!currentBanner) return null;

  const defaultBannerTitle = currentBanner.title || 'BOOST DE COTES +30% • LIGUE DES CHAMPIONS';
  const defaultImageUrl =
    !currentBanner.imageUrl || currentBanner.imageUrl === 'imaj1.webp'
      ? '/imaj1.webp'
      : currentBanner.imageUrl;
  const defaultBadge = currentBanner.badgeText || 'OFFRE DU JOUR';
  const defaultCta = currentBanner.ctaText || 'Parier Direct';
  const defaultSubtitle = currentBanner.subtitle || currentBanner.description || 'Cotes boostées en direct • Paiements instantanés Moncash & Natcash.';

  return (
    <div
      className="relative w-full h-[136px] sm:h-[148px] rounded-2xl border border-slate-800/80 bg-[#0d1526] shadow-lg overflow-hidden select-none transition-all duration-200"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {carouselControls}

      <div key={currentBanner.id || currentIndex} className="w-full h-full animate-fadeIn">
        {/* 1. Google AdSense Banner Type */}
        {currentBanner.bannerType === 'google_adsense' && (
          <div className="w-full h-full flex flex-col justify-center items-center p-3 text-center">
            <div className="flex items-center justify-between w-full max-w-md mb-1 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-cyan-400">
                <Globe className="w-3 h-3" />
                <span>Publicité Partenaire</span>
              </span>
              <span className="font-mono text-[9px] text-slate-500 truncate max-w-[140px]">
                {currentBanner.adSenseClientId || 'Client'}
              </span>
            </div>
            <div ref={adSenseRef} className="w-full max-w-md flex justify-center items-center h-[80px] bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800">
              {currentBanner.adSenseClientId && currentBanner.adSenseSlotId ? (
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '74px' }}
                  data-ad-client={currentBanner.adSenseClientId}
                  data-ad-slot={currentBanner.adSenseSlotId}
                  data-ad-format={currentBanner.adSenseFormat || 'auto'}
                  data-full-width-responsive="true"
                />
              ) : (
                <div className="text-center py-1 text-slate-400 text-xs space-y-1">
                  <Megaphone className="w-4 h-4 text-amber-400 mx-auto" />
                  <div className="font-bold text-slate-200 text-xs">Espace Sponsorisé</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Custom HTML / CSS Banner Type */}
        {currentBanner.bannerType === 'custom_html' && (
          <div className="w-full h-full relative" onClick={handleBannerClick}>
            <style dangerouslySetInnerHTML={{ __html: currentBanner.customCss || FULLBET_BANNER_CSS }} />
            <div
              ref={customHtmlRef}
              className="w-full h-full"
              dangerouslySetInnerHTML={{
                __html: currentBanner.customHtml || `
                  <div class="full-bet-banner-wrapper">
                    <div class="full-bet-banner">
                      <div class="banner-content">
                        <h2 class="banner-title">${currentBanner.title || 'Aksyon an Ap Kòmanse!'}</h2>
                        <p class="banner-description">${currentBanner.subtitle || currentBanner.description || 'Jwe epi genyen sou pi bon platfòm lan ak pi gwo kòt yo.'}</p>
                        <a href="#" class="banner-button">${currentBanner.ctaText || 'Parier Direct'}</a>
                      </div>
                      <div class="banner-image-container">
                        <img src="/imaj1.webp" alt="Full Bet Sports" class="banner-image" />
                      </div>
                    </div>
                  </div>
                `
              }}
            />
          </div>
        )}

        {/* 3. Ad Network (Régie Publicitaire Externe) Type */}
        {currentBanner.bannerType === 'ad_network' && (
          <div className="w-full h-full flex flex-col justify-center items-center p-3 text-center">
            <div className="flex items-center justify-between w-full max-w-md mb-1 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Megaphone className="w-3 h-3" />
                <span>Régie Publicitaire Externe</span>
              </span>
              <span className="text-[9px] text-slate-500">Partenaire</span>
            </div>
            {currentBanner.adNetworkIframeUrl ? (
              <div className="w-full max-w-md h-[80px] overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex justify-center">
                <iframe
                  src={currentBanner.adNetworkIframeUrl}
                  title="Publicité Régie"
                  className="w-full h-full border-0"
                  scrolling="no"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            ) : (
              <div ref={scriptContainerRef} className="w-full max-w-md h-[80px] bg-slate-900/80 rounded-xl p-2 flex flex-col justify-center items-center text-center text-xs text-slate-300 border border-slate-800">
                <Code2 className="w-4 h-4 text-amber-400 mb-1" />
                <div className="font-bold text-xs">Régie Publicitaire</div>
                <div className="text-[11px] text-slate-400">
                  {currentBanner.adNetworkScript ? 'Contenu partenaire actif' : 'En attente de configuration'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3.5. Mode Image Pure / Direct Banner */}
        {currentBanner.bannerType === 'image_only' && (
          <div
            className="w-full h-full relative cursor-pointer group"
            onClick={handleBannerClick}
          >
            <img
              src={defaultImageUrl}
              alt={currentBanner.altText || 'Banyè Full Bet'}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('imaj1.webp')) {
                  img.src = '/imaj1.webp';
                }
              }}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        )}

        {/* 4. Standard / Hero Image Banner Type (Default) */}
        {(!currentBanner.bannerType || currentBanner.bannerType === 'image') && (
          <div
            onClick={handleBannerClick}
            className="w-full h-full relative cursor-pointer group flex items-center"
          >
            <img
              key={defaultImageUrl}
              src={defaultImageUrl}
              alt={currentBanner.altText || defaultBannerTitle || 'Banyè Full Bet'}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('imaj1.webp')) {
                  img.src = '/imaj1.webp';
                  return;
                }
                img.style.display = 'none';
              }}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.45] group-hover:scale-[1.02] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090e1a]/95 via-[#0d1526]/80 to-transparent" />

            <div className="relative z-10 w-full h-full px-7 sm:px-9 py-3 flex flex-row items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{defaultBadge}</span>
                </div>

                <h2 className="text-sm sm:text-lg font-black text-white font-display tracking-tight leading-tight line-clamp-1">
                  {defaultBannerTitle}
                </h2>

                <p className="text-[11px] sm:text-xs text-slate-300 leading-snug line-clamp-1 sm:line-clamp-2">
                  {defaultSubtitle}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap transition-transform active:scale-95"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{defaultCta}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
