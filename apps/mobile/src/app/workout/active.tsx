import { useEffect } from "react";
import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { WorkoutEditor } from "@/features/workouts/WorkoutEditor";
import { useAuthStore } from "@/store/useAuthStore";
import { useActiveWorkoutStore } from "@/store/useActiveWorkoutStore";
import { useWorkoutHistoryStore } from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Workout } from "@/types/workout";
import { buildDateTimeFromDate } from "@/utils/date";
import { createId } from "@/utils/id";

export default function ActiveWorkoutScreen() {
  const {
    activeWorkout,
    finishWorkout,
    isHydrated: isActiveWorkoutHydrated,
    resetWorkout,
    startWorkout,
    updateWorkout,
  } = useActiveWorkoutStore();
  const {
    isAuthenticated,
    isHydrated: isAuthHydrated,
    user,
  } = useAuthStore();
  const { addCompletedWorkout } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const unitPreference = user?.unitPreference ?? "lb";

  useEffect(() => {
    if (isAuthenticated && isActiveWorkoutHydrated) {
      startWorkout(createEmptyWorkout());
    }
  }, [isActiveWorkoutHydrated, isAuthenticated, startWorkout]);

  function handleCreateWorkout() {
    const completedWorkout = finishWorkout();

    if (completedWorkout) {
      addCompletedWorkout(completedWorkout);
    }

    router.replace("/home");
  }

  function handleCancel() {
    resetWorkout();

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  }

  if (!isAuthHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!isActiveWorkoutHydrated || !activeWorkout) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <EmptyState title="Starting workout" message="Preparing a blank session." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.eyebrow}>Workout</Text>
          <Text numberOfLines={2} style={styles.title}>Add Workout</Text>
        </View>
        <Pressable
          accessibilityLabel="Close workout editor"
          accessibilityRole="button"
          hitSlop={8}
          onPress={handleCancel}
          style={styles.closeButton}
        >
          <Icon color={colors.text} name="x-mark" size={20} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WorkoutEditor
          cancelLabel="Cancel"
          isSaveDisabled={activeWorkout.exercises.length === 0}
          onCancel={handleCancel}
          onSave={handleCreateWorkout}
          onUpdateWorkout={updateWorkout}
          saveLabel="Create Workout"
          unitPreference={unitPreference}
          workout={activeWorkout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function createEmptyWorkout(): Workout {
  return {
    date: buildDateTimeFromDate(new Date(), 12, 0),
    exercises: [],
    id: createId("workout"),
    status: "active",
    title: "Workout",
  };
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      flex: 1,
    },
    header: {
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
    titleGroup: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    title: {
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
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
  });
}
