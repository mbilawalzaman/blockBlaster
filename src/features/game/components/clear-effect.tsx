import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import type { MoveFeedback } from '../game-controller';
import { BOARD_SIZE } from '../../../game/types';
import { PIECE_COLORS } from '../../../theme/colors';
import { theme } from '../../../theme/tokens';

export interface ClearEffectProps { readonly event: MoveFeedback; readonly size: number }
const palette = Object.values(PIECE_COLORS);
export function ClearEffect({ event, size }: ClearEffectProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReducedMotion(value);
    }).catch(() => { /* Keep the static, reduced-motion default. */ });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: reducedMotion ? 650 : 850,
      useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);
  const opacity = reducedMotion ? progress.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0] })
    : progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 0.9, 0] });
  const pitch = size / BOARD_SIZE;
  return <Animated.View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { opacity }]}>
    {event.cells.map(({ row, col }, index) => <Animated.View key={`${row}:${col}`}
      style={[styles.flash, { left: col * pitch + 2, top: row * pitch + 2,
        width: pitch - 4, height: pitch - 4, backgroundColor: palette[index % palette.length],
        transform: [{ scale: reducedMotion ? 1 : progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.9, 1.1, 0.4] }) }] }]} />)}
    {!reducedMotion && event.cells.filter((_, i) => i % 2 === 0).map(({ row, col }, index) =>
      <Animated.View key={`spark-${row}:${col}`} style={[styles.spark, {
        left: (col + 0.5) * pitch, top: (row + 0.5) * pitch,
        backgroundColor: palette[index % palette.length],
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -45 - index % 3 * 12] }) },
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 ? 24 : -24] }) }],
      }]} />)}
    <Animated.View style={[styles.banner, { top: size * 0.38,
      transform: [{ translateY: reducedMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [8, -24] }) }] }]}>
      <Text style={styles.title}>{event.combo > 1 ? `Combo ×${event.combo}!` : event.lines > 1 ? `${event.lines} lines!` : 'Beautiful clear!'}</Text>
      <Text style={styles.points}>+{event.points}</Text>
    </Animated.View>
  </Animated.View>;
}
const styles = StyleSheet.create({
  flash: { position: 'absolute', borderRadius: theme.radius.small, borderWidth: 2, borderColor: theme.colors.text },
  spark: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  banner: { position: 'absolute', alignSelf: 'center', backgroundColor: theme.colors.overlay,
    borderRadius: theme.radius.medium, paddingHorizontal: 20, paddingVertical: 10, alignItems: 'center' },
  title: { color: theme.colors.accent, fontSize: theme.type.heading, fontWeight: '900' },
  points: { color: theme.colors.text, fontSize: theme.type.body, fontWeight: '700' },
});
