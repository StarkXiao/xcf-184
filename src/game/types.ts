export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export type WeatherEventType =
  | 'clear'
  | 'suddenStorm'
  | 'goldenHour'
  | 'morningBreeze'
  | 'nightFall'
  | 'denseFog'
  | 'sunBreak'
  | 'thunderStorm';

export type TimeOfDayPhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night';

export interface LightningStrike {
  id: string;
  position: Vector3;
  startTime: number;
  duration: number;
  maxDuration: number;
  intensity: number;
}

export interface WeatherEventState {
  currentEvent: WeatherEventType;
  eventStartTime: number;
  eventDuration: number;
  weatherEventDuration: number;
  scoreMultiplier: number;
  turbulenceMultiplier: number;
  windSpeedMultiplier: number;
  visibility: number;
  damageMultiplier: number;
  isTransitioning: boolean;
  transitionProgress: number;
  lightningStrikes: LightningStrike[];
  activeLightning: LightningStrike | null;
  fogDensity: number;
  nextEventCheckTime: number;
  lastEventEndTime: number;
  eventHistory: { event: WeatherEventType; startTime: number; endTime: number }[];
}

export interface WeatherEventConfig {
  enabled: boolean;
  eventCheckInterval: number;
  minEventDuration: number;
  maxEventDuration: number;
  minEventCooldown: number;
  stormProbability: number;
  goldenHourProbability: number;
  fogProbability: number;
  thunderProbability: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface KiteState {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  stringLength: number;
}

export interface ShadowTrailPoint {
  x: number;
  z: number;
  brightness: number;
  timestamp: number;
}

export interface AirCurrent {
  id: string;
  position: Vector3;
  radius: number;
  strength: number;
  direction: Vector3;
  type: 'updraft' | 'downdraft' | 'turbulence';
  lifeTime: number;
  maxLifeTime: number;
  shadowBrightness: number;
}

export interface Building {
  id: string;
  position: Vector3;
  width: number;
  height: number;
  depth: number;
  color: number;
}

export type ObstacleType = 'drone' | 'adBalloon' | 'bird' | 'airplane';

export type ObstacleMovementPattern = 'linear' | 'circular' | 'zigzag' | 'hover';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  position: Vector3;
  velocity: Vector3;
  radius: number;
  height: number;
  movementPattern: ObstacleMovementPattern;
  speed: number;
  lifeTime: number;
  maxLifeTime: number;
  damage: number;
  color: number;
  rotation: Vector3;
  angularVelocity: Vector3;
  phase: number;
  centerPosition?: Vector3;
  orbitRadius?: number;
  orbitSpeed?: number;
  warningLevel: number;
  isWarningActive: boolean;
  warningStartTime: number;
  hasCollided: boolean;
}

export interface ObstacleWarning {
  id: string;
  obstacleId: string;
  type: ObstacleType;
  position: Vector3;
  direction: Vector3;
  distance: number;
  timeToCollision: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: number;
  duration: number;
}

export interface ObstacleConfig {
  enabled: boolean;
  spawnRate: number;
  maxObstacles: number;
  minSpawnHeight: number;
  maxSpawnHeight: number;
  minSpeed: number;
  maxSpeed: number;
  droneProbability: number;
  adBalloonProbability: number;
  birdProbability: number;
  airplaneProbability: number;
  warningDistance: number;
  warningAdvanceTime: number;
  baseDamage: number;
}

export interface ObstacleStats {
  totalSpawned: number;
  totalCollided: number;
  totalAvoided: number;
  droneCollided: number;
  adBalloonCollided: number;
  birdCollided: number;
  airplaneCollided: number;
  nearMissCount: number;
  warningsIssued: number;
  maxObstaclesOnScreen: number;
}

