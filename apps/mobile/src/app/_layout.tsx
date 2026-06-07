import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppThemeProvider, useAppTheme } from "@/theme/ThemeProvider";

import "../global.css";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="workout/active" />
      </Stack>
    </>
  );
}
