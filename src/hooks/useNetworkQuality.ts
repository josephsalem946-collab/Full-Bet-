import { useState, useEffect, useCallback } from 'react';

export type NetworkSpeed = 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface NetworkInformation extends EventTarget {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

const LOW_DATA_STORAGE_KEY = 'fullbet_low_data_mode';

export function useNetworkQuality() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [effectiveType, setEffectiveType] = useState<NetworkSpeed>('4g');
  const [rtt, setRtt] = useState<number>(50);
  const [downlink, setDownlink] = useState<number>(10);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(false);
  const [lowDataMode, setLowDataModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOW_DATA_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const online = navigator.onLine;
    setIsOnline(online);

    if (!online) {
      setEffectiveType('offline');
      return;
    }

    const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (conn) {
      const type = conn.effectiveType || '4g';
      setEffectiveType(type);
      setRtt(conn.rtt ?? 50);
      setDownlink(conn.downlink ?? 10);
      setIsDataSaver(Boolean(conn.saveData));
    } else {
      setEffectiveType('4g');
    }
  }, []);

  useEffect(() => {
    updateNetworkInfo();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const conn = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  const setLowDataMode = (enabled: boolean) => {
    setLowDataModeState(enabled);
    try {
      localStorage.setItem(LOW_DATA_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore storage failure
    }
  };

  // Connection is considered weak if slow-2g, 2g, rtt > 600, or user toggled lowDataMode
  const isWeak =
    !isOnline ||
    lowDataMode ||
    isDataSaver ||
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    rtt > 600 ||
    downlink < 0.6;

  return {
    isOnline,
    isWeak,
    effectiveType,
    rtt,
    downlink,
    isDataSaver,
    lowDataMode,
    setLowDataMode,
    refreshNetworkStatus: updateNetworkInfo
  };
}

export default useNetworkQuality;
