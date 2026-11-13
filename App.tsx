import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/features/home/home-screen';
import { GameScreen } from './src/features/game/game-screen';
import { LevelSelectMap } from './src/features/adventure/components/level-select-map';
import { AdventureScreen } from './src/features/adventure/adventure-screen';
import { ADVENTURE_LEVELS } from './src/game/adventure/levels';
import type { LevelConfig } from './src/game/adventure/types';
import type { UserPreferences } from './src/services/storage/preferences-storage';
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
} from './src/services/storage/preferences-storage';
import { loadBestScore, saveBestScore } from './src/services/storage/score-storage';
import type { AdventureSaveData } from './src/services/storage/adventure-storage';
import {
  DEFAULT_ADVENTURE_PROGRESS,
  loadAdventureProgress,
  mergeAdventureProgress,
  saveAdventureLevelCompletion,
} from './src/services/storage/adventure-storage';

export type AppScreen = 'home' | 'classic' | 'adventure-map' | 'adventure-play';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [bestScore, setBestScore] = useState<number>(0);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [adventureProgress, setAdventureProgress] = useState<AdventureSaveData>(DEFAULT_ADVENTURE_PROGRESS);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig>(
    ADVENTURE_LEVELS[0] ?? {
      id: 1,
      name: 'First Steps',
      moveLimit: 12,
      levelSeed: 101,
      initialBoard: [],
      objectives: [],
      starThresholds: { minRemainingMoves2: 4, minRemainingMoves3: 7 },
    },
  );
  const preferencesChanged = useRef(false);

  useEffect(() => {
    void loadPreferences().then((storedPreferences) => {
      if (!preferencesChanged.current) setPreferences(storedPreferences);
    });
    void loadBestScore().then((persistedScore) => {
      setBestScore((prev) => Math.max(prev, persistedScore));
    });
    void loadAdventureProgress().then((progress) => {
      setAdventureProgress((current) => mergeAdventureProgress(current, progress));
    });
  }, []);

  function handleBestScoreChange(nextScore: number) {
    setBestScore((prev) => {
      const updated = Math.max(prev, nextScore);
      void saveBestScore(updated);
      return updated;
    });
  }

  function handlePreferencesChange(nextPreferences: UserPreferences) {
    preferencesChanged.current = true;
    setPreferences(nextPreferences);
    void savePreferences(nextPreferences);
  }

  const handleAdventureLevelCompleted = useCallback(
    (levelId: number, stars: 1 | 2 | 3, score: number) => {
      void saveAdventureLevelCompletion(levelId, stars, score).then((progress) => {
        setAdventureProgress((current) => mergeAdventureProgress(current, progress));
      });
    },
    [],
  );

  const nextLevel = ADVENTURE_LEVELS.find((lvl) => lvl.id === currentLevel.id + 1);

  function handleNextLevel() {
    if (nextLevel) {
      setCurrentLevel(nextLevel);
    } else {
      setScreen('adventure-map');
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {screen === 'home' && (
          <HomeScreen
            bestScore={bestScore}
            onStartClassic={() => setScreen('classic')}
            onStartAdventure={() => setScreen('adventure-map')}
          />
        )}

        {screen === 'classic' && (
          <GameScreen
            initialBestScore={bestScore}
            onBestScoreChange={handleBestScoreChange}
            preferences={preferences}
            onPreferencesChange={handlePreferencesChange}
            onHome={() => setScreen('home')}
          />
        )}

        {screen === 'adventure-map' && (
          <LevelSelectMap
            levels={ADVENTURE_LEVELS}
            progress={adventureProgress}
            onSelectLevel={(lvl) => {
              setCurrentLevel(lvl);
              setScreen('adventure-play');
            }}
            onBack={() => setScreen('home')}
          />
        )}

        {screen === 'adventure-play' && (
          <AdventureScreen
            key={currentLevel.id}
            level={currentLevel}
            onMap={() => setScreen('adventure-map')}
            onLevelCompleted={handleAdventureLevelCompleted}
            onNextLevel={nextLevel ? handleNextLevel : undefined}
            hasNextLevel={Boolean(nextLevel)}
            preferences={preferences}
          />
        )}

        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
