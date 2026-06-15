import type {
  LevelScene,
  LevelEditorState,
  EditorBuilding,
  EditorAirCurrent,
  Objective,
  WinCondition,
  LoseCondition,
  LevelPlayResult,
  LevelStats,
  LevelCategory,
  Vector3,
  GameConfig,
  WeatherConfig,
  GameStats,
} from './types';
import { PRESET_LEVELS } from './levelEditorData';
import { BUILDING_COLORS } from './types';
import { DEFAULT_COMBO_FLOW_STATE } from '../game/types';

export class LevelEditorEngine {
  private state: LevelEditorState;

  constructor() {
    this.state = {
      currentTab: 'buildings',
      currentLevel: null,
      levels: [...PRESET_LEVELS],
      selectedBuildingId: null,
      selectedAirCurrentId: null,
      selectedObjectiveId: null,
      playResults: [],
    };
  }

  public getState(): LevelEditorState {
    return { ...this.state };
  }

  public getLevels(): LevelScene[] {
    return [...this.state.levels];
  }

  public getLevelsByCategory(category: LevelCategory): LevelScene[] {
    if (category === 'favorite') {
      return this.state.levels.filter((s) => s.isFavorite);
    }
    return this.state.levels.filter((s) => s.category === category);
  }

  public getLevelById(id: string): LevelScene | undefined {
    return this.state.levels.find((s) => s.id === id);
  }

  public getCurrentLevel(): LevelScene | null {
    return this.state.currentLevel;
  }

  public setCurrentLevel(level: LevelScene | null): void {
    this.state.currentLevel = level;
    this.state.selectedBuildingId = null;
    this.state.selectedAirCurrentId = null;
    this.state.selectedObjectiveId = null;
  }

  public setCurrentTab(tab: LevelEditorState['currentTab']): void {
    this.state.currentTab = tab;
  }

  public createEmptyLevel(): LevelScene {
    const now = Date.now();
    const level: LevelScene = {
      id: `level_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: '新建关卡',
      description: '一个新的自定义关卡',
      category: 'saved',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      buildings: [],
      airCurrents: [],
      objectives: [],
      winCondition: {
        type: 'allObjectives',
      },
      loseCondition: {
        type: 'crash',
        enabled: true,
      },
      globalSettings: {
        gravity: 0.015,
        windSpeed: 0.3,
        turbulence: 0.1,
      },
      gameConfig: {
        worldSize: 500,
        gravity: 0.015,
        airCurrentSpawnRate: 0,
        buildingDensity: 0,
      },
      weatherConfig: {
        windSpeed: 0.3,
        windDirection: { x: 0, y: 0, z: -0.5 },
        cloudCoverage: 0.3,
        timeOfDay: 0.5,
        turbulenceLevel: 0.1,
        timeOfDayFrozen: true,
      },
      startPosition: { x: 0, y: 80, z: 50 },
      icon: '📝',
      difficulty: 'easy',
      tags: [],
    };
    this.state.levels.push(level);
    this.state.currentLevel = level;
    this.saveToLocalStorage();
    return level;
  }

  public createLevel(
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
  ): LevelScene {
    const now = Date.now();
    const level: LevelScene = {
      id: `level_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category: 'saved',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      buildings,
      airCurrents,
      objectives,
      winCondition,
      loseCondition,
      globalSettings: {
        gravity: gameConfig.gravity ?? 0.015,
        windSpeed: weatherConfig.windSpeed ?? 0.3,
        turbulence: weatherConfig.turbulenceLevel ?? 0.1,
      },
      gameConfig,
      weatherConfig,
      startPosition,
      icon,
      difficulty,
      tags,
    };
    this.state.levels.push(level);
    this.state.currentLevel = level;
    this.saveToLocalStorage();
    return level;
  }

