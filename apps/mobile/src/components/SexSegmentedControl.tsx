import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Sex } from "@/types/user";

type SexSegmentedControlProps = {
  onChange: (value: Sex) => void;
  value: Sex;
};

const sexOptions: { label: string; value: Sex }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

export function SexSegmentedControl({ onChange, value }: SexSegmentedControlProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionLabel}>Sex</Text>
      <View style={styles.segmentedControl}>
        {sexOptions.map((option) => {
          const isSelected = option.value === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.segmentOption, isSelected && styles.segmentOptionSelected]}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    formSection: {
      gap: spacing.sm,
    },
    sectionLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    segmentedControl: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.xs,
    },
    segmentOption: {
      alignItems: "center",
      borderRadius: 999,
      flex: 1,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    segmentOptionSelected: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
      textAlign: "center",
    },
    segmentTextSelected: {
      color: colors.onPrimary,
    },
  });
}
