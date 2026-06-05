import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockUser } from "@/features/profile/mockUser";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfileScreen() {
  const { logout, user } = useAuthStore();
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;

  function handleLogout() {
    logout();
    router.replace("../login");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Profile" subtitle="Manage basic account preferences for training." />

        <Card title={fullName}>
          <Text style={styles.mutedText}>{profileUser.email}</Text>
          <Text style={styles.bodyText}>{profileUser.goal}</Text>
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
          <SettingsRow label="Notifications" value="Not configured" />
          <SettingsRow label="Data sync" value="Backend not connected" />
        </Card>

        <Card title="Account Actions">
          <Text style={styles.mutedText}>Real authentication will be added after backend integration.</Text>
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
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.bodyText}>{label}</Text>
      <Text style={styles.mutedText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
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
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.title,
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
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
