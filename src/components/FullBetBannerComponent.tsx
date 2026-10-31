import React from 'react';
import { playClickSound } from '../utils/audio';

export interface FullBetBannerData {
  headline: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  image_alt: string;
}

interface FullBetBannerComponentProps {
  data?: Partial<FullBetBannerData>;
  onButtonClick?: () => void;
  onNavigate?: (destination: string) => void;
}

export const DEFAULT_FULLBET_BANNER_DATA: FullBetBannerData = {
  headline: "Aksyon an Ap Kòmanse!",
  description: "Jwe epi genyen sou pi bon platfòm lan ak pi gwo kòt yo.",
  button_text: "Parier Direct",
  button_link: "#",
  image_url: "https://via.placeholder.com/150",
  image_alt: "Full Bet Sports"
};

export const FULLBET_BANNER_HTML = `<div class="full-bet-banner-wrapper">
  <div class="full-bet-banner">
    <div class="banner-content">
      <h2 class="banner-title">Aksyon an Ap Kòmanse!</h2>
      <p class="banner-description">Jwe epi genyen sou pi bon platfòm lan ak pi gwo kòt yo.</p>
      <a href="#" class="banner-button">Parier Direct</a>
    </div>
    <div class="banner-image-container">
      <img src="https://via.placeholder.com/150" alt="Full Bet Sports" class="banner-image" />
    </div>
  </div>
</div>`;

export const FULLBET_BANNER_CSS = `.full-bet-banner-wrapper {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.full-bet-banner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #0d1b2a, #1b263b);
  color: #ffffff;
  border-radius: inherit;
  padding: 12px 18px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  gap: 12px;
}

.banner-content {
  flex: 1 1 65%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  height: 100%;
}

.banner-title {
  font-size: clamp(0.95rem, 2vw, 1.3rem);
  font-weight: 800;
  margin: 0;
  white-space: normal;
  word-break: break-word;
  color: #ffb703;
  line-height: 1.2;
}

.banner-description {
  font-size: clamp(0.72rem, 1.4vw, 0.85rem);
  margin: 0;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
  opacity: 0.92;
  color: #e2e8f0;
}

.banner-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #ffb703;
  color: #000814;
  font-weight: 800;
  font-size: clamp(0.72rem, 1.2vw, 0.82rem);
  padding: 6px 14px;
  border-radius: 6px;
  text-decoration: none;
  transition: transform 0.2s ease, background-color 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(255, 183, 3, 0.4);
  cursor: pointer;
  margin-top: 2px;
}

.banner-button:hover {
  background-color: #ffd166;
  transform: translateY(-1px);
}

.banner-image-container {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 32%;
  height: 100%;
}

.banner-image {
  max-width: 100%;
  max-height: 85px;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .full-bet-banner {
    padding: 10px 14px;
    gap: 8px;
  }

  .banner-content {
    gap: 3px;
  }

  .banner-image-container {
    max-width: 30%;
  }

  .banner-image {
    max-height: 75px;
  }

  .banner-button {
    padding: 5px 12px;
    font-size: 0.72rem;
  }
}`;

export const FullBetBannerComponent: React.FC<FullBetBannerComponentProps> = ({
  data = DEFAULT_FULLBET_BANNER_DATA,
  onButtonClick,
  onNavigate
}) => {
  const mergedData = { ...DEFAULT_FULLBET_BANNER_DATA, ...data };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    playClickSound();
    if (onButtonClick) {
      onButtonClick();
    } else if (onNavigate) {
      onNavigate('sports');
    }
  };

  return (
    <>
      <style>{FULLBET_BANNER_CSS}</style>
      <div className="full-bet-banner-wrapper">
        <div className="full-bet-banner" onClick={handleClick}>
          <div className="banner-content">
            <h2 className="banner-title">{mergedData.headline}</h2>
            <p className="banner-description">{mergedData.description}</p>
            <a
              href={mergedData.button_link}
              className="banner-button"
              onClick={handleClick}
            >
              {mergedData.button_text}
            </a>
          </div>
          <div className="banner-image-container">
            <img
              src={mergedData.image_url}
              alt={mergedData.image_alt}
              className="banner-image"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.includes('imaj1.webp')) {
                  img.src = '/imaj1.webp';
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
