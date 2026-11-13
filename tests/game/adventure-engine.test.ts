import { describe, expect, it } from 'vitest';
import {
  applyAdventureMove, canPlaceAdventure, clearAdventureLines, createAdventureBoard,
  createAdventureGame,
} from '../../src/game/adventure/engine';
import type { AdventureBoard, AdventureMoveResult, LevelConfig, ObstacleData } from '../../src/game/adventure/types';
import type { RandomSource } from '../../src/game/random';
import { SHAPES } from '../../src/game/shapes';
import { BOARD_SIZE } from '../../src/game/types';

const single = SHAPES.find((shape) => shape.id === 'single');
if (!single) throw new Error('Missing single-cell test shape');

const deterministicSingles: RandomSource = (seed) => ({ value: 0, seed: (seed + 1) >>> 0 });

function makeBoard(fill: (row: number, col: number) => string | ObstacleData | null): AdventureBoard {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => fill(row, col)));
}

function level(overrides: Partial<LevelConfig> = {}): LevelConfig {
  return {
    id: 1,
    name: 'Test level',
    moveLimit: 5,
    levelSeed: 42,
    initialBoard: createAdventureBoard(),
    fixedInitialPieces: ['single', 'single', 'single'],
    objectives: [{ id: 'lines', type: 'line-target', target: 10 }],
    starThresholds: { minRemainingMoves2: 1, minRemainingMoves3: 3 },
    ...overrides,
  };
}

function play(
  state: ReturnType<typeof createAdventureGame>,
  row: number,
  col: number,
  random: RandomSource = deterministicSingles,
): AdventureMoveResult {
  const piece = state.pieces.find((candidate) => candidate !== null);
  if (!piece) throw new Error('Test state has no available piece');
  return applyAdventureMove(state, { pieceId: piece.id, revision: state.revision, row, col }, random);
}

function accepted(result: AdventureMoveResult) {
  if (!result.ok) throw new Error(`Unexpected rejected move: ${result.reason}`);
  return result;
}

describe('Adventure placement and line clearing', () => {
  it('treats obstacles as occupied and counts them toward completed lines', () => {
    const board = makeBoard((row, col) => row === 0 && (col === 0 || col === 1)
      ? { kind: 'obstacle', type: 'ice', hp: 2 }
      : null);
    expect(canPlaceAdventure(board, single, 0, 0)).toBe(false);
    const almostFull = makeBoard((row, col) => row === 0 && col !== 0
      ? (col === 3 ? { kind: 'obstacle', type: 'stone', hp: 1 } : '#cyan')
      : null);
    const next = [...almostFull.map((cells) => [...cells])];
    const firstRow = next[0];
    if (!firstRow) throw new Error('Missing first test row');
    firstRow[0] = '#amber';
    const result = clearAdventureLines(next);
    expect(result.cleared.rows).toEqual([0]);
    expect(result.destroyedObstacles).toBe(1);
    expect(result.board[0]?.[3]).toBeNull();
  });

  it('clears colored cells while retaining surviving ice with reduced HP', () => {
    const board = makeBoard((row, col) => row === 0
      ? (col === 3 ? { kind: 'obstacle', type: 'ice', hp: 2 } : '#cyan')
      : null);
    const result = clearAdventureLines(board);
    expect(result.cleared.rows).toEqual([0]);
    expect(result.cleared.cells).toHaveLength(7);
    expect(result.cleared.obstacleDamage).toEqual([{ row: 0, col: 3 }]);
    expect(result.destroyedObstacles).toBe(0);
    expect(result.board[0]?.[3]).toEqual({ kind: 'obstacle', type: 'ice', hp: 1 });
    expect(result.board[0]?.[2]).toBeNull();
  });

  it('deals two damage to an obstacle at a row and column intersection', () => {
    const board = makeBoard((row, col) => {
      if (row === 0 && col === 0) return null;
      if (row === 0 && col === 1) return { kind: 'obstacle', type: 'ice', hp: 2 };
      if (row === 0 || col === 0 || col === 1) return '#cyan';
      return null;
    });
    const completed = board.map((line) => [...line]);
    const firstRow = completed[0];
    if (!firstRow) throw new Error('Missing first test row');
    firstRow[0] = '#amber';
    const result = clearAdventureLines(completed);
    expect(result.cleared.rows).toEqual([0]);
    expect(result.cleared.columns).toEqual([0, 1]);
    expect(result.board[0]?.[1]).toBeNull();
    expect(result.destroyedObstacles).toBe(1);
    expect(result.cleared.cells).toHaveLength(22);
  });
});

