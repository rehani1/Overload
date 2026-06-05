import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadStoredJson<TValue>(key: string): Promise<TValue | null> {
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
  await AsyncStorage.removeItem(key);
}

export async function saveStoredJson<TValue>(key: string, value: TValue): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

