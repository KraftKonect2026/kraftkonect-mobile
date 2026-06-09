import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, TextStyle, Platform, StyleProp, Animated, TouchableOpacity } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import Colors from "@/constants/colors";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  touched?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: React.ReactNode;
  style?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  touched,
  containerStyle,
  inputStyle,
  icon,
  style,
  secureTextEntry,
  ...rest
}) => {
  const hasError = !!(touched && error);
  const isPassword = !!secureTextEntry;
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputContainer, hasError && styles.inputContainerError, style]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry={isPassword ? hidden : false}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            {hidden ? (
              <EyeOff size={20} color={Colors.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={20} color={Colors.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: "100%",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 27, // Highly rounded / capsule shape
    paddingHorizontal: 20,
    height: 54,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeButton: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: Colors.textPrimary,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      },
    }) as any,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: 2,
    paddingHorizontal: 12,
  },
});
