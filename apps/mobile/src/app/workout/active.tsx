import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { ExercisePicker } from "@/features/exercises/ExercisePicker";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { WorkoutSet } from "@/types/workout";

export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
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
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    if (!activeWorkout) {
      startWorkout();
    }
  }, [activeWorkout, startWorkout]);

  function handleFinishWorkout() {
    const completedWorkout = finishWorkout();

    if (completedWorkout) {
      addCompletedWorkout(completedWorkout);
    }

    router.replace("../workouts");
  }

  if (!activeWorkout) {
    return (
      <Screen>
        <EmptyState title="Starting workout" message="Preparing a blank session." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Active Workout" subtitle="Log sets quickly and keep the session moving." />

        <Input
          label="Workout title"
          onChangeText={setWorkoutTitle}
          placeholder="Workout title"
          value={activeWorkout.title}
        />

        <View style={styles.actionRow}>
          <Button onPress={() => setIsPickerVisible((current) => !current)} variant="secondary">
            {isPickerVisible ? "Hide Exercises" : "Add Exercise"}
          </Button>
          <Button disabled={activeWorkout.exercises.length === 0} onPress={handleFinishWorkout}>
            Finish Workout
          </Button>
        </View>

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
          activeWorkout.exercises.map((workoutExercise) => (
            <Card key={workoutExercise.id} title={workoutExercise.exercise.name}>
              <Text style={styles.metaText}>
                {workoutExercise.exercise.muscleGroup} · {workoutExercise.exercise.equipment}
              </Text>

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
                <Button onPress={() => removeExercise(workoutExercise.id)} variant="danger">
                  Remove
                </Button>
              </View>
            </Card>
          ))
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
      <Button onPress={onRemove} variant="danger">
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  setList: {
    gap: spacing.md,
  },
  setRow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
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
