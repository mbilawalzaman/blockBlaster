import { describe, expect, it } from 'vitest';
import { applyMove, canPlace, clearLines, createBoard, createGame, hasAvailableMove,
  placeShape, restartGame } from '../../src/game/engine';
import { generateTray, seededRandom } from '../../src/game/random';
import type { RandomSource } from '../../src/game/random';
import { calculateScore } from '../../src/game/scoring';
import { SHAPES } from '../../src/game/shapes';
import { BOARD_SIZE } from '../../src/game/types';
import type { Board, GameState, MoveResult, Piece, Shape } from '../../src/game/types';

function getShape(id: string): Shape {
  const shape = SHAPES.find((entry) => entry.id === id);
  if (!shape) throw new Error(`Missing test shape: ${id}`);
  return shape;
}
const single = getShape('single');
const square = getShape('square-2');
const piece: Piece = { id: 'test-piece', shape: single };
const alwaysSingle: RandomSource = (seed) => ({ value: 0, seed });
const alwaysSquare: RandomSource = (seed) => ({ value: SHAPES.indexOf(square) / SHAPES.length, seed });
function boardWith(isFilled: (row: number, col: number) => boolean): Board {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => isFilled(row, col) ? '#abc' : null));
}
function fixture(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(123), pieces: [piece, null, null], ...overrides };
}
function play(state: GameState, row = 0, col = 0): MoveResult {
  return applyMove(state, { pieceId: piece.id, revision: state.revision, row, col }, alwaysSingle);
}
function accepted(result: MoveResult) {
  if (!result.ok) throw new Error(`Unexpected rejection: ${result.reason}`);
  return result;
}
function freezeState(state: GameState): GameState {
  state.board.forEach(Object.freeze);
  Object.freeze(state.board);
  state.pieces.forEach((entry) => { if (entry) Object.freeze(entry); });
  Object.freeze(state.pieces);
  return Object.freeze(state);
}

describe('board and placement', () => {
  it('creates 64 empty cells and independent rows', () => {
    const board = createBoard();
    expect(board).toHaveLength(8);
    expect(board.flat()).toEqual(Array(64).fill(null));
    expect(board[0]).not.toBe(board[1]);
  });
  it.each([[-1, 0], [0, -1], [8, 0], [0, 8], [0.5, 0], [NaN, 0], [Infinity, 0]])(
    'rejects invalid anchor (%s, %s)', (row, col) => {
      expect(canPlace(createBoard(), single, row, col)).toBe(false);
    });
  it('checks the full shape at edges and occupied cells', () => {
    expect(canPlace(createBoard(), square, 6, 6)).toBe(true);
    expect(canPlace(createBoard(), square, 7, 7)).toBe(false);
    expect(canPlace(boardWith((r, c) => r === 1 && c === 1), square, 0, 0)).toBe(false);
  });
  it('places all cells without changing input or sharing mutable rows', () => {
    const board = createBoard();
    board.forEach(Object.freeze);
    Object.freeze(board);
    const next = placeShape(board, square, 6, 6);
    expect(next.flat().filter(Boolean)).toHaveLength(4);
    expect(next[7]?.[7]).toBe(square.color);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
    expect(next[0]).not.toBe(board[0]);
    expect(() => placeShape(board, square, 7, 7)).toThrow();
  });
  it('keeps the catalogue normalized, unique, in bounds, and immutable', () => {
    expect(new Set(SHAPES.map((shape) => shape.id)).size).toBe(SHAPES.length);
    for (const shape of SHAPES) {
      expect(shape.cells.length).toBeGreaterThan(0);
      expect(Math.min(...shape.cells.map((cell) => cell.row))).toBe(0);
      expect(Math.min(...shape.cells.map((cell) => cell.col))).toBe(0);
      expect(new Set(shape.cells.map((cell) => `${cell.row}:${cell.col}`)).size).toBe(shape.cells.length);
      expect(shape.cells.every(({ row, col }) => row >= 0 && col >= 0 && row < 8 && col < 8)).toBe(true);
      expect(Object.isFrozen(shape)).toBe(true);
      expect(Object.isFrozen(shape.cells)).toBe(true);
    }
  });
});

