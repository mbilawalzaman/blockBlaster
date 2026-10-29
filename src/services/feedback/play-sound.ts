/** Minimal playback boundary, independent of the native audio implementation. */
export interface SoundPlayer {
  setPlaybackRate(rate: number): void;
  seekTo(seconds: number): Promise<void>;
  play(): void;
}
export async function playSound(player: SoundPlayer, combo: number, isCurrent: () => boolean): Promise<void> {
  player.setPlaybackRate(combo > 1 ? Math.min(1.5, 1 + (combo - 2) * 0.08) : 1);
  await player.seekTo(0);
  if (isCurrent()) player.play();
}