export const DEFAULT_OBSTACLE_CONFIG: ObstacleConfig = {
  enabled: true,
  spawnRate: 0.015,
  maxObstacles: 8,
  minSpawnHeight: 30,
  maxSpawnHeight: 150,
  minSpeed: 2,
  maxSpeed: 8,
  droneProbability: 0.35,
  adBalloonProbability: 0.3,
  birdProbability: 0.25,
  airplaneProbability: 0.1,
  warningDistance: 80,
  warningAdvanceTime: 3,
  baseDamage: 15,
};

export const DEFAULT_OBSTACLE_STATS: ObstacleStats = {
  totalSpawned: 0,
  totalCollided: 0,
  totalAvoided: 0,
  droneCollided: 0,
  adBalloonCollided: 0,
  birdCollided: 0,
  airplaneCollided: 0,
  nearMissCount: 0,
  warningsIssued: 0,
  maxObstaclesOnScreen: 0,
};

export interface Cloud {
  id: string;
  position: Vector3;
  scale: number;
  speed: number;
}

export interface KiteDurabilityState {
  current: number;
  max: number;
  criticalThreshold: number;
  warningThreshold: number;
  isCritical: boolean;
  isWarning: boolean;
}

export interface SpoolTensionState {
  current: number;
  max: number;
  optimal: number;
  criticalThreshold: number;
  warningThreshold: number;
  isOverTension: boolean;
  isUnderTension: boolean;
  stringLength: number;
  maxStringLength: number;
  minStringLength: number;
  reelRate: number;
  tensionDamageRate: number;
}

export interface DurabilityConfig {
  maxDurability: number;
  collisionDamage: number;
  turbulenceDamage: number;
  rapidReelDamage: number;
  highTensionDamage: number;
  passiveRecoveryRate: number;
  criticalThreshold: number;
  warningThreshold: number;
}

export interface TensionConfig {
  maxTension: number;
  optimalTension: number;
  criticalThreshold: number;
  warningThreshold: number;
  baseTension: number;
  tensionPerLength: number;
  tensionPerSpeed: number;
  tensionPerWind: number;
  maxStringLength: number;
  minStringLength: number;
  baseReelRate: number;
  rapidReelThreshold: number;
  tensionDamageRate: number;
}

export interface GameStats {
  score: number;
  distance: number;
  height: number;
  time: number;
  maxHeight: number;
  airCurrentCount: number;
  shadowTracking: number;
  flightStability: number;
  shadowBonus: number;
  collisions: number;
  durability: KiteDurabilityState;
  tension: SpoolTensionState;
  durabilityBonus: number;
  tensionBonus: number;
  totalDamageTaken: number;
  avgTension: number;
  tensionSamples: number;
  weatherEvent: WeatherEventType;
  timeOfDayPhase: TimeOfDayPhase;
  scoreMultiplier: number;
  visibility: number;
  weatherEventDuration: number;
  baseScore: number;
  weatherBonusScore: number;
  lightningNearMiss: number;
  comboFlow: ComboFlowState;
  obstacleStats: ObstacleStats;
  activeWarnings: ObstacleWarning[];
}

export interface WindFieldConfig {
  windSpeed: number;
  windDirection: Vector3;
  turbulenceLevel: number;
  gustStrength: number;
  gustFrequency: number;
  shearFactor: number;
  boundaryLayerHeight: number;
  windDirectionLocked: boolean;
}

export interface WeatherConfig {
  windSpeed: number;
  windDirection: Vector3;
  cloudCoverage: number;
  timeOfDay: number;
  turbulenceLevel: number;
  timeOfDayFrozen: boolean;
  windField?: WindFieldConfig;
  weatherEventConfig?: WeatherEventConfig;
  forceWeatherEvent?: WeatherEventType;
}

export interface FlightParams {
  maxSpeed: number;
  acceleration: number;
  liftForce: number;
  dragCoefficient: number;
  stabilityFactor: number;
  windResponse: number;
  maxAltitude: number;
  turnRate: number;
}

