import { BOARD_SIZE } from '../../../game/types';
import type { Point } from '../../../game/types';
export interface BoardBounds { readonly x: number; readonly y: number; readonly size: number }
export interface PlacementPreview extends Point { readonly pieceId: string }
/** Coordinates refer to the displayed piece origin, not the pointer. */
export function placementAt(x: number, y: number, bounds: BoardBounds): Point {
  const pitch = bounds.size / BOARD_SIZE;
  return { row: Math.floor((y - bounds.y) / pitch), col: Math.floor((x - bounds.x) / pitch) };
}
