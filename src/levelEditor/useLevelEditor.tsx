import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { levelEditorEngine } from './levelEditorEngine';
import type {
  LevelEditorState,
  LevelScene,
  EditorBuilding,
  EditorAirCurrent,
  Objective,
  WinCondition,
  LoseCondition,
  LevelPlayResult,
  LevelStats,
  LevelCategory,
  LevelEditorTab,
  Vector3,
} from './types';
import type {
  GameConfig,
  WeatherConfig,
  GameStats,
} from '../game/types';

type LevelEditorContextType = ReturnType<typeof useLevelEditor> | null;

const LevelEditorContext = createContext<LevelEditorContextType>(null);

export function LevelEditorProvider({ children }: { children: ReactNode }) {
  const editor = useLevelEditor();
  return (
    <LevelEditorContext.Provider value={editor}>
      {children}
    </LevelEditorContext.Provider>
  );
}

export function useLevelEditorContext() {
  const context = useContext(LevelEditorContext);
  if (!context) {
    throw new Error('useLevelEditorContext must be used within a LevelEditorProvider');
  }
  return context;
}

export function useLevelEditor() {
  const [state, setState] = useState<LevelEditorState>(levelEditorEngine.getState());
  const [levels, setLevels] = useState<LevelScene[]>(levelEditorEngine.getLevels());
  const [currentLevel, setCurrentLevelState] = useState<LevelScene | null>(levelEditorEngine.getCurrentLevel());
  const [playResults, setPlayResults] = useState<LevelPlayResult[]>(levelEditorEngine.getPlayResults());

  const refreshState = useCallback(() => {
    setState(levelEditorEngine.getState());
    setLevels(levelEditorEngine.getLevels());
    setCurrentLevelState(levelEditorEngine.getCurrentLevel());
    setPlayResults(levelEditorEngine.getPlayResults());
  }, []);

  useEffect(() => {
    levelEditorEngine.loadFromLocalStorage();
    setTimeout(() => {
      refreshState();
    }, 0);
  }, [refreshState]);

  const setCurrentTab = useCallback((tab: LevelEditorTab) => {
    levelEditorEngine.setCurrentTab(tab);
    refreshState();
  }, [refreshState]);

  const setCurrentLevel = useCallback((level: LevelScene | null) => {
    levelEditorEngine.setCurrentLevel(level);
    refreshState();
  }, [refreshState]);

  const getLevelsByCategory = useCallback((category: LevelCategory): LevelScene[] => {
    return levelEditorEngine.getLevelsByCategory(category);
  }, []);

  const getLevelById = useCallback((id: string): LevelScene | undefined => {
    return levelEditorEngine.getLevelById(id);
  }, []);

  const createEmptyLevel = useCallback((): LevelScene => {
    const level = levelEditorEngine.createEmptyLevel();
    refreshState();
    return level;
  }, [refreshState]);

  const createLevel = useCallback((
    name: string,
    description: string,
    buildings: EditorBuilding[],
    airCurrents: EditorAirCurrent[],
    objectives: Objective[],
    winCondition: WinCondition,
    loseCondition: LoseCondition,
    gameConfig: Partial<GameConfig>,
    weatherConfig: Partial<WeatherConfig>,
    startPosition: Vector3,
    icon: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme',
    tags: string[]
  ): LevelScene => {
    const level = levelEditorEngine.createLevel(
      name, description, buildings, airCurrents, objectives,
      winCondition, loseCondition, gameConfig, weatherConfig,
      startPosition, icon, difficulty, tags
    );
    refreshState();
    return level;
  }, [refreshState]);

  const updateLevel = useCallback((levelId: string, updates: Partial<LevelScene>): boolean => {
    const success = levelEditorEngine.updateLevel(levelId, updates);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteLevel = useCallback((levelId: string): boolean => {
    const success = levelEditorEngine.deleteLevel(levelId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const toggleFavorite = useCallback((levelId: string): boolean => {
    const success = levelEditorEngine.toggleFavorite(levelId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const duplicateLevel = useCallback((levelId: string): LevelScene | null => {
    const level = levelEditorEngine.duplicateLevel(levelId);
    if (level) {
      refreshState();
    }
    return level;
  }, [refreshState]);

  const setSelectedBuilding = useCallback((buildingId: string | null) => {
    levelEditorEngine.setSelectedBuilding(buildingId);
    refreshState();
  }, [refreshState]);

  const setSelectedAirCurrent = useCallback((airCurrentId: string | null) => {
    levelEditorEngine.setSelectedAirCurrent(airCurrentId);
    refreshState();
  }, [refreshState]);

  const setSelectedObjective = useCallback((objectiveId: string | null) => {
    levelEditorEngine.setSelectedObjective(objectiveId);
    refreshState();
  }, [refreshState]);

  const addBuilding = useCallback((building: Omit<EditorBuilding, 'id'>): boolean => {
    const success = levelEditorEngine.addBuilding(building);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateBuilding = useCallback((buildingId: string, updates: Partial<EditorBuilding>): boolean => {
    const success = levelEditorEngine.updateBuilding(buildingId, updates);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteBuilding = useCallback((buildingId: string): boolean => {
    const success = levelEditorEngine.deleteBuilding(buildingId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const addAirCurrent = useCallback((airCurrent: Omit<EditorAirCurrent, 'id'>): boolean => {
    const success = levelEditorEngine.addAirCurrent(airCurrent);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateAirCurrent = useCallback((airCurrentId: string, updates: Partial<EditorAirCurrent>): boolean => {
    const success = levelEditorEngine.updateAirCurrent(airCurrentId, updates);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteAirCurrent = useCallback((airCurrentId: string): boolean => {
    const success = levelEditorEngine.deleteAirCurrent(airCurrentId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const addObjective = useCallback((objective: Omit<Objective, 'id' | 'completed'>): boolean => {
    const success = levelEditorEngine.addObjective(objective);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateObjective = useCallback((objectiveId: string, updates: Partial<Objective>): boolean => {
    const success = levelEditorEngine.updateObjective(objectiveId, updates);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const deleteObjective = useCallback((objectiveId: string): boolean => {
    const success = levelEditorEngine.deleteObjective(objectiveId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateWinCondition = useCallback((winCondition: WinCondition): boolean => {
    const success = levelEditorEngine.updateWinCondition(winCondition);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateLoseCondition = useCallback((loseCondition: LoseCondition): boolean => {
    const success = levelEditorEngine.updateLoseCondition(loseCondition);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateGameConfig = useCallback((config: Partial<GameConfig>): boolean => {
    const success = levelEditorEngine.updateGameConfig(config);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateWeatherConfig = useCallback((config: Partial<WeatherConfig>): boolean => {
    const success = levelEditorEngine.updateWeatherConfig(config);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const updateStartPosition = useCallback((position: Vector3): boolean => {
    const success = levelEditorEngine.updateStartPosition(position);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const getGameConfigOverride = useCallback((level: LevelScene): Partial<GameConfig> | null => {
    return levelEditorEngine.getGameConfigOverride(level);
  }, []);

  const getWeatherConfigOverride = useCallback((level: LevelScene): Partial<WeatherConfig> => {
    return levelEditorEngine.getWeatherConfigOverride(level);
  }, []);

  const getLevelStats = useCallback((levelId: string): LevelStats => {
    return levelEditorEngine.getLevelStats(levelId);
  }, []);

  const addPlayResult = useCallback((
    levelId: string,
    levelName: string,
    stats: GameStats,
    completedObjectives: string[],
    isWin: boolean,
    isLose: boolean
  ): LevelPlayResult => {
    const result = levelEditorEngine.addPlayResult(
      levelId, levelName, stats, completedObjectives, isWin, isLose
    );
    refreshState();
    return result;
  }, [refreshState]);

  const checkObjectives = useCallback((
    level: LevelScene,
    stats: GameStats,
    kitePosition: Vector3
  ): { completed: string[]; isWin: boolean; isLose: boolean } => {
    return levelEditorEngine.checkObjectives(level, stats, kitePosition);
  }, []);

  const getPlayResultsByLevel = useCallback((levelId: string): LevelPlayResult[] => {
    return levelEditorEngine.getPlayResultsByLevel(levelId);
  }, []);

  const generateBuildingDefaults = useCallback((): Omit<EditorBuilding, 'id'> => {
    return levelEditorEngine.generateBuildingDefaults();
  }, []);

  const generateAirCurrentDefaults = useCallback((): Omit<EditorAirCurrent, 'id'> => {
    return levelEditorEngine.generateAirCurrentDefaults();
  }, []);

  const generateObjectiveDefaults = useCallback((): Omit<Objective, 'id' | 'completed'> => {
    return levelEditorEngine.generateObjectiveDefaults();
  }, []);

  const exportLevel = useCallback((levelId: string): string | null => {
    return levelEditorEngine.exportLevel(levelId);
  }, []);

  const importLevel = useCallback((jsonString: string): LevelScene | null => {
    const level = levelEditorEngine.importLevel(jsonString);
    if (level) {
      refreshState();
    }
    return level;
  }, [refreshState]);

  const deletePlayResult = useCallback((resultId: string): boolean => {
    const success = levelEditorEngine.deletePlayResult(resultId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const clearAllData = useCallback(() => {
    levelEditorEngine.clearAllData();
    refreshState();
  }, [refreshState]);

  return {
    state,
    levels,
    currentLevel,
    playResults,
    setCurrentTab,
    setCurrentLevel,
    getLevelsByCategory,
    getLevelById,
    createEmptyLevel,
    createLevel,
    updateLevel,
    deleteLevel,
    toggleFavorite,
    duplicateLevel,
    setSelectedBuilding,
    setSelectedAirCurrent,
    setSelectedObjective,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    addAirCurrent,
    updateAirCurrent,
    deleteAirCurrent,
    addObjective,
    updateObjective,
    deleteObjective,
    updateWinCondition,
    updateLoseCondition,
    updateGameConfig,
    updateWeatherConfig,
    updateStartPosition,
    getGameConfigOverride,
    getWeatherConfigOverride,
    getLevelStats,
    addPlayResult,
    checkObjectives,
    getPlayResultsByLevel,
    generateBuildingDefaults,
    generateAirCurrentDefaults,
    generateObjectiveDefaults,
    exportLevel,
    importLevel,
    deletePlayResult,
    clearAllData,
    refreshState,
  };
}

export const levelEditorStateEmitter = {
  listeners: new Set<() => void>(),
  emit() {
    this.listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};
