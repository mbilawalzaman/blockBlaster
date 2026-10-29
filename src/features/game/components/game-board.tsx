import { Pressable, StyleSheet, View } from 'react-native';
import { canPlace } from '../../../game/engine';
import type { Board, Piece } from '../../../game/types';
import { BOARD_SIZE } from '../../../game/types';
import type { PlacementPreview } from '../gestures/placement';
import { theme } from '../../../theme/tokens';
export interface GameBoardProps {
  readonly board: Board; readonly size: number; readonly selected: Piece | null;
  readonly preview: PlacementPreview | null; readonly draggedPiece: Piece | null;
  readonly disabled: boolean; readonly onPlace: (row: number, col: number) => void;
}
export function GameBoard({ board, size, selected, preview, draggedPiece, disabled, onPlace }: GameBoardProps) {
  const previewValid = preview && draggedPiece ? canPlace(board, draggedPiece.shape, preview.row, preview.col) : false;
  const pitch = size / BOARD_SIZE;
  return <View style={[styles.board, { width: size, height: size }]}>
    {board.map((line, row) => <View key={row} style={styles.row}>
      {line.map((cell, col) => {
        const highlighted = preview && draggedPiece && draggedPiece.shape.cells.some((offset) =>
          preview.row + offset.row === row && preview.col + offset.col === col);
        const valid = selected !== null && canPlace(board, selected.shape, row, col);
        return <Pressable key={`${row}:${col}`} accessibilityRole="button"
          accessibilityLabel={`Row ${row + 1}, column ${col + 1}, ${cell ? 'occupied' : 'empty'}${selected ? valid ? ', piece fits' : ', piece cannot fit' : ''}`}
          accessibilityState={{ disabled: disabled || selected === null }}
          disabled={disabled || selected === null} onPress={() => onPlace(row, col)}
          style={({ pressed }) => [styles.cellArea, { width: pitch, height: pitch }, pressed && styles.pressed]}>
          <View style={[styles.cell, { backgroundColor: highlighted ? previewValid ? theme.colors.accent : theme.colors.danger : cell ?? theme.colors.empty,
            borderWidth: highlighted ? 2 : 0, borderColor: previewValid ? theme.colors.text : theme.colors.danger }]} />
        </Pressable>;
      })}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  board: { backgroundColor: theme.colors.board, borderRadius: theme.radius.medium, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cellArea: { padding: 2 },
  cell: { flex: 1, borderRadius: theme.radius.small },
  pressed: { opacity: 0.5 },
});
