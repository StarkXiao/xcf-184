import type {
  ReplaySession,
  KeyNode,
  KeyNodeType,
  ReplayReview,
  ReviewScore,
  ShareConfig,
  ShareResult,
  ReplayFilter,
  ViewMode,
  ReplayTrajectoryPoint,
  ReplayGrade,
  ScoreDimension,
  CameraFrame,
} from './types';
import {
  KEY_NODE_TYPES,
  SCORE_DIMENSIONS,
  GRADE_THRESHOLDS,
  DEFAULT_PLAYBACK,
  DEFAULT_FILTERS,
} from './types';
import type { GameStats, Vector3 } from '../game/types';
import type { FlightRecord } from '../journey/types';
import { FLIGHT_MODE_NAMES } from '../journey/types';
import {
  createDefaultReplayState,
  generateReplayId,
  generateKeyNodeId,
  generateShareId,
  generateShareCode,
  clamp,
  SAVE_KEY,
} from './replayData';

type Listener = () => void;

export class ReplayEngine {
  private state: ReturnType<typeof createDefaultReplayState>;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = createDefaultReplayState();
    this.loadFromLocalStorage();
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  private saveToLocalStorage(): void {
    try {
      const toSave = {
        replays: this.state.replays,
        reviews: this.state.reviews,
        shares: this.state.shares,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save replay state:', e);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state.replays = parsed.replays || [];
        this.state.reviews = parsed.reviews || {};
        this.state.shares = parsed.shares || [];
      }
    } catch (e) {
      console.error('Failed to load replay state:', e);
    }
  }

  public createReplayFromFlightRecord(
    flightRecord: FlightRecord,
    options?: {
      title?: string;
      tags?: string[];
      cameraFrames?: CameraFrame[];
      windFieldSnapshots?: Array<{
        timestamp: number;
        windDirection: Vector3;
        windSpeed: number;
        turbulenceLevel: number;
      }>;
    }
  ): ReplaySession {
    const trajectory: ReplayTrajectoryPoint[] = (flightRecord.trajectory || []).map((tp) => ({
      ...tp,
    }));

    const keyNodes = this.autoDetectKeyNodes(trajectory, flightRecord.stats);

    const replay: ReplaySession = {
      id: generateReplayId(),
      flightRecordId: flightRecord.id,
      title: options?.title || `${FLIGHT_MODE_NAMES[flightRecord.mode]} - ${new Date(flightRecord.timestamp).toLocaleDateString('zh-CN')}`,
      createdAt: Date.now(),
      duration: flightRecord.duration,
      mode: flightRecord.mode,
      modeName: flightRecord.modeName,
      trajectory,
      keyNodes,
      initialStats: {
        ...flightRecord.stats,
        score: 0,
        distance: 0,
        time: 0,
        height: 80,
      },
      finalStats: { ...flightRecord.stats },
      adjustedScore: flightRecord.adjustedScore,
      earnedCoins: flightRecord.earnedCoins,
      weatherCondition: flightRecord.weatherCondition,
      trackName: flightRecord.trackName,
      sceneName: flightRecord.sceneName,
      viewHistory: [],
      isFavorite: false,
      tags: options?.tags || [],
      cameraFrames: options?.cameraFrames,
      windFieldSnapshots: options?.windFieldSnapshots,
    };

    this.state.replays.unshift(replay);
    if (this.state.replays.length > 100) {
      this.state.replays = this.state.replays.slice(0, 100);
    }

    this.saveToLocalStorage();
    this.emit();
    return replay;
  }

