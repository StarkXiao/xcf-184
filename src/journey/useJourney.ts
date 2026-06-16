import { useState, useCallback, useEffect } from 'react';
import { journeyEngine } from './journeyEngine';
import type { NewlyUnlockedAchievement, NewlyUnlockedTitle } from './journeyEngine';
import type {
  JourneyState,
  FlightRecord,
  Achievement,
  BestTrajectory,
  AnomalyEvent,
  GrowthDataPoint,
  FlightMode,
  Title,
} from './types';
import type { GameStats } from '../game/types';
import type { TrajectoryPoint } from './types';

type Listener = () => void;

class JourneyStateEmitter {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const journeyStateEmitter = new JourneyStateEmitter();

export function useJourney(autoRefresh = true) {
  const [state, setState] = useState<JourneyState>(() => {
    journeyEngine.loadFromLocalStorage();
    return journeyEngine.getState();
  });

  const refreshState = useCallback(() => {
    setState({ ...journeyEngine.getState() });
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const unsubscribe = journeyStateEmitter.subscribe(refreshState);
    return unsubscribe;
  }, [autoRefresh, refreshState]);

  const recordFlight = useCallback(
    (params: {
      mode: FlightMode;
      stats: GameStats;
      adjustedScore: number;
      earnedCoins: number;
      weatherCondition?: string;
      trackName?: string;
      lessonName?: string;
      sceneName?: string;
      levelName?: string;
      trajectory?: TrajectoryPoint[];
      equippedParts?: Record<string, string | null>;
    }): { record: FlightRecord; newAchievements: NewlyUnlockedAchievement[]; newTitles: NewlyUnlockedTitle[] } => {
      const record = journeyEngine.recordFlight(params);
      const newAchievements = journeyEngine.getLastNewAchievements();
      const newTitles = journeyEngine.getLastNewTitles();
      journeyStateEmitter.emit();
      refreshState();
      return { record, newAchievements, newTitles };
    },
    [refreshState]
  );

  const checkRealtimeAchievements = useCallback(
    (stats: GameStats): NewlyUnlockedAchievement[] => {
      const result = journeyEngine.checkRealtimeAchievements(stats);
      if (result.length > 0) {
        journeyStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const resetRealtimeState = useCallback((): void => {
    journeyEngine.resetRealtimeState();
  }, []);

  const checkAndUnlockTitles = useCallback((): NewlyUnlockedTitle[] => {
    const result = journeyEngine.checkAndUnlockTitles();
    if (result.length > 0) {
      journeyStateEmitter.emit();
      refreshState();
    }
    return result;
  }, [refreshState]);

  const getTitles = useCallback((): Title[] => {
    return journeyEngine.getTitles();
  }, []);

  const getUnlockedTitles = useCallback((): Title[] => {
    return journeyEngine.getUnlockedTitles();
  }, []);

  const getEquippedTitle = useCallback((): Title | undefined => {
    return journeyEngine.getEquippedTitle();
  }, []);

  const equipTitle = useCallback(
    (titleId: string): boolean => {
      const result = journeyEngine.equipTitle(titleId);
      if (result) {
        journeyStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const getTitleProgress = useCallback((): { unlocked: number; total: number; percentage: number } => {
    return journeyEngine.getTitleProgress();
  }, []);

  const getLastNewTitles = useCallback((): NewlyUnlockedTitle[] => {
    return journeyEngine.getLastNewTitles();
  }, []);

  const clearLastNewTitles = useCallback((): void => {
    journeyEngine.clearLastNewTitles();
  }, []);

  const getFlightRecordById = useCallback((id: string): FlightRecord | undefined => {
    return journeyEngine.getFlightRecordById(id);
  }, []);

  const getAchievementById = useCallback((id: string): Achievement | undefined => {
    return journeyEngine.getAchievementById(id);
  }, []);

  const getBestTrajectoryByType = useCallback(
    (type: BestTrajectory['type']): BestTrajectory | undefined => {
      return journeyEngine.getBestTrajectoryByType(type);
    },
    []
  );

  const getUnlockedAchievements = useCallback((): Achievement[] => {
    return journeyEngine.getUnlockedAchievements();
  }, []);

  const getAchievementProgress = useCallback((): { unlocked: number; total: number; percentage: number } => {
    return journeyEngine.getAchievementProgress();
  }, []);

  const setPilotName = useCallback((name: string): void => {
    journeyEngine.setPilotName(name);
    journeyStateEmitter.emit();
    refreshState();
  }, [refreshState]);

  const reset = useCallback((): void => {
    journeyEngine.reset();
    journeyStateEmitter.emit();
    refreshState();
  }, [refreshState]);

  const saveToLocalStorage = useCallback((): void => {
    journeyEngine.saveToLocalStorage();
  }, []);

  const loadFromLocalStorage = useCallback((): boolean => {
    const result = journeyEngine.loadFromLocalStorage();
    if (result) {
      refreshState();
    }
    return result;
  }, [refreshState]);

  const getLastNewAchievements = useCallback((): NewlyUnlockedAchievement[] => {
    return journeyEngine.getLastNewAchievements();
  }, []);

  const clearLastNewAchievements = useCallback((): void => {
    journeyEngine.clearLastNewAchievements();
  }, []);

  const getTotalRewardCoins = useCallback((): number => {
    return journeyEngine.getTotalRewardCoins();
  }, []);

  const getFlightRecordsByMode = useCallback((mode?: FlightMode): FlightRecord[] => {
    return journeyEngine.getFlightRecordsByMode(mode);
  }, []);

  const getAnomaliesBySeverity = useCallback(
    (severity?: AnomalyEvent['severity']): AnomalyEvent[] => {
      return journeyEngine.getAnomaliesBySeverity(severity);
    },
    []
  );

  const getGrowthHistoryLastNDays = useCallback((days: number): GrowthDataPoint[] => {
    return journeyEngine.getGrowthHistoryLastNDays(days);
  }, []);

  const getBestScore = useCallback((): number => {
    return journeyEngine.getBestScore();
  }, []);

  const getBestDistance = useCallback((): number => {
    return journeyEngine.getBestDistance();
  }, []);

  const getBestHeight = useCallback((): number => {
    return journeyEngine.getBestHeight();
  }, []);

  const getRecentAchievements = useCallback((limit: number = 5) => {
    return journeyEngine.getRecentAchievements(limit);
  }, []);

  return {
    state,
    recordFlight,
    checkRealtimeAchievements,
    resetRealtimeState,
    getFlightRecordById,
    getAchievementById,
    getBestTrajectoryByType,
    getUnlockedAchievements,
    getAchievementProgress,
    getTitles,
    getUnlockedTitles,
    getEquippedTitle,
    equipTitle,
    getTitleProgress,
    getLastNewTitles,
    clearLastNewTitles,
    setPilotName,
    reset,
    saveToLocalStorage,
    loadFromLocalStorage,
    getLastNewAchievements,
    clearLastNewAchievements,
    getTotalRewardCoins,
    getFlightRecordsByMode,
    getAnomaliesBySeverity,
    getGrowthHistoryLastNDays,
    getBestScore,
    getBestDistance,
    getBestHeight,
    getRecentAchievements,
    checkAndUnlockTitles,
    refreshState,
  };
}
