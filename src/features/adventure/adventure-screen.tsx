import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  AppState,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import type { Piece } from '../../game/types';
import type { LevelConfig } from '../../game/adventure/types';
import { canPlaceAdventure } from '../../game/adventure/engine';
import { theme } from '../../theme/tokens';
import { GameBoard } from '../game/components/game-board';
import { PieceTray } from '../game/components/piece-tray';
import { placementAt } from '../game/gestures/placement';
import type { BoardBounds, PlacementPreview } from '../game/gestures/placement';
import { ClearEffect } from '../game/components/clear-effect';
import { useFeedback } from '../../services/feedback/use-feedback';
import type { UserPreferences } from '../../services/storage/preferences-storage';
import { DEFAULT_PREFERENCES } from '../../services/storage/preferences-storage';
import { useAdventureGame } from './hooks/use-adventure-game';
import { AdventureHeader } from './components/adventure-header';
import { AdventureResultModal } from './components/adventure-result-modal';

export interface AdventureScreenProps {
  readonly level: LevelConfig;
  readonly onMap: () => void;
  readonly onLevelCompleted: (levelId: number, stars: 1 | 2 | 3, score: number) => void;
  readonly onNextLevel?: (() => void) | undefined;
  readonly hasNextLevel?: boolean | undefined;
  readonly preferences?: UserPreferences | undefined;
}

