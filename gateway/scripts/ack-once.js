const mqtt = require("mqtt");

const brokerUrl = process.env.MQTT_URL || "mqtt://broker.hivemq.com:1883";
const deviceId = process.env.DEVICE_ID || "device-001";
const commandTopic = `aqua/${deviceId}/cmd`;
const ackTopic = `aqua/${deviceId}/ack`;

const client = mqtt.connect(brokerUrl, {
  clientId: `aquacontrol-test-esp32-${Math.random().toString(16).slice(2)}`,
  connectTimeout: 8000,
  reconnectPeriod: 0,
});

const timeout = setTimeout(() => {
  console.log("TIMEOUT waiting for command");
  client.end(true, () => process.exit(2));
}, 20000);

client.on("connect", () => {
  console.log(`CONNECTED ${brokerUrl}`);
  client.subscribe(commandTopic, { qos: 1 }, (error) => {
    if (error) {
      console.log(`SUBSCRIBE_ERROR ${error.message}`);
      clearTimeout(timeout);
      client.end(true, () => process.exit(1));
      return;
    }

    console.log(`SUBSCRIBED ${commandTopic}`);
  });
});

client.on("error", (error) => {
  console.log(`MQTT_ERROR ${error.message}`);
});

client.on("message", (topic, payload) => {
  console.log(`COMMAND ${topic} ${payload.toString()}`);

  const command = JSON.parse(payload.toString());
  const ack = {
    requestId: command.requestId,
    deviceId: command.deviceId,
    control: command.control,
    enabled: command.enabled,
    status: "ok",
    source: "test-esp32",
    ts: Date.now(),
  };

  client.publish(ackTopic, JSON.stringify(ack), { qos: 1 }, (error) => {
    clearTimeout(timeout);

    if (error) {
      console.log(`ACK_ERROR ${error.message}`);
      client.end(true, () => process.exit(1));
      return;
    }

    console.log(`ACK_SENT ${ackTopic} ${JSON.stringify(ack)}`);
    client.end(true, () => process.exit(0));
  });
});
