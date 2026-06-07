import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Button } from "@/components/Button";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { usePresetStore } from "@/store/usePresetStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { WorkoutPreset } from "@/types/preset";
import type { UnitPreference } from "@/types/user";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/types/workout";

type WorkoutEditorProps = {
  cancelLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  deleteLabel?: string;
  isDeletePending?: boolean;
  isSaveDisabled?: boolean;
  onCancel?: () => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
  onRequestDelete?: () => void;
  onSave?: () => void;
  onUpdateWorkout: (updater: (workout: Workout) => Workout) => void;
  saveLabel?: string;
  unitPreference?: UnitPreference;
  workout: Workout;
};

export function WorkoutEditor({
  cancelLabel = "Cancel",
  containerStyle,
  deleteLabel = "Delete",
  isDeletePending = false,
  isSaveDisabled = false,
  onCancel,
  onCancelDelete,
  onConfirmDelete,
  onRequestDelete,
  onSave,
  onUpdateWorkout,
  saveLabel = "Save",
  unitPreference = "lb",
  workout,
}: WorkoutEditorProps) {
  const { workoutPresets } = usePresetStore();
  const styles = createStyles(useThemeColors());
  const canDelete = Boolean(onRequestDelete && onConfirmDelete);
  const handleCancelDelete = onCancelDelete ?? onCancel;
  const [isPresetPickerVisible, setIsPresetPickerVisible] = useState(false);

  function updateWorkout(updates: Partial<Workout>) {
    onUpdateWorkout((currentWorkout) => ({
      ...currentWorkout,
      ...updates,
    }));
  }

  function updateWorkoutExercise(
    workoutExerciseId: string,
    updater: (workoutExercise: WorkoutExercise) => WorkoutExercise,
  ) {
    onUpdateWorkout((currentWorkout) => ({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((workoutExercise) =>
        workoutExercise.id === workoutExerciseId ? updater(workoutExercise) : workoutExercise,
      ),
    }));
  }

  function addExercise() {
    onUpdateWorkout((currentWorkout) => ({
      ...currentWorkout,
      exercises: [
        ...currentWorkout.exercises,
        {
          exercise: {
            equipment: "",
            id: createId("exercise"),
            isCustom: true,
            muscleGroup: "",
            name: "Exercise",
          },
          id: createId("workout-exercise"),
          sets: [
            {
              id: createId("set"),
              reps: 0,
              setNumber: 1,
              weight: 0,
              weightUnit: unitPreference,
            },
          ],
        },
      ],
    }));
  }

  function addWorkoutPreset(preset: WorkoutPreset) {
    onUpdateWorkout((currentWorkout) => ({
      ...currentWorkout,
      exercises: [
        ...currentWorkout.exercises,
        ...clonePresetExercises(preset),
      ],
      title:
        currentWorkout.exercises.length === 0 && currentWorkout.title.trim() === "Workout"
          ? preset.title
          : currentWorkout.title,
    }));
    setIsPresetPickerVisible(false);
  }

  function updateExerciseDetails(
    workoutExerciseId: string,
    updates: Partial<WorkoutExercise["exercise"]>,
  ) {
    updateWorkoutExercise(workoutExerciseId, (workoutExercise) => ({
      ...workoutExercise,
      exercise: {
        ...workoutExercise.exercise,
        ...updates,
        isCustom: true,
      },
    }));
  }

  function removeExercise(workoutExerciseId: string) {
    onUpdateWorkout((currentWorkout) => ({
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter(
        (workoutExercise) => workoutExercise.id !== workoutExerciseId,
      ),
    }));
  }

  function addSet(workoutExerciseId: string) {
    updateWorkoutExercise(workoutExerciseId, (workoutExercise) => {
      const previousSet = workoutExercise.sets[workoutExercise.sets.length - 1];

      return {
        ...workoutExercise,
        sets: [
          ...workoutExercise.sets,
          {
            id: createId("set"),
            reps: previousSet?.reps ?? 0,
            setNumber: workoutExercise.sets.length + 1,
            weight: previousSet?.weight ?? 0,
            weightUnit: previousSet?.weightUnit ?? unitPreference,
            rpe: previousSet?.rpe,
          },
        ],
      };
    });
  }

  function updateSet(
    workoutExerciseId: string,
    setId: string,
    updates: Partial<Omit<WorkoutSet, "id">>,
  ) {
    updateWorkoutExercise(workoutExerciseId, (workoutExercise) => ({
      ...workoutExercise,
      sets: workoutExercise.sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              ...updates,
            }
          : set,
      ),
    }));
  }

  function removeSet(workoutExerciseId: string, setId: string) {
    updateWorkoutExercise(workoutExerciseId, (workoutExercise) => ({
      ...workoutExercise,
      sets: renumberSets(workoutExercise.sets.filter((set) => set.id !== setId)),
    }));
  }

  return (
    <View style={[styles.editor, containerStyle]}>
      <View style={styles.fieldRow}>
        <CompactTextInput
          label="Title"
          onChangeText={(title) => updateWorkout({ title })}
          value={workout.title}
          wrapperStyle={styles.fieldGrow}
        />
        <CompactTextInput
          label="Time"
          onChangeText={(timeValue) =>
            updateWorkout({
              date: buildWorkoutDate(
                getDateKey(workout.date),
                sanitizeTimeInput(timeValue),
                workout.date,
              ),
            })
          }
          value={getTimeInputValue(workout.date)}
          wrapperStyle={styles.fieldTime}
        />
      </View>

      <View style={styles.actionRow}>
        <Button icon="plus" onPress={addExercise} style={styles.compactButton} variant="secondary">
          Add Exercise
        </Button>
        <Button
          disabled={workoutPresets.length === 0}
          icon="circle-stack"
          onPress={() => setIsPresetPickerVisible((isVisible) => !isVisible)}
          style={styles.compactButton}
          variant="secondary"
        >
          Quick Add
        </Button>
      </View>

      {isPresetPickerVisible ? (
        <View style={styles.presetPicker}>
          {workoutPresets.map((preset) => (
            <Pressable
              accessibilityRole="button"
              key={preset.id}
              onPress={() => addWorkoutPreset(preset)}
              style={styles.presetOption}
            >
              <Text style={styles.presetOptionTitle}>{preset.title}</Text>
              <Text style={styles.presetOptionMeta}>
                {preset.workout.exercises.length} exercises
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {workout.exercises.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No exercises yet</Text>
          <Text style={styles.mutedText}>Add an exercise and type the movement exactly how you want it logged.</Text>
        </View>
      ) : (
        <View style={styles.exerciseList}>
          {workout.exercises.map((workoutExercise) => (
            <View key={workoutExercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <CompactTextInput
                  label="Exercise"
                  onChangeText={(name) => updateExerciseDetails(workoutExercise.id, { name })}
                  value={workoutExercise.exercise.name}
                  wrapperStyle={styles.fieldGrow}
                />
                <Button
                  icon="plus"
                  onPress={() => addSet(workoutExercise.id)}
                  style={styles.miniButton}
                  variant="secondary"
                >
                  Set
                </Button>
              </View>

              <View style={styles.fieldRow}>
                <CompactTextInput
                  label="Group"
                  onChangeText={(muscleGroup) =>
                    updateExerciseDetails(workoutExercise.id, { muscleGroup })
                  }
                  value={workoutExercise.exercise.muscleGroup}
                />
                <CompactTextInput
                  label="Equipment"
                  onChangeText={(equipment) =>
                    updateExerciseDetails(workoutExercise.id, { equipment })
                  }
                  value={workoutExercise.exercise.equipment}
                />
              </View>

              {workoutExercise.sets.length === 0 ? (
                <Text style={styles.mutedText}>No sets logged.</Text>
              ) : (
                <View style={styles.setList}>
                  {workoutExercise.sets.map((set) => (
                    <SetEditorRow
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
                  icon="trash"
                  onPress={() => removeExercise(workoutExercise.id)}
                  style={styles.compactButton}
                  variant="danger"
                >
                  Remove Exercise
                </Button>
              </View>
            </View>
          ))}
        </View>
      )}

      <CompactTextInput
        label="Notes"
        onChangeText={(notes) => updateWorkout({ notes: notes.trim() ? notes : undefined })}
        value={workout.notes ?? ""}
      />

      {isDeletePending && onConfirmDelete ? (
        <View style={styles.deleteBox}>
          <Text style={styles.confirmationTitle}>Delete this workout?</Text>
          <View style={styles.actionRow}>
            <Button icon="trash" onPress={onConfirmDelete} style={styles.compactButton} variant="danger">
              {deleteLabel}
            </Button>
            {handleCancelDelete ? (
              <Button
                icon="arrow-left"
                onPress={handleCancelDelete}
                style={styles.compactButton}
                variant="secondary"
              >
                Keep
              </Button>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.actionRow}>
          {onSave ? (
            <Button
              disabled={isSaveDisabled}
              icon="check"
              onPress={onSave}
              style={styles.compactButton}
            >
              {saveLabel}
            </Button>
          ) : null}
          {onCancel ? (
            <Button icon="x-mark" onPress={onCancel} style={styles.compactButton} variant="secondary">
              {cancelLabel}
            </Button>
          ) : null}
          {canDelete && onRequestDelete ? (
            <Button
              icon="trash"
              onPress={onRequestDelete}
              style={styles.compactButton}
              variant="danger"
            >
              {deleteLabel}
            </Button>
          ) : null}
        </View>
      )}
    </View>
  );
}

type SetEditorRowProps = {
  onRemove: () => void;
  onUpdate: (updates: Partial<Omit<WorkoutSet, "id">>) => void;
  set: WorkoutSet;
};

function SetEditorRow({ onRemove, onUpdate, set }: SetEditorRowProps) {
  const styles = createStyles(useThemeColors());
  const setUnit = set.weightUnit ?? "lb";

  return (
    <View style={styles.setRow}>
      <Text style={styles.setLabel}>Set {set.setNumber}</Text>
      <CompactTextInput
        keyboardType="numeric"
        label="Reps"
        onChangeText={(value) =>
          onUpdate({
            reps: parseWholeNumber(value),
          })
        }
        value={String(set.reps)}
      />
      <CompactTextInput
        keyboardType="decimal-pad"
        label={setUnit.toUpperCase()}
        onChangeText={(value) =>
          onUpdate({
            weight: parseNonNegativeNumber(value),
            weightUnit: setUnit,
          })
        }
        value={String(set.weight)}
      />
      <CompactTextInput
        keyboardType="decimal-pad"
        label="RPE"
        onChangeText={(value) => onUpdate({ rpe: parseRpe(value) })}
        value={set.rpe === undefined ? "" : String(set.rpe)}
      />
      <Button icon="trash" onPress={onRemove} style={styles.setDeleteButton} variant="danger">
        Del
      </Button>
    </View>
  );
}

function clonePresetExercises(preset: WorkoutPreset): WorkoutExercise[] {
  return preset.workout.exercises.map((workoutExercise) => ({
    ...workoutExercise,
    exercise: {
      ...workoutExercise.exercise,
      id: createId("exercise"),
      isCustom: true,
    },
    id: createId("workout-exercise"),
    sets: workoutExercise.sets.map((set, index) => ({
      ...set,
      id: createId("set"),
      setNumber: index + 1,
      weightUnit: set.weightUnit ?? "lb",
    })),
  }));
}

type CompactTextInputProps = {
  keyboardType?: KeyboardTypeOptions;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function CompactTextInput({
  keyboardType = "default",
  label,
  onChangeText,
  value,
  wrapperStyle,
}: CompactTextInputProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={[styles.inputField, wrapperStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        autoCapitalize="words"
        cursorColor={colors.primary}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
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
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
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

function parseWholeNumber(value: string) {
  const sanitizedValue = sanitizeIntegerInput(value);
  const parsed = Number(sanitizedValue);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseNonNegativeNumber(value: string) {
  const sanitizedValue = sanitizeDecimalInput(value);
  const parsed = Number(sanitizedValue);

  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 10) / 10 : 0;
}

function parseRpe(value: string) {
  const sanitizedValue = sanitizeDecimalInput(value);

  if (!sanitizedValue) {
    return undefined;
  }

  const parsed = Number(sanitizedValue);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(Math.round(parsed * 10) / 10, 0), 10);
}

function sanitizeDecimalInput(value: string) {
  const cleanedValue = value.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeValue, ...decimalParts] = cleanedValue.split(".");

  if (decimalParts.length === 0) {
    return wholeValue;
  }

  return `${wholeValue}.${decimalParts.join("")}`;
}

function sanitizeIntegerInput(value: string) {
  return value.replace(/\D/g, "");
}

function sanitizeTimeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function renumberSets(sets: WorkoutSet[]) {
  return sets.map((set, index) => ({
    ...set,
    setNumber: index + 1,
  }));
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    editor: {
      gap: spacing.md,
    },
    fieldRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.sm,
    },
    fieldGrow: {
      flex: 1,
      minWidth: 0,
    },
    fieldTime: {
      width: 96,
    },
    inputField: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    inputLabel: {
      color: colors.textMuted,
      fontSize: 10,
      fontWeight: typography.weights.semibold,
      lineHeight: 13,
      textTransform: "uppercase",
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      color: colors.text,
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.small,
      minHeight: 38,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    compactButton: {
      minHeight: 40,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    miniButton: {
      minHeight: 38,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    emptyBox: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.small,
    },
    mutedText: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      lineHeight: typography.lineHeights.caption,
    },
    exerciseList: {
      gap: spacing.sm,
    },
    exerciseCard: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.sm,
      padding: spacing.sm,
    },
    exerciseHeader: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.sm,
    },
    setList: {
      gap: spacing.xs,
    },
    setRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.xs,
    },
    setLabel: {
      color: colors.text,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: 38,
      width: 42,
    },
    setDeleteButton: {
      minHeight: 38,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    deleteBox: {
      backgroundColor: colors.dangerMuted,
      borderColor: colors.danger,
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.sm,
      padding: spacing.md,
    },
    confirmationTitle: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.body,
    },
    presetPicker: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      gap: spacing.xs,
      padding: spacing.sm,
    },
    presetOption: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 12,
      borderWidth: 1,
      gap: 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    presetOptionTitle: {
      color: colors.text,
      fontSize: typography.sizes.small,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.small,
    },
    presetOptionMeta: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      lineHeight: typography.lineHeights.caption,
    },
  });
}
