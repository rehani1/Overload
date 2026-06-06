import { useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
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
        <Header title="Home" subtitle="Start a session and keep the essentials close." />

        <Button onPress={() => router.push("../workout/active")}>Start Workout</Button>

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
            <Text style={styles.modalEyebrow}>Calendar Details</Text>
            <Text style={styles.modalTitle}>
              {selectedDateKey ? formatDateTitle(selectedDateKey) : ""}
            </Text>
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
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.xxl,
  },
  modalTitleGroup: {
    flex: 1,
    gap: spacing.xs,
  },
  modalEyebrow: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
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
    backgroundColor: colors.surfaceMuted,
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
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  pressed: {
    opacity: 0.84,
  },
});
