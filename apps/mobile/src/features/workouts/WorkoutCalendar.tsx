import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isApiConfigured } from "@/api/client";
import {
  deleteWorkout as deleteWorkoutRequest,
  updateWorkout as updateWorkoutRequest,
} from "@/api/workoutApi";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { Workout } from "@/types/workout";

import { WorkoutCalendarEditor } from "./WorkoutCalendarEditor";

type SyncState = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
};

export function WorkoutCalendar() {
  const { deleteWorkout, restoreWorkout, updateWorkout, workouts } = useWorkoutHistoryStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const initialDate = completedWorkouts[0]?.date ?? new Date().toISOString();
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(initialDate));
  const [visibleMonthKey, setVisibleMonthKey] = useState(getMonthKey(new Date(initialDate)));
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [draftWorkout, setDraftWorkout] = useState<Workout | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    kind: "idle",
    message: isApiConfigured
      ? "Backend sync is enabled."
      : "Saved locally. Backend sync will activate when API URL is configured.",
  });
  const visibleMonthDate = parseMonthKey(visibleMonthKey);
  const workoutsByDate = groupWorkoutsByDate(completedWorkouts);
  const calendarDays = buildCalendarDays(visibleMonthDate);
  const selectedWorkouts = workoutsByDate.get(selectedDateKey) ?? [];

  function handleCancelDelete() {
    setDeleteCandidateId(null);
  }

  function handleCancelEdit() {
    setDraftWorkout(null);
    setEditingWorkoutId(null);
    setDeleteCandidateId(null);
  }

  async function handleConfirmDelete(workout: Workout) {
    deleteWorkout(workout.id);
    handleCancelEdit();
    setSyncState({
      kind: "pending",
      message: "Workout deleted locally. Syncing delete...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Workout deleted locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await deleteWorkoutRequest(workout.id);
      setSyncState({
        kind: "success",
        message: "Workout deleted and synced.",
      });
    } catch {
      restoreWorkout(workout);
      setSelectedDateKey(getDateKey(workout.date));
      setVisibleMonthKey(getMonthKey(new Date(workout.date)));
      setSyncState({
        kind: "error",
        message: "Delete sync failed. Workout was restored locally.",
      });
    }
  }

  function handleMonthChange(monthOffset: number) {
    const nextMonthDate = addMonths(visibleMonthDate, monthOffset);
    setVisibleMonthKey(getMonthKey(nextMonthDate));
    setSelectedDateKey(getDateKeyFromDate(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)));
    handleCancelEdit();
  }

  function handleStartEdit(workout: Workout) {
    setEditingWorkoutId(workout.id);
    setDeleteCandidateId(null);
    setDraftWorkout(cloneWorkout(workout));
  }

  async function handleSaveWorkout(originalWorkout: Workout) {
    if (!draftWorkout) {
      return;
    }

    const sanitizedWorkout: Workout = {
      ...draftWorkout,
      title: draftWorkout.title.trim() || originalWorkout.title,
    };

    const updatedWorkout = updateWorkout(originalWorkout.id, {
      date: sanitizedWorkout.date,
      exercises: sanitizedWorkout.exercises,
      notes: sanitizedWorkout.notes,
      title: sanitizedWorkout.title,
    });

    if (!updatedWorkout) {
      setSyncState({
        kind: "error",
        message: "Could not find that workout locally.",
      });
      return;
    }

    setSelectedDateKey(getDateKey(updatedWorkout.date));
    setVisibleMonthKey(getMonthKey(new Date(updatedWorkout.date)));
    handleCancelEdit();
    setSyncState({
      kind: "pending",
      message: "Workout saved locally. Syncing changes...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Workout saved locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await updateWorkoutRequest(originalWorkout.id, {
        date: updatedWorkout.date,
        exercises: updatedWorkout.exercises,
        notes: updatedWorkout.notes,
        title: updatedWorkout.title,
      });
      setSyncState({
        kind: "success",
        message: "Workout changes synced.",
      });
    } catch {
      updateWorkout(originalWorkout.id, {
        date: originalWorkout.date,
        exercises: originalWorkout.exercises,
        notes: originalWorkout.notes,
        title: originalWorkout.title,
      });
      setSelectedDateKey(getDateKey(originalWorkout.date));
      setVisibleMonthKey(getMonthKey(new Date(originalWorkout.date)));
      setSyncState({
        kind: "error",
        message: "Sync failed. Local changes were rolled back.",
      });
    }
  }

  return (
    <View style={styles.content}>
      <Card title="Sync Status">
        <Text style={[styles.syncText, syncState.kind === "error" && styles.errorText]}>
          {syncState.message}
        </Text>
      </Card>

      {completedWorkouts.length === 0 ? (
        <Card title="Workout Calendar">
          <EmptyState title="No completed workouts" message="Finish a workout to see it here." />
        </Card>
      ) : (
        <>
          <Card title={formatMonthTitle(visibleMonthDate)}>
            <View style={styles.monthNav}>
              <Button onPress={() => handleMonthChange(-1)} variant="secondary">
                Previous
              </Button>
              <Button onPress={() => handleMonthChange(1)} variant="secondary">
                Next
              </Button>
            </View>

            <View style={styles.weekdayRow}>
              {weekdays.map((weekday) => (
                <Text key={weekday} style={styles.weekdayText}>
                  {weekday}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                const workoutsForDay = day ? workoutsByDate.get(day.dateKey) ?? [] : [];
                const isSelected = day?.dateKey === selectedDateKey;

                return (
                  <Pressable
                    accessibilityRole={day ? "button" : undefined}
                    disabled={!day}
                    key={day?.dateKey ?? `blank-${index}`}
                    onPress={() => {
                      if (day) {
                        setSelectedDateKey(day.dateKey);
                        handleCancelEdit();
                      }
                    }}
                    style={({ pressed }) => [
                      styles.dayCell,
                      !day && styles.emptyDayCell,
                      isSelected && styles.selectedDayCell,
                      pressed && day && styles.pressed,
                    ]}
                  >
                    {day ? (
                      <>
                        <Text style={[styles.dayNumber, isSelected && styles.selectedDayText]}>
                          {day.dayOfMonth}
                        </Text>
                        {workoutsForDay.length > 0 ? <View style={styles.workoutDot} /> : null}
                      </>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card title={formatSelectedDate(selectedDateKey)}>
            {selectedWorkouts.length === 0 ? (
              <Text style={styles.mutedText}>No completed session on this date.</Text>
            ) : (
              <View style={styles.sessionList}>
                {selectedWorkouts.map((workout) => (
                  <WorkoutCalendarItem
                    deleteCandidateId={deleteCandidateId}
                    draftWorkout={draftWorkout}
                    editingWorkoutId={editingWorkoutId}
                    key={workout.id}
                    onCancelDelete={handleCancelDelete}
                    onCancelEdit={handleCancelEdit}
                    onConfirmDelete={() => handleConfirmDelete(workout)}
                    onRequestDelete={() => setDeleteCandidateId(workout.id)}
                    onSave={() => handleSaveWorkout(workout)}
                    onStartEdit={() => handleStartEdit(workout)}
                    onUpdateDraftWorkout={(updater) =>
                      setDraftWorkout((currentDraft) =>
                        currentDraft ? updater(currentDraft) : currentDraft,
                      )
                    }
                    workout={workout}
                  />
                ))}
              </View>
            )}
          </Card>
        </>
      )}
    </View>
  );
}

type WorkoutCalendarItemProps = {
  deleteCandidateId: string | null;
  draftWorkout: Workout | null;
  editingWorkoutId: string | null;
  onCancelDelete: () => void;
  onCancelEdit: () => void;
  onConfirmDelete: () => void;
  onRequestDelete: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  onUpdateDraftWorkout: (updater: (workout: Workout) => Workout) => void;
  workout: Workout;
};

function WorkoutCalendarItem({
  deleteCandidateId,
  draftWorkout,
  editingWorkoutId,
  onCancelDelete,
  onCancelEdit,
  onConfirmDelete,
  onRequestDelete,
  onSave,
  onStartEdit,
  onUpdateDraftWorkout,
  workout,
}: WorkoutCalendarItemProps) {
  const isDeletePending = deleteCandidateId === workout.id;
  const isEditing = editingWorkoutId === workout.id && draftWorkout !== null;
  const setCount = workout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0,
  );

  return (
    <View style={styles.sessionItem}>
      <Text style={styles.sessionTitle}>{workout.title}</Text>
      <Text style={styles.mutedText}>{formatWorkoutTime(workout.date)}</Text>
      <Text style={styles.metaText}>
        {workout.exercises.length} exercises · {setCount} sets
      </Text>

      {isEditing && draftWorkout ? (
        <WorkoutCalendarEditor
          draftWorkout={draftWorkout}
          onCancel={onCancelEdit}
          onDelete={onRequestDelete}
          onSave={onSave}
          onUpdateDraftWorkout={onUpdateDraftWorkout}
        />
      ) : (
        <View style={styles.actionRow}>
          <Button onPress={onStartEdit} variant="secondary">
            Modify
          </Button>
          <Button onPress={onRequestDelete} variant="danger">
            Delete
          </Button>
        </View>
      )}

      {isDeletePending ? (
        <View style={styles.confirmationBox}>
          <Text style={styles.confirmationTitle}>Delete this workout?</Text>
          <Text style={styles.mutedText}>
            This removes the local workout now and will sync the delete when the backend is configured.
          </Text>
          <View style={styles.actionRow}>
            <Button onPress={onConfirmDelete} variant="danger">
              Confirm Delete
            </Button>
            <Button onPress={onCancelDelete} variant="secondary">
              Keep Workout
            </Button>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type CalendarDay = {
  dateKey: string;
  dayOfMonth: number;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function buildCalendarDays(date: Date): (CalendarDay | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = Array.from<null>({ length: firstDay.getDay() }).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayDate = new Date(year, month, index + 1);

    return {
      dateKey: getDateKeyFromDate(dayDate),
      dayOfMonth: index + 1,
    };
  });

  return [...blanks, ...days];
}

function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((workoutExercise) => ({
      ...workoutExercise,
      sets: workoutExercise.sets.map((set) => ({
        ...set,
      })),
    })),
  };
}

function groupWorkoutsByDate(workouts: Workout[]) {
  const groupedWorkouts = new Map<string, Workout[]>();

  workouts.forEach((workout) => {
    const dateKey = getDateKey(workout.date);
    const workoutsForDate = groupedWorkouts.get(dateKey) ?? [];
    groupedWorkouts.set(dateKey, [...workoutsForDate, workout]);
  });

  return groupedWorkouts;
}

function getDateKey(date: string) {
  return getDateKeyFromDate(new Date(date));
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatSelectedDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function formatWorkoutTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function parseMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  syncText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  errorText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.84,
  },
  monthNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  weekdayText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    textAlign: "center",
    width: 38,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  emptyDayCell: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  selectedDayCell: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayNumber: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
  },
  selectedDayText: {
    color: colors.background,
  },
  workoutDot: {
    backgroundColor: colors.success,
    borderRadius: 3,
    height: 6,
    marginTop: 2,
    width: 6,
  },
  sessionList: {
    gap: spacing.md,
  },
  sessionItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  confirmationBox: {
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  confirmationTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  sessionTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  metaText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
