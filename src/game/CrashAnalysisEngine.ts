import type {
  GameStats,
  CollisionEventRecord,
  CrashStateSnapshot,
  FallCauseType,
  FallCauseAnalysis,
  CrashTimelineEntry,
  CollisionEventType,
  RestartGuidance,
  CrashAnalysisResult,
} from '../game/types';
import {
  FALL_CAUSE_LABELS,
  FALL_CAUSE_DESCRIPTIONS,
  COLLISION_EVENT_TYPE_LABELS,
} from '../game/types';

function isDurabilityCritical(prev: CrashStateSnapshot, curr: CrashStateSnapshot): boolean {
  const prevRatio = prev.durability / prev.maxDurability;
  const currRatio = curr.durability / curr.maxDurability;
  return (prevRatio > 0.5 && currRatio <= 0.5) || (prevRatio > 0.2 && currRatio <= 0.2);
}

export class CrashAnalysisEngine {
  public analyze(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    snapshots: CrashStateSnapshot[],
    damageBreakdown: {
      collisionDamage: number;
      tensionDamage: number;
      weatherDamage: number;
      lightningDamage: number;
      otherDamage: number;
    }
  ): CrashAnalysisResult {
    const analysis = this.buildFallCauseAnalysis(stats, collisionEvents, snapshots, damageBreakdown);
    const guidance = this.buildRestartGuidance(stats, collisionEvents, analysis);
    return {
      collisionEvents,
      snapshots,
      analysis,
      guidance,
    };
  }

  private buildFallCauseAnalysis(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    snapshots: CrashStateSnapshot[],
    damageBreakdown: {
      collisionDamage: number;
      tensionDamage: number;
      weatherDamage: number;
      lightningDamage: number;
      otherDamage: number;
    }
  ): FallCauseAnalysis {
    const primaryCause = this.determinePrimaryCause(stats, collisionEvents, snapshots, damageBreakdown);
    const contributingFactors = this.determineContributingFactors(stats, collisionEvents, snapshots, damageBreakdown);
    const timeline = this.buildTimeline(stats, collisionEvents, snapshots);
    const severity = this.determineSeverity(stats, collisionEvents);
    const criticalMomentIndex = this.findCriticalMomentIndex(timeline);

    const durabilityAtEnd = stats.durability.current;
    const totalCollisions = stats.collisions;

    const summary = this.generateSummary(primaryCause, stats, collisionEvents, severity);

    return {
      primaryCause,
      primaryCauseLabel: FALL_CAUSE_LABELS[primaryCause],
      primaryCauseDescription: FALL_CAUSE_DESCRIPTIONS[primaryCause],
      contributingFactors,
      criticalMomentIndex,
      timeline,
      summary,
      severity,
      durabilityAtEnd,
      totalCollisions,
      damageBreakdown,
    };
  }

  private determinePrimaryCause(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    snapshots: CrashStateSnapshot[],
    damageBreakdown: {
      collisionDamage: number;
      tensionDamage: number;
      weatherDamage: number;
      lightningDamage: number;
      otherDamage: number;
    }
  ): FallCauseType {
    const lastEvent = collisionEvents.length > 0
      ? collisionEvents[collisionEvents.length - 1]
      : null;

    if (lastEvent?.type === 'lightning' && stats.weatherEvent === 'thunderStorm') {
      return 'lightning_strike';
    }

    if (lastEvent?.type === 'ground') {
      if (snapshots.length >= 3) {
        const recent = snapshots.slice(-5);
        const hasRapidDescent = recent.some((s, i) => {
          if (i === 0) return false;
          const prev = recent[i - 1];
          return prev.height - s.height > 30;
        });
        if (hasRapidDescent) return 'rapid_descent';
      }
      return 'ground_collision';
    }

    if (stats.durability.current <= 0) {
      const recentEvents = collisionEvents.filter(e => e.gameTime > stats.time - 5);
      if (recentEvents.length >= 3) return 'obstacle_chain';

      if (damageBreakdown.tensionDamage > damageBreakdown.collisionDamage &&
          damageBreakdown.tensionDamage > damageBreakdown.weatherDamage) {
        return 'tension_overload';
      }

      if (damageBreakdown.weatherDamage > damageBreakdown.collisionDamage) {
        return 'weather_hazard';
      }

      if (stats.totalDamageTaken > stats.durability.max * 1.5) {
        return 'cumulative_damage';
      }

      return 'durability_depleted';
    }

    return 'unknown';
  }