export function AdventureScreen({
  level,
  onMap,
  onLevelCompleted,
  onNextLevel,
  hasNextLevel = false,
  preferences = DEFAULT_PREFERENCES,
}: AdventureScreenProps) {
  const { state, message, feedback, place, restart } = useAdventureGame(level);
  const [selection, setSelection] = useState<{ piece: Piece; revision: number } | null>(null);
  const boardRef = useRef<ComponentRef<typeof View>>(null);
  const bounds = useRef<BoardBounds | null>(null);
  const drag = useRef<{ piece: Piece; revision: number } | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const previewRef = useRef<PlacementPreview | null>(null);
  const completionNotifiedFor = useRef<string | null>(null);

  const [confirmRestart, setConfirmRestart] = useState(false);
  const [confirmMap, setConfirmMap] = useState(false);

  function finishDrag() {
    drag.current = null;
    setDragging(false);
    setPreview(null);
    previewRef.current = null;
  }

  function measureBoard() {
    boardRef.current?.measureInWindow((x, y, measuredWidth) => {
      bounds.current = { x, y, size: measuredWidth };
    });
  }

  // Audio & haptic feedback
  const sound = preferences.sound;
  const vibration = preferences.vibration;
  useFeedback(
    feedback
      ? {
          revision: feedback.revision,
          cells: feedback.cells,
          lines: feedback.lines,
          combo: 0,
          points: feedback.points,
        }
      : undefined,
    { sound, vibration },
  );

  const { width, height } = useWindowDimensions();
  const size = Math.max(160, Math.min(width - 48, height * 0.48, 420));
  const selected = selection?.revision === state.revision ? selection.piece : null;

  useEffect(() => {
    finishDrag();
  }, [state.revision, width, height, confirmRestart]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      setSuspended(appState !== 'active');
      if (appState !== 'active') finishDrag();
    });
    return () => subscription.remove();
  }, []);

  // Notify parent on completion
  useEffect(() => {
    if (state.status !== 'won') {
      completionNotifiedFor.current = null;
      return;
    }
    if (state.starsEarned === 0) return;
    const completionKey = `${level.id}:${state.revision}`;
    if (completionNotifiedFor.current === completionKey) return;
    completionNotifiedFor.current = completionKey;
    onLevelCompleted(level.id, state.starsEarned, state.score);
  }, [state.status, state.starsEarned, state.score, state.revision, level.id, onLevelCompleted]);

  function moveDrag(x: number, y: number) {
    const current = drag.current;
    if (!current || !bounds.current) return;
    const candidate = { ...placementAt(x, y, bounds.current), pieceId: current.piece.id };
    if (candidate.row !== previewRef.current?.row || candidate.col !== previewRef.current?.col) {
      previewRef.current = candidate;
      setPreview(candidate);
    }
  }

  function resetLevel() {
    finishDrag();
    setSelection(null);
    setConfirmRestart(false);
    restart();
  }

  const isInteractive = state.status === 'playing' && !confirmRestart && !confirmMap && !suspended;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        scrollEnabled={!dragging}
        onScrollBeginDrag={finishDrag}
        onScroll={measureBoard}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.content, { width: Math.min(width - 32, 468) }]}>
          <AdventureHeader
            state={state}
            onMap={() => (state.status === 'playing' ? setConfirmMap(true) : onMap())}
            onRestart={() => (state.status === 'playing' ? setConfirmRestart(true) : resetLevel())}
          />

          <View ref={boardRef} collapsable={false} onLayout={measureBoard} style={styles.boardContainer}>
            <GameBoard
              board={state.board}
              size={size}
              preview={preview}
              draggedPiece={drag.current?.piece ?? null}
              selected={selected}
              disabled={!isInteractive || dragging}
              onPlace={(row, col) => {
                if (selected && selection) {
                  place({
                    pieceId: selected.id,
                    revision: selection.revision,
                    row,
                    col,
                  });
                }
              }}
            />
            {feedback && feedback.lines > 0 && (
              <ClearEffect
                key={feedback.revision}
                event={{
                  revision: feedback.revision,
                  cells: feedback.cells,
                  lines: feedback.lines,
                  combo: 0,
                  points: feedback.points,
                }}
                size={size}
              />
            )}
          </View>

          <Text style={styles.message} accessibilityLiveRegion="polite">
            {message}
          </Text>

          <PieceTray
            pieces={state.pieces}
            width={Math.min(width - 32, 468)}
            selectedId={selected?.id ?? null}
            disabled={!isInteractive}
            boardSize={size}
            onBegin={(piece) => {
              if (drag.current || !isInteractive || !bounds.current) return false;
              measureBoard();
              drag.current = { piece, revision: state.revision };
              setDragging(true);
              setSelection({ piece, revision: state.revision });
              return true;
            }}
            onMove={moveDrag}
            onDrop={(x, y) => {
              const current = drag.current;
              if (
                !current ||
                !bounds.current ||
                current.revision !== state.revision ||
                !isInteractive
              ) {
                return false;
              }
              const target = placementAt(x, y, bounds.current);
              if (!canPlaceAdventure(state.board, current.piece.shape, target.row, target.col)) {
                return false;
              }
              place({
                pieceId: current.piece.id,
                revision: current.revision,
                row: target.row,
                col: target.col,
              });
              return true;
            }}
            onFinish={finishDrag}
            onSelect={(piece) => setSelection({ piece, revision: state.revision })}
          />

          <Text style={styles.help}>
            Drag a piece or tap to place. Complete rows and columns to clear lines and damage obstacles!
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmRestart}
        title="Restart Level?"
        description="Your moves and target progress on this attempt will be reset."
        confirmLabel="Restart"
        cancelLabel="Keep playing"
        onConfirm={resetLevel}
        onCancel={() => setConfirmRestart(false)}
      />

      <ConfirmDialog
        open={confirmMap}
        title="Return to Map?"
        description="Your progress on this current attempt will be lost."
        confirmLabel="Exit to Map"
        cancelLabel="Keep playing"
        onConfirm={() => {
          setConfirmMap(false);
          onMap();
        }}
        onCancel={() => setConfirmMap(false)}
      />

      {/* Result Modal */}
      <AdventureResultModal
        state={state}
        hasNextLevel={hasNextLevel}
        onNextLevel={() => {
          onNextLevel?.();
        }}
        onReplay={resetLevel}
        onMap={onMap}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: { gap: theme.spacing.small },
  boardContainer: { alignSelf: 'center', marginTop: 4 },
  message: {
    color: theme.colors.accent,
    fontSize: theme.type.small,
    textAlign: 'center',
    minHeight: 28,
  },
  help: {
    color: theme.colors.muted,
    fontSize: theme.type.small,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
});
