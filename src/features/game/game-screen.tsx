import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { canPlace } from '../../game/engine';
import { placementAt } from './gestures/placement';
import type { BoardBounds, PlacementPreview } from './gestures/placement';
import type { Piece } from '../../game/types';
import { theme } from '../../theme/tokens';
import { GameBoard } from './components/game-board';
import { GameHeader } from './components/game-header';
import { GameOverModal } from './components/game-over-modal';
import { PieceTray } from './components/piece-tray';
import { useGame } from './hooks/use-game';
import { ClearEffect } from './components/clear-effect';
import { useFeedback } from '../../services/feedback/use-feedback';

export function GameScreen() {
  const { game, message, feedback, place, restart } = useGame();
  const [selection, setSelection] = useState<{ piece: Piece; revision: number } | null>(null);
  const boardRef = useRef<ComponentRef<typeof View>>(null);
  const bounds = useRef<BoardBounds | null>(null);
  const drag = useRef<{ piece: Piece; revision: number } | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const previewRef = useRef<PlacementPreview | null>(null);
  function finishDrag() { drag.current = null; setDragging(false); setPreview(null); previewRef.current = null; }
  function measureBoard() {
    boardRef.current?.measureInWindow((x, y, measuredWidth) => {
      bounds.current = { x, y, size: measuredWidth };
    });
  }
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(false);
  useFeedback(feedback, { sound, vibration });
  const [confirmRestart, setConfirmRestart] = useState(false);
  const { width, height } = useWindowDimensions();
  const size = Math.max(160, Math.min(width - 48, height * 0.48, 420));
  const selected = selection?.revision === game.revision ? selection.piece : null;
  useEffect(() => {
    finishDrag();
  }, [game.revision, width, height, confirmRestart]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setSuspended(state !== 'active');
      if (state !== 'active') finishDrag();
    });
    return () => subscription.remove();
  }, []);
  function moveDrag(x: number, y: number) {
    const current = drag.current;
    if (!current || !bounds.current) return;
    const candidate = { ...placementAt(x, y, bounds.current), pieceId: current.piece.id };
    if (candidate.row !== previewRef.current?.row || candidate.col !== previewRef.current?.col) {
      previewRef.current = candidate; setPreview(candidate);
    }
  }
  function reset() { finishDrag(); setSelection(null); setConfirmRestart(false); restart(); }
  return <SafeAreaView style={styles.root}>
    <ScrollView scrollEnabled={!dragging} onScrollBeginDrag={finishDrag} onScroll={measureBoard}
      scrollEventThrottle={16} contentContainerStyle={styles.scroll}>
      <View style={[styles.content, { width: Math.min(width - 32, 468) }]}>
        <GameHeader score={game.score} bestScore={game.bestScore} combo={game.combo}
          onRestart={() => game.score > 0 ? setConfirmRestart(true) : reset()} />
        <View ref={boardRef} collapsable={false} onLayout={measureBoard} style={styles.boardContainer}><GameBoard board={game.board} size={size}
          preview={preview} draggedPiece={drag.current?.piece ?? null} selected={selected} disabled={game.gameOver || confirmRestart || suspended || dragging}
          onPlace={(row, col) => { if (selected && selection) place({ pieceId: selected.id,
            revision: selection.revision, row, col }); }} />
          {feedback && feedback.lines > 0 && <ClearEffect key={feedback.revision} event={feedback} size={size} />}
        </View>
        <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>
        <PieceTray pieces={game.pieces} width={Math.min(width - 32, 468)} selectedId={selected?.id ?? null}
          disabled={game.gameOver || confirmRestart || suspended} boardSize={size}
          onBegin={(piece) => {
            if (drag.current || game.gameOver || confirmRestart || !bounds.current) return false;
            measureBoard(); drag.current = { piece, revision: game.revision };
            setDragging(true); setSelection({ piece, revision: game.revision }); return true;
          }}
          onMove={moveDrag}
          onDrop={(x, y) => {
            const current = drag.current;
            if (!current || !bounds.current || current.revision !== game.revision || confirmRestart || game.gameOver) return false;
            const target = placementAt(x, y, bounds.current);
            if (!canPlace(game.board, current.piece.shape, target.row, target.col)) return false;
            place({ pieceId: current.piece.id, revision: current.revision, ...target }); return true;
          }} onFinish={finishDrag}
          onSelect={(piece) => setSelection({ piece, revision: game.revision })} />
        <View style={styles.preferences}>
          <View style={styles.preference}><Text style={styles.preferenceText}>Sound</Text>
            <Switch accessibilityLabel="Game sounds" value={sound} onValueChange={setSound}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }} /></View>
          <View style={styles.preference}><Text style={styles.preferenceText}>Vibration</Text>
            <Switch accessibilityLabel="Game vibration" value={vibration} onValueChange={setVibration}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }} /></View>
        </View>
        <Text style={styles.help}>Drag a piece onto the board, or select it and tap a cell. Fill a row or column to clear it. Use all three pieces for a fresh set.</Text>
      </View>
    </ScrollView>
    <ConfirmDialog open={confirmRestart} title="Start a fresh mosaic?"
      description="Your current board and score will reset. Your session best stays."
      confirmLabel="Restart game" onConfirm={reset} onCancel={() => setConfirmRestart(false)} />
    <GameOverModal open={game.gameOver} score={game.score} bestScore={game.bestScore} onReplay={reset} />
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  content: { gap: theme.spacing.medium },
  boardContainer: { alignSelf: 'center', marginTop: 8 },
  preferences: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24 },
  preference: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preferenceText: { color: theme.colors.muted, fontSize: theme.type.small },
  message: { color: theme.colors.accent, fontSize: theme.type.small, textAlign: 'center', minHeight: 36 },
  help: { color: theme.colors.muted, fontSize: theme.type.small, lineHeight: 20, textAlign: 'center' },
});