  private determineContributingFactors(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    snapshots: CrashStateSnapshot[],
    damageBreakdown: {
      collisionDamage: number;
      tensionDamage: number;
      weatherDamage: number;
      lightningDamage: number;
      otherDamage: number;
    }
  ): Array<{ factor: string; weight: number; description: string }> {
    const factors: Array<{ factor: string; weight: number; description: string }> = [];
    const totalDamage = stats.totalDamageTaken || 1;

    if (damageBreakdown.collisionDamage > 0) {
      const weight = damageBreakdown.collisionDamage / totalDamage;
      factors.push({
        factor: 'collision',
        weight,
        description: `碰撞造成 ${Math.round(damageBreakdown.collisionDamage)} 点损伤 (占比 ${Math.round(weight * 100)}%)`,
      });
    }

    if (damageBreakdown.tensionDamage > 0) {
      const weight = damageBreakdown.tensionDamage / totalDamage;
      factors.push({
        factor: 'tension',
        weight,
        description: `急速收线造成 ${Math.round(damageBreakdown.tensionDamage)} 点损伤 (占比 ${Math.round(weight * 100)}%)`,
      });
    }

    if (damageBreakdown.lightningDamage > 0) {
      const weight = damageBreakdown.lightningDamage / totalDamage;
      factors.push({
        factor: 'lightning',
        weight,
        description: `雷击造成 ${Math.round(damageBreakdown.lightningDamage)} 点损伤 (占比 ${Math.round(weight * 100)}%)`,
      });
    }

    if (damageBreakdown.weatherDamage > 0) {
      const weight = damageBreakdown.weatherDamage / totalDamage;
      factors.push({
        factor: 'weather',
        weight,
        description: `恶劣天气造成 ${Math.round(damageBreakdown.weatherDamage)} 点损伤 (占比 ${Math.round(weight * 100)}%)`,
      });
    }

    if (stats.tension.isOverTension) {
      factors.push({
        factor: 'overtension',
        weight: 0.15,
        description: '飞行期间张力持续过高，影响操控稳定性',
      });
    }

    if (snapshots.length > 0) {
      const lowStabilitySnaps = snapshots.filter(s => s.stability < 0.3);
      if (lowStabilitySnaps.length > snapshots.length * 0.3) {
        factors.push({
          factor: 'instability',
          weight: 0.2,
          description: `飞行过程中 ${Math.round((lowStabilitySnaps.length / snapshots.length) * 100)}% 时间处于不稳定状态`,
        });
      }
    }

    if (collisionEvents.length > 5) {
      factors.push({
        factor: 'frequent_collision',
        weight: 0.25,
        description: `共发生 ${collisionEvents.length} 次碰撞，频率过高`,
      });
    }

    if (stats.weatherEvent !== 'clear' && stats.weatherEventDuration > 20) {
      factors.push({
        factor: 'weather_duration',
        weight: 0.15,
        description: `恶劣天气持续 ${Math.round(stats.weatherEventDuration)} 秒，对飞行造成持续影响`,
      });
    }

    factors.sort((a, b) => b.weight - a.weight);
    return factors.slice(0, 5);
  }