describe('simultaneous clearing', () => {
  it('clears a full row and preserves unrelated cells', () => {
    const source = boardWith((r, c) => r === 3 || (r === 6 && c === 2));
    const { board, cleared } = clearLines(source);
    expect(cleared.rows).toEqual([3]);
    expect(cleared.columns).toEqual([]);
    expect(cleared.cells).toHaveLength(8);
    expect(board[6]?.[2]).toBe('#abc');
    expect(source[3]?.[0]).toBe('#abc');
  });
  it('clears a full column', () => {
    const { board, cleared } = clearLines(boardWith((_, c) => c === 4));
    expect(cleared.columns).toEqual([4]);
    expect(cleared.rows).toEqual([]);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });
  it('detects two rows and two columns together and counts each intersection once', () => {
    const { board, cleared } = clearLines(boardWith((r, c) => r < 2 || c < 2));
    expect(cleared.rows).toEqual([0, 1]);
    expect(cleared.columns).toEqual([0, 1]);
    expect(cleared.cells).toHaveLength(28);
    expect(new Set(cleared.cells.map(({ row, col }) => `${row}:${col}`)).size).toBe(28);
    expect(board.flat().every((cell) => cell === null)).toBe(true);
  });
  it('leaves incomplete lines alone', () => {
    const source = boardWith((r, c) => r === 0 && c < 7);
    expect(clearLines(source)).toEqual({ board: source, cleared: { rows: [], columns: [], cells: [] } });
  });
});

describe('scoring and generation', () => {
  it('awards placement points, line bonuses, and consecutive-clear multipliers', () => {
    expect(calculateScore(4, 0, 3)).toEqual({ points: 4, combo: 0 });
    expect(calculateScore(4, 2, 0)).toEqual({ points: 24, combo: 1 });
    expect(calculateScore(1, 2, 1)).toEqual({ points: 41, combo: 2 });
  });
  it('is deterministic and uses unique instance IDs even for duplicate shapes', () => {
    expect(createGame(42)).toEqual(createGame(42));
    expect(seededRandom(42)).toEqual(seededRandom(42));
    const tray = generateTray(42, 12, alwaysSingle);
    expect(tray.pieces.map((entry) => entry.id)).toEqual(['piece-12', 'piece-13', 'piece-14']);
    expect(tray.pieces.every((entry) => entry.shape === single)).toBe(true);
    expect(generateTray(42, 0, (seed) => ({ value: 1 - Number.EPSILON, seed })).pieces[0]?.shape)
      .toBe(SHAPES.at(-1));
  });
  it.each([NaN, -0.1, 1, Infinity])('rejects invalid random samples: %s', (value) => {
    expect(() => generateTray(1, 0, (seed) => ({ value, seed }))).toThrow();
  });
  it('rejects invalid initialization values', () => {
    expect(() => createGame(NaN)).toThrow();
    expect(() => createGame(1, -1)).toThrow();
    expect(() => createGame(1, 1.5)).toThrow();
  });
});

