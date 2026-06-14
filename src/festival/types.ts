export type FestivalStatus = 'upcoming' | 'active' | 'ended';

export type TaskType = 'daily' | 'cumulative' | 'special';
export type TaskStatus = 'locked' | 'in_progress' | 'completed' | 'claimed';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'festival';
export type ItemCategory = 'currency' | 'buff' | 'decoration' | 'material' | 'exclusive';

export type RewardType = 'coin' | 'item' | 'score_bonus' | 'badge';

export interface FestivalConfig {
  id: string;
  name: string;
  theme: string;
  description: string;
  icon: string;
  banner: string;
  primaryColor: string;
  secondaryColor: string;
  startDate: number;
  endDate: number;
  currencyId: string;
}

export interface FestivalTask {
  id: string;
  festivalId: string;
  type: TaskType;
  title: string;
  description: string;
  target: number;
  progressKey: string;
  rewards: TaskReward[];
  dailyReset?: boolean;
  unlockCondition?: string;
  order: number;
}

export interface TaskReward {
  type: RewardType;
  id?: string;
  amount: number;
  name: string;
  icon?: string;
}

export interface FestivalScene {
  id: string;
  festivalId: string;
  name: string;
  description: string;
  icon: string;
  weatherTheme: string;
  backgroundGradient: [string, string];
  particleEffect: string;
  scoreMultiplier: number;
  coinMultiplier: number;
  specialEvent: string;
  worldSize: number;
  gravity: number;
  airCurrentSpawnRate: number;
  minAirCurrentStrength: number;
  maxAirCurrentStrength: number;
  buildingDensity: number;
  turbulenceLevel: number;
  cloudCoverage: number;
  unlocked: boolean;
  unlockCost?: number;
}

export interface FestivalItem {
  id: string;
  festivalId: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  visualEffect?: string;
  buffEffect?: ItemBuffEffect;
  stackable: boolean;
  tradable: boolean;
  expiresAt?: number;
}

export interface ItemBuffEffect {
  type: 'score' | 'distance' | 'height' | 'stability' | 'wind_resist' | 'combo';
  value: number;
  duration?: number;
}

export interface PlayerInventory {
  itemId: string;
  quantity: number;
  firstAcquiredAt: number;
  lastUsedAt?: number;
}

export interface FestivalLeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  festivalCurrency: number;
  completedTasks: number;
  badgeCount: number;
  isPlayer: boolean;
}

export interface ExchangeItem {
  id: string;
  festivalId: string;
  reward: TaskReward;
  cost: number;
  stock?: number;
  purchased?: number;
  dailyLimit?: number;
  purchasedToday?: number;
  unlockDate?: number;
  limitPerPlayer?: number;
  purchasedTotal?: number;
}

export interface FestivalProgress {
  taskProgress: Record<string, number>;
  taskStatuses: Record<string, TaskStatus>;
  festivalCurrency: number;
  totalScore: number;
  unlockedScenes: string[];
  inventory: PlayerInventory[];
  claimedExchanges: string[];
  badges: string[];
  lastDailyReset: number;
  highScores: Record<string, number>;
}

export interface FestivalState {
  status: FestivalStatus;
  currentFestivalId: string | null;
  currentSceneId: string | null;
  activeBuffs: ActiveBuff[];
  progress: FestivalProgress;
  leaderboard: FestivalLeaderboardEntry[];
}

export interface ActiveBuff {
  itemId: string;
  effect: ItemBuffEffect;
  activatedAt: number;
  expiresAt: number;
}

export interface GameConfigOverride {
  worldSize?: number;
  gravity?: number;
  airCurrentSpawnRate?: number;
  minAirCurrentStrength?: number;
  maxAirCurrentStrength?: number;
  buildingDensity?: number;
  turbulenceLevel?: number;
  cloudCoverage?: number;
  scoreMultiplier?: number;
  coinMultiplier?: number;
}

export const FESTIVAL_STATUS_NAMES: Record<FestivalStatus, string> = {
  upcoming: '即将开始',
  active: '进行中',
  ended: '已结束',
};

export const TASK_TYPE_NAMES: Record<TaskType, string> = {
  daily: '每日任务',
  cumulative: '累计任务',
  special: '特殊任务',
};

export const TASK_STATUS_NAMES: Record<TaskStatus, string> = {
  locked: '未解锁',
  in_progress: '进行中',
  completed: '已完成',
  claimed: '已领取',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  locked: '#6b7280',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  claimed: '#9ca3af',
};

export const ITEM_RARITY_NAMES: Record<ItemRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
  festival: '节日限定',
};

export const ITEM_RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  festival: '#ec4899',
};

export const ITEM_CATEGORY_NAMES: Record<ItemCategory, string> = {
  currency: '货币',
  buff: '增益道具',
  decoration: '装饰',
  material: '材料',
  exclusive: '专属道具',
};

export const REWARD_TYPE_NAMES: Record<RewardType, string> = {
  coin: '金币',
  item: '道具',
  score_bonus: '得分加成',
  badge: '徽章',
};

export const DEFAULT_FESTIVAL_PROGRESS: FestivalProgress = {
  taskProgress: {},
  taskStatuses: {},
  festivalCurrency: 0,
  totalScore: 0,
  unlockedScenes: [],
  inventory: [],
  claimedExchanges: [],
  badges: [],
  lastDailyReset: 0,
  highScores: {},
};
