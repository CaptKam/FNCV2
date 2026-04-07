import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Unified storage interface wrapping AsyncStorage.
 * Swap to MMKV in a future EAS build without changing consumers.
 */
export const Storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Storage.get failed for key "${key}":`, error);
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Storage.set failed for key "${key}":`, error);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn(`Storage.remove failed for key "${key}":`, error);
    }
  },
};
