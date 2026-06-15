import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import type { GameState, GameStats } from './game/types';
import { DEFAULT_GAME_CONFIG, DEFAULT_COMBO_FLOW_STATE } from './game/types';
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
import { LevelEditor, LevelEditorProvider } from './levelEditor';
import { levelEditorEngine } from './levelEditor/levelEditorEngine';
import type { LevelScene } from './levelEditor/types';
import { JourneyCenter, useJourney } from './journey';
import type { NewlyUnlockedAchievement } from './journey/journeyEngine';
import type { TrajectoryPoint, FlightMode } from './journey/types';
import { FestivalCenter } from './festival';
import { festivalEngine } from './festival/festivalEngine';
import { festivalStateEmitter } from './festival/useFestival';
import { MapExploreCenter } from './mapExplore';
import { mapExploreEngine } from './mapExplore/mapExploreEngine';
import { mapExploreStateEmitter } from './mapExplore/useMapExplore';
import { ReplayCenter } from './replay';
import { replayEngine } from './replay/replayEngine';
import type { FlightRecord } from './journey/types';
import {
  StageSelect,
  StageTaskHUD,
  SceneAnnouncer,
  StageSettlementScreen,
  PauseSettlement,
  useStageTask,
  stageTaskStateEmitter,
} from './stageTask';
import type { StageTask, StageProgress, StageSettlement } from './stageTask/types';
import './App.css';
import './workshop/workshop.css';
import './tournament/tournament.css';
import './training/training.css';
import './weatherLab/weatherLab.css';
import './levelEditor/levelEditor.css';
import './journey/journey.css';
import './festival/festival.css';
import './mapExplore/mapExplore.css';
import './replay/replay.css';
import './stageTask/stageTask.css';

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
  durability: {
    current: 100,
    max: 100,
    criticalThreshold: 20,
    warningThreshold: 50,
    isCritical: false,
    isWarning: false,
  },
  tension: {
    current: 20,
    max: 100,
    optimal: 50,
    criticalThreshold: 85,
    warningThreshold: 70,
    isOverTension: false,
    isUnderTension: false,
    stringLength: 80,
    maxStringLength: 200,
    minStringLength: 30,
    reelRate: 8,
    tensionDamageRate: 0.15,
  },
  durabilityBonus: 0,
  tensionBonus: 0,
  totalDamageTaken: 0,
  avgTension: 0,
  tensionSamples: 0,
  weatherEvent: 'clear',
  timeOfDayPhase: 'noon',
  scoreMultiplier: 1.0,
  visibility: 1.0,
  weatherEventDuration: 0,
  baseScore: 0,
  weatherBonusScore: 0,
  lightningNearMiss: 0,
  comboFlow: { ...DEFAULT_COMBO_FLOW_STATE },
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
  const [showLevelEditor, setShowLevelEditor] = useState(false);
  const [levelEditorLevelId, setLevelEditorLevelId] = useState<string | null>(null);
  const [levelEditorResult, setLevelEditorResult] = useState<{ levelId: string; score: number; isWin: boolean } | null>(null);
  const [showJourney, setShowJourney] = useState(false);
  const [newJourneyAchievements, setNewJourneyAchievements] = useState<NewlyUnlockedAchievement[]>([]);
  const [showFestival, setShowFestival] = useState(false);
  const [festivalSceneId, setFestivalSceneId] = useState<string | null>(null);
  const [showMapExplore, setShowMapExplore] = useState(false);
  const [mapExploreRegionId, setMapExploreRegionId] = useState<string | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [stageTasks, setStageTasks] = useState<StageTask[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgress | null>(null);
  const [stageSettlement, setStageSettlement] = useState<StageSettlement | null>(null);
  const [showStageSettlement, setShowStageSettlement] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'extreme'>('normal');
  const [, setForceUpdate] = useState(0);
  const flightDataPointsRef = useRef<FlightDataPoint[]>([]);
  const flightDataLastSaveTimeRef = useRef<number>(0);
  const levelEditorLevelIdRef = useRef<string | null>(null);
  const stageIdRef = useRef<string | null>(null);
  const lastSettlementKeyRef = useRef<string | null>(null);
  const difficultyRef = useRef<'easy' | 'normal' | 'hard' | 'extreme'>('normal');

  const workshop = useWorkshop();
  const journey = useJourney();
  const stageTask = useStageTask();

  const tournamentTrackIdRef = useRef<string | null>(null);
  const trainingLessonIdRef = useRef<string | null>(null);
  const weatherLabSceneIdRef = useRef<string | null>(null);
  const festivalSceneIdRef = useRef<string | null>(null);
  const mapExploreRegionIdRef = useRef<string | null>(null);
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
    levelEditorLevelIdRef.current = levelEditorLevelId;
  }, [levelEditorLevelId]);

  useEffect(() => {
    festivalSceneIdRef.current = festivalSceneId;
  }, [festivalSceneId]);

  useEffect(() => {
    mapExploreRegionIdRef.current = mapExploreRegionId;
  }, [mapExploreRegionId]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    difficultyRef.current = difficulty;
    if (gameEngineRef.current && isInitialized) {
      gameEngineRef.current.setDifficultyPreset(difficulty);
    }
  }, [difficulty, isInitialized]);

  useEffect(() => {
    const unlockedDifficulties = stageTask.getUnlockedDifficulties();
    if (!unlockedDifficulties.includes(difficulty)) {
      const fallback = unlockedDifficulties[unlockedDifficulties.length - 1] || 'normal';
      setDifficulty(fallback);
    }
  }, [stageTask, difficulty]);

  const handleDifficultyChange = useCallback((newDifficulty: 'easy' | 'normal' | 'hard' | 'extreme') => {
    if (!stageTask.isDifficultyUnlocked(newDifficulty)) return;
    setDifficulty(newDifficulty);
  }, [stageTask]);

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
    } else if (gameStateRef.current === 'playing') {
      const now = Date.now();
      if (now - flightDataLastSaveTimeRef.current >= 1000) {
        flightDataLastSaveTimeRef.current = now;
        const dataPoint = gameEngineRef.current?.getCurrentFlightDataPoint();
        if (dataPoint) {
          flightDataPointsRef.current.push(dataPoint);
          if (flightDataPointsRef.current.length > 300) {
            flightDataPointsRef.current = flightDataPointsRef.current.slice(-300);
          }
        }
      }
    }
  }, [workshop]);

  const handleStateChange = useCallback((state: GameState) => {
    gameStateRef.current = state;
    setGameState(state);
  }, []);

  const handleStageTaskUpdate = useCallback((tasks: StageTask[], progress: StageProgress) => {
    setStageTasks(tasks);
    setStageProgress(progress);
    stageTaskStateEmitter.emit();
  }, []);

  const handleStageComplete = useCallback((settlement: StageSettlement) => {
    const settlementKey = `${settlement.stageId}-${settlement.totalScore}-${settlement.isFailed}`;
    
    if (lastSettlementKeyRef.current === settlementKey) {
      return;
    }
    lastSettlementKeyRef.current = settlementKey;

    setStageSettlement(settlement);
    setShowStageSettlement(true);
    
    const earnedCoinsFromStage = settlement.earnedCoins;
    if (earnedCoinsFromStage > 0) {
      workshop.addCoins(earnedCoinsFromStage);
      setEarnedCoins(prev => prev + earnedCoinsFromStage);
    }
    
    stageTaskStateEmitter.emit();
  }, [workshop]);

  const handleGameOver = useCallback((gameOverStats: GameStats) => {
    setFinalStats(gameOverStats);

    const savedFestivalSceneId = festivalSceneIdRef.current;
    const baseAdjustedScore = workshop.calculateFinalScore(gameOverStats.score);
    const baseCoins = workshop.calculateCoinsEarned(gameOverStats.score);

    const adjustedScore = festivalEngine.calculateAdjustedScore(
      baseAdjustedScore,
      savedFestivalSceneId || undefined
    );
    const coins = festivalEngine.calculateAdjustedCoins(
      baseCoins,
      savedFestivalSceneId || undefined
    );

    setAdjustedFinalStats({
      ...gameOverStats,
      score: adjustedScore,
      distance: gameOverStats.distance + gameOverStats.distance * workshop.state.distanceBonus / 100,
      maxHeight: gameOverStats.maxHeight + gameOverStats.maxHeight * workshop.state.heightBonus / 100,
    });
    setEarnedCoins(coins);

    workshop.addCoins(coins);

    const festivalActive = festivalEngine.getStatus() === 'active';
    if (festivalActive) {
      festivalEngine.recordFlight({
        score: adjustedScore,
        distance: gameOverStats.distance,
        maxHeight: gameOverStats.maxHeight,
        airCurrentCount: gameOverStats.airCurrentCount,
        collisions: gameOverStats.collisions,
        sceneId: savedFestivalSceneId || undefined,
      });
      if (savedFestivalSceneId) {
        const festivalCurrencyEarned = Math.floor(adjustedScore * 0.02);
        if (festivalCurrencyEarned > 0) {
          festivalEngine.addFestivalCurrency(festivalCurrencyEarned);
        }
      }
      festivalStateEmitter.emit();
    }

    const savedTrackId = tournamentTrackIdRef.current;
    const savedLessonId = trainingLessonIdRef.current;
    const savedWeatherSceneId = weatherLabSceneIdRef.current;
    const savedLevelId = levelEditorLevelIdRef.current;
    const savedFlightTrajectory = flightDataPointsRef.current ? [...flightDataPointsRef.current] : [];

    let flightMode: FlightMode = 'free';
    let trackName: string | undefined;
    let lessonName: string | undefined;
    let sceneName: string | undefined;
    let levelName: string | undefined;
    let weatherCondition: string | undefined;

    if (savedTrackId) {
      flightMode = 'tournament';
      const track = tournamentEngine.getTrack(savedTrackId);
      trackName = track?.name;
    } else if (savedLessonId) {
      flightMode = 'training';
      const lesson = trainingEngine.getLesson(savedLessonId);
      lessonName = lesson?.title;
    } else if (savedWeatherSceneId) {
      flightMode = 'weatherLab';
      const scene = weatherLabEngine.getSceneById(savedWeatherSceneId);
      sceneName = scene?.name;
      if (scene) {
        const wc = scene.weatherConfig;
        weatherCondition = wc
          ? wc.cloudCoverage > 0.7
            ? '多云'
            : wc.turbulenceLevel > 0.4
            ? '暴风'
            : wc.cloudCoverage > 0.4
            ? '晴间多云'
            : '晴朗'
          : undefined;
      }
    } else if (savedLevelId || levelEditorLevelId) {
      flightMode = 'levelEditor';
      const level = levelEditorEngine.getLevelById(savedLevelId || levelEditorLevelId || '');
      levelName = level?.name;
    } else if (savedFestivalSceneId) {
      flightMode = 'tournament';
      const scene = festivalEngine.getScene(savedFestivalSceneId);
      sceneName = scene?.name;
    }

    if (savedFestivalSceneId) {
      festivalSceneIdRef.current = null;
      setFestivalSceneId(null);
      festivalStateEmitter.emit();
    }

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

    const currentLevelId = levelEditorLevelIdRef.current;
    if (currentLevelId && gameEngineRef.current) {
      const level = levelEditorEngine.getLevelById(currentLevelId);
      if (level) {
        const conditions = gameEngineRef.current.checkWinLoseConditions(level);
        levelEditorEngine.recordLevelPlay(
          currentLevelId,
          adjustedScore,
          conditions.isWin
        );
        setLevelEditorResult({
          levelId: currentLevelId,
          score: adjustedScore,
          isWin: conditions.isWin,
        });
      }
      levelEditorLevelIdRef.current = null;
      setLevelEditorLevelId(null);
    }

    const currentMapExploreRegionId = mapExploreRegionIdRef.current;
    if (currentMapExploreRegionId) {
      const flightResult = mapExploreEngine.recordFlightInRegion(
        currentMapExploreRegionId,
        gameOverStats,
        adjustedScore
      );

      if (flightResult.totalRewardCoins > 0) {
        workshop.addCoins(flightResult.totalRewardCoins);
        setEarnedCoins((prev) => prev + flightResult.totalRewardCoins);
      }

      if (flightResult.totalRewardScore > 0) {
        const newAdjustedScore = adjustedScore + flightResult.totalRewardScore;
        setAdjustedFinalStats((prev) => ({
          ...prev,
          score: newAdjustedScore,
        }));
      }

      mapExploreRegionIdRef.current = null;
      setMapExploreRegionId(null);
      mapExploreStateEmitter.emit();
    }

    const journeyTrajectory: TrajectoryPoint[] = savedFlightTrajectory.map((dp) => ({
      t: dp.timestamp,
      x: dp.position.x,
      y: dp.position.y,
      z: dp.position.z,
      vx: dp.velocity.x,
      vy: dp.velocity.y,
      vz: dp.velocity.z,
      stability: dp.stability,
      shadowTracking: dp.shadowTracking,
    }));

    const journeyResult = journey.recordFlight({
      mode: flightMode,
      stats: adjustedFinalStats,
      adjustedScore,
      earnedCoins: coins,
      weatherCondition,
      trackName,
      lessonName,
      sceneName,
      levelName,
      trajectory: journeyTrajectory.length > 0 ? journeyTrajectory : undefined,
      equippedParts: workshop.equipped as unknown as Record<string, string | null>,
    });

    if (journeyResult && journeyTrajectory.length > 20) {
      try {
        replayEngine.createReplayFromFlightRecord(journeyResult.record as FlightRecord);
      } catch (e) {
        console.warn('Failed to create replay:', e);
      }
    }

    if (journeyResult.newAchievements.length > 0) {
      setNewJourneyAchievements(journeyResult.newAchievements);
      const achievementCoins = journeyResult.newAchievements.reduce(
        (sum, a) => sum + a.rewardCoins, 0
      );
      if (achievementCoins > 0) {
        workshop.addCoins(achievementCoins);
        setEarnedCoins((prev) => prev + achievementCoins);
      }
    }

    stageTask.updateGlobalBestScore(journey.getBestScore());
    stageTask.checkChapterUnlocks();
    stageTaskStateEmitter.emit();

    setGameState('gameover');
  }, [workshop, journey, stageTask]);

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const initialConfig = {
      ...DEFAULT_GAME_CONFIG,
      flightParams: workshop.flightParams,
      difficultyPreset: difficulty,
    };

    const engine = new GameEngine(
      containerRef.current,
      {
        onStatsUpdate: handleStatsUpdate,
        onStateChange: handleStateChange,
        onGameOver: handleGameOver,
        onStageTaskUpdate: handleStageTaskUpdate,
        onStageComplete: handleStageComplete,
      },
      initialConfig
    );

    engine.init();
    engine.setStageTaskEngine(stageTask.engine);
    gameEngineRef.current = engine;
    setIsInitialized(true);

    return () => {
      engine.destroy();
      gameEngineRef.current = null;
    };
  }, [handleStatsUpdate, handleStateChange, handleGameOver, isInitialized, workshop.flightParams, difficulty]);

  useEffect(() => {
    if (gameEngineRef.current && isInitialized) {
      gameEngineRef.current.setFlightParams(workshop.flightParams);
    }
  }, [workshop.flightParams, isInitialized]);

  useEffect(() => {
    const bestScore = journey.getBestScore();
    if (bestScore > 0) {
      stageTask.updateGlobalBestScore(bestScore);
      stageTask.checkChapterUnlocks();
      stageTaskStateEmitter.emit();
    }
  }, [journey, stageTask]);

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
    const currentLevelId = levelEditorLevelIdRef.current;
    if (currentLevelId) {
      const level = levelEditorEngine.getLevelById(currentLevelId);
      if (level) {
        levelEditorEngine.setCurrentLevel(level);
      }
    }
    const currentFestivalSceneId = festivalSceneIdRef.current;
    if (currentFestivalSceneId) {
      festivalEngine.selectScene(currentFestivalSceneId);
      festivalStateEmitter.emit();
    }
    const currentStageId = stageIdRef.current;
    if (currentStageId) {
      const stage = stageTask.getStages().find(s => s.id === currentStageId);
      if (stage) {
        stageTask.startStage(currentStageId);
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
    if (levelEditorLevelIdRef.current) {
      levelEditorLevelIdRef.current = null;
      setLevelEditorLevelId(null);
    }
    if (festivalSceneIdRef.current) {
      festivalSceneIdRef.current = null;
      setFestivalSceneId(null);
      festivalStateEmitter.emit();
    }
    if (mapExploreRegionIdRef.current) {
      mapExploreRegionIdRef.current = null;
      setMapExploreRegionId(null);
      mapExploreStateEmitter.emit();
    }
    if (stageIdRef.current) {
      stageIdRef.current = null;
      stageTask.reset();
      setStageTasks([]);
      setStageProgress(null);
      setStageSettlement(null);
      setShowStageSettlement(false);
      stageTaskStateEmitter.emit();
    }
    gameEngineRef.current?.clearLevelScene();
    setGameState('menu');
  };

  const handleOpenStageSelect = () => {
    setShowStageSelect(true);
  };

  const handleCloseStageSelect = () => {
    setShowStageSelect(false);
  };

  const handleStartStage = (stageId: string) => {
    const stage = stageTask.getStages().find(s => s.id === stageId);
    if (!stage) return;

    const weatherConfig = stageTask.getWeatherConfigOverride(stage);
    const airCurrentConfig = stageTask.getAirCurrentConfigOverride(stage);

    const now = performance.now();
    stageIdRef.current = stageId;
    lastSettlementKeyRef.current = null;
    stageTask.startStage(stageId, now);
    setShowStageSelect(false);
    setShowStageSettlement(false);
    setStageSettlement(null);
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;
    stageTaskStateEmitter.emit();

    if (gameEngineRef.current) {
      gameEngineRef.current.reconfigure({
        ...airCurrentConfig,
        weatherConfig,
      });

      const gravity = 0.015;
      const turbulence = weatherConfig.turbulenceLevel ?? 0.2;
      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + gravity)),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - turbulence * 0.3),
      });

      gameEngineRef.current.restart();
    }
  };

  const handleQuitStage = () => {
    if (stageIdRef.current) {
      stageIdRef.current = null;
      lastSettlementKeyRef.current = null;
      stageTask.reset();
      setStageTasks([]);
      setStageProgress(null);
      setStageSettlement(null);
      setShowStageSettlement(false);
      stageTaskStateEmitter.emit();
    }
    setGameState('menu');
  };

  const handleNextStage = () => {
    if (!stageSettlement) return;
    
    const stages = stageTask.getStages();
    const currentIndex = stages.findIndex(s => s.id === stageSettlement.stageId);
    
    if (currentIndex >= 0 && currentIndex + 1 < stages.length) {
      const nextStage = stages[currentIndex + 1];
      if (nextStage.unlocked) {
        handleStartStage(nextStage.id);
      }
    }
  };

  const handleOpenLevelEditor = () => {
    setShowLevelEditor(true);
  };

  const handleCloseLevelEditor = () => {
    setShowLevelEditor(false);
  };

  const handleOpenJourney = () => {
    setShowJourney(true);
  };

  const handleCloseJourney = () => {
    setShowJourney(false);
    if (newJourneyAchievements.length > 0) {
      setNewJourneyAchievements([]);
    }
  };

  const handleOpenFestival = () => {
    setShowFestival(true);
  };

  const handleCloseFestival = () => {
    setShowFestival(false);
  };

  const handleOpenMapExplore = () => {
    setShowMapExplore(true);
  };

  const handleCloseMapExplore = () => {
    setShowMapExplore(false);
  };

  const handleOpenReplay = () => {
    setShowReplay(true);
  };

  const handleCloseReplay = () => {
    setShowReplay(false);
  };

  const handleStartMapExploreFlight = (regionId: string) => {
    const configOverride = mapExploreEngine.getGameConfigOverride(regionId);
    if (!configOverride) return;

    setMapExploreRegionId(regionId);
    mapExploreRegionIdRef.current = regionId;
    mapExploreEngine.setCurrentRegion(regionId);
    setShowMapExplore(false);
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;
    mapExploreStateEmitter.emit();

    if (gameEngineRef.current) {
      gameEngineRef.current.reconfigure({
        worldSize: configOverride.worldSize,
        gravity: configOverride.gravity,
        airCurrentSpawnRate: configOverride.airCurrentSpawnRate,
        minAirCurrentStrength: configOverride.minAirCurrentStrength,
        maxAirCurrentStrength: configOverride.maxAirCurrentStrength,
        buildingDensity: configOverride.buildingDensity,
        turbulenceLevel: configOverride.turbulenceLevel,
        cloudCoverage: configOverride.cloudCoverage,
      });

      const gravity = configOverride.gravity ?? 0.015;
      const turbulence = configOverride.turbulenceLevel ?? 0.2;
      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + gravity)),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - turbulence * 0.3),
      });

      gameEngineRef.current.restart();
    }
  };

  const handleStartFestivalScene = (sceneId: string) => {
    const configOverride = festivalEngine.getGameConfigOverride(sceneId);
    const success = festivalEngine.selectScene(sceneId);
    if (!success) return;

    setFestivalSceneId(sceneId);
    festivalSceneIdRef.current = sceneId;
    setShowFestival(false);
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;
    festivalStateEmitter.emit();

    if (gameEngineRef.current && configOverride) {
      const gravity = configOverride.gravity ?? 0.015;
      const turbulence = configOverride.turbulenceLevel ?? 0.2;
      gameEngineRef.current.reconfigure({
        worldSize: configOverride.worldSize,
        gravity: configOverride.gravity,
        airCurrentSpawnRate: configOverride.airCurrentSpawnRate,
        minAirCurrentStrength: configOverride.minAirCurrentStrength,
        maxAirCurrentStrength: configOverride.maxAirCurrentStrength,
        buildingDensity: configOverride.buildingDensity,
        turbulenceLevel: configOverride.turbulenceLevel,
        cloudCoverage: configOverride.cloudCoverage,
      });

      const distanceBuff = festivalEngine.getTotalBuffValue('distance');
      const heightBuff = festivalEngine.getTotalBuffValue('height');
      const stabilityBuff = festivalEngine.getTotalBuffValue('stability');

      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + gravity)) * (1 + distanceBuff * 0.5),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - turbulence * 0.3) * (1 + stabilityBuff),
        liftForce: workshop.flightParams.liftForce * (1 + heightBuff),
      });

      gameEngineRef.current.restart();
    } else if (gameEngineRef.current) {
      gameEngineRef.current.restart();
    }
  };

  const handleStartLevelEditorLevel = (level: LevelScene) => {
    setLevelEditorLevelId(level.id);
    levelEditorLevelIdRef.current = level.id;
    levelEditorEngine.setCurrentLevel(level);
    setShowLevelEditor(false);
    lastScoreUpdateRef.current = 0;
    flightDataPointsRef.current = [];
    flightDataLastSaveTimeRef.current = 0;
    setLevelEditorResult(null);

    if (gameEngineRef.current) {
      gameEngineRef.current.loadLevelScene(level);
      gameEngineRef.current.setFlightParams({
        ...workshop.flightParams,
        maxSpeed: workshop.flightParams.maxSpeed * (1 / (1 + level.globalSettings.gravity)),
        stabilityFactor: workshop.flightParams.stabilityFactor * (1 - level.globalSettings.turbulence * 0.3),
      });
      gameEngineRef.current.restart();
    }
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
          onLevelEditor={handleOpenLevelEditor}
          onJourney={handleOpenJourney}
          onFestival={handleOpenFestival}
          onMapExplore={handleOpenMapExplore}
          onReplay={handleOpenReplay}
          onStageChallenge={handleOpenStageSelect}
          difficulty={difficulty}
          onDifficultyChange={handleDifficultyChange}
          unlockedDifficulties={stageTask.getUnlockedDifficulties()}
          chapterProgress={{
            unlocked: stageTask.getChapters().filter(c => c.unlocked).length,
            total: stageTask.getChapters().length,
            totalStars: stageTask.getTotalStars(),
            completedStages: stageTask.getStages().filter(s => s.completed).length,
            totalStages: stageTask.getStages().length,
          }}
        />
      )}

      {gameState === 'playing' && (
        <>
          <GameHUD stats={stats} onPause={handlePause} />
          {stageIdRef.current && (
            <StageTaskHUD
              currentStage={stageTask.getCurrentStage()}
              progress={stageProgress || stageTask.getProgress()}
              tasks={stageTasks.length > 0 ? stageTasks : stageTask.getCurrentTasks()}
            />
          )}
          {stageIdRef.current && (
            <SceneAnnouncer
              announcements={stageTask.getAnnouncements()}
            />
          )}
        </>
      )}

      {gameState === 'paused' && (
        <>
          {showStageSettlement && stageSettlement ? (
            <StageSettlementScreen
              settlement={stageSettlement}
              tasks={stageTasks}
              onRestart={() => handleStartStage(stageSettlement.stageId)}
              onNextStage={handleNextStage}
              onMainMenu={handleQuitStage}
              hasNextStage={
                !stageSettlement.isFailed &&
                stageSettlement.stars > 0 &&
                stageTask.getStages().findIndex(s => s.id === stageSettlement.stageId) < stageTask.getStages().length - 1
              }
            />
          ) : stageIdRef.current && stageProgress ? (
            <PauseSettlement
              currentStage={stageTask.getCurrentStage()}
              progress={stageProgress}
              tasks={stageTasks}
              onResume={handleResume}
              onRestart={handleRestart}
              onQuit={handleQuitStage}
            />
          ) : (
            <PauseMenu
              onResume={handleResume}
              onRestart={handleRestart}
              onMainMenu={handleMainMenu}
            />
          )}
        </>
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

      {showLevelEditor && (
        <LevelEditorProvider>
          <LevelEditor
            onClose={handleCloseLevelEditor}
            onStartLevel={handleStartLevelEditorLevel}
            lastResult={levelEditorResult}
            onClearResult={() => {
              setLevelEditorResult(null);
            }}
          />
        </LevelEditorProvider>
      )}

      {showJourney && (
        <JourneyCenter
          onClose={handleCloseJourney}
          newAchievements={newJourneyAchievements}
        />
      )}

      {showFestival && (
        <FestivalCenter
          onClose={handleCloseFestival}
          onStartScene={handleStartFestivalScene}
          onAddCoins={(amount) => {
            workshop.addCoins(amount);
          }}
        />
      )}

      {showMapExplore && (
        <MapExploreCenter
          onClose={handleCloseMapExplore}
          onStartFlight={handleStartMapExploreFlight}
          onAddCoins={(amount) => {
            workshop.addCoins(amount);
          }}
          onAddScore={(_amount) => {
          }}
        />
      )}

      {showReplay && (
        <ReplayCenter
          onClose={handleCloseReplay}
          flightRecords={journey.getFlightRecordsByMode()}
        />
      )}

      {showStageSelect && (
        <StageSelect
          stages={stageTask.getStages()}
          chapters={stageTask.getChapters()}
          onSelectStage={handleStartStage}
          onClose={handleCloseStageSelect}
          getChapterUnlockDescription={stageTask.getChapterUnlockDescription}
        />
      )}

      {showStageSettlement && stageSettlement && (
        <StageSettlementScreen
          settlement={stageSettlement}
          tasks={stageTasks}
          onRestart={() => handleStartStage(stageSettlement.stageId)}
          onNextStage={handleNextStage}
          onMainMenu={handleQuitStage}
          hasNextStage={
            stageSettlement.stars > 0 &&
            stageTask.getStages().findIndex(s => s.id === stageSettlement.stageId) < stageTask.getStages().length - 1
          }
        />
      )}
    </div>
  );
}

export default App;
