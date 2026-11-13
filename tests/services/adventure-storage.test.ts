import { describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_ADVENTURE_PROGRESS,
  loadAdventureProgress,
  mergeAdventureProgress,
  parseAdventureProgress,
  saveAdventureLevelCompletion,
} from '../../src/services/storage/adventure-storage';

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

describe('Adventure Storage', () => {
  it('parses valid adventure progress correctly', () => {
    const raw = JSON.stringify({
      version: 1,
      highestUnlockedLevel: 3,
      records: {
        1: { stars: 3, highscore: 1200, completedAt: 1000 },
        2: { stars: 2, highscore: 850, completedAt: 2000 },
      },
    });
    const parsed = parseAdventureProgress(raw);
    expect(parsed.highestUnlockedLevel).toBe(3);
    expect(parsed.records[1]?.stars).toBe(3);
    expect(parsed.records[2]?.highscore).toBe(850);
  });

  it('falls back safely on corrupt or non-object payloads', () => {
    expect(parseAdventureProgress(null)).toEqual(DEFAULT_ADVENTURE_PROGRESS);
    expect(parseAdventureProgress('garbage')).toEqual(DEFAULT_ADVENTURE_PROGRESS);
    expect(parseAdventureProgress(JSON.stringify({ highestUnlockedLevel: -5 }))).toEqual({
      version: 1,
      highestUnlockedLevel: 1,
      records: {},
    });
  });

  it('unlocks subsequent level and merges highest stars and scores on replay', async () => {
    // Complete Level 1 with 2 stars and 800 score
    const res1 = await saveAdventureLevelCompletion(1, 2, 800, 100);
    expect(res1.highestUnlockedLevel).toBe(2);
    expect(res1.records[1]?.stars).toBe(2);
    expect(res1.records[1]?.highscore).toBe(800);

    // Replay Level 1 with 3 stars and 600 score (higher stars, lower score)
    const res2 = await saveAdventureLevelCompletion(1, 3, 600, 200);
    expect(res2.records[1]?.stars).toBe(3); // Increased
    expect(res2.records[1]?.highscore).toBe(800); // Preserved previous higher score

    // Replay Level 1 with 1 star and 1500 score (lower stars, higher score)
    const res3 = await saveAdventureLevelCompletion(1, 1, 1500, 300);
    expect(res3.records[1]?.stars).toBe(3); // Preserved highest stars
    expect(res3.records[1]?.highscore).toBe(1500); // Updated to higher score
  });

  it('handles AsyncStorage read errors gracefully', async () => {
    vi.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('AsyncStorage offline'));
    const result = await loadAdventureProgress();
    expect(result).toEqual(DEFAULT_ADVENTURE_PROGRESS);
  });

  it('returns the existing progress when persisting a completion fails', async () => {
    const before = await loadAdventureProgress();
    vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('AsyncStorage write failed'));

    const result = await saveAdventureLevelCompletion(2, 1, 300, 400);

    expect(result).toEqual(before);
    expect(result.records[1]?.highscore).toBe(1500);
    expect(result.records[2]).toBeUndefined();
  });

  it('merges a stale or default load without lowering in-memory progress', () => {
    const progress = parseAdventureProgress(JSON.stringify({
      version: 1,
      highestUnlockedLevel: 4,
      records: { 1: { stars: 3, highscore: 1500, completedAt: 300 } },
    }));
    expect(mergeAdventureProgress(progress, DEFAULT_ADVENTURE_PROGRESS)).toBe(progress);
    expect(mergeAdventureProgress(progress, DEFAULT_ADVENTURE_PROGRESS)).toEqual(progress);
  });
});
