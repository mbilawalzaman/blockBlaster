import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Shape, Piece } from '../../../game/types';
import { BOARD_SIZE } from '../../../game/types';
import type { PlacementPreview } from '../gestures/placement';
import { theme } from '../../../theme/tokens';
import type { ObstacleData } from '../../../game/adventure/types';

export type GameBoardCell = string | ObstacleData | null;
export type GenericBoard = readonly (readonly GameBoardCell[])[];

export function canPlaceOnGenericBoard(board: GenericBoard, shape: Shape, row: number, col: number): boolean {
  if (!Number.isInteger(row) || !Number.isInteger(col) || shape.cells.length === 0) return false;
  return shape.cells.every((cell) => {
    const targetRow = row + cell.row;
    const targetCol = col + cell.col;
    return (
      targetRow >= 0 &&
      targetRow < BOARD_SIZE &&
      targetCol >= 0 &&
      targetCol < BOARD_SIZE &&
      board[targetRow]?.[targetCol] === null
    );
  });
}

export interface GameBoardProps {
  readonly board: GenericBoard;
  readonly size: number;
  readonly selected: Piece | null;
  readonly preview: PlacementPreview | null;
  readonly draggedPiece: Piece | null;
  readonly disabled: boolean;
  readonly onPlace: (row: number, col: number) => void;
}

export function GameBoard({
  board,
  size,
  selected,
  preview,
  draggedPiece,
  disabled,
  onPlace,
}: GameBoardProps) {
  const previewValid =
    preview && draggedPiece ? canPlaceOnGenericBoard(board, draggedPiece.shape, preview.row, preview.col) : false;
  const pitch = size / BOARD_SIZE;

  return (
    <View style={[styles.board, { width: size, height: size }]}>
      {board.map((line, row) => (
        <View key={row} style={styles.row}>
          {line.map((cell, col) => {
            const highlighted =
              preview &&
              draggedPiece &&
              draggedPiece.shape.cells.some(
                (offset) => preview.row + offset.row === row && preview.col + offset.col === col,
              );
            const valid = selected !== null && canPlaceOnGenericBoard(board, selected.shape, row, col);

            // Accessibility label construction
            let cellDesc = 'empty';
            let cellColor: string = theme.colors.empty;
            let obstacleBadge: string | null = null;

            if (typeof cell === 'string') {
              cellDesc = 'occupied';
              cellColor = cell;
            } else if (cell !== null && typeof cell === 'object') {
              cellDesc = `${cell.type} obstacle, ${cell.hp} hit remaining`;
              cellColor = cell.type === 'stone' ? '#475569' : '#38BDF8';
              obstacleBadge = cell.type === 'stone' ? '🪨' : cell.hp === 1 ? '⚡' : '❄️';
            }

            const accessibleLabel = `Row ${row + 1}, column ${col + 1}, ${cellDesc}${
              selected ? (valid ? ', piece fits' : ', piece cannot fit') : ''
            }`;

            return (
              <Pressable
                key={`${row}:${col}`}
                accessibilityRole="button"
                accessibilityLabel={accessibleLabel}
                accessibilityState={{ disabled: disabled || selected === null }}
                disabled={disabled || selected === null}
                onPress={() => onPlace(row, col)}
                style={({ pressed }) => [
                  styles.cellArea,
                  { width: pitch, height: pitch },
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.cell,
                    {
                      backgroundColor: highlighted
                        ? previewValid
                          ? theme.colors.accent
                          : theme.colors.danger
                        : cellColor,
                      borderWidth: highlighted ? 2 : typeof cell === 'object' && cell !== null ? 1 : 0,
                      borderColor: highlighted
                        ? previewValid
                          ? theme.colors.text
                          : theme.colors.danger
                        : typeof cell === 'object' && cell !== null
                        ? cell.type === 'stone'
                          ? '#64748B'
                          : '#7DD3FC'
                        : 'transparent',
                    },
                  ]}
                >
                  {obstacleBadge && (
                    <Text style={styles.obstacleIcon} accessibilityElementsHidden>
                      {obstacleBadge}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: theme.colors.board,
    borderRadius: theme.radius.medium,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  cellArea: { padding: 2 },
  cell: {
    flex: 1,
    borderRadius: theme.radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  obstacleIcon: {
    fontSize: 14,
  },
  pressed: { opacity: 0.5 },
});
