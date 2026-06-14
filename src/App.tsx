import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import type { GameState, GameStats } from './game/types';
import { DEFAULT_GAME_CONFIG } from './game/types';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { PauseMenu } from './components/PauseMenu';
import { GameOverScreen } from './components/GameOverScreen';
import { Workshop } from './workshop/components/Workshop';
import { useWorkshop } from './workshop/useWorkshop';
import './App.css';
import './workshop/workshop.css';

const DEFAULT_STATS: GameStats = {
  score: 0,
  distance: 0,
  height: 80,
  time: 0,
  maxHeight: 80,
  airCurrentCount: 0,
  shadowTracking: 0.5,
  flightStability: 1,
  shadowBonus: 0,
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [finalStats, setFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWorkshop, setShowWorkshop] = useState(false);
  const [adjustedFinalStats, setAdjustedFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const workshop = useWorkshop();

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleGameOver = useCallback((gameOverStats: GameStats) => {
    setFinalStats(gameOverStats);

    const adjustedScore = workshop.calculateFinalScore(gameOverStats.score);
    const coins = workshop.calculateCoinsEarned(gameOverStats.score);

    setAdjustedFinalStats({
      ...gameOverStats,
      score: adjustedScore,
      distance: gameOverStats.distance + gameOverStats.distance * workshop.state.distanceBonus / 100,
      maxHeight: gameOverStats.maxHeight + gameOverStats.maxHeight * workshop.state.heightBonus / 100,
    });
    setEarnedCoins(coins);

    workshop.addCoins(coins);
    setGameState('gameover');
  }, [workshop]);

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

  const handleOpenWorkshop = () => {
    setShowWorkshop(true);
  };

  const handleCloseWorkshop = () => {
    setShowWorkshop(false);
  };

  const handleStartFromWorkshop = () => {
    setShowWorkshop(false);
    gameEngineRef.current?.restart();
  };

  return (
    <div className="game-wrapper">
      <div
        id="game-container"
        ref={containerRef}
        className="game-container"
      />

      {gameState === 'menu' && (
        <MainMenu onStart={handleStart} onWorkshop={handleOpenWorkshop} />
      )}

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
          stats={adjustedFinalStats}
          baseStats={finalStats}
          earnedCoins={earnedCoins}
          scoreBonus={workshop.state.totalScoreBonus}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
          onWorkshop={handleOpenWorkshop}
        />
      )}

      {showWorkshop && (
        <Workshop
          onClose={handleCloseWorkshop}
          onStartGame={handleStartFromWorkshop}
        />
      )}
    </div>
  );
}

export default App;
