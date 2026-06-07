import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Exercise } from "@/types/exercise";

import { exerciseLibrary } from "./exerciseLibrary";
import { ExerciseList } from "./ExerciseList";
import { ExerciseSearch } from "./ExerciseSearch";

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void;
};

const allMuscleGroups = Array.from(
  new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup)),
);

export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [query, setQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredExercises = exerciseLibrary.filter((exercise) => {
    const matchesQuery = exercise.name.toLowerCase().includes(normalizedQuery);
    const matchesMuscleGroup =
      selectedMuscleGroup === null || exercise.muscleGroup === selectedMuscleGroup;

    return matchesQuery && matchesMuscleGroup;
  });

  return (
    <Card title="Exercise library">
      <Text style={styles.helperText}>Search and add movements to this mobile session.</Text>
      <ExerciseSearch value={query} onChangeText={setQuery} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          <FilterPill
            isSelected={selectedMuscleGroup === null}
            label="All"
            onPress={() => setSelectedMuscleGroup(null)}
          />
          {allMuscleGroups.map((muscleGroup) => (
            <FilterPill
              isSelected={selectedMuscleGroup === muscleGroup}
              key={muscleGroup}
              label={muscleGroup}
              onPress={() => setSelectedMuscleGroup(muscleGroup)}
            />
          ))}
        </View>
      </ScrollView>

      <ExerciseList exercises={filteredExercises} onSelect={onSelect} />
    </Card>
  );
}

type FilterPillProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

function FilterPill({ label, isSelected, onPress }: FilterPillProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterPill,
        isSelected && styles.filterPillSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  filterPill: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  filterTextSelected: {
    color: colors.onPrimary,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  pressed: {
    opacity: 0.84,
  },
  });
}
