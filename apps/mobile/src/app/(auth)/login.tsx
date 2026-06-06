import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AuthHero } from "@/components/AuthHero";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import type { AppColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeColors } from "@/theme/ThemeProvider";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("rehan@example.com");
  const [password, setPassword] = useState("password");

  function handleLogin() {
    login({ email, password });
    router.replace("/home");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandLockup}>
          <Text style={styles.brandMark}>Overload</Text>
          <Text style={styles.brandMeta}>Mobile companion</Text>
        </View>

        <AuthHero
          details={["Fast logging", "Local demo", "Web-ready data"]}
          eyebrow="Training without noise"
          subtitle="Keep the mobile app focused on capturing workouts and nutrition. The deeper review belongs on web later."
          title="Log in, then get back to training."
        />

        <Card title="Welcome back">
          <Text style={styles.formIntro}>Use the demo account or your local profile to continue.</Text>
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
        </Card>

        <View style={styles.actionBlock}>
          <Button onPress={handleLogin}>Log In</Button>
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>New to Overload?</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: "center",
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  brandLockup: {
    gap: spacing.xs,
  },
  brandMark: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.4,
    lineHeight: typography.lineHeights.title,
  },
  brandMeta: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.8,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  formIntro: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  actionBlock: {
    gap: spacing.md,
  },
  footerCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.lg,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    textAlign: "center",
  },
  });
}
