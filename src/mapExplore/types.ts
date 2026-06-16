export type RegionStatus = 'locked' | 'unlockable' | 'unlocked' | 'completed';
export type BuildingClusterStatus = 'locked' | 'unlockable' | 'unlocked' | 'completed';
export type StoryEventStatus = 'locked' | 'available' | 'active' | 'completed';
export type StageStatus = 'locked' | 'active' | 'completed' | 'claimed';
export type RareAirCurrentStatus = 'undiscovered' | 'discovered' | 'captured';

export type ZoneType = 'residential' | 'commercial' | 'industrial' | 'historical' | 'park' | 'highrise' | 'waterfront' | 'mountain_side' | 'sky_platform';
export type RefreshTrigger = 'flight_complete' | 'region_enter' | 'building_explored' | 'stage_complete' | 'story_complete' | 'manual' | 'time_based';

export type RegionTerrain = 'urban' | 'suburban' | 'mountain' | 'coastal' | 'industrial' | 'ancient' | 'sky_island';
export type RareAirCurrentType = 'golden_updraft' | 'storm_cell' | 'thermal_highway' | 'vortex_ring' | 'cloud_bridge' | 'wind_tunnel';
export type StoryEventType = 'discovery' | 'mystery' | 'challenge' | 'legend' | 'crisis' | 'alliance';
export type StageObjectiveType = 'distance' | 'height' | 'score' | 'aircurrent_count' | 'no_collision' | 'explore_buildings' | 'capture_rare_current' | 'complete_story' | 'zone_exploration' | 'cross_zone_flight';

