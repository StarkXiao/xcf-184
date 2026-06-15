import type {
  Stage,
  StageTask,
  StageProgress,
  Announcement,
  StageSettlement,
} from './types';
import { STAGES, getStageById } from './stageTaskData';
import type { GameStats } from '../game/types';

export interface StageTaskCallbacks {
  onTaskComplete?: (task: StageTask, index: number) => void;
  onStageComplete?: (settlement: StageSettlement) => void;
  onStageStart?: (stage: Stage) => void;
  onAnnouncement?: (announcement: Announcement) => void;
  onStageFailed?: (reason: string) => void;
}

export class StageTaskEngine {
  private stages: Stage[] = [];
  private currentStage: Stage | null = null;
  private progress: StageProgress;
  private callbacks: StageTaskCallbacks;
  private announcements: Announcement[] = [];
  private lastAirCurrentTime: number = 0;
  private shadowTrackingHighStartTime: number = 0;
  private stabilityHighStartTime: number = 0;
  private currentShadowTrackingHigh: boolean = false;
  private currentStabilityHigh: boolean = false;
  private completedTaskIds: Set<string> = new Set();
  private lastSettlement: StageSettlement | null = null;

  constructor(callbacks: StageTaskCallbacks = {}) {
    this.callbacks = callbacks;
    this.progress = {
      currentStageId: null,
      currentTaskIndex: 0,
      stageStartTime: 0,
      taskStartTime: 0,
      comboCount: 0,
      maxCombo: 0,
      totalScoreEarned: 0,
      totalCoinsEarned: 0,
      isStageActive: false,
    };
    this.loadStages();
  }

  private loadStages(): void {
    this.stages = JSON.parse(JSON.stringify(STAGES));
  }

  public getStages(): Stage[] {
    return [...this.stages];
  }

  public getCurrentStage(): Stage | null {
    return this.currentStage;
  }

  public getProgress(): StageProgress {
    return { ...this.progress };
  }

  public getAnnouncements(): Announcement[] {
    return [...this.announcements];
  }

  public getCurrentTasks(): StageTask[] {
    if (!this.currentStage) return [];
    return [...this.currentStage.tasks];
  }

  public getActiveTasks(): StageTask[] {
    if (!this.currentStage) return [];
    return this.currentStage.tasks.filter(t => !t.completed);
  }

  public startStage(stageId: string, performanceNow: number = performance.now()): boolean {
    const stage = this.stages.find(s => s.id === stageId);
    if (!stage || !stage.unlocked) return false;

    this.currentStage = JSON.parse(JSON.stringify(stage));
    this.completedTaskIds.clear();
    this.progress = {
      currentStageId: stageId,
      currentTaskIndex: 0,
      stageStartTime: performanceNow,
      taskStartTime: performanceNow,
      comboCount: 0,
      maxCombo: 0,
      totalScoreEarned: 0,
      totalCoinsEarned: 0,
      isStageActive: true,
    };
    this.shadowTrackingHighStartTime = 0;
    this.stabilityHighStartTime = 0;
    this.currentShadowTrackingHigh = false;
    this.currentStabilityHigh = false;
    this.announcements = [];
    this.lastSettlement = null;

    this.addAnnouncement({
      id: `stage-start-${performanceNow}`,
      title: `第 ${stage.stageNumber} 关`,
      content: stage.name,
      type: 'stage_start',
      duration: 3000,
      startTime: performanceNow,
      priority: 10,
    });

    if (this.callbacks.onStageStart && this.currentStage) {
      this.callbacks.onStageStart(this.currentStage);
    }

    return true;
  }

  public update(stats: GameStats, _delta: number, currentTime: number): void {
    if (!this.currentStage || !this.progress.isStageActive) return;

    if (this.currentStage.timeLimit) {
      const elapsed = (currentTime - this.progress.stageStartTime) / 1000;
      if (elapsed >= this.currentStage.timeLimit) {
        this.failStage('时间耗尽！');
        return;
      }
    }

    this.currentStage.tasks.forEach((task, index) => {
      if (task.completed) return;
      this.checkTaskProgress(task, stats, currentTime);
      if (task.completed && !this.completedTaskIds.has(task.id)) {
        this.completeTask(task, index, currentTime);
      }
    });

    this.cleanupAnnouncements(currentTime);

    if (this.checkAllTasksCompleted()) {
      this.completeStage();
    }
  }

