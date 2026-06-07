import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { ExercisePicker } from "@/features/exercises/ExercisePicker";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { WorkoutSet } from "@/types/workout";

export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
    isHydrated,
    startWorkout,
    setWorkoutTitle,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    finishWorkout,
  } = useActiveWorkoutStore();
  const { addCompletedWorkout } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (isHydrated && !activeWorkout) {
      startWorkout();
    }
  }, [activeWorkout, isHydrated, startWorkout]);

  function handleFinishWorkout() {
    const completedWorkout = finishWorkout();

    if (completedWorkout) {
      addCompletedWorkout(completedWorkout);
    }

    router.replace("/home");
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  }

  if (!isHydrated || !activeWorkout) {
    return (
      <Screen>
        <EmptyState title="Starting workout" message="Preparing a blank session." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topAction}>
          <Button icon="arrow-left" onPress={handleBack} variant="secondary">
            Back
          </Button>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Live session</Text>
          <Text style={styles.heroTitle}>Log the work. Keep the screen quiet.</Text>
          <Text style={styles.heroSubtitle}>
            This flow is intentionally simple: add exercises, capture sets, finish, and move on.
          </Text>
        </View>

        <Card title="Session setup">
          <Input
            label="Workout title"
            onChangeText={setWorkoutTitle}
            placeholder="Workout title"
            value={activeWorkout.title}
          />

          <View style={styles.actionRow}>
            <Button
              icon={isPickerVisible ? "x-mark" : "plus"}
              onPress={() => setIsPickerVisible((current) => !current)}
              variant="secondary"
            >
              {isPickerVisible ? "Hide Exercises" : "Add Exercise"}
            </Button>
            <Button
              disabled={activeWorkout.exercises.length === 0}
              icon="check"
              onPress={handleFinishWorkout}
            >
              Finish Workout
            </Button>
          </View>
        </Card>

        {isPickerVisible ? (
          <ExercisePicker
            onSelect={(exercise) => {
              addExercise(exercise);
              setIsPickerVisible(false);
            }}
          />
        ) : null}

        {activeWorkout.exercises.length === 0 ? (
          <Card title="Workout session">
            <EmptyState title="No exercises yet" message="Add an exercise to start logging sets." />
          </Card>
        ) : (
          <View style={styles.exerciseStack}>
            {activeWorkout.exercises.map((workoutExercise) => (
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
                  <EmptyState title="No sets yet" message="Add a set when you are ready." />
                ) : (
                  <View style={styles.setList}>
                    {workoutExercise.sets.map((set) => (
                      <WorkoutSetRow
                        key={set.id}
                        onRemove={() => removeSet(workoutExercise.id, set.id)}
                        onUpdate={(updates) => updateSet(workoutExercise.id, set.id, updates)}
                        set={set}
                      />
                    ))}
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    icon="plus"
                    onPress={() =>
                      addSet(workoutExercise.id, {
                        reps: 8,
                        weight: 0,
                      })
                    }
                    variant="secondary"
                  >
                    Add Set
                  </Button>
                  <Button
                    icon="trash"
                    onPress={() => removeExercise(workoutExercise.id)}
                    variant="danger"
                  >
                    Remove
                  </Button>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

type WorkoutSetRowProps = {
  set: WorkoutSet;
  onUpdate: (updates: Partial<Omit<WorkoutSet, "id">>) => void;
  onRemove: () => void;
};

function WorkoutSetRow({ set, onUpdate, onRemove }: WorkoutSetRowProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.setRow}>
      <Text style={styles.setNumber}>Set {set.setNumber}</Text>
      <View style={styles.setInputs}>
        <Input
          keyboardType="numeric"
          label="Reps"
          onChangeText={(value) => onUpdate({ reps: parseRequiredNumber(value) })}
          value={String(set.reps)}
        />
        <Input
          keyboardType="numeric"
          label="Weight"
          onChangeText={(value) => onUpdate({ weight: parseRequiredNumber(value) })}
          value={String(set.weight)}
        />
        <Input
          keyboardType="numeric"
          label="RPE"
          onChangeText={(value) => onUpdate({ rpe: parseOptionalNumber(value) })}
          value={set.rpe === undefined ? "" : String(set.rpe)}
        />
      </View>
      <Button icon="trash" onPress={onRemove} variant="danger">
        Delete Set
      </Button>
    </View>
  );
}

function parseRequiredNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topAction: {
    alignItems: "flex-start",
  },
  hero: {
    backgroundColor: colors.heroBackground,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 34,
    borderWidth: 1,
    gap: spacing.md,
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
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  exerciseStack: {
    gap: spacing.xl,
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
    gap: spacing.md,
  },
  setRow: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  setNumber: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  setInputs: {
    gap: spacing.sm,
  },
  });
}
