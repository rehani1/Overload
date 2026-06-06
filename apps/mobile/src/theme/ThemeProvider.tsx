import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import { darkColors, lightColors, type AppColors } from "@/constants/colors";

type AppColorScheme = "light" | "dark";
type ThemePreference = AppColorScheme | "system";

type AppTheme = {
  colors: AppColors;
  colorScheme: AppColorScheme;
  isDark: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  themePreference: ThemePreference;
};

const AppThemeContext = createContext<AppTheme | null>(null);
const THEME_PREFERENCE_KEY = "overload.themePreference";

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const systemTheme: AppColorScheme = systemColorScheme === "dark" ? "dark" : "light";
  const colorScheme = themePreference === "system" ? systemTheme : themePreference;
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const isDark = colorScheme === "dark";

  useEffect(() => {
    let isMounted = true;

    async function loadThemePreference() {
      try {
        const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);

        if (
          isMounted &&
          (storedPreference === "system" ||
            storedPreference === "light" ||
            storedPreference === "dark")
        ) {
          setThemePreferenceState(storedPreference);
        }
      } catch {
        // Keep the app usable with the system theme if local preference storage fails.
      }
    }

    loadThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference).catch(() => {
      // The in-memory theme still updates even if persistence is unavailable.
    });
  }, []);

  const value = useMemo(
    () => ({
      colors,
      colorScheme,
      isDark,
      setThemePreference,
      themePreference,
    }),
    [colors, colorScheme, isDark, setThemePreference, themePreference],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const theme = useContext(AppThemeContext);

  if (!theme) {
    throw new Error("useAppTheme must be used within AppThemeProvider.");
  }

  return theme;
}

export function useThemeColors() {
  return useAppTheme().colors;
}
