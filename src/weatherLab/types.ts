import type { WeatherConfig, GameConfig, GameStats, Vector3, WindFieldConfig } from '../game/types';
import { DEFAULT_WIND_FIELD as GameDefaultWindField } from '../game/types';

export type { WeatherConfig, GameConfig, GameStats, Vector3, WindFieldConfig };
export { GameDefaultWindField as DEFAULT_WIND_FIELD };

export type WeatherLabTab = 'windConfig' | 'scenes' | 'comparison' | 'anomaly';

export type SceneCategory = 'preset' | 'saved' | 'favorite';

export type AnomalyType = 'crash' | 'instability' | 'turbulence' | 'unexpected_drop' | 'control_loss';

export interface WeatherScene {
  id: string;
  name: string;
  description: string;
  category: SceneCategory;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  weatherConfig: WeatherConfig;
  gameConfig: Partial<GameConfig>;
  windField: WindFieldConfig;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  tags: string[];
}

export interface FlightRecord {
  id: string;
  sceneId: string;
  sceneName: string;
  startTime: number;
  endTime: number;
  duration: number;
  stats: GameStats;
  weatherConfig: WeatherConfig;
  windField: WindFieldConfig;
  kiteConfig?: {
    equippedParts: Record<string, string | null>;
    flightParams: Record<string, number>;
  };
  isAnomaly: boolean;
  anomalyType?: AnomalyType;
  anomalyDescription?: string;
  flightDataPoints: FlightDataPoint[];
}

export interface FlightDataPoint {
  timestamp: number;
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  windForce: Vector3;
  airCurrentForce: Vector3;
  stability: number;
  shadowTracking: number;
}

export interface AnomalyEvent {
  id: string;
  flightRecordId: string;
  type: AnomalyType;
  startTime: number;
  endTime: number;
  severity: number;
  description: string;
  dataPoints: FlightDataPoint[];
  probableCause: string;
  recommendations: string[];
  isReviewed: boolean;
}

export interface ComparisonGroup {
  id: string;
  name: string;
  flightRecordIds: string[];
  createdAt: number;
  notes: string;
}

export interface WeatherLabState {
  currentTab: WeatherLabTab;
  currentScene: WeatherScene | null;
  scenes: WeatherScene[];
  flightRecords: FlightRecord[];
  anomalyEvents: AnomalyEvent[];
  comparisonGroups: ComparisonGroup[];
  activeComparisonGroup: ComparisonGroup | null;
  selectedAnomaly: AnomalyEvent | null;
}

export interface SceneStats {
  totalFlights: number;
  bestScore: number;
  avgScore: number;
  bestDistance: number;
  bestHeight: number;
  successRate: number;
  anomalyCount: number;
}

export const WEATHER_ICONS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  windy: '💨',
  stormy: '⛈️',
  foggy: '🌫️',
  dawn: '🌅',
  dusk: '🌆',
  night: '🌙',
};

export const ANOMALY_TYPE_NAMES: Record<AnomalyType, string> = {
  crash: '坠毁事件',
  instability: '飞行不稳定',
  turbulence: '强烈湍流',
  unexpected_drop: '突然失速',
  control_loss: '操控失效',
};

export const DIFFICULTY_NAMES: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  extreme: '极限',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  extreme: '#a855f7',
};

export const TAB_NAMES: Record<WeatherLabTab, string> = {
  windConfig: '风场配置',
  scenes: '场景管理',
  comparison: '结果对比',
  anomaly: '异常复盘',
};
