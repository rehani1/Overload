import { router } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { WorkoutCalendar } from "@/features/workouts/WorkoutCalendar";
import { mockWorkouts } from "@/features/workouts/mockWorkouts";

const latestWorkout = mockWorkouts[0];

function getSetCount() {
  return latestWorkout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0,
  );
}

export default function HomeScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Home" subtitle="Start a session and keep the essentials close." />

        <Button onPress={() => router.push("../workout/active")}>Start Workout</Button>

        <Card title="Latest Workout">
          <Text style={styles.cardHeadline}>{latestWorkout.title}</Text>
          <Text style={styles.bodyText}>
            {latestWorkout.exercises.length} exercises · {getSetCount()} sets
          </Text>
        </Card>

        <WorkoutCalendar />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
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
