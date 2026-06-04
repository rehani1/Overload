import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockProgress } from "@/features/progress/mockProgress";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { Workout } from "@/types/workout";

export default function ProgressScreen() {
  const { workouts } = useWorkoutHistoryStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");
  const volumeByMuscleGroup = getVolumeByMuscleGroup(completedWorkouts).slice(0, 4);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Progress" subtitle="Quick checks for consistency, volume, and top lifts." />

        <View style={styles.grid}>
          <MetricCard label="Workouts this week" value={String(mockProgress.workoutsThisWeek)} />
          <MetricCard label="Sets this week" value={String(mockProgress.totalSetsThisWeek)} />
        </View>

        <Card title="Top Lift">
          <Text style={styles.metricValue}>{mockProgress.topLiftValue} lb</Text>
          <Text style={styles.bodyText}>{mockProgress.topLiftName}</Text>
        </Card>

        <Card title="Consistency">
          <Text style={styles.bodyText}>{mockProgress.consistencyText}</Text>
          <Text style={styles.mutedText}>{completedWorkouts.length} completed sessions in history.</Text>
        </Card>

        <Card title="Recent PRs">
          <Text style={styles.bodyText}>PR tracking placeholder.</Text>
          <Text style={styles.mutedText}>Next step: compare best sets by exercise over time.</Text>
        </Card>

        <Card title="Volume by Muscle Group">
          {volumeByMuscleGroup.length === 0 ? (
            <Text style={styles.bodyText}>Finish workouts to build a muscle-group volume view.</Text>
          ) : (
            <View style={styles.volumeList}>
              {volumeByMuscleGroup.map((entry) => (
                <View key={entry.muscleGroup} style={styles.volumeRow}>
                  <Text style={styles.bodyText}>{entry.muscleGroup}</Text>
                  <Text style={styles.mutedText}>{entry.setCount} sets</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.mutedText}>{label}</Text>
    </Card>
  );
}

type MuscleVolume = {
  muscleGroup: string;
  setCount: number;
};

function getVolumeByMuscleGroup(workouts: Workout[]) {
  const volume = new Map<string, number>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((workoutExercise) => {
      const currentSets = volume.get(workoutExercise.exercise.muscleGroup) ?? 0;
      volume.set(workoutExercise.exercise.muscleGroup, currentSets + workoutExercise.sets.length);
    });
  });

  return Array.from(volume.entries())
    .map<MuscleVolume>(([muscleGroup, setCount]) => ({
      muscleGroup,
      setCount,
    }))
    .sort((a, b) => b.setCount - a.setCount);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.display,
  },
  bodyText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  volumeList: {
    gap: spacing.sm,
  },
  volumeRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
});
