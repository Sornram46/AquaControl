import { useThemePreference } from "@/src/contexts/theme-preference";
import {
    addManagedDevice,
    getManagedDevices,
    removeManagedDevice,
    type ManagedDevice,
} from "@/src/services/device-registry";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
    secondaryButtonBg: "#315779",
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
    secondaryButtonBg: "#315779",
    dangerBg: "#B94159",
  },
} as const;

export default function DevicesScreen() {
  const { themeMode } = useThemePreference();
  const palette = paletteByMode[themeMode];

  const [devices, setDevices] = useState<ManagedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [idInput, setIdInput] = useState("");

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getManagedDevices();
      setDevices(list);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "โหลดรายการอุปกรณ์ไม่สำเร็จ";
      Alert.alert("ผิดพลาด", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const onAddDevice = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      const nextDevices = await addManagedDevice({
        id: idInput,
        name: nameInput,
      });
      setDevices(nextDevices);
      setNameInput("");
      setIdInput("");
      Alert.alert("สำเร็จ", "เพิ่มอุปกรณ์ใหม่แล้ว");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message === "duplicate_device_id"
            ? "รหัสอุปกรณ์ซ้ำ กรุณาเปลี่ยน Device ID"
            : error.message === "device_id_and_name_required"
              ? "กรุณากรอกชื่ออุปกรณ์และ Device ID"
              : error.message
          : "เพิ่มอุปกรณ์ไม่สำเร็จ";
      Alert.alert("เพิ่มอุปกรณ์ไม่สำเร็จ", message);
    } finally {
      setSaving(false);
    }
  };

  const onRemoveDevice = async (id: string) => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบอุปกรณ์นี้หรือไม่", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const updated = await removeManagedDevice(id);
          setDevices(updated);
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.screenBg }]}
    >
      <ScrollView contentContainerStyle={styles.contentWrap}>
        <Text style={[styles.title, { color: palette.title }]}>Devices</Text>
        <Text style={[styles.subtitle, { color: palette.subtitle }]}>
          เพิ่มและจัดการอุปกรณ์ที่ต้องการควบคุม
        </Text>

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          <Text style={[styles.inputLabel, { color: palette.label }]}>
            ชื่ออุปกรณ์
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: palette.cardBorder,
                color: palette.value,
                backgroundColor: themeMode === "dark" ? "#0C2132" : "#F5FAFF",
              },
            ]}
            placeholder="เช่น บ่อกุ้งหลัก"
            placeholderTextColor={palette.label}
            value={nameInput}
            onChangeText={setNameInput}
          />

          <Text style={[styles.inputLabel, { color: palette.label }]}>
            Device ID
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: palette.cardBorder,
                color: palette.value,
                backgroundColor: themeMode === "dark" ? "#0C2132" : "#F5FAFF",
              },
            ]}
            placeholder="เช่น device-001"
            placeholderTextColor={palette.label}
            value={idInput}
            onChangeText={setIdInput}
            autoCapitalize="none"
          />

          <View style={styles.formActionsRow}>
            <Pressable
              style={[
                styles.secondaryButton,
                { backgroundColor: palette.secondaryButtonBg },
              ]}
              onPress={() => {
                setNameInput("");
                setIdInput("");
              }}
            >
              <Text style={styles.buttonText}>ล้างค่า</Text>
            </Pressable>

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: palette.buttonBg },
                saving ? styles.buttonDisabled : null,
              ]}
              onPress={onAddDevice}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "กำลังเพิ่ม..." : "เพิ่ม Device"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={[styles.listTitle, { color: palette.title }]}>
            รายการอุปกรณ์
          </Text>
          <Pressable
            style={[
              styles.refreshButton,
              { backgroundColor: palette.secondaryButtonBg },
            ]}
            onPress={() => void loadDevices()}
          >
            <Text style={styles.buttonText}>{loading ? "..." : "รีเฟรช"}</Text>
          </Pressable>
        </View>

        {devices.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: palette.cardBg,
                borderColor: palette.cardBorder,
              },
            ]}
          >
            <Text style={[styles.emptyText, { color: palette.label }]}>
              ยังไม่มีอุปกรณ์ กดเพิ่มได้เลย
            </Text>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {devices.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.deviceRow,
                  {
                    backgroundColor: palette.cardBg,
                    borderColor: palette.cardBorder,
                  },
                ]}
              >
                <View style={styles.deviceMeta}>
                  <Text style={[styles.deviceName, { color: palette.value }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.deviceId, { color: palette.label }]}>
                    {item.id}
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.deleteButton,
                    { backgroundColor: palette.dangerBg },
                  ]}
                  onPress={() => onRemoveDevice(item.id)}
                >
                  <Text style={styles.deleteButtonText}>ลบ</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 10,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  formActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: "center",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  listHeaderRow: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  refreshButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  listWrap: {
    gap: 8,
  },
  deviceRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceMeta: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "700",
  },
  deviceId: {
    marginTop: 2,
    fontSize: 12,
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
});
