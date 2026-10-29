import { expect, it, vi } from 'vitest';
import { playSound } from '../../src/services/feedback/play-sound';

it('plays through the method API even when playbackRate has only a native getter', async () => {
  const player = { get playbackRate() { return 1; },
    setPlaybackRate: vi.fn(), seekTo: vi.fn().mockResolvedValue(undefined), play: vi.fn() };
  await playSound(player, 4, () => true);
  expect(player.setPlaybackRate).toHaveBeenCalledWith(1.16);
  expect(player.seekTo).toHaveBeenCalledWith(0);
  expect(player.play).toHaveBeenCalledOnce();
});
it('does not play an outdated request after seeking completes', async () => {
  const player = { setPlaybackRate: vi.fn(), seekTo: vi.fn().mockResolvedValue(undefined), play: vi.fn() };
  await playSound(player, 0, () => false);
  expect(player.setPlaybackRate).toHaveBeenCalledWith(1);
  expect(player.play).not.toHaveBeenCalled();
});