  public updateLevel(levelId: string, updates: Partial<LevelScene>): boolean {
    const index = this.state.levels.findIndex((s) => s.id === levelId);
    if (index === -1) return false;

    const level = this.state.levels[index];
    if (level.category === 'preset') {
      const copy: LevelScene = {
        ...level,
        ...updates,
        id: `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'saved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: updates.name || `${level.name} (副本)`,
      };
      this.state.levels.push(copy);
      this.state.currentLevel = copy;
      this.saveToLocalStorage();
      return true;
    }

    this.state.levels[index] = {
      ...level,
      ...updates,
      updatedAt: Date.now(),
    };

    if (this.state.currentLevel?.id === levelId) {
      this.state.currentLevel = this.state.levels[index];
    }

    this.saveToLocalStorage();
    return true;
  }

  public deleteLevel(levelId: string): boolean {
    const index = this.state.levels.findIndex((s) => s.id === levelId);
    if (index === -1) return false;

    const level = this.state.levels[index];
    if (level.category === 'preset') return false;

    this.state.levels.splice(index, 1);

    if (this.state.currentLevel?.id === levelId) {
      this.state.currentLevel = null;
    }

    this.saveToLocalStorage();
    return true;
  }

  public toggleFavorite(levelId: string): boolean {
    const level = this.state.levels.find((s) => s.id === levelId);
    if (!level) return false;

    level.isFavorite = !level.isFavorite;
    level.updatedAt = Date.now();

    if (this.state.currentLevel?.id === levelId) {
      this.state.currentLevel = { ...level };
    }

    this.saveToLocalStorage();
    return true;
  }

  public duplicateLevel(levelId: string): LevelScene | null {
    const original = this.state.levels.find((s) => s.id === levelId);
    if (!original) return null;

    const now = Date.now();
    const copy: LevelScene = {
      ...original,
      id: `level_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (副本)`,
      category: 'saved',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };

    this.state.levels.push(copy);
    this.saveToLocalStorage();
    return copy;
  }

  public setSelectedBuilding(buildingId: string | null): void {
    this.state.selectedBuildingId = buildingId;
  }

  public setSelectedAirCurrent(airCurrentId: string | null): void {
    this.state.selectedAirCurrentId = airCurrentId;
  }

  public setSelectedObjective(objectiveId: string | null): void {
    this.state.selectedObjectiveId = objectiveId;
  }

  public addBuilding(building: Omit<EditorBuilding, 'id'>): boolean {
    if (!this.state.currentLevel) return false;

    const newBuilding: EditorBuilding = {
      ...building,
      id: `building_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (!newBuilding.size && newBuilding.width && newBuilding.height && newBuilding.depth) {
      newBuilding.size = {
        x: newBuilding.width,
        y: newBuilding.height,
        z: newBuilding.depth,
      };
    }

    if (!newBuilding.width && newBuilding.size) {
      newBuilding.width = newBuilding.size.x;
      newBuilding.height = newBuilding.size.y;
      newBuilding.depth = newBuilding.size.z;
    }

    this.state.currentLevel.buildings.push(newBuilding);
    this.state.currentLevel.updatedAt = Date.now();
    this.state.selectedBuildingId = newBuilding.id;

    this.updateLevel(this.state.currentLevel.id, {
      buildings: this.state.currentLevel.buildings,
    });

    return true;
  }

  public updateBuilding(buildingId: string, updates: Partial<EditorBuilding>): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.buildings.findIndex((b) => b.id === buildingId);
    if (index === -1) return false;

    const updated = {
      ...this.state.currentLevel.buildings[index],
      ...updates,
    };

    if (updates.width !== undefined || updates.height !== undefined || updates.depth !== undefined) {
      updated.size = {
        x: updated.width,
        y: updated.height,
        z: updated.depth,
      };
    }

    if (updates.size !== undefined) {
      updated.width = updates.size.x;
      updated.height = updates.size.y;
      updated.depth = updates.size.z;
    }

    this.state.currentLevel.buildings[index] = updated;
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      buildings: this.state.currentLevel.buildings,
    });

