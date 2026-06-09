import * as SecureStore from "expo-secure-store";
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";

type ThemeMode = "light" | "dark";

type ThemePreferenceContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isThemeReady: boolean;
};

const STORAGE_KEY = "theme_mode_preference";

const ThemePreferenceContext = createContext<
  ThemePreferenceContextValue | undefined
>(undefined);

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [storedThemeMode, setStoredThemeMode] = useState<ThemeMode | null>(
    null,
  );
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTheme = async () => {
      const savedValue = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!mounted) {
        return;
      }

      if (savedValue === "light" || savedValue === "dark") {
        setStoredThemeMode(savedValue);
      }

      setIsThemeReady(true);
    };

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveThemeMode: ThemeMode =
    storedThemeMode ?? (systemScheme === "dark" ? "dark" : "light");

  const contextValue = useMemo(
    () => ({
      themeMode: effectiveThemeMode,
      setThemeMode: async (mode: ThemeMode) => {
        setStoredThemeMode(mode);
        await SecureStore.setItemAsync(STORAGE_KEY, mode);
      },
      isThemeReady,
    }),
    [effectiveThemeMode, isThemeReady],
  );

  return (
    <ThemePreferenceContext.Provider value={contextValue}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }

  return context;
}
