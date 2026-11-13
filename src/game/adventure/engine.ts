import { SHAPES } from '../shapes';
import { calculateScore } from '../scoring';
import { BOARD_SIZE, TRAY_SIZE } from '../types';
import type { Piece, Point, Shape } from '../types';
import { normalizeSeed, seededRandom } from '../random';
import type { RandomSource } from '../random';
import type {
  AdventureBoard, AdventureCell, AdventureClearedLines, AdventureMove,
  AdventureMoveResult, AdventureState, LevelConfig, LevelObjective, ObstacleData,
} from './types';

export function createAdventureBoard(): AdventureBoard {
  return Array.from({ length: BOARD_SIZE }, () => Array<AdventureCell>(BOARD_SIZE).fill(null));
}

function isObstacle(cell: AdventureCell): cell is ObstacleData {
  return cell !== null && typeof cell !== 'string';
}

export function canPlaceAdventure(board: AdventureBoard, shape: Shape, row: number, col: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || shape.cells.length === 0) return false;
  return shape.cells.every((cell) => {
    const targetRow = row + cell.row;
    const targetCol = col + cell.col;
    return targetRow >= 0 && targetRow < BOARD_SIZE
      && targetCol >= 0 && targetCol < BOARD_SIZE
      && board[targetRow]?.[targetCol] === null;
  });
}

export function hasAvailableAdventureMove(
  board: AdventureBoard,
  pieces: readonly (Piece | null)[],
): boolean {
  return pieces.some((piece) => {
    if (!piece) return false;
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (canPlaceAdventure(board, piece.shape, row, col)) return true;
      }
    }
    return false;
  });
}

export function clearAdventureLines(board: AdventureBoard): {
  readonly board: AdventureBoard;
  readonly cleared: AdventureClearedLines;
  readonly destroyedObstacles: number;
} {
  const indexes = Array.from({ length: BOARD_SIZE }, (_, index) => index);
  const occupied = (row: number, col: number) => board[row]?.[col] != null;
  const rows = indexes.filter((row) => indexes.every((col) => occupied(row, col)));
  const columns = indexes.filter((col) => indexes.every((row) => occupied(row, col)));
  const clearedCells: Point[] = [];
  const damagedCells: Point[] = [];
  let destroyedObstacles = 0;
  const next = board.map((line) => [...line]);

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const damage = Number(rows.includes(row)) + Number(columns.includes(col));
      if (damage === 0) continue;
      const cell = board[row]?.[col];
      if (cell == null) continue;
      if (isObstacle(cell)) {
        damagedCells.push({ row, col });
        const remainingHp = cell.hp - damage;
        if (remainingHp <= 0) {
          const nextRow = next[row];
          if (!nextRow) throw new Error('Adventure board invariant violated');
          nextRow[col] = null;
          clearedCells.push({ row, col });
          destroyedObstacles += 1;
        } else {
          const nextRow = next[row];
          if (!nextRow) throw new Error('Adventure board invariant violated');
          nextRow[col] = { ...cell, hp: remainingHp };
        }
      } else {
        const nextRow = next[row];
        if (!nextRow) throw new Error('Adventure board invariant violated');
        nextRow[col] = null;
        clearedCells.push({ row, col });
      }
    }
  }

  return {
    board: next,
    cleared: { rows, columns, cells: clearedCells, obstacleDamage: damagedCells },
    destroyedObstacles,
  };
}

function validateLevel(level: LevelConfig): void {
  if (!Number.isSafeInteger(level.id) || level.id < 1) throw new Error('Level id must be a positive safe integer');
  if (!level.name.trim()) throw new Error('Level name must not be empty');
  if (!Number.isSafeInteger(level.moveLimit) || level.moveLimit < 1) throw new Error('Move limit must be positive');
  normalizeSeed(level.levelSeed);
  if (level.initialBoard.length !== BOARD_SIZE || level.initialBoard.some((row) => row.length !== BOARD_SIZE)) {
    throw new Error(`Initial board must be ${BOARD_SIZE} by ${BOARD_SIZE}`);
  }
  for (const cell of level.initialBoard.flat()) {
    if (isObstacle(cell) && ((cell.type === 'stone' && cell.hp !== 1)
      || (cell.type === 'ice' && cell.hp !== 2)
      || !Number.isSafeInteger(cell.hp) || cell.hp < 1)) {
      throw new Error('Obstacle HP does not match its type');
    }
  }
  if (level.objectives.length === 0 || new Set(level.objectives.map(({ id }) => id)).size !== level.objectives.length
    || level.objectives.some((objective) => !objective.id.trim() || !Number.isSafeInteger(objective.target) || objective.target < 1)) {
    throw new Error('Level objectives must have unique ids and positive integer targets');
  }
  const { minRemainingMoves2, minRemainingMoves3 } = level.starThresholds;
  if (!(Number.isSafeInteger(minRemainingMoves2) && Number.isSafeInteger(minRemainingMoves3)
    && 0 < minRemainingMoves2 && minRemainingMoves2 < minRemainingMoves3
    && minRemainingMoves3 <= level.moveLimit)) {
    throw new Error('Star thresholds must satisfy 0 < two-star < three-star <= move limit');
  }
  if (level.fixedInitialPieces && (level.fixedInitialPieces.length !== TRAY_SIZE
    || level.fixedInitialPieces.some((shapeId) => !SHAPES.some((shape) => shape.id === shapeId)))) {
    throw new Error(`Fixed initial tray must contain ${TRAY_SIZE} known shape ids`);
  }
}

function dealPieces(seed: number, firstId: number, random: RandomSource): {
  readonly pieces: readonly Piece[];
  readonly randomSeed: number;
  readonly nextPieceId: number;
} {
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
    pieces.push({ id: `adventure-piece-${firstId + index}`, shape });
  }
  return { pieces, randomSeed: currentSeed, nextPieceId: firstId + TRAY_SIZE };
}