describe('move transitions', () => {
  it('consumes only the placed piece and leaves input deeply unchanged', () => {
    const state = freezeState(fixture({ pieces: [piece, { id: 'other', shape: square }, null], combo: 2 }));
    const before = JSON.stringify(state);
    const result = accepted(play(state));
    expect(result.state.pieces).toEqual([null, { id: 'other', shape: square }, null]);
    expect(result.state.score).toBe(1);
    expect(result.state.combo).toBe(0);
    expect(result.state.revision).toBe(1);
    expect(result.refilled).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('clears intersecting lines, applies combos, and updates best score atomically', () => {
    const state = fixture({ board: boardWith((r, c) => (r === 0 || c === 0) && !(r === 0 && c === 0)),
      score: 100, bestScore: 110, combo: 1 });
    const result = accepted(play(state));
    expect(result.cleared.cells).toHaveLength(15);
    expect(result.points).toBe(41);
    expect(result.state.score).toBe(141);
    expect(result.state.bestScore).toBe(141);
    expect(result.state.combo).toBe(2);
    expect(result.state.board.flat().every((cell) => cell === null)).toBe(true);
  });
  it('preserves a higher best score and refills only when all slots are consumed', () => {
    const result = accepted(play(fixture({ bestScore: 500 })));
    expect(result.refilled).toBe(true);
    expect(result.state.pieces).toHaveLength(3);
    expect(result.state.pieces.every(Boolean)).toBe(true);
    expect(result.state.bestScore).toBe(500);
    expect(result.state.gameOver).toBe(false);
  });
  it('rejects invalid moves without consuming randomness or modifying state', () => {
    const state = fixture({ board: boardWith((r, c) => r === 0 && c === 0), combo: 4 });
    const result = applyMove(state, { pieceId: piece.id, revision: 0, row: 0, col: 0 },
      () => { throw new Error('Must not draw'); });
    expect(result).toEqual({ ok: false, reason: 'invalid-placement', state });
    expect(result.state).toBe(state);
  });
  it('rejects game-over moves and missing or already-consumed pieces', () => {
    expect(play(fixture({ gameOver: true }))).toMatchObject({ ok: false, reason: 'game-over' });
    expect(play(fixture({ pieces: [null, null, null] }))).toMatchObject({ ok: false, reason: 'piece-unavailable' });
  });
  it('rejects stale moves and repeated transitions are deterministic', () => {
    const state = fixture();
    const first = play(state);
    expect(play(state)).toEqual(first);
    expect(applyMove(accepted(first).state, { pieceId: piece.id, revision: 0, row: 1, col: 1 }))
      .toMatchObject({ ok: false, reason: 'stale-move' });
  });
  it('restarts while preserving best score and rejecting pre-restart gestures', () => {
    const state = fixture({ score: 300, bestScore: 300, combo: 4, gameOver: true });
    const next = restartGame(state, 99);
    expect(next.score).toBe(0);
    expect(next.bestScore).toBe(300);
    expect(next.combo).toBe(0);
    expect(next.gameOver).toBe(false);
    expect(next.board.flat().every((cell) => cell === null)).toBe(true);
    expect(next.pieces.every((entry) => entry && !state.pieces.some((old) => old?.id === entry.id))).toBe(true);
    expect(applyMove(next, { pieceId: piece.id, revision: state.revision, row: 0, col: 0 }))
      .toMatchObject({ ok: false, reason: 'stale-move' });
  });
});

describe('available moves and game over', () => {
  const isolatedHoles = boardWith((r, c) => (r + c) % 2 !== 0);
  it('keeps playing if any remaining piece fits, regardless of other pieces', () => {
    expect(hasAvailableMove(isolatedHoles, [{ id: 'square', shape: square }, piece, null])).toBe(true);
    const result = accepted(play(fixture({ board: isolatedHoles,
      pieces: [piece, { id: 'large', shape: square }, { id: 'small', shape: single }] })));
    expect(result.state.gameOver).toBe(false);
  });
  it('ends when no remaining piece fits even though empty cells remain', () => {
    expect(hasAvailableMove(isolatedHoles, [{ id: 'square', shape: square }, null, null])).toBe(false);
    const result = accepted(play(fixture({ board: isolatedHoles,
      pieces: [piece, { id: 'large', shape: square }, null] })));
    expect(result.state.gameOver).toBe(true);
  });
  it('checks the newly generated tray instead of the consumed tray', () => {
    const state = fixture({ board: isolatedHoles });
    const result = accepted(applyMove(state, { pieceId: piece.id, revision: 0, row: 0, col: 0 }, alwaysSquare));
    expect(result.refilled).toBe(true);
    expect(result.state.gameOver).toBe(true);
  });
  it('checks after clearing, allowing a formerly blocked remaining piece', () => {
    const source = boardWith((r, c) => !(r === 0 && c === 0) && !(r === 1 && c < 2));
    const result = accepted(play(fixture({ board: source, pieces: [piece, { id: 'large', shape: square }, null] })));
    expect(result.cleared.rows.length).toBeGreaterThan(0);
    expect(result.state.gameOver).toBe(false);
  });
  it('returns false for an empty tray', () => {
    expect(hasAvailableMove(createBoard(), [null, null, null])).toBe(false);
  });
});
