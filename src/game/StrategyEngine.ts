import type {
  GameStats,
  WeatherConfig,
  WindFieldConfig,
  FlightParams,
  StrategySuggestion,
  UIFlightTip,
  WindObservationData,
  WindDirectionRelation,
  Vector3,
} from './types';
import { WEATHER_SAFETY_THRESHOLDS } from './types';

export class StrategyEngine {
  private suggestions: StrategySuggestion[] = [];
  private tips: UIFlightTip[] = [];
  private lastSuggestionTime: Map<string, number> = new Map();
  private suggestionCooldown: number = 5000;

  public analyze(
    stats: GameStats,
    weatherConfig: WeatherConfig,
    windField: WindFieldConfig,
    flightParams: FlightParams | undefined,
    kiteVelocity: Vector3,
    currentTime: number
  ): {
    suggestions: StrategySuggestion[];
    tips: UIFlightTip[];
    observation: WindObservationData;
  } {
    const observation = this.calculateWindObservation(
      weatherConfig,
      windField,
      kiteVelocity,
      stats.height,
      currentTime
    );

    const newSuggestions = this.generateSuggestions(
      stats,
      weatherConfig,
      windField,
      flightParams,
      observation,
      currentTime
    );

    const newTips = this.generateFlightTips(
      stats,
      observation,
      currentTime
    );

    this.suggestions = [...this.suggestions, ...newSuggestions].slice(-20);
    this.tips = [...this.tips, ...newTips].filter(
      (t) => currentTime - t.timestamp < t.duration
    );

    return {
      suggestions: newSuggestions,
      tips: newTips,
      observation,
    };
  }

  private calculateWindObservation(
    _weatherConfig: WeatherConfig,
    windField: WindFieldConfig,
    kiteVelocity: Vector3,
    altitude: number,
    currentTime: number
  ): WindObservationData {
    const windDirectionAngle = Math.atan2(windField.windDirection.z, windField.windDirection.x) * (180 / Math.PI);
    const kiteVelocityAngle = Math.atan2(kiteVelocity.z, kiteVelocity.x) * (180 / Math.PI);
    
    const angleDiff = ((windDirectionAngle - kiteVelocityAngle + 180 + 360) % 360) - 180;
    let windRelation: WindDirectionRelation = 'optimal';
    
    if (Math.abs(angleDiff) < 20) {
      windRelation = 'headwind';
    } else if (Math.abs(angleDiff) > 160) {
      windRelation = 'tailwind';
    } else if (angleDiff > 0 && angleDiff < 160) {
      windRelation = 'crosswind_right';
    } else if (angleDiff < 0 && angleDiff > -160) {
      windRelation = 'crosswind_left';
    }

    if (Math.abs(angleDiff) > 70 && Math.abs(angleDiff) < 110) {
      windRelation = 'optimal';
    }

    const windAtAltitude = this.calculateWindAtAltitude(altitude, windField);
    const recommendedAltitude = this.findRecommendedAltitude(windField);

    const windHistory = this.updateWindHistory(currentTime, windField.windSpeed, windDirectionAngle);

    return {
      windSpeed: windField.windSpeed,
      windDirection: { ...windField.windDirection },
      windDirectionAngle,
      kiteVelocityAngle,
      windRelation,
      turbulenceLevel: windField.turbulenceLevel,
      gustStrength: windField.gustStrength,
      gustFrequency: windField.gustFrequency,
      windAtAltitude,
      recommendedAltitude,
      windHistory,
    };
  }

  private calculateWindAtAltitude(altitude: number, windField: WindFieldConfig): number {
    const { windSpeed, shearFactor, boundaryLayerHeight } = windField;
    
    const speedMultiplier = altitude < boundaryLayerHeight
      ? Math.pow(altitude / boundaryLayerHeight, 0.3)
      : 1 + (altitude - boundaryLayerHeight) * shearFactor * 0.01;

    return windSpeed * Math.max(0.1, speedMultiplier);
  }

