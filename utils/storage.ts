import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleError } from './errorHandler';

const STORAGE_KEYS = {
  PROFILE_ID: 'profileId',
  LAST_SYNC: 'lastSync',
  OFFLINE_QUEUE: 'offlineQueue',
} as const;

export const storage = {
  async setProfileId(profileId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_ID, profileId);
    } catch (error) {
      const appError = handleError(error, 'storage.setProfileId');
      throw new Error(appError.message);
    }
  },

  async getProfileId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_ID);
    } catch (error) {
      handleError(error, 'storage.getProfileId');
      return null;
    }
  },

  async removeProfileId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PROFILE_ID);
    } catch (error) {
      const appError = handleError(error, 'storage.removeProfileId');
      throw new Error(appError.message);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      const appError = handleError(error, 'storage.clear');
      throw new Error(appError.message);
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      const appError = handleError(error, `storage.setItem(${key})`);
      throw new Error(appError.message);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      handleError(error, `storage.getItem(${key})`);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      const appError = handleError(error, `storage.removeItem(${key})`);
      throw new Error(appError.message);
    }
  },
};
