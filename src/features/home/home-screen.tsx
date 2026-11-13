import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PIECE_COLORS } from '../../theme/colors';
import { theme } from '../../theme/tokens';

export interface HomeScreenProps {
  readonly onStartClassic: () => void;
  readonly onStartAdventure: () => void;
  readonly bestScore: number;
}

export function HomeScreen({ onStartClassic, onStartAdventure, bestScore }: HomeScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 40, 420);

  // Decorative block letters for original, playful branding
  const blockLetters = [
    { char: 'B', color: PIECE_COLORS.amber },
    { char: 'L', color: PIECE_COLORS.rose },
    { char: 'O', color: PIECE_COLORS.cyan },
    { char: 'C', color: PIECE_COLORS.green },
    { char: 'K', color: PIECE_COLORS.violet },
  ];

  const puzzleLetters = [
    { char: 'P', color: PIECE_COLORS.orange },
    { char: 'U', color: PIECE_COLORS.cyan },
    { char: 'Z', color: PIECE_COLORS.amber },
    { char: 'Z', color: PIECE_COLORS.rose },
    { char: 'L', color: PIECE_COLORS.green },
    { char: 'E', color: PIECE_COLORS.violet },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.container, { width: contentWidth }]}>
        {/* Top Header / Branding */}
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <View style={styles.titleRow}>
            {blockLetters.map((item, idx) => (
              <View key={`b-${item.char}-${idx}`} style={[styles.letterTile, { backgroundColor: item.color }]}>
                <Text style={styles.letterText}>{item.char}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.titleRow, styles.puzzleTitleRow]}>
            {puzzleLetters.map((item, idx) => (
              <View key={`p-${item.char}-${idx}`} style={[styles.letterTile, { backgroundColor: item.color }]}>
                <Text style={styles.letterText}>{item.char}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.tagline}>A Little Space to Think</Text>
        </View>

        {/* Decorative Mosaic Art */}
        <View style={styles.mosaicPreview}>
          <View style={styles.mosaicRow}>
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.cyan }]} />
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.amber }]} />
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.rose }]} />
          </View>
          <View style={styles.mosaicRow}>
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.violet }]} />
            <View style={[styles.mosaicCell, { backgroundColor: theme.colors.empty }]} />
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.green }]} />
          </View>
          <View style={styles.mosaicRow}>
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.orange }]} />
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.cyan }]} />
            <View style={[styles.mosaicCell, { backgroundColor: PIECE_COLORS.amber }]} />
          </View>
        </View>

        {/* Best Score Display */}
        {bestScore > 0 && (
          <View style={styles.bestScoreCard}>
            <Text style={styles.bestScoreLabel}>BEST SCORE</Text>
            <Text style={styles.bestScoreValue}>{bestScore}</Text>
          </View>
        )}

        {/* Mode Selection Buttons */}
        <View style={styles.actions}>
          {/* Adventure Mode Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adventure Mode, Stage Puzzles"
            style={({ pressed }) => [styles.modeButton, styles.adventureButton, pressed && styles.pressed]}
            onPress={onStartAdventure}
          >
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>STAGES</Text>
            </View>
            <View style={styles.buttonContent}>
              <Text style={styles.modeIcon}>🗺️</Text>
              <View style={styles.buttonTextGroup}>
                <Text style={styles.modeTitle}>Adventure</Text>
                <Text style={styles.modeSubtitle}>Quest & Stage Challenges</Text>
              </View>
            </View>
          </Pressable>

          {/* Classic Mode Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Classic Mode, Endless 8 by 8 Puzzle"
            style={({ pressed }) => [styles.modeButton, styles.classicButton, pressed && styles.pressed]}
            onPress={onStartClassic}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.modeIcon}>♾️</Text>
              <View style={styles.buttonTextGroup}>
                <Text style={styles.modeTitle}>Classic</Text>
                <Text style={styles.modeSubtitle}>Endless 8×8 Block Puzzle</Text>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.large,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.medium,
  },
  crown: {
    fontSize: 32,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  puzzleTitleRow: {
    marginBottom: 10,
  },
  letterTile: {
    width: 36,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  letterText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tagline: {
    color: theme.colors.muted,
    fontSize: theme.type.small,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  mosaicPreview: {
    backgroundColor: theme.colors.board,
    padding: 12,
    borderRadius: theme.radius.large,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mosaicRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mosaicCell: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.small,
  },
  bestScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.large,
    paddingVertical: theme.spacing.small,
    borderRadius: theme.radius.medium,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bestScoreLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  bestScoreValue: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    width: '100%',
    gap: 16,
    marginBottom: theme.spacing.medium,
  },
  modeButton: {
    width: '100%',
    minHeight: 74,
    borderRadius: theme.radius.large,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  adventureButton: {
    backgroundColor: '#8B5CF6',
  },
  classicButton: {
    backgroundColor: '#10B981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modeIcon: {
    fontSize: 28,
  },
  buttonTextGroup: {
    flex: 1,
  },
  modeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  modeSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: '#EC4899',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
