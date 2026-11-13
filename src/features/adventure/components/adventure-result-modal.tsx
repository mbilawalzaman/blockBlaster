import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/button';
import { theme } from '../../../theme/tokens';
import type { AdventureState } from '../../../game/adventure/types';

export interface AdventureResultModalProps {
  readonly state: AdventureState;
  readonly hasNextLevel: boolean;
  readonly onNextLevel: () => void;
  readonly onReplay: () => void;
  readonly onMap: () => void;
}

export function AdventureResultModal({
  state,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onMap,
}: AdventureResultModalProps) {
  const visible = state.status !== 'playing';
  const isWon = state.status === 'won';

  const stars = state.starsEarned;
  const starString = `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}`;

  let subtitle = '';
  if (isWon) {
    subtitle = `Completed with ${state.movesRemaining} moves to spare! Score: ${state.score}`;
  } else if (state.lossReason === 'moves-exhausted') {
    subtitle = 'You ran out of moves before achieving the goals.';
  } else {
    subtitle = 'No more pieces can fit on the board.';
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay} accessibilityViewIsModal>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.resultEmoji}>{isWon ? '🎉' : '💔'}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {isWon ? 'Level Complete!' : 'Level Failed'}
            </Text>

            {isWon && <Text style={styles.stars}>{starString}</Text>}

            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.actions}>
              {isWon && hasNextLevel && (
                <Button label="Next Level" onPress={onNextLevel} />
              )}
              <Button
                secondary={isWon}
                label={isWon ? 'Play Again' : 'Try Again'}
                onPress={onReplay}
              />
              <Button secondary label="Level Map" onPress={onMap} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.large,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: theme.spacing.large,
    gap: 14,
    borderRadius: theme.radius.large,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultEmoji: {
    fontSize: 48,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  stars: {
    fontSize: 32,
    letterSpacing: 6,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: theme.type.body,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
});
