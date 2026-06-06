import { Tabs } from "expo-router";

import { colors } from "@/constants/colors";
import { typography } from "@/constants/typography";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.sizes.caption,
          fontWeight: typography.weights.semibold,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
          boxShadow: `0px -10px 24px ${colors.shadow}`,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
