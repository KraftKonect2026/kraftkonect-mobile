import React from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

export interface PressableOpacityProps extends PressableProps {
  activeOpacity?: number;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

export const PressableOpacity: React.FC<PressableOpacityProps> = ({
  children,
  style,
  activeOpacity = 0.7,
  ...props
}) => {
  return (
    <Pressable
      style={(state) => {
        const resolvedStyle = typeof style === "function" ? style(state) : style;
        return [
          resolvedStyle,
          state.pressed && { opacity: activeOpacity },
        ];
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
};
