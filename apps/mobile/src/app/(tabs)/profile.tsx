import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Header } from "@/components/Header";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockUser } from "@/features/profile/mockUser";
import { useAuthStore } from "@/store/useAuthStore";
import { useNutritionStore } from "@/store/useNutritionStore";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { target } = useNutritionStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const profileUser = user ?? mockUser;
  const fullName = `${profileUser.firstName} ${profileUser.lastName}`;
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

        <View style={styles.goalPanel}>
          <View style={styles.panelTitleRow}>
            <Icon color={colors.primary} name="sparkles" size={18} />
            <Text style={styles.panelLabel}>Current goal</Text>
          </View>
          <Text style={styles.goalText}>{profileUser.goal}</Text>
        </View>

        <View style={styles.targetCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
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
        </View>
      </ScrollView>
    </Screen>
  );
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
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
  });
}
