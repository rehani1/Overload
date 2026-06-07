import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockUser } from "@/features/profile/mockUser";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;

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

        <Card>
          <Text style={styles.label}>Current goal</Text>
          <Text style={styles.goalText}>{profileUser.goal}</Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    gap: spacing.lg,
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
  label: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.7,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  goalText: {
    color: colors.text,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.subtitle,
  },
  });
}
