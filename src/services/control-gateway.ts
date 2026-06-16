import axios from "axios";
import Constants from "expo-constants";

export type RelayControlKey = "pump" | "aerator" | "feeder" | "uv";

type SendRelayCommandInput = {
  deviceId: string;
  control: RelayControlKey;
  enabled: boolean;
};

type GatewayResponse = {
  ok: boolean;
  requestId: string;
  commandTopic: string;
};

type DeviceStateResponse = {
  ok: boolean;
  state: {
    deviceId: string;
    controls: Record<RelayControlKey, boolean>;
    updatedAt: string;
    source: string;
  };
};

const gatewayBaseUrl = process.env.EXPO_PUBLIC_GATEWAY_URL ?? "";
const gatewayApiKey = process.env.EXPO_PUBLIC_GATEWAY_API_KEY ?? "";

function extractHost(value?: string | null) {
  if (!value) {
    return "";
  }

  const cleaned = value.replace(/^https?:\/\//, "").replace(/^exp:\/\//, "");
  return cleaned.split(":")[0] ?? "";
}

function getExpoDevHostCandidates() {
  const candidates: string[] = [];

  const hostFromExpoConfig = extractHost(Constants.expoConfig?.hostUri);
  if (hostFromExpoConfig) {
    candidates.push(`http://${hostFromExpoConfig}:4010`);
  }

  const manifest2 = (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2;
  const debuggerHost = manifest2?.extra?.expoGo?.debuggerHost;
  const hostFromDebugger = extractHost(debuggerHost);
  if (hostFromDebugger) {
    candidates.push(`http://${hostFromDebugger}:4010`);
  }

  return candidates;
}

function getGatewayBaseUrls() {
  const envUrls = gatewayBaseUrl
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\/$/, ""));

  const expoHostUrls = getExpoDevHostCandidates();
  return Array.from(new Set([...envUrls, ...expoHostUrls]));
}

function buildNetworkError(action: string, urls: string[]) {
  return new Error(
    `${action} failed. Tried: ${urls.join(" | ")}. Check EXPO_PUBLIC_GATEWAY_URL and gateway availability.`,
  );
}

export async function sendRelayCommand(input: SendRelayCommandInput) {
  const baseUrls = getGatewayBaseUrls();

  if (baseUrls.length === 0) {
    throw new Error("Missing EXPO_PUBLIC_GATEWAY_URL");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (gatewayApiKey) {
    headers["x-api-key"] = gatewayApiKey;
  }

  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/api/devices/${encodeURIComponent(input.deviceId)}/controls`;

    try {
      const response = await axios.post<GatewayResponse>(
        url,
        {
          control: input.control,
          enabled: input.enabled,
        },
        {
          headers,
          timeout: 7000,
        },
      );

      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`${buildNetworkError("sendRelayCommand", baseUrls).message} Last error: ${lastError.message}`);
  }

  throw buildNetworkError("sendRelayCommand", baseUrls);
}

export async function getDeviceState(deviceId: string) {
  const baseUrls = getGatewayBaseUrls();

  if (baseUrls.length === 0) {
    throw new Error("Missing EXPO_PUBLIC_GATEWAY_URL");
  }

  const headers: Record<string, string> = {};
  if (gatewayApiKey) {
    headers["x-api-key"] = gatewayApiKey;
  }

  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/api/devices/${encodeURIComponent(deviceId)}/state`;

    try {
      const response = await axios.get<DeviceStateResponse>(url, {
        headers,
        timeout: 5000,
      });

      return response.data.state;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`${buildNetworkError("getDeviceState", baseUrls).message} Last error: ${lastError.message}`);
  }

  throw buildNetworkError("getDeviceState", baseUrls);
}
