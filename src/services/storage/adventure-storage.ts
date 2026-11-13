import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LevelRecord {
  readonly stars: 1 | 2 | 3;
  readonly highscore: number;
  readonly completedAt: number;
}

export interface AdventureSaveData {
  readonly version: 1;
  readonly highestUnlockedLevel: number;
  readonly records: Readonly<Record<number, LevelRecord>>;
}

export const ADVENTURE_STORAGE_KEY = '@block_puzzle/adventure_progress_v1';

export const DEFAULT_ADVENTURE_PROGRESS: AdventureSaveData = {
  version: 1,
  highestUnlockedLevel: 1,
  records: {},
};

/** Merge asynchronous loads and writes without allowing stale/default data to lower progress. */
export function mergeAdventureProgress(
  current: AdventureSaveData,
  incoming: AdventureSaveData,
): AdventureSaveData {
  const records: Record<number, LevelRecord> = { ...current.records };
  for (const [key, incomingRecord] of Object.entries(incoming.records)) {
    const levelId = Number(key);
    const existing = records[levelId];
    if (!existing) {
      records[levelId] = incomingRecord;
      continue;
    }
    const merged = {
      stars: Math.max(existing.stars, incomingRecord.stars) as 1 | 2 | 3,
      highscore: Math.max(existing.highscore, incomingRecord.highscore),
      completedAt: Math.max(existing.completedAt, incomingRecord.completedAt),
    };
    if (merged.stars !== existing.stars || merged.highscore !== existing.highscore
      || merged.completedAt !== existing.completedAt) {
      records[levelId] = merged;
    }
  }
  const highestUnlockedLevel = Math.max(current.highestUnlockedLevel, incoming.highestUnlockedLevel);
  const hasNewRecord = Object.keys(records).length !== Object.keys(current.records).length
    || Object.entries(records).some(([key, value]) => {
      const existing = current.records[Number(key)];
      return !existing || existing.stars !== value.stars || existing.highscore !== value.highscore
        || existing.completedAt !== value.completedAt;
    });
  if (!hasNewRecord && highestUnlockedLevel === current.highestUnlockedLevel) return current;
  return { version: 1, highestUnlockedLevel, records };
}

export function parseAdventureProgress(raw: unknown): AdventureSaveData {
  if (typeof raw !== 'string') return DEFAULT_ADVENTURE_PROGRESS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_ADVENTURE_PROGRESS;
    const record = parsed as Record<string, unknown>;

    const highest = Number(record['highestUnlockedLevel']);
    const highestUnlockedLevel =
      Number.isSafeInteger(highest) && highest >= 1 ? highest : 1;

    const rawRecords = record['records'];
    const records: Record<number, LevelRecord> = {};

    if (rawRecords && typeof rawRecords === 'object') {
      for (const [key, value] of Object.entries(rawRecords)) {
        const levelId = Number(key);
        if (!Number.isSafeInteger(levelId) || levelId < 1) continue;
        if (!value || typeof value !== 'object') continue;
        const entry = value as Record<string, unknown>;

        const starsNum = Number(entry['stars']);
        const stars = starsNum === 1 || starsNum === 2 || starsNum === 3 ? starsNum : null;
        const highscore = Number(entry['highscore']);
        const completedAt = Number(entry['completedAt']);

        if (
          stars !== null &&
          Number.isSafeInteger(highscore) &&
          highscore >= 0 &&
          Number.isSafeInteger(completedAt) &&
          completedAt >= 0
        ) {
          records[levelId] = { stars, highscore, completedAt };
        }
      }
    }

    return {
      version: 1,
      highestUnlockedLevel,
      records,
    };
  } catch {
    return DEFAULT_ADVENTURE_PROGRESS;
  }
}

export async function loadAdventureProgress(): Promise<AdventureSaveData> {
  try {
    const raw = await AsyncStorage.getItem(ADVENTURE_STORAGE_KEY);
    return parseAdventureProgress(raw);
  } catch {
    return DEFAULT_ADVENTURE_PROGRESS;
  }
}

let pendingAdventureWrites: Promise<AdventureSaveData> = Promise.resolve(DEFAULT_ADVENTURE_PROGRESS);

export function saveAdventureLevelCompletion(
  levelId: number,
  stars: 1 | 2 | 3,
  score: number,
  completedAt: number = Date.now(),
): Promise<AdventureSaveData> {
  if (!Number.isSafeInteger(levelId) || levelId < 1 || score < 0) {
    return loadAdventureProgress();
  }

  pendingAdventureWrites = pendingAdventureWrites.then(async () => {
    let current = DEFAULT_ADVENTURE_PROGRESS;
    try {
      current = await loadAdventureProgress();
      const existing = current.records[levelId];

      const mergedStars = existing ? (Math.max(existing.stars, stars) as 1 | 2 | 3) : stars;
      const mergedScore = existing ? Math.max(existing.highscore, score) : score;

      const updatedRecords: Record<number, LevelRecord> = {
        ...current.records,
        [levelId]: {
          stars: mergedStars,
          highscore: mergedScore,
          completedAt,
        },
      };

      const nextUnlocked = Math.max(current.highestUnlockedLevel, levelId + 1);

      const updatedSaveData: AdventureSaveData = {
        version: 1,
        highestUnlockedLevel: nextUnlocked,
        records: updatedRecords,
      };

      await AsyncStorage.setItem(ADVENTURE_STORAGE_KEY, JSON.stringify(updatedSaveData));
      return updatedSaveData;
    } catch {
      return current;
    }
  });

  return pendingAdventureWrites;
}
