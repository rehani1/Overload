import { useMemo, useState } from "react";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { claimPairingCode, type AuthResponse } from "@/api/authApi";
import { clearApiAuthSession, isApiConfigured, setApiAuthSession } from "@/api/client";
import { importMobileData } from "@/api/importApi";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import {
  importActiveWorkoutForAccount,
  useActiveWorkoutStore,
} from "@/store/useActiveWorkoutStore";
import { useAuthStore } from "@/store/useAuthStore";
import { importNutritionForAccount, useNutritionStore } from "@/store/useNutritionStore";
import { importPresetsForAccount, usePresetStore } from "@/store/usePresetStore";
import {
  importWorkoutHistoryForAccount,
  useWorkoutHistoryStore,
} from "@/store/useWorkoutHistoryStore";
import { useThemeColors } from "@/theme/ThemeProvider";

type PairingStage = "entry" | "confirm" | "complete";

export default function PairMobileScreen() {
  const { connectApiSession, isAuthenticated } = useAuthStore();
  const { activeWorkout } = useActiveWorkoutStore();
  const { entries, target, targetsByDate } = useNutritionStore();
  const { mealPresets, workoutPresets } = usePresetStore();
  const { workouts } = useWorkoutHistoryStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [pendingSession, setPendingSession] = useState<AuthResponse | null>(null);
  const [stage, setStage] = useState<PairingStage>("entry");
  const importCounts = useMemo(
    () => ({
      activeWorkouts: activeWorkout ? 1 : 0,
      mealPresets: mealPresets.length,
      nutritionEntries: entries.length,
      workoutPresets: workoutPresets.length,
      workouts: workouts.length,
    }),
    [activeWorkout, entries.length, mealPresets.length, workoutPresets.length, workouts.length],
  );
  const importTotal = Object.values(importCounts).reduce((total, value) => total + value, 0);

  async function handleClaimCode() {
    if (!isApiConfigured) {
      setError("Set EXPO_PUBLIC_API_URL before pairing mobile.");
      return;
    }

    const normalizedCode = code.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (!normalizedCode) {
      setError("Enter the pairing code from web.");
      return;
    }

    setIsPending(true);
    setError("");

    try {
      const session = await claimPairingCode({ code: normalizedCode });
      setPendingSession(session);

      if (importTotal > 0) {
        setStage("confirm");
        return;
      }

      await connectOnly(session);
    } catch {
      setError("Pairing failed. Generate a new code on web and try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function connectOnly(session = pendingSession) {
    if (!session) {
      return;
    }

    setIsPending(true);
    setError("");

    try {
      await connectApiSession(session);
      setStage("complete");
      router.replace("/home");
    } catch {
      setError("Could not connect this mobile app.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleImportAndConnect() {
    if (!pendingSession) {
      return;
    }

    setIsPending(true);
    setError("");

    try {
      await setApiAuthSession(pendingSession);
      await importMobileData({
        activeWorkout,
        mealPresets,
        nutritionEntries: entries,
        nutritionTarget: target,
        workoutPresets,
        workouts,
      });
      await importNutritionForAccount(
        pendingSession.user.id,
        target,
        entries,
        targetsByDate,
      );
      await importWorkoutHistoryForAccount(pendingSession.user.id, workouts);
      await importActiveWorkoutForAccount(pendingSession.user.id, activeWorkout);
      await importPresetsForAccount(pendingSession.user.id, mealPresets, workoutPresets);
      await connectApiSession(pendingSession);
      setStage("complete");
      router.replace("/home");
    } catch {
      await clearApiAuthSession();
      setError("Import failed. Your local data was not changed.");
    } finally {
      setIsPending(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(isAuthenticated ? "/settings" : "/login");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandLockup}>
          <Text style={styles.brandMark}>Overload</Text>
          <Text style={styles.brandMeta}>Pair mobile</Text>
        </View>

        <Card title={stage === "confirm" ? "Import local data" : "Enter pairing code"}>
          {stage === "entry" ? (
            <>
              <Input
                label="Pairing code"
                onChangeText={(value) => setCode(value.toUpperCase())}
                placeholder="ABCDEFGH"
                value={code}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button disabled={isPending} icon="check" onPress={() => void handleClaimCode()}>
                {isPending ? "Pairing" : "Pair mobile"}
              </Button>
            </>
          ) : null}

          {stage === "confirm" ? (
            <>
              <Text style={styles.bodyText}>
                Import {importTotal} local items into {pendingSession?.user.email}.
              </Text>
              <View style={styles.countGrid}>
                <CountRow label="Nutrition entries" value={importCounts.nutritionEntries} />
                <CountRow label="Workouts" value={importCounts.workouts} />
                <CountRow label="Active workout" value={importCounts.activeWorkouts} />
                <CountRow label="Meal presets" value={importCounts.mealPresets} />
                <CountRow label="Workout presets" value={importCounts.workoutPresets} />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button disabled={isPending} icon="check" onPress={() => void handleImportAndConnect()}>
                {isPending ? "Importing" : "Import and connect"}
              </Button>
              <Button
                disabled={isPending}
                icon="arrow-right-on-rectangle"
                onPress={() => void connectOnly()}
                variant="secondary"
              >
                Connect without import
              </Button>
            </>
          ) : null}

          {stage === "complete" ? (
            <Text style={styles.bodyText}>Mobile is connected to the web account.</Text>
          ) : null}

          <Button disabled={isPending} icon="arrow-left" onPress={handleBack} variant="secondary">
            Back
          </Button>
        </Card>
      </ScrollView>
    </Screen>
  );
}

type CountRowProps = {
  label: string;
  value: number;
};

function CountRow({ label, value }: CountRowProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.countRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <Text style={styles.countValue}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      gap: spacing.lg,
      justifyContent: "center",
      paddingBottom: spacing.xxl,
      paddingTop: spacing.xl,
    },
    brandLockup: {
      alignItems: "center",
      gap: spacing.xs,
    },
    brandMark: {
      color: colors.text,
      fontSize: typography.sizes.display,
      fontWeight: typography.weights.bold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.display,
    },
    brandMeta: {
      color: colors.textMuted,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.medium,
      lineHeight: typography.lineHeights.body,
    },
    bodyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    countGrid: {
      gap: spacing.sm,
    },
    countRow: {
      alignItems: "center",
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    countValue: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.body,
    },
    errorText: {
      color: colors.danger,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
    },
  });
}