export interface GameConfig {
  worldSize: number;
  kiteSpeed: number;
  gravity: number;
  airCurrentSpawnRate: number;
  minAirCurrentStrength: number;
  maxAirCurrentStrength: number;
  minBuildingHeight: number;
  maxBuildingHeight: number;
  buildingDensity: number;
  shadowTrailLength: number;
  shadowTrackingTargetDistance: number;
  windSpeed: number;
  turbulenceLevel: number;
  cloudCoverage: number;
  flightParams?: FlightParams;
  durabilityConfig?: DurabilityConfig;
  tensionConfig?: TensionConfig;
  difficultyPreset?: 'easy' | 'normal' | 'hard' | 'extreme';
  weatherEventConfig?: WeatherEventConfig;
  obstacleConfig?: ObstacleConfig;
}

export const DEFAULT_WEATHER_EVENT_CONFIG: WeatherEventConfig = {
  enabled: true,
  eventCheckInterval: 15,
  minEventDuration: 20,
  maxEventDuration: 60,
  minEventCooldown: 30,
  stormProbability: 0.15,
  goldenHourProbability: 0.1,
  fogProbability: 0.1,
  thunderProbability: 0.08,
};

export const DEFAULT_GAME_CONFIG: GameConfig = {
  worldSize: 500,
  kiteSpeed: 0.5,
  gravity: 0.015,
  airCurrentSpawnRate: 0.02,
  minAirCurrentStrength: 0.08,
  maxAirCurrentStrength: 0.2,
  minBuildingHeight: 15,
  maxBuildingHeight: 60,
  buildingDensity: 0.3,
  shadowTrailLength: 40,
  shadowTrackingTargetDistance: 35,
  windSpeed: 0.3,
  turbulenceLevel: 0.2,
  cloudCoverage: 0.5,
  weatherEventConfig: { ...DEFAULT_WEATHER_EVENT_CONFIG },
  obstacleConfig: { ...DEFAULT_OBSTACLE_CONFIG },
};

export const DEFAULT_WIND_FIELD: WindFieldConfig = {
  windSpeed: 0.3,
  windDirection: { x: 1, y: 0, z: 0.3 },
  turbulenceLevel: 0.2,
  gustStrength: 0.1,
  gustFrequency: 0.05,
  shearFactor: 0.02,
  boundaryLayerHeight: 50,
  windDirectionLocked: false,
};

export const DEFAULT_WEATHER: WeatherConfig = {
  windSpeed: 0.3,
  windDirection: { x: 1, y: 0, z: 0.3 },
  cloudCoverage: 0.5,
  timeOfDay: 0.5,
  turbulenceLevel: 0.2,
  timeOfDayFrozen: false,
  windField: { ...DEFAULT_WIND_FIELD },
  weatherEventConfig: { ...DEFAULT_WEATHER_EVENT_CONFIG },
};

export const DEFAULT_DURABILITY_CONFIG: DurabilityConfig = {
  maxDurability: 100,
  collisionDamage: 25,
  turbulenceDamage: 0.3,
  rapidReelDamage: 0.2,
  highTensionDamage: 0.4,
  passiveRecoveryRate: 0.05,
  criticalThreshold: 20,
  warningThreshold: 50,
};

export const DEFAULT_TENSION_CONFIG: TensionConfig = {
  maxTension: 100,
  optimalTension: 50,
  criticalThreshold: 85,
  warningThreshold: 70,
  baseTension: 20,
  tensionPerLength: 0.15,
  tensionPerSpeed: 0.8,
  tensionPerWind: 15,
  maxStringLength: 200,
  minStringLength: 30,
  baseReelRate: 8,
  rapidReelThreshold: 15,
  tensionDamageRate: 0.15,
};