  private autoDetectKeyNodes(
    trajectory: ReplayTrajectoryPoint[],
    finalStats: GameStats
  ): KeyNode[] {
    const nodes: KeyNode[] = [];

    if (trajectory.length < 5) return nodes;

    const typeConfig = KEY_NODE_TYPES.reduce((acc, t) => {
      acc[t.type] = t;
      return acc;
    }, {} as Record<string, typeof KEY_NODE_TYPES[number]>);

    if (trajectory.length > 0) {
      const first = trajectory[0];
      nodes.push({
        id: generateKeyNodeId(),
        type: 'takeoff',
        timestamp: first.t,
        trajectoryIndex: 0,
        title: typeConfig.takeoff.name,
        description: '风筝起飞，开始本次飞行',
        icon: typeConfig.takeoff.icon,
        color: typeConfig.takeoff.color,
        position: { x: first.x, y: first.y, z: first.z },
        statsAtMoment: {
          height: first.y,
          distance: 0,
          time: 0,
          stability: first.stability,
        },
        isUserAdded: false,
        tags: ['起飞', '开始'],
      });
    }

    let maxHeight = -Infinity;
    let maxHeightIdx = 0;
    let maxDist = -Infinity;
    let maxDistIdx = 0;

    trajectory.forEach((tp, idx) => {
      if (tp.y > maxHeight) {
        maxHeight = tp.y;
        maxHeightIdx = idx;
      }
      const dist = Math.sqrt(tp.x * tp.x + tp.z * tp.z);
      if (dist > maxDist) {
        maxDist = dist;
        maxDistIdx = idx;
      }
    });

    if (maxHeightIdx > 0) {
      const tp = trajectory[maxHeightIdx];
      nodes.push({
        id: generateKeyNodeId(),
        type: 'peak_height',
        timestamp: tp.t,
        trajectoryIndex: maxHeightIdx,
        title: typeConfig.peak_height.name,
        description: `达到最高高度 ${Math.round(maxHeight)}m`,
        icon: typeConfig.peak_height.icon,
        color: typeConfig.peak_height.color,
        position: { x: tp.x, y: tp.y, z: tp.z },
        statsAtMoment: {
          height: Math.round(maxHeight),
          maxHeight: Math.round(maxHeight),
          stability: tp.stability,
        },
        isUserAdded: false,
        tags: ['高度记录', '顶点'],
      });
    }

    if (maxDistIdx > 0 && maxDistIdx !== maxHeightIdx) {
      const tp = trajectory[maxDistIdx];
      nodes.push({
        id: generateKeyNodeId(),
        type: 'max_distance',
        timestamp: tp.t,
        trajectoryIndex: maxDistIdx,
        title: typeConfig.max_distance.name,
        description: `达到最远距离 ${Math.round(maxDist)}m`,
        icon: typeConfig.max_distance.icon,
        color: typeConfig.max_distance.color,
        position: { x: tp.x, y: tp.y, z: tp.z },
        statsAtMoment: {
          distance: Math.round(maxDist),
          height: Math.round(tp.y),
          stability: tp.stability,
        },
        isUserAdded: false,
        tags: ['距离记录', '最远'],
      });
    }

    let airCurrentCount = 0;
    for (let i = 2; i < trajectory.length - 2; i++) {
      const tp = trajectory[i];
      const prev = trajectory[i - 2];
      const next = trajectory[i + 2];

      const upwardSpeed = (tp.y - prev.y) / ((tp.t - prev.t) / 1000);
      const avgStability = (prev.stability + tp.stability + next.stability) / 3;

      if (upwardSpeed > 8 && avgStability > 0.5) {
        if (airCurrentCount < 5) {
          nodes.push({
            id: generateKeyNodeId(),
            type: 'air_current',
            timestamp: tp.t,
            trajectoryIndex: i,
            title: `${typeConfig.air_current.name} #${airCurrentCount + 1}`,
            description: `有效利用上升气流，上升速度 ${upwardSpeed.toFixed(1)}m/s`,
            icon: typeConfig.air_current.icon,
            color: typeConfig.air_current.color,
            position: { x: tp.x, y: tp.y, z: tp.z },
            statsAtMoment: {
              height: Math.round(tp.y),
              stability: Number(tp.stability.toFixed(2)),
              airCurrentCount: airCurrentCount + 1,
            },
            isUserAdded: false,
            tags: ['气流', '上升'],
          });
        }
        airCurrentCount++;
        i += 10;
      }
    }

    if (finalStats.collisions > 0) {
      for (let i = 5; i < trajectory.length - 5; i++) {
        const tp = trajectory[i];
        const prev = trajectory[i - 3];
        const next = trajectory[i + 3];

        const heightDrop = prev.y - tp.y;
        const stabilityDrop = prev.stability - tp.stability;
        const recovery = next.y - tp.y;

        if (heightDrop > 20 && stabilityDrop > 0.3 && recovery > 10) {
          nodes.push({
            id: generateKeyNodeId(),
            type: 'collision',
            timestamp: tp.t,
            trajectoryIndex: i,
            title: typeConfig.collision.name,
            description: `发生碰撞事件，高度骤降 ${Math.round(heightDrop)}m`,
            icon: typeConfig.collision.icon,
            color: typeConfig.collision.color,
            position: { x: tp.x, y: tp.y, z: tp.z },
            statsAtMoment: {
              height: Math.round(tp.y),
              collisions: 1,
              stability: Number(tp.stability.toFixed(2)),
            },
            isUserAdded: false,
            tags: ['碰撞', '危险'],
          });
          break;
        }
      }
    }

    let turbulenceCount = 0;
    for (let i = 3; i < trajectory.length - 3; i++) {
      const tp = trajectory[i];
      const window = trajectory.slice(Math.max(0, i - 3), Math.min(trajectory.length, i + 4));
      const avgStability = window.reduce((s, p) => s + p.stability, 0) / window.length;

      if (avgStability < 0.35 && tp.stability < 0.3) {
        if (turbulenceCount < 3) {
          nodes.push({
            id: generateKeyNodeId(),
            type: 'turbulence',
            timestamp: tp.t,
            trajectoryIndex: i,
            title: `${typeConfig.turbulence.name}区域 #${turbulenceCount + 1}`,
            description: `进入乱流区域，稳定性降至 ${(avgStability * 100).toFixed(0)}%`,
            icon: typeConfig.turbulence.icon,
            color: typeConfig.turbulence.color,
            position: { x: tp.x, y: tp.y, z: tp.z },
            statsAtMoment: {
              height: Math.round(tp.y),
              stability: Number(avgStability.toFixed(2)),
              flightStability: Number(avgStability.toFixed(2)),
            },
            isUserAdded: false,
            tags: ['乱流', '不稳定'],
          });
        }
        turbulenceCount++;
        i += 15;
      }
    }

    if (trajectory.length > 0) {
      const last = trajectory[trajectory.length - 1];
      nodes.push({
        id: generateKeyNodeId(),
        type: 'landing',
        timestamp: last.t,
        trajectoryIndex: trajectory.length - 1,
        title: typeConfig.landing.name,
        description: `本次飞行结束，总飞行时间 ${Math.round(finalStats.time)}秒`,
        icon: typeConfig.landing.icon,
        color: typeConfig.landing.color,
        position: { x: last.x, y: last.y, z: last.z },
        statsAtMoment: {
          ...finalStats,
          stability: last.stability,
        },
        isUserAdded: false,
        tags: ['降落', '结束'],
      });
    }

    nodes.sort((a, b) => a.trajectoryIndex - b.trajectoryIndex);
    return nodes;
  }

