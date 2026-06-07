import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { SexSegmentedControl } from "@/components/SexSegmentedControl";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuthStore } from "@/store/useAuthStore";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useThemeColors } from "@/theme/ThemeProvider";
import type { Sex } from "@/types/user";
import {
  calculateMacroCalories,
  parseNonNegativeDecimal,
  parsePositiveDecimal,
  sanitizeDecimalInput,
} from "@/utils/nutrition";

type TargetDraft = {
  carbsGrams: string;
  fatGrams: string;
  proteinGrams: string;
};

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const { initializeTarget } = useNutritionStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [goal, setGoal] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [sex, setSex] = useState<Sex>("male");
  const [targetDraft, setTargetDraft] = useState<TargetDraft>({
    carbsGrams: "260",
    fatGrams: "75",
    proteinGrams: "180",
  });
  const [weightPounds, setWeightPounds] = useState("");

  function handleRegister() {
    const parsedHeight = parsePositiveDecimal(heightInches);
    const parsedWeight = parsePositiveDecimal(weightPounds);
    const targetUpdate = buildTargetUpdate(targetDraft);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }

    if (!goal.trim()) {
      setError("Add your current goal.");
      return;
    }

    if (parsedHeight === null || parsedWeight === null) {
      setError("Enter valid height and weight values.");
      return;
    }

    if (!targetUpdate) {
      setError("Use valid non-negative nutrition targets.");
      return;
    }

    const result = register({
      email,
      firstName,
      goal,
      heightInches: parsedHeight,
      lastName,
      password,
      sex,
      weightPounds: parsedWeight,
    });

    if (!result.user) {
      setError(result.error ?? "Could not create account.");
      return;
    }

    initializeTarget(targetUpdate);
    setError("");
    router.replace("/home");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandLockup}>
          <Text style={styles.brandMark}>Overload</Text>
          <Text style={styles.brandMeta}>Start simple.</Text>
        </View>

        <Card title="Create account">
          <Input label="First name" onChangeText={setFirstName} placeholder="First name" value={firstName} />
          <Input label="Last name" onChangeText={setLastName} placeholder="Last name" value={lastName} />
          <Input
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <Input
            label="Password"
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            value={password}
          />
          <Input
            label="Current goal"
            onChangeText={setGoal}
            placeholder="Build strength while staying consistent"
            value={goal}
          />

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Default nutrition target</Text>
            <Input
              editable={false}
              keyboardType="numeric"
              label="Calories"
              onChangeText={() => undefined}
              placeholder="2435"
              value={String(calculateTargetDraftCalories(targetDraft))}
            />
            <View style={styles.inputRow}>
              <View style={styles.inputColumn}>
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
              <View style={styles.inputColumn}>
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
              <View style={styles.inputColumn}>
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
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Input
                keyboardType="decimal-pad"
                label="Height"
                onChangeText={(value) => setHeightInches(sanitizeDecimalInput(value))}
                placeholder="70 in"
                value={heightInches}
              />
            </View>
            <View style={styles.inputColumn}>
              <Input
                keyboardType="decimal-pad"
                label="Weight"
                onChangeText={(value) => setWeightPounds(sanitizeDecimalInput(value))}
                placeholder="180 lb"
                value={weightPounds}
              />
            </View>
          </View>

          <SexSegmentedControl onChange={setSex} value={sex} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button icon="plus" onPress={handleRegister}>Create Account</Button>
          <Button icon="arrow-left" onPress={() => router.replace("/login")} variant="secondary">
            Back to Login
          </Button>
        </Card>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/login")}
            style={styles.authLinkButton}
          >
            <Text style={styles.linkText}>Log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function buildTargetUpdate(draft: TargetDraft) {
  const carbsGrams = parseNonNegativeDecimal(draft.carbsGrams);
  const fatGrams = parseNonNegativeDecimal(draft.fatGrams);
  const proteinGrams = parseNonNegativeDecimal(draft.proteinGrams);

  if (carbsGrams === null || fatGrams === null || proteinGrams === null) {
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
    carbsGrams: parseNonNegativeDecimal(draft.carbsGrams) ?? 0,
    fatGrams: parseNonNegativeDecimal(draft.fatGrams) ?? 0,
    proteinGrams: parseNonNegativeDecimal(draft.proteinGrams) ?? 0,
  });
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.lg,
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
  footerRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  linkText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    textAlign: "center",
  },
  authLinkButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  formSection: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputColumn: {
    flex: 1,
    minWidth: 0,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  });
}