export interface ComboFlowHit {
  id: string;
  airCurrentId: string;
  timestamp: number;
  type: 'updraft' | 'downdraft' | 'turbulence';
  strength: number;
  shadowBrightness: number;
  score: number;
  comboCount: number;
  isPerfect: boolean;
  position: Vector3;
}

export interface ComboFlowState {
  combo: number;
  maxCombo: number;
  totalHits: number;
  perfectHits: number;
  comboScore: number;
  totalComboScore: number;
  currentMultiplier: number;
  lastHitTime: number;
  comboTimeout: number;
  hits: ComboFlowHit[];
  isActive: boolean;
  comboBreakCount: number;
  longestComboTime: number;
  comboStartTime: number;
}

export const DEFAULT_COMBO_FLOW_STATE: ComboFlowState = {
  combo: 0,
  maxCombo: 0,
  totalHits: 0,
  perfectHits: 0,
  comboScore: 0,
  totalComboScore: 0,
  currentMultiplier: 1.0,
  lastHitTime: 0,
  comboTimeout: 2.5,
  hits: [],
  isActive: false,
  comboBreakCount: 0,
  longestComboTime: 0,
  comboStartTime: 0,
};

export interface ComboVisualEffect {
  id: string;
  type: 'hit' | 'combo' | 'perfect' | 'break' | 'milestone';
  position: Vector3;
  startTime: number;
  duration: number;
  value?: number;
  text?: string;
}

export type WindDirectionRelation = 'headwind' | 'tailwind' | 'crosswind_left' | 'crosswind_right' | 'optimal';

export interface WindObservationData {
  windSpeed: number;
  windDirection: Vector3;
  windDirectionAngle: number;
  kiteVelocityAngle: number;
  windRelation: WindDirectionRelation;
  turbulenceLevel: number;
  gustStrength: number;
  gustFrequency: number;
  windAtAltitude: number;
  recommendedAltitude: number;
  windHistory: { timestamp: number; speed: number; angle: number }[];
}

export interface StrategySuggestion {
  id: string;
  type: 'flight' | 'weather' | 'safety' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action?: {
    type: 'adjust_flight' | 'adjust_weather' | 'adjust_params';
    params: Record<string, number | string>;
  };
  timestamp: number;
}

export interface UIFlightTip {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  message: string;
  icon: string;
  duration: number;
  timestamp: number;
}

export interface TuningPreset {
  id: string;
  name: string;
  description: string;
  weatherConfig: Partial<WeatherConfig>;
  flightParams: Partial<FlightParams>;
  conditions: string[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    id: 'calm_flying',
    name: '平稳飞行',
    description: '低风速、低湍流，适合新手练习',
    weatherConfig: {
      windSpeed: 0.15,
      turbulenceLevel: 0.1,
      cloudCoverage: 0.3,
    },
    flightParams: {
      stabilityFactor: 1.2,
      maxSpeed: 1.0,
      windResponse: 0.8,
    },
    conditions: ['新手', '练习', '平稳'],
  },
  {
    id: 'speed_demon',
    name: '极速挑战',
    description: '高风速、高响应，追求极限速度',
    weatherConfig: {
      windSpeed: 0.6,
      turbulenceLevel: 0.15,
      cloudCoverage: 0.4,
    },
    flightParams: {
      maxSpeed: 1.8,
      acceleration: 0.8,
      windResponse: 1.3,
      turnRate: 1.2,
    },
    conditions: ['高手', '竞速', '挑战'],
  },
  {
    id: 'storm_rider',
    name: '风暴骑士',
    description: '极端天气条件，考验操控技术',
    weatherConfig: {
      windSpeed: 0.8,
      turbulenceLevel: 0.6,
      cloudCoverage: 0.9,
      forceWeatherEvent: 'suddenStorm',
    },
    flightParams: {
      stabilityFactor: 0.7,
      maxSpeed: 2.0,
      dragCoefficient: 0.95,
      windResponse: 1.5,
    },
    conditions: ['专家', '风暴', '高难度'],
  },
  {
    id: 'thermal_hunter',
    name: '热气流猎手',
    description: '中等风速，优化升力，追求高度',
    weatherConfig: {
      windSpeed: 0.35,
      turbulenceLevel: 0.25,
      cloudCoverage: 0.5,
    },
    flightParams: {
      liftForce: 0.025,
      maxAltitude: 350,
      stabilityFactor: 0.9,
      dragCoefficient: 0.97,
    },
    conditions: ['高度', '气流', '探索'],
  },
  {
    id: 'precision_flying',
    name: '精准操控',
    description: '优化转向和稳定性，适合障碍穿越',
    weatherConfig: {
      windSpeed: 0.25,
      turbulenceLevel: 0.1,
      cloudCoverage: 0.2,
    },
    flightParams: {
      turnRate: 1.5,
      stabilityFactor: 1.3,
      acceleration: 0.6,
      windResponse: 0.9,
    },
    conditions: ['障碍', '精准', '任务'],
  },
];

