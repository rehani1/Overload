import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/Input";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { ExercisePicker } from "@/features/exercises/ExercisePicker";
import type { Exercise } from "@/types/exercise";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/types/workout";

type WorkoutCalendarEditorProps = {
  draftWorkout: Workout;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
  onUpdateDraftWorkout: (updater: (workout: Workout) => Workout) => void;
  saveLabel?: string;
};

export function WorkoutCalendarEditor({
  draftWorkout,
  onCancel,
  onDelete,
  onSave,
  onUpdateDraftWorkout,
  saveLabel = "Save Changes",
}: WorkoutCalendarEditorProps) {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  function updateWorkout(updates: Partial<Workout>) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      ...updates,
    }));
  }

  function addExercise(exercise: Exercise) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      exercises: [
        ...workout.exercises,
        {
          exercise,
          id: createId("workout-exercise"),
          sets: [],
        },
      ],
    }));
    setIsPickerVisible(false);
  }

  function removeExercise(workoutExerciseId: string) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      exercises: workout.exercises.filter(
        (workoutExercise) => workoutExercise.id !== workoutExerciseId,
      ),
    }));
  }

  function addSet(workoutExerciseId: string) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      exercises: workout.exercises.map((workoutExercise) => {
        if (workoutExercise.id !== workoutExerciseId) {
          return workoutExercise;
        }

        return {
          ...workoutExercise,
          sets: [
            ...workoutExercise.sets,
            {
              id: createId("set"),
              reps: 8,
              setNumber: workoutExercise.sets.length + 1,
              weight: 0,
            },
          ],
        };
      }),
    }));
  }

  function updateSet(
    workoutExerciseId: string,
    setId: string,
    updates: Partial<Omit<WorkoutSet, "id">>,
  ) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      exercises: workout.exercises.map((workoutExercise) => {
        if (workoutExercise.id !== workoutExerciseId) {
          return workoutExercise;
        }

        return {
          ...workoutExercise,
          sets: workoutExercise.sets.map((set) =>
            set.id === setId
              ? {
                  ...set,
                  ...updates,
                }
              : set,
          ),
        };
      }),
    }));
  }

  function removeSet(workoutExerciseId: string, setId: string) {
    onUpdateDraftWorkout((workout) => ({
      ...workout,
      exercises: workout.exercises.map((workoutExercise) => {
        if (workoutExercise.id !== workoutExerciseId) {
          return workoutExercise;
        }

        return {
          ...workoutExercise,
          sets: renumberSets(workoutExercise.sets.filter((set) => set.id !== setId)),
        };
      }),
    }));
  }

  return (
    <View style={styles.editor}>
      <Input
        label="Workout title"
        onChangeText={(title) => updateWorkout({ title })}
        placeholder="Workout title"
        value={draftWorkout.title}
      />
      <Input
        label="Date"
        onChangeText={(dateKey) =>
          updateWorkout({
            date: buildWorkoutDate(dateKey, getTimeInputValue(draftWorkout.date), draftWorkout.date),
          })
        }
        placeholder="YYYY-MM-DD"
        value={getDateKey(draftWorkout.date)}
      />
      <Input
        label="Time"
        onChangeText={(timeValue) =>
          updateWorkout({
            date: buildWorkoutDate(getDateKey(draftWorkout.date), timeValue, draftWorkout.date),
          })
        }
        placeholder="HH:MM"
        value={getTimeInputValue(draftWorkout.date)}
      />
      <Input
        label="Notes"
        onChangeText={(notes) =>
          updateWorkout({
            notes: notes.trim() ? notes : undefined,
          })
        }
        placeholder="Session notes"
        value={draftWorkout.notes ?? ""}
      />

      <View style={styles.actionRow}>
        <Button onPress={() => setIsPickerVisible((current) => !current)} variant="secondary">
          {isPickerVisible ? "Hide Exercises" : "Add Exercise"}
        </Button>
      </View>

      {isPickerVisible ? <ExercisePicker onSelect={addExercise} /> : null}

      {draftWorkout.exercises.length === 0 ? (
        <EmptyState title="No exercises" message="Add exercises to preserve a useful workout record." />
      ) : (
        <View style={styles.exerciseList}>
          {draftWorkout.exercises.map((workoutExercise) => (
            <WorkoutExerciseEditor
              key={workoutExercise.id}
              onAddSet={() => addSet(workoutExercise.id)}
              onRemoveExercise={() => removeExercise(workoutExercise.id)}
              onRemoveSet={(setId) => removeSet(workoutExercise.id, setId)}
              onUpdateSet={(setId, updates) => updateSet(workoutExercise.id, setId, updates)}
              workoutExercise={workoutExercise}
            />
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        <Button onPress={onSave}>{saveLabel}</Button>
        <Button onPress={onCancel} variant="secondary">
          Cancel
        </Button>
        {onDelete ? (
          <Button onPress={onDelete} variant="danger">
            Delete Workout
          </Button>
        ) : null}
      </View>
    </View>
  );
}

type WorkoutExerciseEditorProps = {
  onAddSet: () => void;
  onRemoveExercise: () => void;
  onRemoveSet: (setId: string) => void;
  onUpdateSet: (setId: string, updates: Partial<Omit<WorkoutSet, "id">>) => void;
  workoutExercise: WorkoutExercise;
};

function WorkoutExerciseEditor({
  onAddSet,
  onRemoveExercise,
  onRemoveSet,
  onUpdateSet,
  workoutExercise,
}: WorkoutExerciseEditorProps) {
  return (
    <View style={styles.exerciseEditor}>
      <Text style={styles.exerciseTitle}>{workoutExercise.exercise.name}</Text>
      <Text style={styles.mutedText}>
        {workoutExercise.exercise.muscleGroup} · {workoutExercise.exercise.equipment}
      </Text>

      {workoutExercise.sets.length === 0 ? (
        <Text style={styles.mutedText}>No sets logged.</Text>
      ) : (
        <View style={styles.setList}>
          {workoutExercise.sets.map((set) => (
            <SetEditor
              key={set.id}
              onRemove={() => onRemoveSet(set.id)}
              onUpdate={(updates) => onUpdateSet(set.id, updates)}
              set={set}
            />
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        <Button onPress={onAddSet} variant="secondary">
          Add Set
        </Button>
        <Button onPress={onRemoveExercise} variant="danger">
          Remove Exercise
        </Button>
      </View>
    </View>
  );
}

type SetEditorProps = {
  onRemove: () => void;
  onUpdate: (updates: Partial<Omit<WorkoutSet, "id">>) => void;
  set: WorkoutSet;
};

function SetEditor({ onRemove, onUpdate, set }: SetEditorProps) {
  return (
    <View style={styles.setEditor}>
      <Text style={styles.setTitle}>Set {set.setNumber}</Text>
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
      <Button onPress={onRemove} variant="danger">
        Delete Set
      </Button>
    </View>
  );
}

function buildWorkoutDate(dateKey: string, timeValue: string, fallbackDate: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return fallbackDate;
  }

  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDateKey(date: string) {
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTimeInputValue(date: string) {
  const parsedDate = new Date(date);
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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

function renumberSets(sets: WorkoutSet[]) {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }));
}

const styles = StyleSheet.create({
  editor: {
    gap: spacing.lg,
  },
  exerciseList: {
    gap: spacing.lg,
  },
  exerciseEditor: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  exerciseTitle: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subtitle,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  setList: {
    gap: spacing.md,
  },
  setEditor: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  setTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
