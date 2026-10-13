import { useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectActiveMode, setActiveMode } from "@/store/authSlice";
import { AppMode, homeForMode } from "@/lib/appMode";

export function useAppMode() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectActiveMode);
  const signedIn = useAppSelector(s => !!s.auth.user && !!s.auth.accessToken && s.auth.isAuthenticated);
  const switchMode = (next: AppMode) => {
    if (!signedIn || next === mode) return;
    dispatch(setActiveMode(next));
    router.replace(homeForMode(next));
  };
  return { mode, switchMode };
}

// Keep browser/native back navigation and explicit deep links in the displayed mode.
export function useModeRoute(mode: AppMode) {
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector(s => !!s.auth.user && !!s.auth.accessToken && s.auth.isAuthenticated);
  useFocusEffect(useCallback(() => {
    if (signedIn) dispatch(setActiveMode(mode));
  }, [dispatch, mode, signedIn]));
  return signedIn;
}
