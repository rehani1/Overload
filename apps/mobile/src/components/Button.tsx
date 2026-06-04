import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
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
  style?: ViewStyle;
};

const variantStyles = {
  primary: {
    button: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    text: {
      color: colors.background,
    },
  },
  secondary: {
    button: {
      backgroundColor: colors.surfaceMuted,
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
      color: colors.text,
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
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.5,
  },
});
