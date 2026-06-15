export type TaskType =
  | 'distanceTarget'
  | 'heightTarget'
  | 'airCurrentCount'
  | 'timeSurvival'
  | 'shadowTracking'
  | 'stabilityMaintain'
  | 'scoreTarget'
  | 'comboAirCurrent';

export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface StageTask {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  targetValue: number;
  currentValue: number;
  difficulty: TaskDifficulty;
  rewardScore: number;
  rewardCoins: number;
  completed: boolean;
  progress: number;
  timeLimit?: number;
  bonusMultiplier?: number;
}

export type ChapterUnlockCondition =
  | { type: 'chapter_complete'; chapterId: string; minStars: number }
  | { type: 'total_stars'; count: number }
  | { type: 'best_score'; minScore: number }
  | { type: 'difficulty_cleared'; difficulty: 'easy' | 'normal' | 'hard' | 'extreme' }
  | { type: 'always' };

export interface Chapter {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  chapterNumber: number;
  stageIds: string[];
  unlockCondition: ChapterUnlockCondition;
  unlocked: boolean;
  completed: boolean;
  totalStars: number;
  maxStars: number;
  unlockedDifficulties: ('easy' | 'normal' | 'hard' | 'extreme')[];
  themeColor: string;
  themeGradient: string;
  icon: string;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  stageNumber: number;
  chapterId: string;
  tasks: StageTask[];
  weatherTheme: 'sunny' | 'cloudy' | 'windy' | 'stormy' | 'night';
  airCurrentTheme: 'calm' | 'moderate' | 'turbulent' | 'extreme';
  backgroundStory: string;
  timeLimit?: number;
  totalRewardScore: number;
  totalRewardCoins: number;
  unlocked: boolean;
  completed: boolean;
  stars: number;
  bestScore: number;
}

export interface StageProgress {
  currentStageId: string | null;
  currentTaskIndex: number;
  stageStartTime: number;
  taskStartTime: number;
  comboCount: number;
  maxCombo: number;
  totalScoreEarned: number;
  totalCoinsEarned: number;
  isStageActive: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'task_start' | 'task_complete' | 'stage_start' | 'stage_complete' | 'bonus' | 'warning';
  duration: number;
  startTime: number;
  priority: number;
}

export interface StageSettlement {
  stageId: string;
  stageName: string;
  completedTasks: number;
  totalTasks: number;
  baseScore: number;
  bonusScore: number;
  totalScore: number;
  earnedCoins: number;
  stars: number;
  timeUsed: number;
  maxCombo: number;
  isNewRecord: boolean;
  isFailed: boolean;
  failReason?: string;
}

export const TASK_TYPE_NAMES: Record<TaskType, string> = {
  distanceTarget: '飞行距离',
  heightTarget: '高度挑战',
  airCurrentCount: '气流捕获',
  timeSurvival: '生存时间',
  shadowTracking: '影子追踪',
  stabilityMaintain: '稳定飞行',
  scoreTarget: '得分目标',
  comboAirCurrent: '连击气流',
};

export const DIFFICULTY_COLORS: Record<TaskDifficulty, string> = {
  easy: '#4ecdc4',
  medium: '#ffd700',
  hard: '#ff6b6b',
  extreme: '#ff00ff',
};

export const DIFFICULTY_NAMES: Record<TaskDifficulty, string> = {
  easy: '简单',
  medium: '普通',
  hard: '困难',
  extreme: '极限',
};

export const WEATHER_THEME_NAMES: Record<string, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  windy: '劲风',
  stormy: '暴风',
  night: '夜空',
};

export const AIR_CURRENT_THEME_NAMES: Record<string, string> = {
  calm: '平静',
  moderate: '适中',
  turbulent: '湍急',
  extreme: '狂暴',
};

export const DIFFICULTY_UNLOCK_ORDER: ('easy' | 'normal' | 'hard' | 'extreme')[] = [
  'easy',
  'normal',
  'hard',
  'extreme',
];
