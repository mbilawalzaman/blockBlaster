import { generateTray, normalizeSeed, seededRandom } from './random';
import type { RandomSource } from './random';
import { calculateScore } from './scoring';
import { BOARD_SIZE } from './types';
import type { Board, Cell, ClearedLines, GameState, Move, MoveResult, Piece, Shape } from './types';

export function createBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null));
}

export function canPlace(board: Board, shape: Shape, row: number, col: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || shape.cells.length === 0) return false;
  return shape.cells.every((cell) => {
    const r = row + cell.row;
    const c = col + cell.col;
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r]?.[c] === null;
  });
}

export function placeShape(board: Board, shape: Shape, row: number, col: number): Board {
  if (!canPlace(board, shape, row, col)) throw new Error('Cannot place shape at invalid coordinates');
  const next = board.map((line) => [...line]);
  for (const cell of shape.cells) {
    const line = next[row + cell.row];
    if (!line) throw new Error('Board invariant violated');
    line[col + cell.col] = shape.color;
  }
  return next;
}

export function clearLines(board: Board): { board: Board; cleared: ClearedLines } {
  const indexes = Array.from({ length: BOARD_SIZE }, (_, index) => index);
  const occupied = (r: number, c: number) => typeof board[r]?.[c] === 'string';
  const rows = indexes.filter((r) => indexes.every((c) => occupied(r, c)));
  const columns = indexes.filter((c) => indexes.every((r) => occupied(r, c)));
  const cells = indexes.flatMap((row) => indexes.flatMap((col) =>
    rows.includes(row) || columns.includes(col) ? [{ row, col }] : []));
  return {
    board: board.map((line, r) => line.map((cell, c) =>
      rows.includes(r) || columns.includes(c) ? null : cell)),
    cleared: { rows, columns, cells },
  };
}

export function hasAvailableMove(board: Board, pieces: readonly (Piece | null)[]): boolean {
  return pieces.some((piece) => {
    if (!piece) return false;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (canPlace(board, piece.shape, row, col)) return true;
      }
    }
    return false;
  });
}

export function createGame(seed: number, bestScore = 0, random: RandomSource = seededRandom): GameState {
  if (!Number.isSafeInteger(bestScore) || bestScore < 0) throw new Error('Invalid best score');
  return {
    board: createBoard(), ...generateTray(normalizeSeed(seed), 0, random),
    score: 0, bestScore, combo: 0, gameOver: false, revision: 0,
  };
}

/** Keeps revision and piece IDs increasing so pre-restart gestures cannot commit. */
export function restartGame(state: GameState, seed: number, random: RandomSource = seededRandom): GameState {
  return {
    board: createBoard(),
    ...generateTray(seed, state.nextPieceId, random),
    score: 0,
    bestScore: Math.max(state.bestScore, state.score),
    combo: 0,
    gameOver: false,
    revision: state.revision + 1,
  };
}

export function applyMove(state: GameState, move: Move, random: RandomSource = seededRandom): MoveResult {
  if (move.revision !== state.revision) return { ok: false, reason: 'stale-move', state };
  if (state.gameOver) return { ok: false, reason: 'game-over', state };
  const piece = state.pieces.find((candidate) => candidate?.id === move.pieceId);
  if (!piece) return { ok: false, reason: 'piece-unavailable', state };
  if (!canPlace(state.board, piece.shape, move.row, move.col)) {
    return { ok: false, reason: 'invalid-placement', state };
  }
  const { board, cleared } = clearLines(placeShape(state.board, piece.shape, move.row, move.col));
  const { points, combo } = calculateScore(piece.shape.cells.length,
    cleared.rows.length + cleared.columns.length, state.combo);
  const remaining = state.pieces.map((candidate) => candidate?.id === piece.id ? null : candidate);
  const refilled = remaining.every((candidate) => candidate === null);
  const tray = refilled ? generateTray(state.randomSeed, state.nextPieceId, random) : {
    pieces: remaining, randomSeed: state.randomSeed, nextPieceId: state.nextPieceId,
  };
  const score = state.score + points;
  return {
    ok: true, points, cleared, refilled,
    state: { ...state, ...tray, board, score, combo,
      bestScore: Math.max(state.bestScore, score), revision: state.revision + 1,
      gameOver: !hasAvailableMove(board, tray.pieces) },
  };
}
