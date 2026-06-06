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

export default function ProfileScreen() {
  const { logout, user } = useAuthStore();
  const { isDark, setThemePreference } = useAppTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;

  function handleLogout() {
    logout();
    router.replace("../login");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Profile" subtitle="Account basics for the mobile logging companion." />

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileUser.firstName.charAt(0)}
              {profileUser.lastName.charAt(0)}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Local training profile</Text>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSubtitle}>{profileUser.email}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Mobile</Text>
          </View>
        </View>

        <Card>
          <Text style={styles.label}>Current goal</Text>
          <Text style={styles.goalText}>{profileUser.goal}</Text>
        </Card>

        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <Text style={styles.label}>Units</Text>
            <Text style={styles.value}>{profileUser.unitPreference.toUpperCase()}</Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text style={styles.label}>Mode</Text>
            <Text style={styles.value}>Local</Text>
          </Card>
        </View>

        <Card title="Settings">
          <SettingsRow label="Training goal" value={profileUser.goal} />
          <SettingsToggleRow
            label="Dark mode"
            value={isDark}
            helperText="Override your device appearance for this app."
            onValueChange={(enabled) => setThemePreference(enabled ? "dark" : "light")}
          />
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
  profileHero: {
    alignItems: "center",
    backgroundColor: colors.heroBackground,
    borderColor: "rgba(255, 252, 246, 0.18)",
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.lg,
    padding: spacing.xl,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    borderRadius: 24,
    height: 64,
    justifyContent: "center",
    width: 64,
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
  },
  heroEyebrow: {
    color: colors.primaryMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
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
  statusPill: {
    backgroundColor: "rgba(255, 252, 246, 0.12)",
    borderColor: "rgba(255, 252, 246, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusPillText: {
    color: colors.onPrimary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
  },
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  gridCard: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.7,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
  },
  goalText: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subtitle,
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
