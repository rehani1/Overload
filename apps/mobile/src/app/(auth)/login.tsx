import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
          <Text style={styles.brandMeta}>Train. Log. Move on.</Text>
        </View>

        <Card title="Log in">
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
          <Button icon="arrow-right-on-rectangle" onPress={handleLogin}>
            Continue
          </Button>
        </Card>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New here?</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>Create account</Text>
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
    gap: spacing.lg,
    justifyContent: "center",
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
    letterSpacing: -0.8,
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
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    textAlign: "center",
  },
  });
}
