export type TrainingStatus = 'idle' | 'enrolled' | 'lesson_active' | 'exam_active' | 'exam_completed' | 'all_completed';

export type LessonType = 'basic_controls' | 'air_current' | 'risk_demo' | 'exam';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

export type TutorialStepType = 'info' | 'demo' | 'interactive' | 'quiz';

export interface TutorialStep {
  id: string;
  type: TutorialStepType;
  title: string;
  content: string;
  tips?: string[];
  interactiveAction?: string;
  quizOptions?: string[];
  quizAnswerIndex?: number;
}

export interface LessonConfig {
  id: string;
  type: LessonType;
  name: string;
  description: string;
  icon: string;
  chapterId: string;
  order: number;
  unlockLessonId: string | null;
  passScore: number;
  masterScore: number;
  coinReward: number;
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
  tutorials: TutorialStep[];
  examObjectives: ExamObjective[];
}

export interface ExamObjective {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  metric: 'distance' | 'height' | 'airCurrentCount' | 'shadowTracking' | 'flightStability' | 'collisions' | 'time' | 'score';
  weight: number;
  isPenalty?: boolean;
}

export interface ChapterConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  unlockChapterId: string | null;
  lessonIds: string[];
  requiredCompletions: number;
  completionCoinBonus: number;
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  bestScore: number;
  attempts: number;
  objectivesPassed: string[];
  completedAt: number | null;
  masteredAt: number | null;
}

export interface ChapterProgress {
  chapterId: string;
  status: LessonStatus;
  completedLessons: string[];
  masteredLessons: string[];
  completionBonusClaimed: boolean;
}

export interface TrainingEntry {
  id: string;
  playerName: string;
  enrolledAt: number;
  totalCoinsEarned: number;
  totalScore: number;
}

export interface TrainingState {
  status: TrainingStatus;
  entry: TrainingEntry | null;
  currentLessonId: string | null;
  currentTutorialStepIndex: number;
  lessonProgress: Record<string, LessonProgress>;
  chapterProgress: Record<string, ChapterProgress>;
  lastExamResult: ExamResult | null;
  pendingReward: PendingReward | null;
}

export interface ExamResult {
  lessonId: string;
  score: number;
  passed: boolean;
  mastered: boolean;
  objectives: Record<string, { achieved: boolean; value: number; target: number; score: number }>;
  coinsEarned: number;
  completedAt: number;
}

export interface PendingReward {
  type: 'lesson_pass' | 'lesson_master' | 'chapter_complete';
  coins: number;
  title: string;
  description: string;
  icon: string;
  lessonId?: string;
  chapterId?: string;
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

export const LESSON_STATUS_NAMES: Record<LessonStatus, string> = {
  locked: '未解锁',
  available: '可学习',
  in_progress: '学习中',
  completed: '已完成',
  mastered: '已精通',
};

export const LESSON_STATUS_COLORS: Record<LessonStatus, string> = {
  locked: '#6b7280',
  available: '#4ecdc4',
  in_progress: '#3b82f6',
  completed: '#ffd700',
  mastered: '#ff00ff',
};

export const LESSON_TYPE_NAMES: Record<LessonType, string> = {
  basic_controls: '基础操作',
  air_current: '气流识别',
  risk_demo: '风险演示',
  exam: '分段考核',
};
