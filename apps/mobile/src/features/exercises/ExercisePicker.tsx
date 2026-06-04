import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import type { Exercise } from "@/types/exercise";

import { ExerciseList } from "./ExerciseList";
import { ExerciseSearch } from "./ExerciseSearch";
import { mockExercises } from "./mockExercises";

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void;
};

const allMuscleGroups = Array.from(new Set(mockExercises.map((exercise) => exercise.muscleGroup)));

export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredExercises = mockExercises.filter((exercise) => {
    const matchesQuery = exercise.name.toLowerCase().includes(normalizedQuery);
    const matchesMuscleGroup =
      selectedMuscleGroup === null || exercise.muscleGroup === selectedMuscleGroup;

    return matchesQuery && matchesMuscleGroup;
  });

  return (
    <Card title="Add Exercise">
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

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  filterPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
  },
  filterTextSelected: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.84,
  },
});