  public addKeyNode(
    replayId: string,
    params: {
      type: KeyNodeType;
      trajectoryIndex: number;
      title: string;
      description?: string;
      tags?: string[];
    }
  ): KeyNode | null {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return null;

    const tp = replay.trajectory[params.trajectoryIndex];
    if (!tp) return null;

    const typeConfig = KEY_NODE_TYPES.find((t) => t.type === params.type) || KEY_NODE_TYPES[10];

    const node: KeyNode = {
      id: generateKeyNodeId(),
      type: params.type,
      timestamp: tp.t,
      trajectoryIndex: params.trajectoryIndex,
      title: params.title,
      description: params.description || `用户添加的标记点`,
      icon: typeConfig.icon,
      color: typeConfig.color,
      position: { x: tp.x, y: tp.y, z: tp.z },
      statsAtMoment: {
        height: Math.round(tp.y),
        distance: Math.round(Math.sqrt(tp.x * tp.x + tp.z * tp.z)),
        stability: Number(tp.stability.toFixed(2)),
        shadowTracking: Number(tp.shadowTracking.toFixed(2)),
      },
      isUserAdded: true,
      tags: params.tags || [],
    };

    replay.keyNodes.push(node);
    replay.keyNodes.sort((a, b) => a.trajectoryIndex - b.trajectoryIndex);
    this.saveToLocalStorage();
    this.emit();
    return node;
  }

  public removeKeyNode(replayId: string, keyNodeId: string): boolean {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return false;

    const idx = replay.keyNodes.findIndex((n) => n.id === keyNodeId);
    if (idx === -1) return false;

    replay.keyNodes.splice(idx, 1);
    this.saveToLocalStorage();
    this.emit();
    return true;
  }

  public updateKeyNode(
    replayId: string,
    keyNodeId: string,
    updates: Partial<Pick<KeyNode, 'title' | 'description' | 'tags'>>
  ): KeyNode | null {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return null;

    const node = replay.keyNodes.find((n) => n.id === keyNodeId);
    if (!node) return null;

    Object.assign(node, updates);
    this.saveToLocalStorage();
    this.emit();
    return node;
  }

  public setCurrentReplay(replayId: string | null): void {
    this.state.currentReplayId = replayId;
    if (replayId) {
      const replay = this.state.replays.find((r) => r.id === replayId);
      if (replay) {
        this.state.playback = { ...DEFAULT_PLAYBACK };
      }
    }
    this.emit();
  }

  public setPlaybackSpeed(speed: number): void {
    this.state.playback.playbackSpeed = clamp(speed, 0.25, 4);
    this.emit();
  }

  public setViewMode(mode: ViewMode): void {
    this.state.playback.viewMode = mode;
    if (this.state.currentReplayId) {
      const replay = this.state.replays.find((r) => r.id === this.state.currentReplayId);
      if (replay && !replay.viewHistory.includes(mode)) {
        replay.viewHistory.push(mode);
        if (replay.viewHistory.length > 10) {
          replay.viewHistory = replay.viewHistory.slice(-10);
        }
        this.saveToLocalStorage();
      }
    }
    this.emit();
  }

