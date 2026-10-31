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

  // Carousel Controls Component (Flèches ultra-konpak san gaspiye espas)
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
  const defaultImageUrl = currentBanner.imageUrl || 'imaj1.webp';
  const defaultBadge = currentBanner.badgeText || 'OFFRE DU JOUR';
  const defaultCta = currentBanner.ctaText || 'Voir l\'offre';
  const defaultSubtitle = currentBanner.subtitle || currentBanner.description || 'Offre officielle Full Bet. Cotes garanties & dépôts / retraits instantanés par Moncash et Natcash.';

  return (
    <div
      className="relative w-full h-[152px] sm:h-[138px] rounded-xl sm:rounded-2xl border border-blue-500/30 bg-[#0d162a] shadow-md overflow-hidden select-none transition-all duration-300"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {carouselControls}

      <div key={currentBanner.id || currentIndex} className="w-full h-full animate-fadeIn">
        {/* 1. Google AdSense Banner Type */}
        {currentBanner.bannerType === 'google_adsense' && (
          <div className="w-full h-full flex flex-col justify-center items-center p-3 text-center">
            <div className="flex items-center justify-between w-full max-w-md mb-1 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-sky-400">
                <Globe className="w-3 h-3" />
                <span>Publicité Google AdSense</span>
              </span>
              <span className="font-mono text-[9px] text-slate-500 truncate max-w-[140px]">
                {currentBanner.adSenseClientId || 'Client'}
              </span>
            </div>
            <div ref={adSenseRef} className="w-full max-w-md flex justify-center items-center h-[74px] bg-slate-900/60 rounded-lg overflow-hidden border border-slate-800">
              {currentBanner.adSenseClientId && currentBanner.adSenseSlotId ? (
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '70px' }}
                  data-ad-client={currentBanner.adSenseClientId}
                  data-ad-slot={currentBanner.adSenseSlotId}
                  data-ad-format={currentBanner.adSenseFormat || 'auto'}
                  data-full-width-responsive="true"
                />
              ) : (
                <div className="text-center py-1 text-slate-400 text-[11px] space-y-0.5">
                  <Megaphone className="w-4 h-4 text-amber-400 mx-auto animate-pulse" />
                  <div className="font-bold text-slate-200 text-xs">Emplacement Google AdSense</div>
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
                        <img src="/imaj1.webp" alt="Full Bet Sports" class="banner-image" onerror="this.src='/imaj1.webp'" />
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
            <div className="flex items-center justify-between w-full max-w-md mb-1 px-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-bold text-purple-400">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Régie Publicitaire Externe</span>
              </span>
              <span className="text-[10px] text-slate-500">Tag & Script</span>
            </div>
            {currentBanner.adNetworkIframeUrl ? (
              <div className="w-full max-w-md h-[74px] overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex justify-center">
                <iframe
                  src={currentBanner.adNetworkIframeUrl}
                  title="Publicité Régie"
                  className="w-full h-full border-0"
                  scrolling="no"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            ) : (
              <div ref={scriptContainerRef} className="w-full max-w-md h-[74px] bg-slate-900/60 rounded-lg p-2 flex flex-col justify-center items-center text-center text-xs text-slate-300">
                <Code2 className="w-4 h-4 text-purple-400 mb-0.5" />
                <div className="font-bold text-xs">Régie Publicitaire</div>
                <div className="text-[10px] text-slate-400">
                  {currentBanner.adNetworkScript ? 'Script régie injecté' : 'En attente de script régie'}
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
              src={currentBanner.imageUrl || 'imaj1.webp'}
              alt={currentBanner.altText || "Banyè Full Bet"}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.getAttribute('src') === 'imaj1.webp') {
                  img.src = '/imaj1.webp';
                }
              }}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        )}

        {/* 4. Standard / Hero Image Banner Type (Default) */}
        {(!currentBanner.bannerType || currentBanner.bannerType === 'image') && (
          <div
            onClick={handleBannerClick}
            className="w-full h-full relative cursor-pointer group flex items-center"
          >
            {/* Background Image with Dark Vignette Overlay & Fallback */}
            <img
              key={defaultImageUrl}
              src={defaultImageUrl}
              alt={currentBanner.altText || defaultBannerTitle || 'Banyè Full Bet'}
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
              className="absolute inset-0 w-full h-full object-cover brightness-[0.28] group-hover:scale-105 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b132b]/95 via-[#0b132b]/85 to-[#101d3b]/80" />

            {/* Banner Content - Uniform size layout */}
            <div className="relative z-10 w-full h-full px-3.5 sm:px-5 py-2.5 sm:py-3 pl-7 sm:pl-8 pr-7 sm:pr-8 flex flex-row items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-[#ffb703] text-[10px] sm:text-xs font-bold border border-amber-500/30">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
                  <span>{defaultBadge}</span>
                </div>

                <h2 className="text-xs sm:text-sm md:text-base font-black text-white font-display tracking-tight drop-shadow-xs leading-snug line-clamp-1 sm:line-clamp-2">
                  {defaultBannerTitle}
                </h2>

                <p className="text-[11px] sm:text-xs text-slate-200 drop-shadow-xs leading-tight line-clamp-1 sm:line-clamp-2">
                  {defaultSubtitle}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-[#ffb703] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Activity className="w-3.5 h-3.5 text-slate-950" />
                <span>{defaultCta}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