  private buildTimeline(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    snapshots: CrashStateSnapshot[]
  ): CrashTimelineEntry[] {
    const entries: CrashTimelineEntry[] = [];

    if (snapshots.length > 0) {
      const first = snapshots[0];
      entries.push({
        time: first.time,
        type: 'recovery',
        label: '起飞阶段',
        description: `高度 ${Math.round(first.height)}m，耐久 ${Math.round(first.durability)}/${first.maxDurability}`,
        durabilityPercent: (first.durability / first.maxDurability) * 100,
        damage: 0,
        position: { x: 0, y: first.height, z: 0 },
        icon: '🚀',
        color: '#22c55e',
      });
    }

    for (const event of collisionEvents) {
      const durabilityPercent = (event.snapshot.durability / event.snapshot.maxDurability) * 100;
      const typeConfig = this.getTimelineTypeConfig(event.type, durabilityPercent);

      let label = COLLISION_EVENT_TYPE_LABELS[event.type] || '未知碰撞';
      if (event.obstacleType) {
        const obstacleNames: Record<string, string> = {
          drone: '无人机',
          adBalloon: '广告气球',
          bird: '飞鸟',
          airplane: '飞机',
          lightning: '闪电',
          ground: '地面',
        };
        label = `撞击${obstacleNames[event.obstacleType] || event.obstacleType}`;
      }

      entries.push({
        time: event.gameTime,
        type: event.type,
        label,
        description: `高度 ${Math.round(event.position.y)}m，受损 ${Math.round(event.damage)} 点，撞击速度 ${event.impactSpeed.toFixed(1)}`,
        durabilityPercent,
        damage: event.damage,
        position: event.position,
        icon: typeConfig.icon,
        color: typeConfig.color,
      });
    }

    if (snapshots.length >= 3) {
      for (let i = 2; i < snapshots.length; i++) {
        const prev = snapshots[i - 1];
        const curr = snapshots[i];
        const durabilityDrop = prev.durability - curr.durability;
        const heightDrop = prev.height - curr.height;

        if (isDurabilityCritical(prev, curr) && !collisionEvents.some(e => Math.abs(e.gameTime - curr.time) < 2)) {
          entries.push({
            time: curr.time,
            type: 'warning',
            label: '耐久告警',
            description: `耐久降至 ${Math.round(curr.durability)} (${Math.round((curr.durability / curr.maxDurability) * 100)}%)`,
            durabilityPercent: (curr.durability / curr.maxDurability) * 100,
            damage: durabilityDrop,
            position: { x: 0, y: curr.height, z: 0 },
            icon: '⚠️',
            color: '#f59e0b',
          });
        }

        if (heightDrop > 40 && curr.stability < 0.3) {
          entries.push({
            time: curr.time,
            type: 'critical',
            label: '急速下坠',
            description: `高度骤降 ${Math.round(heightDrop)}m，稳定性 ${Math.round(curr.stability * 100)}%`,
            durabilityPercent: (curr.durability / curr.maxDurability) * 100,
            damage: durabilityDrop,
            position: { x: 0, y: curr.height, z: 0 },
            icon: '🔴',
            color: '#ef4444',
          });
        }
      }
    }

    entries.push({
      time: stats.time,
      type: collisionEvents.length > 0 && collisionEvents[collisionEvents.length - 1].type === 'ground' ? 'ground' : 'critical',
      label: '飞行结束',
      description: `最终得分 ${stats.score}，飞行时间 ${Math.round(stats.time)}s`,
      durabilityPercent: (stats.durability.current / stats.durability.max) * 100,
      damage: 0,
      position: { x: 0, y: stats.height, z: 0 },
      icon: '🏁',
      color: '#64748b',
    });

    entries.sort((a, b) => a.time - b.time);
    return entries;
  }

  private findCriticalMomentIndex(timeline: CrashTimelineEntry[]): number {
    let maxDamage = 0;
    let criticalIdx = 0;
    timeline.forEach((entry, idx) => {
      if (entry.damage > maxDamage) {
        maxDamage = entry.damage;
        criticalIdx = idx;
      }
    });
    return criticalIdx;
  }

