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
import { TournamentCenter } from './tournament';
import { tournamentEngine } from './tournament/tournamentEngine';
import './App.css';
import './workshop/workshop.css';
import './tournament/tournament.css';

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
  collisions: 0,
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [finalStats, setFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWorkshop, setShowWorkshop] = useState(false);
  const [showTournament, setShowTournament] = useState(false);
  const [adjustedFinalStats, setAdjustedFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [tournamentTrackId, setTournamentTrackId] = useState<string | null>(null);
  const [tournamentResult, setTournamentResult] = useState<{ trackId: string; score: number } | null>(null);

  const workshop = useWorkshop();
  const lastScoreUpdateRef = useRef(0);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);

    if (tournamentTrackId && gameState === 'playing') {
      const now = Date.now();
      if (now - lastScoreUpdateRef.current >= 250) {
        lastScoreUpdateRef.current = now;
        const adjustedScore = workshop.calculateFinalScore(newStats.score);
        tournamentEngine.updateLiveScoreFromGameStats(
          newStats.distance,
          newStats.maxHeight,
          newStats.airCurrentCount,
          newStats.shadowTracking,
          newStats.flightStability,
          newStats.collisions,
          newStats.time,
        );
        tournamentEngine.addScoringEvent('checkpoint', Math.floor(adjustedScore * 0.02), '累计得分奖励');
      }
    }
  }, [tournamentTrackId, gameState, workshop]);

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

    if (tournamentTrackId) {
      const result = tournamentEngine.completeTrack(adjustedScore);
      if (result) {
        setTournamentResult({ trackId: tournamentTrackId, score: result.score });
      }
      setTournamentTrackId(null);
    }

    setGameState('gameover');
  }, [workshop, tournamentTrackId]);

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const initialConfig = {
      ...DEFAULT_GAME_CONFIG,
      flightParams: workshop.flightParams,
    };

    const engine = new GameEngine(
      containerRef.current,
      {
        onStatsUpdate: handleStatsUpdate,
        onStateChange: handleStateChange,
        onGameOver: handleGameOver,
      },
      initialConfig
    );

    engine.init();
    gameEngineRef.current = engine;
    setIsInitialized(true);

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, [handleStatsUpdate, handleStateChange, handleGameOver, isInitialized, workshop.flightParams]);

  useEffect(() => {
    if (gameEngineRef.current && isInitialized) {
      gameEngineRef.current.setFlightParams(workshop.flightParams);
    }
  }, [workshop.flightParams, isInitialized]);

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

  const handleOpenTournament = () => {
    setShowTournament(true);
  };

  const handleCloseTournament = () => {
    setShowTournament(false);
  };

  const handleStartTournamentTrack = (trackId: string) => {
    const configOverride = tournamentEngine.getGameConfigOverride(trackId);
    const success = tournamentEngine.selectTrack(trackId);
    if (!success) return;

    setTournamentTrackId(trackId);
    setShowTournament(false);
    lastScoreUpdateRef.current = 0;

    if (gameEngineRef.current && configOverride) {
      gameEngineRef.current.reconfigure({
        worldSize: configOverride.worldSize,
        gravity: configOverride.gravity,
        airCurrentSpawnRate: configOverride.airCurrentSpawnRate,
        minAirCurrentStrength: configOverride.minAirCurrentStrength,
        maxAirCurrentStrength: configOverride.maxAirCurrentStrength,
        minBuildingHeight: configOverride.minBuildingHeight,
        maxBuildingHeight: configOverride.maxBuildingHeight,
        buildingDensity: configOverride.buildingDensity,
        cloudCoverage: configOverride.cloudCoverage,
        turbulenceLevel: configOverride.turbulenceLevel,
      });

      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + configOverride.gravity)),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - configOverride.turbulenceLevel * 0.3),
      });

      gameEngineRef.current.restart();
    }
  };

  return (
    <div className="game-wrapper">
      <div
        id="game-container"
        ref={containerRef}
        className="game-container"
      />

      {gameState === 'menu' && (
        <MainMenu onStart={handleStart} onWorkshop={handleOpenWorkshop} onTournament={handleOpenTournament} />
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

      {showTournament && (
        <TournamentCenter
          onClose={handleCloseTournament}
          onStartTrack={handleStartTournamentTrack}
          lastResult={tournamentResult}
          onClearResult={() => setTournamentResult(null)}
        />
      )}
    </div>
  );
}

export default App;
