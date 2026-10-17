import React, { useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, KeyboardAvoidingViewProps, Platform } from "react-native";

/**
 * Lifts what is inside it above the on-screen keyboard, on both iOS and Android.
 *
 * Android used to resize the window for the keyboard, so the old code passed no behaviour there. Since Expo SDK 54 the app
 * draws edge to edge and Android no longer resizes the window, so the keyboard covered the input. Expo's edge-to-edge guide
 * says Android now needs KeyboardAvoidingView, as iOS always did. "padding" is the setting that works on both.
 * Use it around the whole screen (header, body and footer), never around only the footer.
 */
export function KeyboardSafeView({ behavior = "padding", keyboardVerticalOffset = 0, ...props }: KeyboardAvoidingViewProps) {
  return <KeyboardAvoidingView {...props} behavior={behavior} keyboardVerticalOffset={keyboardVerticalOffset} />;
}

/** True while the keyboard is open. Used to drop the extra bottom space under a footer that now sits right on the keyboard. */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return visible;
}
