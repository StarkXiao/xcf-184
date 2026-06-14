import type {
  WeatherScene,
  WeatherLabState,
  WindFieldConfig,
  FlightRecord,
  FlightDataPoint,
  AnomalyEvent,
  AnomalyType,
  ComparisonGroup,
  SceneStats,
  SceneCategory,
} from './types';
import type {
  WeatherConfig,
  GameConfig,
  GameStats,
  Vector3,
} from '../game/types';
import { PRESET_SCENES } from './weatherLabData';

export class WeatherLabEngine {
  private state: WeatherLabState;

  constructor() {
    this.state = {
      currentTab: 'windConfig',
      currentScene: null,
      scenes: [...PRESET_SCENES],
      flightRecords: [],
      anomalyEvents: [],
      comparisonGroups: [],
      activeComparisonGroup: null,
      selectedAnomaly: null,
    };
  }

  public getState(): WeatherLabState {
    return { ...this.state };
  }

  public getScenes(): WeatherScene[] {
    return [...this.state.scenes];
  }

  public getScenesByCategory(category: SceneCategory): WeatherScene[] {
    if (category === 'favorite') {
      return this.state.scenes.filter((s) => s.isFavorite);
    }
    return this.state.scenes.filter((s) => s.category === category);
  }

  public getSceneById(id: string): WeatherScene | undefined {
    return this.state.scenes.find((s) => s.id === id);
  }

  public getCurrentScene(): WeatherScene | null {
    return this.state.currentScene;
  }

  public setCurrentScene(scene: WeatherScene | null): void {
    this.state.currentScene = scene;
  }

  public createScene(
    name: string,
    description: string,
    weatherConfig: WeatherConfig,
    gameConfig: Partial<GameConfig>,
    windField: WindFieldConfig,
    icon: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme',
    tags: string[]
  ): WeatherScene {
    const now = Date.now();
    const scene: WeatherScene = {
      id: `scene_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category: 'saved',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      weatherConfig,
      gameConfig,
      windField,
      icon,
      difficulty,
      tags,
    };
    this.state.scenes.push(scene);
    this.saveToLocalStorage();
    return scene;
  }

  public updateScene(sceneId: string, updates: Partial<WeatherScene>): boolean {
    const index = this.state.scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return false;

    const scene = this.state.scenes[index];
    if (scene.category === 'preset') {
      const copy: WeatherScene = {
        ...scene,
        ...updates,
        id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category: 'saved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: updates.name || `${scene.name} (副本)`,
      };
      this.state.scenes.push(copy);
      this.state.currentScene = copy;
      this.saveToLocalStorage();
      return true;
    }

    this.state.scenes[index] = {
      ...scene,
      ...updates,
      updatedAt: Date.now(),
    };

    if (this.state.currentScene?.id === sceneId) {
      this.state.currentScene = this.state.scenes[index];
    }

    this.saveToLocalStorage();
    return true;
  }

  public deleteScene(sceneId: string): boolean {
    const index = this.state.scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return false;

    const scene = this.state.scenes[index];
    if (scene.category === 'preset') return false;

    this.state.scenes.splice(index, 1);

    if (this.state.currentScene?.id === sceneId) {
      this.state.currentScene = null;
    }

    this.saveToLocalStorage();
    return true;
  }

  public toggleFavorite(sceneId: string): boolean {
    const scene = this.state.scenes.find((s) => s.id === sceneId);
    if (!scene) return false;

    scene.isFavorite = !scene.isFavorite;
    scene.updatedAt = Date.now();

    if (this.state.currentScene?.id === sceneId) {
      this.state.currentScene = { ...scene };
    }

    this.saveToLocalStorage();
    return true;
  }

  public duplicateScene(sceneId: string): WeatherScene | null {
    const original = this.state.scenes.find((s) => s.id === sceneId);
    if (!original) return null;

    const now = Date.now();
    const copy: WeatherScene = {
      ...original,
      id: `scene_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (副本)`,
      category: 'saved',
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
    };

    this.state.scenes.push(copy);
    this.saveToLocalStorage();
    return copy;
  }

  public createFlightRecord(
    sceneId: string,
    sceneName: string,
    stats: GameStats,
    weatherConfig: WeatherConfig,
    windField: WindFieldConfig,
    flightDataPoints: FlightDataPoint[],
    kiteConfig?: FlightRecord['kiteConfig']
  ): FlightRecord {
    const now = Date.now();
    const duration = stats.time;

    const isAnomaly = this.detectAnomaly(stats, flightDataPoints);
    let anomalyType: AnomalyType | undefined;
    let anomalyDescription: string | undefined;

    if (isAnomaly) {
      const analysis = this.analyzeAnomaly(stats, flightDataPoints);
      anomalyType = analysis.type;
      anomalyDescription = analysis.description;
    }

    const record: FlightRecord = {
      id: `record_${now}_${Math.random().toString(36).substr(2, 9)}`,
      sceneId,
      sceneName,
      startTime: now - duration * 1000,
      endTime: now,
      duration,
      stats,
      weatherConfig,
      windField,
      kiteConfig,
      isAnomaly,
      anomalyType,
      anomalyDescription,
      flightDataPoints,
    };

    this.state.flightRecords.unshift(record);

    if (isAnomaly && anomalyType) {
      this.createAnomalyEvent(record, anomalyType, flightDataPoints);
    }

    this.saveToLocalStorage();
    return record;
  }

  public getFlightRecords(): FlightRecord[] {
    return [...this.state.flightRecords];
  }

  public getFlightRecordsByScene(sceneId: string): FlightRecord[] {
    return this.state.flightRecords.filter((r) => r.sceneId === sceneId);
  }

  public getAnomalyEvents(): AnomalyEvent[] {
    return [...this.state.anomalyEvents];
  }

  public getAnomalyEventsByType(type: AnomalyType): AnomalyEvent[] {
    return this.state.anomalyEvents.filter((e) => e.type === type);
  }

  public getUnreviewedAnomalies(): AnomalyEvent[] {
    return this.state.anomalyEvents.filter((e) => !e.isReviewed);
  }

  public markAnomalyReviewed(anomalyId: string): boolean {
    const anomaly = this.state.anomalyEvents.find((a) => a.id === anomalyId);
    if (!anomaly) return false;

    anomaly.isReviewed = true;
    this.saveToLocalStorage();
    return true;
  }

  public createComparisonGroup(name: string, flightRecordIds: string[], notes: string = ''): ComparisonGroup {
    const now = Date.now();
    const group: ComparisonGroup = {
      id: `comparison_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      flightRecordIds,
      createdAt: now,
      notes,
    };

    this.state.comparisonGroups.push(group);
    this.state.activeComparisonGroup = group;
    this.saveToLocalStorage();
    return group;
  }

