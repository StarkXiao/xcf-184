import type {
  JourneyState,
  FlightRecord,
  Achievement,
  BestTrajectory,
  AnomalyEvent,
  GrowthDataPoint,
  FlightMode,
  TrajectoryPoint,
  AnomalyType,
} from './types';
import {
  FLIGHT_MODE_NAMES,
  PILOT_TITLES,
  RARITY_COLORS,
} from './types';
import type { GameStats } from '../game/types';
import { createDefaultJourneyState, createAchievements, experienceForLevel } from './journeyData';

const SAVE_KEY = 'kite_journey_save';

export type NewlyUnlockedAchievement = {
  achievement: Achievement;
  rewardCoins: number;
};

export class JourneyEngine {
  private state: JourneyState;
  private lastNewAchievements: NewlyUnlockedAchievement[] = [];

  constructor() {
    this.state = createDefaultJourneyState();
  }

  public getState(): JourneyState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getLastNewAchievements(): NewlyUnlockedAchievement[] {
    return [...this.lastNewAchievements];
  }

  public clearLastNewAchievements(): void {
    this.lastNewAchievements = [];
  }

  public recordFlight(params: {
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
  }): FlightRecord {
    const {
      mode,
      stats,
      adjustedScore,
      earnedCoins,
      weatherCondition,
      trackName,
      lessonName,
      sceneName,
      levelName,
      trajectory,
      equippedParts,
    } = params;

    const anomalies = this.detectAnomalies(stats, trajectory);

    const flightRecord: FlightRecord = {
      id: `flight_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mode,
      modeName: FLIGHT_MODE_NAMES[mode],
      timestamp: Date.now(),
      duration: stats.time,
      stats: { ...stats },
      adjustedScore,
      earnedCoins,
      weatherCondition,
      trackName,
      lessonName,
      sceneName,
      levelName,
      trajectory: trajectory ? trajectory.slice(0, 500) : undefined,
      anomalies,
      equippedParts,
    };

    this.state.flightRecords.unshift(flightRecord);
    if (this.state.flightRecords.length > 200) {
      this.state.flightRecords = this.state.flightRecords.slice(0, 200);
    }

    this.updateProfileAfterFlight(flightRecord);
    this.updateBestTrajectories(flightRecord);
    this.recordAnomalyEvents(flightRecord);
    this.updateGrowthHistory(flightRecord);
    this.lastNewAchievements = this.checkAndUnlockAchievements(flightRecord);
    this.saveToLocalStorage();

    return flightRecord;
  }

  private detectAnomalies(stats: GameStats, trajectory?: TrajectoryPoint[]): string[] {
    const anomalies: AnomalyType[] = [];

    if (stats.collisions > 0) {
      anomalies.push('building_collision');
    }

    if (stats.flightStability < 0.3 && stats.time > 30) {
      anomalies.push('turbulence_loss');
    }

    if (trajectory && trajectory.length > 10) {
      let hasRapidDescent = false;
      let hasDowndraft = false;

      for (let i = 5; i < trajectory.length; i++) {
        const prev = trajectory[i - 5];
        const curr = trajectory[i];
        const heightDrop = prev.y - curr.y;
        const timeDiff = (curr.t - prev.t) / 1000;

        if (timeDiff > 0 && heightDrop / timeDiff > 30) {
          hasRapidDescent = true;
        }

        if (heightDrop > 40 && curr.stability < 0.4) {
          hasDowndraft = true;
        }
      }

      if (hasRapidDescent) anomalies.push('rapid_descent');
      if (hasDowndraft) anomalies.push('downdraft_drop');
    }

    if (stats.height < 10 && stats.time > 20 && stats.collisions > 0) {
      anomalies.push('crash');
    }

    if (stats.shadowTracking < 0.2 && stats.time > 45) {
      anomalies.push('stall');
    }

    return Array.from(new Set(anomalies));
  }

  private updateProfileAfterFlight(record: FlightRecord): void {
    const profile = this.state.profile;
    const stats = record.stats;

    profile.totalFlights += 1;
    profile.totalFlightTime += record.duration;
    profile.totalDistance += stats.distance;
    profile.totalScore += record.adjustedScore;
    profile.totalAirCurrents += stats.airCurrentCount;
    profile.totalCollisions += stats.collisions;

    if (stats.collisions === 0) {
      profile.perfectFlights += 1;
      profile.currentStreak += 1;
      if (profile.currentStreak > profile.bestStreak) {
        profile.bestStreak = profile.currentStreak;
      }
    } else {
      profile.currentStreak = 0;
    }

    const expGained = this.calculateExperience(record);
    this.addExperience(expGained);
    this.updateTitle();
    this.updateFavoriteMode(record.mode);

    if (record.weatherCondition && !this.state.recentWeatherTypes.includes(record.weatherCondition)) {
      this.state.recentWeatherTypes.push(record.weatherCondition);
    }
  }

  private calculateExperience(record: FlightRecord): number {
    const stats = record.stats;
    let exp = 0;

    exp += Math.floor(stats.distance / 10);
    exp += Math.floor(record.adjustedScore / 50);
    exp += stats.airCurrentCount * 3;

    if (stats.collisions === 0) {
      exp += Math.floor(record.duration / 2);
      exp += 20;
    }

    if (record.mode === 'tournament' || record.mode === 'training') {
      exp = Math.floor(exp * 1.2);
    }

    return Math.max(exp, 10);
  }

  public addExperience(amount: number): void {
    const profile = this.state.profile;
    profile.experience += amount;

    while (profile.experience >= profile.experienceToNext) {
      profile.experience -= profile.experienceToNext;
      profile.level += 1;
      profile.experienceToNext = experienceForLevel(profile.level + 1);
    }
  }

  private updateTitle(): void {
    const profile = this.state.profile;
    let newTitle = '风筝新手';

    for (const tier of PILOT_TITLES) {
      if (profile.level >= tier.minLevel) {
        newTitle = tier.title;
      }
    }

    profile.title = newTitle;
  }

  private updateFavoriteMode(_mode: FlightMode): void {
    const modeCounts: Record<FlightMode, number> = {
      free: 0,
      tournament: 0,
      training: 0,
      weatherLab: 0,
      levelEditor: 0,
    };

    this.state.flightRecords.forEach((r) => {
      modeCounts[r.mode] += 1;
    });

    let maxCount = 0;
    let favorite: FlightMode = 'free';

    (Object.keys(modeCounts) as FlightMode[]).forEach((m) => {
      if (modeCounts[m] > maxCount) {
        maxCount = modeCounts[m];
        favorite = m;
      }
    });

    this.state.profile.favoriteMode = favorite;
  }

  private updateBestTrajectories(record: FlightRecord): void {
    const stats = record.stats;
    const trajectory = record.trajectory || [];

    const typesToCheck: Array<{
      type: BestTrajectory['type'];
      value: number;
      title: string;
    }> = [
      { type: 'distance', value: stats.distance, title: '最远距离' },
      { type: 'score', value: record.adjustedScore, title: '最高得分' },
      { type: 'height', value: stats.maxHeight, title: '最高高度' },
      { type: 'stability', value: stats.flightStability * 100, title: '最佳稳定性' },
    ];

    for (const check of typesToCheck) {
      const existing = this.state.bestTrajectories.find((b) => b.type === check.type);
      if (!existing || check.value > existing.value) {
        const newBest: BestTrajectory = {
          id: `best_${check.type}_${Date.now()}`,
          flightRecordId: record.id,
          type: check.type,
          title: check.title,
          achievedAt: Date.now(),
          value: check.value,
          trajectory: trajectory.length > 0 ? [...trajectory] : [],
          summaryStats: { ...stats },
          modeName: record.modeName,
        };

        if (existing) {
          const idx = this.state.bestTrajectories.indexOf(existing);
          this.state.bestTrajectories[idx] = newBest;
        } else {
          this.state.bestTrajectories.push(newBest);
        }
      }
    }
  }

  private recordAnomalyEvents(record: FlightRecord): void {
    if (record.anomalies.length === 0) return;

    const trajectory = record.trajectory || [];
    const stats = record.stats;

    record.anomalies.forEach((anomalyType, idx) => {
      const type = anomalyType as AnomalyType;
      let severity: AnomalyEvent['severity'] = 'low';
      let description = '';

      switch (type) {
        case 'crash':
          severity = 'high';
          description = `飞行坠毁！最终高度 ${Math.floor(stats.height)} 米，累计得分 ${Math.floor(record.adjustedScore)}`;
          break;
        case 'building_collision':
          severity = stats.collisions >= 3 ? 'high' : stats.collisions >= 2 ? 'medium' : 'low';
          description = `发生 ${stats.collisions} 次建筑物碰撞`;
          break;
        case 'turbulence_loss':
          severity = 'medium';
          description = `遭遇乱流影响，最低稳定性 ${(stats.flightStability * 100).toFixed(1)}%`;
          break;
        case 'downdraft_drop':
          severity = 'medium';
          description = '遭遇下降气流，被强行下拉';
          break;
        case 'rapid_descent':
          severity = 'low';
          description = '发生快速下降事件';
          break;
        case 'stall':
          severity = 'medium';
          description = `影子追踪度过低，最低 ${(stats.shadowTracking * 100).toFixed(1)}%`;
          break;
      }

      const event: AnomalyEvent = {
        id: `anomaly_${Date.now()}_${idx}`,
        type,
        flightRecordId: record.id,
        timestamp: record.timestamp,
        description,
        severity,
        location:
          trajectory.length > 0
            ? { x: trajectory[trajectory.length - 1].x, y: trajectory[trajectory.length - 1].y, z: trajectory[trajectory.length - 1].z }
            : undefined,
        statsAtMoment: {
          score: stats.score,
          distance: stats.distance,
          height: stats.height,
          time: stats.time,
        },
      };

      this.state.anomalies.unshift(event);
    });

    if (this.state.anomalies.length > 100) {
      this.state.anomalies = this.state.anomalies.slice(0, 100);
    }
  }

  private updateGrowthHistory(record: FlightRecord): void {
    const dateKey = new Date(record.timestamp).toISOString().slice(0, 10);
    let todayData = this.state.growthHistory.find((g) => g.date === dateKey);

    if (!todayData) {
      todayData = {
        date: dateKey,
        totalFlights: 0,
        avgScore: 0,
        avgDistance: 0,
        avgMaxHeight: 0,
        avgStability: 0,
        totalScore: 0,
        totalDistance: 0,
        collisions: 0,
      };
      this.state.growthHistory.push(todayData);
    }

    const prev = todayData;
    const newTotalFlights = prev.totalFlights + 1;

    todayData.avgScore = (prev.avgScore * prev.totalFlights + record.adjustedScore) / newTotalFlights;
    todayData.avgDistance = (prev.avgDistance * prev.totalFlights + record.stats.distance) / newTotalFlights;
    todayData.avgMaxHeight = (prev.avgMaxHeight * prev.totalFlights + record.stats.maxHeight) / newTotalFlights;
    todayData.avgStability = (prev.avgStability * prev.totalFlights + record.stats.flightStability * 100) / newTotalFlights;
    todayData.totalScore += record.adjustedScore;
    todayData.totalDistance += record.stats.distance;
    todayData.collisions += record.stats.collisions;
    todayData.totalFlights = newTotalFlights;

    if (this.state.growthHistory.length > 60) {
      this.state.growthHistory = this.state.growthHistory.slice(-60);
    }
  }

  private checkAndUnlockAchievements(record: FlightRecord): NewlyUnlockedAchievement[] {
    const newlyUnlocked: NewlyUnlockedAchievement[] = [];
    const profile = this.state.profile;
    void record.stats;

    const modesUnlocked = new Set(this.state.flightRecords.map((r) => r.mode)).size;

    const achievementProgress: Record<Achievement['id'], number> = {};

    this.state.achievements.forEach((achievement) => {
      if (achievement.unlocked) return;

      let progress = 0;
      const cond = achievement.condition;

      switch (cond.type) {
        case 'total_flights':
          progress = profile.totalFlights;
          break;
        case 'total_distance':
          progress = profile.totalDistance;
          break;
        case 'total_score':
          progress = profile.totalScore;
          break;
        case 'max_height':
          progress = Math.max(...this.state.flightRecords.map((r) => r.stats.maxHeight), 0);
          break;
        case 'max_distance_single':
          progress = Math.max(...this.state.flightRecords.map((r) => r.stats.distance), 0);
          break;
        case 'max_score_single':
          progress = Math.max(...this.state.flightRecords.map((r) => r.adjustedScore), 0);
          break;
        case 'consecutive_no_collision':
          progress = profile.currentStreak;
          break;
        case 'aircurrent_total':
          progress = profile.totalAirCurrents;
          break;
        case 'perfect_flights':
          progress = profile.perfectFlights;
          break;
        case 'modes_unlocked':
          progress = modesUnlocked;
          break;
        case 'weather_experienced':
          progress = this.state.recentWeatherTypes.length;
          break;
        case 'zero_collision_distance':
          progress = this.state.flightRecords
            .filter((r) => r.stats.collisions === 0)
            .reduce((sum, r) => sum + r.stats.distance, 0);
          break;
      }

      achievement.progress = Math.min(progress, cond.target);
      achievementProgress[achievement.id] = achievement.progress;

      if (progress >= cond.target && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        newlyUnlocked.push({
          achievement: { ...achievement },
          rewardCoins: achievement.rewardCoins,
        });
      }
    });

    return newlyUnlocked;
  }

  public getFlightRecordById(id: string): FlightRecord | undefined {
    return this.state.flightRecords.find((r) => r.id === id);
  }

  public getAchievementById(id: string): Achievement | undefined {
    return this.state.achievements.find((a) => a.id === id);
  }

  public getBestTrajectoryByType(type: BestTrajectory['type']): BestTrajectory | undefined {
    return this.state.bestTrajectories.find((b) => b.type === type);
  }

  public getUnlockedAchievements(): Achievement[] {
    return this.state.achievements.filter((a) => a.unlocked);
  }

  public getAchievementProgress(): { unlocked: number; total: number; percentage: number } {
    const unlocked = this.state.achievements.filter((a) => a.unlocked).length;
    const total = this.state.achievements.length;
    return {
      unlocked,
      total,
      percentage: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }

  public setPilotName(name: string): void {
    if (name.trim().length > 0 && name.trim().length <= 20) {
      this.state.profile.name = name.trim();
      this.saveToLocalStorage();
    }
  }

  public reset(): void {
    this.state = createDefaultJourneyState();
    this.saveToLocalStorage();
  }

  public saveToLocalStorage(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save journey data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved) as JourneyState;

      if (data.profile) {
        this.state.profile = { ...createDefaultJourneyState().profile, ...data.profile };
      }

      if (data.flightRecords) {
        this.state.flightRecords = data.flightRecords;
      }

      if (data.achievements && data.achievements.length > 0) {
        const defaultAchievements = createAchievements();
        this.state.achievements = defaultAchievements.map((def) => {
          const saved = data.achievements.find((s) => s.id === def.id);
          if (saved) {
            return { ...def, unlocked: saved.unlocked, unlockedAt: saved.unlockedAt, progress: saved.progress || 0 };
          }
          return def;
        });
      }

      if (data.bestTrajectories) {
        this.state.bestTrajectories = data.bestTrajectories;
      }

      if (data.anomalies) {
        this.state.anomalies = data.anomalies;
      }

      if (data.growthHistory) {
        this.state.growthHistory = data.growthHistory;
      }

      if (data.recentWeatherTypes) {
        this.state.recentWeatherTypes = data.recentWeatherTypes;
      }

      return true;
    } catch (e) {
      console.error('Failed to load journey data:', e);
      return false;
    }
  }

  public getTotalRewardCoins(): number {
    return this.state.achievements.filter((a) => a.unlocked).reduce((sum, a) => sum + a.rewardCoins, 0);
  }

  public getAchievementRarityColor(rarity: Achievement['rarity']): string {
    return RARITY_COLORS[rarity];
  }

  public getFlightRecordsByMode(mode?: FlightMode): FlightRecord[] {
    if (!mode) return this.state.flightRecords;
    return this.state.flightRecords.filter((r) => r.mode === mode);
  }

  public getAnomaliesBySeverity(severity?: AnomalyEvent['severity']): AnomalyEvent[] {
    if (!severity) return this.state.anomalies;
    return this.state.anomalies.filter((a) => a.severity === severity);
  }

  public getGrowthHistoryLastNDays(days: number): GrowthDataPoint[] {
    return this.state.growthHistory.slice(-days);
  }

  public getBestScore(): number {
    if (this.state.flightRecords.length === 0) return 0;
    return this.state.flightRecords.reduce(
      (max, r) => Math.max(max, r.adjustedScore), 0
    );
  }
}

export const journeyEngine = new JourneyEngine();
