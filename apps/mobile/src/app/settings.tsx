import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockUser } from "@/features/profile/mockUser";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppTheme, useThemeColors } from "@/theme/ThemeProvider";
import type { UnitPreference } from "@/types/user";

export default function SettingsScreen() {
  const { logout, updateUser, user } = useAuthStore();
  const { isDark, setThemePreference } = useAppTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/profile");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Settings"
          action={
            <Button icon="arrow-left" onPress={handleBack} variant="secondary">
              Back
            </Button>
          }
        />

        <Card title="Preferences">
          <SettingsUnitRow
            onValueChange={(unitPreference) => updateUser({ unitPreference })}
            value={profileUser.unitPreference}
          />
          <SettingsToggleRow
            helperText="Override system appearance."
            label="Dark mode"
            onValueChange={(enabled) => setThemePreference(enabled ? "dark" : "light")}
            value={isDark}
          />
        </Card>

        <Card title="App">
          <SettingsRow label="Mode" value="Local" />
          <SettingsRow label="Sync" value="Not connected" />
        </Card>

        <Card title="Account">
          <Button icon="arrow-right-on-rectangle" onPress={handleLogout} variant="secondary">
            Log Out
          </Button>
        </Card>
      </ScrollView>
    </Screen>
  );
}

type SettingsUnitRowProps = {
  onValueChange: (value: UnitPreference) => void;
  value: UnitPreference;
};

function SettingsUnitRow({ onValueChange, value }: SettingsUnitRowProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const units: UnitPreference[] = ["lb", "kg"];

  return (
    <View style={styles.settingsUnitRow}>
      <View style={styles.settingsToggleCopy}>
        <Text style={styles.bodyText}>Units</Text>
        <Text style={styles.mutedText}>Used for workout weight fields.</Text>
      </View>

      <View style={styles.unitControl}>
        {units.map((unit) => {
          const isSelected = value === unit;

          return (
            <Pressable
              accessibilityRole="button"
              key={unit}
              onPress={() => onValueChange(unit)}
              style={[styles.unitOption, isSelected && styles.unitOptionSelected]}
            >
              <Text style={[styles.unitOptionText, isSelected && styles.unitOptionTextSelected]}>
                {unit.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
};

function SettingsRow({ label, value }: SettingsRowProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.settingsRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <Text style={styles.mutedText}>{value}</Text>
    </View>
  );
}

type SettingsToggleRowProps = {
  helperText: string;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

function SettingsToggleRow({ helperText, label, onValueChange, value }: SettingsToggleRowProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.settingsToggleRow}>
      <View style={styles.settingsToggleCopy}>
        <Text style={styles.bodyText}>{label}</Text>
        <Text style={styles.mutedText}>{helperText}</Text>
      </View>
      <Switch
        ios_backgroundColor={colors.surfaceMuted}
        onValueChange={onValueChange}
        thumbColor={colors.surfaceElevated}
        trackColor={{
          false: colors.borderStrong,
          true: colors.accent,
        }}
        value={value}
      />
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      gap: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    bodyText: {
      color: colors.text,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    mutedText: {
      color: colors.textMuted,
      fontSize: typography.sizes.body,
      lineHeight: typography.lineHeights.body,
    },
    settingsRow: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    settingsToggleRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      paddingVertical: spacing.md,
    },
    settingsUnitRow: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      justifyContent: "space-between",
      paddingVertical: spacing.md,
    },
    settingsToggleCopy: {
      flex: 1,
      gap: spacing.sm,
    },
    unitControl: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      padding: spacing.xs,
    },
    unitOption: {
      borderRadius: 999,
      minWidth: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    unitOptionSelected: {
      backgroundColor: colors.primary,
    },
    unitOptionText: {
      color: colors.textMuted,
      fontSize: typography.sizes.caption,
      fontWeight: typography.weights.semibold,
      lineHeight: typography.lineHeights.caption,
      textAlign: "center",
    },
    unitOptionTextSelected: {
      color: colors.onPrimary,
    },
  });
}
