import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Updates from "expo-updates";

export interface OTAUpdateState {
  isChecking: boolean;
  isDownloading: boolean;
  isReady: boolean; // update downloaded, waiting for reload
  error: string | null;
  applyUpdate: () => void;
}

const POLL_INTERVAL_MS = 15 * 60 * 1000; // re-check every 15 min while app is open

export function useOTAUpdate(): OTAUpdateState {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTA updates are only meaningful on native (expo-updates doesn't run on web)
  // and only in release builds (disabled in Expo Go / dev client).
  const enabled = Platform.OS !== "web" && !__DEV__;

  async function checkAndFetch() {
    if (!enabled) return;
    setIsChecking(true);
    setError(null);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) return;

      setIsChecking(false);
      setIsDownloading(true);
      await Updates.fetchUpdateAsync();
      setIsDownloading(false);
      setIsReady(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update check failed");
    } finally {
      setIsChecking(false);
      setIsDownloading(false);
    }
  }

  function applyUpdate() {
    if (!isReady) return;
    Updates.reloadAsync();
  }

  // Check on mount
  useEffect(() => {
    checkAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check when the app returns to the foreground
  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndFetch();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Periodic background poll
  useEffect(() => {
    if (!enabled) return;
    timerRef.current = setInterval(checkAndFetch, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { isChecking, isDownloading, isReady, error, applyUpdate };
}
