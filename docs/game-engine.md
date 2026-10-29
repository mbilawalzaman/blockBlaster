# Milestone 1: game engine

The engine is independent of React Native and storage. These APIs are local TypeScript functions, not backend HTTP endpoints. No backend folder or server is needed for the offline MVP.

## Rules

- 8×8 board, three fixed-orientation pieces per tray. No rotation or gravity.
- Every placed cell earns 1 point. Each cleared row/column earns 10 × combo points.
- A clearing move increases combo by 1, starting at 1. A valid non-clearing move resets it to 0. Invalid moves change nothing.
- Rows and columns clear simultaneously. An intersection counts as one unique cleared cell, but both completed lines receive bonuses.
- Draw uniformly from the 15 catalogue entries, with replacement. Duplicates are allowed. Only an exhausted tray is replaced. No rerolls, guaranteed fits, or adaptive difficulty.
- Game over is checked after clearing and refill; any playable remaining piece keeps the game alive.

## Local TypeScript API

- `createGame(seed, bestScore?, random?)`: initialize using an explicit integer seed.
- `canPlace(board, shape, row, col)`: safe candidate validation, including integer coordinates.
- `applyMove(state, { pieceId, revision, row, col }, random?)`: returns a discriminated success/rejection result. Success includes cleared line/cell coordinates, awarded points, and whether the tray refilled. Rejection returns the original state object.
- `restartGame(state, seed, random?)`: preserve best score and increment revision/IDs to invalidate old gestures. Preferences belong to application state, outside this engine.
- `hasAvailableMove`, `placeShape`, and `clearLines` are independently testable helpers. `placeShape` throws on invalid coordinates; use `applyMove` for player actions.

Randomness is a pure seed-to-sample function. The state stores its next seed, so retrying the same transition produces exactly the same result without advancing global randomness. The default 32-bit LCG is for gameplay only. Choose an initial seed outside the engine, then keep the same source for that game. Custom sources must be pure and return a sample in [0, 1) plus a safe integer seed.

Engine-produced boards are 8×8; catalogue shapes are nonempty, normalized collections of unique nonnegative integer cells. Arbitrary imported/save-game states will need boundary validation before use. Readonly TypeScript contracts protect state at compile time; freeze-based tests verify transitions never mutate their inputs. Catalogue definitions are frozen at runtime.

## Verification

Run `npm run typecheck` and `npm test`. Tests use Node, deterministic randomness, and no device or network. Lint is not configured yet. Android rendering and gesture verification begin in later milestones.
