import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Button } from "@/components/Button";
import { ModalShell } from "@/components/ModalShell";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { NutritionSection } from "@/features/nutrition/NutritionSection";
import { WorkoutCalendar, WorkoutDateDetails } from "@/features/workouts/WorkoutCalendar";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import { formatDateKey, parseDateKey } from "@/utils/date";
import {
  formatRoundedNumber,
  getNutritionTotals,
} from "@/utils/nutrition";

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TodayNutritionDashboard />

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

function TodayNutritionDashboard() {
  const { entries, getTargetForDate } = useNutritionStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const todayKey = formatDateKey(new Date());
  const totals = getNutritionTotals(entries.filter((entry) => entry.date === todayKey));
  const target = getTargetForDate(todayKey);
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
            <Text style={styles.remainingValue}>{formatRoundedNumber(remainingCalories)}</Text>
            <Text style={styles.remainingLabel}>cal left</Text>
          </View>
        </View>

        <View style={styles.calorieCopy}>
          <Text style={styles.calorieTitle}>Calories</Text>
          <Text style={styles.calorieMeta}>
            {formatRoundedNumber(totals.calories)} of {formatRoundedNumber(target.dailyCalories)} cal
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
              {formatRoundedNumber(macro.current)}/{formatRoundedNumber(macro.target)}g
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
  const insets = useSafeAreaInsets();
  const headerTopPadding = Math.max(insets.top, 58) + spacing.lg;

  return (
    <ModalShell
      closeAccessibilityLabel="Close selected date"
      headerStyle={{ paddingTop: headerTopPadding }}
      onClose={onClose}
      presentationStyle="fullScreen"
      safeAreaEdges={[]}
      title={selectedDateKey ? formatDateTitle(selectedDateKey) : ""}
      visible={selectedDateKey !== null}
    >
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
    </ModalShell>
  );
}

function formatDateTitle(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDateKey(dateKey));
}

function getProgressRatio(current: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(Math.max(current / target, 0), 1);
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
  });
}
