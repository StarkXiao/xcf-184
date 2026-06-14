import { useState, useEffect, useCallback } from 'react';
import { weatherLabEngine } from './weatherLabEngine';
import type {
  WeatherLabState,
  WeatherScene,
  WindFieldConfig,
  FlightRecord,
  FlightDataPoint,
  AnomalyEvent,
  AnomalyType,
  ComparisonGroup,
  SceneStats,
  SceneCategory,
  WeatherLabTab,
} from './types';
import type {
  WeatherConfig,
  GameConfig,
  GameStats,
} from '../game/types';

export function useWeatherLab() {
  const [state, setState] = useState<WeatherLabState>(weatherLabEngine.getState());
  const [scenes, setScenes] = useState<WeatherScene[]>(weatherLabEngine.getScenes());
  const [currentScene, setCurrentSceneState] = useState<WeatherScene | null>(weatherLabEngine.getCurrentScene());
  const [flightRecords, setFlightRecords] = useState<FlightRecord[]>(weatherLabEngine.getFlightRecords());
  const [anomalyEvents, setAnomalyEvents] = useState<AnomalyEvent[]>(weatherLabEngine.getAnomalyEvents());
  const [comparisonGroups, setComparisonGroups] = useState<ComparisonGroup[]>(weatherLabEngine.getComparisonGroups());
  const [activeComparisonGroup, setActiveComparisonGroupState] = useState<ComparisonGroup | null>(weatherLabEngine.getState().activeComparisonGroup);
  const [selectedAnomaly, setSelectedAnomalyState] = useState<AnomalyEvent | null>(weatherLabEngine.getState().selectedAnomaly);

  const refreshState = useCallback(() => {
    setState(weatherLabEngine.getState());
    setScenes(weatherLabEngine.getScenes());
    setCurrentSceneState(weatherLabEngine.getCurrentScene());
    setFlightRecords(weatherLabEngine.getFlightRecords());
    setAnomalyEvents(weatherLabEngine.getAnomalyEvents());
    setComparisonGroups(weatherLabEngine.getComparisonGroups());
    setActiveComparisonGroupState(weatherLabEngine.getState().activeComparisonGroup);
    setSelectedAnomalyState(weatherLabEngine.getState().selectedAnomaly);
  }, []);

  useEffect(() => {
    weatherLabEngine.loadFromLocalStorage();
    setTimeout(() => {
      refreshState();
    }, 0);
  }, [refreshState]);

  const setCurrentTab = useCallback((tab: WeatherLabTab) => {
    weatherLabEngine.setCurrentTab(tab);
    refreshState();
  }, [refreshState]);

  const setCurrentScene = useCallback((scene: WeatherScene | null) => {
    weatherLabEngine.setCurrentScene(scene);
    refreshState();
  }, [refreshState]);

  const getScenesByCategory = useCallback((category: SceneCategory): WeatherScene[] => {
    return weatherLabEngine.getScenesByCategory(category);
  }, []);

  const getSceneById = useCallback((id: string): WeatherScene | undefined => {
    return weatherLabEngine.getSceneById(id);
  }, []);

  const createScene = useCallback((
    name: string,
    description: string,
    weatherConfig: WeatherConfig,
    gameConfig: Partial<GameConfig>,
    windField: WindFieldConfig,
    icon: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme',
    tags: string[]
  ): WeatherScene => {
    const scene = weatherLabEngine.createScene(
      name, description, weatherConfig, gameConfig, windField, icon, difficulty, tags
    );
    refreshState();
    return scene;
  }, [refreshState]);

  const updateScene = useCallback((sceneId: string, updates: Partial<WeatherScene>): boolean => {
    const success = weatherLabEngine.updateScene(sceneId, updates);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteScene = useCallback((sceneId: string): boolean => {
    const success = weatherLabEngine.deleteScene(sceneId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const toggleFavorite = useCallback((sceneId: string): boolean => {
    const success = weatherLabEngine.toggleFavorite(sceneId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const duplicateScene = useCallback((sceneId: string): WeatherScene | null => {
    const scene = weatherLabEngine.duplicateScene(sceneId);
    if (scene) {
      refreshState();
    }
    return scene;
  }, [refreshState]);

  const createFlightRecord = useCallback((
    sceneId: string,
    sceneName: string,
    stats: GameStats,
    weatherConfig: WeatherConfig,
    windField: WindFieldConfig,
    flightDataPoints: FlightDataPoint[],
    kiteConfig?: FlightRecord['kiteConfig']
  ): FlightRecord => {
    const record = weatherLabEngine.createFlightRecord(
      sceneId, sceneName, stats, weatherConfig, windField, flightDataPoints, kiteConfig
    );
    refreshState();
    return record;
  }, [refreshState]);

  const getFlightRecordsByScene = useCallback((sceneId: string): FlightRecord[] => {
    return weatherLabEngine.getFlightRecordsByScene(sceneId);
  }, []);

  const getAnomalyEventsByType = useCallback((type: AnomalyType): AnomalyEvent[] => {
    return weatherLabEngine.getAnomalyEventsByType(type);
  }, []);

  const getUnreviewedAnomalies = useCallback((): AnomalyEvent[] => {
    return weatherLabEngine.getUnreviewedAnomalies();
  }, []);

  const markAnomalyReviewed = useCallback((anomalyId: string): boolean => {
    const success = weatherLabEngine.markAnomalyReviewed(anomalyId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const setSelectedAnomaly = useCallback((anomaly: AnomalyEvent | null) => {
    weatherLabEngine.setSelectedAnomaly(anomaly);
    refreshState();
  }, [refreshState]);

  const createComparisonGroup = useCallback((name: string, flightRecordIds: string[], notes?: string): ComparisonGroup => {
    const group = weatherLabEngine.createComparisonGroup(name, flightRecordIds, notes);
    refreshState();
    return group;
  }, [refreshState]);

  const addToComparisonGroup = useCallback((groupId: string, flightRecordId: string): boolean => {
    const success = weatherLabEngine.addToComparisonGroup(groupId, flightRecordId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const removeFromComparisonGroup = useCallback((groupId: string, flightRecordId: string): boolean => {
    const success = weatherLabEngine.removeFromComparisonGroup(groupId, flightRecordId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const setActiveComparisonGroup = useCallback((groupId: string | null) => {
    weatherLabEngine.setActiveComparisonGroup(groupId);
    refreshState();
  }, [refreshState]);

  const getComparisonRecords = useCallback((groupId: string): FlightRecord[] => {
    return weatherLabEngine.getComparisonRecords(groupId);
  }, []);

  const getSceneStats = useCallback((sceneId: string): SceneStats => {
    return weatherLabEngine.getSceneStats(sceneId);
  }, []);

  const getGameConfigOverride = useCallback((scene: WeatherScene): Partial<GameConfig> | null => {
    return weatherLabEngine.getGameConfigOverride(scene);
  }, []);

  const generateWindFieldPreview = useCallback((windField: WindFieldConfig, height: number) => {
    return weatherLabEngine.generateWindFieldPreview(windField, height);
  }, []);

  const exportScene = useCallback((sceneId: string): string | null => {
    return weatherLabEngine.exportScene(sceneId);
  }, []);

  const importScene = useCallback((jsonString: string): WeatherScene | null => {
    const scene = weatherLabEngine.importScene(jsonString);
    if (scene) {
      refreshState();
    }
    return scene;
  }, [refreshState]);

  const deleteFlightRecord = useCallback((recordId: string): boolean => {
    const success = weatherLabEngine.deleteFlightRecord(recordId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteComparisonGroup = useCallback((groupId: string): boolean => {
    const success = weatherLabEngine.deleteComparisonGroup(groupId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const clearAllData = useCallback(() => {
    weatherLabEngine.clearAllData();
    refreshState();
  }, [refreshState]);

  return {
    state,
    scenes,
    currentScene,
    flightRecords,
    anomalyEvents,
    comparisonGroups,
    activeComparisonGroup,
    selectedAnomaly,
    setCurrentTab,
    setCurrentScene,
    getScenesByCategory,
    getSceneById,
    createScene,
    updateScene,
    deleteScene,
    toggleFavorite,
    duplicateScene,
    createFlightRecord,
    getFlightRecordsByScene,
    getAnomalyEventsByType,
    getUnreviewedAnomalies,
    markAnomalyReviewed,
    setSelectedAnomaly,
    createComparisonGroup,
    addToComparisonGroup,
    removeFromComparisonGroup,
    setActiveComparisonGroup,
    getComparisonRecords,
    getSceneStats,
    getGameConfigOverride,
    generateWindFieldPreview,
    exportScene,
    importScene,
    deleteFlightRecord,
    deleteComparisonGroup,
    clearAllData,
    refreshState,
  };
}
