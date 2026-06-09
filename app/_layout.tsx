import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    ThemePreferenceProvider,
    useThemePreference,
} from "@/src/contexts/theme-preference";
import { supabaseClient } from "@/src/services/supabase";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootLayoutContent />
    </ThemePreferenceProvider>
  );
}

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { themeMode, isThemeReady } = useThemePreference();
  const segments = useSegments();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session ?? null);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoadingSession) {
      return;
    }

    const topSegment = segments[0];
    const inTabs = topSegment === "(tabs)";
    const inPublicAuth = topSegment === "login";

    if (!session && inTabs) {
      router.replace("/login");
      return;
    }

    if (session && inPublicAuth) {
      router.replace("/");
    }
  }, [isLoadingSession, segments, session]);

  if (isLoadingSession || !isThemeReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const appTheme = themeMode ?? (colorScheme === "dark" ? "dark" : "light");

  return (
    <ThemeProvider value={appTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="smart-water" options={{ title: "Smart Water" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={appTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}