  private findRecommendedAltitude(windField: WindFieldConfig): number {
    const { boundaryLayerHeight, turbulenceLevel } = windField;
    
    if (turbulenceLevel > 0.5) {
      return boundaryLayerHeight * 0.6;
    } else if (turbulenceLevel > 0.3) {
      return boundaryLayerHeight * 0.8;
    }
    return boundaryLayerHeight * 1.2;
  }

  private windHistoryData: { timestamp: number; speed: number; angle: number }[] = [];

  private updateWindHistory(
    currentTime: number,
    speed: number,
    angle: number
  ): { timestamp: number; speed: number; angle: number }[] {
    this.windHistoryData.push({ timestamp: currentTime, speed, angle });
    if (this.windHistoryData.length > 60) {
      this.windHistoryData = this.windHistoryData.slice(-60);
    }
    return [...this.windHistoryData];
  }

  private generateSuggestions(
    stats: GameStats,
    _weatherConfig: WeatherConfig,
    windField: WindFieldConfig,
    _flightParams: FlightParams | undefined,
    observation: WindObservationData,
    currentTime: number
  ): StrategySuggestion[] {
    const suggestions: StrategySuggestion[] = [];
    const thresholds = WEATHER_SAFETY_THRESHOLDS;

    if (windField.windSpeed > thresholds.dangerWindSpeed) {
      if (this.canAddSuggestion('danger_wind', currentTime)) {
        suggestions.push({
          id: `danger_wind_${currentTime}`,
          type: 'safety',
          priority: 'critical',
          title: '风速过高警告',
          description: `当前风速 ${windField.windSpeed.toFixed(2)} 已超过安全阈值，建议立即降低高度并准备降落。`,
          action: {
            type: 'adjust_flight',
            params: { altitude: -50, stability: 0.2 },
          },
          timestamp: currentTime,
        });
      }
    } else if (windField.windSpeed > thresholds.warningWindSpeed) {
      if (this.canAddSuggestion('warning_wind', currentTime)) {
        suggestions.push({
          id: `warning_wind_${currentTime}`,
          type: 'safety',
          priority: 'high',
          title: '风速偏高注意',
          description: `风速已达 ${windField.windSpeed.toFixed(2)}，注意保持风筝稳定，避免剧烈操作。`,
          action: {
            type: 'adjust_flight',
            params: { stability: 0.1 },
          },
          timestamp: currentTime,
        });
      }
    }

    if (windField.turbulenceLevel > thresholds.dangerTurbulence) {
      if (this.canAddSuggestion('danger_turbulence', currentTime)) {
        suggestions.push({
          id: `danger_turbulence_${currentTime}`,
          type: 'weather',
          priority: 'critical',
          title: '强湍流警告',
          description: `湍流强度 ${windField.turbulenceLevel.toFixed(2)}，风筝稳定性严重受影响，建议降低高度或调整飞行参数。`,
          action: {
            type: 'adjust_params',
            params: { stabilityFactor: 0.3, windResponse: -0.2 },
          },
          timestamp: currentTime,
        });
      }
    }

    if (windField.gustStrength > thresholds.warningGustStrength) {
      if (this.canAddSuggestion('gust_warning', currentTime)) {
        suggestions.push({
          id: `gust_warning_${currentTime}`,
          type: 'weather',
          priority: 'high',
          title: '阵风强度较高',
          description: `阵风强度 ${windField.gustStrength.toFixed(2)}，注意线轴张力变化，避免突然放线。`,
          timestamp: currentTime,
        });
      }
    }

    if (observation.windRelation === 'headwind') {
      if (this.canAddSuggestion('headwind', currentTime)) {
        suggestions.push({
          id: `headwind_${currentTime}`,
          type: 'flight',
          priority: 'medium',
          title: '逆风飞行',
          description: '当前处于逆风状态，可获得更大升力但消耗更多能量。建议适当增加线长保持高度。',
          timestamp: currentTime,
        });
      }
    } else if (observation.windRelation === 'tailwind') {
      if (this.canAddSuggestion('tailwind', currentTime)) {
        suggestions.push({
          id: `tailwind_${currentTime}`,
          type: 'flight',
          priority: 'medium',
          title: '顺风飞行',
          description: '当前处于顺风状态，飞行速度快但升力不足。建议降低线长维持高度。',
          timestamp: currentTime,
        });
      }
    } else if (observation.windRelation === 'optimal') {
      if (this.canAddSuggestion('optimal_wind', currentTime)) {
        suggestions.push({
          id: `optimal_wind_${currentTime}`,
          type: 'flight',
          priority: 'low',
          title: '风向绝佳',
          description: '当前风向与飞行方向垂直，是最佳飞行角度！可充分利用风能。',
          timestamp: currentTime,
        });
      }
    }

    const altitudeDiff = observation.recommendedAltitude - stats.height;
    if (Math.abs(altitudeDiff) > 30) {
      if (this.canAddSuggestion('altitude_adjust', currentTime)) {
        const direction = altitudeDiff > 0 ? '提升' : '降低';
        suggestions.push({
          id: `altitude_adjust_${currentTime}`,
          type: 'optimization',
          priority: 'low',
          title: `建议${direction}高度`,
          description: `当前高度 ${Math.floor(stats.height)}m，推荐高度 ${Math.floor(observation.recommendedAltitude)}m，${direction} ${Math.floor(Math.abs(altitudeDiff))}m 可获得更优风况。`,
          action: {
            type: 'adjust_flight',
            params: { altitude: altitudeDiff },
          },
          timestamp: currentTime,
        });
      }
    }

    if (stats.durability.isCritical) {
      if (this.canAddSuggestion('durability_critical', currentTime)) {
        suggestions.push({
          id: `durability_critical_${currentTime}`,
          type: 'safety',
          priority: 'critical',
          title: '耐久度严重不足',
          description: '风筝耐久度已达临界值，继续飞行有坠毁风险！建议立即准备降落。',
          timestamp: currentTime,
        });
      }
    }

    if (stats.tension.isOverTension) {
      if (this.canAddSuggestion('over_tension', currentTime)) {
        suggestions.push({
          id: `over_tension_${currentTime}`,
          type: 'safety',
          priority: 'high',
          title: '线轴张力过高',
          description: '线轴张力超过安全阈值，有断线风险！建议适当放线降低张力。',
          action: {
            type: 'adjust_flight',
            params: { reel: 1 },
          },
          timestamp: currentTime,
        });
      }
    }

    if (stats.flightStability < 0.4) {
      if (this.canAddSuggestion('low_stability', currentTime)) {
        suggestions.push({
          id: `low_stability_${currentTime}`,
          type: 'optimization',
          priority: 'medium',
          title: '飞行稳定性偏低',
          description: `当前稳定性 ${Math.floor(stats.flightStability * 100)}%，建议平稳操作，避免突然转向。`,
          timestamp: currentTime,
        });
      }
    }

    if (stats.visibility < 0.5) {
      if (this.canAddSuggestion('low_visibility', currentTime)) {
        suggestions.push({
          id: `low_visibility_${currentTime}`,
          type: 'safety',
          priority: 'high',
          title: '能见度低',
          description: `当前能见度 ${Math.floor(stats.visibility * 100)}%，注意观察障碍物，降低飞行速度。`,
          timestamp: currentTime,
        });
      }
    }

    return suggestions;
  }