  public seekToTime(timeMs: number): void {
    const replay = this.state.replays.find((r) => r.id === this.state.currentReplayId);
    if (!replay || replay.trajectory.length === 0) return;

    const startTime = replay.trajectory[0].t;
    const endTime = replay.trajectory[replay.trajectory.length - 1].t;
    const targetTime = clamp(timeMs, startTime, endTime);

    let idx = 0;
    for (let i = 0; i < replay.trajectory.length; i++) {
      if (replay.trajectory[i].t >= targetTime) {
        idx = i;
        break;
      }
      idx = i;
    }

    this.state.playback.currentTime = targetTime;
    this.state.playback.currentIndex = idx;
    this.emit();
  }

  public seekToIndex(index: number): void {
    const replay = this.state.replays.find((r) => r.id === this.state.currentReplayId);
    if (!replay) return;

    const idx = clamp(index, 0, replay.trajectory.length - 1);
    this.state.playback.currentIndex = idx;
    this.state.playback.currentTime = replay.trajectory[idx]?.t || 0;
    this.emit();
  }

  public seekToKeyNode(keyNodeId: string): void {
    const replay = this.state.replays.find((r) => r.id === this.state.currentReplayId);
    if (!replay) return;

    const node = replay.keyNodes.find((n) => n.id === keyNodeId);
    if (!node) return;

    this.seekToIndex(node.trajectoryIndex);
  }

  public togglePlay(): void {
    this.state.playback.isPlaying = !this.state.playback.isPlaying;
    this.emit();
  }

  public toggleLoop(): void {
    this.state.playback.isLooping = !this.state.playback.isLooping;
    this.emit();
  }

  public setShowTrajectory(show: boolean): void {
    this.state.playback.showTrajectory = show;
    this.emit();
  }

  public setShowKeyNodes(show: boolean): void {
    this.state.playback.showKeyNodes = show;
    this.emit();
  }

  public setShowStatsOverlay(show: boolean): void {
    this.state.playback.showStatsOverlay = show;
    this.emit();
  }

  public toggleFavorite(replayId: string): boolean {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return false;
    replay.isFavorite = !replay.isFavorite;
    this.saveToLocalStorage();
    this.emit();
    return replay.isFavorite;
  }

  public updateReplay(
    replayId: string,
    updates: Partial<Pick<ReplaySession, 'title' | 'tags'>>
  ): ReplaySession | null {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return null;
    Object.assign(replay, updates);
    this.saveToLocalStorage();
    this.emit();
    return replay;
  }

  public deleteReplay(replayId: string): boolean {
    const idx = this.state.replays.findIndex((r) => r.id === replayId);
    if (idx === -1) return false;
    this.state.replays.splice(idx, 1);
    delete this.state.reviews[replayId];
    this.state.shares = this.state.shares.filter((s) => s.id !== replayId);
    if (this.state.currentReplayId === replayId) {
      this.state.currentReplayId = null;
    }
    this.saveToLocalStorage();
    this.emit();
    return true;
  }

  public generateReview(replayId: string): ReplayReview | null {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return null;

    const scores = this.calculateDimensionScores(replay);

    let weightedTotal = 0;
    let weightSum = 0;
    scores.forEach((s) => {
      weightedTotal += s.score * s.weight;
      weightSum += s.weight;
    });
    const overallScore = Math.round((weightedTotal / weightSum) * 10) / 10;

    const gradeResult = this.getGradeForScore(overallScore);

    const review: ReplayReview = {
      replayId,
      reviewedAt: Date.now(),
      overallScore,
      maxOverallScore: 100,
      scores,
      strengths: this.generateStrengths(scores, replay),
      improvements: this.generateImprovements(scores, replay),
      grade: gradeResult.grade as ReplayGrade,
      achievements: this.generateAchievements(scores, replay),
      tips: this.generateTips(scores, replay),
    };

    this.state.reviews[replayId] = review;
    this.saveToLocalStorage();
    this.emit();
    return review;
  }

