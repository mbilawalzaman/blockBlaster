import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/button';
import { theme } from '../../../theme/tokens';
export interface GameHeaderProps {
  readonly score: number; readonly bestScore: number; readonly combo: number;
  readonly onRestart: () => void;
  readonly onHome?: (() => void) | undefined;
}
export function GameHeader({ score, bestScore, combo, onRestart, onHome }: GameHeaderProps) {
  return <View style={styles.root}>
    <View style={styles.row}><View><Text style={styles.eyebrow}>A LITTLE SPACE TO THINK</Text>
      <Text accessibilityRole="header" style={styles.title}>Block Puzzle</Text></View>
      <View style={styles.headerButtons}>
        {onHome && <Button secondary label="Home" onPress={onHome} />}
        <Button secondary label="Restart" onPress={onRestart} />
      </View>
    </View>
    <View style={styles.scores}>
      <View><Text style={styles.caption}>SCORE</Text><Text style={styles.score}>{score}</Text></View>
      <View><Text style={styles.caption}>SESSION BEST</Text><Text style={styles.best}>{bestScore}</Text></View>
      <Text style={styles.combo}>{combo > 0 ? `×${combo} combo` : 'Make room.\nFind your flow.'}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  root: { gap: theme.spacing.large },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  headerButtons: { flexDirection: 'row', gap: 8 },
  eyebrow: { color: theme.colors.accent, fontSize: 10, letterSpacing: 1.8, marginBottom: 6 },
  title: { color: theme.colors.text, fontSize: theme.type.heading, fontWeight: '800' },
  scores: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  caption: { color: theme.colors.muted, fontSize: 11, letterSpacing: 1.5 },
  score: { color: theme.colors.text, fontSize: theme.type.score, fontWeight: '800', fontVariant: ['tabular-nums'] },
  best: { color: theme.colors.text, fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  combo: { color: theme.colors.accent, fontSize: theme.type.small, lineHeight: 20 },
});