  public addToComparisonGroup(groupId: string, flightRecordId: string): boolean {
    const group = this.state.comparisonGroups.find((g) => g.id === groupId);
    if (!group) return false;

    if (!group.flightRecordIds.includes(flightRecordId)) {
      group.flightRecordIds.push(flightRecordId);
      if (this.state.activeComparisonGroup?.id === groupId) {
        this.state.activeComparisonGroup = { ...group };
      }
      this.saveToLocalStorage();
    }
    return true;
  }

  public removeFromComparisonGroup(groupId: string, flightRecordId: string): boolean {
    const group = this.state.comparisonGroups.find((g) => g.id === groupId);
    if (!group) return false;

    const index = group.flightRecordIds.indexOf(flightRecordId);
    if (index > -1) {
      group.flightRecordIds.splice(index, 1);
      if (this.state.activeComparisonGroup?.id === groupId) {
        this.state.activeComparisonGroup = { ...group };
      }
      this.saveToLocalStorage();
    }
    return true;
  }

  public setActiveComparisonGroup(groupId: string | null): void {
    if (groupId === null) {
      this.state.activeComparisonGroup = null;
      return;
    }
    const group = this.state.comparisonGroups.find((g) => g.id === groupId);
    this.state.activeComparisonGroup = group || null;
  }

  public getComparisonGroups(): ComparisonGroup[] {
    return [...this.state.comparisonGroups];
  }

  public getComparisonRecords(groupId: string): FlightRecord[] {
    const group = this.state.comparisonGroups.find((g) => g.id === groupId);
    if (!group) return [];

    return group.flightRecordIds
      .map((id) => this.state.flightRecords.find((r) => r.id === id))
      .filter((r): r is FlightRecord => r !== undefined);
  }