  private generateFlightTips(
    stats: GameStats,
    observation: WindObservationData,
    currentTime: number
  ): UIFlightTip[] {
    const tips: UIFlightTip[] = [];

    if (observation.windRelation === 'optimal') {
      if (this.canAddSuggestion('tip_optimal', currentTime, 10000)) {
        tips.push({
          id: `tip_optimal_${currentTime}`,
          type: 'success',
          message: '风向绝佳！尽情享受飞行吧',
          icon: '🎯',
          duration: 5000,
          timestamp: currentTime,
        });
      }
    }

    if (observation.windRelation === 'headwind' && observation.windSpeed > 0.4) {
      if (this.canAddSuggestion('tip_headwind', currentTime, 8000)) {
        tips.push({
          id: `tip_headwind_${currentTime}`,
          type: 'info',
          message: '逆风飞行，注意保持张力',
          icon: '💨',
          duration: 4000,
          timestamp: currentTime,
        });
      }
    }

    if (observation.turbulenceLevel > 0.5) {
      if (this.canAddSuggestion('tip_turbulence', currentTime, 6000)) {
        tips.push({
          id: `tip_turbulence_${currentTime}`,
          type: 'warning',
          message: '气流不稳定，平稳操作',
          icon: '🌪️',
          duration: 4000,
          timestamp: currentTime,
        });
      }
    }

    if (stats.durability.isWarning && !stats.durability.isCritical) {
      if (this.canAddSuggestion('tip_durability', currentTime, 10000)) {
        tips.push({
          id: `tip_durability_${currentTime}`,
          type: 'warning',
          message: '耐久度偏低，注意躲避障碍物',
          icon: '⚠️',
          duration: 5000,
          timestamp: currentTime,
        });
      }
    }

    if (stats.tension.isOverTension) {
      if (this.canAddSuggestion('tip_tension', currentTime, 3000)) {
        tips.push({
          id: `tip_tension_${currentTime}`,
          type: 'danger',
          message: '张力过高！按 F 放线',
          icon: '🧵',
          duration: 3000,
          timestamp: currentTime,
        });
      }
    }

    if (stats.weatherEvent === 'thunderStorm') {
      if (this.canAddSuggestion('tip_thunder', currentTime, 5000)) {
        tips.push({
          id: `tip_thunder_${currentTime}`,
          type: 'danger',
          message: '雷暴天气！立即降低高度',
          icon: '⛈️',
          duration: 5000,
          timestamp: currentTime,
        });
      }
    }

    if (stats.weatherEvent === 'goldenHour') {
      if (this.canAddSuggestion('tip_golden', currentTime, 15000)) {
        tips.push({
          id: `tip_golden_${currentTime}`,
          type: 'success',
          message: '金色小时！双倍得分机会',
          icon: '🌅',
          duration: 8000,
          timestamp: currentTime,
        });
      }
    }

    if (stats.shadowTracking > 0.8) {
      if (this.canAddSuggestion('tip_tracking', currentTime, 10000)) {
        tips.push({
          id: `tip_tracking_${currentTime}`,
          type: 'success',
          message: '影子追踪完美！+S级奖励',
          icon: '👑',
          duration: 6000,
          timestamp: currentTime,
        });
      }
    }

    return tips;
  }

