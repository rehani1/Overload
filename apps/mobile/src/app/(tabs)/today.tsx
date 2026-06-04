import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockAiReports } from "@/features/ai/mockAiReports";
import { mockProgress } from "@/features/progress/mockProgress";
import { mockWorkouts } from "@/features/workouts/mockWorkouts";

const latestWorkout = mockWorkouts[0];
const latestInsight = mockAiReports[0];

function getSetCount() {
  return latestWorkout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0,
  );
}

export default function TodayScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Today" subtitle="Start fast, review what matters, keep moving." />

        <Button onPress={() => router.push("../workout/active")}>Start Workout</Button>

        <Card title="This Week">
          <View style={styles.metricRow}>
            <View>
              <Text style={styles.metricValue}>{mockProgress.workoutsThisWeek}</Text>
              <Text style={styles.metricLabel}>workouts</Text>
            </View>
            <View>
              <Text style={styles.metricValue}>{mockProgress.totalSetsThisWeek}</Text>
              <Text style={styles.metricLabel}>sets</Text>
            </View>
          </View>
          <Text style={styles.bodyText}>{mockProgress.consistencyText}</Text>
        </Card>

        <Card title="Latest Workout">
          <Text style={styles.cardHeadline}>{latestWorkout.title}</Text>
          <Text style={styles.bodyText}>
            {latestWorkout.exercises.length} exercises · {getSetCount()} sets
          </Text>
        </Card>

        <Card title="Latest AI Insight">
          <Text style={styles.cardHeadline}>{latestInsight.title}</Text>
          <Text style={styles.bodyText}>{latestInsight.summary}</Text>
        </Card>

        <Card title="Quick Bodyweight">
          <Text style={styles.bodyText}>Bodyweight check-in will stay quick and local for now.</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  metricRow: {
    flexDirection: "row",
    gap: spacing.xxl,
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.display,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  cardHeadline: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  bodyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
