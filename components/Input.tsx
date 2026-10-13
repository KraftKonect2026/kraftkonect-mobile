import React, { forwardRef, useState } from "react";
import { Animated, Pressable, StyleProp, StyleSheet, TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import Colors from "@/constants/colors";
import { Borders, ControlSize, Corners, Space } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { AppText } from "@/components/AppText";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  touched?: boolean;
  prefix?: string;
  neutralBorderColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
}

/** KK/Field (859:489). Native input behaviour controls focus and filled states. */
export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, touched, prefix, neutralBorderColor, containerStyle, inputStyle, icon, style, secureTextEntry, multiline, editable = true, onFocus, onBlur, accessibilityLabel, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const hasError = Boolean(error && (touched ?? true));
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <AppText variant="labelSmall">{label}</AppText> : null}
      <Animated.View style={[
        styles.field,
        { minHeight: multiline ? ControlSize.multiline : ControlSize.field,
          backgroundColor: editable ? Colors.surface : Colors.background,
          borderColor: hasError ? Colors.error : focused ? Colors.primary : neutralBorderColor ?? Colors.borderStrong,
          borderWidth: focused && !hasError ? Borders.selected : Borders.thin },
        multiline && styles.multiline,
        style,
      ]}>
        {icon}
        {prefix ? <><AppText variant="labelSupport" style={styles.prefix}>{prefix}</AppText><View style={styles.divider} /></> : null}
        <TextInput
          {...props}
          ref={ref}
          editable={editable}
          multiline={multiline}
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          accessibilityState={{ ...props.accessibilityState, disabled: !editable }}
          aria-disabled={!editable}
          placeholderTextColor={editable ? Colors.textPlaceholder : Colors.disabled}
          secureTextEntry={secureTextEntry ? hidden : false}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[styles.input, { color: editable ? Colors.textPrimary : Colors.disabled }, multiline && styles.multilineInput, inputStyle]}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((value) => !value)} disabled={!editable} accessibilityRole="button" accessibilityLabel={hidden ? "Show password" : "Hide password"} hitSlop={Space.sm}>
            {hidden ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.primary} />}
          </Pressable>
        ) : null}
      </Animated.View>
      {hasError ? <AppText variant="bodySmall" color={Colors.error} accessibilityLiveRegion="polite">{error}</AppText> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: Space.sm, width: "100%" },
  field: { flexDirection: "row", alignItems: "center", borderRadius: Corners.control, paddingHorizontal: Space.lg, gap: Space.md },
  // The wrapper supplies the visible blue focus ring on every platform.
  input: { ...Typography.bodySupport, flex: 1, minWidth: 0, padding: 0, outlineWidth: 0 },
  multiline: { alignItems: "flex-start", paddingVertical: Space.md },
  multilineInput: { minHeight: ControlSize.multiline - Space.md * 2 - Borders.selected * 2, textAlignVertical: "top" },
  prefix: { width: 52 },
  divider: { width: Borders.thin, height: Space.page, backgroundColor: Colors.border },
});
