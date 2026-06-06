import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = String(id);
  const { duplicateWorkout, getWorkoutById } = useWorkoutHistoryStore();
  const { startWorkout } = useActiveWorkoutStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Workout archive</Text>
          <Text style={styles.heroTitle}>{workout.title}</Text>
          <Text style={styles.heroSubtitle}>{formatWorkoutDate(workout.date)}</Text>
        </View>

        <Button onPress={handleDuplicateWorkout}>Duplicate Workout</Button>

        {workout.exercises.map((workoutExercise) => (
          <Card key={workoutExercise.id}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleGroup}>
                <Text style={styles.exerciseEyebrow}>{workoutExercise.exercise.muscleGroup}</Text>
                <Text style={styles.exerciseTitle}>{workoutExercise.exercise.name}</Text>
                <Text style={styles.metaText}>{workoutExercise.exercise.equipment}</Text>
              </View>
              <View style={styles.setCountPill}>
                <Text style={styles.setCountText}>{workoutExercise.sets.length} sets</Text>
              </View>
            </View>

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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.heroBackground,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 34,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  heroEyebrow: {
    color: colors.primaryMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: colors.onPrimary,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.7,
    lineHeight: typography.lineHeights.display,
  },
  heroSubtitle: {
    color: colors.heroTextMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  exerciseHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  exerciseTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.7,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  setCountPill: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.primaryMuted,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setCountText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  setList: {
    gap: spacing.sm,
  },
  setRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 18,
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
}
