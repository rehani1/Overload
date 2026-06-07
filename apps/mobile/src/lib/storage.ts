import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadStoredJson<TValue>(key: string): Promise<TValue | null> {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const storedValue = await AsyncStorage.getItem(key);

    if (!storedValue) {
      return null;
    }

    return JSON.parse(storedValue) as TValue;
  } catch {
    return null;
  }
}

export async function removeStoredJson(key: string): Promise<void> {
  if (!canUseStorage()) {
    return;
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Storage is best-effort for local app state.
  }
}

export async function saveStoredJson<TValue>(key: string, value: TValue): Promise<void> {
  if (!canUseStorage()) {
    return;
  }

  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort for local app state.
  }
}

function canUseStorage() {
  return typeof window !== "undefined";
}
