import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface ScrollToTopProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  threshold?: number;
  autoHideMs?: number;
}

/**
 * Bouton Scroll-to-Top an lò (Gold Edition)
 * Karakteristik :
 * - Bèl koulè lò metalik (Gold gradient + Amber/Yellow glow + bordure dorée)
 * - Disparèt otomatikman aprè 5 segond depi pa gen aksyon/defilman
 * - Parèt imedyatman lè itilizatè a kòmanse defile
 * - Rete vizib si itilizatè a pase souri l (hover) sou li
 */
export const ScrollToTopButton: React.FC<ScrollToTopProps> = ({
  targetRef,
  className = '',
  threshold = 180,
  autoHideMs = 5000
}) => {
  const [isScrolledPastThreshold, setIsScrolledPastThreshold] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveredRef = useRef(false);

  // Kòmanse oswa reset revèy 5 segond la
  const resetInactivityTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    setIsActive(true);

    // Si itilizatè a pa sou bouton an, li disparèt aprè autoHideMs (5 segond)
    if (!isHoveredRef.current) {
      hideTimerRef.current = setTimeout(() => {
        if (!isHoveredRef.current) {
          setIsActive(false);
        }
      }, autoHideMs);
    }
  }, [autoHideMs]);

  useEffect(() => {
    const handleScroll = () => {
      let scrolled = 0;
      if (targetRef && targetRef.current) {
        scrolled = targetRef.current.scrollTop;
      } else {
        scrolled = window.scrollY || document.documentElement.scrollTop;
      }

      if (scrolled > threshold) {
        setIsScrolledPastThreshold(true);
        resetInactivityTimer();
      } else {
        setIsScrolledPastThreshold(false);
        setIsActive(false);
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }
      }
    };

    const targetEl = targetRef?.current;
    if (targetEl) {
      targetEl.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (targetEl) {
        targetEl.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [targetRef, threshold, resetInactivityTimer]);

  const scrollToTop = () => {
    try {
      playClickSound();
    } catch {
      // Audio optional
    }

    if (targetRef && targetRef.current) {
      targetRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    setIsActive(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    resetInactivityTimer();
  };

  const isVisible = isScrolledPastThreshold && isActive;

  return (
    <div
      className={`fixed bottom-6 right-5 sm:right-7 z-50 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-75 translate-y-3 pointer-events-none'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Retounen anlè"
        title="Retounen anlè paj la"
        className={`group relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#B8860B] via-[#FFD700] to-[#FFF3A8] text-[#1a1202] shadow-[0_0_24px_rgba(255,215,0,0.5),0_8px_20px_rgba(0,0,0,0.5)] border-2 border-[#FFE885] transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_32px_rgba(255,215,0,0.8),0_10px_25px_rgba(0,0,0,0.6)] focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:ring-offset-2 focus:ring-offset-[#0D1322] cursor-pointer ${className}`}
      >
        {/* Ti efè limyè refleksyon anlè a */}
        <div className="absolute top-1 left-2 right-2 h-2.5 rounded-full bg-white/40 blur-[1px] pointer-events-none" />

        {/* Halo animasyon anlè */}
        <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-pulse pointer-events-none" />

        {/* Flèch an lò/nwa ki monte anlè */}
        <ChevronUp className="w-6 h-6 stroke-[3] text-[#1a1202] transition-transform duration-300 group-hover:-translate-y-1 drop-shadow-sm" />
      </button>
    </div>
  );
};

export const ScrollToTop = ScrollToTopButton;
