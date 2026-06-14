export type TournamentStatus = 'idle' | 'registered' | 'in_progress' | 'completed';

export type Division = 'novice' | 'intermediate' | 'advanced' | 'master';

export type TrackDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export type ScoringEventType =
  | 'distance'
  | 'height'
  | 'air_current'
  | 'shadow_bonus'
  | 'stability'
  | 'collision'
  | 'time_bonus'
  | 'checkpoint';

export type ChapterStatus = 'locked' | 'unlocked' | 'completed' | 'mastered';

export type RankTier = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface DivisionConfig {
  id: Division;
  name: string;
  icon: string;
  color: string;
  minScore: number;
  maxScore: number;
  description: string;
}

export interface TrackRule {
  id: string;
  label: string;
  description: string;
  modifier: number;
}

export interface TrackConfig {
  id: string;
  chapterId: string;
  name: string;
  description: string;
  difficulty: TrackDifficulty;
  division: Division;
  rules: TrackRule[];
  targetScore: number;
  timeLimit: number;
  worldSize: number;
  gravity: number;
  airCurrentSpawnRate: number;
  minAirCurrentStrength: number;
  maxAirCurrentStrength: number;
  minBuildingHeight: number;
  maxBuildingHeight: number;
  buildingDensity: number;
  windSpeed: number;
  turbulenceLevel: number;
  cloudCoverage: number;
  checkpointCount: number;
  coinReward: number;
  unlockTrackId: string | null;
}

export interface ChapterConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  trackIds: string[];
  requiredCompletions: number;
  requiredMasteries: number;
  unlockChapterId: string | null;
}

export interface ScoringEvent {
  type: ScoringEventType;
  value: number;
  timestamp: number;
  multiplier: number;
  description: string;
}

export interface LiveScore {
  totalScore: number;
  events: ScoringEvent[];
  multiplier: number;
  comboCount: number;
  comboTimer: number;
  lastEventTime: number;
}

export interface TrackResult {
  trackId: string;
  score: number;
  rank: RankTier;
  completedAt: number;
  bestScore: number;
  attempts: number;
  mastered: boolean;
  coinReward: number;
}

export interface ChapterProgress {
  chapterId: string;
  status: ChapterStatus;
  completedTracks: string[];
  masteredTracks: string[];
  bestScores: Record<string, number>;
  totalAttempts: number;
}

export interface TournamentEntry {
  id: string;
  playerName: string;
  division: Division;
  totalScore: number;
  completedTracks: string[];
  chapterProgress: Record<string, ChapterProgress>;
  joinedAt: number;
}

export interface RankingEntry {
  rank: number;
  entryId: string;
  playerName: string;
  division: Division;
  score: number;
  rankTier: RankTier;
  completedTracks: number;
  masteredTracks: number;
  isPlayer: boolean;
}

export interface TournamentState {
  status: TournamentStatus;
  currentEntry: TournamentEntry | null;
  currentTrackId: string | null;
  liveScore: LiveScore;
  trackResults: Record<string, TrackResult>;
  chapterProgress: Record<string, ChapterProgress>;
  rankings: RankingEntry[];
  totalCoins: number;
}

export interface GameConfigOverride {
  worldSize: number;
  gravity: number;
  airCurrentSpawnRate: number;
  minAirCurrentStrength: number;
  maxAirCurrentStrength: number;
  minBuildingHeight: number;
  maxBuildingHeight: number;
  buildingDensity: number;
  windSpeed: number;
  turbulenceLevel: number;
  cloudCoverage: number;
}

export const DIVISION_NAMES: Record<Division, string> = {
  novice: '新手组',
  intermediate: '进阶组',
  advanced: '高手组',
  master: '大师组',
};

export const DIFFICULTY_NAMES: Record<TrackDifficulty, string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
  extreme: '极限',
};

export const CHAPTER_STATUS_NAMES: Record<ChapterStatus, string> = {
  locked: '未解锁',
  unlocked: '已解锁',
  completed: '已完成',
  mastered: '已精通',
};

export const RANK_TIER_COLORS: Record<RankTier, string> = {
  D: '#9ca3af',
  C: '#95e1d3',
  B: '#4ecdc4',
  A: '#ff6b6b',
  S: '#ffd700',
  SS: '#ff8c00',
  SSS: '#ff00ff',
};

export const RANK_TIER_THRESHOLDS: Record<RankTier, number> = {
  D: 0,
  C: 500,
  B: 1500,
  A: 3000,
  S: 5000,
  SS: 8000,
  SSS: 12000,
};

export const DEFAULT_LIVE_SCORE: LiveScore = {
  totalScore: 0,
  events: [],
  multiplier: 1,
  comboCount: 0,
  comboTimer: 0,
  lastEventTime: 0,
};
