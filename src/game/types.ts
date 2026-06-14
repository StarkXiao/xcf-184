export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

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
}

export interface WeatherConfig {
  windSpeed: number;
  windDirection: Vector3;
  cloudCoverage: number;
  timeOfDay: number;
  turbulenceLevel: number;
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
}

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
};

export const DEFAULT_WEATHER: WeatherConfig = {
  windSpeed: 0.3,
  windDirection: { x: 1, y: 0, z: 0.3 },
  cloudCoverage: 0.5,
  timeOfDay: 0.5,
  turbulenceLevel: 0.2,
};