function starsFor(level: LevelConfig, movesRemaining: number): 1 | 2 | 3 {
  if (movesRemaining >= level.starThresholds.minRemainingMoves3) return 3;
  if (movesRemaining >= level.starThresholds.minRemainingMoves2) return 2;
  return 1;
}

function objectivesMet(level: LevelConfig, progress: Readonly<Record<string, number>>): boolean {
  return level.objectives.every((objective) => (progress[objective.id] ?? 0) >= objective.target);
}

function addProgress(
  objectives: readonly LevelObjective[],
  previous: Readonly<Record<string, number>>,
  score: number,
  lines: number,
  placedBoard: AdventureBoard,
  cleared: AdventureClearedLines,
  destroyedObstacles: number,
): Readonly<Record<string, number>> {
  const coloredCounts = new Map<string, number>();
  for (const { row, col } of cleared.cells) {
    const cell = placedBoard[row]?.[col];
    if (typeof cell === 'string') coloredCounts.set(cell, (coloredCounts.get(cell) ?? 0) + 1);
  }
  return Object.fromEntries(objectives.map((objective) => {
    const prior = previous[objective.id] ?? 0;
    let value = prior;
    if (objective.type === 'score-target') value = score;
    if (objective.type === 'line-target') value += lines;
    if (objective.type === 'color-target') value += coloredCounts.get(objective.color) ?? 0;
    if (objective.type === 'clear-obstacles') value += destroyedObstacles;
    return [objective.id, Math.min(objective.target, value)];
  }));
}

export function createAdventureGame(
  level: LevelConfig,
  sessionSeed?: number,
  random: RandomSource = seededRandom,
): AdventureState {
  validateLevel(level);
  const seed = normalizeSeed(sessionSeed ?? level.levelSeed);
  const opening = level.fixedInitialPieces
    ? {
        pieces: level.fixedInitialPieces.map((shapeId, index) => {
          const shape = SHAPES.find((candidate) => candidate.id === shapeId);
          if (!shape) throw new Error('Fixed piece shape is missing from catalogue');
          return { id: `adventure-piece-${index}`, shape };
        }),
        randomSeed: seed,
        nextPieceId: TRAY_SIZE,
      }
    : dealPieces(seed, 0, random);
  return {
    level,
    board: level.initialBoard.map((row) => [...row]),
    ...opening,
    score: 0,
    movesRemaining: level.moveLimit,
    objectiveProgress: Object.fromEntries(level.objectives.map(({ id }) => [id, 0])),
    status: 'playing',
    starsEarned: 0,
    revision: 0,
  };
}

export function applyAdventureMove(
  state: AdventureState,
  move: AdventureMove,
  random: RandomSource = seededRandom,
): AdventureMoveResult {
  if (move.revision !== state.revision) return { ok: false, reason: 'stale-move', state };
  if (state.status !== 'playing') return { ok: false, reason: 'game-over', state };
  const piece = state.pieces.find((candidate) => candidate?.id === move.pieceId);
  if (!piece) return { ok: false, reason: 'piece-unavailable', state };
  if (!canPlaceAdventure(state.board, piece.shape, move.row, move.col)) {
    return { ok: false, reason: 'invalid-placement', state };
  }

  const placedBoard = state.board.map((row) => [...row]);
  for (const cell of piece.shape.cells) {
    const row = placedBoard[move.row + cell.row];
    if (!row) throw new Error('Adventure board invariant violated');
    row[move.col + cell.col] = piece.shape.color;
  }
  const { board, cleared, destroyedObstacles } = clearAdventureLines(placedBoard);
  const lineCount = cleared.rows.length + cleared.columns.length;
  const { points } = calculateScore(piece.shape.cells.length, lineCount, 0);
  const score = state.score + points;
  const movesRemaining = state.movesRemaining - 1;
  const objectiveProgress = addProgress(state.level.objectives, state.objectiveProgress,
    score, lineCount, placedBoard, cleared, destroyedObstacles);
  const piecesAfterPlacement = state.pieces.map((candidate) => candidate?.id === piece.id ? null : candidate);

  // Completing the objective wins immediately and does not deal an unnecessary tray.
  if (objectivesMet(state.level, objectiveProgress)) {
    const starsEarned = starsFor(state.level, movesRemaining);
    return {
      ok: true,
      points,
      cleared,
      destroyedObstacles,
      refilled: false,
      state: {
        ...state, board, pieces: piecesAfterPlacement, score, movesRemaining,
        objectiveProgress, status: 'won', starsEarned, revision: state.revision + 1,
      },
    };
  }

  const shouldRefill = piecesAfterPlacement.every((candidate) => candidate === null);
  const refill = shouldRefill
    ? dealPieces(state.randomSeed, state.nextPieceId, random)
    : { pieces: piecesAfterPlacement, randomSeed: state.randomSeed, nextPieceId: state.nextPieceId };
  const lossReason = movesRemaining <= 0 ? 'moves-exhausted'
    : !hasAvailableAdventureMove(board, refill.pieces) ? 'board-jammed' : undefined;
  return {
    ok: true,
    points,
    cleared,
    destroyedObstacles,
    refilled: shouldRefill,
    state: {
      ...state,
      board,
      pieces: refill.pieces,
      randomSeed: refill.randomSeed,
      nextPieceId: refill.nextPieceId,
      score,
      movesRemaining,
      objectiveProgress,
      status: lossReason ? 'lost' : 'playing',
      ...(lossReason ? { lossReason } : {}),
      starsEarned: 0,
      revision: state.revision + 1,
    },
  };
}
