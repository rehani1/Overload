import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";

type AuthHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  details?: string[];
};

export function AuthHero({ details = [], eyebrow, subtitle, title }: AuthHeroProps) {
  return (
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {details.length > 0 ? (
        <View style={styles.detailRow}>
          {details.map((detail) => (
            <View key={detail} style={styles.detailPill}>
              <Text style={styles.detailText}>{detail}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 32,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.primaryMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  title: {
    color: colors.surface,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.7,
    lineHeight: typography.lineHeights.display,
  },
  subtitle: {
    color: "#D8D1F5",
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  detailPill: {
    backgroundColor: "rgba(255, 252, 246, 0.12)",
    borderColor: "rgba(255, 252, 246, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailText: {
    color: colors.surface,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
});
