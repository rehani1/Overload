import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = String(id);
  const { duplicateWorkout, getWorkoutById } = useWorkoutHistoryStore();
  const { startWorkout } = useActiveWorkoutStore();
  const workout = getWorkoutById(workoutId);

  function handleDuplicateWorkout() {
    const duplicatedWorkout = duplicateWorkout(workoutId);

    if (!duplicatedWorkout) {
      return;
    }

    startWorkout(duplicatedWorkout);
    router.push("../workout/active");
  }

  if (!workout) {
    return (
      <Screen>
        <Header title="Workout Detail" subtitle="This workout could not be found." />
        <Card title="Not found">
          <EmptyState title="Workout not found" message="Return to Workouts and choose another session." />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title={workout.title} subtitle={formatWorkoutDate(workout.date)} />

        <Button onPress={handleDuplicateWorkout}>Duplicate Workout</Button>

        {workout.exercises.map((workoutExercise) => (
          <Card key={workoutExercise.id} title={workoutExercise.exercise.name}>
            <Text style={styles.metaText}>
              {workoutExercise.exercise.muscleGroup} · {workoutExercise.exercise.equipment}
            </Text>

            {workoutExercise.sets.length === 0 ? (
              <EmptyState title="No sets" message="This exercise has no logged sets." />
            ) : (
              <View style={styles.setList}>
                {workoutExercise.sets.map((set) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setText}>Set {set.setNumber}</Text>
                    <Text style={styles.setText}>{set.reps} reps</Text>
                    <Text style={styles.setText}>{set.weight} lb</Text>
                    <Text style={styles.setText}>RPE {set.rpe ?? "-"}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

function formatWorkoutDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  setList: {
    gap: spacing.sm,
  },
  setRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.md,
  },
  setText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
