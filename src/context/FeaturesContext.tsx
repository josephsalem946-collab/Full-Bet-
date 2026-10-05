import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdBanner, TicketIssuer, ActiveFeaturesConfig, UserProfile } from '../types';
import { fetchActiveFeaturesConfig, sendClientHeartbeat } from '../utils/api';

interface FeaturesContextType {
  games: Record<string, boolean>;
  maintenanceMessages: Record<string, string>;
  lockedMatches: string[];
  banners: AdBanner[];
  ticketIssuerDefault?: TicketIssuer;
  isGameActive: (gameKey: string) => boolean;
  isMatchLocked: (matchId: string) => boolean;
  getGameMaintenanceMessage: (gameKey: string) => string;
  refreshFeatures: () => Promise<void>;
  forceLogoutMessage: string | null;
  clearForceLogout: () => void;
}

const defaultGames: Record<string, boolean> = {
  borlette_ny_midi: true,
  borlette_ny_soir: true,
  borlette_fl_midi: true,
  borlette_fl_soir: true,
  borlette_ga: false,
  casino_roulette: true,
  casino_crash: true,
  casino_slots: true,
  casino_luckyx: true,
  casino_luckysix: true,
  casino_keno: true,
  sports_football: true,
  sports_basketball: true,
  sports_tennis: true
};

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

interface FeaturesProviderProps {
  children: React.ReactNode;
  user?: UserProfile;
  onForceLogout?: (reason: string) => void;
}

export const FeaturesProvider: React.FC<FeaturesProviderProps> = ({
  children,
  user,
  onForceLogout
}) => {
  const [games, setGames] = useState<Record<string, boolean>>(defaultGames);
  const [maintenanceMessages, setMaintenanceMessages] = useState<Record<string, string>>({});
  const [lockedMatches, setLockedMatches] = useState<string[]>([]);
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [ticketIssuerDefault, setTicketIssuerDefault] = useState<TicketIssuer | undefined>(undefined);
  const [forceLogoutMessage, setForceLogoutMessage] = useState<string | null>(null);

  useEffect(() => {
    if (forceLogoutMessage && onForceLogout) {
      onForceLogout(forceLogoutMessage);
      setForceLogoutMessage(null);
    }
  }, [forceLogoutMessage, onForceLogout]);

  const refreshFeatures = useCallback(async () => {
    try {
      const res = await fetchActiveFeaturesConfig();
      if (res.status === 'success') {
        if (res.games) setGames(res.games);
        if (res.maintenanceMessages) setMaintenanceMessages(res.maintenanceMessages);
        if (res.lockedMatches) setLockedMatches(res.lockedMatches);
        if (res.banners) setBanners(res.banners);
        if (res.ticketIssuerDefault) setTicketIssuerDefault(res.ticketIssuerDefault);
      }
    } catch (err) {
      console.warn('[FeaturesContext] Bootstrap active-features notice:', err);
    }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await sendClientHeartbeat();
      if ((res as any).forceLogout) {
        setForceLogoutMessage((res as any).error || 'Votre compte a été suspendu par la direction.');
      }
    } catch {
      // Ignorer les erreurs réseau passagères
    }
  }, []);

  useEffect(() => {
    refreshFeatures();
    sendHeartbeat();

    // Polling régulier pour la prise en compte des kill-switches et bannières sans rafraîchir l'application
    const interval = setInterval(() => {
      refreshFeatures();
      sendHeartbeat();
    }, 20000);

    return () => clearInterval(interval);
  }, [refreshFeatures, sendHeartbeat]);

  const isGameActive = useCallback(
    (gameKey: string): boolean => {
      if (games[gameKey] === undefined) return true;
      return games[gameKey];
    },
    [games]
  );

  const isMatchLocked = useCallback(
    (matchId: string): boolean => {
      return lockedMatches.includes(matchId);
    },
    [lockedMatches]
  );

  const getGameMaintenanceMessage = useCallback(
    (gameKey: string): string => {
      return maintenanceMessages[gameKey] || 'Ce jeu est temporairement indisponible pour maintenance.';
    },
    [maintenanceMessages]
  );

  const clearForceLogout = () => setForceLogoutMessage(null);

  return (
    <FeaturesContext.Provider
      value={{
        games,
        maintenanceMessages,
        lockedMatches,
        banners,
        ticketIssuerDefault,
        isGameActive,
        isMatchLocked,
        getGameMaintenanceMessage,
        refreshFeatures,
        forceLogoutMessage,
        clearForceLogout
      }}
    >
      {children}
    </FeaturesContext.Provider>
  );
};

export const useFeatures = (): FeaturesContextType => {
  const ctx = useContext(FeaturesContext);
  if (!ctx) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return ctx;
};
