import { describe, expect, it } from 'vitest';
import { createGame } from '../../src/game/engine';
import { gameReducer } from '../../src/features/game/game-controller';

function setup() {
  const game = createGame(123);
  const piece = game.pieces[0];
  if (!piece) throw new Error('Expected initial piece');
  return { state: { game, message: 'Ready' },
    action: { type: 'place' as const, move: { pieceId: piece.id, revision: game.revision, row: 0, col: 0 } } };
}
describe('game controller', () => {
  it('commits valid moves and gives feedback', () => {
    const { state, action } = setup();
    const result = gameReducer(state, action);
    expect(result.game.score).toBeGreaterThan(0);
    expect(result.message).toContain('points');
    expect(state.game.score).toBe(0);
  });
  it('leaves invalid moves untouched and gives retry feedback', () => {
    const { state, action } = setup();
    const result = gameReducer(state, { ...action, move: { ...action.move, row: -1 } });
    expect(result.game).toBe(state.game);
    expect(result.message).toContain('Try another cell');
  });
  it('cannot apply a double tap twice', () => {
    const { state, action } = setup();
    const first = gameReducer(state, action);
    expect(gameReducer(first, action).game).toBe(first.game);
  });
  it('restarts with session best and invalidates previous selections', () => {
    const { state, action } = setup();
    const played = gameReducer(state, action);
    const reset = gameReducer(played, { type: 'restart', seed: 456 });
    expect(reset.game.score).toBe(0);
    expect(reset.game.bestScore).toBe(played.game.score);
    expect(reset.game.revision).toBeGreaterThan(played.game.revision);
    expect(reset.game.board.flat().every((cell) => cell === null)).toBe(true);
  });
});

describe('move effects', () => {
  it('emits line coordinates and combo strength only on accepted moves', () => {
    const initial = createGame(1);
    const single = initial.pieces.find((piece) => piece?.shape.id === 'single');
    // Build a known single-piece fixture, independent of random catalogue draws.
    const shape = { id: 'test-single', color: '#fff', cells: [{ row: 0, col: 0 }] };
    const piece = single ?? { id: 'effect-piece', shape };
    const board = Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) =>
      row === 0 && col > 0 ? '#fff' : null));
    const state = { game: { ...initial, board, combo: 1, pieces: [piece, null, null] }, message: '' };
    const action = { type: 'place' as const, move: { pieceId: piece.id, revision: 0, row: 0, col: 0 } };
    const result = gameReducer(state, action);
    expect(result.feedback?.cells).toHaveLength(8);
    expect(result.feedback?.lines).toBe(1);
    expect(result.feedback?.combo).toBe(2);
    expect(result.feedback?.points).toBe(21);
    expect(gameReducer(result, action).feedback).toBe(result.feedback);
    expect(gameReducer(result, { type: 'restart', seed: 2 }).feedback).toBeUndefined();
  });
});
