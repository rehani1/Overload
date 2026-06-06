import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { isApiConfigured } from "@/api/client";
import {
  createWorkout as createWorkoutRequest,
  deleteWorkout as deleteWorkoutRequest,
  updateWorkout as updateWorkoutRequest,
} from "@/api/workoutApi";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { NutritionEntry } from "@/types/nutrition";
import type { Workout } from "@/types/workout";

import { WorkoutCalendarEditor } from "./WorkoutCalendarEditor";

type SyncState = {
  kind: "idle" | "pending" | "success" | "error";
  message: string;
};

type WorkoutCalendarProps = {
  onDatePress?: (dateKey: string) => void;
};

export function WorkoutCalendar({ onDatePress }: WorkoutCalendarProps) {
  const { workouts } = useWorkoutHistoryStore();
  const { entries: nutritionEntries } = useNutritionStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const initialDate = completedWorkouts[0]?.date ?? new Date().toISOString();
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(initialDate));
  const [visibleMonthKey, setVisibleMonthKey] = useState(getMonthKey(new Date(initialDate)));
  const visibleMonthDate = parseMonthKey(visibleMonthKey);
  const workoutsByDate = groupWorkoutsByDate(completedWorkouts);
  const nutritionEntriesByDate = groupNutritionEntriesByDate(nutritionEntries);
  const calendarWeeks = buildCalendarWeeks(visibleMonthDate);

  function handleMonthChange(monthOffset: number) {
    const nextMonthDate = addMonths(visibleMonthDate, monthOffset);
    setVisibleMonthKey(getMonthKey(nextMonthDate));
    setSelectedDateKey(getDateKeyFromDate(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)));
  }

  return (
    <View style={styles.content}>
      <View style={styles.calendarPanel}>
        <View style={styles.calendarHeader}>
          <View style={styles.monthTitleGroup}>
            <Text style={styles.calendarEyebrow}>Training calendar</Text>
            <Text style={styles.monthTitle}>
              <Text style={styles.monthTitleStrong}>{formatMonthName(visibleMonthDate)}</Text>
              <Text style={styles.monthTitleYear}> {formatYear(visibleMonthDate)}</Text>
            </Text>
          </View>

          <View style={styles.monthNav}>
            <Pressable
              accessibilityLabel="Previous month"
              accessibilityRole="button"
              onPress={() => handleMonthChange(-1)}
              style={({ pressed }) => [styles.monthNavButton, pressed && styles.pressed]}
            >
              <Text style={styles.monthNavText}>{"<"}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Next month"
              accessibilityRole="button"
              onPress={() => handleMonthChange(1)}
              style={({ pressed }) => [styles.monthNavButton, pressed && styles.pressed]}
            >
              <Text style={styles.monthNavText}>{">"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={styles.workoutDot} />
            <Text style={styles.legendText}>Workout entries</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.nutritionDot} />
            <Text style={styles.legendText}>Nutrition entries</Text>
          </View>
        </View>

        <View style={styles.calendarSurface}>
          <View style={styles.weekdayRow}>
            {weekdays.map((weekday) => (
              <Text key={weekday} style={styles.weekdayText}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((day, dayIndex) => {
                  const workoutsForDay = workoutsByDate.get(day.dateKey) ?? [];
                  const nutritionEntriesForDay = nutritionEntriesByDate.get(day.dateKey) ?? [];
                  const isSelected = day.dateKey === selectedDateKey;
                  const dayEntrySummary = formatDayEntrySummary(
                    workoutsForDay.length,
                    nutritionEntriesForDay.length,
                  );

                  return (
                    <Pressable
                      accessibilityLabel={`${formatAccessibilityDate(day.dateKey)}, ${dayEntrySummary}`}
                      accessibilityRole="button"
                      key={day.dateKey}
                      onPress={() => {
                        setVisibleMonthKey(getMonthKey(day.date));
                        setSelectedDateKey(day.dateKey);
                        onDatePress?.(day.dateKey);
                      }}
                      style={({ pressed }) => [
                        styles.dayCell,
                        dayIndex === week.length - 1 && styles.lastDayCell,
                        !day.isCurrentMonth && styles.outsideMonthDayCell,
                        isSelected && styles.selectedDayCell,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.dayNumberBadge,
                          isSelected && styles.selectedDayNumberBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNumber,
                            !day.isCurrentMonth && styles.outsideMonthDayNumber,
                            day.isToday && styles.todayDayNumber,
                            isSelected && styles.selectedDayText,
                          ]}
                        >
                          {formatCalendarDayLabel(day)}
                        </Text>
                      </View>

                      {workoutsForDay.length > 0 || nutritionEntriesForDay.length > 0 ? (
                        <View style={styles.dayMarkers}>
                          {workoutsForDay.length > 0 ? (
                            <View style={styles.entryMarker}>
                              <View style={styles.workoutDot} />
                              <Text style={styles.entryMarkerText}>{workoutsForDay.length}</Text>
                            </View>
                          ) : null}

                          {nutritionEntriesForDay.length > 0 ? (
                            <View style={styles.entryMarker}>
                              <View style={styles.nutritionDot} />
                              <Text style={styles.entryMarkerText}>
                                {nutritionEntriesForDay.length}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

type WorkoutDateDetailsProps = {
  selectedDateKey: string;
};

export function WorkoutDateDetails({ selectedDateKey }: WorkoutDateDetailsProps) {
  const {
    addCompletedWorkout,
    deleteWorkout,
    restoreWorkout,
    updateWorkout,
    workouts,
  } = useWorkoutHistoryStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [draftWorkout, setDraftWorkout] = useState<Workout | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    kind: "idle",
    message: isApiConfigured
      ? "Backend sync is enabled."
      : "Saved locally. Backend sync will activate when API URL is configured.",
  });
  const workoutsByDate = groupWorkoutsByDate(completedWorkouts);
  const selectedWorkouts = workoutsByDate.get(selectedDateKey) ?? [];

  function handleCancelEdit() {
    setEditingWorkout(null);
    setDraftWorkout(null);
    setIsDeletePending(false);
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
      setSyncState({
        kind: "error",
        message: "Delete sync failed. Workout was restored locally.",
      });
    }
  }

  function handleStartEdit(workout: Workout) {
    setEditingWorkout(workout);
    setIsDeletePending(false);
    setDraftWorkout(cloneWorkout(workout));
  }

  function handleStartAdd() {
    setEditingWorkout(null);
    setIsDeletePending(false);
    setDraftWorkout(createEmptyWorkout(selectedDateKey));
  }

  async function handleCreateWorkout() {
    if (!draftWorkout) {
      return;
    }

    const createdWorkout: Workout = {
      ...draftWorkout,
      title: draftWorkout.title.trim() || "Workout",
    };

    addCompletedWorkout(createdWorkout);
    handleCancelEdit();
    setSyncState({
      kind: "pending",
      message: "Workout saved locally. Syncing new workout...",
    });

    if (!isApiConfigured) {
      setSyncState({
        kind: "success",
        message: "Workout saved locally. Backend sync is not configured yet.",
      });
      return;
    }

    try {
      await createWorkoutRequest({
        date: createdWorkout.date,
        exercises: createdWorkout.exercises,
        notes: createdWorkout.notes,
        status: "completed",
        title: createdWorkout.title,
      });
      setSyncState({
        kind: "success",
        message: "Workout created and synced.",
      });
    } catch {
      deleteWorkout(createdWorkout.id);
      setSyncState({
        kind: "error",
        message: "Create sync failed. Local workout was rolled back.",
      });
    }
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
      setSyncState({
        kind: "error",
        message: "Sync failed. Local changes were rolled back.",
      });
    }
  }

  return (
    <View style={styles.content}>
      <Card title="Workout">
        {syncState.kind !== "idle" ? (
          <Text style={[styles.syncText, syncState.kind === "error" && styles.errorText]}>
            {syncState.message}
          </Text>
        ) : null}
        <View style={styles.actionRow}>
          <Button onPress={handleStartAdd}>Add Workout</Button>
        </View>
        {selectedWorkouts.length === 0 ? (
          <View style={styles.emptyInline}>
            <Text style={styles.emptyInlineTitle}>No workout recorded</Text>
            <Text style={styles.mutedText}>Add a session for this date when you have one to preserve.</Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {selectedWorkouts.map((workout) => (
              <WorkoutCalendarItem
                key={workout.id}
                onStartEdit={() => handleStartEdit(workout)}
                workout={workout}
              />
            ))}
          </View>
        )}
      </Card>

      <Modal
        animationType="slide"
        onRequestClose={handleCancelEdit}
        presentationStyle="pageSheet"
        visible={draftWorkout !== null}
      >
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalEyebrow}>Workout</Text>
              <Text style={styles.modalTitle}>
                {editingWorkout ? `Edit ${editingWorkout.title}` : "Add Workout"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleCancelEdit}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {draftWorkout ? (
              <>
                <WorkoutCalendarEditor
                  draftWorkout={draftWorkout}
                  onCancel={handleCancelEdit}
                  onDelete={editingWorkout ? () => setIsDeletePending(true) : undefined}
                  onSave={() =>
                    editingWorkout ? handleSaveWorkout(editingWorkout) : handleCreateWorkout()
                  }
                  onUpdateDraftWorkout={(updater) =>
                    setDraftWorkout((currentDraft) =>
                      currentDraft ? updater(currentDraft) : currentDraft,
                    )
                  }
                  saveLabel={editingWorkout ? "Save Changes" : "Create Workout"}
                />

                {editingWorkout && isDeletePending ? (
                  <View style={styles.confirmationBox}>
                    <Text style={styles.confirmationTitle}>Delete this workout?</Text>
                    <Text style={styles.mutedText}>
                      This removes the workout locally and syncs the delete when the backend is configured.
                    </Text>
                    <View style={styles.actionRow}>
                      <Button onPress={() => handleConfirmDelete(editingWorkout)} variant="danger">
                        Confirm Delete
                      </Button>
                      <Button onPress={() => setIsDeletePending(false)} variant="secondary">
                        Keep Workout
                      </Button>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

type WorkoutCalendarItemProps = {
  onStartEdit: () => void;
  workout: Workout;
};

function WorkoutCalendarItem({
  onStartEdit,
  workout,
}: WorkoutCalendarItemProps) {
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

      <View style={styles.actionRow}>
        <Button onPress={onStartEdit} variant="secondary">
          Modify
        </Button>
      </View>
    </View>
  );
}

type CalendarDay = {
  date: Date;
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isFirstDayOfMonth: boolean;
  isToday: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function addDays(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset, 12);
}

function buildCalendarWeeks(date: Date): CalendarDay[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const gridStartDate = addDays(firstDay, -firstDay.getDay());
  const todayKey = getDateKeyFromDate(new Date());

  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const dayDate = addDays(gridStartDate, weekIndex * 7 + dayIndex);
      const dateKey = getDateKeyFromDate(dayDate);

      return {
        date: dayDate,
        dateKey,
        dayOfMonth: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === month,
        isFirstDayOfMonth: dayDate.getDate() === 1,
        isToday: dateKey === todayKey,
      };
    }),
  );
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

function createEmptyWorkout(dateKey: string): Workout {
  return {
    date: buildDateTime(dateKey, 12, 0),
    exercises: [],
    id: createId("workout"),
    status: "completed",
    title: "Workout",
  };
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function groupNutritionEntriesByDate(entries: NutritionEntry[]) {
  const groupedEntries = new Map<string, NutritionEntry[]>();

  entries.forEach((entry) => {
    const entriesForDate = groupedEntries.get(entry.date) ?? [];
    groupedEntries.set(entry.date, [...entriesForDate, entry]);
  });

  return groupedEntries;
}

function getDateKey(date: string) {
  return getDateKeyFromDate(new Date(date));
}

function buildDateTime(dateKey: string, hours: number, minutes: number) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day, hours, minutes).toISOString();
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

function formatAccessibilityDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function formatCalendarDayLabel(day: CalendarDay) {
  if (day.isFirstDayOfMonth) {
    return `${formatMonthAbbrev(day.date)} ${day.dayOfMonth}`;
  }

  return String(day.dayOfMonth);
}

function formatMonthAbbrev(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
}

function formatMonthName(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(date);
}

function formatYear(date: Date) {
  return String(date.getFullYear());
}

function formatWorkoutTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDayEntrySummary(workoutCount: number, nutritionCount: number) {
  const summaries = [];

  if (workoutCount > 0) {
    summaries.push(`${workoutCount} completed ${workoutCount === 1 ? "workout" : "workouts"}`);
  }

  if (nutritionCount > 0) {
    summaries.push(`${nutritionCount} nutrition ${nutritionCount === 1 ? "entry" : "entries"}`);
  }

  return summaries.length > 0 ? summaries.join(", ") : "no workout or nutrition entries";
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
  calendarHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  calendarPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 34,
    borderWidth: 1,
    boxShadow: `0px 16px 34px ${colors.shadow}`,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  monthTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  calendarEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  monthTitle: {
    color: colors.text,
    fontSize: typography.sizes.display,
    lineHeight: typography.lineHeights.display,
  },
  monthTitleStrong: {
    fontWeight: typography.weights.bold,
  },
  monthTitleYear: {
    color: colors.textMuted,
    fontWeight: typography.weights.regular,
  },
  monthNav: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  monthNavButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  monthNavText: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subtitle,
  },
  calendarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  legendItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  calendarSurface: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  weekdayRow: {
    flexDirection: "row",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekdayText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
    lineHeight: typography.lineHeights.caption,
    paddingVertical: spacing.md,
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarGrid: {
    backgroundColor: colors.surfaceElevated,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    alignItems: "flex-end",
    backgroundColor: colors.surfaceElevated,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: spacing.xs,
    justifyContent: "flex-start",
    minHeight: 78,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
  },
  lastDayCell: {
    borderRightWidth: 0,
  },
  outsideMonthDayCell: {
    backgroundColor: colors.surfaceMuted,
  },
  selectedDayCell: {
    backgroundColor: colors.accentMuted,
  },
  dayNumberBadge: {
    alignItems: "center",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 28,
    paddingHorizontal: spacing.xs,
  },
  selectedDayNumberBadge: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.body,
  },
  outsideMonthDayNumber: {
    color: colors.borderStrong,
  },
  todayDayNumber: {
    color: colors.primary,
  },
  selectedDayText: {
    color: colors.surface,
  },
  dayMarkers: {
    alignItems: "flex-end",
    gap: 2,
    marginRight: spacing.xs,
  },
  entryMarker: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  workoutDot: {
    backgroundColor: colors.workout,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  nutritionDot: {
    backgroundColor: colors.nutrition,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  entryMarkerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
  },
  modalScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  modalTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  modalEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  modalContent: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  sessionList: {
    gap: spacing.md,
  },
  sessionItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  confirmationBox: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
    borderRadius: 22,
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
  emptyInline: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  emptyInlineTitle: {
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
