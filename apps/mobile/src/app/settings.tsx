import { router } from "expo-router";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

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

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const { isDark, setThemePreference } = useAppTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header
          title="Settings"
          subtitle="Manage app preferences, sync state, and account actions."
          action={
            <Button onPress={() => router.replace("/profile")} variant="secondary">
              Profile
            </Button>
          }
        />

        <Card title="Preferences">
          <SettingsRow label="Training goal" value={profileUser.goal} />
          <SettingsRow label="Units" value={profileUser.unitPreference.toUpperCase()} />
          <SettingsToggleRow
            helperText="Override your device appearance for this app."
            label="Dark mode"
            onValueChange={(enabled) => setThemePreference(enabled ? "dark" : "light")}
            value={isDark}
          />
        </Card>

        <Card title="App Behavior">
          <SettingsRow label="Mode" value="Local" />
          <SettingsRow label="Notifications" value="Quiet for now" />
          <SettingsRow label="Data sync" value="Local until backend connects" />
        </Card>

        <Card title="Account Actions">
          <Text style={styles.mutedText}>
            This keeps the demo profile local. Real authentication can plug in later without changing
            the mobile logging flow.
          </Text>
          <Button onPress={handleLogout} variant="secondary">
            Log Out
          </Button>
        </Card>
      </ScrollView>
    </Screen>
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
    settingsToggleCopy: {
      flex: 1,
      gap: spacing.sm,
    },
  });
}
