import { describe, expect, it } from 'vitest';
import {
  adventureReducer,
  createInitialAdventureControllerState,
} from '../../src/features/adventure/adventure-controller';
import { ADVENTURE_LEVELS } from '../../src/game/adventure/levels';

describe('Adventure Controller', () => {
  const level1 = ADVENTURE_LEVELS[0]!;

  it('initializes level with initial moves and empty objectives', () => {
    const initial = createInitialAdventureControllerState(level1);
    expect(initial.state.movesRemaining).toBe(12);
    expect(initial.state.status).toBe('playing');
    expect(initial.state.score).toBe(0);
    expect(initial.message).toContain('Place a piece');
  });

  it('rejects invalid placement and preserves state', () => {
    const initial = createInitialAdventureControllerState(level1);
    const piece = initial.state.pieces[0]!;
    const next = adventureReducer(initial, {
      type: 'place',
      move: {
        pieceId: piece.id,
        revision: initial.state.revision,
        row: -5,
        col: -5,
      },
    });

    expect(next.state).toBe(initial.state);
    expect(next.message).toContain('Try another cell');
  });

  it('commits valid moves and gives points feedback', () => {
    const initial = createInitialAdventureControllerState(level1);
    const piece = initial.state.pieces[0]!;
    const next = adventureReducer(initial, {
      type: 'place',
      move: {
        pieceId: piece.id,
        revision: initial.state.revision,
        row: 0,
        col: 0,
      },
    });

    expect(next.state.movesRemaining).toBe(11);
    expect(next.state.score).toBeGreaterThan(0);
    expect(next.feedback?.points).toBeGreaterThan(0);
    expect(Array.isArray(next.feedback?.cells)).toBe(true);
  });

  it('resets level on restart action', () => {
    const initial = createInitialAdventureControllerState(level1);
    const piece = initial.state.pieces[0]!;
    const played = adventureReducer(initial, {
      type: 'place',
      move: {
        pieceId: piece.id,
        revision: initial.state.revision,
        row: 0,
        col: 0,
      },
    });
    expect(played.state.movesRemaining).toBe(11);

    const reset = adventureReducer(played, { type: 'restart' });
    expect(reset.state.movesRemaining).toBe(12);
    expect(reset.state.score).toBe(0);
  });
});
