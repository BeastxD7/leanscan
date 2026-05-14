/**
 * Cross-platform key/value storage for auth tokens.
 *
 * Native (iOS/Android):  expo-secure-store — encrypted at rest in the keychain.
 * Web (Expo dev / future webapp): AsyncStorage backed by localStorage —
 *   NOT encrypted, but the only realistic option in a browser. Acceptable for
 *   dev preview; production web (Phase 8+) will use httpOnly cookies or web crypto.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'leanscan.';

const KEYS = {
  accessToken: `${KEY_PREFIX}access_token`,
  refreshToken: `${KEY_PREFIX}refresh_token`,
  userJson: `${KEY_PREFIX}user`,
} as const;

export type StorageKey = keyof typeof KEYS;

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function setItem(key: StorageKey, value: string): Promise<void> {
  if (isNative) {
    await SecureStore.setItemAsync(KEYS[key], value);
  } else {
    await AsyncStorage.setItem(KEYS[key], value);
  }
}

export async function getItem(key: StorageKey): Promise<string | null> {
  if (isNative) {
    return SecureStore.getItemAsync(KEYS[key]);
  }
  return AsyncStorage.getItem(KEYS[key]);
}

export async function removeItem(key: StorageKey): Promise<void> {
  if (isNative) {
    await SecureStore.deleteItemAsync(KEYS[key]);
  } else {
    await AsyncStorage.removeItem(KEYS[key]);
  }
}

export async function clearAll(): Promise<void> {
  await Promise.all((Object.keys(KEYS) as StorageKey[]).map((k) => removeItem(k)));
}
