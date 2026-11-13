import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORE_STORAGE_KEY = '@block_puzzle/best_score_v1';

export function parseBestScore(raw: unknown): number {
  if (typeof raw !== 'string') return 0;
  try {
    const value = Number.parseInt(raw, 10);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export async function loadBestScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(SCORE_STORAGE_KEY);
    return parseBestScore(raw);
  } catch {
    return 0;
  }
}

let latestPersistedScore = 0;

export async function saveBestScore(score: number): Promise<void> {
  if (!Number.isSafeInteger(score) || score <= latestPersistedScore) return;
  try {
    latestPersistedScore = score;
    await AsyncStorage.setItem(SCORE_STORAGE_KEY, score.toString());
  } catch {
    // Graceful fallback: persistence failure never blocks game play.
  }
}
