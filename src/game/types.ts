export const BOARD_SIZE = 8;
export const TRAY_SIZE = 3;

export type Cell = string | null;
export type Board = readonly (readonly Cell[])[];
export interface Point { readonly row: number; readonly col: number }
export interface Shape {
  readonly id: string;
  readonly color: string;
  readonly cells: readonly Point[];
}
export interface Piece { readonly id: string; readonly shape: Shape }
export interface GameState {
  readonly board: Board;
  readonly pieces: readonly (Piece | null)[];
  readonly score: number;
  readonly bestScore: number;
  readonly combo: number;
  readonly gameOver: boolean;
  readonly revision: number;
  readonly nextPieceId: number;
  readonly randomSeed: number;
}
export interface Move extends Point {
  readonly pieceId: string;
  readonly revision: number;
}
export type MoveRejection = 'game-over' | 'stale-move' | 'piece-unavailable' | 'invalid-placement';
export interface ClearedLines {
  readonly rows: readonly number[];
  readonly columns: readonly number[];
  readonly cells: readonly Point[];
}
export type MoveResult =
  | { readonly ok: false; readonly reason: MoveRejection; readonly state: GameState }
  | { readonly ok: true; readonly state: GameState; readonly cleared: ClearedLines;
      readonly points: number; readonly refilled: boolean };
