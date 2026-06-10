import axios from "axios";

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

export async function sendRelayCommand(input: SendRelayCommandInput) {
  if (!gatewayBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_GATEWAY_URL");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (gatewayApiKey) {
    headers["x-api-key"] = gatewayApiKey;
  }

  const url = `${gatewayBaseUrl.replace(/\/$/, "")}/api/devices/${encodeURIComponent(input.deviceId)}/controls`;

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
}

export async function getDeviceState(deviceId: string) {
  if (!gatewayBaseUrl) {
    throw new Error("Missing EXPO_PUBLIC_GATEWAY_URL");
  }

  const headers: Record<string, string> = {};
  if (gatewayApiKey) {
    headers["x-api-key"] = gatewayApiKey;
  }

  const url = `${gatewayBaseUrl.replace(/\/$/, "")}/api/devices/${encodeURIComponent(deviceId)}/state`;
  const response = await axios.get<DeviceStateResponse>(url, {
    headers,
    timeout: 5000,
  });

  return response.data.state;
}
