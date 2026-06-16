import type { GameStats } from '../game/types';

export type FlightMode = 'free' | 'tournament' | 'training' | 'weatherLab' | 'levelEditor';

export type AnomalyType =
  | 'crash'
  | 'turbulence_loss'
  | 'downdraft_drop'
  | 'building_collision'
  | 'stall'
  | 'rapid_descent';

export type AchievementCategory = 'distance' | 'height' | 'score' | 'skill' | 'exploration' | 'special';

export type TitleType = 'level' | 'achievement' | 'score' | 'height' | 'distance' | 'skill' | 'special';

export interface Title {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: TitleType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: TitleCondition;
  unlocked: boolean;
  unlockedAt: number | null;
  isEquipped: boolean;
}

export interface TitleCondition {
  type:
    | 'min_level'
    | 'achievement_count'
    | 'total_score'
    | 'max_height'
    | 'total_distance'
    | 'perfect_flights'
    | 'achievement_ids'
    | 'specific_achievement'
    | 'consecutive_streak'
    | 'max_combo';
  target: number;
  achievementIds?: string[];
}

export interface FlightRecord {
  id: string;
  mode: FlightMode;
  modeName: string;
  timestamp: number;
  duration: number;
  stats: GameStats;
  adjustedScore: number;
  earnedCoins: number;
  weatherCondition?: string;
  trackName?: string;
  lessonName?: string;
  sceneName?: string;
  levelName?: string;
  trajectory?: TrajectoryPoint[];
  anomalies: string[];
  equippedParts?: Record<string, string | null>;
}

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  stability: number;
  shadowTracking: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: AchievementCondition;
  rewardCoins: number;
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
  maxProgress: number;
}

export interface AchievementCondition {
  type:
    | 'total_distance'
    | 'total_flights'
    | 'total_score'
    | 'max_height'
    | 'max_distance_single'
    | 'max_score_single'
    | 'consecutive_no_collision'
    | 'aircurrent_total'
    | 'perfect_flights'
    | 'modes_unlocked'
    | 'weather_experienced'
    | 'zero_collision_distance'
    | 'current_height_realtime'
    | 'current_score_realtime'
    | 'current_distance_realtime'
    | 'max_combo_realtime'
    | 'aircurrent_single'
    | 'lightning_miss_total'
    | 'obstacle_avoid_total';
  target: number;
}

export interface AnomalyEvent {
  id: string;
  type: AnomalyType;
  flightRecordId: string;
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  location?: { x: number; y: number; z: number };
  statsAtMoment?: Partial<GameStats>;
}

export interface BestTrajectory {
  id: string;
  flightRecordId: string;
  type: 'distance' | 'score' | 'height' | 'stability';
  title: string;
  achievedAt: number;
  value: number;
  trajectory: TrajectoryPoint[];
  summaryStats: GameStats;
  modeName: string;
}

export interface GrowthDataPoint {
  date: string;
  totalFlights: number;
  avgScore: number;
  avgDistance: number;
  avgMaxHeight: number;
  avgStability: number;
  totalScore: number;
  totalDistance: number;
  collisions: number;
}

export interface PilotProfile {
  name: string;
  title: string;
  level: number;
  experience: number;
  experienceToNext: number;
  joinDate: number;
  totalFlights: number;
  totalFlightTime: number;
  totalDistance: number;
  totalScore: number;
  totalAirCurrents: number;
  totalCollisions: number;
  perfectFlights: number;
  currentStreak: number;
  bestStreak: number;
  favoriteMode: FlightMode;
}

export interface JourneyState {
  profile: PilotProfile;
  flightRecords: FlightRecord[];
  achievements: Achievement[];
  titles: Title[];
  bestTrajectories: BestTrajectory[];
  anomalies: AnomalyEvent[];
  growthHistory: GrowthDataPoint[];
  recentWeatherTypes: string[];
}

export const FLIGHT_MODE_NAMES: Record<FlightMode, string> = {
  free: '自由飞行',
  tournament: '赛事挑战',
  training: '训练课程',
  weatherLab: '天气实验',
  levelEditor: '自定义关卡',
};

export const ANOMALY_TYPE_NAMES: Record<AnomalyType, string> = {
  crash: '飞行坠毁',
  turbulence_loss: '乱流失控',
  downdraft_drop: '下降气流坠落',
  building_collision: '建筑物碰撞',
  stall: '失速坠落',
  rapid_descent: '快速下降',
};

export const ANOMALY_TYPE_ICONS: Record<AnomalyType, string> = {
  crash: '💥',
  turbulence_loss: '🌀',
  downdraft_drop: '⬇️',
  building_collision: '🏢',
  stall: '🪂',
  rapid_descent: '📉',
};

export const ACHIEVEMENT_CATEGORY_NAMES: Record<AchievementCategory, string> = {
  distance: '远航',
  height: '高度',
  score: '得分',
  skill: '技巧',
  exploration: '探索',
  special: '特殊',
};

export const RARITY_NAMES: Record<Achievement['rarity'], string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_BG_COLORS: Record<Achievement['rarity'], string> = {
  common: 'rgba(156, 163, 175, 0.12)',
  rare: 'rgba(59, 130, 246, 0.12)',
  epic: 'rgba(168, 85, 247, 0.12)',
  legendary: 'rgba(245, 158, 11, 0.12)',
};

export const PILOT_TITLES = [
  { minLevel: 1, title: '风筝新手' },
  { minLevel: 5, title: '学徒飞行员' },
  { minLevel: 10, title: '熟练飞行员' },
  { minLevel: 20, title: '资深飞行员' },
  { minLevel: 35, title: '飞行专家' },
  { minLevel: 50, title: '天空大师' },
  { minLevel: 75, title: '风云驾驭者' },
  { minLevel: 100, title: '传奇飞行家' },
];

export const TITLE_TYPE_NAMES: Record<TitleType, string> = {
  level: '等级',
  achievement: '成就',
  score: '得分',
  height: '高度',
  distance: '距离',
  skill: '技巧',
  special: '特殊',
};
