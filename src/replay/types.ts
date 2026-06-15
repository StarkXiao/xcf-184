import type { GameStats, Vector3 } from '../game/types';
import type { FlightMode, TrajectoryPoint } from '../journey/types';

export type { FlightMode, Vector3 };

export type ViewMode =
  | 'follow'
  | 'chase'
  | 'top_down'
  | 'free'
  | 'cinematic'
  | 'cockpit';

export type KeyNodeType =
  | 'takeoff'
  | 'peak_height'
  | 'max_distance'
  | 'air_current'
  | 'collision'
  | 'turbulence'
  | 'anomaly'
  | 'landing'
  | 'custom'
  | 'combo'
  | 'score_burst';

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

export type ScoreDimension =
  | 'stability'
  | 'altitude_control'
  | 'air_current_utilization'
  | 'shadow_tracking'
  | 'risk_management'
  | 'efficiency'
  | 'overall';

export interface ReplayTrajectoryPoint extends TrajectoryPoint {
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
  gameStats?: Partial<GameStats>;
  windVector?: Vector3;
}

export interface KeyNode {
  id: string;
  type: KeyNodeType;
  timestamp: number;
  trajectoryIndex: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  position: Vector3;
  statsAtMoment: Partial<GameStats> & Record<string, any>;
  isUserAdded: boolean;
  tags: string[];
}

export interface CameraFrame {
  position: Vector3;
  target: Vector3;
  fov: number;
  timestamp: number;
}

export interface ReplaySession {
  id: string;
  flightRecordId: string;
  title: string;
  createdAt: number;
  duration: number;
  mode: FlightMode;
  modeName: string;
  trajectory: ReplayTrajectoryPoint[];
  keyNodes: KeyNode[];
  initialStats: GameStats;
  finalStats: GameStats;
  adjustedScore: number;
  earnedCoins: number;
  weatherCondition?: string;
  trackName?: string;
  sceneName?: string;
  viewHistory: ViewMode[];
  isFavorite: boolean;
  tags: string[];
  thumbnail?: string;
  cameraFrames?: CameraFrame[];
  windFieldSnapshots?: Array<{
    timestamp: number;
    windDirection: Vector3;
    windSpeed: number;
    turbulenceLevel: number;
  }>;
}

export interface ReviewScore {
  dimension: ScoreDimension;
  score: number;
  maxScore: number;
  weight: number;
  comment: string;
  highlights: string[];
  suggestions: string[];
}

export interface ReplayReview {
  replayId: string;
  reviewedAt: number;
  overallScore: number;
  maxOverallScore: number;
  scores: ReviewScore[];
  strengths: string[];
  improvements: string[];
  grade: ReplayGrade;
  achievements: string[];
  tips: string[];
}

export type ReplayGrade = 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D';

export interface ShareConfig {
  mode: 'link' | 'image' | 'clip' | 'social';
  includeTrajectory: boolean;
  includeKeyNodes: boolean;
  includeScore: boolean;
  quality: 'low' | 'medium' | 'high';
  clipStart?: number;
  clipEnd?: number;
}

