import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Colors from "@/constants/colors";
import { Borders, ControlSize, Corners, Space } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { AppText } from "@/components/AppText";

/** KK/VerificationCode (1535:7866). One real input supports paste and OS OTP autofill. */
export function VerificationCode({ value, onChange, onComplete, error, disabled = false, label = "Verification code" }: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const code = value.replace(/[^0-9]/g, "").slice(0, 6);
  const currentDigit = Math.min(code.length, 5);
  return (
    <View style={styles.container}>
      <Pressable onPress={() => input.current?.focus()} disabled={disabled} accessible={false} style={styles.entry}>
        <View style={styles.digits} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden aria-hidden>
          {Array.from({ length: 6 }, (_, index) => {
            const active = focused && index === currentDigit;
            return (
              <View key={index} style={[styles.digit, {
                backgroundColor: disabled ? Colors.background : Colors.surface,
                borderColor: error ? Colors.error : active || code[index] ? Colors.primary : Colors.borderStrong,
                borderWidth: active && !error ? Borders.selected : Borders.thin,
              }]}>
                <AppText variant="otp">{code[index] ?? ""}</AppText>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={code}
          onChangeText={(text) => {
            const next = text.replace(/[^0-9]/g, "").slice(0, 6);
            onChange(next);
            if (next.length === 6 && next !== code) onComplete?.(next);
          }}
          selection={{ start: code.length, end: code.length }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          inputMode="numeric"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoCorrect={false}
          editable={!disabled}
          caretHidden
          accessibilityLabel={label}
          accessibilityHint={error ?? "Enter the six-digit code"}
          accessibilityState={{ disabled }}
          aria-disabled={disabled}
          style={styles.realInput}
        />
      </Pressable>
      {error ? <AppText variant="bodySmall" color={Colors.error} accessibilityLiveRegion="polite">{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Space.sm },
  entry: { minHeight: ControlSize.field },
  digits: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Space.sm, minHeight: ControlSize.field },
  digit: { width: ControlSize.otpWidth, height: ControlSize.otpHeight, flexShrink: 1, borderRadius: Corners.control, alignItems: "center", justifyContent: "center" },
  realInput: { ...StyleSheet.absoluteFillObject, ...Typography.otp, color: "transparent", opacity: 0.01, padding: 0, backgroundColor: "transparent" },
});