  private determineSeverity(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[]
  ): 'minor' | 'moderate' | 'severe' | 'catastrophic' {
    const durabilityRatio = stats.durability.current / stats.durability.max;
    const collisionCount = collisionEvents.length;
    const totalDamageRatio = stats.totalDamageTaken / stats.durability.max;

    if (collisionCount === 0 && durabilityRatio > 0.5) return 'minor';
    if (durabilityRatio <= 0 && collisionCount >= 5) return 'catastrophic';
    if (totalDamageRatio > 1.5 || collisionCount >= 4) return 'severe';
    if (collisionCount >= 2 || totalDamageRatio > 0.8) return 'moderate';
    return 'minor';
  }

  private generateSummary(
    primaryCause: FallCauseType,
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    severity: 'minor' | 'moderate' | 'severe' | 'catastrophic'
  ): string {
    const causeLabel = FALL_CAUSE_LABELS[primaryCause];
    const severityLabel = severity === 'catastrophic' ? '灾难性' :
                          severity === 'severe' ? '严重' :
                          severity === 'moderate' ? '中等' : '轻微';

    const parts: string[] = [
      `坠毁原因：${causeLabel}（${severityLabel}）`,
    ];

    if (collisionEvents.length > 0) {
      const buildingHits = collisionEvents.filter(e => e.type === 'building').length;
      const obstacleHits = collisionEvents.filter(e => e.type === 'obstacle').length;
      const lightningHits = collisionEvents.filter(e => e.type === 'lightning').length;

      const hitParts: string[] = [];
      if (buildingHits > 0) hitParts.push(`${buildingHits}次撞击建筑`);
      if (obstacleHits > 0) hitParts.push(`${obstacleHits}次撞击障碍`);
      if (lightningHits > 0) hitParts.push(`${lightningHits}次雷击`);
      parts.push(hitParts.join('，'));
    }

    parts.push(`总损伤 ${Math.round(stats.totalDamageTaken)} 点，飞行 ${Math.round(stats.time)} 秒`);

    return parts.join('。') + '。';
  }

  private buildRestartGuidance(
    stats: GameStats,
    collisionEvents: CollisionEventRecord[],
    analysis: FallCauseAnalysis
  ): RestartGuidance {
    const suggestions: RestartGuidance['suggestions'] = [];

    const buildingHits = collisionEvents.filter(e => e.type === 'building').length;
    const obstacleHits = collisionEvents.filter(e => e.type === 'obstacle').length;
    const lightningHits = collisionEvents.filter(e => e.type === 'lightning').length;

    if (buildingHits > 0) {
      suggestions.push({
        category: 'dodge',
        icon: '🏗️',
        title: '注意建筑物间距',
        description: buildingHits >= 3
          ? `本次撞击建筑 ${buildingHits} 次，建议在建筑密集区提前调整高度，保持与建筑顶部的安全距离`
          : `撞击建筑 ${buildingHits} 次，注意观察前方建筑并提前规避`,
        priority: buildingHits >= 3 ? 'high' : 'medium',
      });
    }

    if (obstacleHits > 0) {
      const obstacleTypes = new Set(
        collisionEvents
          .filter(e => e.type === 'obstacle' && e.obstacleType)
          .map(e => e.obstacleType!)
      );
      const typeNames: Record<string, string> = { drone: '无人机', adBalloon: '广告气球', bird: '飞鸟', airplane: '飞机' };
      const typesStr = Array.from(obstacleTypes).map(t => typeNames[t] || t).join('、');
      suggestions.push({
        category: 'dodge',
        icon: '🎯',
        title: '规避障碍物',
        description: `被${typesStr}击中 ${obstacleHits} 次，留意预警标记，提前变向避开`,
        priority: obstacleHits >= 2 ? 'high' : 'medium',
      });
    }

    if (analysis.damageBreakdown.tensionDamage > stats.durability.max * 0.2) {
      suggestions.push({
        category: 'control',
        icon: '🧵',
        title: '控制收线速度',
        description: '急速收线造成大量损伤，请缓慢均匀地收放线，保持张力在安全范围内',
        priority: 'high',
      });
    }

    if (stats.tension.isOverTension || analysis.damageBreakdown.tensionDamage > 0) {
      suggestions.push({
        category: 'control',
        icon: '⚖️',
        title: '优化张力管理',
        description: '张力过高时主动放线减压，利用风力而非蛮力控制风筝',
        priority: 'medium',
      });
    }

    if (lightningHits > 0 || stats.weatherEvent === 'thunderStorm') {
      suggestions.push({
        category: 'weather',
        icon: '⛈️',
        title: '雷暴天气策略',
        description: '雷暴时降低飞行高度，远离闪电标记区域，必要时暂停飞行等待天气好转',
        priority: 'high',
      });
    }

    if (analysis.damageBreakdown.weatherDamage > stats.durability.max * 0.15) {
      suggestions.push({
        category: 'weather',
        icon: '🌪️',
        title: '恶劣天气应对',
        description: '暴风和湍流天气下降低高度，增加稳定性，减少冒险操作',
        priority: 'medium',
      });
    }

    if (stats.flightStability < 0.5) {
      suggestions.push({
        category: 'control',
        icon: '🎯',
        title: '提升飞行稳定性',
        description: '飞行不够稳定，尝试减小操作幅度，保持平稳的飞行轨迹',
        priority: 'medium',
      });
    }

    if (stats.durability.max < 100) {
      suggestions.push({
        category: 'equipment',
        icon: '🛡️',
        title: '强化耐久防护',
        description: '当前耐久上限较低，前往工坊升级风筝骨架以提升耐久',
        priority: 'low',
      });
    }

    if (collisionEvents.some(e => e.snapshot.height < 30)) {
      suggestions.push({
        category: 'route',
        icon: '📏',
        title: '保持安全高度',
        description: '低空飞行容易坠地，建议保持 50m 以上高度，预留紧急爬升空间',
        priority: 'high',
      });
    }

    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const quickTip = this.generateQuickTip(analysis.primaryCause, stats);

    let recommendedPreset: string | undefined;
    if (analysis.damageBreakdown.collisionDamage > stats.totalDamageTaken * 0.5) {
      recommendedPreset = 'precision_flying';
    } else if (stats.flightStability < 0.4) {
      recommendedPreset = 'calm_flying';
    } else if (lightningHits > 0) {
      recommendedPreset = 'storm_rider';
    }

    return {
      title: '再次起飞建议',
      suggestions: suggestions.slice(0, 5),
      quickTip,
      recommendedPreset,
    };
  }

