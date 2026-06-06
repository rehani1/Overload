import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Exercise } from "@/types/exercise";

type ExerciseListProps = {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
};

export function ExerciseList({ exercises, onSelect }: ExerciseListProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  if (exercises.length === 0) {
    return <EmptyState title="No exercises found" message="Try a different search or muscle group." />;
  }

  return (
    <View style={styles.list}>
      {exercises.map((exercise) => (
        <Pressable
          accessibilityRole="button"
          key={exercise.id}
          onPress={() => onSelect(exercise)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.itemCopy}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.meta}>
              {exercise.muscleGroup} · {exercise.equipment}
            </Text>
          </View>
          {exercise.isCustom ? <Text style={styles.badge}>Custom</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 64,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.84,
  },
  itemCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  badge: {
    backgroundColor: colors.accentMuted,
    borderRadius: 999,
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  });
}
