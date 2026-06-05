import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("rehan@example.com");
  const [password, setPassword] = useState("password");

  function handleLogin() {
    login({ email, password });
    router.replace("../home");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="Log In" subtitle="Use the local demo account for now." />

        <Card title="Overload account">
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
          <Button onPress={handleLogin}>Log In</Button>
        </Card>

        <Pressable accessibilityRole="button" onPress={() => router.push("../register")}>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
    textAlign: "center",
  },
});