export interface ShareResult {
  id: string;
  type: string;
  url?: string;
  code?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface ReplayFilter {
  modes: FlightMode[];
  dateRange?: { start: number; end: number };
  scoreRange?: { min: number; max: number };
  tags: string[];
  favoritesOnly: boolean;
  hasKeyNodes: boolean;
  hasReview: boolean;
}

export interface PlaybackStateData {
  isPlaying: boolean;
  currentTime: number;
  currentIndex: number;
  playbackSpeed: number;
  viewMode: ViewMode;
  showTrajectory: boolean;
  showKeyNodes: boolean;
  showStatsOverlay: boolean;
  isLooping: boolean;
  volume: number;
}

export interface ReplayState {
  replays: ReplaySession[];
  reviews: Record<string, ReplayReview>;
  shares: ShareResult[];
  currentReplayId: string | null;
  playback: PlaybackStateData;
  filters: ReplayFilter;
  sortBy: 'date' | 'score' | 'duration' | 'views';
  sortOrder: 'asc' | 'desc';
}

export const VIEW_MODES: Array<{ id: ViewMode; name: string; icon: string; description: string }> = [
  { id: 'follow', name: '跟随视角', icon: '🎯', description: '跟随风筝移动，保持固定距离' },
  { id: 'chase', name: '追逐视角', icon: '🏃', description: '从后方追逐风筝' },
  { id: 'top_down', name: '俯视视角', icon: '⬇️', description: '从正上方俯瞰全局' },
  { id: 'free', name: '自由视角', icon: '🎮', description: '自由控制摄像机位置' },
  { id: 'cinematic', name: '电影视角', icon: '🎬', description: '自动切换多个电影级视角' },
  { id: 'cockpit', name: '第一视角', icon: '🥽', description: '模拟风筝驾驶者视角' },
];

export const KEY_NODE_TYPES: Array<{
  type: KeyNodeType;
  name: string;
  icon: string;
  color: string;
  autoDetect: boolean;
}> = [
  { type: 'takeoff', name: '起飞', icon: '🚀', color: '#22c55e', autoDetect: true },
  { type: 'peak_height', name: '最高高度', icon: '⛰️', color: '#3b82f6', autoDetect: true },
  { type: 'max_distance', name: '最远距离', icon: '📍', color: '#8b5cf6', autoDetect: true },
  { type: 'air_current', name: '气流利用', icon: '🌀', color: '#06b6d4', autoDetect: true },
  { type: 'collision', name: '碰撞事件', icon: '💥', color: '#ef4444', autoDetect: true },
  { type: 'turbulence', name: '乱流区域', icon: '🌪️', color: '#f97316', autoDetect: true },
  { type: 'anomaly', name: '异常事件', icon: '⚠️', color: '#eab308', autoDetect: true },
  { type: 'landing', name: '降落', icon: '🛬', color: '#64748b', autoDetect: true },
  { type: 'combo', name: '连击爆发', icon: '⚡', color: '#fbbf24', autoDetect: true },
  { type: 'score_burst', name: '得分高峰', icon: '💎', color: '#ec4899', autoDetect: true },
  { type: 'custom', name: '自定义', icon: '🏷️', color: '#14b8a6', autoDetect: false },
];

export const SCORE_DIMENSIONS: Array<{
  id: ScoreDimension;
  name: string;
  icon: string;
  description: string;
  weight: number;
}> = [
  { id: 'stability', name: '飞行稳定性', icon: '⚖️', description: '飞行过程中的平稳程度', weight: 0.15 },
  { id: 'altitude_control', name: '高度控制', icon: '📏', description: '对飞行高度的精准控制', weight: 0.15 },
  { id: 'air_current_utilization', name: '气流利用', icon: '🌀', description: '有效利用上升气流的能力', weight: 0.2 },
  { id: 'shadow_tracking', name: '影子追踪', icon: '👤', description: '保持影子追踪的准确度', weight: 0.15 },
  { id: 'risk_management', name: '风险管理', icon: '🛡️', description: '规避碰撞和危险的能力', weight: 0.15 },
  { id: 'efficiency', name: '飞行效率', icon: '⚡', description: '单位时间内的得分效率', weight: 0.2 },
];

export const GRADE_THRESHOLDS: Array<{ grade: ReplayGrade; minScore: number; color: string }> = [
  { grade: 'S+', minScore: 95, color: '#ff00ff' },
  { grade: 'S', minScore: 90, color: '#ffd700' },
  { grade: 'A+', minScore: 85, color: '#ff8c00' },
  { grade: 'A', minScore: 80, color: '#ff6b6b' },
  { grade: 'B', minScore: 70, color: '#4ecdc4' },
  { grade: 'C', minScore: 60, color: '#95e1d3' },
  { grade: 'D', minScore: 0, color: '#9ca3af' },
];

export const DEFAULT_PLAYBACK: PlaybackStateData = {
  isPlaying: false,
  currentTime: 0,
  currentIndex: 0,
  playbackSpeed: 1,
  viewMode: 'follow',
  showTrajectory: true,
  showKeyNodes: true,
  showStatsOverlay: true,
  isLooping: false,
  volume: 0.7,
};

export const DEFAULT_FILTERS: ReplayFilter = {
  modes: [],
  tags: [],
  favoritesOnly: false,
  hasKeyNodes: false,
  hasReview: false,
};

export const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4];
