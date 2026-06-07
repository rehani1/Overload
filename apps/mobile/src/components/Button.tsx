import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";
import { Icon, type IconName } from "@/components/Icon";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: IconName;
  iconPosition?: "left" | "right";
  style?: StyleProp<ViewStyle>;
};

export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  icon,
  iconPosition = "left",
  style,
}: ButtonProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const variantStyles = getVariantStyles(colors);
  const selectedVariant = variantStyles[variant];
  const iconElement = icon ? <Icon color={selectedVariant.text.color} name={icon} size={18} /> : null;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        selectedVariant.button,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.content}>
        {iconPosition === "left" ? iconElement : null}
        <Text style={[styles.text, selectedVariant.text]}>{children}</Text>
        {iconPosition === "right" ? iconElement : null}
      </View>
    </Pressable>
  );
}

function getVariantStyles(colors: AppColors) {
  return {
    primary: {
      button: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      text: {
        color: colors.onPrimary,
      },
    },
    secondary: {
      button: {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderStrong,
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
        color: colors.onDanger,
      },
    },
  } as const;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      boxShadow: `0px 8px 18px ${colors.shadow}`,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: {
        height: 4,
        width: 0,
      },
      shadowOpacity: 1,
      shadowRadius: 9,
    },
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
    },
    text: {
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.small,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}
