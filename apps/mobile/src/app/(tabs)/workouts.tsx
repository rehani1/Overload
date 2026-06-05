import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { Workout } from "@/types/workout";

export default function WorkoutsScreen() {
  const { deleteWorkout, updateWorkout, workouts } = useWorkoutHistoryStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const initialDate = completedWorkouts[0]?.date ?? new Date().toISOString();
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(initialDate));
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [draftDateKey, setDraftDateKey] = useState(selectedDateKey);
  const [draftTime, setDraftTime] = useState("12:00");
  const [draftTitle, setDraftTitle] = useState("");
  const monthDate = new Date(initialDate);
  const workoutsByDate = groupWorkoutsByDate(completedWorkouts);
  const calendarDays = buildCalendarDays(monthDate);
  const selectedWorkouts = workoutsByDate.get(selectedDateKey) ?? [];

  function handleStartEdit(workout: Workout) {
    setEditingWorkoutId(workout.id);
    setDraftDateKey(getDateKey(workout.date));
    setDraftTime(getTimeInputValue(workout.date));
    setDraftTitle(workout.title);
  }

  function handleCancelEdit() {
    setEditingWorkoutId(null);
  }

  function handleDeleteWorkout(workout: Workout) {
    deleteWorkout(workout.id);
    setEditingWorkoutId(null);
  }

  function handleSaveWorkout(workout: Workout) {
    const updatedWorkout = updateWorkout(workout.id, {
      date: buildWorkoutDate(draftDateKey, draftTime, workout.date),
      title: draftTitle.trim() || workout.title,
    });

    if (updatedWorkout) {
      setSelectedDateKey(getDateKey(updatedWorkout.date));
    }

    setEditingWorkoutId(null);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Calendar" subtitle="See recent completed sessions without turning mobile into analytics." />

        {completedWorkouts.length === 0 ? (
          <Card title="Workout Calendar">
            <EmptyState title="No completed workouts" message="Finish a workout to see it here." />
          </Card>
        ) : (
          <>
            <Card title={formatMonthTitle(monthDate)}>
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
                      onPress={() => day && setSelectedDateKey(day.dateKey)}
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
                      draftDateKey={draftDateKey}
                      draftTime={draftTime}
                      draftTitle={draftTitle}
                      isEditing={editingWorkoutId === workout.id}
                      key={workout.id}
                      onCancelEdit={handleCancelEdit}
                      onDelete={() => handleDeleteWorkout(workout)}
                      onSave={() => handleSaveWorkout(workout)}
                      onStartEdit={() => handleStartEdit(workout)}
                      onUpdateDraftDateKey={setDraftDateKey}
                      onUpdateDraftTime={setDraftTime}
                      onUpdateDraftTitle={setDraftTitle}
                      workout={workout}
                    />
                  ))}
                </View>
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

type WorkoutCalendarItemProps = {
  draftDateKey: string;
  draftTime: string;
  draftTitle: string;
  isEditing: boolean;
  onCancelEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onStartEdit: () => void;
  onUpdateDraftDateKey: (value: string) => void;
  onUpdateDraftTime: (value: string) => void;
  onUpdateDraftTitle: (value: string) => void;
  workout: Workout;
};

function WorkoutCalendarItem({
  draftDateKey,
  draftTime,
  draftTitle,
  isEditing,
  onCancelEdit,
  onDelete,
  onSave,
  onStartEdit,
  onUpdateDraftDateKey,
  onUpdateDraftTime,
  onUpdateDraftTitle,
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

      {isEditing ? (
        <View style={styles.editForm}>
          <Input
            label="Workout title"
            onChangeText={onUpdateDraftTitle}
            placeholder="Workout title"
            value={draftTitle}
          />
          <Input
            label="Date"
            onChangeText={onUpdateDraftDateKey}
            placeholder="YYYY-MM-DD"
            value={draftDateKey}
          />
          <Input
            label="Time"
            onChangeText={onUpdateDraftTime}
            placeholder="HH:MM"
            value={draftTime}
          />

          <View style={styles.actionRow}>
            <Button onPress={onSave}>Save Changes</Button>
            <Button onPress={onCancelEdit} variant="secondary">
              Cancel
            </Button>
            <Button onPress={onDelete} variant="danger">
              Delete Workout
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <Button onPress={onStartEdit} variant="secondary">
            Modify
          </Button>
        </View>
      )}
    </View>
  );
}

type CalendarDay = {
  dateKey: string;
  dayOfMonth: number;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getTimeInputValue(date: string) {
  const parsedDate = new Date(date);
  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pressed: {
    opacity: 0.84,
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
    gap: spacing.xs,
    padding: spacing.md,
  },
  editForm: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
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
