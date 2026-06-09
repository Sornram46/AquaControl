import { useThemePreference } from "@/src/contexts/theme-preference";
import { router } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    SafeAreaView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";

const paletteByMode = {
  dark: {
    screenBg: "#0B1723",
    title: "#ECF6FF",
    subtitle: "#B9C9D8",
    cardBg: "#12293A",
    cardBorder: "#27465E",
    value: "#ECF6FF",
    label: "#9FB3C8",
    buttonBg: "#1F8E6E",
    buttonText: "#FFFFFF",
    dangerBg: "#7E3140",
  },
  light: {
    screenBg: "#EEF3FF",
    title: "#0D2841",
    subtitle: "#47647D",
    cardBg: "#FFFFFF",
    cardBorder: "#C6D8EA",
    value: "#0D2841",
    label: "#5E7488",
    buttonBg: "#1F8E6E",
    buttonText: "#FFFFFF",
    dangerBg: "#B94159",
  },
} as const;

type ControlKey = "pump" | "aerator" | "feeder" | "uv";

const controlItems: Array<{
  key: ControlKey;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    key: "pump",
    icon: "🚰",
    title: "ปั๊มน้ำ",
    subtitle: "Relay #1",
  },
  {
    key: "aerator",
    icon: "🫧",
    title: "เครื่องเติมอากาศ",
    subtitle: "Relay #2",
  },
  {
    key: "feeder",
    icon: "🍽️",
    title: "เครื่องให้อาหาร",
    subtitle: "Relay #3",
  },
  {
    key: "uv",
    icon: "🔆",
    title: "UV Filter",
    subtitle: "Relay #4",
  },
];

export default function SmartWaterScreen() {
  const { themeMode } = useThemePreference();
  const palette = paletteByMode[themeMode];

  const [controlState, setControlState] = useState<Record<ControlKey, boolean>>(
    {
      pump: true,
      aerator: true,
      feeder: false,
      uv: false,
    },
  );

  const onToggleControl = (key: ControlKey, value: boolean) => {
    setControlState((prev) => ({ ...prev, [key]: value }));
    // TODO: Replace with API/MQTT call to your board + relay.
    // Example payload: { control: key, enabled: value }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.screenBg }]}
    >
      <View style={styles.contentWrap}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>กลับหน้า Dashboard</Text>
        </Pressable>

        <Text style={[styles.title, { color: palette.title }]}>
          Smart Water
        </Text>
        <Text style={[styles.subtitle, { color: palette.subtitle }]}>
          ติดตามค่าเซ็นเซอร์และควบคุมระบบน้ำแบบเรียลไทม์
        </Text>

        <View
          style={[
            styles.metricsCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: palette.label }]}>
              อุณหภูมิน้ำ
            </Text>
            <Text style={[styles.metricValue, { color: palette.value }]}>
              28.4°C
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: palette.label }]}>
              ค่า pH
            </Text>
            <Text style={[styles.metricValue, { color: palette.value }]}>
              7.2
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: palette.label }]}>
              ออกซิเจนละลายน้ำ
            </Text>
            <Text style={[styles.metricValue, { color: palette.value }]}>
              6.8 mg/L
            </Text>
          </View>
        </View>

        <View style={styles.controlsGrid}>
          {controlItems.map((item) => {
            const isOn = controlState[item.key];

            return (
              <View
                key={item.key}
                style={[
                  styles.controlCard,
                  {
                    backgroundColor: palette.cardBg,
                    borderColor: palette.cardBorder,
                  },
                ]}
              >
                <Text style={styles.controlIcon}>{item.icon}</Text>
                <Text style={[styles.controlTitle, { color: palette.value }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.controlSubtitle, { color: palette.label }]}
                >
                  {item.subtitle}
                </Text>

                <View style={styles.switchRow}>
                  <Text
                    style={[
                      styles.switchState,
                      { color: isOn ? palette.buttonBg : palette.dangerBg },
                    ]}
                  >
                    {isOn ? "ON" : "OFF"}
                  </Text>
                  <Switch
                    value={isOn}
                    onValueChange={(value) => onToggleControl(item.key, value)}
                    trackColor={{ false: "#9AAABD", true: "#35B387" }}
                    thumbColor={isOn ? "#FFFFFF" : "#F4F4F4"}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#0F7F96",
    marginBottom: 14,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  metricsCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  controlsGrid: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  controlCard: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  controlIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  controlSubtitle: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  switchRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  switchState: {
    fontSize: 12,
    fontWeight: "800",
  },
});