  private calculateDimensionScores(replay: ReplaySession): ReviewScore[] {
    const { trajectory, finalStats, keyNodes } = replay;
    const scores: ReviewScore[] = [];

    if (trajectory.length > 10) {
      const stabilities = trajectory.map((t) => t.stability).filter((s) => !isNaN(s));
      const avgStability = stabilities.length > 0
        ? stabilities.reduce((a, b) => a + b, 0) / stabilities.length
        : 0.5;

      const lowStabilityCount = stabilities.filter((s) => s < 0.3).length;
      const stabilityPenalty = Math.min(lowStabilityCount / stabilities.length, 0.4);
      const stabilityScore = clamp(Math.round((avgStability * 100) * (1 - stabilityPenalty)), 0, 100);

      const highlights: string[] = [];
      const suggestions: string[] = [];
      if (avgStability > 0.7) highlights.push('整体飞行非常平稳');
      if (avgStability > 0.85) highlights.push('稳定性表现出色，大师级操控');
      if (lowStabilityCount === 0) highlights.push('全程无明显失控');
      if (avgStability < 0.6) suggestions.push('尝试练习平稳操控技巧');
      if (stabilityPenalty > 0.1) suggestions.push('减少进入乱流区域的频率');

      scores.push({
        dimension: 'stability',
        score: stabilityScore,
        maxScore: 100,
        weight: SCORE_DIMENSIONS.find((d) => d.id === 'stability')?.weight || 0.15,
        comment: this.generateComment('stability', stabilityScore),
        highlights,
        suggestions,
      });
    }

    if (trajectory.length > 5) {
      const heights = trajectory.map((t) => t.y).filter((h) => !isNaN(h));
      const maxHeight = Math.max(...heights, finalStats.maxHeight);
      const targetHeight = 200;
      const heightRatio = Math.min(maxHeight / targetHeight, 1);

      const suddenDrops: number[] = [];
      for (let i = 3; i < heights.length; i++) {
        const drop = heights[i - 3] - heights[i];
        if (drop > 30) suddenDrops.push(drop);
      }
      const controlPenalty = Math.min(suddenDrops.length * 0.08, 0.3);
      const heightScore = clamp(Math.round((heightRatio * 80 + (1 - controlPenalty) * 20)), 0, 100);

      const highlights: string[] = [];
      const suggestions: string[] = [];
      if (maxHeight > 150) highlights.push(`达到 ${Math.round(maxHeight)}m 的优秀高度`);
      if (suddenDrops.length === 0) highlights.push('高度控制平滑，无骤降');
      if (heightRatio < 0.4) suggestions.push('尝试利用更多上升气流提升高度');
      if (suddenDrops.length > 0) suggestions.push('注意避免高度骤降，保持爬升节奏');

      scores.push({
        dimension: 'altitude_control',
        score: heightScore,
        maxScore: 100,
        weight: SCORE_DIMENSIONS.find((d) => d.id === 'altitude_control')?.weight || 0.15,
        comment: this.generateComment('altitude_control', heightScore),
        highlights,
        suggestions,
      });
    }

    const airCurrentNodes = keyNodes.filter((n) => n.type === 'air_current');
    const airCurrentUtilScore = clamp(
      Math.round((airCurrentNodes.length * 15) + (finalStats.airCurrentCount * 8)),
      0,
      100
    );

    const highlights: string[] = [];
    const suggestions: string[] = [];
    if (airCurrentNodes.length >= 3) highlights.push(`成功利用 ${airCurrentNodes.length} 处上升气流`);
    if (finalStats.airCurrentCount > 10) highlights.push('气流交互次数丰富');
    if (airCurrentNodes.length < 2) suggestions.push('注意观察并主动寻找上升气流');
    if (finalStats.airCurrentCount < 5) suggestions.push('练习在气流附近保持飞行');

    scores.push({
      dimension: 'air_current_utilization',
      score: airCurrentUtilScore,
      maxScore: 100,
      weight: SCORE_DIMENSIONS.find((d) => d.id === 'air_current_utilization')?.weight || 0.2,
      comment: this.generateComment('air_current_utilization', airCurrentUtilScore),
      highlights,
      suggestions,
    });

    if (trajectory.length > 5) {
      const shadowTracks = trajectory.map((t) => t.shadowTracking).filter((s) => !isNaN(s));
      const avgShadowTracking = shadowTracks.length > 0
        ? shadowTracks.reduce((a, b) => a + b, 0) / shadowTracks.length
        : 0.5;
      const shadowBonusScore = clamp(Math.round(avgShadowTracking * 100), 0, 100);

      const highlights: string[] = [];
      const suggestions: string[] = [];
      if (avgShadowTracking > 0.7) highlights.push('影子追踪保持良好');
      if (avgShadowTracking > 0.85) highlights.push('精准追踪，完美控位');
      if (finalStats.shadowBonus > 500) highlights.push(`影子追踪奖励 ${finalStats.shadowBonus} 分`);
      if (avgShadowTracking < 0.5) suggestions.push('练习保持风筝在目标追踪区域内');
      if (avgShadowTracking < 0.6) suggestions.push('调整飞行高度优化追踪');

      scores.push({
        dimension: 'shadow_tracking',
        score: shadowBonusScore,
        maxScore: 100,
        weight: SCORE_DIMENSIONS.find((d) => d.id === 'shadow_tracking')?.weight || 0.15,
        comment: this.generateComment('shadow_tracking', shadowBonusScore),
        highlights,
        suggestions,
      });
    }

    const collisionPenalty = Math.min(finalStats.collisions * 15, 50);
    const anomalyNodes = keyNodes.filter((n) => n.type === 'collision' || n.type === 'anomaly');
    const anomalyPenalty = anomalyNodes.length * 10;
    const riskScore = clamp(100 - collisionPenalty - anomalyPenalty, 0, 100);

    const riskHighlights: string[] = [];
    const riskSuggestions: string[] = [];
    if (finalStats.collisions === 0) riskHighlights.push('零碰撞完美飞行');
    if (anomalyNodes.length === 0) riskHighlights.push('全程无危险事件');
    if (finalStats.collisions > 0) riskSuggestions.push('注意避开建筑物密集区');
    if (anomalyNodes.length > 0) riskSuggestions.push('提前识别并规避危险区域');

    scores.push({
      dimension: 'risk_management',
      score: riskScore,
      maxScore: 100,
      weight: SCORE_DIMENSIONS.find((d) => d.id === 'risk_management')?.weight || 0.15,
      comment: this.generateComment('risk_management', riskScore),
      highlights: riskHighlights,
      suggestions: riskSuggestions,
    });

    if (finalStats.time > 10) {
      const scorePerSec = finalStats.score / finalStats.time;
      const distPerSec = finalStats.distance / finalStats.time;
      const efficiencyBase = (scorePerSec * 3) + (distPerSec * 0.5);
      const efficiencyScore = clamp(Math.round(efficiencyBase), 0, 100);

      const highlights: string[] = [];
      const suggestions: string[] = [];
      if (scorePerSec > 8) highlights.push(`极高得分效率 ${scorePerSec.toFixed(1)} 分/秒`);
      if (distPerSec > 5) highlights.push(`优秀移动效率 ${distPerSec.toFixed(1)} m/s`);
      if (replay.adjustedScore > 5000) highlights.push(`总得分 ${replay.adjustedScore} 表现出色`);
      if (scorePerSec < 3) suggestions.push('尝试优化飞行路径提高得分');
      if (finalStats.time > 120 && scorePerSec < 4) suggestions.push('考虑更高效的飞行策略');

      scores.push({
        dimension: 'efficiency',
        score: efficiencyScore,
        maxScore: 100,
        weight: SCORE_DIMENSIONS.find((d) => d.id === 'efficiency')?.weight || 0.2,
        comment: this.generateComment('efficiency', efficiencyScore),
        highlights,
        suggestions,
      });
    }

    return scores;
  }

