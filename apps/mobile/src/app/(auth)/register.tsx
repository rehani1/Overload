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

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");

  function handleRegister() {
    register({
      email,
      firstName,
      lastName,
      password,
    });
    router.replace("../home");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandLockup}>
          <Text style={styles.brandMark}>Overload</Text>
          <Text style={styles.brandMeta}>Mobile companion</Text>
        </View>

        <AuthHero
          details={["Workout capture", "Nutrition notes", "Future sync"]}
          eyebrow="Build the training record"
          subtitle="Create a lightweight local profile now. Backend-backed accounts can replace this flow without changing the mobile logging model."
          title="Set up a cleaner way to track."
        />

        <Card title="New profile">
          <Text style={styles.formIntro}>Keep this simple. The web app will handle deeper planning and analysis later.</Text>
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
          <Button onPress={handleRegister}>Create Account</Button>
        </Card>

        <View style={styles.footerCard}>
          <Text style={styles.footerText}>Already have a profile?</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("../login")}>
            <Text style={styles.linkText}>Back to login</Text>
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
