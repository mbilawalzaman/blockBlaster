# Block Puzzle — Engineering Rules

These rules apply to every change in this repository, by people and coding agents alike. Build an original, offline-first Android block puzzle game. The repository name is a working name: do not copy another game's branding, artwork, sounds, or exact visual design.

## 1. Stack and scope

- Expo SDK 58, React Native, React, TypeScript strict, Gesture Handler, Reanimated, Worklets, and AsyncStorage. Read `package.json` for installed versions before making changes.
- Native Views render the board and pieces. Introduce Skia only when measured requirements justify it.
- MVP: 8×8 board, three-piece tray, drag-and-drop, placement preview, simultaneous line clearing, scoring, combos, saved best score, game over, and restart.
- No backend, accounts, HTTP API, database server, advertisements, purchases, or online leaderboard in the MVP. Do not scaffold Express controllers or repositories for local gameplay.

## 2. Product invariants

1. Gameplay works offline. Storage and optional feedback failures never prevent play.
2. Placement requires every piece cell to be in bounds and empty. Invalid or cancelled drops change neither board, score, combo, nor tray.
3. Detect full rows and columns from the same post-placement board, then clear them together. Count intersection cells once when reporting unique cleared cells.
4. Consume a piece only after valid placement. Deal three new pieces only when the entire tray has been consumed.
5. After placement, clearing, and any refill, game over means none of the remaining pieces fits anywhere. One unusable piece is not game over.
6. Pieces have fixed orientations in the MVP: no rotation, gravity, or falling blocks.
7. Restart resets board, score, combo, and tray while preserving best score and preferences.
8. Define scoring and combo rules in one module. A valid non-clearing move resets the combo; an invalid drop does not.
9. Document the generation policy. Do not silently add guaranteed playable trays, adaptive difficulty, or rerolls. Inject randomness for reproducible tests.
10. Committed engine state is authoritative. Animated coordinates and previews never directly mutate it.

## 3. Architecture and SOLID

```text
Gesture → candidate placement → controller hook → pure engine
                                      ↓
                              committed React state
                                      ↓
                               UI + persistence
```

- **Single responsibility:** components render, gestures track touch, the hook coordinates, the engine applies rules, storage adapters persist, and feedback adapters handle sound/haptics.
- **Open/closed:** separate scoring, shape definitions, and generation policy from rendering so rules evolve without rewriting components.
- **Liskov substitution:** storage and feedback adapters, including test fakes, honor the same contracts and failure behavior.
- **Interface segregation:** define small interfaces at real side-effect boundaries, such as `ScoreStorage` and `FeedbackPlayer`. Do not create interfaces for every function.
- **Dependency inversion:** orchestration receives adapters and a random source. The engine never imports React, React Native, Expo, or AsyncStorage.
- Prefer pure functions for rules; classes are optional for stateful adapters. No DI framework, service locator, circular dependencies, or ceremonial layers.
- UI depends on application/domain code, never the reverse. The controller is a hook, the model is the engine/types, and presentation is React Native components; do not force HTTP MVC onto a local game.

## 4. Folder structure

Target structure; create files when needed, not empty placeholders:

```text
App.tsx                         providers and game-screen composition
index.ts                        Expo entry point
src/
├── components/ui/              shared button, icon-button, confirm-dialog
├── features/game/
│   ├── components/             game-header, game-board, board-cell,
│   │                          piece-tray, draggable-piece, game-over-modal
│   ├── hooks/use-game.ts       controller: state and orchestration
│   ├── gestures/              coordinate mapping and drag helpers
│   └── game-screen.tsx        feature composition
├── game/
│   ├── types.ts               Board, Shape, Piece, GameState, MoveResult
│   ├── engine.ts              validation and complete move application
│   ├── shapes.ts              immutable shape catalogue
│   ├── scoring.ts             score constants and combo calculation
│   └── random.ts              random-source contract and tray generation
├── services/
│   ├── storage/               contracts, AsyncStorage adapter, validation
│   └── feedback/              optional sound/haptic adapters
├── bootstrap/                 constructs side-effect adapters
└── theme/                     colors, spacing, typography, motion
 tests/                        engine, orchestration, adapters, components
 assets/                       original or properly licensed assets
```

Keep the existing `App.tsx` entry point. A single game screen does not require a router. If navigation is added, use Expo Router with thin routes and non-route code outside its route directory.

## 5. Layer responsibilities

### Engine: domain model

- Pure, synchronous TypeScript with explicit inputs/outputs. Never read global randomness, time, storage, or UI state internally.
- `applyMove` returns a complete transition: validation, placement, simultaneous clearing, score/combo, tray consumption/refill, and game-over detection. Supply randomness explicitly for refill.
- Never mutate input boards, catalogue shapes, or previous states. Prefer readonly types at public boundaries.
- Return typed results for expected rejected moves; throw only for programming errors or broken invariants.
- Generated piece instances have stable identifiers separate from catalogue shape identifiers.

### Controller hook: application orchestration

- Own committed state, call the engine, load/save best score, and trigger optional feedback.
- Apply moves to the latest state. Reject stale or duplicate drops using piece identity or a game revision.
- Keep reducers and state updater functions pure. Storage and feedback happen outside them; React can invoke updaters more than once.
- Invalidate active drags on restart, game over, or teardown.
- Components never call AsyncStorage or duplicate engine rules.

### Components and modals: presentation

- Small components with typed props and explicit callbacks. Screens compose components rather than implementing rules.
- Dedicated `GameOverModal` and shared `ConfirmDialog`; no duplicated overlay markup or native alert/confirm popups.
- Use shared accessible buttons with appropriate pressed, disabled, and loading states. Confirm restarting an in-progress game; replay after game over can be immediate.
- Central theme tokens define colors, spacing, typography, and motion, including shape colors.