    return true;
  }

  public deleteBuilding(buildingId: string): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.buildings.findIndex((b) => b.id === buildingId);
    if (index === -1) return false;

    this.state.currentLevel.buildings.splice(index, 1);
    this.state.currentLevel.updatedAt = Date.now();

    if (this.state.selectedBuildingId === buildingId) {
      this.state.selectedBuildingId = null;
    }

    this.updateLevel(this.state.currentLevel.id, {
      buildings: this.state.currentLevel.buildings,
    });

    return true;
  }

  public addAirCurrent(airCurrent: Omit<EditorAirCurrent, 'id'>): boolean {
    if (!this.state.currentLevel) return false;

    const newAirCurrent: EditorAirCurrent = {
      ...airCurrent,
      id: `air_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.state.currentLevel.airCurrents.push(newAirCurrent);
    this.state.currentLevel.updatedAt = Date.now();
    this.state.selectedAirCurrentId = newAirCurrent.id;

    this.updateLevel(this.state.currentLevel.id, {
      airCurrents: this.state.currentLevel.airCurrents,
    });

    return true;
  }

  public updateAirCurrent(airCurrentId: string, updates: Partial<EditorAirCurrent>): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.airCurrents.findIndex((a) => a.id === airCurrentId);
    if (index === -1) return false;

    this.state.currentLevel.airCurrents[index] = {
      ...this.state.currentLevel.airCurrents[index],
      ...updates,
    };
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      airCurrents: this.state.currentLevel.airCurrents,
    });

    return true;
  }

  public deleteAirCurrent(airCurrentId: string): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.airCurrents.findIndex((a) => a.id === airCurrentId);
    if (index === -1) return false;

    this.state.currentLevel.airCurrents.splice(index, 1);
    this.state.currentLevel.updatedAt = Date.now();

    if (this.state.selectedAirCurrentId === airCurrentId) {
      this.state.selectedAirCurrentId = null;
    }

    this.updateLevel(this.state.currentLevel.id, {
      airCurrents: this.state.currentLevel.airCurrents,
    });

    return true;
  }

  public addObjective(objective: Omit<Objective, 'id' | 'completed'>): boolean {
    if (!this.state.currentLevel) return false;

    const newObjective: Objective = {
      ...objective,
      id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
    };

    this.state.currentLevel.objectives.push(newObjective);
    this.state.currentLevel.updatedAt = Date.now();
    this.state.selectedObjectiveId = newObjective.id;

    this.updateLevel(this.state.currentLevel.id, {
      objectives: this.state.currentLevel.objectives,
    });

    return true;
  }

  public updateObjective(objectiveId: string, updates: Partial<Objective>): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.objectives.findIndex((o) => o.id === objectiveId);
    if (index === -1) return false;

    this.state.currentLevel.objectives[index] = {
      ...this.state.currentLevel.objectives[index],
      ...updates,
    };
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      objectives: this.state.currentLevel.objectives,
    });

    return true;
  }

  public deleteObjective(objectiveId: string): boolean {
    if (!this.state.currentLevel) return false;

    const index = this.state.currentLevel.objectives.findIndex((o) => o.id === objectiveId);
    if (index === -1) return false;

    this.state.currentLevel.objectives.splice(index, 1);
    this.state.currentLevel.updatedAt = Date.now();

    if (this.state.selectedObjectiveId === objectiveId) {
      this.state.selectedObjectiveId = null;
    }

    this.updateLevel(this.state.currentLevel.id, {
      objectives: this.state.currentLevel.objectives,
    });

    return true;
  }

  public updateWinCondition(winCondition: WinCondition): boolean {
    if (!this.state.currentLevel) return false;

    this.state.currentLevel.winCondition = winCondition;
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      winCondition,
    });

    return true;
  }

  public updateLoseCondition(loseCondition: LoseCondition): boolean {
    if (!this.state.currentLevel) return false;

    this.state.currentLevel.loseCondition = loseCondition;
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      loseCondition,
    });

    return true;
  }

  public updateGameConfig(config: Partial<GameConfig>): boolean {
    if (!this.state.currentLevel) return false;

    this.state.currentLevel.gameConfig = {
      ...this.state.currentLevel.gameConfig,
      ...config,
    };

    if (config.gravity !== undefined) {
      this.state.currentLevel.globalSettings.gravity = config.gravity;
    }

    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      gameConfig: this.state.currentLevel.gameConfig,
      globalSettings: this.state.currentLevel.globalSettings,
    });

    return true;
  }

  public updateWeatherConfig(config: Partial<WeatherConfig>): boolean {
    if (!this.state.currentLevel) return false;

    this.state.currentLevel.weatherConfig = {
      ...this.state.currentLevel.weatherConfig,
      ...config,
    };

    if (config.windSpeed !== undefined) {
      this.state.currentLevel.globalSettings.windSpeed = config.windSpeed;
    }
    if (config.turbulenceLevel !== undefined) {
      this.state.currentLevel.globalSettings.turbulence = config.turbulenceLevel;
    }

    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      weatherConfig: this.state.currentLevel.weatherConfig,
      globalSettings: this.state.currentLevel.globalSettings,
    });

    return true;
  }

  public updateStartPosition(position: Vector3): boolean {
    if (!this.state.currentLevel) return false;

    this.state.currentLevel.startPosition = position;
    this.state.currentLevel.updatedAt = Date.now();

    this.updateLevel(this.state.currentLevel.id, {
      startPosition: position,
    });

    return true;
  }

  public getGameConfigOverride(level: LevelScene): Partial<GameConfig> | null {
    return level.gameConfig || null;
  }

  public getWeatherConfigOverride(level: LevelScene): Partial<WeatherConfig> {
    return {
      windSpeed: level.weatherConfig.windSpeed ?? 0.3,
      windDirection: { ...(level.weatherConfig.windDirection || { x: 0, y: 0, z: -0.5 }) },
      cloudCoverage: level.weatherConfig.cloudCoverage ?? 0.3,
      timeOfDay: level.weatherConfig.timeOfDay ?? 0.5,
      turbulenceLevel: level.weatherConfig.turbulenceLevel ?? 0.1,
      timeOfDayFrozen: level.weatherConfig.timeOfDayFrozen ?? true,
    };
  }

  public getLevelStats(levelId: string): LevelStats {
    const records = this.state.playResults.filter((r) => r.levelId === levelId);

    if (records.length === 0) {
      return {
        totalPlays: 0,
        bestScore: 0,
        avgScore: 0,
        winRate: 0,
        bestTime: 0,
      };
    }

    const scores = records.map((r) => r.stats.score);
    const wins = records.filter((r) => r.isWin);
    const times = records.map((r) => r.duration);

    return {
      totalPlays: records.length,
      bestScore: Math.max(...scores),
      avgScore: Math.floor(scores.reduce((a, b) => a + b, 0) / scores.length),
      winRate: Math.floor((wins.length / records.length) * 100),
      bestTime: Math.min(...times),
    };
  }

  public addPlayResult(
    levelId: string,
    levelName: string,
    stats: GameStats,
    completedObjectives: string[],
    isWin: boolean,
    isLose: boolean
  ): LevelPlayResult {
    const result: LevelPlayResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      levelId,
      levelName,
      stats,
      completedObjectives,
      isWin,
      isLose,
      timestamp: Date.now(),
      duration: stats.time,
    };

    this.state.playResults.unshift(result);
    this.saveToLocalStorage();
    return result;
  }

  public checkObjectives(
    level: LevelScene,
    stats: GameStats,
    kitePosition: Vector3
  ): { completed: string[]; isWin: boolean; isLose: boolean } {
    const completed: string[] = [];

    for (const obj of level.objectives) {
      if (obj.completed) {
        completed.push(obj.id);
        continue;
      }

      let isObjCompleted = false;
      switch (obj.type) {
        case 'reachPoint':
          if (obj.position && obj.radius) {
          const dist = Math.sqrt(
            (kitePosition.x - obj.position.x) ** 2 +
            (kitePosition.y - obj.position.y) ** 2 +
            (kitePosition.z - obj.position.z) ** 2
          );
          isObjCompleted = dist < obj.radius;
          }
          break;
        case 'scoreTarget':
          if (obj.targetValue !== undefined) {
            isObjCompleted = stats.score >= obj.targetValue;
          }
          break;
        case 'timeLimit':
          if (obj.targetValue !== undefined) {
            isObjCompleted = stats.time >= obj.targetValue;
          }
          break;
        case 'distanceTarget':
          if (obj.targetValue !== undefined) {
            isObjCompleted = stats.distance >= obj.targetValue;
          }
          break;
        case 'heightTarget':
          if (obj.targetValue !== undefined) {
            isObjCompleted = stats.height >= obj.targetValue;
          }
          break;
      }

      if (isObjCompleted) {
        completed.push(obj.id);
      }
    }

    let isWin = false;
    switch (level.winCondition.type) {
      case 'allObjectives':
        isWin = completed.length === level.objectives.length && level.objectives.length > 0;
        break;
      case 'anyObjective':
        isWin = completed.length > 0;
        break;
      case 'scoreThreshold':
        isWin = stats.score >= (level.winCondition.targetScore ?? 0);
        break;
    }

    let isLose = false;
    switch (level.loseCondition.type) {
      case 'timeOut':
        isLose = stats.time >= (level.loseCondition.timeLimit ?? 0);
        break;
      case 'crash':
        isLose = stats.collisions > 0 || stats.height <= 0;
        break;
      case 'scoreBelow':
        isLose = stats.score < (level.loseCondition.minScore ?? 0);
        break;
    }

    return { completed, isWin, isLose };
  }

  public getPlayResults(): LevelPlayResult[] {
    return [...this.state.playResults];
  }

  public getPlayResultsByLevel(levelId: string): LevelPlayResult[] {
    return this.state.playResults.filter((r) => r.levelId === levelId);
  }

  public generateBuildingDefaults(): Omit<EditorBuilding, 'id'> {
    return {
      position: { x: 0, y: 30, z: -100 },
      width: 30,
      height: 60,
      depth: 30,
      size: { x: 30, y: 60, z: 30 },
      color: BUILDING_COLORS[Math.floor(Math.random() * BUILDING_COLORS.length)],
      isCollidable: true,
    };
  }

  public generateAirCurrentDefaults(): Omit<EditorAirCurrent, 'id'> {
    return {
      position: { x: 0, y: 60, z: -150 },
      radius: 40,
      strength: 0.15,
      direction: { x: 0, y: 0.15, z: 0 },
      type: 'updraft',
      isStatic: true,
    };
  }

  public generateObjectiveDefaults(): Omit<Objective, 'id' | 'completed'> {
    return {
      type: 'reachPoint',
      name: '新目标',
      description: '到达指定位置',
      position: { x: 0, y: 50, z: -100 },
      targetValue: 100,
      radius: 30,
    };
  }

  public exportLevel(levelId: string): string | null {
    const level = this.state.levels.find((s) => s.id === levelId);
    if (!level) return null;
    return JSON.stringify(level, null, 2);
  }

  public importLevel(jsonString: string): LevelScene | null {
    try {
      const level = JSON.parse(jsonString) as LevelScene;

      if (!level.id || !level.name) {
        return null;
      }

      level.id = `level_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      level.category = 'saved';
      level.createdAt = Date.now();
      level.updatedAt = Date.now();
      level.isFavorite = false;

      this.state.levels.push(level);
      this.state.currentLevel = level;
      this.saveToLocalStorage();
      return level;
    } catch (e) {
      console.error('Failed to import level:', e);
      return null;
    }
  }

  public recordLevelPlay(levelId: string, finalScore: number, isWin: boolean): LevelPlayResult {
    const level = this.getLevelById(levelId);
    const result: LevelPlayResult = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      levelId,
      levelName: level?.name ?? 'Unknown',
      stats: {
        score: finalScore,
        distance: 0,
        height: 0,
        time: 0,
        maxHeight: 0,
        airCurrentCount: 0,
        shadowTracking: 0,
        flightStability: 0,
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
        comboFlow: { ...DEFAULT_COMBO_FLOW_STATE, hits: [] },
      },
      completedObjectives: [],
      isWin,
      isLose: !isWin,
      timestamp: Date.now(),
      duration: 0,
    };
    this.state.playResults.push(result);
    this.saveToLocalStorage();
    return result;
  }

  public deletePlayResult(resultId: string): boolean {
    const index = this.state.playResults.findIndex((r) => r.id === resultId);
    if (index === -1) return false;

    this.state.playResults.splice(index, 1);
    this.saveToLocalStorage();
    return true;
  }

  public clearAllData(): void {
    this.state.levels = this.state.levels.filter((s) => s.category === 'preset');
    this.state.playResults = [];
    this.state.currentLevel = null;
    this.state.selectedBuildingId = null;
    this.state.selectedAirCurrentId = null;
    this.state.selectedObjectiveId = null;
    this.saveToLocalStorage();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        levels: this.state.levels.filter((s) => s.category !== 'preset'),
        playResults: this.state.playResults,
      };
      localStorage.setItem('kite_leveleditor_save', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save level editor data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem('kite_leveleditor_save');
      if (!saved) return false;

      const data = JSON.parse(saved);

      const presetLevels = this.state.levels.filter((s) => s.category === 'preset');

      if (data.levels) {
        this.state.levels = [...presetLevels, ...data.levels];
      }

      if (data.playResults) {
        this.state.playResults = data.playResults;
      }

      return true;
    } catch (e) {
      console.error('Failed to load level editor data:', e);
      return false;
    }
  }
}

export const levelEditorEngine = new LevelEditorEngine();