  private checkTaskProgress(task: StageTask, stats: GameStats, currentTime: number): void {
    switch (task.type) {
      case 'distanceTarget':
        task.currentValue = stats.distance;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;

      case 'heightTarget':
        task.currentValue = stats.maxHeight;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;

      case 'airCurrentCount':
        task.currentValue = stats.airCurrentCount;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;

      case 'timeSurvival':
        task.currentValue = stats.time;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;

      case 'scoreTarget':
        task.currentValue = stats.score;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;

      case 'shadowTracking':
        if (stats.shadowTracking >= task.targetValue) {
          if (!this.currentShadowTrackingHigh) {
            this.currentShadowTrackingHigh = true;
            this.shadowTrackingHighStartTime = currentTime;
          }
          const duration = currentTime - this.shadowTrackingHighStartTime;
          task.currentValue = duration / 1000;
          task.progress = Math.min(1, task.currentValue / (task.timeLimit ?? 30));
          if (task.currentValue >= (task.timeLimit ?? 30)) {
            task.completed = true;
          }
        } else {
          this.currentShadowTrackingHigh = false;
          task.currentValue = 0;
          task.progress = 0;
        }
        break;

      case 'stabilityMaintain':
        if (stats.flightStability >= task.targetValue) {
          if (!this.currentStabilityHigh) {
            this.currentStabilityHigh = true;
            this.stabilityHighStartTime = currentTime;
          }
          const duration = currentTime - this.stabilityHighStartTime;
          task.currentValue = duration / 1000;
          task.progress = Math.min(1, task.currentValue / (task.timeLimit ?? 30));
          if (task.currentValue >= (task.timeLimit ?? 30)) {
            task.completed = true;
          }
        } else {
          this.currentStabilityHigh = false;
          task.currentValue = 0;
          task.progress = 0;
        }
        break;

      case 'comboAirCurrent':
        task.currentValue = this.progress.comboCount;
        task.progress = Math.min(1, task.currentValue / task.targetValue);
        if (task.currentValue >= task.targetValue) {
          task.completed = true;
        }
        break;
    }
  }

  public notifyAirCurrentCaught(performanceNow: number = performance.now()): void {
    const now = performanceNow;
    if (now - this.lastAirCurrentTime < 3000) {
      this.progress.comboCount++;
    } else {
      this.progress.comboCount = 1;
    }
    this.lastAirCurrentTime = now;
    this.progress.maxCombo = Math.max(this.progress.maxCombo, this.progress.comboCount);

    if (this.progress.comboCount >= 5 && this.progress.comboCount % 5 === 0) {
      this.addAnnouncement({
        id: `combo-${performanceNow}`,
        title: `${this.progress.comboCount} 连击！`,
        content: '气流连击，势不可挡！',
        type: 'bonus',
        duration: 1500,
        startTime: performanceNow,
        priority: 5,
      });
    }
  }

  private completeTask(task: StageTask, index: number, performanceNow: number = performance.now()): void {
    this.completedTaskIds.add(task.id);
    this.progress.totalScoreEarned += task.rewardScore;
    this.progress.totalCoinsEarned += task.rewardCoins;

    this.addAnnouncement({
      id: `task-complete-${task.id}`,
      title: '任务完成！',
      content: `${task.name} +${task.rewardScore}分`,
      type: 'task_complete',
      duration: 2500,
      startTime: performanceNow,
      priority: 8,
    });

    if (this.callbacks.onTaskComplete) {
      this.callbacks.onTaskComplete(task, index);
    }
  }

  private checkAllTasksCompleted(): boolean {
    if (!this.currentStage) return false;
    return this.currentStage.tasks.every(t => t.completed);
  }

  private completeStage(): void {
    if (!this.currentStage || !this.progress.isStageActive) return;

    this.progress.isStageActive = false;
    const settlement = this.calculateSettlement();
    this.lastSettlement = settlement;

    const stageIndex = this.stages.findIndex(s => s.id === this.currentStage!.id);
    if (stageIndex >= 0) {
      this.stages[stageIndex].completed = true;
      this.stages[stageIndex].bestScore = Math.max(
        this.stages[stageIndex].bestScore,
        settlement.totalScore
      );
      this.stages[stageIndex].stars = Math.max(
        this.stages[stageIndex].stars,
        settlement.stars
      );

      if (stageIndex + 1 < this.stages.length) {
        this.stages[stageIndex + 1].unlocked = true;
      }
    }

    this.addAnnouncement({
      id: `stage-complete-${performance.now()}`,
      title: '赛段完成！',
      content: `${this.currentStage.name} 通关成功`,
      type: 'stage_complete',
      duration: 4000,
      startTime: performance.now(),
      priority: 10,
    });
  }

  private failStage(reason: string): void {
    if (!this.progress.isStageActive) return;

    this.progress.isStageActive = false;
    const settlement = this.calculateSettlement();
    settlement.isFailed = true;
    settlement.failReason = reason;
    this.lastSettlement = settlement;

    this.addAnnouncement({
      id: `stage-fail-${performance.now()}`,
      title: '挑战失败',
      content: reason,
      type: 'warning',
      duration: 3000,
      startTime: performance.now(),
      priority: 10,
    });

    if (this.callbacks.onStageFailed) {
      this.callbacks.onStageFailed(reason);
    }
  }