### Storage and feedback services

- AsyncStorage is behind a small adapter with namespaced, versioned keys. Validate loaded data as untrusted input.
- Best score must be a finite nonnegative integer. Missing/corrupt data falls back safely.
- Merge late best-score hydration with current progress using the maximum. Serialize writes so an older write cannot lower the stored best score.
- Handle read/write failures explicitly; never roll back valid moves because persistence failed.
- Optional sound/haptics respect preferences and cannot affect game rules or score.

## 6. Drag-and-drop and layout

- Configure Gesture Handler at the root using the installed version's documented setup.
- Shared values handle per-frame movement. React preview state changes only when candidate cell or validity changes.
- Measure the board in the same coordinate system as gesture events. Account for safe areas, padding, cell gaps/pitch, and layout changes.
- Lift the piece above the finger. Use the displayed piece's top-left anchor consistently for preview and drop; do not map the finger directly to a multi-cell piece's origin.
- Revalidate release against current state. Invalid/cancelled gestures snap back without consuming the piece.
- Handle cancellation, backgrounding, rapid gestures, and simultaneous touches. MVP supports one active drag at a time.
- Size the board against available width and height. Keep the tray accessible on small Android screens and with system font scaling.

## 7. TypeScript and code style

- Keep `strict` enabled. Enable `noUncheckedIndexedAccess` when implementing the engine and handle missing array entries explicitly.
- No explicit `any`; use `unknown` and narrow it. Avoid non-null assertions. Non-obvious casts need a safety explanation.
- Use `import type` for type-only imports. Named exports except framework-required defaults, including the existing Expo app entry point.
- Files use `kebab-case`, components/types `PascalCase`, functions/hooks `camelCase`. Preserve framework entry filenames.
- Use relative imports consistently initially. Add a `@/` alias only with matching TypeScript, bundler, and test configuration.
- Centralize dimensions, scoring values, storage keys, and shape definitions. Avoid duplicated rules, magic values, and speculative abstractions.

## 8. Performance and accessibility

- Target smooth Android dragging; profile before adding a renderer or broad memoization.
- No storage, sound loading, expensive work, or logging in drag-frame callbacks. Keep worklets small and respect JS/UI runtime boundaries.
- Use stable piece identifiers as keys; coordinates are stable keys for fixed board cells.
- Controls have accessibility labels/roles and adequate touch targets. Color alone must not distinguish valid and invalid placement.
- Respect reduced motion and feedback preferences. Do not announce every drag frame to screen readers.
- When implementing accessibility support, provide a select-piece/select-cell alternative that calls the same engine operation.

## 9. Errors, privacy, and dependencies

- Never put secrets in the bundle, public Expo environment variables, logs, or commits. Offline gameplay needs no API keys.
- No analytics, network calls, or extra permissions without a product requirement.
- Keep development diagnostics concise. No silent empty catches or sensitive payload logging.
- Use npm and commit `package-lock.json`; do not introduce another package-manager lockfile.
- Install Expo/native runtime dependencies through `npx expo install <package>`. Verify development-tool compatibility separately.
- Investigate audit findings. Never blindly run `npm audit fix --force` or override Expo-compatible native versions.

## 10. Expo and Android workflow

- Before changing Expo, React Native, Reanimated, or Gesture Handler APIs/configuration, read installed versions and matching official documentation. Expo SDK 58 docs: https://docs.expo.dev/versions/v58.0.0/ . Other Expo documentation index: https://docs.expo.dev/llms.txt .
- Do not copy Babel/Worklets configuration from older tutorials without checking current compatibility.
- Configure native behavior through app configuration/plugins. Do not hand-create generated `android/` or `ios/` directories in this managed project.
- Expo Go supports only its bundled compatible modules. Use a development build when a dependency or native configuration requires one.
- Test gestures on an Android device/emulator; web-only validation is insufficient.
- EAS preview builds produce APKs; production Android builds produce AABs. Never invent account IDs, credentials, or signing keys, or claim an unverified build succeeded.

Current commands:

```bash
npm start
npm run android
npx tsc --noEmit
npx expo-doctor
```

`npm run android` starts Expo targeting Android; it does not generate a signed APK. Add lint/test scripts with their configuration when introducing those tools. Never claim nonexistent scripts pass.

## 11. Testing and quality gates

- Prefer Vitest for pure engine tests. Use React Native Testing Library with its supported runner for native components; do not assume web DOM tooling supports native components.
- Engine tests cover bounds, collisions, immutability, rejected moves, intersecting clears, scoring/combos, tray refill, and game over when any/no remaining piece fits.
- Use deterministic randomness. Adapter/hook tests cover corrupt storage, failed persistence, late hydration, write ordering, restart, and duplicate drop protection.
- Mock platform boundaries in unit tests. No real network calls. Avoid tests that simply mirror JSX or implementation details.
- Bug fixes include meaningful regression tests. Documentation-only changes require review, not new tests.
- Before declaring implementation complete, run typecheck, configured lint, and relevant tests. Report missing tools, failures, and unverified device behavior honestly.
- Before release, manually verify small-screen layout, fast/cancelled drags, board edges, background/resume, restart during drag, relaunch persistence, and airplane-mode play on Android.

## 12. Git and delivery

- Prefer focused branches (`feature/<story>`, `fix/<bug>`) and conventional commits (`feat(game): clear intersecting lines`). Do not commit unless asked.
- Never commit `node_modules`, `.expo`, credentials, signing material, or local build output. Preserve existing ignore rules and user changes.
- Delivery order: tested engine → playable UI → drag/drop → persistence/polish → Android verification/packaging.
- These rules define target architecture, not authorization for unrelated implementation or release work.
