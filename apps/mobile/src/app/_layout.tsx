import { useEffect } from "react";
import { router, Stack, useRootNavigationState, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAuthStore } from "@/store/useAuthStore";
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

  useRouteProtection();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="pair-mobile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="workout/active" />
      </Stack>
    </>
  );
}

function useRouteProtection() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const firstSegment = segments[0];

  useEffect(() => {
    if (!isHydrated || !navigationState?.key) {
      return;
    }

    const isAuthRoute =
      firstSegment === "(auth)" || firstSegment === "login" || firstSegment === "register";
    const isPairRoute = firstSegment === "pair-mobile";
    const isIndexRoute = !firstSegment;
    const isPublicRoute = isAuthRoute || isIndexRoute || isPairRoute;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && (isAuthRoute || isIndexRoute)) {
      router.replace("/home");
    }
  }, [firstSegment, isAuthenticated, isHydrated, navigationState?.key]);
}
