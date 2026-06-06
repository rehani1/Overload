import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyles = {
  primary: {
    button: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    text: {
      color: colors.surface,
    },
  },
  secondary: {
    button: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    text: {
      color: colors.text,
    },
  },
  danger: {
    button: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    text: {
      color: colors.surface,
    },
  },
} as const;

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ButtonProps) {
  const selectedVariant = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        selectedVariant.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, selectedVariant.text]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    boxShadow: `0px 8px 18px ${colors.shadow}`,
  },
  text: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.2,
    lineHeight: typography.lineHeights.small,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.5,
  },
});
