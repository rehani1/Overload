import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import type { Workout } from "@/types/workout";

export default function WorkoutsScreen() {
  const { workouts } = useWorkoutHistoryStore();
  const completedWorkouts = workouts.filter((workout) => workout.status === "completed");

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Workouts" subtitle="Browse completed sessions and repeat useful templates." />

        {completedWorkouts.length === 0 ? (
          <Card title="History">
            <EmptyState title="No completed workouts" message="Finish a workout to see it here." />
          </Card>
        ) : (
          completedWorkouts.map((workout) => (
            <WorkoutHistoryItem
              key={workout.id}
              onPress={() =>
                router.push({
                  pathname: "../workout/[id]",
                  params: { id: workout.id },
                })
              }
              workout={workout}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

type WorkoutHistoryItemProps = {
  workout: Workout;
  onPress: () => void;
};

function WorkoutHistoryItem({ workout, onPress }: WorkoutHistoryItemProps) {
  const setCount = workout.exercises.reduce(
    (total, workoutExercise) => total + workoutExercise.sets.length,
    0,
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card title={workout.title}>
        <Text style={styles.dateText}>{formatWorkoutDate(workout.date)}</Text>
        <Text style={styles.metaText}>
          {workout.exercises.length} exercises · {setCount} sets
        </Text>
      </Card>
    </Pressable>
  );
}

function formatWorkoutDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pressed: {
    opacity: 0.84,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  metaText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
});
