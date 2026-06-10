# AquaControl Gateway

Node.js HTTPS->MQTT gateway for AquaControl.

## 1) Install

```bash
cd gateway
npm install
```

## 2) Configure

Copy `.env.example` to `.env` and update values.

## 3) Run

```bash
npm start
```

## Endpoints

- `GET /health`
- `POST /api/devices/:deviceId/controls`

Example body:

```json
{
  "control": "pump",
  "enabled": true,
  "requestId": "optional-uuid"
}
```

If `GATEWAY_API_KEY` is set, send header:

`x-api-key: <your-key>`
