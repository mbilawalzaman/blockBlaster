import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, useReducedMotion, withTiming } from 'react-native-reanimated';
import type { Piece } from '../../../game/types';
import { theme } from '../../../theme/tokens';

export interface DraggablePieceProps {
  readonly piece: Piece; readonly unit: number; readonly boardUnit: number;
  readonly selected: boolean; readonly disabled: boolean;
  readonly onSelect: () => void;
  readonly onBegin: () => boolean;
  readonly onMove: (x: number, y: number) => void;
  readonly onDrop: (x: number, y: number) => boolean;
  readonly onFinish: () => void;
}
export function DraggablePiece({ piece, unit, boardUnit, selected, disabled,
  onSelect, onBegin, onMove, onDrop, onFinish }: DraggablePieceProps) {
  const reducedMotion = useReducedMotion();
  const cols = Math.max(...piece.shape.cells.map((cell) => cell.col)) + 1;
  const rows = Math.max(...piece.shape.cells.map((cell) => cell.row)) + 1;
  const x = useSharedValue(0); const y = useSharedValue(0);
  const active = useSharedValue(0);
  const origin = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const width = cols * boardUnit; const height = rows * boardUnit;
  const style = useAnimatedStyle(() => ({ opacity: active.value,
    transform: [{ translateX: x.value }, { translateY: y.value }] }));
  function position(absoluteX: number, absoluteY: number) {
    return { x: absoluteX - width / 2, y: absoluteY - height - 28 };
  }
  useEffect(() => {
    if (disabled) { dragging.current = false; active.value = 0; }
  }, [disabled, active]);
  const pan = Gesture.Pan().enabled(!disabled).minDistance(7).maxPointers(1).runOnJS(true)
    .onStart((event) => {
      if (!onBegin()) return;
      dragging.current = true; suppressClick.current = true;
      origin.current = { x: event.absoluteX - event.x, y: event.absoluteY - event.y };
      const pos = position(event.absoluteX, event.absoluteY);
      x.value = pos.x - origin.current.x; y.value = pos.y - origin.current.y;
      active.value = 1; onMove(pos.x, pos.y);
    }).onUpdate((event) => {
      if (!dragging.current) return;
      const pos = position(event.absoluteX, event.absoluteY);
      x.value = pos.x - origin.current.x; y.value = pos.y - origin.current.y;
      onMove(pos.x, pos.y);
    }).onEnd((event, success) => {
      if (!dragging.current) return;
      const pos = position(event.absoluteX, event.absoluteY);
      const placed = success && onDrop(pos.x, pos.y);
      if (placed) active.value = 0;
      else { x.value = withTiming(0, { duration: reducedMotion ? 0 : 160 }); y.value = withTiming(0, { duration: reducedMotion ? 0 : 160 });
        active.value = withTiming(0, { duration: reducedMotion ? 0 : 200 }); }
    }).onFinalize(() => {
      if (!dragging.current) return;
      dragging.current = false;
      x.value = withTiming(0, { duration: reducedMotion ? 0 : 160 });
      y.value = withTiming(0, { duration: reducedMotion ? 0 : 160 });
      active.value = withTiming(0, { duration: reducedMotion ? 0 : 160 });
      onFinish();
    });
  return <GestureDetector gesture={pan} touchAction="none">
    <View style={[styles.host, selected && styles.selected]}>
      <Pressable disabled={disabled} accessibilityRole="button"
        accessibilityLabel={`Select ${piece.shape.id.replaceAll('-', ' ')}, ${piece.shape.cells.length} blocks. Tap a board cell or drag to place.`}
        accessibilityState={{ selected, disabled }}
        onPressIn={() => { suppressClick.current = false; }}
        onPress={() => { if (!suppressClick.current) onSelect(); }} style={styles.button}>
        <View pointerEvents="none" style={{ width: cols * unit, height: rows * unit }}>
          {piece.shape.cells.map(({ row, col }) => <View key={`${row}:${col}`} style={[styles.block,
            { left: col * unit, top: row * unit, width: unit - 2, height: unit - 2, backgroundColor: piece.shape.color }]} />)}
        </View>
      </Pressable>
      <Animated.View pointerEvents="none" style={[styles.floating, { width, height }, style]}>
        {piece.shape.cells.map(({ row, col }) => <View key={`${row}:${col}`} style={[styles.block,
          { left: col * boardUnit + 2, top: row * boardUnit + 2, width: boardUnit - 4,
            height: boardUnit - 4, backgroundColor: piece.shape.color }]} />)}
      </Animated.View>
    </View>
  </GestureDetector>;
}
const styles = StyleSheet.create({
  host: { flex: 1, minHeight: 124, borderWidth: 2, borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.medium },
  selected: { borderColor: theme.colors.accent, zIndex: 10 },
  button: { flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  block: { position: 'absolute', borderRadius: theme.radius.small },
  floating: { position: 'absolute', top: 0, left: 0, zIndex: 20 },
});
