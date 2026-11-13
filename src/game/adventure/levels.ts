import { PIECE_COLORS } from '../../theme/colors';
import { createAdventureBoard } from './engine';
import type { AdventureBoard, LevelConfig, ObstacleData } from './types';

function createBoardWithObstacles(
  positions: readonly { readonly row: number; readonly col: number; readonly type: 'stone' | 'ice'; readonly hp: number }[],
): AdventureBoard {
  const board = createAdventureBoard();
  const next = board.map((row) => [...row]);
  for (const pos of positions) {
    const obstacle: ObstacleData = { kind: 'obstacle', type: pos.type, hp: pos.hp };
    const row = next[pos.row];
    if (row) row[pos.col] = obstacle;
  }
  return next;
}

export const ADVENTURE_LEVELS: readonly LevelConfig[] = [
  {
    id: 1,
    name: 'First Steps',
    moveLimit: 12,
    levelSeed: 101,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-1-1', type: 'line-target', target: 2 }],
    starThresholds: { minRemainingMoves2: 4, minRemainingMoves3: 7 },
  },
  {
    id: 2,
    name: 'Double Line',
    moveLimit: 15,
    levelSeed: 102,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-2-1', type: 'line-target', target: 4 }],
    starThresholds: { minRemainingMoves2: 5, minRemainingMoves3: 8 },
  },
  {
    id: 3,
    name: 'Point Collector',
    moveLimit: 16,
    levelSeed: 103,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-3-1', type: 'score-target', target: 400 }],
    starThresholds: { minRemainingMoves2: 5, minRemainingMoves3: 9 },
  },
  {
    id: 4,
    name: 'Amber Harvest',
    moveLimit: 18,
    levelSeed: 104,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-4-1', type: 'color-target', color: PIECE_COLORS.amber, target: 8 }],
    starThresholds: { minRemainingMoves2: 5, minRemainingMoves3: 9 },
  },
  {
    id: 5,
    name: 'Cyan Waters',
    moveLimit: 18,
    levelSeed: 105,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-5-1', type: 'color-target', color: PIECE_COLORS.cyan, target: 10 }],
    starThresholds: { minRemainingMoves2: 5, minRemainingMoves3: 9 },
  },
  {
    id: 6,
    name: 'Twin Challenge',
    moveLimit: 20,
    levelSeed: 106,
    initialBoard: createAdventureBoard(),
    objectives: [
      { id: 'obj-6-1', type: 'line-target', target: 4 },
      { id: 'obj-6-2', type: 'color-target', color: PIECE_COLORS.rose, target: 8 },
    ],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 10 },
  },
  {
    id: 7,
    name: 'High Scorer',
    moveLimit: 20,
    levelSeed: 107,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-7-1', type: 'score-target', target: 800 }],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 10 },
  },
  {
    id: 8,
    name: 'Violet Cascade',
    moveLimit: 22,
    levelSeed: 108,
    initialBoard: createAdventureBoard(),
    objectives: [{ id: 'obj-8-1', type: 'color-target', color: PIECE_COLORS.violet, target: 12 }],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 11 },
  },
  {
    id: 9,
    name: 'Stone Breaker',
    moveLimit: 20,
    levelSeed: 109,
    initialBoard: createBoardWithObstacles([
      { row: 3, col: 3, type: 'stone', hp: 1 },
      { row: 3, col: 4, type: 'stone', hp: 1 },
      { row: 4, col: 3, type: 'stone', hp: 1 },
      { row: 4, col: 4, type: 'stone', hp: 1 },
    ]),
    objectives: [{ id: 'obj-9-1', type: 'clear-obstacles', target: 4 }],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 10 },
  },
  {
    id: 10,
    name: 'The Quarry',
    moveLimit: 22,
    levelSeed: 110,
    initialBoard: createBoardWithObstacles([
      { row: 2, col: 2, type: 'stone', hp: 1 },
      { row: 2, col: 5, type: 'stone', hp: 1 },
      { row: 3, col: 3, type: 'stone', hp: 1 },
      { row: 3, col: 4, type: 'stone', hp: 1 },
      { row: 5, col: 2, type: 'stone', hp: 1 },
      { row: 5, col: 5, type: 'stone', hp: 1 },
    ]),
    objectives: [
      { id: 'obj-10-1', type: 'clear-obstacles', target: 6 },
      { id: 'obj-10-2', type: 'score-target', target: 600 },
    ],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 11 },
  },
  {
    id: 11,
    name: 'Ice Crystal',
    moveLimit: 22,
    levelSeed: 111,
    initialBoard: createBoardWithObstacles([
      { row: 3, col: 3, type: 'ice', hp: 2 },
      { row: 4, col: 4, type: 'ice', hp: 2 },
    ]),
    objectives: [{ id: 'obj-11-1', type: 'clear-obstacles', target: 2 }],
    starThresholds: { minRemainingMoves2: 6, minRemainingMoves3: 11 },
  },
  {
    id: 12,
    name: 'Frost Peak',
    moveLimit: 24,
    levelSeed: 112,
    initialBoard: createBoardWithObstacles([
      { row: 2, col: 3, type: 'ice', hp: 2 },
      { row: 2, col: 4, type: 'ice', hp: 2 },
      { row: 5, col: 3, type: 'ice', hp: 2 },
      { row: 5, col: 4, type: 'ice', hp: 2 },
    ]),
    objectives: [
      { id: 'obj-12-1', type: 'clear-obstacles', target: 4 },
      { id: 'obj-12-2', type: 'line-target', target: 6 },
    ],
    starThresholds: { minRemainingMoves2: 7, minRemainingMoves3: 12 },
  },
  {
    id: 13,
    name: 'Prism Harvest',
    moveLimit: 25,
    levelSeed: 113,
    initialBoard: createAdventureBoard(),
    objectives: [
      { id: 'obj-13-1', type: 'color-target', color: PIECE_COLORS.green, target: 10 },
      { id: 'obj-13-2', type: 'color-target', color: PIECE_COLORS.orange, target: 10 },
    ],
    starThresholds: { minRemainingMoves2: 7, minRemainingMoves3: 13 },
  },
  {
    id: 14,
    name: 'Fortress',
    moveLimit: 26,
    levelSeed: 114,
    initialBoard: createBoardWithObstacles([
      { row: 2, col: 2, type: 'stone', hp: 1 },
      { row: 2, col: 5, type: 'stone', hp: 1 },
      { row: 3, col: 3, type: 'ice', hp: 2 },
      { row: 3, col: 4, type: 'ice', hp: 2 },
      { row: 5, col: 2, type: 'stone', hp: 1 },
      { row: 5, col: 5, type: 'stone', hp: 1 },
    ]),
    objectives: [{ id: 'obj-14-1', type: 'clear-obstacles', target: 6 }],
    starThresholds: { minRemainingMoves2: 7, minRemainingMoves3: 13 },
  },
  {
    id: 15,
    name: 'Grand Master',
    moveLimit: 28,
    levelSeed: 115,
    initialBoard: createBoardWithObstacles([
      { row: 1, col: 1, type: 'ice', hp: 2 },
      { row: 1, col: 6, type: 'ice', hp: 2 },
      { row: 6, col: 1, type: 'ice', hp: 2 },
      { row: 6, col: 6, type: 'ice', hp: 2 },
    ]),
    objectives: [
      { id: 'obj-15-1', type: 'clear-obstacles', target: 4 },
      { id: 'obj-15-2', type: 'score-target', target: 1200 },
    ],
    starThresholds: { minRemainingMoves2: 8, minRemainingMoves3: 14 },
  },
];

export function getLevelConfig(id: number): LevelConfig {
  const level = ADVENTURE_LEVELS.find((cand) => cand.id === id);
  if (!level) throw new Error(`Level with id ${id} not found`);
  return level;
}
