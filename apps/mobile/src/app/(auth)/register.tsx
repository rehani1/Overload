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

export default function RegisterScreen() {
  const { register } = useAuthStore();
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
        <Header title="Create Account" subtitle="Set up a local profile for the demo app." />

        <Card title="New lifter profile">
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

        <Pressable accessibilityRole="button" onPress={() => router.push("../login")}>
          <Text style={styles.linkText}>Back to login</Text>
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