export const WEATHER_SAFETY_THRESHOLDS = {
  safeWindSpeed: 0.4,
  warningWindSpeed: 0.6,
  dangerWindSpeed: 0.8,
  safeTurbulence: 0.3,
  warningTurbulence: 0.5,
  dangerTurbulence: 0.7,
  safeGustStrength: 0.3,
  warningGustStrength: 0.5,
  dangerGustStrength: 0.7,
};

export type FallCauseType =
  | 'durability_depleted'
  | 'ground_collision'
  | 'lightning_strike'
  | 'cumulative_damage'
  | 'tension_overload'
  | 'rapid_descent'
  | 'obstacle_chain'
  | 'weather_hazard'
  | 'unknown';

export type CollisionEventType = 'building' | 'obstacle' | 'ground' | 'lightning';

export interface CollisionEventRecord {
  id: string;
  type: CollisionEventType;
  timestamp: number;
  gameTime: number;
  position: Vector3;
  velocity: Vector3;
  damage: number;
  impactSpeed: number;
  obstacleId?: string;
  obstacleType?: string;
  snapshot: CrashStateSnapshot;
}

export interface CrashStateSnapshot {
  durability: number;
  maxDurability: number;
  tension: number;
  maxTension: number;
  height: number;
  speed: number;
  stability: number;
  shadowTracking: number;
  combo: number;
  score: number;
  distance: number;
  weatherEvent: WeatherEventType;
  windSpeed: number;
  turbulenceLevel: number;
  collisions: number;
  totalDamageTaken: number;
  time: number;
}

export interface FallCauseAnalysis {
  primaryCause: FallCauseType;
  primaryCauseLabel: string;
  primaryCauseDescription: string;
  contributingFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  criticalMomentIndex: number;
  timeline: CrashTimelineEntry[];
  summary: string;
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  durabilityAtEnd: number;
  totalCollisions: number;
  damageBreakdown: {
    collisionDamage: number;
    tensionDamage: number;
    weatherDamage: number;
    lightningDamage: number;
    otherDamage: number;
  };
}

export interface CrashTimelineEntry {
  time: number;
  type: CollisionEventType | 'warning' | 'critical' | 'recovery';
  label: string;
  description: string;
  durabilityPercent: number;
  damage: number;
  position: Vector3;
  icon: string;
  color: string;
}

