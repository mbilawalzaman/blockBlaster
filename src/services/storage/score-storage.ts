import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORE_STORAGE_KEY = '@block_puzzle/best_score_v1';

export function parseBestScore(raw: unknown): number {
  if (typeof raw !== 'string') return 0;
  if (!/^\d+$/.test(raw)) return 0;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : 0;
}

export async function loadBestScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SCORE_STORAGE_KEY);
    return parseBestScore(raw);
  } catch {
    return 0;
  }
}

let pendingWrites: Promise<void> = Promise.resolve();

export function saveBestScore(score: number): Promise<void> {
  if (!Number.isSafeInteger(score) || score < 0) return Promise.resolve();
  pendingWrites = pendingWrites.then(async () => {
    try {
      const stored = parseBestScore(await AsyncStorage.getItem(SCORE_STORAGE_KEY));
      const best = Math.max(stored, score);
      if (best > stored) await AsyncStorage.setItem(SCORE_STORAGE_KEY, best.toString());
    } catch {
      // Persistence failures must not affect gameplay; a later score change can retry.
    }
  });
  return pendingWrites;
}
