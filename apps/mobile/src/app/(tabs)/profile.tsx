import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockUser } from "@/features/profile/mockUser";
import { useAuthStore } from "@/store/useAuthStore";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { NutritionTargetUpdate } from "@/types/nutrition";

type TargetDraft = {
  carbsGrams: string;
  dailyCalories: string;
  fatGrams: string;
  proteinGrams: string;
};

export default function ProfileScreen() {
  const { target, updateTarget } = useNutritionStore();
  const { updateUser, user } = useAuthStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;
  const [goalDraft, setGoalDraft] = useState(profileUser.goal);
  const [isGoalEditing, setIsGoalEditing] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [targetDraft, setTargetDraft] = useState<TargetDraft>(getTargetDraft(target));
  const [isTargetEditing, setIsTargetEditing] = useState(false);
  const [targetError, setTargetError] = useState("");
  const targetMacros = [
    {
      label: "Protein",
      value: `${formatNumber(target.proteinGrams)}g`,
    },
    {
      label: "Carbs",
      value: `${formatNumber(target.carbsGrams)}g`,
    },
    {
      label: "Fat",
      value: `${formatNumber(target.fatGrams)}g`,
    },
  ];

  function startGoalEdit() {
    setGoalDraft(profileUser.goal);
    setGoalError("");
    setIsGoalEditing(true);
  }

  function saveGoal() {
    const nextGoal = goalDraft.trim();

    if (!nextGoal) {
      setGoalError("Add a goal before saving.");
      return;
    }

    updateUser({ goal: nextGoal });
    setGoalError("");
    setIsGoalEditing(false);
  }

  function startTargetEdit() {
    setTargetDraft(getTargetDraft(target));
    setTargetError("");
    setIsTargetEditing(true);
  }

  function saveTarget() {
    const nextTarget = buildTargetUpdate(targetDraft);

    if (!nextTarget) {
      setTargetError("Use valid non-negative macro values.");
      return;
    }

    updateTarget(nextTarget);
    setTargetError("");
    setIsTargetEditing(false);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Profile"
          action={
            <Button icon="cog-6-tooth" onPress={() => router.push("/settings")} variant="secondary">
              Settings
            </Button>
          }
        />

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileUser.firstName.charAt(0)}
              {profileUser.lastName.charAt(0)}
            </Text>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSubtitle}>{profileUser.email}</Text>
          </View>
        </View>

        {isGoalEditing ? (
          <View style={styles.goalPanel}>
            <View style={styles.panelTitleRow}>
              <Icon color={colors.primary} name="sparkles" size={18} />
              <Text style={styles.panelLabel}>Current goal</Text>
            </View>

            <Input
              label="Goal"
              onChangeText={setGoalDraft}
              placeholder="Build strength while staying consistent"
              value={goalDraft}
            />

            {goalError ? <Text style={styles.errorText}>{goalError}</Text> : null}

            <View style={styles.actionRow}>
              <Button icon="check" onPress={saveGoal} style={styles.actionButton}>
                Save
              </Button>
              <Button
                icon="x-mark"
                onPress={() => {
                  setGoalError("");
                  setIsGoalEditing(false);
                }}
                style={styles.actionButton}
                variant="secondary"
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startGoalEdit}
            style={styles.goalPanel}
          >
            <View style={styles.panelTitleRow}>
              <Icon color={colors.primary} name="sparkles" size={18} />
              <Text style={styles.panelLabel}>Current goal</Text>
              <Icon color={colors.textMuted} name="pencil-square" size={18} />
            </View>
            <Text style={styles.goalText}>{profileUser.goal}</Text>
          </Pressable>
        )}

        {isTargetEditing ? (
          <View style={styles.targetCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.panelLabel}>Default nutrition target</Text>
                <Text style={styles.sectionTitle}>Edit defaults</Text>
              </View>
              <View style={styles.targetIcon}>
                <Icon color={colors.primary} name="shopping-bag" size={22} />
              </View>
            </View>

            <Input
              editable={false}
              keyboardType="numeric"
              label="Calories"
              onChangeText={() => undefined}
              placeholder="2400"
              value={String(calculateTargetDraftCalories(targetDraft))}
            />

            <View style={styles.targetInputRow}>
              <View style={styles.targetInputColumn}>
                <Input
                  keyboardType="decimal-pad"
                  label="Protein"
                  onChangeText={(value) =>
                    setTargetDraft((currentDraft) => ({
                      ...currentDraft,
                      proteinGrams: sanitizeDecimalInput(value),
                    }))
                  }
                  placeholder="180"
                  value={targetDraft.proteinGrams}
                />
              </View>
              <View style={styles.targetInputColumn}>
                <Input
                  keyboardType="decimal-pad"
                  label="Carbs"
                  onChangeText={(value) =>
                    setTargetDraft((currentDraft) => ({
                      ...currentDraft,
                      carbsGrams: sanitizeDecimalInput(value),
                    }))
                  }
                  placeholder="260"
                  value={targetDraft.carbsGrams}
                />
              </View>
              <View style={styles.targetInputColumn}>
                <Input
                  keyboardType="decimal-pad"
                  label="Fat"
                  onChangeText={(value) =>
                    setTargetDraft((currentDraft) => ({
                      ...currentDraft,
                      fatGrams: sanitizeDecimalInput(value),
                    }))
                  }
                  placeholder="75"
                  value={targetDraft.fatGrams}
                />
              </View>
            </View>

            {targetError ? <Text style={styles.errorText}>{targetError}</Text> : null}

            <View style={styles.actionRow}>
              <Button icon="check" onPress={saveTarget} style={styles.actionButton}>
                Save
              </Button>
              <Button
                icon="x-mark"
                onPress={() => {
                  setTargetError("");
                  setIsTargetEditing(false);
                }}
                style={styles.actionButton}
                variant="secondary"
              >
                Cancel
              </Button>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={startTargetEdit}
            style={styles.targetCard}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderCopy}>
                <Text style={styles.panelLabel}>Default nutrition target</Text>
                <Text style={styles.sectionTitle}>{formatNumber(target.dailyCalories)} calories</Text>
              </View>
              <View style={styles.targetIcon}>
                <Icon color={colors.primary} name="shopping-bag" size={22} />
              </View>
            </View>

            <View style={styles.targetMacroRow}>
              {targetMacros.map((macro) => (
                <View key={macro.label} style={styles.targetMacro}>
                  <Text style={styles.targetMacroLabel}>{macro.label}</Text>
                  <Text style={styles.targetMacroValue}>{macro.value}</Text>
                </View>
              ))}
            </View>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

function buildTargetUpdate(draft: TargetDraft): NutritionTargetUpdate | null {
  const carbsGrams = parseDecimal(draft.carbsGrams);
  const fatGrams = parseDecimal(draft.fatGrams);
  const proteinGrams = parseDecimal(draft.proteinGrams);

  if (
    carbsGrams === null ||
    fatGrams === null ||
    proteinGrams === null
  ) {
    return null;
  }

  return {
    carbsGrams,
    dailyCalories: calculateMacroCalories({ carbsGrams, fatGrams, proteinGrams }),
    fatGrams,
    proteinGrams,
  };
}

function calculateTargetDraftCalories(draft: TargetDraft) {
  return calculateMacroCalories({
    carbsGrams: parseDecimal(draft.carbsGrams) ?? 0,
    fatGrams: parseDecimal(draft.fatGrams) ?? 0,
    proteinGrams: parseDecimal(draft.proteinGrams) ?? 0,
  });
}

function calculateMacroCalories({
  carbsGrams,
  fatGrams,
  proteinGrams,
}: {
  carbsGrams: number;
  fatGrams: number;
  proteinGrams: number;
}) {
  return Math.round(proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9);
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function getTargetDraft(target: NutritionTargetUpdate): TargetDraft {
  return {
    carbsGrams: String(target.carbsGrams ?? ""),
    dailyCalories: String(
      calculateMacroCalories({
        carbsGrams: target.carbsGrams ?? 0,
        fatGrams: target.fatGrams ?? 0,
        proteinGrams: target.proteinGrams ?? 0,
      }),
    ),
    fatGrams: String(target.fatGrams ?? ""),
    proteinGrams: String(target.proteinGrams ?? ""),
  };
}

function parseDecimal(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * 10) / 10;
}

function sanitizeDecimalInput(value: string) {
  const cleanedValue = value.replaceAll(",", ".").replace(/[^\d.]/g, "");
  const [wholeValue, ...decimalParts] = cleanedValue.split(".");

  if (decimalParts.length === 0) {
    return wholeValue;
  }

  return `${wholeValue}.${decimalParts.join("")}`;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    profileHero: {
      alignItems: "center",
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderRadius: 30,
      borderWidth: 1,
      boxShadow: `0px 18px 36px ${colors.shadow}`,
      flexDirection: "row",
      gap: spacing.lg,
      padding: spacing.xl,
    },
    avatar: {
      alignItems: "center",
      backgroundColor: colors.primaryMuted,
      borderRadius: 24,
      height: 72,
      justifyContent: "center",
      width: 72,
    },
    avatarText: {
      color: colors.primary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
    },
    heroCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    heroTitle: {
      color: colors.onPrimary,
      fontSize: typography.sizes.title,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.title,
    },
    heroSubtitle: {
      color: colors.heroTextMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    goalPanel: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.lg,
    },
    panelTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    panelLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      letterSpacing: 0,
      lineHeight: typography.lineHeights.caption,
      textTransform: "uppercase",
    },
    goalText: {
      color: colors.text,
      fontSize: typography.sizes.subtitle,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.subtitle,
    },
    sectionHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
    },
    sectionHeaderCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: typography.sizes.subtitle,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.subtitle,
    },
    targetCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      gap: spacing.lg,
      padding: spacing.lg,
    },
    targetIcon: {
      alignItems: "center",
      backgroundColor: colors.primaryMuted,
      borderRadius: 18,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    targetMacroRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    targetMacro: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 18,
      borderWidth: 1,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md,
    },
    targetMacroLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
    },
    targetMacroValue: {
      color: colors.text,
      fontSize: typography.sizes.body,
      fontWeight: typography.weights.bold,
      lineHeight: typography.lineHeights.body,
    },
    targetInputRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    targetInputColumn: {
      flex: 1,
      minWidth: 0,
    },
    actionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    actionButton: {
      minHeight: 42,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    errorText: {
      color: colors.danger,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
    },
  });
}
