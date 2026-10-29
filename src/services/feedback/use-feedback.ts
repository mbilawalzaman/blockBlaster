import { useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { playSound } from './play-sound';
import type { MoveFeedback } from '../../features/game/game-controller';

export interface FeedbackPreferences { readonly sound: boolean; readonly vibration: boolean }

export function useFeedback(event: MoveFeedback | undefined, preferences: FeedbackPreferences) {
  // Metro resolves static asset requires to native asset identifiers.
  const place = useAudioPlayer(require('../../../assets/sounds/place.wav'));
  const clear = useAudioPlayer(require('../../../assets/sounds/clear.wav'));
  const combo = useAudioPlayer(require('../../../assets/sounds/combo.wav'));
  const handled = useRef<number | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const token = ++generation.current;
    if (!event || handled.current === event.revision) return;
    handled.current = event.revision;
    if (preferences.sound) {
      const player = event.lines === 0 ? place : event.combo > 1 ? combo : clear;
      void (async () => {
        try {
          place.pause(); clear.pause(); combo.pause();
          await playSound(player, event.lines > 0 ? event.combo : 0, () => generation.current === token);
        } catch (error: unknown) {
          if (__DEV__) console.warn('Optional game audio unavailable', error instanceof Error ? error.message : 'unknown');
        }
      })();
    }
    if (preferences.vibration) {
      void Haptics.impactAsync(event.lines > 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light)
        .catch(() => { /* Unsupported haptics must never interrupt gameplay. */ });
    }
    return () => { generation.current += 1; };
  }, [event, preferences.sound, preferences.vibration, place, clear, combo]);
  useEffect(() => {
    if (!preferences.sound) { place.pause(); clear.pause(); combo.pause(); }
  }, [preferences.sound, place, clear, combo]);
}
