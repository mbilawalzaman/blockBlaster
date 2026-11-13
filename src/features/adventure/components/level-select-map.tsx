import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LevelConfig } from '../../../game/adventure/types';
import type { AdventureSaveData } from '../../../services/storage/adventure-storage';
import { theme } from '../../../theme/tokens';
import { Button } from '../../../components/ui/button';

export interface LevelSelectMapProps {
  readonly levels: readonly LevelConfig[];
  readonly progress: AdventureSaveData;
  readonly onSelectLevel: (level: LevelConfig) => void;
  readonly onBack: () => void;
}

export function LevelSelectMap({
  levels,
  progress,
  onSelectLevel,
  onBack,
}: LevelSelectMapProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 468);

  const totalStars = Object.values(progress.records).reduce((sum, r) => sum + r.stars, 0);
  const maxStars = levels.length * 3;

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.header, { width: contentWidth }]}>
        <Button secondary label="Home" onPress={onBack} />
        <View style={styles.headerTitleGroup}>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Adventure Map
          </Text>
          <Text style={styles.starsTotal}>
            ⭐ {totalStars} / {maxStars}
          </Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.grid, { width: contentWidth }]}>
          {levels.map((level) => {
            const isUnlocked = level.id <= progress.highestUnlockedLevel;
            const record = progress.records[level.id];
            const stars = record?.stars ?? 0;

            return (
              <Pressable
                key={level.id}
                accessibilityRole="button"
                accessibilityLabel={`Level ${level.id}, ${level.name}, ${
                  isUnlocked ? `${stars} stars, unlocked` : 'locked'
                }`}
                accessibilityState={{ disabled: !isUnlocked }}
                disabled={!isUnlocked}
                onPress={() => onSelectLevel(level)}
                style={({ pressed }) => [
                  styles.card,
                  isUnlocked ? styles.unlockedCard : styles.lockedCard,
                  pressed && isUnlocked && styles.pressed,
                ]}
              >
                <View style={styles.badgeRow}>
                  <Text style={[styles.levelNum, !isUnlocked && styles.lockedText]}>
                    {level.id}
                  </Text>
                  <Text style={styles.lockOrStar}>
                    {isUnlocked
                      ? `${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}`
                      : '🔒'}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[styles.levelName, !isUnlocked && styles.lockedText]}
                >
                  {level.name}
                </Text>

                {isUnlocked && record && (
                  <Text style={styles.scoreText}>Best: {record.highscore}</Text>
                )}
                {isUnlocked && !record && (
                  <Text style={styles.movesText}>{level.moveLimit} moves</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.medium,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.type.heading,
    fontWeight: '800',
  },
  starsTotal: {
    color: theme.colors.accent,
    fontSize: theme.type.small,
    fontWeight: '700',
    marginTop: 2,
  },
  scroll: {
    paddingVertical: theme.spacing.medium,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    minHeight: 90,
    padding: 12,
    borderRadius: theme.radius.medium,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  unlockedCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  lockedCard: {
    backgroundColor: theme.colors.board,
    borderColor: 'transparent',
    opacity: 0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelNum: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  lockOrStar: {
    fontSize: 14,
  },
  levelName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  scoreText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  movesText: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  lockedText: {
    color: theme.colors.muted,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
