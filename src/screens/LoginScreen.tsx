import { supabaseClient } from "@/src/services/supabase";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
    Alert,
    Keyboard,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function LoginScreen() {
  const BIOMETRIC_EMAIL_KEY = "biometric_login_email";
  const BIOMETRIC_PASSWORD_KEY = "biometric_login_password";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("กรอกข้อมูลไม่ครบ", "กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("เข้าสู่ระบบไม่สำเร็จ", error.message);
      return;
    }

    await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email.trim());
    await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);

    router.replace("/");
  };

  const onBiometricLogin = async () => {
    setBiometricLoading(true);

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      setBiometricLoading(false);
      Alert.alert(
        "อุปกรณ์ไม่รองรับ",
        "มือถือเครื่องนี้ไม่รองรับการสแกนใบหน้าหรือลายนิ้วมือ",
      );
      return;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      setBiometricLoading(false);
      Alert.alert(
        "ยังไม่ได้ตั้งค่า",
        "กรุณาตั้งค่า Face ID หรือรหัสหน้าจอบนมือถือก่อน",
      );
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "ยืนยันตัวตนเพื่อเข้าสู่ระบบ",
      cancelLabel: "ยกเลิก",
      fallbackLabel: "ใช้รหัสเครื่อง",
    });

    if (!result.success) {
      setBiometricLoading(false);
      return;
    }

    const savedEmail = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
    const savedPassword = await SecureStore.getItemAsync(
      BIOMETRIC_PASSWORD_KEY,
    );

    if (!savedEmail || !savedPassword) {
      setBiometricLoading(false);
      Alert.alert(
        "ยังไม่ได้เปิดใช้งาน",
        "กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านอย่างน้อย 1 ครั้งบนเครื่องนี้ก่อน",
      );
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: savedEmail,
      password: savedPassword,
    });

    setBiometricLoading(false);

    if (error) {
      Alert.alert("เข้าสู่ระบบด้วยสแกนหน้าไม่สำเร็จ", error.message);
      return;
    }

    router.replace("/");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.backgroundOrbTop} />
        <View style={styles.backgroundOrbBottom} />

        <View style={styles.contentWrap}>
          <Text style={styles.kicker}>AQUACONTROL</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            ลงชื่อเข้าใช้เพื่อเข้าถึงแดชบอร์ดระบบน้ำของคุณ
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#7E8A95"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#7E8A95"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <Pressable
              onPress={onLogin}
              disabled={loading || biometricLoading}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && !loading ? styles.loginButtonPressed : null,
                loading || biometricLoading ? styles.loginButtonDisabled : null,
              ]}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onBiometricLogin}
              disabled={loading || biometricLoading}
              style={({ pressed }) => [
                styles.faceButton,
                pressed && !biometricLoading ? styles.faceButtonPressed : null,
                loading || biometricLoading ? styles.loginButtonDisabled : null,
              ]}
            >
              <Text style={styles.faceButtonText}>
                {biometricLoading
                  ? "กำลังยืนยันตัวตน..."
                  : "สแกนใบหน้าเข้าสู่ระบบ"}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1723",
  },
  backgroundOrbTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#18A2B8",
    opacity: 0.23,
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: -140,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#4CB6A0",
    opacity: 0.2,
  },
  contentWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  kicker: {
    color: "#8CC7D1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: "#ECF6FF",
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  subtitle: {
    color: "#9FB0C1",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#E9F2F8",
  },
  label: {
    color: "#2A3A4A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C9DAE6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    color: "#112436",
  },
  loginButton: {
    marginTop: 2,
    borderRadius: 12,
    backgroundColor: "#0F7F96",
    paddingVertical: 13,
    alignItems: "center",
  },
  loginButtonPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: "#0D6F84",
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  faceButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0F7F96",
    backgroundColor: "#DFF1F4",
    paddingVertical: 12,
    alignItems: "center",
  },
  faceButtonPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: "#CBE8ED",
  },
  faceButtonText: {
    color: "#0F5F70",
    fontSize: 15,
    fontWeight: "700",
  },
});
