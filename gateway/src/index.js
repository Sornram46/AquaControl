const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const PORT = Number(process.env.PORT || 4000);
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY || "";
const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";
const MQTT_USERNAME = process.env.MQTT_USERNAME || undefined;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || undefined;
const MQTT_CLIENT_ID =
  process.env.MQTT_CLIENT_ID ||
  `aquacontrol-gateway-${Math.random().toString(16).slice(2, 8)}`;
const MQTT_CMD_TOPIC_TEMPLATE =
  process.env.MQTT_CMD_TOPIC_TEMPLATE || "aqua/{deviceId}/cmd";
const MQTT_ACK_SUBSCRIBE_TOPIC =
  process.env.MQTT_ACK_SUBSCRIBE_TOPIC || "aqua/+/ack";
const ACK_TIMEOUT_MS = Number(process.env.ACK_TIMEOUT_MS || 5000);
const SIM_MODE =
  String(process.env.SIM_MODE || "false").toLowerCase() === "true";
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT || 200);

const allowedControls = new Set(["pump", "aerator", "feeder", "uv"]);
const pendingAcks = new Map();
const deviceStateStore = new Map();
const commandHistory = [];

const app = express();
app.use(cors());
app.use(express.json());

const mqttClient = mqtt.connect(MQTT_URL, {
  clientId: MQTT_CLIENT_ID,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 1000,
});

mqttClient.on("connect", () => {
  console.log(`[mqtt] connected: ${MQTT_URL}`);
  mqttClient.subscribe(MQTT_ACK_SUBSCRIBE_TOPIC, (err) => {
    if (err) {
      console.error("[mqtt] subscribe failed", err);
      return;
    }
    console.log(`[mqtt] subscribed: ${MQTT_ACK_SUBSCRIBE_TOPIC}`);
  });
});

mqttClient.on("error", (err) => {
  console.error("[mqtt] error", err.message);
});

function getDefaultDeviceState(deviceId) {
  return {
    deviceId,
    controls: {
      pump: false,
      aerator: false,
      feeder: false,
      uv: false,
    },
    updatedAt: new Date().toISOString(),
    source: SIM_MODE ? "sim" : "unknown",
  };
}

function getDeviceState(deviceId) {
  if (!deviceStateStore.has(deviceId)) {
    deviceStateStore.set(deviceId, getDefaultDeviceState(deviceId));
  }

  return deviceStateStore.get(deviceId);
}

function updateDeviceState(deviceId, control, enabled, source = "gateway") {
  const prev = getDeviceState(deviceId);
  const next = {
    ...prev,
    controls: {
      ...prev.controls,
      [control]: enabled,
    },
    updatedAt: new Date().toISOString(),
    source,
  };

  deviceStateStore.set(deviceId, next);
  return next;
}

function appendHistory(item) {
  commandHistory.unshift(item);
  if (commandHistory.length > HISTORY_LIMIT) {
    commandHistory.length = HISTORY_LIMIT;
  }
}

