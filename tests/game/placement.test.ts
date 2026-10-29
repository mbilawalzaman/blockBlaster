import { describe, expect, it } from 'vitest';
import { placementAt } from '../../src/features/game/gestures/placement';

describe('drag placement mapping', () => {
  const bounds = { x: 50, y: 120, size: 400 };
  it('maps the displayed piece origin in window coordinates', () => {
    expect(placementAt(50, 120, bounds)).toEqual({ row: 0, col: 0 });
    expect(placementAt(199, 271, bounds)).toEqual({ row: 3, col: 2 });
    expect(placementAt(449, 519, bounds)).toEqual({ row: 7, col: 7 });
  });
  it('keeps out-of-board coordinates invalid instead of clamping them', () => {
    expect(placementAt(49, 119, bounds)).toEqual({ row: -1, col: -1 });
    expect(placementAt(450, 520, bounds)).toEqual({ row: 8, col: 8 });
  });
  it('uses current measured position and size after a layout change', () => {
    expect(placementAt(140, 280, { x: 100, y: 200, size: 320 })).toEqual({ row: 2, col: 1 });
  });
});
