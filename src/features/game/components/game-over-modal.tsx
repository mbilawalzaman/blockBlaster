import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
export interface GameOverModalProps {
  readonly open: boolean; readonly score: number; readonly bestScore: number;
  readonly onReplay: () => void;
}
export function GameOverModal({ open, score, bestScore, onReplay }: GameOverModalProps) {
  return <ConfirmDialog open={open} title="A lovely little mosaic."
    description={`No pieces fit. You scored ${score} points. Session best: ${bestScore}. Ready for a fresh board?`}
    confirmLabel="Play again" onConfirm={onReplay} />;
}