mqttClient.on("message", (topic, payload) => {
  try {
    const parsed = JSON.parse(payload.toString("utf8"));
    const requestId = parsed?.requestId;
    if (!requestId || !pendingAcks.has(requestId)) {
      return;
    }

    const { resolve, timeout } = pendingAcks.get(requestId);
    clearTimeout(timeout);
    pendingAcks.delete(requestId);

    resolve({
      topic,
      ack: parsed,
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[mqtt] failed to parse ack payload", err.message);
  }
});

function ensureApiKey(req, res, next) {
  if (!GATEWAY_API_KEY) {
    next();
    return;
  }

  const headerKey = req.header("x-api-key") || "";
  if (headerKey !== GATEWAY_API_KEY) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  next();
}

function validateControlBody(req, res, next) {
  const { control, enabled, requestId } = req.body || {};

  if (!allowedControls.has(control)) {
    res.status(400).json({
      ok: false,
      error: "invalid_control",
      message: `control must be one of: ${Array.from(allowedControls).join(", ")}`,
    });
    return;
  }

  if (typeof enabled !== "boolean") {
    res.status(400).json({
      ok: false,
      error: "invalid_enabled",
      message: "enabled must be boolean",
    });
    return;
  }

  if (requestId && typeof requestId !== "string") {
    res.status(400).json({
      ok: false,
      error: "invalid_request_id",
      message: "requestId must be string if provided",
    });
    return;
  }

  next();
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    simMode: SIM_MODE,
    mqttConnected: mqttClient.connected,
    pendingAckCount: pendingAcks.size,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/devices/:deviceId/state", ensureApiKey, (req, res) => {
  const deviceId = String(req.params.deviceId || "").trim();
  if (!deviceId) {
    res.status(400).json({ ok: false, error: "invalid_device_id" });
    return;
  }

  const state = getDeviceState(deviceId);
  res.json({ ok: true, state });
});

app.get("/api/devices/:deviceId/history", ensureApiKey, (req, res) => {
  const deviceId = String(req.params.deviceId || "").trim();
  if (!deviceId) {
    res.status(400).json({ ok: false, error: "invalid_device_id" });
    return;
  }

  const history = commandHistory.filter((item) => item.deviceId === deviceId);
  res.json({ ok: true, history });
});

app.post(
  "/api/devices/:deviceId/controls",
  ensureApiKey,
  validateControlBody,
  async (req, res) => {
    const deviceId = String(req.params.deviceId || "").trim();
    if (!deviceId) {
      res.status(400).json({ ok: false, error: "invalid_device_id" });
      return;
    }

    if (!mqttClient.connected) {
      if (!SIM_MODE) {
        res.status(503).json({ ok: false, error: "mqtt_unavailable" });
        return;
      }
    }

    const requestId = req.body.requestId || uuidv4();
    const command = {
      requestId,
      deviceId,
      control: req.body.control,
      enabled: req.body.enabled,
      ts: Date.now(),
    };

    const cmdTopic = MQTT_CMD_TOPIC_TEMPLATE.replace("{deviceId}", deviceId);

    if (SIM_MODE) {
      const state = updateDeviceState(
        deviceId,
        command.control,
        command.enabled,
        "sim",
      );

      const ack = {
        requestId,
        deviceId,
        control: command.control,
        enabled: command.enabled,
        status: "ok",
        source: "sim",
        ts: Date.now(),
      };

      appendHistory({
        requestId,
        deviceId,
        control: command.control,
        enabled: command.enabled,
        status: "sim_ok",
        commandTopic: cmdTopic,
        timestamp: new Date().toISOString(),
      });

      res.json({
        ok: true,
        simMode: true,
        requestId,
        commandTopic: cmdTopic,
        command,
        ack,
        state,
      });
      return;
    }

    try {
      const ackPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pendingAcks.delete(requestId);
          reject(new Error("ack_timeout"));
        }, ACK_TIMEOUT_MS);

        pendingAcks.set(requestId, { resolve, reject, timeout });
      });

      mqttClient.publish(
        cmdTopic,
        JSON.stringify(command),
        { qos: 1 },
        (err) => {
          if (err) {
            if (pendingAcks.has(requestId)) {
              const { reject, timeout } = pendingAcks.get(requestId);
              clearTimeout(timeout);
              pendingAcks.delete(requestId);
              reject(err);
            }
          }
        },
      );

      const ackResult = await ackPromise;
      const state = updateDeviceState(
        deviceId,
        command.control,
        command.enabled,
        "mqtt",
      );

      appendHistory({
        requestId,
        deviceId,
        control: command.control,
        enabled: command.enabled,
        status: "ok",
        commandTopic: cmdTopic,
        timestamp: new Date().toISOString(),
      });

      res.json({
        ok: true,
        requestId,
        commandTopic: cmdTopic,
        command,
        ack: ackResult,
        state,
      });
    } catch (err) {
      appendHistory({
        requestId,
        deviceId,
        control: command.control,
        enabled: command.enabled,
        status: err.message || "command_failed",
        commandTopic: cmdTopic,
        timestamp: new Date().toISOString(),
      });

      res.status(504).json({
        ok: false,
        error: err.message || "command_failed",
        requestId,
        commandTopic: cmdTopic,
        command,
      });
    }
  },
);

const server = app.listen(PORT, () => {
  console.log(
    `[gateway] listening on http://localhost:${PORT} (simMode=${SIM_MODE})`,
  );
});

function shutdown() {
  server.close(() => {
    mqttClient.end(true, () => {
      process.exit(0);
    });
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
