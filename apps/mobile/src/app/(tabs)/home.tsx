import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { NutritionSection } from "@/features/nutrition/NutritionSection";
import { WorkoutCalendar, WorkoutDateDetails } from "@/features/workouts/WorkoutCalendar";

export default function HomeScreen() {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Mobile companion</Text>
            <Text style={styles.heroTitle}>Capture the essentials. Review the depth later.</Text>
            <Text style={styles.heroSubtitle}>
              Keep workouts and nutrition lightweight here so the future web dashboard has clean data
              to analyze.
            </Text>
          </View>

          <View style={styles.heroActions}>
            <Button onPress={() => router.push("../workout/active")} variant="secondary">
              Start Workout
            </Button>
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <View style={[styles.legendDot, styles.workoutDot]} />
                <Text style={styles.heroPillText}>Workout</Text>
              </View>
              <View style={styles.heroPill}>
                <View style={[styles.legendDot, styles.nutritionDot]} />
                <Text style={styles.heroPillText}>Nutrition</Text>
              </View>
            </View>
          </View>
        </View>

        <WorkoutCalendar onDatePress={setSelectedDateKey} />
      </ScrollView>

      <DateDetailsModal
        onClose={() => setSelectedDateKey(null)}
        selectedDateKey={selectedDateKey}
      />
    </Screen>
  );
}

type DateDetailsModalProps = {
  onClose: () => void;
  selectedDateKey: string | null;
};

function DateDetailsModal({ onClose, selectedDateKey }: DateDetailsModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={selectedDateKey !== null}
    >
      <View style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleGroup}>
            <Text style={styles.modalEyebrow}>Selected date</Text>
            <Text style={styles.modalTitle}>
              {selectedDateKey ? formatDateTitle(selectedDateKey) : ""}
            </Text>
            <Text style={styles.modalSubtitle}>Add or adjust mobile entries for this calendar day.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          {selectedDateKey ? (
            <>
              <WorkoutDateDetails
                key={`workouts-${selectedDateKey}`}
                selectedDateKey={selectedDateKey}
              />
              <NutritionSection
                key={`nutrition-${selectedDateKey}`}
                selectedDate={selectedDateKey}
                showDateControls={false}
              />
            </>
          ) : null}
        </ScrollView>
      </View>
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

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.primary,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 36,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  heroCopy: {
    gap: spacing.md,
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
    color: colors.surface,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.7,
    lineHeight: typography.lineHeights.display,
  },
  heroSubtitle: {
    color: "#D8D1F5",
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  heroActions: {
    gap: spacing.md,
  },
  heroPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroPill: {
    alignItems: "center",
    backgroundColor: "rgba(255, 252, 246, 0.12)",
    borderColor: "rgba(255, 252, 246, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  heroPillText: {
    color: colors.surface,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  workoutDot: {
    backgroundColor: colors.workout,
  },
  nutritionDot: {
    backgroundColor: colors.nutrition,
  },
  modalScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  modalHeader: {
    alignItems: "flex-start",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.xxl,
  },
  modalTitleGroup: {
    flex: 1,
    gap: spacing.xs,
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
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  closeButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  modalContent: {
    gap: spacing.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pressed: {
    opacity: 0.84,
  },
});