  private generateComment(_dimension: ScoreDimension, score: number): string {
    if (score >= 90) return '表现卓越，堪称教科书级别';
    if (score >= 80) return '表现优秀，可圈可点';
    if (score >= 70) return '表现良好，继续保持';
    if (score >= 60) return '及格水平，仍有提升空间';
    return '需要重点加强练习';
  }

  private generateStrengths(scores: ReviewScore[], _replay: ReplaySession): string[] {
    return scores
      .filter((s) => s.score >= 75)
      .map((s) => {
        const dim = SCORE_DIMENSIONS.find((d) => d.id === s.dimension);
        return `${dim?.icon || ''} ${dim?.name || s.dimension}: ${s.score}分`;
      })
      .slice(0, 4);
  }

  private generateImprovements(scores: ReviewScore[], _replay: ReplaySession): string[] {
    return scores
      .filter((s) => s.score < 65)
      .map((s) => {
        const dim = SCORE_DIMENSIONS.find((d) => d.id === s.dimension);
        return `${dim?.icon || ''} ${dim?.name || s.dimension}需提升 (${s.score}分)`;
      })
      .slice(0, 4);
  }

  private generateAchievements(scores: ReviewScore[], replay: ReplaySession): string[] {
    const achievements: string[] = [];
    const avgScore = scores.reduce((a, s) => a + s.score, 0) / scores.length;

    if (avgScore >= 85) achievements.push('🏆 综合评级达到A级以上');
    if (replay.finalStats.collisions === 0) achievements.push('🛡️ 零碰撞飞行成就');
    if (replay.finalStats.maxHeight >= 180) achievements.push(`⛰️ 超高飞行 ${Math.round(replay.finalStats.maxHeight)}m`);
    if (replay.keyNodes.filter((n) => n.type === 'air_current').length >= 3) achievements.push('🌀 气流大师');
    if (replay.finalStats.shadowBonus >= 1000) achievements.push('👤 影子追踪专家');
    if (replay.finalStats.distance >= 2000) achievements.push(`📍 远航达人 ${Math.round(replay.finalStats.distance)}m`);
    if (replay.adjustedScore >= 8000) achievements.push('💎 高分成就 8000+');

    return achievements.slice(0, 5);
  }

