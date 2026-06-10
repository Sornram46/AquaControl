import * as SecureStore from "expo-secure-store";

export type ManagedDevice = {
  id: string;
  name: string;
  createdAt: string;
};

const DEVICE_STORAGE_KEY = "aquacontrol.managed_devices";

async function readDevices() {
  const raw = await SecureStore.getItemAsync(DEVICE_STORAGE_KEY);
  if (!raw) {
    return [] as ManagedDevice[];
  }

  try {
    const parsed = JSON.parse(raw) as ManagedDevice[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

async function writeDevices(devices: ManagedDevice[]) {
  await SecureStore.setItemAsync(DEVICE_STORAGE_KEY, JSON.stringify(devices));
}

export async function getManagedDevices() {
  return readDevices();
}

export async function addManagedDevice(input: { id: string; name: string }) {
  const id = input.id.trim();
  const name = input.name.trim();

  if (!id || !name) {
    throw new Error("device_id_and_name_required");
  }

  const devices = await readDevices();
  const exists = devices.some(
    (item) => item.id.toLowerCase() === id.toLowerCase(),
  );
  if (exists) {
    throw new Error("duplicate_device_id");
  }

  const next: ManagedDevice = {
    id,
    name,
    createdAt: new Date().toISOString(),
  };

  const updated = [next, ...devices];
  await writeDevices(updated);
  return updated;
}

export async function removeManagedDevice(id: string) {
  const deviceId = id.trim().toLowerCase();
  if (!deviceId) {
    return readDevices();
  }

  const devices = await readDevices();
  const updated = devices.filter((item) => item.id.toLowerCase() !== deviceId);
  await writeDevices(updated);
  return updated;
}
