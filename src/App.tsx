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
import { tournamentStateEmitter } from './tournament/useTournament';
import { TrainingCenter } from './training';
import { trainingEngine } from './training/trainingEngine';
import { trainingStateEmitter } from './training/useTraining';
import { WeatherLab } from './weatherLab';
import { weatherLabEngine } from './weatherLab/weatherLabEngine';
import type { WeatherScene, FlightDataPoint } from './weatherLab/types';
import './App.css';
import './workshop/workshop.css';
import './tournament/tournament.css';
import './training/training.css';
import './weatherLab/weatherLab.css';

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
  const [showTraining, setShowTraining] = useState(false);
  const [adjustedFinalStats, setAdjustedFinalStats] = useState<GameStats>(DEFAULT_STATS);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [tournamentTrackId, setTournamentTrackId] = useState<string | null>(null);
  const [tournamentResult, setTournamentResult] = useState<{ trackId: string; score: number } | null>(null);
  const [trainingLessonId, setTrainingLessonId] = useState<string | null>(null);
  const [trainingResult, setTrainingResult] = useState<{ lessonId: string; score: number } | null>(null);
  const [showWeatherLab, setShowWeatherLab] = useState(false);
  const [weatherLabSceneId, setWeatherLabSceneId] = useState<string | null>(null);
  const [, setForceUpdate] = useState(0);
  const flightDataPointsRef = useRef<FlightDataPoint[]>([]);
  const flightDataLastSaveTimeRef = useRef<number>(0);

  const workshop = useWorkshop();

  const tournamentTrackIdRef = useRef<string | null>(null);
  const trainingLessonIdRef = useRef<string | null>(null);
  const weatherLabSceneIdRef = useRef<string | null>(null);
  const gameStateRef = useRef<GameState>('menu');
  const lastScoreUpdateRef = useRef(0);

  useEffect(() => {
    tournamentTrackIdRef.current = tournamentTrackId;
  }, [tournamentTrackId]);

  useEffect(() => {
    trainingLessonIdRef.current = trainingLessonId;
  }, [trainingLessonId]);

  useEffect(() => {
    weatherLabSceneIdRef.current = weatherLabSceneId;
  }, [weatherLabSceneId]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);

    const currentTrackId = tournamentTrackIdRef.current;
    if (currentTrackId && gameStateRef.current === 'playing') {
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
        tournamentStateEmitter.emit();
        setForceUpdate((n) => n + 1);
      }
    }

    const currentWeatherSceneId = weatherLabSceneIdRef.current;
    if (currentWeatherSceneId && gameStateRef.current === 'playing') {
      const now = Date.now();
      if (now - flightDataLastSaveTimeRef.current >= 500) {
        flightDataLastSaveTimeRef.current = now;
        const dataPoint = gameEngineRef.current?.getCurrentFlightDataPoint();
        if (dataPoint) {
          flightDataPointsRef.current.push(dataPoint);
          if (flightDataPointsRef.current.length > 500) {
            flightDataPointsRef.current = flightDataPointsRef.current.slice(-500);
          }
        }
      }
    }
  }, [workshop]);

  const handleStateChange = useCallback((state: GameState) => {
    gameStateRef.current = state;
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

    const currentTrackId = tournamentTrackIdRef.current;
    if (currentTrackId) {
      const result = tournamentEngine.completeTrack(adjustedScore);
      if (result) {
        setTournamentResult({ trackId: currentTrackId, score: result.score });
      }
      tournamentTrackIdRef.current = null;
      setTournamentTrackId(null);
      tournamentStateEmitter.emit();
    }

    const currentLessonId = trainingLessonIdRef.current;
    if (currentLessonId) {
      const result = trainingEngine.completeLesson(adjustedScore);
      if (result) {
        setTrainingResult({ lessonId: currentLessonId, score: result.score });
        workshop.addCoins(result.coinReward);
      }
      trainingLessonIdRef.current = null;
      setTrainingLessonId(null);
      trainingStateEmitter.emit();
    }

    const currentWeatherSceneId = weatherLabSceneIdRef.current;
    if (currentWeatherSceneId && gameEngineRef.current) {
      const scene = weatherLabEngine.getSceneById(currentWeatherSceneId);
      if (scene) {
        const weatherConfig = gameEngineRef.current.getWeatherConfig();
        const windField = gameEngineRef.current.getWindField();
        const flightParams = gameEngineRef.current.getFlightParams();

        weatherLabEngine.createFlightRecord(
          currentWeatherSceneId,
          scene.name,
          gameOverStats,
          weatherConfig,
          windField,
          flightDataPointsRef.current,
          flightParams ? {
            equippedParts: workshop.equipped as unknown as Record<string, string | null>,
            flightParams: flightParams as unknown as Record<string, number>,
          } : undefined
        );
      }
      weatherLabSceneIdRef.current = null;
      setWeatherLabSceneId(null);
      flightDataPointsRef.current = [];
    }

    setGameState('gameover');
  }, [workshop]);

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
    const currentTrackId = tournamentTrackIdRef.current;
    if (currentTrackId) {
      const success = tournamentEngine.selectTrack(currentTrackId);
      if (success) {
        tournamentStateEmitter.emit();
      }
    }
    const currentLessonId = trainingLessonIdRef.current;
    if (currentLessonId) {
      const success = trainingEngine.startLesson(currentLessonId);
      if (success) {
        trainingStateEmitter.emit();
      }
    }
    const currentWeatherSceneId = weatherLabSceneIdRef.current;
    if (currentWeatherSceneId) {
      const scene = weatherLabEngine.getSceneById(currentWeatherSceneId);
      if (scene) {
        weatherLabEngine.setCurrentScene(scene);
      }
    }
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;
    gameEngineRef.current?.restart();
  };

  const handleMainMenu = () => {
    gameEngineRef.current?.pause();
    if (tournamentTrackIdRef.current) {
      tournamentTrackIdRef.current = null;
      setTournamentTrackId(null);
    }
    if (trainingLessonIdRef.current) {
      trainingLessonIdRef.current = null;
      setTrainingLessonId(null);
    }
    if (weatherLabSceneIdRef.current) {
      weatherLabSceneIdRef.current = null;
      setWeatherLabSceneId(null);
      flightDataPointsRef.current = [];
    }
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

  const handleOpenTraining = () => {
    setShowTraining(true);
  };

  const handleCloseTraining = () => {
    setShowTraining(false);
  };

  const handleStartTrainingLesson = (lessonId: string) => {
    const configOverride = trainingEngine.getGameConfigOverride(lessonId);
    const success = trainingEngine.startLesson(lessonId);
    if (!success) return;

    setTrainingLessonId(lessonId);
    trainingLessonIdRef.current = lessonId;
    setShowTraining(false);
    lastScoreUpdateRef.current = 0;
    trainingStateEmitter.emit();

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
    } else if (gameEngineRef.current) {
      gameEngineRef.current.restart();
    }
  };

  const handleStartTournamentTrack = (trackId: string) => {
    const configOverride = tournamentEngine.getGameConfigOverride(trackId);
    const success = tournamentEngine.selectTrack(trackId);
    if (!success) return;

    setTournamentTrackId(trackId);
    tournamentTrackIdRef.current = trackId;
    setShowTournament(false);
    lastScoreUpdateRef.current = 0;
    tournamentStateEmitter.emit();

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

  const handleOpenWeatherLab = () => {
    setShowWeatherLab(true);
  };

  const handleCloseWeatherLab = () => {
    setShowWeatherLab(false);
  };

  const handleStartWeatherLabScene = (scene: WeatherScene) => {
    const configOverride = weatherLabEngine.getGameConfigOverride(scene);
    const weatherConfigOverride = weatherLabEngine.getWeatherConfigOverride(scene);
    setWeatherLabSceneId(scene.id);
    weatherLabSceneIdRef.current = scene.id;
    setShowWeatherLab(false);
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;

    if (gameEngineRef.current) {
      if (configOverride) {
        gameEngineRef.current.reconfigure({
          ...configOverride,
          weatherConfig: weatherConfigOverride,
        });
      } else {
        gameEngineRef.current.setWeatherConfig(weatherConfigOverride);
      }

      const gravity = configOverride?.gravity ?? 0.015;
      const turbulence = configOverride?.turbulenceLevel ?? scene.weatherConfig.turbulenceLevel;
      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + gravity)),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - turbulence * 0.3),
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
        <MainMenu
          onStart={handleStart}
          onWorkshop={handleOpenWorkshop}
          onTournament={handleOpenTournament}
          onTraining={handleOpenTraining}
          onWeatherLab={handleOpenWeatherLab}
        />
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
          onClearResult={() => {
            setTournamentResult(null);
            tournamentStateEmitter.emit();
          }}
        />
      )}

      {showTraining && (
        <TrainingCenter
          onClose={handleCloseTraining}
          onStartLesson={handleStartTrainingLesson}
          lastResult={trainingResult}
          onClearResult={() => {
            setTrainingResult(null);
            trainingStateEmitter.emit();
          }}
        />
      )}

      {showWeatherLab && (
        <WeatherLab
          onClose={handleCloseWeatherLab}
          onStartFlight={handleStartWeatherLabScene}
        />
      )}
    </div>
  );
}

export default App;
