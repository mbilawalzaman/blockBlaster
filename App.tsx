import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/features/home/home-screen';
import { GameScreen } from './src/features/game/game-screen';
import type { UserPreferences } from './src/services/storage/preferences-storage';
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from './src/services/storage/preferences-storage';
import { loadBestScore, saveBestScore } from './src/services/storage/score-storage';

export type AppScreen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [bestScore, setBestScore] = useState<number>(0);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    void loadPreferences().then(setPreferences);
    void loadBestScore().then((persistedScore) => {
      setBestScore((prev) => Math.max(prev, persistedScore));
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
    setPreferences(nextPreferences);
    void savePreferences(nextPreferences);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {screen === 'home' ? (
          <HomeScreen
            bestScore={bestScore}
            onStartClassic={() => setScreen('game')}
          />
        ) : (
          <GameScreen
            initialBestScore={bestScore}
            onBestScoreChange={handleBestScoreChange}
            preferences={preferences}
            onPreferencesChange={handlePreferencesChange}
            onHome={() => setScreen('home')}
          />
        )}
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