  public calculateSettlement(performanceNow: number = performance.now()): StageSettlement {
    if (!this.currentStage) {
      return {
        stageId: '',
        stageName: '',
        completedTasks: 0,
        totalTasks: 0,
        baseScore: 0,
        bonusScore: 0,
        totalScore: 0,
        earnedCoins: 0,
        stars: 0,
        timeUsed: 0,
        maxCombo: 0,
        isNewRecord: false,
        isFailed: false,
      };
    }

    const completedTasks = this.currentStage.tasks.filter(t => t.completed).length;
    const totalTasks = this.currentStage.tasks.length;
    const completionRate = completedTasks / totalTasks;

    let stars = 0;
    if (completionRate >= 1) stars = 3;
    else if (completionRate >= 0.7) stars = 2;
    else if (completionRate >= 0.4) stars = 1;

    const timeUsed = (performanceNow - this.progress.stageStartTime) / 1000;
    const timeBonus = this.currentStage.timeLimit
      ? Math.max(0, Math.floor((this.currentStage.timeLimit - timeUsed) * 10))
      : 0;

    const comboBonus = Math.floor(this.progress.maxCombo * 20);
    const baseScore = this.progress.totalScoreEarned;
    const bonusScore = timeBonus + comboBonus;
    const totalScore = baseScore + bonusScore;
    const earnedCoins = this.progress.totalCoinsEarned + Math.floor(totalScore / 100);

    const originalStage = getStageById(this.currentStage.id);
    const isNewRecord = originalStage
      ? totalScore > originalStage.bestScore
      : false;

    return {
      stageId: this.currentStage.id,
      stageName: this.currentStage.name,
      completedTasks,
      totalTasks,
      baseScore,
      bonusScore,
      totalScore,
      earnedCoins,
      stars,
      timeUsed,
      maxCombo: this.progress.maxCombo,
      isNewRecord,
      isFailed: false,
    };
  }

  private addAnnouncement(announcement: Announcement): void {
    this.announcements.push(announcement);
    this.announcements.sort((a, b) => b.priority - a.priority);

    if (this.callbacks.onAnnouncement) {
      this.callbacks.onAnnouncement(announcement);
    }
  }

  private cleanupAnnouncements(currentTime: number): void {
    this.announcements = this.announcements.filter(
      a => currentTime - a.startTime < a.duration
    );
  }

  public getStageSettlement(): StageSettlement | null {
    return this.lastSettlement;
  }

  public reset(): void {
    this.currentStage = null;
    this.completedTaskIds.clear();
    this.progress = {
      currentStageId: null,
      currentTaskIndex: 0,
      stageStartTime: 0,
      taskStartTime: 0,
      comboCount: 0,
      maxCombo: 0,
      totalScoreEarned: 0,
      totalCoinsEarned: 0,
      isStageActive: false,
    };
    this.announcements = [];
    this.lastSettlement = null;
  }

  public getWeatherConfigOverride(stage: Stage): {
    cloudCoverage?: number;
    turbulenceLevel?: number;
    windSpeed?: number;
    timeOfDay?: number;
    timeOfDayFrozen?: boolean;
  } {
    switch (stage.weatherTheme) {
      case 'sunny':
        return { cloudCoverage: 0.2, turbulenceLevel: 0.1, windSpeed: 0.2, timeOfDay: 0.5, timeOfDayFrozen: true };
      case 'cloudy':
        return { cloudCoverage: 0.6, turbulenceLevel: 0.25, windSpeed: 0.35, timeOfDay: 0.5, timeOfDayFrozen: true };
      case 'windy':
        return { cloudCoverage: 0.7, turbulenceLevel: 0.5, windSpeed: 0.6, timeOfDay: 0.4, timeOfDayFrozen: true };
      case 'stormy':
        return { cloudCoverage: 0.9, turbulenceLevel: 0.7, windSpeed: 0.8, timeOfDay: 0.3, timeOfDayFrozen: true };
      case 'night':
        return { cloudCoverage: 0.4, turbulenceLevel: 0.3, windSpeed: 0.3, timeOfDay: 0.95, timeOfDayFrozen: true };
      default:
        return {};
    }
  }

  public getAirCurrentConfigOverride(stage: Stage): {
    airCurrentSpawnRate?: number;
    minAirCurrentStrength?: number;
    maxAirCurrentStrength?: number;
  } {
    switch (stage.airCurrentTheme) {
      case 'calm':
        return { airCurrentSpawnRate: 0.015, minAirCurrentStrength: 0.05, maxAirCurrentStrength: 0.12 };
      case 'moderate':
        return { airCurrentSpawnRate: 0.025, minAirCurrentStrength: 0.08, maxAirCurrentStrength: 0.2 };
      case 'turbulent':
        return { airCurrentSpawnRate: 0.04, minAirCurrentStrength: 0.12, maxAirCurrentStrength: 0.3 };
      case 'extreme':
        return { airCurrentSpawnRate: 0.05, minAirCurrentStrength: 0.18, maxAirCurrentStrength: 0.45 };
      default:
        return {};
    }
  }
}
