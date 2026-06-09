import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string | null>(null);

  const hasPermission = permission?.granted ?? false;

  if (!permission) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredWrap}>
          <Text style={styles.infoText}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centeredWrap}>
          <Text style={styles.title}>Need Camera Access</Text>
          <Text style={styles.infoText}>
            Please allow camera permission to scan QR or barcodes.
          </Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Allow Camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.contentWrap}>
        <Text style={styles.kicker}>AQUACONTROL</Text>
        <Text style={styles.title}>Scan</Text>
        <Text style={styles.infoText}>
          Point your camera at a QR code or barcode.
        </Text>

        <View style={styles.cameraCard}>
          <CameraView
            style={styles.cameraView}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
            }}
            onBarcodeScanned={
              scannedData
                ? undefined
                : ({ data }) => {
                    setScannedData(data);
                  }
            }
          />
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Scan Result</Text>
          <Text style={styles.resultValue}>
            {scannedData ?? "No result yet"}
          </Text>
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            !scannedData ? styles.primaryButtonDisabled : null,
          ]}
          disabled={!scannedData}
          onPress={() => setScannedData(null)}
        >
          <Text style={styles.primaryButtonText}>Scan Again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1723",
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  centeredWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  kicker: {
    color: "#8CC7D1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: "#ECF6FF",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 8,
  },
  infoText: {
    color: "#B7C8D6",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  cameraCard: {
    marginTop: 18,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#24425A",
    backgroundColor: "#031520",
  },
  cameraView: {
    width: "100%",
    height: 320,
  },
  resultCard: {
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#E9F2F8",
  },
  resultLabel: {
    color: "#4A5E70",
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 6,
  },
  resultValue: {
    color: "#102333",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#0F7F96",
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
