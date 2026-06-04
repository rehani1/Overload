import { Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import type { Exercise } from "@/types/exercise";

type ExerciseListProps = {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
};

export function ExerciseList({ exercises, onSelect }: ExerciseListProps) {
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

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 64,
    padding: spacing.md,
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
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
  },
});
