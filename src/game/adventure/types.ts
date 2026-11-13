import type { Piece, Point } from '../types';

export type ObstacleType = 'stone' | 'ice';

export interface ObstacleData {
  readonly kind: 'obstacle';
  readonly type: ObstacleType;
  readonly hp: number;
}

export type AdventureCell = string | ObstacleData | null;
export type AdventureBoard = readonly (readonly AdventureCell[])[];

export type LevelObjective =
  | { readonly id: string; readonly type: 'score-target'; readonly target: number }
  | { readonly id: string; readonly type: 'line-target'; readonly target: number }
  | { readonly id: string; readonly type: 'color-target'; readonly color: string; readonly target: number }
  | { readonly id: string; readonly type: 'clear-obstacles'; readonly target: number };

export interface StarThresholds {
  readonly minRemainingMoves2: number;
  readonly minRemainingMoves3: number;
}

export interface LevelConfig {
  readonly id: number;
  readonly name: string;
  readonly moveLimit: number;
  readonly levelSeed: number;
  readonly initialBoard: AdventureBoard;
  readonly fixedInitialPieces?: readonly string[];
  readonly objectives: readonly LevelObjective[];
  readonly starThresholds: StarThresholds;
}

export type AdventureStatus = 'playing' | 'won' | 'lost';
export type AdventureLossReason = 'moves-exhausted' | 'board-jammed';

export interface AdventureState {
  readonly level: LevelConfig;
  readonly board: AdventureBoard;
  readonly pieces: readonly (Piece | null)[];
  readonly score: number;
  readonly movesRemaining: number;
  readonly objectiveProgress: Readonly<Record<string, number>>;
  readonly status: AdventureStatus;
  readonly lossReason?: AdventureLossReason;
  readonly starsEarned: 0 | 1 | 2 | 3;
  readonly revision: number;
  readonly nextPieceId: number;
  readonly randomSeed: number;
}

export interface AdventureMove extends Point {
  readonly pieceId: string;
  readonly revision: number;
}

export type AdventureMoveRejection = 'stale-move' | 'game-over' | 'piece-unavailable' | 'invalid-placement';

export interface AdventureClearedLines {
  readonly rows: readonly number[];
  readonly columns: readonly number[];
  /** Unique coordinates whose colored cell or obstacle was removed. */
  readonly cells: readonly Point[];
  readonly obstacleDamage: readonly Point[];
}

export type AdventureMoveResult =
  | { readonly ok: false; readonly reason: AdventureMoveRejection; readonly state: AdventureState }
  | {
      readonly ok: true;
      readonly state: AdventureState;
      readonly cleared: AdventureClearedLines;
      readonly points: number;
      readonly refilled: boolean;
      readonly destroyedObstacles: number;
    };

