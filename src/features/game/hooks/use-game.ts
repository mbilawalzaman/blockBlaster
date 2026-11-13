import { useCallback, useReducer } from 'react';
import { createGame } from '../../../game/engine';
import type { Move } from '../../../game/types';
import { gameReducer } from '../game-controller';
import type { ControllerState } from '../game-controller';

export function useGame(initialBestScore = 0) {
  const [state, dispatch] = useReducer(gameReducer, undefined, (): ControllerState => ({
    game: createGame(Date.now(), initialBestScore), message: 'Pick a piece, then tap its top-left board cell.',
  }));
  const place = useCallback((move: Move) => dispatch({ type: 'place', move }), []);
  const mergeBestScore = useCallback((score: number) => dispatch({ type: 'merge-best-score', score }), []);
  const restart = useCallback(() => dispatch({ type: 'restart', seed: Date.now() }), []);
  return { ...state, place, mergeBestScore, restart };
}
