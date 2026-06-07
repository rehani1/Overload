import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isApiConfigured } from "@/api/client";
import {
  createWorkout as createWorkoutRequest,
  deleteWorkout as deleteWorkoutRequest,
  updateWorkout as updateWorkoutRequest,
} from "@/api/workoutApi";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Icon } from "@/components/Icon";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { NutritionEntry } from "@/types/nutrition";
import type { Workout } from "@/types/workout";

import { WorkoutEditor } from "./WorkoutEditor";

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
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const today = new Date();
  const todayDateKey = getDateKeyFromDate(today);
  const [isMonthExpanded, setIsMonthExpanded] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [visibleMonthKey, setVisibleMonthKey] = useState(getMonthKey(today));
  const visibleMonthDate = parseMonthKey(visibleMonthKey);
  const workoutsByDate = groupWorkoutsByDate(completedWorkouts);
  const nutritionEntriesByDate = groupNutritionEntriesByDate(nutritionEntries);
  const workoutDateKeys = new Set(workoutsByDate.keys());
  const compactWeekDays = buildCompactWeekDays(today);
  const calendarWeeks = buildCalendarWeeks(visibleMonthDate);
  const trackedDaysThisWeek = compactWeekDays.filter((day) => workoutDateKeys.has(day.dateKey)).length;

  function handleDatePress(day: CalendarDay) {
    setVisibleMonthKey(getMonthKey(day.date));
    setSelectedDateKey(day.dateKey);
    onDatePress?.(day.dateKey);
  }

  function handleMonthChange(monthOffset: number) {
    const nextMonthDate = addMonths(visibleMonthDate, monthOffset);
    setVisibleMonthKey(getMonthKey(nextMonthDate));
    setSelectedDateKey(getDateKeyFromDate(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)));
  }

  function handleShowMonth() {
    setVisibleMonthKey(getMonthKey(parseDateKey(selectedDateKey)));
    setIsMonthExpanded(true);
  }

  function handleShowWeek() {
    setSelectedDateKey(todayDateKey);
    setVisibleMonthKey(getMonthKey(today));
    setIsMonthExpanded(false);
  }

  return (
    <View style={styles.content}>
      <View style={[styles.calendarPanel, !isMonthExpanded && styles.compactCalendarPanel]}>
        {isMonthExpanded ? (
          <>
            <View style={styles.calendarHeader}>
              <View style={styles.monthTitleGroup}>
                <Text style={styles.calendarEyebrow}>Training calendar</Text>
                <Text style={styles.monthTitle}>
                  <Text style={styles.monthTitleStrong}>{formatMonthName(visibleMonthDate)}</Text>
                  <Text style={styles.monthTitleYear}> {formatYear(visibleMonthDate)}</Text>
                </Text>
              </View>

              <View style={styles.monthControls}>
                <View style={styles.monthNav}>
                  <Pressable
                    accessibilityLabel="Previous month"
                    accessibilityRole="button"
                    onPress={() => handleMonthChange(-1)}
                    style={styles.monthNavButton}
                  >
                    <Icon color={colors.text} name="chevron-left" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Next month"
                    accessibilityRole="button"
                    onPress={() => handleMonthChange(1)}
                    style={styles.monthNavButton}
                  >
                    <Icon color={colors.text} name="chevron-right" size={18} />
                  </Pressable>
                </View>

                <Pressable
                  accessibilityLabel="Show compact week"
                  accessibilityRole="button"
                  onPress={handleShowWeek}
                  style={styles.calendarToggleButton}
                >
                  <Icon color={colors.text} name="arrow-left" size={16} />
                  <Text style={styles.calendarToggleText}>Week</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <Icon color={colors.primary} name="fire" size={16} />
                <Text style={styles.legendText}>Workout entries</Text>
              </View>
              <View style={styles.legendItem}>
                <Icon color={colors.primary} name="shopping-bag" size={16} />
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
                          onPress={() => handleDatePress(day)}
                          style={[
                            styles.dayCell,
                            dayIndex === week.length - 1 && styles.lastDayCell,
                            !day.isCurrentMonth && styles.outsideMonthDayCell,
                            isSelected && styles.selectedDayCell,
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
                                  <Icon color={colors.primary} name="fire" size={12} />
                                </View>
                              ) : null}

                              {nutritionEntriesForDay.length > 0 ? (
                                <View style={styles.entryMarker}>
                                  <Icon color={colors.primary} name="shopping-bag" size={12} />
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
          </>
        ) : (
          <View style={styles.compactCalendarContent}>
            <View style={styles.compactHeader}>
              <Text style={styles.streakTitle}>
                {formatWeeklyTrackingMessage(trackedDaysThisWeek)}
              </Text>

              <Pressable
                accessibilityLabel="Show full month"
                accessibilityRole="button"
                onPress={handleShowMonth}
                style={styles.calendarToggleButton}
              >
                <Icon color={colors.text} name="calendar-days" size={16} />
                <Text style={styles.calendarToggleText}>Month</Text>
              </Pressable>
            </View>

            <View style={styles.compactWeekRow}>
              {compactWeekDays.map((day, dayIndex) => {
                const workoutsForDay = workoutsByDate.get(day.dateKey) ?? [];
                const nutritionEntriesForDay = nutritionEntriesByDate.get(day.dateKey) ?? [];
                const dayEntrySummary = formatDayEntrySummary(
                  workoutsForDay.length,
                  nutritionEntriesForDay.length,
                );
                const hasWorkout = workoutsForDay.length > 0;
                const isSelected = day.dateKey === selectedDateKey;

                return (
                  <Pressable
                    accessibilityLabel={`${compactWeekdayAccessibilityLabels[dayIndex]}, ${formatAccessibilityDate(
                      day.dateKey,
                    )}, ${dayEntrySummary}`}
                    accessibilityRole="button"
                    key={day.dateKey}
                    onPress={() => handleDatePress(day)}
                    style={[
                      styles.compactDayButton,
                      hasWorkout && styles.compactDayButtonActive,
                      day.isToday && !hasWorkout && styles.compactDayButtonToday,
                      isSelected && !hasWorkout && styles.compactDayButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.compactDayText,
                        hasWorkout && styles.compactDayTextActive,
                        (day.isToday || isSelected) && !hasWorkout && styles.compactDayTextSelected,
                      ]}
                    >
                      {compactWeekdayLabels[dayIndex]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

type WorkoutDateDetailsProps = {
  isCompact?: boolean;
  selectedDateKey: string;
};

export function WorkoutDateDetails({
  isCompact = false,
  selectedDateKey,
}: WorkoutDateDetailsProps) {
  const {
    addCompletedWorkout,
    deleteWorkout,
    restoreWorkout,
    updateWorkout,
    workouts,
  } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
    if (editingWorkout?.id === workout.id) {
      handleCancelEdit();
      return;
    }

    setEditingWorkout(workout);
    setIsDeletePending(false);
    setDraftWorkout(cloneWorkout(workout));
  }

  function handleStartAdd() {
    setEditingWorkout(null);
    setIsDeletePending(false);
    setDraftWorkout(createEmptyWorkout(selectedDateKey));
  }

  function handleUpdateDraftWorkout(updater: (workout: Workout) => Workout) {
    setDraftWorkout((currentDraft) => (currentDraft ? updater(currentDraft) : currentDraft));
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
    <View style={[styles.content, isCompact && styles.compactDetailsContent]}>
      <Card title="Workout" style={isCompact && styles.compactDetailsCard}>
        {syncState.kind !== "idle" ? (
          <Text style={[styles.syncText, syncState.kind === "error" && styles.errorText]}>
            {syncState.message}
          </Text>
        ) : null}
        <View style={[styles.actionRow, isCompact && styles.compactActionRow]}>
          <Button icon="plus" onPress={handleStartAdd} style={isCompact && styles.compactActionButton}>
            Add Workout
          </Button>
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
                draftWorkout={editingWorkout?.id === workout.id ? draftWorkout : null}
                isCompact={isCompact}
                isDeletePending={editingWorkout?.id === workout.id && isDeletePending}
                isExpanded={editingWorkout?.id === workout.id}
                key={workout.id}
                onCancelEdit={handleCancelEdit}
                onCancelDelete={() => setIsDeletePending(false)}
                onConfirmDelete={() => {
                  void handleConfirmDelete(workout);
                }}
                onRequestDelete={() => setIsDeletePending(true)}
                onSave={() => {
                  void handleSaveWorkout(workout);
                }}
                onStartEdit={() => handleStartEdit(workout)}
                onUpdateDraftWorkout={handleUpdateDraftWorkout}
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
        visible={draftWorkout !== null && editingWorkout === null}
      >
        <SafeAreaView edges={["top"]} style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalEyebrow}>Workout</Text>
              <Text numberOfLines={2} style={styles.modalTitle}>Add Workout</Text>
            </View>
            <Pressable
              accessibilityLabel="Close workout editor"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleCancelEdit}
              style={styles.closeButton}
            >
              <Icon color={colors.text} name="x-mark" size={20} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {draftWorkout ? (
              <WorkoutEditor
                onCancel={handleCancelEdit}
                onSave={handleCreateWorkout}
                onUpdateWorkout={handleUpdateDraftWorkout}
                saveLabel="Create Workout"
                workout={draftWorkout}
              />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

type WorkoutCalendarItemProps = {
  draftWorkout: Workout | null;
  isCompact?: boolean;
  isDeletePending: boolean;
  isExpanded: boolean;
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
  draftWorkout,
  isCompact = false,
  isDeletePending,
  isExpanded,
  onCancelDelete,
  onCancelEdit,
  onConfirmDelete,
  onRequestDelete,
  onSave,
  onStartEdit,
  onUpdateDraftWorkout,
  workout,
}: WorkoutCalendarItemProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const setCount = workout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0,
  );

  return (
    <View style={[styles.sessionItem, isCompact && styles.compactSessionItem]}>
      <Pressable
        accessibilityLabel={`${workout.title}, ${isExpanded ? "collapse" : "expand"}`}
        accessibilityRole="button"
        onPress={onStartEdit}
        style={styles.expandableSummary}
      >
        <View style={styles.expandableSummaryCopy}>
          <Text style={styles.sessionTitle}>{workout.title}</Text>
          <Text style={styles.mutedText}>{formatWorkoutTime(workout.date)}</Text>
          <Text style={styles.metaText}>
            {workout.exercises.length} exercises · {setCount} sets
          </Text>
        </View>

        <Icon
          color={colors.textMuted}
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
        />
      </Pressable>

      {isExpanded && draftWorkout ? (
        <WorkoutEditor
          isDeletePending={isDeletePending}
          onCancel={onCancelEdit}
          onCancelDelete={onCancelDelete}
          onConfirmDelete={onConfirmDelete}
          onRequestDelete={onRequestDelete}
          onSave={onSave}
          onUpdateWorkout={onUpdateDraftWorkout}
          workout={draftWorkout}
        />
      ) : null}
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
const compactWeekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];
const compactWeekdayAccessibilityLabels = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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

function buildCompactWeekDays(date: Date): CalendarDay[] {
  const weekStartOffset = date.getDay() === 0 ? -6 : 1 - date.getDay();
  const weekStartDate = addDays(date, weekStartOffset);
  const todayKey = getDateKeyFromDate(new Date());
  const currentMonth = date.getMonth();

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const dayDate = addDays(weekStartDate, dayIndex);
    const dateKey = getDateKeyFromDate(dayDate);

    return {
      date: dayDate,
      dateKey,
      dayOfMonth: dayDate.getDate(),
      isCurrentMonth: dayDate.getMonth() === currentMonth,
      isFirstDayOfMonth: dayDate.getDate() === 1,
      isToday: dateKey === todayKey,
    };
  });
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
  return String(day.dayOfMonth);
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

function formatWeeklyTrackingMessage(trackedDays: number) {
  if (trackedDays === 0) {
    return "No workouts tracked this week yet.";
  }

  const dayLabel = trackedDays === 1 ? "day" : "days";

  return `You've tracked ${trackedDays} ${dayLabel} this week!`;
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  compactDetailsContent: {
    gap: spacing.md,
  },
  compactDetailsCard: {
    borderRadius: 24,
    gap: spacing.md,
    padding: spacing.lg,
  },
  syncText: {
    color: colors.textMuted,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  errorText: {
    color: colors.danger,
  },
  pressed: {
    opacity: 0.84,
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  calendarPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 30,
    borderWidth: 1,
    boxShadow: `0px 16px 34px ${colors.shadow}`,
    gap: spacing.md,
    padding: spacing.md,
  },
  compactCalendarPanel: {
    borderRadius: 28,
    gap: spacing.md,
    padding: spacing.md,
  },
  compactCalendarContent: {
    gap: spacing.md,
  },
  compactHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  streakTitle: {
    color: colors.text,
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.body,
  },
  monthTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  calendarEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  monthTitle: {
    color: colors.text,
    fontSize: typography.sizes.title,
    lineHeight: typography.lineHeights.title,
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
    gap: spacing.xs,
  },
  monthControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  monthNavButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  calendarToggleButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  calendarToggleText: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.small,
  },
  compactWeekRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  compactDayButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 2,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  compactDayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compactDayButtonToday: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primary,
  },
  compactDayButtonSelected: {
    borderColor: colors.accent,
  },
  compactDayText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  compactDayTextActive: {
    color: colors.onPrimary,
  },
  compactDayTextSelected: {
    color: colors.primary,
  },
  calendarLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  legendItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  calendarSurface: {
    backgroundColor: colors.calendarSurface,
    borderColor: colors.calendarGridBorder,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  weekdayRow: {
    flexDirection: "row",
    borderBottomColor: colors.calendarGridBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekdayText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
    lineHeight: typography.lineHeights.caption,
    paddingVertical: spacing.sm,
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarGrid: {
    backgroundColor: colors.calendarSurface,
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    alignItems: "center",
    backgroundColor: colors.calendarSurface,
    borderBottomColor: colors.calendarGridBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.calendarGridBorder,
    borderRightWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 2,
    justifyContent: "flex-start",
    minHeight: 54,
    paddingHorizontal: 2,
    paddingTop: spacing.xs,
  },
  lastDayCell: {
    borderRightWidth: 0,
  },
  outsideMonthDayCell: {
    backgroundColor: colors.calendarOutsideSurface,
  },
  selectedDayCell: {
    backgroundColor: colors.primaryMuted,
  },
  dayNumberBadge: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 28,
    paddingHorizontal: 2,
  },
  selectedDayNumberBadge: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    color: colors.text,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.small,
  },
  outsideMonthDayNumber: {
    color: colors.borderStrong,
  },
  todayDayNumber: {
    color: colors.primary,
  },
  selectedDayText: {
    color: colors.onPrimary,
  },
  dayMarkers: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  entryMarker: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 2,
    minHeight: 18,
    paddingHorizontal: 3,
  },
  modalScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  modalTitleGroup: {
    flex: 1,
    gap: 2,
    minWidth: 0,
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
    fontSize: 22,
    fontWeight: typography.weights.bold,
    lineHeight: 28,
  },
  modalContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sessionList: {
    gap: spacing.md,
  },
  sessionItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  compactSessionItem: {
    borderRadius: 18,
    gap: spacing.sm,
    padding: spacing.md,
  },
  expandableSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  expandableSummaryCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  compactActionRow: {
    gap: spacing.sm,
    marginTop: 0,
  },
  compactActionButton: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
}
