import { useState, useCallback, useEffect } from 'react';
import { mapExploreEngine } from './mapExploreEngine';
import type { MapExploreState, StageSettlementResult, MapExploreFlightResult } from './types';
import type { GameStats } from '../game/types';

type Listener = () => void;

class MapExploreStateEmitter {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const mapExploreStateEmitter = new MapExploreStateEmitter();

export function useMapExplore(autoRefresh = true) {
  const [state, setState] = useState<MapExploreState>(() => {
    mapExploreEngine.loadFromLocalStorage();
    return mapExploreEngine.getState();
  });

  const refreshState = useCallback(() => {
    setState({ ...mapExploreEngine.getState() });
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const unsubscribe = mapExploreStateEmitter.subscribe(refreshState);
    return unsubscribe;
  }, [autoRefresh, refreshState]);

  const unlockRegion = useCallback(
    (regionId: string, spendCoins: () => boolean): boolean => {
      const result = mapExploreEngine.unlockRegion(regionId, spendCoins);
      if (result) {
        mapExploreStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const unlockBuildingCluster = useCallback(
    (clusterId: string, spendCoins: () => boolean): boolean => {
      const result = mapExploreEngine.unlockBuildingCluster(clusterId, spendCoins);
      if (result) {
        mapExploreStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const startStoryEvent = useCallback(
    (eventId: string): boolean => {
      const result = mapExploreEngine.startStoryEvent(eventId);
      if (result) {
        mapExploreStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const advanceStoryDialogue = useCallback((): boolean => {
    const result = mapExploreEngine.advanceStoryDialogue();
    if (result) {
      mapExploreStateEmitter.emit();
      refreshState();
    }
    return result;
  }, [refreshState]);

  const settleStage = useCallback(
    (stageId: string): StageSettlementResult | null => {
      const result = mapExploreEngine.settleStage(stageId);
      if (result) {
        mapExploreStateEmitter.emit();
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const setCurrentRegion = useCallback(
    (regionId: string | null): void => {
      mapExploreEngine.setCurrentRegion(regionId);
      mapExploreStateEmitter.emit();
      refreshState();
    },
    [refreshState]
  );

  const recordFlightInRegion = useCallback(
    (regionId: string, stats: GameStats, adjustedScore: number): MapExploreFlightResult => {
      const result = mapExploreEngine.recordFlightInRegion(regionId, stats, adjustedScore);
      mapExploreStateEmitter.emit();
      refreshState();
      return result;
    },
    [refreshState]
  );

  const reset = useCallback((): void => {
    mapExploreEngine.reset();
    mapExploreStateEmitter.emit();
    refreshState();
  }, [refreshState]);

  const saveToLocalStorage = useCallback((): void => {
    mapExploreEngine.saveToLocalStorage();
  }, []);

  const loadFromLocalStorage = useCallback((): boolean => {
    const result = mapExploreEngine.loadFromLocalStorage();
    if (result) {
      refreshState();
    }
    return result;
  }, [refreshState]);

  return {
    state,
    unlockRegion,
    unlockBuildingCluster,
    startStoryEvent,
    advanceStoryDialogue,
    settleStage,
    setCurrentRegion,
    recordFlightInRegion,
    reset,
    saveToLocalStorage,
    loadFromLocalStorage,
    refreshState,
  };
}
