import { StyleSheet, Text, View } from 'react-native';
import type { Piece } from '../../../game/types';
import { BOARD_SIZE } from '../../../game/types';
import { theme } from '../../../theme/tokens';
import { DraggablePiece } from './draggable-piece';
export interface PieceTrayProps {
  readonly pieces: readonly (Piece | null)[]; readonly selectedId: string | null;
  readonly disabled: boolean; readonly width: number; readonly boardSize: number;
  readonly onSelect: (piece: Piece) => void;
  readonly onBegin: (piece: Piece) => boolean;
  readonly onMove: (x: number, y: number) => void;
  readonly onDrop: (x: number, y: number) => boolean;
  readonly onFinish: () => void;
}
export function PieceTray({ pieces, selectedId, disabled, width, boardSize, onSelect,
  onBegin, onMove, onDrop, onFinish }: PieceTrayProps) {
  const unit = Math.min(20, (width / 3 - 24) / 4);
  return <View style={styles.tray}>{pieces.map((piece, index) => piece
    ? <DraggablePiece key={`${piece.id}:${boardSize}`} piece={piece} unit={unit} boardUnit={boardSize / BOARD_SIZE}
      selected={selectedId === piece.id} disabled={disabled} onSelect={() => onSelect(piece)}
      onBegin={() => onBegin(piece)} onMove={onMove} onDrop={onDrop} onFinish={onFinish} />
    : <View key={`empty-${index}`} style={styles.slot}><Text style={styles.empty}>Placed</Text></View>)}
  </View>;
}
const styles = StyleSheet.create({
  tray: { flexDirection: 'row', gap: 8, zIndex: 20 },
  slot: { flex: 1, minHeight: 124, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.medium, justifyContent: 'center', alignItems: 'center' },
  empty: { color: theme.colors.muted, fontSize: theme.type.small },
});
