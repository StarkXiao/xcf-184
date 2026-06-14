import { useState, useCallback, useEffect } from 'react';
import { journeyEngine } from './journeyEngine';
import type { NewlyUnlockedAchievement } from './journeyEngine';
import type {
  JourneyState,
  FlightRecord,
  Achievement,
  BestTrajectory,
  AnomalyEvent,
  GrowthDataPoint,
  FlightMode,
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
    }): { record: FlightRecord; newAchievements: NewlyUnlockedAchievement[] } => {
      const record = journeyEngine.recordFlight(params);
      const newAchievements = journeyEngine.getLastNewAchievements();
      journeyStateEmitter.emit();
      refreshState();
      return { record, newAchievements };
    },
    [refreshState]
  );

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

  return {
    state,
    recordFlight,
    getFlightRecordById,
    getAchievementById,
    getBestTrajectoryByType,
    getUnlockedAchievements,
    getAchievementProgress,
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
    refreshState,
  };
}
