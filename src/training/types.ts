export type LessonType = 'basic' | 'airflow' | 'risk' | 'exam' | 'reward';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type TrainingPhase =
  | 'intro'
  | 'basic_controls'
  | 'airflow_recognition'
  | 'risk_demo'
  | 'segment_exam'
  | 'reward';

export interface LessonStep {
  id: string;
  title: string;
  description: string;
  tips?: string[];
  type: 'tutorial' | 'interactive' | 'quiz' | 'challenge';
  duration?: number;
  targetScore?: number;
}

export interface LessonConfig {
  id: string;
  phase: TrainingPhase;
  type: LessonType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  steps: LessonStep[];
  coinReward: number;
  unlockNextId: string | null;
  requiredScore?: number;
  worldSize?: number;
  gravity?: number;
  airCurrentSpawnRate?: number;
  minAirCurrentStrength?: number;
  maxAirCurrentStrength?: number;
  minBuildingHeight?: number;
  maxBuildingHeight?: number;
  buildingDensity?: number;
  turbulenceLevel?: number;
  cloudCoverage?: number;
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  completedSteps: string[];
  bestScore: number;
  attempts: number;
  completedAt: number | null;
}

export interface TrainingState {
  currentLessonId: string | null;
  currentStepIndex: number;
  phase: TrainingPhase;
  lessons: Record<string, LessonProgress>;
  totalCoinsEarned: number;
  lessonsCompleted: number;
  isTraining: boolean;
}

export interface TrainingResult {
  lessonId: string;
  score: number;
  passed: boolean;
  stars: number;
  coinReward: number;
  completedAt: number;
}

export const LESSON_STATUS_NAMES: Record<LessonStatus, string> = {
  locked: '未解锁',
  available: '可学习',
  in_progress: '学习中',
  completed: '已完成',
};

export const PHASE_NAMES: Record<TrainingPhase, string> = {
  intro: '训练营概述',
  basic_controls: '基础操作',
  airflow_recognition: '气流识别',
  risk_demo: '风险演示',
  segment_exam: '分段考核',
  reward: '奖励发放',
};

export const PHASE_ICONS: Record<TrainingPhase, string> = {
  intro: '🎓',
  basic_controls: '🎮',
  airflow_recognition: '🌬️',
  risk_demo: '⚠️',
  segment_exam: '📝',
  reward: '🎁',
};

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