  public getSceneStats(sceneId: string): SceneStats {
    const records = this.getFlightRecordsByScene(sceneId);

    if (records.length === 0) {
      return {
        totalFlights: 0,
        bestScore: 0,
        avgScore: 0,
        bestDistance: 0,
        bestHeight: 0,
        successRate: 0,
        anomalyCount: 0,
      };
    }

    const scores = records.map((r) => r.stats.score);
    const distances = records.map((r) => r.stats.distance);
    const heights = records.map((r) => r.stats.maxHeight);
    const anomalyCount = records.filter((r) => r.isAnomaly).length;

    return {
      totalFlights: records.length,
      bestScore: Math.max(...scores),
      avgScore: Math.floor(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestDistance: Math.max(...distances),
      bestHeight: Math.max(...heights),
      successRate: Math.floor(((records.length - anomalyCount) / records.length) * 100),
      anomalyCount,
    };
  }

  public setCurrentTab(tab: WeatherLabState['currentTab']): void {
    this.state.currentTab = tab;
  }

  public setSelectedAnomaly(anomaly: AnomalyEvent | null): void {
    this.state.selectedAnomaly = anomaly;
  }

  public getGameConfigOverride(scene: WeatherScene): Partial<GameConfig> | null {
    return scene.gameConfig || null;
  }

  public getWeatherConfigOverride(scene: WeatherScene): Partial<WeatherConfig> {
    return {
      windSpeed: scene.weatherConfig.windSpeed,
      windDirection: { ...scene.weatherConfig.windDirection },
      cloudCoverage: scene.weatherConfig.cloudCoverage,
      timeOfDay: scene.weatherConfig.timeOfDay,
      turbulenceLevel: scene.weatherConfig.turbulenceLevel,
      timeOfDayFrozen: scene.weatherConfig.timeOfDayFrozen ?? false,
      windField: {
        windSpeed: scene.windField.windSpeed,
        windDirection: { ...scene.windField.windDirection },
        turbulenceLevel: scene.windField.turbulenceLevel,
        gustStrength: scene.windField.gustStrength,
        gustFrequency: scene.windField.gustFrequency,
        shearFactor: scene.windField.shearFactor,
        boundaryLayerHeight: scene.windField.boundaryLayerHeight,
        windDirectionLocked: scene.windField.windDirectionLocked ?? true,
      },
    };
  }

  public generateWindFieldPreview(windField: WindFieldConfig, height: number): Vector3 {
    const heightFactor = Math.min(1, height / windField.boundaryLayerHeight);
    const shearEffect = windField.shearFactor * heightFactor;

    const gust = Math.sin(Date.now() * windField.gustFrequency * 0.01) * windField.gustStrength;
    const turbulence = (Math.random() - 0.5) * windField.turbulenceLevel * 0.1;

    return {
      x: windField.windDirection.x * (windField.windSpeed + gust + turbulence) * (1 + shearEffect),
      y: windField.windDirection.y * (windField.windSpeed + gust) * (1 + shearEffect),
      z: windField.windDirection.z * (windField.windSpeed + gust + turbulence) * (1 + shearEffect),
    };
  }

  private detectAnomaly(stats: GameStats, dataPoints: FlightDataPoint[]): boolean {
    if (stats.collisions > 0) return true;

    if (stats.flightStability < 0.3) return true;

    if (dataPoints.length > 10) {
      let instabilityCount = 0;
      for (let i = 1; i < dataPoints.length; i++) {
        const prev = dataPoints[i - 1];
        const curr = dataPoints[i];

        const velocityChange = Math.abs(
          curr.velocity.x - prev.velocity.x +
          curr.velocity.y - prev.velocity.y +
          curr.velocity.z - prev.velocity.z
        );

        if (velocityChange > 2 || curr.stability < 0.2) {
          instabilityCount++;
        }
      }
      if (instabilityCount > dataPoints.length * 0.3) return true;
    }

    const suddenDrops = dataPoints.filter((p, i) => {
      if (i === 0) return false;
      return dataPoints[i - 1].position.y - p.position.y > 10;
    });
    if (suddenDrops.length > 2) return true;

    return false;
  }

  private analyzeAnomaly(stats: GameStats, dataPoints: FlightDataPoint[]): { type: AnomalyType; description: string } {
    if (stats.collisions > 0) {
      const collisionPoint = dataPoints.find((p) => p.stability < 0.1);
      return {
        type: 'crash',
        description: collisionPoint
          ? `在高度 ${Math.round(collisionPoint.position.y)} 米处发生碰撞`
          : '飞行过程中发生碰撞导致坠毁',
      };
    }

    const avgStability = dataPoints.reduce((sum, p) => sum + p.stability, 0) / dataPoints.length;
    if (avgStability < 0.4) {
      return {
        type: 'instability',
        description: `平均飞行稳定性仅为 ${(avgStability * 100).toFixed(1)}%，低于安全阈值`,
      };
    }

    const maxTurbulence = Math.max(...dataPoints.map((p) =>
      Math.abs(p.airCurrentForce.x) + Math.abs(p.airCurrentForce.y) + Math.abs(p.airCurrentForce.z)
    ));
    if (maxTurbulence > 0.5) {
      return {
        type: 'turbulence',
        description: `检测到强烈湍流，最大扰动力达到 ${maxTurbulence.toFixed(3)}`,
      };
    }

    const suddenDrops = dataPoints.filter((p, i) => {
      if (i === 0) return false;
      return dataPoints[i - 1].position.y - p.position.y > 15;
    });
    if (suddenDrops.length > 0) {
      const worstDrop = Math.max(...suddenDrops.map((_, i) => {
        const idx = dataPoints.indexOf(suddenDrops[i]);
        return dataPoints[idx - 1].position.y - dataPoints[idx].position.y;
      }));
      return {
        type: 'unexpected_drop',
        description: `检测到突然失速，最大下降幅度达 ${worstDrop.toFixed(1)} 米`,
      };
    }

    return {
      type: 'control_loss',
      description: '飞行过程中出现异常操控状态，建议检查风筝配置',
    };
  }

  private createAnomalyEvent(record: FlightRecord, type: AnomalyType, allDataPoints: FlightDataPoint[]): AnomalyEvent {
    const anomalyStart = Math.floor(allDataPoints.length * 0.6);
    const anomalyDataPoints = allDataPoints.slice(Math.max(0, anomalyStart - 20));

    const severity = this.calculateSeverity(type, record.stats, anomalyDataPoints);
    const { cause, recommendations } = this.diagnoseAnomaly(type, record, anomalyDataPoints);

    const event: AnomalyEvent = {
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flightRecordId: record.id,
      type,
      startTime: anomalyDataPoints[0]?.timestamp || 0,
      endTime: anomalyDataPoints[anomalyDataPoints.length - 1]?.timestamp || 0,
      severity,
      description: record.anomalyDescription || '',
      dataPoints: anomalyDataPoints,
      probableCause: cause,
      recommendations,
      isReviewed: false,
    };

    this.state.anomalyEvents.unshift(event);
    return event;
  }

  private calculateSeverity(type: AnomalyType, stats: GameStats, dataPoints: FlightDataPoint[]): number {
    let severity = 0;

    if (type === 'crash') severity += 40;
    if (type === 'unexpected_drop') severity += 30;
    if (type === 'turbulence') severity += 25;
    if (type === 'instability') severity += 20;
    if (type === 'control_loss') severity += 35;

    severity += Math.floor((1 - stats.flightStability) * 30);
    severity += Math.min(30, stats.collisions * 10);

    const avgForce = dataPoints.reduce((sum, p) => {
      return sum + Math.abs(p.airCurrentForce.x) + Math.abs(p.airCurrentForce.y) + Math.abs(p.airCurrentForce.z);
    }, 0) / (dataPoints.length || 1);
    severity += Math.min(30, avgForce * 50);

    return Math.min(100, severity);
  }

  private diagnoseAnomaly(
    type: AnomalyType,
    record: FlightRecord,
    dataPoints: FlightDataPoint[]
  ): { cause: string; recommendations: string[] } {
    const windStrength = record.windField.windSpeed;
    const turbulence = record.windField.turbulenceLevel;

    let cause = '待进一步分析';
    const recommendations: string[] = [];

    switch (type) {
      case 'crash':
        if (record.stats.collisions > 0) {
          cause = '与建筑物碰撞导致坠毁';
          recommendations.push('在高楼密集区域飞行时保持更高的安全高度');
          recommendations.push('升级风筝的机动性以提高避障能力');
        } else {
          cause = '高度过低触地坠毁';
          recommendations.push('注意监控飞行高度，避免低于安全阈值');
          recommendations.push('在低空区域增加升力配置');
        }
        break;

      case 'instability':
        if (turbulence > 0.5) {
          cause = '高湍流环境下风筝稳定性不足';
          recommendations.push('在湍流环境下使用稳定性更好的风筝配置');
          recommendations.push('升级风筝骨架和尾部配件以提升稳定性');
        } else if (windStrength < 0.2) {
          cause = '低风速下升力不足导致飞行不稳定';
          recommendations.push('在低风速环境下选择升力更强的风筝面');
          recommendations.push('适当放长风筝线以获得更好的升力');
        } else {
          cause = '风筝配置与当前风场不匹配';
          recommendations.push('检查风筝配件搭配是否适合当前风力条件');
          recommendations.push('调整飞行姿态以适应当前风向');
        }
        break;

      case 'turbulence':
        cause = '遭遇强烈气流扰动';
        recommendations.push('避开云层下方和建筑物背风面的湍流区域');
        recommendations.push('提升风筝的抗风属性以应对湍流');
        recommendations.push('在湍流中保持稳定的操控，避免剧烈转向');
        break;

      case 'unexpected_drop': {
        const downDrafts = dataPoints.filter((p) => p.airCurrentForce.y < -0.1);
        if (downDrafts.length > 5) {
          cause = '遭遇下降气流导致快速失速';
          recommendations.push('注意观察云层变化，避开可能产生下降气流的区域');
          recommendations.push('在发现下降气流时及时转向或加速脱离');
        } else {
          cause = '操控不当或风切变导致突然失速';
          recommendations.push('练习失速恢复技巧，遇到下降时及时推杆加速');
          recommendations.push('关注风场垂直切变的影响');
        }
        break;
      }

      case 'control_loss':
        if (windStrength > 0.8) {
          cause = '强风超出风筝可控范围';
          recommendations.push('在强风天气选择抗风等级更高的风筝配置');
          recommendations.push('避免在风速超过风筝设计极限时飞行');
        } else {
          cause = '风筝线张力异常或操控系统故障';
          recommendations.push('飞行前检查风筝线和连接部件');
          recommendations.push('保持适当的线张力，避免过松或过紧');
        }
        break;
    }

    recommendations.push('前往工坊优化风筝配置以提升飞行表现');

    return { cause, recommendations };
  }

  public exportScene(sceneId: string): string | null {
    const scene = this.state.scenes.find((s) => s.id === sceneId);
    if (!scene) return null;
    return JSON.stringify(scene, null, 2);
  }

  public importScene(jsonString: string): WeatherScene | null {
    try {
      const scene = JSON.parse(jsonString) as WeatherScene;

      if (!scene.id || !scene.name || !scene.weatherConfig) {
        return null;
      }

      scene.id = `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      scene.category = 'saved';
      scene.createdAt = Date.now();
      scene.updatedAt = Date.now();
      scene.isFavorite = false;

      this.state.scenes.push(scene);
      this.saveToLocalStorage();
      return scene;
    } catch (e) {
      console.error('Failed to import scene:', e);
      return null;
    }
  }

  public deleteFlightRecord(recordId: string): boolean {
    const index = this.state.flightRecords.findIndex((r) => r.id === recordId);
    if (index === -1) return false;

    this.state.flightRecords.splice(index, 1);

    this.state.anomalyEvents = this.state.anomalyEvents.filter(
      (e) => e.flightRecordId !== recordId
    );

    this.state.comparisonGroups.forEach((group) => {
      const idx = group.flightRecordIds.indexOf(recordId);
      if (idx > -1) {
        group.flightRecordIds.splice(idx, 1);
      }
    });

    this.saveToLocalStorage();
    return true;
  }

  public deleteComparisonGroup(groupId: string): boolean {
    const index = this.state.comparisonGroups.findIndex((g) => g.id === groupId);
    if (index === -1) return false;

    this.state.comparisonGroups.splice(index, 1);

    if (this.state.activeComparisonGroup?.id === groupId) {
      this.state.activeComparisonGroup = null;
    }

    this.saveToLocalStorage();
    return true;
  }

  public clearAllData(): void {
    this.state.scenes = this.state.scenes.filter((s) => s.category === 'preset');
    this.state.flightRecords = [];
    this.state.anomalyEvents = [];
    this.state.comparisonGroups = [];
    this.state.currentScene = null;
    this.state.activeComparisonGroup = null;
    this.state.selectedAnomaly = null;
    this.saveToLocalStorage();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        scenes: this.state.scenes.filter((s) => s.category !== 'preset'),
        flightRecords: this.state.flightRecords,
        anomalyEvents: this.state.anomalyEvents,
        comparisonGroups: this.state.comparisonGroups,
      };
      localStorage.setItem('kite_weatherlab_save', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save weather lab data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem('kite_weatherlab_save');
      if (!saved) return false;

      const data = JSON.parse(saved);

      const presetScenes = this.state.scenes.filter((s) => s.category === 'preset');

      if (data.scenes) {
        this.state.scenes = [...presetScenes, ...data.scenes];
      }

      if (data.flightRecords) {
        this.state.flightRecords = data.flightRecords;
      }

      if (data.anomalyEvents) {
        this.state.anomalyEvents = data.anomalyEvents;
      }

      if (data.comparisonGroups) {
        this.state.comparisonGroups = data.comparisonGroups;
      }

      return true;
    } catch (e) {
      console.error('Failed to load weather lab data:', e);
      return false;
    }
  }
}

export const weatherLabEngine = new WeatherLabEngine();
