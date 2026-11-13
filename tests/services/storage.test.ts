import { describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  parsePreferences,
  savePreferences,
} from '../../src/services/storage/preferences-storage';
import {
  loadBestScore,
  parseBestScore,
  saveBestScore,
} from '../../src/services/storage/score-storage';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
    },
  };
});

describe('Preferences Storage', () => {
  it('parses valid preferences JSON correctly', () => {
    const raw = JSON.stringify({ sound: false, vibration: true });
    expect(parsePreferences(raw)).toEqual({ sound: false, vibration: true });
  });

  it('falls back safely on corrupt or missing fields', () => {
    expect(parsePreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences('invalid-json')).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ sound: 'yes', vibration: 123 }))).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences(JSON.stringify({ sound: false }))).toEqual({ sound: false, vibration: true });
  });

  it('loads and saves preferences via AsyncStorage', async () => {
    await savePreferences({ sound: false, vibration: false });
    const loaded = await loadPreferences();
    expect(loaded).toEqual({ sound: false, vibration: false });
  });

  it('handles AsyncStorage errors without throwing', async () => {
    vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('Storage failure'));
    const result = await loadPreferences();
    expect(result).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('Score Storage', () => {
  it('parses valid scores and falls back safely on invalid values', () => {
    expect(parseBestScore('150')).toBe(150);
    expect(parseBestScore('0')).toBe(0);
    expect(parseBestScore('-50')).toBe(0);
    expect(parseBestScore('not-a-number')).toBe(0);
    expect(parseBestScore(null)).toBe(0);
  });

  it('saves and preserves highest scores without overwriting with lower scores', async () => {
    await saveBestScore(200);
    expect(await loadBestScore()).toBe(200);

    // Attempting to save a lower score must not overwrite
    await saveBestScore(150);
    expect(await loadBestScore()).toBe(200);

    // Saving a higher score should update
    await saveBestScore(500);
    expect(await loadBestScore()).toBe(500);
  });
});
