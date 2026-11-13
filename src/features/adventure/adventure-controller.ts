import { applyAdventureMove, createAdventureGame } from '../../game/adventure/engine';
import type { Point } from '../../game/types';
import type { AdventureMove, AdventureState, LevelConfig } from '../../game/adventure/types';

export interface AdventureMoveFeedback {
  readonly revision: number;
  readonly cells: readonly Point[];
  readonly lines: number;
  readonly points: number;
  readonly destroyedObstacles: number;
}

export interface AdventureControllerState {
  readonly state: AdventureState;
  readonly message: string;
  readonly feedback?: AdventureMoveFeedback;
}

export type AdventureAction =
  | { readonly type: 'place'; readonly move: AdventureMove }
  | { readonly type: 'restart'; readonly seed?: number | undefined };

export function createInitialAdventureControllerState(level: LevelConfig): AdventureControllerState {
  return {
    state: createAdventureGame(level),
    message: 'Place a piece on the board to start.',
  };
}

export function adventureReducer(
  current: AdventureControllerState,
  action: AdventureAction,
): AdventureControllerState {
  if (action.type === 'restart') {
    const nextSeed = action.seed ?? current.state.level.levelSeed;
    return {
      state: createAdventureGame(current.state.level, nextSeed),
      message: 'Level reset. Place your first piece.',
    };
  }

  const result = applyAdventureMove(current.state, action.move);
  if (!result.ok) {
    return { ...current, message: 'That piece does not fit there. Try another cell.' };
  }

  const lines = result.cleared.rows.length + result.cleared.columns.length;
  let message = `+${result.points} points.`;
  if (lines > 0) {
    message = `${lines} ${lines === 1 ? 'line' : 'lines'} cleared! +${result.points} points`;
  }
  if (result.destroyedObstacles > 0) {
    message += ` 💥 ${result.destroyedObstacles} obstacle${result.destroyedObstacles === 1 ? '' : 's'} destroyed!`;
  }

  return {
    state: result.state,
    feedback: {
      revision: result.state.revision,
      cells: result.cleared.cells,
      lines,
      points: result.points,
      destroyedObstacles: result.destroyedObstacles,
    },
    message,
  };
}
