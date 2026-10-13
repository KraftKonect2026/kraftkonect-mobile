import React, { createContext, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedbackBanner, FeedbackTone } from "@/components/FeedbackBanner";
import { Space } from "@/constants/layout";

interface ToastConfig {
  id: number;
  type: FeedbackTone;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: FeedbackTone, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const toastRef = React.createRef<ToastContextType>();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

function Toast({ toast, onDismiss }: { toast: ToastConfig; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  const text = [toast.title, toast.message].filter(Boolean).join(" ");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = async () => {
      // Keep feedback available for screen-reader users; duration=0 is also persistent.
      const originalTimeout = toast.duration ?? (toast.type === "error" ? 8000 : 5000);
      if (originalTimeout <= 0 || focused || hovered) return;
      // RN Web's implementation always returns true; it cannot detect a screen reader.
      const screenReaderEnabled = Platform.OS === "web"
        ? false
        : await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
      if (cancelled || screenReaderEnabled) return;
      const timeout = Platform.OS === "android"
        ? await AccessibilityInfo.getRecommendedTimeoutMillis(originalTimeout).catch(() => originalTimeout)
        : originalTimeout;
      if (!cancelled) timer = setTimeout(() => onDismiss(toast.id), timeout);
    };
    void startTimer();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [toast.id, toast.type, toast.duration, text, onDismiss, focused, hovered]);

  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <View style={[styles.position, { top: insets.top + Space.sm + 2 }]} pointerEvents="box-none">
      <FeedbackBanner message={text} tone={toast.type} onDismiss={() => onDismiss(toast.id)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={styles.banner} />
    </View>
  );
}

/** Existing toast API retained; feedback is now Figma's top banner. Queue avoids overlaps. */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const sequence = useRef(0);
  const showToast = useCallback((type: FeedbackTone, title: string, message?: string, duration?: number) => {
    const id = ++sequence.current;
    setToasts((previous) => [...previous, { id, type, title, message, duration }]);
  }, []);
  const success = useCallback((title: string, message?: string, duration?: number) => showToast("success", title, message, duration), [showToast]);
  const error = useCallback((title: string, message?: string, duration?: number) => showToast("error", title, message, duration), [showToast]);
  const warning = useCallback((title: string, message?: string, duration?: number) => showToast("warning", title, message, duration), [showToast]);
  const info = useCallback((title: string, message?: string, duration?: number) => showToast("info", title, message, duration), [showToast]);
  const value = useMemo(() => ({ showToast, success, error, warning, info }), [showToast, success, error, warning, info]);
  useImperativeHandle(toastRef, () => value, [value]);
  const onDismiss = useCallback((id: number) => setToasts((previous) => previous.filter((toast) => toast.id !== id)), []);
  const active = toasts[0];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {active ? <View style={StyleSheet.absoluteFill} pointerEvents="box-none"><Toast key={active.id} toast={active} onDismiss={onDismiss} /></View> : null}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  position: { position: "absolute", left: Space.page, right: Space.page, alignItems: "center", zIndex: 9999, elevation: 20 },
  banner: { width: "100%", maxWidth: 480 },
});
