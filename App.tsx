import { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/features/home/home-screen';
import { GameScreen } from './src/features/game/game-screen';

export type AppScreen = 'home' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [bestScore, setBestScore] = useState<number>(0);

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
            onBestScoreChange={setBestScore}
            onHome={() => setScreen('home')}
          />
        )}
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
