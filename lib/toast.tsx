import React, { createContext, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform, StyleSheet, useWindowDimensions, View } from "react-native";
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

const SLIDE_MS = 260;
const OFFSCREEN_Y = -160;
const DISMISS_DISTANCE = 36;
const DISMISS_VELOCITY = 0.5;

function Toast({ toast, onDismiss }: { toast: ToastConfig; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const text = [toast.title, toast.message].filter(Boolean).join(" ");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const y = useRef(new Animated.Value(OFFSCREEN_Y)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);
  const leaving = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Slide in from the top on mount.
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduce => {
      if (!live) return;
      reduceMotion.current = !!reduce;
      if (reduce) { y.setValue(0); opacity.setValue(1); return; }
      Animated.parallel([
        Animated.timing(y, { toValue: 0, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: SLIDE_MS, useNativeDriver: true }),
      ]).start();
    });
    return () => { live = false; };
  }, [y, opacity]);

  // Slide out (up by default, or off to the side when flicked), then remove the toast.
  const dismiss = useCallback((toX = 0, toY = OFFSCREEN_Y) => {
    if (leaving.current) return;
    leaving.current = true;
    if (reduceMotion.current) { onDismissRef.current(toast.id); return; }
    Animated.parallel([
      Animated.timing(y, { toValue: toY, duration: SLIDE_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(x, { toValue: toX, duration: SLIDE_MS, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: SLIDE_MS, useNativeDriver: true }),
    ]).start(() => onDismissRef.current(toast.id));
  }, [toast.id, x, y, opacity]);

  // Drag the toast with a finger: up or sideways far enough (or fast enough) throws it away.
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 || Math.abs(g.dx) > 6,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_, g) => { x.setValue(g.dx); y.setValue(Math.min(g.dy, 12)); },
    onPanResponderRelease: (_, g) => {
      setDragging(false);
      if (g.dy < -DISMISS_DISTANCE || g.vy < -DISMISS_VELOCITY) return dismiss(0, OFFSCREEN_Y);
      if (Math.abs(g.dx) > 80 || Math.abs(g.vx) > DISMISS_VELOCITY) return dismiss(g.dx < 0 ? -width : width, 0);
      Animated.parallel([
        Animated.spring(x, { toValue: 0, useNativeDriver: true }),
        Animated.spring(y, { toValue: 0, useNativeDriver: true }),
      ]).start();
    },
    onPanResponderTerminate: () => {
      setDragging(false);
      Animated.parallel([Animated.spring(x, { toValue: 0, useNativeDriver: true }), Animated.spring(y, { toValue: 0, useNativeDriver: true })]).start();
    },
  }), [dismiss, width, x, y]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = async () => {
      // Keep feedback available for screen-reader users; duration=0 is also persistent.
      const originalTimeout = toast.duration ?? (toast.type === "error" ? 8000 : 5000);
      if (originalTimeout <= 0 || focused || hovered || dragging) return;
      // RN Web's implementation always returns true; it cannot detect a screen reader.
      const screenReaderEnabled = Platform.OS === "web"
        ? false
        : await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
      if (cancelled || screenReaderEnabled) return;
      const timeout = Platform.OS === "android"
        ? await AccessibilityInfo.getRecommendedTimeoutMillis(originalTimeout).catch(() => originalTimeout)
        : originalTimeout;
      if (!cancelled) timer = setTimeout(() => dismiss(), timeout);
    };
    void startTimer();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [toast.id, toast.type, toast.duration, text, dismiss, focused, hovered, dragging]);

  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(text);
  }, [text]);

  return (
    <View style={[styles.position, { top: insets.top + Space.sm + 2 }]} pointerEvents="box-none">
      <Animated.View {...pan.panHandlers} style={[styles.banner, { opacity, transform: [{ translateX: x }, { translateY: y }] }]}>
        <FeedbackBanner message={text} tone={toast.type} onDismiss={() => dismiss()} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} />
      </Animated.View>
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