  private generateQuickTip(primaryCause: FallCauseType, _stats: GameStats): string {
    switch (primaryCause) {
      case 'durability_depleted':
        return '💡 下次飞行注意规避碰撞，利用影子追踪得分代替冒险操作';
      case 'ground_collision':
        return '💡 保持安全高度！低空时优先爬升，不要贪图低空气流';
      case 'lightning_strike':
        return '💡 雷暴来临时立即降低高度并远离闪电区域';
      case 'cumulative_damage':
        return '💡 小伤积累致命！及时利用安全时段恢复，避免连续碰撞';
      case 'tension_overload':
        return '💡 张力过高时主动放线！不要猛拉线绳，温和操控更安全';
      case 'rapid_descent':
        return '💡 失速下坠时不要慌张，稳住方向寻找上升气流恢复高度';
      case 'obstacle_chain':
        return '💡 连续碰撞后优先远离障碍区域，恢复稳定再继续飞行';
      case 'weather_hazard':
        return '💡 恶劣天气降低高度和速度，以稳为主，等天气转好再发力';
      default:
        return '💡 每次飞行都是学习机会，观察失误原因下次一定更好！';
    }
  }

  private getTimelineTypeConfig(
    type: CollisionEventType,
    _durabilityPercent: number
  ): { icon: string; color: string } {
    switch (type) {
      case 'building':
        return { icon: '🏗️', color: '#f97316' };
      case 'obstacle':
        return { icon: '💥', color: '#ef4444' };
      case 'ground':
        return { icon: '💀', color: '#dc2626' };
      case 'lightning':
        return { icon: '⚡', color: '#eab308' };
      default:
        return { icon: '❓', color: '#9ca3af' };
    }
  }
}

export const crashAnalysisEngine = new CrashAnalysisEngine();