describe('Adventure move transitions and objectives', () => {
  it('credits score, line, color, and destroyed-obstacle objectives together', () => {
    const board = makeBoard((row, col) => row === 0 && col > 0
      ? (col === 3 ? { kind: 'obstacle', type: 'stone', hp: 1 } : '#cyan')
      : null);
    const config = level({
      initialBoard: board,
      objectives: [
        { id: 'score', type: 'score-target', target: 11 },
        { id: 'lines', type: 'line-target', target: 1 },
        { id: 'cyan', type: 'color-target', color: '#cyan', target: 6 },
        { id: 'obstacles', type: 'clear-obstacles', target: 1 },
      ],
    });
    const state = createAdventureGame(config, undefined, deterministicSingles);
    const result = accepted(play(state, 0, 0));
    expect(result.state.objectiveProgress).toEqual({ score: 11, lines: 1, cyan: 6, obstacles: 1 });
    expect(result.state.status).toBe('won');
    expect(result.state.starsEarned).toBe(3);
  });

  it('wins on the last move without refilling the tray', () => {
    const validConfig = level({
      moveLimit: 2,
      objectives: [{ id: 'score', type: 'score-target', target: 1 }],
      starThresholds: { minRemainingMoves2: 1, minRemainingMoves3: 2 },
    });
    const state = createAdventureGame(validConfig, undefined, deterministicSingles);
    const random: RandomSource = () => { throw new Error('A winning move must not refill'); };
    const result = accepted(play(state, 0, 0, random));
    expect(result.state.status).toBe('won');
    expect(result.state.movesRemaining).toBe(1);
    expect(result.state.starsEarned).toBe(2);
    expect(result.refilled).toBe(false);
    expect(result.state.pieces.filter(Boolean)).toHaveLength(2);
  });

  it('loses when moves run out before the objectives are met', () => {
    const validConfig = level({
      moveLimit: 3,
      objectives: [{ id: 'score', type: 'score-target', target: 100 }],
      starThresholds: { minRemainingMoves2: 1, minRemainingMoves3: 3 },
    });
    const state = createAdventureGame(validConfig);
    const almostOut = { ...state, movesRemaining: 2 };
    const result = accepted(play(almostOut, 0, 0));
    expect(result.state.status).toBe('playing');
    const finalMove = accepted(play(result.state, 0, 1));
    expect(finalMove.state.status).toBe('lost');
    expect(finalMove.state.lossReason).toBe('moves-exhausted');
  });

  it('detects a jam after placement while another unusable piece remains', () => {
    const checkerboard = makeBoard((row, col) => (row + col) % 2 === 1 ? '#stone' : null);
    const config = level({
      initialBoard: checkerboard,
      fixedInitialPieces: ['single', 'square-2', 'single'],
      objectives: [{ id: 'score', type: 'score-target', target: 100 }],
    });
    const state = createAdventureGame(config);
    const pieces = [...state.pieces];
    const square = pieces[1];
    if (!square || !pieces[0]) throw new Error('Missing test piece');
    pieces[2] = null;
    const prepared = { ...state, pieces };
    const result = accepted(play(prepared, 0, 0));
    expect(result.state.status).toBe('lost');
    expect(result.state.lossReason).toBe('board-jammed');
  });

  it('refills deterministically only after the full tray is consumed', () => {
    const state = createAdventureGame(level(), 99, deterministicSingles);
    const first = accepted(play(state, 0, 0));
    const second = accepted(play(first.state, 0, 1));
    expect(second.refilled).toBe(false);
    const third = accepted(play(second.state, 0, 2));
    expect(third.refilled).toBe(true);
    expect(third.state.pieces).toHaveLength(3);
    expect(third.state.pieces.every((piece) => piece?.shape.id === 'single')).toBe(true);
    const repeatedFirst = accepted(play(createAdventureGame(level(), 99, deterministicSingles), 0, 0));
    const repeatedSecond = accepted(play(repeatedFirst.state, 0, 1));
    const repeatedThird = accepted(play(repeatedSecond.state, 0, 2));
    expect(third.state).toEqual(repeatedThird.state);
  });

  it('uses the session seed override and leaves source state unchanged', () => {
    const config = level();
    const { fixedInitialPieces, ...generatedConfig } = config;
    void fixedInitialPieces;
    const first = createAdventureGame(generatedConfig, 7);
    const repeated = createAdventureGame(generatedConfig, 7);
    const different = createAdventureGame(generatedConfig, 8);
    expect(first).toEqual(repeated);
    expect(first.randomSeed).not.toBe(different.randomSeed);
    const before = JSON.stringify(first);
    const result = accepted(play(first, 0, 0));
    expect(JSON.stringify(first)).toBe(before);
    expect(result.state.board).not.toBe(first.board);
  });

  it('rejects malformed level thresholds and obstacle HP', () => {
    expect(() => createAdventureGame(level({
      starThresholds: { minRemainingMoves2: 3, minRemainingMoves3: 2 },
    }))).toThrow();
    expect(() => createAdventureGame(level({
      initialBoard: makeBoard((row, col) => row === 0 && col === 0
        ? { kind: 'obstacle', type: 'ice', hp: 1 }
        : null),
    }))).toThrow();
  });
});