  private canAddSuggestion(key: string, currentTime: number, cooldown?: number): boolean {
    const lastTime = this.lastSuggestionTime.get(key) || 0;
    const cd = cooldown || this.suggestionCooldown;
    if (currentTime - lastTime >= cd) {
      this.lastSuggestionTime.set(key, currentTime);
      return true;
    }
    return false;
  }

  public getSuggestions(): StrategySuggestion[] {
    return [...this.suggestions];
  }

  public getActiveTips(currentTime: number): UIFlightTip[] {
    return this.tips.filter((t) => currentTime - t.timestamp < t.duration);
  }

  public clear(): void {
    this.suggestions = [];
    this.tips = [];
    this.lastSuggestionTime.clear();
    this.windHistoryData = [];
  }
}

export const WIND_RELATION_NAMES: Record<WindDirectionRelation, string> = {
  headwind: '逆风',
  tailwind: '顺风',
  crosswind_left: '左侧风',
  crosswind_right: '右侧风',
  optimal: '最佳风向',
};

export const WIND_RELATION_ICONS: Record<WindDirectionRelation, string> = {
  headwind: '↗️',
  tailwind: '↘️',
  crosswind_left: '↖️',
  crosswind_right: '↙️',
  optimal: '🎯',
};

export const WIND_RELATION_COLORS: Record<WindDirectionRelation, string> = {
  headwind: '#ff6b6b',
  tailwind: '#4ecdc4',
  crosswind_left: '#45b7d1',
  crosswind_right: '#96ceb4',
  optimal: '#ffd700',
};
