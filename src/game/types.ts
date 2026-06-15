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
  duration: number;
  maxDuration: number;
  intensity: number;
}

export interface WeatherEventState {
  currentEvent: WeatherEventType;
  eventStartTime: number;
  eventDuration: number;
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
