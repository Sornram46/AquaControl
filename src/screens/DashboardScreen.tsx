import { useThemePreference } from "@/src/contexts/theme-preference";
import { supabaseClient } from "@/src/services/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Profile = {
  full_name: string | null;
  email: string | null;
};

const paletteByMode = {
  dark: {
    screenBg: "#0B1723",
    kicker: "#8CC7D1",
    title: "#ECF6FF",
    subtitle: "#C4D6E5",
    loadingText: "#CFDCE6",
    switchBg: "#132638",
    switchBorder: "#2A435B",
    switchText: "#B8C9D8",
    switchActiveBg: "#0F7F96",
    switchActiveText: "#FFFFFF",
  },
  light: {
    screenBg: "#EEF3FF",
    kicker: "#366EA3",
    title: "#0D2841",
    subtitle: "#425F79",
    loadingText: "#406079",
    switchBg: "#DEE8F5",
    switchBorder: "#B8CBDE",
    switchText: "#406079",
    switchActiveBg: "#0F7F96",
    switchActiveText: "#FFFFFF",
  },
} as const;

const featureTiles = [
  {
    id: "iot",
    icon: "💧",
    title: "Smart Water",
    subtitle: "ควบคุมคุณภาพน้ำแบบเรียลไทม์",
    badge: "Live",
    accent: "#2D6AF6",
    background: "#EDF3FF",
    route: "/smart-water",
  },
  {
    id: "feeding",
    icon: "🍽️",
    title: "Feeding",
    subtitle: "ตั้งเวลาให้อาหารอัตโนมัติ",
    badge: "Auto",
    accent: "#0D9B8A",
    background: "#EAF9F6",
    route: null,
  },
  {
    id: "analytics",
    icon: "📈",
    title: "Analytics",
    subtitle: "ดูแนวโน้มค่าเซ็นเซอร์รายวัน",
    badge: "Insights",
    accent: "#7A46F2",
    background: "#F2ECFF",
    route: null,
  },
  {
    id: "automation",
    icon: "⚙️",
    title: "Automation",
    subtitle: "ตั้งกฎควบคุมการทำงานอุปกรณ์",
    badge: "Cloud",
    accent: "#E16A1E",
    background: "#FFF3EA",
    route: null,
  },
];

export default function DashboardScreen() {
  const { themeMode, setThemeMode } = useThemePreference();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const palette = paletteByMode[themeMode];

  const onTilePress = (route: string | null) => {
    if (!route) {
      Alert.alert("กำลังพัฒนา", "ฟีเจอร์นี้จะเปิดใช้งานในเวอร์ชันถัดไป");
      return;
    }

    router.push(route as never);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await supabaseClient
        .from("profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        Alert.alert("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ", error.message);
        setProfile({
          full_name: null,
          email: user.email ?? null,
        });
        setLoadingProfile(false);
        return;
      }

      setProfile({
        full_name: data?.full_name ?? null,
        email: data?.email ?? user.email ?? null,
      });
      setLoadingProfile(false);
    };

    loadProfile();
  }, []);

  if (loadingProfile) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: palette.screenBg }]}
      >
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color="#0F7F96" />
          <Text style={[styles.loadingText, { color: palette.loadingText }]}>
            กำลังโหลดข้อมูลผู้ใช้...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.screenBg }]}
    >
      <View style={styles.contentWrap}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.kicker, { color: palette.kicker }]}>
              AquaControl
            </Text>
            <Text style={[styles.title, { color: palette.title }]}>
              Dashboard
            </Text>
          </View>

          <View
            style={[
              styles.themeSwitch,
              {
                backgroundColor: palette.switchBg,
                borderColor: palette.switchBorder,
              },
            ]}
          >
            <Pressable
              style={[
                styles.themeOption,
                themeMode === "light"
                  ? { backgroundColor: palette.switchActiveBg }
                  : undefined,
              ]}
              onPress={() => setThemeMode("light")}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color:
                      themeMode === "light"
                        ? palette.switchActiveText
                        : palette.switchText,
                  },
                ]}
              >
                Light
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.themeOption,
                themeMode === "dark"
                  ? { backgroundColor: palette.switchActiveBg }
                  : undefined,
              ]}
              onPress={() => setThemeMode("dark")}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  {
                    color:
                      themeMode === "dark"
                        ? palette.switchActiveText
                        : palette.switchText,
                  },
                ]}
              >
                Dark
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.welcomeText, { color: palette.subtitle }]}>
          {`สวัสดี, ${profile?.full_name?.trim() || "Boss : Sornram"}`}
        </Text>

        <View style={styles.gridWrap}>
          {featureTiles.map((tile) => (
            <Pressable
              key={tile.id}
              onPress={() => onTilePress(tile.route)}
              android_ripple={{
                color: "rgba(255,255,255,0.35)",
                borderless: false,
              }}
              style={({ pressed }) => [
                styles.tileCard,
                {
                  borderColor: tile.accent,
                  backgroundColor: tile.background,
                },
                pressed ? styles.tileCardPressed : null,
              ]}
            >
              <View
                style={[styles.tileIconWrap, { backgroundColor: tile.accent }]}
              >
                <Text style={styles.tileIcon}>{tile.icon}</Text>
              </View>
              <Text style={[styles.tileBadge, { color: tile.accent }]}>
                {tile.badge}
              </Text>
              <Text style={styles.tileTitle}>{tile.title}</Text>
              <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1723",
  },
  centeredWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  contentWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  themeSwitch: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  themeOption: {
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 6,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 18,
  },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  tileCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    shadowColor: "#15314A",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 4,
  },
  tileCardPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.05,
    elevation: 1,
  },
  tileIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tileIcon: {
    fontSize: 22,
  },
  tileBadge: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  tileTitle: {
    color: "#17324D",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  tileSubtitle: {
    color: "#4F6274",
    fontSize: 11.5,
    lineHeight: 16,
    textAlign: "center",
  },
});