  private generateTips(scores: ReviewScore[], _replay: ReplaySession): string[] {
    const tips: string[] = [];
    const lowScores = scores.filter((s) => s.score < 70);

    lowScores.forEach((s) => {
      if (s.suggestions.length > 0) {
        tips.push(s.suggestions[0]);
      }
    });

    if (tips.length === 0) {
      tips.push('尝试挑战更高难度的赛道');
      tips.push('探索更多自定义天气组合');
    }

    return tips.slice(0, 3);
  }

  private getGradeForScore(score: number): { grade: ReplayGrade; color: string } {
    for (const t of GRADE_THRESHOLDS) {
      if (score >= t.minScore) return { grade: t.grade, color: t.color };
    }
    return { grade: 'D', color: '#9ca3af' };
  }

  public getReview(replayId: string): ReplayReview | null {
    return this.state.reviews[replayId] || null;
  }

  public createShare(
    replayId: string,
    config: ShareConfig
  ): ShareResult {
    const replay = this.state.replays.find((r) => r.id === replayId);
    const code = generateShareCode(8);

    let url = `${window.location.origin}?replay=${code}`;
    if (config.clipStart !== undefined && config.clipEnd !== undefined) {
      url += `&start=${config.clipStart}&end=${config.clipEnd}`;
    }

    const share: ShareResult = {
      id: generateShareId(),
      type: config.mode,
      url,
      code,
      createdAt: Date.now(),
      expiresAt: config.mode === 'link' ? Date.now() + 7 * 24 * 60 * 60 * 1000 : undefined,
    };

    this.state.shares.unshift(share);
    if (this.state.shares.length > 200) {
      this.state.shares = this.state.shares.slice(0, 200);
    }

    if (replay) {
      this.saveToLocalStorage();
    }

    this.emit();
    return share;
  }

  public copyShareCode(share: ShareResult): boolean {
    if (!share.code && !share.url) return false;
    const text = share.url || share.code || '';
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  public setFilters(filters: Partial<ReplayFilter>): void {
    this.state.filters = { ...this.state.filters, ...filters };
    this.emit();
  }

  public resetFilters(): void {
    this.state.filters = { ...DEFAULT_FILTERS };
    this.emit();
  }

  public setSortBy(sortBy: 'date' | 'score' | 'duration' | 'views'): void {
    this.state.sortBy = sortBy;
    this.emit();
  }

  public setSortOrder(order: 'asc' | 'desc'): void {
    this.state.sortOrder = order;
    this.emit();
  }

  public getFilteredReplays(): ReplaySession[] {
    let result = [...this.state.replays];
    const f = this.state.filters;

    if (f.modes.length > 0) {
      result = result.filter((r) => f.modes.includes(r.mode));
    }
    if (f.dateRange) {
      result = result.filter(
        (r) => r.createdAt >= f.dateRange!.start && r.createdAt <= f.dateRange!.end
      );
    }
    if (f.scoreRange) {
      result = result.filter(
        (r) => r.adjustedScore >= f.scoreRange!.min && r.adjustedScore <= f.scoreRange!.max
      );
    }
    if (f.tags.length > 0) {
      result = result.filter((r) => f.tags.some((t) => r.tags.includes(t)));
    }
    if (f.favoritesOnly) {
      result = result.filter((r) => r.isFavorite);
    }
    if (f.hasKeyNodes) {
      result = result.filter((r) => r.keyNodes.length > 0);
    }
    if (f.hasReview) {
      result = result.filter((r) => !!this.state.reviews[r.id]);
    }

    const { sortBy, sortOrder } = this.state;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = a.createdAt - b.createdAt;
          break;
        case 'score':
          cmp = a.adjustedScore - b.adjustedScore;
          break;
        case 'duration':
          cmp = a.duration - b.duration;
          break;
        default:
          cmp = a.createdAt - b.createdAt;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }

  public calculateCameraFrame(
    replay: ReplaySession,
    index: number,
    viewMode: ViewMode
  ): { position: Vector3; target: Vector3; fov: number } {
    const tp = replay.trajectory[index];
    if (!tp) {
      return { position: { x: 0, y: 100, z: -100 }, target: { x: 0, y: 50, z: 0 }, fov: 60 };
    }

    const pos: Vector3 = { x: tp.x, y: tp.y, z: tp.z };
    let camPos: Vector3 = { x: pos.x, y: pos.y + 30, z: pos.z - 60 };
    let target: Vector3 = { ...pos };
    let fov = 60;

    const getPrevTp = (offset: number) =>
      replay.trajectory[Math.max(0, index - offset)] || tp;
    const getNextTp = (offset: number) =>
      replay.trajectory[Math.min(replay.trajectory.length - 1, index + offset)] || tp;

    switch (viewMode) {
      case 'follow': {
        const nextTp = getNextTp(10);
        const dir = {
          x: nextTp.x - pos.x,
          y: nextTp.y - pos.y,
          z: nextTp.z - pos.z,
        };
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
        const backDist = 50;
        camPos = {
          x: pos.x - (dir.x / len) * backDist,
          y: pos.y + 20,
          z: pos.z - (dir.z / len) * backDist,
        };
        target = { x: pos.x, y: pos.y, z: pos.z };
        fov = 60;
        break;
      }

      case 'chase': {
        const prevTp = getPrevTp(8);
        const dir = {
          x: pos.x - prevTp.x,
          y: pos.y - prevTp.y,
          z: pos.z - prevTp.z,
        };
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
        const chaseDist = 35;
        camPos = {
          x: pos.x - (dir.x / len) * chaseDist,
          y: pos.y + 15 - (dir.y / len) * chaseDist,
          z: pos.z - (dir.z / len) * chaseDist,
        };
        target = { ...pos };
        fov = 70;
        break;
      }

      case 'top_down': {
        camPos = { x: pos.x, y: pos.y + 200, z: pos.z + 0.1 };
        target = { x: pos.x, y: pos.y, z: pos.z };
        fov = 50;
        break;
      }

      case 'cockpit': {
        const nextTp = getNextTp(5);
        const dir = {
          x: nextTp.x - pos.x,
          y: nextTp.y - pos.y,
          z: nextTp.z - pos.z,
        };
        const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z) || 1;
        camPos = {
          x: pos.x - (dir.x / len) * 2,
          y: pos.y + 2,
          z: pos.z - (dir.z / len) * 2,
        };
        target = {
          x: pos.x + dir.x * 50,
          y: pos.y + dir.y * 50,
          z: pos.z + dir.z * 50,
        };
        fov = 85;
        break;
      }

      case 'cinematic': {
        const phase = index % 120;
        const angle = (phase / 120) * Math.PI * 2;
        const radius = 80;
        camPos = {
          x: pos.x + Math.cos(angle) * radius,
          y: pos.y + 40 + Math.sin(angle * 2) * 15,
          z: pos.z + Math.sin(angle) * radius,
        };
        target = { ...pos };
        fov = 55;
        break;
      }

      case 'free':
      default: {
        camPos = { x: pos.x, y: pos.y + 25, z: pos.z - 55 };
        target = { x: pos.x, y: pos.y, z: pos.z };
        fov = 60;
      }
    }

    return { position: camPos, target, fov };
  }

