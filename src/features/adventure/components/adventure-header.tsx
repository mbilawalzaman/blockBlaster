import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/ui/button';
import { theme } from '../../../theme/tokens';
import type { AdventureState, LevelObjective } from '../../../game/adventure/types';

export interface AdventureHeaderProps {
  readonly state: AdventureState;
  readonly onMap: () => void;
  readonly onRestart: () => void;
}

function renderObjectiveBadge(obj: LevelObjective, state: AdventureState) {
  let progress = state.objectiveProgress[obj.id] ?? 0;
  if (obj.type === 'score-target') {
    progress = state.score;
  }
  const isMet = progress >= obj.target;

  let label = '';
  let icon = '🎯';

  switch (obj.type) {
    case 'score-target':
      icon = '🏆';
      label = `${Math.min(progress, obj.target)}/${obj.target} pts`;
      break;
    case 'line-target':
      icon = '📏';
      label = `${Math.min(progress, obj.target)}/${obj.target} lines`;
      break;
    case 'color-target':
      icon = '💎';
      label = `${Math.min(progress, obj.target)}/${obj.target}`;
      break;
    case 'clear-obstacles':
      icon = '🪨';
      label = `${Math.min(progress, obj.target)}/${obj.target}`;
      break;
  }

  return (
    <View key={obj.id} style={[styles.objBadge, isMet && styles.objBadgeDone]}>
      {obj.type === 'color-target' && (
        <View style={[styles.colorDot, { backgroundColor: obj.color }]} />
      )}
      <Text style={styles.objIcon}>{icon}</Text>
      <Text style={[styles.objText, isMet && styles.objTextDone]}>
        {label} {isMet ? '✓' : ''}
      </Text>
    </View>
  );
}

export function AdventureHeader({ state, onMap, onRestart }: AdventureHeaderProps) {
  const { level, movesRemaining, score } = state;

  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <Button secondary label="Map" onPress={onMap} />
        <View style={styles.titleContainer}>
          <Text style={styles.eyebrow}>ADVENTURE MODE</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Level {level.id}: {level.name}
          </Text>
        </View>
        <Button secondary label="Restart" onPress={onRestart} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.movesCard}>
          <Text style={styles.movesNumber}>{movesRemaining}</Text>
          <Text style={styles.movesLabel}>MOVES LEFT</Text>
        </View>
        <View style={styles.scoreGroup}>
          <Text style={styles.scoreCaption}>SCORE</Text>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      <View style={styles.objectivesRow}>
        {level.objectives.map((obj) => renderObjectiveBadge(obj, state))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.heading,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  movesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  movesNumber: {
    color: '#FBBF24',
    fontSize: 26,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  movesLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scoreGroup: {
    alignItems: 'flex-end',
  },
  scoreCaption: {
    color: theme.colors.muted,
    fontSize: 10,
    letterSpacing: 1,
  },
  scoreText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  objectivesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  objBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.board,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.small,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  objBadgeDone: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  objIcon: {
    fontSize: 12,
  },
  objText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  objTextDone: {
    color: '#34D399',
  },
});
