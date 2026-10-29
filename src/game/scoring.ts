export const POINTS_PER_BLOCK = 1;
export const POINTS_PER_LINE = 10;

/** Only line bonuses receive the consecutive-clear multiplier. */
export function calculateScore(placedCells: number, clearedLines: number, previousCombo: number) {
  const combo = clearedLines > 0 ? previousCombo + 1 : 0;
  const points = placedCells * POINTS_PER_BLOCK + clearedLines * POINTS_PER_LINE * combo;
  return { points, combo };
}