  public getPlaybackInfo(): {
    startTime: number;
    endTime: number;
    durationMs: number;
    totalFrames: number;
  } {
    const replay = this.state.replays.find((r) => r.id === this.state.currentReplayId);
    if (!replay || replay.trajectory.length === 0) {
      return { startTime: 0, endTime: 0, durationMs: 0, totalFrames: 0 };
    }
    const startTime = replay.trajectory[0].t;
    const endTime = replay.trajectory[replay.trajectory.length - 1].t;
    return {
      startTime,
      endTime,
      durationMs: endTime - startTime,
      totalFrames: replay.trajectory.length,
    };
  }

  public advancePlayback(deltaTimeMs: number): void {
    if (!this.state.playback.isPlaying) return;

    const info = this.getPlaybackInfo();
    if (info.totalFrames === 0) return;

    const speed = this.state.playback.playbackSpeed;
    let newTime = this.state.playback.currentTime + deltaTimeMs * speed;

    if (newTime >= info.endTime) {
      if (this.state.playback.isLooping) {
        newTime = info.startTime;
      } else {
        newTime = info.endTime;
        this.state.playback.isPlaying = false;
      }
    }

    this.seekToTime(newTime);
  }

  public getReplayById(id: string): ReplaySession | undefined {
    return this.state.replays.find((r) => r.id === id);
  }

  public getAllTags(): string[] {
    const tagSet = new Set<string>();
    this.state.replays.forEach((r) => {
      r.tags.forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  }

  public addTagToReplay(replayId: string, tag: string): boolean {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return false;
    if (!replay.tags.includes(tag)) {
      replay.tags.push(tag);
      this.saveToLocalStorage();
      this.emit();
    }
    return true;
  }

  public removeTagFromReplay(replayId: string, tag: string): boolean {
    const replay = this.state.replays.find((r) => r.id === replayId);
    if (!replay) return false;
    const idx = replay.tags.indexOf(tag);
    if (idx !== -1) {
      replay.tags.splice(idx, 1);
      this.saveToLocalStorage();
      this.emit();
      return true;
    }
    return false;
  }
}

export const replayEngine = new ReplayEngine();
