import type { Building, AirCurrent, GameConfig, GameStats, WeatherConfig, Vector3 } from '../game/types';

export type { Building, AirCurrent, GameConfig, GameStats, WeatherConfig, Vector3 };

export type LevelEditorTab = 'buildings' | 'airCurrents' | 'objectives' | 'levels';

export type LevelCategory = 'preset' | 'saved' | 'favorite';

export type ObjectiveType = 'reachPoint' | 'scoreTarget' | 'timeLimit' | 'distanceTarget' | 'heightTarget';

export type WinConditionType = 'allObjectives' | 'anyObjective' | 'scoreThreshold';

export type LoseConditionType = 'timeOut' | 'crash' | 'scoreBelow';

export interface EditorBuilding extends Building {
  isCollidable: boolean;
  size: Vector3;
}

export interface EditorAirCurrent {
  id: string;
  position: Vector3;
  radius: number;
  strength: number;
  direction: Vector3;
  type: 'updraft' | 'downdraft' | 'turbulence';
  isStatic: boolean;
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  name: string;
  description: string;
  position?: Vector3;
  targetValue?: number;
  targetScore?: number;
  targetTime?: number;
  targetDistance?: number;
  targetHeight?: number;
  radius?: number;
  completed: boolean;
}

export interface WinCondition {
  type: WinConditionType;
  targetScore?: number;
}

export interface LoseCondition {
  type: LoseConditionType;
  timeLimit?: number;
  minScore?: number;
  enabled: boolean;
}

export interface GlobalSettings {
  gravity: number;
  windSpeed: number;
  turbulence: number;
}

export interface LevelScene {
  id: string;
  name: string;
  description: string;
  category: LevelCategory;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  buildings: EditorBuilding[];
  airCurrents: EditorAirCurrent[];
  objectives: Objective[];
  winCondition: WinCondition;
  loseCondition: LoseCondition;
  globalSettings: GlobalSettings;
  gameConfig: Partial<GameConfig>;
  weatherConfig: Partial<WeatherConfig>;
  startPosition: Vector3;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  tags: string[];
}

export interface LevelPlayResult {
  id: string;
  levelId: string;
  levelName: string;
  stats: GameStats;
  completedObjectives: string[];
  isWin: boolean;
  isLose: boolean;
  timestamp: number;
  duration: number;
}

export interface LevelEditorState {
  currentTab: LevelEditorTab;
  currentLevel: LevelScene | null;
  levels: LevelScene[];
  selectedBuildingId: string | null;
  selectedAirCurrentId: string | null;
  selectedObjectiveId: string | null;
  playResults: LevelPlayResult[];
}

export interface LevelStats {
  totalPlays: number;
  bestScore: number;
  avgScore: number;
  winRate: number;
  bestTime: number;
}

export const TAB_NAMES: Record<LevelEditorTab, string> = {
  buildings: '建筑编辑',
  airCurrents: '气流配置',
  objectives: '目标条件',
  levels: '关卡管理',
};

export const OBJECTIVE_TYPE_NAMES: Record<ObjectiveType, string> = {
  reachPoint: '到达目标点',
  scoreTarget: '分数目标',
  timeLimit: '时间挑战',
  distanceTarget: '飞行距离',
  heightTarget: '高度目标',
};

export const WIN_CONDITION_NAMES: Record<WinConditionType, string> = {
  allObjectives: '完成所有目标',
  anyObjective: '完成任一目标',
  scoreThreshold: '达到目标分数',
};

export const LOSE_CONDITION_NAMES: Record<LoseConditionType, string> = {
  timeOut: '超时失败',
  crash: '坠毁失败',
  scoreBelow: '分数不足',
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

export const BUILDING_COLORS = [
  0x8b4513, 0xa0522d, 0x696969, 0x708090, 0x4682b4,
  0xd2b48c, 0xb8860b, 0xcd853f, 0x808080, 0x556b2f,
];