export interface MapPosition {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ZoneConfig {
  id: string;
  name: string;
  type: ZoneType;
  boundingBox: BoundingBox;
  centerPosition: MapPosition;
  baseBuildingDensity: number;
  minBuildingHeight: number;
  maxBuildingHeight: number;
  buildingStyle: 'modern' | 'traditional' | 'industrial' | 'ancient' | 'futuristic' | 'mixed';
  specialEffect?: string;
  description: string;
}

export interface SpecialAirCurrentZoneConfig {
  zoneId: string;
  baseSpawnRate: number;
  preferredTypes: Array<'updraft' | 'downdraft' | 'turbulence'>;
  minStrength: number;
  maxStrength: number;
  radiusMultiplier: number;
  permanentCurrentPositions?: Array<{ position: MapPosition; height: number; type: 'updraft' | 'downdraft' | 'turbulence'; strength: number; radius: number }>;
}

export interface RegionRefreshConfig {
  enabled: boolean;
  triggers: RefreshTrigger[];
  maxRefreshesPerSession: number;
  buildingDensityVariance: number;
  preserveExploredBuildings: boolean;
  airCurrentRefreshOnZoneEntry: boolean;
}

export interface ZoneExplorationState {
  zoneId: string;
  entered: boolean;
  exploredBuildingsCount: number;
  totalBuildingsInZone: number;
  explorationPercent: number;
  flightsEntered: number;
  firstEnteredAt: number | null;
  lastVisitedAt: number | null;
}

export interface Region {
  id: string;
  name: string;
  description: string;
  icon: string;
  terrain: RegionTerrain;
  position: MapPosition;
  primaryColor: string;
  secondaryColor: string;
  unlockCost: number;
  unlockCondition?: string;
  buildingClusterIds: string[];
  rareAirCurrentIds: string[];
  storyEventIds: string[];
  stageIds: string[];
  worldSize: number;
  gravity: number;
  airCurrentSpawnRate: number;
  minAirCurrentStrength: number;
  maxAirCurrentStrength: number;
  buildingDensity: number;
  turbulenceLevel: number;
  cloudCoverage: number;
  zones: ZoneConfig[];
  zoneAirCurrentConfigs: SpecialAirCurrentZoneConfig[];
  refreshConfig: RegionRefreshConfig;
  flightObjectiveModifiers?: {
    distanceMultiplier?: number;
    heightMultiplier?: number;
    scoreMultiplier?: number;
    airCurrentBonus?: number;
  };
}

export interface BuildingCluster {
  id: string;
  regionId: string;
  name: string;
  description: string;
  icon: string;
  position: MapPosition;
  unlockCost: number;
  buildingCount: number;
  minHeight: number;
  maxHeight: number;
  specialEffect?: string;
  explorationCondition: {
    type: StageObjectiveType;
    target: number;
    description: string;
  };
  rewardCoins: number;
  rewardScore?: number;
}

export interface RareAirCurrent {
  id: string;
  regionId: string;
  name: string;
  description: string;
  icon: string;
  type: RareAirCurrentType;
  position: MapPosition;
  strength: number;
  duration: number;
  discoveryCondition: string;
  captureCondition: {
    type: StageObjectiveType;
    target: number;
    description: string;
  };
  captureScore: number;
  rewardCoins: number;
}

export interface StoryEvent {
  id: string;
  regionId: string;
  name: string;
  description: string;
  icon: string;
  type: StoryEventType;
  position: MapPosition;
  dialogue: StoryDialogue[];
  triggerCondition: string;
  rewardCoins: number;
  rewardScore: number;
  unlocksBuildingId?: string;
  unlocksRareCurrentId?: string;
}

export interface StoryDialogue {
  speaker: string;
  text: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'surprised' | 'worried';
}

export interface StageObjective {
  type: StageObjectiveType;
  target: number;
  description: string;
}

export interface Stage {
  id: string;
  regionId: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  objectives: StageObjective[];
  rewardCoins: number;
  rewardScore: number;
  bonusCondition?: string;
  bonusRewardCoins?: number;
}

export interface RegionProgress {
  status: RegionStatus;
  unlockedAt: number | null;
  buildingClusterStatuses: Record<string, BuildingClusterStatus>;
  rareAirCurrentStatuses: Record<string, RareAirCurrentStatus>;
  storyEventStatuses: Record<string, StoryEventStatus>;
  stageStatuses: Record<string, StageStatus>;
  stageProgress: Record<string, Record<string, number>>;
  explorationPercent: number;
  totalFlightsInRegion: number;
  totalScoreInRegion: number;
  totalDistanceInRegion: number;
  bestScoreInRegion: number;
  zoneExplorationStates: Record<string, ZoneExplorationState>;
  currentBuildingSeed: number;
  lastRefreshTime: number | null;
  refreshCountThisSession: number;
  crossZoneFlightsCompleted: number;
  activeZoneId: string | null;
}

export interface RegionRuntimeState {
  regionId: string;
  currentSeed: number;
  lastRefreshTrigger: RefreshTrigger | null;
  enteredZones: Set<string>;
  buildingsGenerated: Map<string, Building[]>;
  permanentAirCurrentsPlaced: boolean;
}

export interface Building {
  id: string;
  zoneId?: string;
  position: { x: number; y: number; z: number };
  width: number;
  height: number;
  depth: number;
  color: number;
  explored?: boolean;
  clusterId?: string;
}

export interface StageSettlementResult {
  stageId: string;
  stageName: string;
  completed: boolean;
  objectives: Array<{
    description: string;
    current: number;
    target: number;
    achieved: boolean;
  }>;
  baseRewardCoins: number;
  bonusAchieved: boolean;
  bonusRewardCoins: number;
  totalRewardCoins: number;
  scoreReward: number;
}

export interface MapExploreState {
  currentRegionId: string | null;
  regionProgress: Record<string, RegionProgress>;
  totalExplorationPercent: number;
  totalRegionsUnlocked: number;
  totalBuildingClustersUnlocked: number;
  totalRareCurrentsCaptured: number;
  totalStoryEventsCompleted: number;
  totalStagesCompleted: number;
  activeStoryEventId: string | null;
  activeStoryDialogueIndex: number;
  lastSettlementResults: StageSettlementResult[];
  totalZonesExplored: number;
  totalCrossZoneFlights: number;
  lastRegionRefreshTriggers: Record<string, RefreshTrigger>;
}

export interface MapExploreFlightResult {
  regionId: string;
  newlyExploredBuildingClusters: Array<{
    id: string;
    name: string;
    rewardCoins: number;
    rewardScore: number;
  }>;
  newlyDiscoveredAirCurrents: Array<{
    id: string;
    name: string;
  }>;
  newlyCapturedAirCurrents: Array<{
    id: string;
    name: string;
    rewardCoins: number;
    captureScore: number;
  }>;
  newlyCompletedStages: Array<{
    id: string;
    name: string;
    rewardCoins: number;
    rewardScore: number;
  }>;
  newlyCompletedStoryEvents: Array<{
    id: string;
    name: string;
  }>;
  newlyExploredZones: Array<{
    zoneId: string;
    zoneName: string;
    explorationPercent: number;
    rewardCoins: number;
  }>;
  crossZoneFlightsThisFlight: number;
  regionRefreshed: boolean;
  refreshTrigger: RefreshTrigger | null;
  totalRewardCoins: number;
  totalRewardScore: number;
}

export const REGION_TERRAIN_NAMES: Record<RegionTerrain, string> = {
  urban: '都市区',
  suburban: '近郊区',
  mountain: '山区',
  coastal: '海岸线',
  industrial: '工业区',
  ancient: '古迹区',
  sky_island: '天空岛屿',
};

export const RARE_AIR_CURRENT_TYPE_NAMES: Record<RareAirCurrentType, string> = {
  golden_updraft: '金色上升气流',
  storm_cell: '风暴核心',
  thermal_highway: '热力气流通道',
  vortex_ring: '漩涡环',
  cloud_bridge: '云桥',
  wind_tunnel: '风洞',
};

export const RARE_AIR_CURRENT_TYPE_ICONS: Record<RareAirCurrentType, string> = {
  golden_updraft: '✨',
  storm_cell: '⛈️',
  thermal_highway: '🌡️',
  vortex_ring: '🌀',
  cloud_bridge: '🌈',
  wind_tunnel: '💨',
};

export const STORY_EVENT_TYPE_NAMES: Record<StoryEventType, string> = {
  discovery: '发现事件',
  mystery: '神秘事件',
  challenge: '挑战事件',
  legend: '传说事件',
  crisis: '危机事件',
  alliance: '联盟事件',
};

export const STAGE_OBJECTIVE_TYPE_NAMES: Record<StageObjectiveType, string> = {
  distance: '飞行距离',
  height: '飞行高度',
  score: '飞行得分',
  aircurrent_count: '气流捕获数',
  no_collision: '零碰撞飞行',
  explore_buildings: '探索建筑群',
  capture_rare_current: '捕获稀有气流',
  complete_story: '完成剧情事件',
  zone_exploration: '探索子区域',
  cross_zone_flight: '跨区域飞行',
};

export const REGION_STATUS_NAMES: Record<RegionStatus, string> = {
  locked: '未解锁',
  unlockable: '可解锁',
  unlocked: '已解锁',
  completed: '已完成',
};

export const BUILDING_CLUSTER_STATUS_NAMES: Record<BuildingClusterStatus, string> = {
  locked: '未解锁',
  unlockable: '可解锁',
  unlocked: '已解锁',
  completed: '已探索',
};

export const STAGE_STATUS_NAMES: Record<StageStatus, string> = {
  locked: '未解锁',
  active: '进行中',
  completed: '已完成',
  claimed: '已领取',
};

export const STORY_EVENT_STATUS_NAMES: Record<StoryEventStatus, string> = {
  locked: '未触发',
  available: '可触发',
  active: '进行中',
  completed: '已完成',
};

export const ZONE_TYPE_NAMES: Record<ZoneType, string> = {
  residential: '住宅区',
  commercial: '商业区',
  industrial: '工业区',
  historical: '历史区',
  park: '公园绿地',
  highrise: '摩天区',
  waterfront: '滨水区',
  mountain_side: '山地区',
  sky_platform: '天空平台',
};

export const REFRESH_TRIGGER_NAMES: Record<RefreshTrigger, string> = {
  flight_complete: '飞行完成时',
  region_enter: '进入区域时',
  building_explored: '探索建筑群时',
  stage_complete: '完成阶段时',
  story_complete: '完成剧情时',
  manual: '手动刷新',
  time_based: '定时刷新',
};

export const BUILDING_STYLE_NAMES: Record<'modern' | 'traditional' | 'industrial' | 'ancient' | 'futuristic' | 'mixed', string> = {
  modern: '现代风格',
  traditional: '传统风格',
  industrial: '工业风格',
  ancient: '古典风格',
  futuristic: '未来风格',
  mixed: '混合风格',
};
