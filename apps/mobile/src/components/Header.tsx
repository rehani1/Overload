import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";

type HeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
    lineHeight: typography.lineHeights.display,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
    maxWidth: 420,
  },
});
