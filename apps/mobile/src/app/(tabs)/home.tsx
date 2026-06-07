import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { NutritionSection } from "@/features/nutrition/NutritionSection";
import { WorkoutCalendar, WorkoutDateDetails } from "@/features/workouts/WorkoutCalendar";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function HomeScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Overload</Text>
            <Text style={styles.heroTitle}>Log today.</Text>
          </View>

          <View style={styles.heroActions}>
            <Button icon="play" onPress={() => router.push("/workout/active")}>
              Start Workout
            </Button>
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
  const colors = useThemeColors();
  const styles = createStyles(colors);

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
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Icon color={colors.text} name="x-mark" size={18} />
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    backgroundColor: colors.heroBackground,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 30,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  heroCopy: {
    gap: spacing.xs,
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
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.7,
    lineHeight: typography.lineHeights.display,
  },
  heroActions: {
    alignItems: "flex-start",
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
}
