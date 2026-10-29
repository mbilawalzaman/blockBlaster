import { useReducer } from 'react';
import { createGame } from '../../../game/engine';
import type { Move } from '../../../game/types';
import { gameReducer } from '../game-controller';
import type { ControllerState } from '../game-controller';

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, (): ControllerState => ({
    game: createGame(Date.now()), message: 'Pick a piece, then tap its top-left board cell.',
  }));
  return { ...state,
    place: (move: Move) => dispatch({ type: 'place', move }),
    restart: () => dispatch({ type: 'restart', seed: Date.now() }),
  };
}
