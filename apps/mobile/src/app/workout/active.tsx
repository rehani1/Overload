import { useEffect } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { WorkoutEditor } from "@/features/workouts/WorkoutEditor";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
    finishWorkout,
    isHydrated,
    startWorkout,
    updateWorkout,
  } = useActiveWorkoutStore();
  const { addCompletedWorkout } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  useEffect(() => {
    if (isHydrated && !activeWorkout) {
      startWorkout();
    }
  }, [activeWorkout, isHydrated, startWorkout]);

  function handleFinishWorkout() {
    const completedWorkout = finishWorkout();

    if (completedWorkout) {
      addCompletedWorkout(completedWorkout);
    }

    router.replace("/home");
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  }

  if (!isHydrated || !activeWorkout) {
    return (
      <Screen>
        <EmptyState title="Starting workout" message="Preparing a blank session." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topAction}>
          <Button icon="arrow-left" onPress={handleBack} variant="secondary">
            Back
          </Button>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Live session</Text>
          <Text style={styles.heroTitle}>Start workout</Text>
          <Text style={styles.heroSubtitle}>
            Type each movement yourself, add sets, and finish when the session is logged.
          </Text>
        </View>

        <View style={styles.editorPanel}>
          <WorkoutEditor
            cancelLabel="Back"
            isSaveDisabled={activeWorkout.exercises.length === 0}
            onCancel={handleBack}
            onSave={handleFinishWorkout}
            onUpdateWorkout={updateWorkout}
            saveLabel="Finish Workout"
            workout={activeWorkout}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    topAction: {
      alignItems: "flex-start",
    },
    hero: {
      backgroundColor: colors.heroBackground,
      borderColor: "rgba(255, 252, 246, 0.18)",
      borderRadius: 28,
      borderWidth: 1,
      gap: spacing.sm,
      padding: spacing.lg,
    },
    heroEyebrow: {
      color: colors.primaryMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 1,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    heroTitle: {
      color: colors.onPrimary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
    },
    heroSubtitle: {
      color: colors.heroTextMuted,
      fontSize: typography.sizes.small,
      lineHeight: typography.lineHeights.small,
    },
    editorPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 24,
      borderWidth: 1,
      boxShadow: `0px 14px 30px ${colors.shadow}`,
      padding: spacing.lg,
    },
  });
}
