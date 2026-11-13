import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  readonly sound: boolean;
  readonly vibration: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  sound: true,
  vibration: true,
};

const STORAGE_KEY = '@block_puzzle/preferences_v1';

export function parsePreferences(raw: unknown): UserPreferences {
  if (typeof raw !== 'string') return DEFAULT_PREFERENCES;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return DEFAULT_PREFERENCES;
    const record = data as Record<string, unknown>;
    const sound = typeof record['sound'] === 'boolean' ? record['sound'] : DEFAULT_PREFERENCES.sound;
    const vibration = typeof record['vibration'] === 'boolean' ? record['vibration'] : DEFAULT_PREFERENCES.vibration;
    return { sound, vibration };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return parsePreferences(raw);
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Gracefully handle persistence failure; gameplay continues unaffected.
  }
}
