import { useCallback, useReducer } from 'react';
import type { AdventureMove, LevelConfig } from '../../../game/adventure/types';
import {
  adventureReducer,
  createInitialAdventureControllerState,
} from '../adventure-controller';

export function useAdventureGame(level: LevelConfig) {
  const [controller, dispatch] = useReducer(
    adventureReducer,
    level,
    createInitialAdventureControllerState,
  );

  const place = useCallback((move: AdventureMove) => {
    dispatch({ type: 'place', move });
  }, []);

  const restart = useCallback((seed?: number) => {
    dispatch({ type: 'restart', seed });
  }, []);

  return {
    ...controller,
    place,
    restart,
  };
}
