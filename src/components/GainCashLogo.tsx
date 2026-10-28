import React, { useState } from 'react';
import logo1 from '../assets/images/logo1.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'iconOnly';
}

export const GainCashLogo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  variant = 'full'
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/assets/aistudio/20261024_195031_0000_e0e7da2c.png');
  const [imageError, setImageError] = useState(false);
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isXl = size === 'xl';

  const imgSizeClass = isSm
    ? 'w-9 h-9 sm:w-10 sm:h-10'
    : isLg
    ? 'w-16 h-16'
    : isXl
    ? 'w-20 h-20 sm:w-24 sm:h-24'
    : 'w-11 h-11 sm:w-12 sm:h-12';

  const handleImageError = () => {
    if (imgSrc.includes('20261024_195031_0000')) {
      setImgSrc('/logo1.png');
    } else if (imgSrc !== '/logo1.webp') {
      setImgSrc('/logo1.webp');
    } else {
      setImageError(true);
    }
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Official Full Bet Circular Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        {!imageError ? (
          <img
            src={imgSrc}
            alt="Full Bet Official Logo"
            onError={handleImageError}
            className={`${imgSizeClass} rounded-full object-contain bg-white shadow-md transition-transform duration-200 hover:scale-105 border border-sky-400/50 p-0.5`}
          />
        ) : (
          <div
            className={`relative rounded-full bg-gradient-to-br from-amber-600 via-slate-900 to-cyan-900 border-2 border-amber-400/60 flex items-center justify-center overflow-hidden shadow-lg ${imgSizeClass}`}
          >
            <span className={isSm ? 'text-xs' : isLg ? 'text-2xl' : 'text-base'}>🎰</span>
          </div>
        )}
      </div>

      {/* Styled Typography for Full Bet (FULL in Gold, BET in Sky Blue) */}
      {variant !== 'iconOnly' && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black uppercase tracking-wider font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                isSm ? 'text-base' : isLg ? 'text-2xl' : isXl ? 'text-3xl' : 'text-lg'
              }`}
            >
              {/* FULL en or (Gold) */}
              <span
                className="text-amber-400 font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent"
                style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.45))' }}
              >
                FULL
              </span>
              {' '}
              {/* BET en bleu ciel (Sky Blue) */}
              <span
                className="text-sky-400 font-extrabold bg-gradient-to-r from-sky-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent"
                style={{ filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.45))' }}
              >
                BET
              </span>
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[9px] uppercase font-black tracking-widest text-black bg-white/95 px-1.5 py-0.5 rounded-xs mt-0.5 font-mono shadow-xs border border-slate-300 inline-block">
              PARIS SPORTIFS • CASINO • BORLETTE
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const FullBetLogo = GainCashLogo;
export default GainCashLogo;
