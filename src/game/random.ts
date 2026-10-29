import { SHAPES } from './shapes';
import { TRAY_SIZE } from './types';
import type { Piece } from './types';

/** Pure source: identical seeds must return identical samples and next seeds. */
export type RandomSource = (seed: number) => { readonly value: number; readonly seed: number };

export function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed)) throw new Error('Seed must be a safe integer');
  return seed >>> 0;
}

/** 32-bit LCG for reproducible gameplay, not cryptography. */
export const seededRandom: RandomSource = (seed) => {
  const next = (Math.imul(normalizeSeed(seed), 1664525) + 1013904223) >>> 0;
  return { value: next / 4294967296, seed: next };
};

export function generateTray(seed: number, firstId: number, random: RandomSource = seededRandom) {
  const pieces: Piece[] = [];
  let currentSeed = normalizeSeed(seed);
  for (let index = 0; index < TRAY_SIZE; index += 1) {
    const sample = random(currentSeed);
    if (!Number.isFinite(sample.value) || sample.value < 0 || sample.value >= 1) {
      throw new Error('Random sample must be in [0, 1)');
    }
    currentSeed = normalizeSeed(sample.seed);
    const shape = SHAPES[Math.floor(sample.value * SHAPES.length)];
    if (!shape) throw new Error('Shape catalogue must not be empty');
    pieces.push({ id: `piece-${firstId + index}`, shape });
  }
  return { pieces, randomSeed: currentSeed, nextPieceId: firstId + TRAY_SIZE };
}
