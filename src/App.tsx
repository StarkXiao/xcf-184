import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import type { GameState, GameStats } from './game/types';
import { DEFAULT_GAME_CONFIG } from './game/types';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverScreen } from './components/GameOverScreen';
import './App.css';

const DEFAULT_STATS: GameStats = {
  score: 0,
  distance: 0,
  height: 80,
  time: 0,
  maxHeight: 80,
  airCurrentCount: 0,
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [finalStats, setFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleGameOver = useCallback((gameOverStats: GameStats) => {
    setFinalStats(gameOverStats);
    setGameState('gameover');
  }, []);

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const engine = new GameEngine(
      containerRef.current,
      {
        onStatsUpdate: handleStatsUpdate,
        onStateChange: handleStateChange,
        onGameOver: handleGameOver,
      },
      DEFAULT_GAME_CONFIG
    );

    engine.init();
    gameEngineRef.current = engine;
    setIsInitialized(true);

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, [handleStatsUpdate, handleStateChange, handleGameOver, isInitialized]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          gameEngineRef.current?.pause();
        } else if (gameState === 'paused') {
          gameEngineRef.current?.resume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handleStart = () => {
    gameEngineRef.current?.start();
  };

  const handlePause = () => {
    gameEngineRef.current?.pause();
  };

  const handleResume = () => {
    gameEngineRef.current?.resume();
  };

  const handleRestart = () => {
    gameEngineRef.current?.restart();
  };

  const handleMainMenu = () => {
    gameEngineRef.current?.pause();
    setGameState('menu');
  };

  return (
    <div className="game-wrapper">
      <div
        id="game-container"
        ref={containerRef}
        className="game-container"
      />

      {gameState === 'menu' && <MainMenu onStart={handleStart} />}

      {gameState === 'playing' && (
        <GameHUD stats={stats} onPause={handlePause} />
      )}

      {gameState === 'paused' && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}

      {gameState === 'gameover' && (
        <GameOverScreen
          stats={finalStats}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}

export default App;
