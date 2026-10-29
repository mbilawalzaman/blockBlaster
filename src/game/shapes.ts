import { PIECE_COLORS } from '../theme/colors';
import type { Shape } from './types';

function shape(id: string, color: string, rows: readonly string[]): Shape {
  const cells = rows.flatMap((row, r) => [...row].flatMap((cell, col) =>
    cell === '#' ? [Object.freeze({ row: r, col })] : []));
  return Object.freeze({ id, color, cells: Object.freeze(cells) });
}

export const SHAPES: readonly Shape[] = Object.freeze([
  shape('single', PIECE_COLORS.amber, ['#']),
  shape('horizontal-2', PIECE_COLORS.cyan, ['##']),
  shape('vertical-2', PIECE_COLORS.rose, ['#', '#']),
  shape('horizontal-3', PIECE_COLORS.cyan, ['###']),
  shape('vertical-3', PIECE_COLORS.rose, ['#', '#', '#']),
  shape('square-2', PIECE_COLORS.violet, ['##', '##']),
  shape('corner-right', PIECE_COLORS.green, ['#.', '##']),
  shape('corner-left', PIECE_COLORS.green, ['.#', '##']),
  shape('corner-down', PIECE_COLORS.green, ['##', '#.']),
  shape('corner-up', PIECE_COLORS.green, ['##', '.#']),
  shape('horizontal-4', PIECE_COLORS.orange, ['####']),
  shape('vertical-4', PIECE_COLORS.orange, ['#', '#', '#', '#']),
  shape('tee', PIECE_COLORS.violet, ['###', '.#.']),
  shape('ell', PIECE_COLORS.amber, ['#.', '#.', '##']),
  shape('zigzag', PIECE_COLORS.rose, ['.##', '##.']),
]);
