import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "../global.css";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/active" />
        <Stack.Screen name="workout/[id]" />
      </Stack>
    </>
  );
}
