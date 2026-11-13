import { applyMove, restartGame } from '../../game/engine';
import type { GameState, Move, Point } from '../../game/types';

export interface MoveFeedback {
  readonly revision: number;
  readonly cells: readonly Point[];
  readonly lines: number;
  readonly combo: number;
  readonly points: number;
}
export interface ControllerState {
  readonly game: GameState;
  readonly message: string;
  readonly feedback?: MoveFeedback;
}
export type GameAction = { readonly type: 'place'; readonly move: Move }
  | { readonly type: 'restart'; readonly seed: number }
  | { readonly type: 'merge-best-score'; readonly score: number };
export function gameReducer(state: ControllerState, action: GameAction): ControllerState {
  if (action.type === 'merge-best-score') {
    if (!Number.isSafeInteger(action.score) || action.score < 0) return state;
    const bestScore = Math.max(state.game.bestScore, state.game.score, action.score);
    return bestScore === state.game.bestScore ? state : { ...state, game: { ...state.game, bestScore } };
  }
  if (action.type === 'restart') return {
    game: restartGame(state.game, action.seed), message: 'Fresh board. Pick a piece to begin.',
  };
  const result = applyMove(state.game, action.move);
  if (!result.ok) return { ...state, message: 'That piece does not fit there. Try another cell.' };
  const lines = result.cleared.rows.length + result.cleared.columns.length;
  return { game: result.state, feedback: {
    revision: result.state.revision, cells: result.cleared.cells, lines,
    combo: result.state.combo, points: result.points,
  }, message: lines > 0
    ? `${lines} ${lines === 1 ? 'line' : 'lines'} cleared! +${result.points} points`
    : `+${result.points} points. Pick your next piece.` };
}