export interface RestartGuidance {
  title: string;
  suggestions: Array<{
    category: 'dodge' | 'control' | 'equipment' | 'route' | 'weather';
    icon: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  quickTip: string;
  recommendedPreset?: string;
}

export interface CrashAnalysisResult {
  collisionEvents: CollisionEventRecord[];
  snapshots: CrashStateSnapshot[];
  analysis: FallCauseAnalysis;
  guidance: RestartGuidance;
}

export const COLLISION_EVENT_TYPE_LABELS: Record<CollisionEventType, string> = {
  building: '建筑物碰撞',
  obstacle: '障碍物碰撞',
  ground: '坠地',
  lightning: '雷击',
};

export const FALL_CAUSE_LABELS: Record<FallCauseType, string> = {
  durability_depleted: '耐久耗尽',
  ground_collision: '坠地坠毁',
  lightning_strike: '雷击坠毁',
  cumulative_damage: '累积损伤',
  tension_overload: '张力过载',
  rapid_descent: '急速下坠',
  obstacle_chain: '连续碰撞',
  weather_hazard: '天气灾害',
  unknown: '未知原因',
};

export const FALL_CAUSE_DESCRIPTIONS: Record<FallCauseType, string> = {
  durability_depleted: '风筝耐久度降至零，结构完全损坏',
  ground_collision: '风筝失去高度，直接撞击地面',
  lightning_strike: '在雷暴天气中被闪电直接击中',
  cumulative_damage: '多次碰撞和损伤积累导致坠毁',
  tension_overload: '线绳张力持续过高，导致风筝失控坠落',
  rapid_descent: '风筝在短时间内急速下坠无法恢复',
  obstacle_chain: '连续撞击多个障碍物导致连环坠毁',
  weather_hazard: '极端天气条件下失去控制',
  unknown: '无法确定具体坠毁原因',
};

export const SEVERITY_LABELS: Record<string, string> = {
  minor: '轻微',
  moderate: '中等',
  severe: '严重',
  catastrophic: '灾难性',
};

export const GUIDANCE_CATEGORY_LABELS: Record<string, string> = {
  dodge: '闪避技巧',
  control: '操控优化',
  equipment: '装备建议',
  route: '路线规划',
  weather: '天气应对',
};

export const DIFFICULTY_PRESETS: Record<string, Partial<GameConfig>> = {
  easy: {
    durabilityConfig: {
      ...DEFAULT_DURABILITY_CONFIG,
      maxDurability: 150,
      collisionDamage: 15,
      turbulenceDamage: 0.15,
      highTensionDamage: 0.2,
      passiveRecoveryRate: 0.1,
      criticalThreshold: 30,
      warningThreshold: 60,
    },
    tensionConfig: {
      ...DEFAULT_TENSION_CONFIG,
      maxTension: 120,
      criticalThreshold: 95,
      warningThreshold: 80,
      tensionDamageRate: 0.08,
    },
  },
  normal: {
    durabilityConfig: { ...DEFAULT_DURABILITY_CONFIG },
    tensionConfig: { ...DEFAULT_TENSION_CONFIG },
  },
  hard: {
    durabilityConfig: {
      ...DEFAULT_DURABILITY_CONFIG,
      maxDurability: 80,
      collisionDamage: 35,
      turbulenceDamage: 0.5,
      highTensionDamage: 0.6,
      passiveRecoveryRate: 0.03,
      criticalThreshold: 25,
      warningThreshold: 55,
    },
    tensionConfig: {
      ...DEFAULT_TENSION_CONFIG,
      maxTension: 90,
      optimalTension: 45,
      criticalThreshold: 75,
      warningThreshold: 60,
      tensionDamageRate: 0.25,
    },
  },
  extreme: {
    durabilityConfig: {
      ...DEFAULT_DURABILITY_CONFIG,
      maxDurability: 60,
      collisionDamage: 50,
      turbulenceDamage: 0.8,
      highTensionDamage: 1.0,
      passiveRecoveryRate: 0.01,
      criticalThreshold: 30,
      warningThreshold: 60,
    },
    tensionConfig: {
      ...DEFAULT_TENSION_CONFIG,
      maxTension: 80,
      optimalTension: 40,
      criticalThreshold: 65,
      warningThreshold: 50,
      tensionDamageRate: 0.4,
      tensionPerLength: 0.2,
      tensionPerSpeed: 1.2,
      tensionPerWind: 25,
    },
  },
};
