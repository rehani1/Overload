import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { NutritionSection } from "@/features/nutrition/NutritionSection";
import { WorkoutCalendar, WorkoutDateDetails } from "@/features/workouts/WorkoutCalendar";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Workout } from "@/types/workout";

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TodayNutritionDashboard />

        <LatestSessionCard />

        <WorkoutCalendar onDatePress={setSelectedDateKey} />
      </ScrollView>

      <View pointerEvents="box-none" style={styles.floatingWorkoutBar}>
        <Button icon="play" onPress={() => router.push("/workout/active")} style={styles.floatingWorkoutButton}>
          Start workout
        </Button>
      </View>

      <DateDetailsModal
        onClose={() => setSelectedDateKey(null)}
        selectedDateKey={selectedDateKey}
      />
    </Screen>
  );
}

function LatestSessionCard() {
  const { workouts } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const latestWorkout = getLatestWorkout(workouts.filter((workout) => workout.status === "completed"));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!latestWorkout}
      onPress={() => {
        if (latestWorkout) {
          router.push(`/workout/${latestWorkout.id}`);
        }
      }}
      style={styles.latestSessionCard}
    >
      <View style={styles.latestSessionCopy}>
        <Text style={styles.latestSessionEyebrow}>Latest session</Text>
        <Text style={styles.latestSessionTitle}>{latestWorkout?.title ?? "No workout yet"}</Text>
        <Text style={styles.latestSessionMeta}>
          {latestWorkout
            ? `${formatShortDate(latestWorkout.date)} · ${latestWorkout.exercises.length} exercises · ${countWorkoutSets(
                latestWorkout,
              )} sets`
            : "Start a workout to build your training history."}
        </Text>
      </View>

      <View style={styles.latestSessionIcon}>
        <Icon color={colors.primary} name="fire" size={22} />
      </View>
    </Pressable>
  );
}

function TodayNutritionDashboard() {
  const { entries, target } = useNutritionStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const todayKey = getDateKeyFromDate(new Date());
  const totals = entries
    .filter((entry) => entry.date === todayKey)
    .reduce(
      (dailyTotals, entry) => ({
        calories: dailyTotals.calories + entry.calories,
        carbsGrams: dailyTotals.carbsGrams + entry.carbsGrams,
        fatGrams: dailyTotals.fatGrams + entry.fatGrams,
        proteinGrams: dailyTotals.proteinGrams + entry.proteinGrams,
      }),
      {
        calories: 0,
        carbsGrams: 0,
        fatGrams: 0,
        proteinGrams: 0,
      },
    );
  const remainingCalories = Math.max(target.dailyCalories - totals.calories, 0);
  const calorieProgress = getProgressRatio(totals.calories, target.dailyCalories);
  const ringSize = 132;
  const ringStroke = 12;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - calorieProgress);
  const macros = [
    {
      color: colors.primary,
      current: totals.proteinGrams,
      label: "Protein",
      target: target.proteinGrams,
    },
    {
      color: colors.primary,
      current: totals.carbsGrams,
      label: "Carbs",
      target: target.carbsGrams,
    },
    {
      color: colors.primary,
      current: totals.fatGrams,
      label: "Fat",
      target: target.fatGrams,
    },
  ];

  return (
    <View style={styles.todaySection}>
      <Text style={styles.sectionTitle}>Today</Text>

      <View style={styles.calorieProgressCard}>
        <View style={styles.calorieRing}>
          <Svg height={ringSize} width={ringSize}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              fill="none"
              r={ringRadius}
              stroke={colors.surfaceMuted}
              strokeWidth={ringStroke}
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              fill="none"
              r={ringRadius}
              stroke={colors.primary}
              strokeDasharray={`${ringCircumference} ${ringCircumference}`}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              strokeWidth={ringStroke}
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>

          <View style={styles.calorieRingCenter}>
            <Text style={styles.remainingValue}>{formatNumber(remainingCalories)}</Text>
            <Text style={styles.remainingLabel}>cal left</Text>
          </View>
        </View>

        <View style={styles.calorieCopy}>
          <Text style={styles.calorieTitle}>Calories</Text>
          <Text style={styles.calorieMeta}>
            {formatNumber(totals.calories)} of {formatNumber(target.dailyCalories)} cal
          </Text>
        </View>
      </View>

      <View style={styles.macroSummaryCard}>
        {macros.map((macro) => (
          <View key={macro.label} style={styles.macroColumn}>
            <Text style={styles.macroLabel}>{macro.label}</Text>
            <View style={styles.macroTrack}>
              <View
                style={[
                  styles.macroFill,
                  {
                    backgroundColor: macro.color,
                    width: `${getProgressRatio(macro.current, macro.target) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.macroValue}>
              {formatNumber(macro.current)}/{formatNumber(macro.target)}g
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type DateDetailsModalProps = {
  onClose: () => void;
  selectedDateKey: string | null;
};

function DateDetailsModal({ onClose, selectedDateKey }: DateDetailsModalProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={selectedDateKey !== null}
    >
      <SafeAreaView edges={["top"]} style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalEyebrow}>Selected date</Text>
            <Text numberOfLines={2} style={styles.modalTitle}>
              {selectedDateKey ? formatDateTitle(selectedDateKey) : ""}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Close selected date"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Icon color={colors.text} name="x-mark" size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {selectedDateKey ? (
            <>
              <WorkoutDateDetails
                isCompact
                key={`workouts-${selectedDateKey}`}
                selectedDateKey={selectedDateKey}
              />
              <NutritionSection
                isCompact
                key={`nutrition-${selectedDateKey}`}
                selectedDate={selectedDateKey}
                showDateControls={false}
                showIntroCard={false}
              />
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatDateTitle(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getProgressRatio(current: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(Math.max(current / target, 0), 1);
}

function countWorkoutSets(workout: Workout) {
  return workout.exercises.reduce((total, workoutExercise) => total + workoutExercise.sets.length, 0);
}

function getLatestWorkout(workouts: Workout[]) {
  return [...workouts].sort(
    (firstWorkout, secondWorkout) =>
      new Date(secondWorkout.date).getTime() - new Date(firstWorkout.date).getTime(),
  )[0];
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: 112,
  },
  floatingWorkoutBar: {
    bottom: spacing.md,
    left: 0,
    paddingHorizontal: spacing.xl,
    position: "absolute",
    right: 0,
  },
  floatingWorkoutButton: {
    minHeight: 64,
  },
  todaySection: {
    gap: spacing.md,
  },
  latestSessionCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 26,
    borderWidth: 1,
    boxShadow: `0px 10px 24px ${colors.shadow}`,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  latestSessionCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  latestSessionEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  latestSessionTitle: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.subtitle,
  },
  latestSessionMeta: {
    color: colors.textMuted,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  latestSessionIcon: {
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    borderRadius: 18,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  calorieProgressCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: `0px 14px 30px ${colors.shadow}`,
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.lg,
  },
  calorieRing: {
    alignItems: "center",
    height: 132,
    justifyContent: "center",
    width: 132,
  },
  calorieRingCenter: {
    alignItems: "center",
    gap: 2,
    justifyContent: "center",
    position: "absolute",
  },
  remainingValue: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  remainingLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  calorieCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  calorieTitle: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.subtitle,
  },
  calorieMeta: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  macroSummaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: `0px 10px 24px ${colors.shadow}`,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  macroColumn: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  macroLabel: {
    color: colors.text,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  macroTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  macroFill: {
    borderRadius: 999,
    height: "100%",
  },
  macroValue: {
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
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
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
  modalContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  pressed: {
    opacity: 0.84,
  },
  });
}
