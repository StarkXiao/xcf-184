import type { Region, BuildingCluster, RareAirCurrent, StoryEvent, Stage, MapExploreState, RegionProgress, BuildingClusterStatus, RareAirCurrentStatus, StoryEventStatus, StageStatus, ZoneConfig, SpecialAirCurrentZoneConfig, RegionRefreshConfig, ZoneExplorationState, BoundingBox } from './types';

function generateDefaultZones(regionId: string, worldSize: number, terrain: string): ZoneConfig[] {
  const half = worldSize / 2;
  const zones: ZoneConfig[] = [];
  const zoneSize = worldSize / 3;

  const zoneConfigsByTerrain: Record<string, Array<{ id: string; name: string; type: ZoneConfig['type']; style: ZoneConfig['buildingStyle']; density: number; minH: number; maxH: number; desc: string; effect?: string }>> = {
    urban: [
      { id: `${regionId}_zone_residential`, name: '居民区', type: 'residential', style: 'traditional', density: 0.45, minH: 10, maxH: 25, desc: '传统居民区，低矮建筑适合低空练习' },
      { id: `${regionId}_zone_historical`, name: '历史中心', type: 'historical', style: 'traditional', density: 0.5, minH: 15, maxH: 35, desc: '历史建筑集中区，屋顶有特殊上升气流', effect: 'updraft_boost' },
      { id: `${regionId}_zone_commercial`, name: '商业区', type: 'commercial', style: 'mixed', density: 0.4, minH: 20, maxH: 50, desc: '商业店铺区域，建筑高度各异' },
      { id: `${regionId}_zone_alley`, name: '巷道区', type: 'residential', style: 'traditional', density: 0.55, minH: 8, maxH: 20, desc: '密集窄巷，考验操控能力', effect: 'narrow_passage' },
    ],
    coastal: [
      { id: `${regionId}_zone_waterfront`, name: '滨水区', type: 'waterfront', style: 'modern', density: 0.35, minH: 20, maxH: 60, desc: '沿河区域，水面制造独特气流', effect: 'river_wind' },
      { id: `${regionId}_zone_highrise`, name: '摩天区', type: 'highrise', style: 'modern', density: 0.3, minH: 50, maxH: 90, desc: '高楼林立，塔间形成风洞', effect: 'wind_tunnel' },
      { id: `${regionId}_zone_dock`, name: '码头区', type: 'waterfront', style: 'industrial', density: 0.4, minH: 12, maxH: 30, desc: '码头仓库，低矮建筑区' },
      { id: `${regionId}_zone_bridge`, name: '桥区', type: 'commercial', style: 'mixed', density: 0.35, minH: 20, maxH: 40, desc: '桥梁附近，桥下有上升气流', effect: 'bridge_updraft' },
    ],
    mountain: [
      { id: `${regionId}_zone_valley`, name: '山谷', type: 'mountain_side', style: 'traditional', density: 0.2, minH: 15, maxH: 35, desc: '山谷底部，穿堂风频繁', effect: 'valley_wind' },
      { id: `${regionId}_zone_slope`, name: '山腰', type: 'mountain_side', style: 'traditional', density: 0.25, minH: 20, maxH: 45, desc: '山腰村落，热气流活跃' },
      { id: `${regionId}_zone_peak`, name: '山顶', type: 'mountain_side', style: 'ancient', density: 0.15, minH: 30, maxH: 60, desc: '山巅区域，可遇最强气流', effect: 'peak_turbulence' },
      { id: `${regionId}_zone_temple`, name: '古寺区', type: 'historical', style: 'ancient', density: 0.2, minH: 25, maxH: 55, desc: '古寺区域，热气流聚焦', effect: 'thermal_focus' },
    ],
    industrial: [
      { id: `${regionId}_zone_factory`, name: '厂房区', type: 'industrial', style: 'industrial', density: 0.5, minH: 18, maxH: 38, desc: '工厂屋顶排放热气形成稳定上升流', effect: 'heat_updraft' },
      { id: `${regionId}_zone_chimney`, name: '烟囱区', type: 'industrial', style: 'industrial', density: 0.55, minH: 30, maxH: 60, desc: '密集烟囱，多股独立上升气流', effect: 'multi_updraft' },
      { id: `${regionId}_zone_bridge_steel`, name: '钢桥区', type: 'industrial', style: 'industrial', density: 0.4, minH: 25, maxH: 50, desc: '钢铁桥梁间暗藏风洞', effect: 'bridge_tunnel' },
      { id: `${regionId}_zone_storage`, name: '仓储区', type: 'industrial', style: 'industrial', density: 0.45, minH: 12, maxH: 28, desc: '仓库区域，建筑排列整齐' },
    ],
    ancient: [
      { id: `${regionId}_zone_cathedral`, name: '大殿区', type: 'historical', style: 'ancient', density: 0.35, minH: 35, maxH: 60, desc: '古代殿堂，内部有奇异气流', effect: 'ancient_resonance' },
      { id: `${regionId}_zone_pillars`, name: '石柱区', type: 'historical', style: 'ancient', density: 0.45, minH: 18, maxH: 42, desc: '密集石柱，窄间距考验精准操控', effect: 'pillar_slalom' },
      { id: `${regionId}_zone_chamber`, name: '地下厅', type: 'historical', style: 'ancient', density: 0.25, minH: 45, maxH: 70, desc: '巨大空腔，气流汇聚旋转', effect: 'vortex_chamber' },
      { id: `${regionId}_zone_ruins`, name: '外遗迹', type: 'park', style: 'ancient', density: 0.3, minH: 15, maxH: 35, desc: '外围遗迹，气流温和' },
    ],
    sky_island: [
      { id: `${regionId}_zone_palace`, name: '云中宫', type: 'sky_platform', style: 'futuristic', density: 0.3, minH: 40, maxH: 75, desc: '漂浮宫殿，云层产生额外升力', effect: 'cloud_lift' },
      { id: `${regionId}_zone_dock`, name: '天空码头', type: 'sky_platform', style: 'futuristic', density: 0.35, minH: 25, maxH: 50, desc: '岛间连接通道，强风贯穿', effect: 'crosswind' },
      { id: `${regionId}_zone_shrine`, name: '风神殿', type: 'historical', style: 'ancient', density: 0.2, minH: 50, maxH: 85, desc: '掌控气流起源的圣地', effect: 'wind_origin' },
      { id: `${regionId}_zone_bridge_sky`, name: '云桥区', type: 'waterfront', style: 'futuristic', density: 0.25, minH: 35, maxH: 65, desc: '连接浮岛的云桥区域', effect: 'cloud_bridge' },
    ],
  };

  const configs = zoneConfigsByTerrain[terrain] || zoneConfigsByTerrain.urban;
  const positions = [
    { minX: -half, maxX: -half + zoneSize, minZ: -half, maxZ: -half + zoneSize },
    { minX: -half + zoneSize, maxX: half - zoneSize, minZ: -half, maxZ: -half + zoneSize },
    { minX: half - zoneSize, maxX: half, minZ: -half, maxZ: -half + zoneSize },
    { minX: -half, maxX: -half + zoneSize, minZ: half - zoneSize, maxZ: half },
  ];

  configs.forEach((cfg, idx) => {
    const pos = positions[idx] || positions[0];
    const bbox: BoundingBox = pos;
    zones.push({
      id: cfg.id,
      name: cfg.name,
      type: cfg.type,
      boundingBox: bbox,
      centerPosition: {
        x: (bbox.minX + bbox.maxX) / 2,
        y: (bbox.minZ + bbox.maxZ) / 2,
      },
      baseBuildingDensity: cfg.density,
      minBuildingHeight: cfg.minH,
      maxBuildingHeight: cfg.maxH,
      buildingStyle: cfg.style,
      specialEffect: cfg.effect,
      description: cfg.desc,
    });
  });

  return zones;
}

function generateZoneAirCurrentConfigs(regionId: string, zones: ZoneConfig[], terrain: string): SpecialAirCurrentZoneConfig[] {
  return zones.map((zone) => {
    const baseConfig: SpecialAirCurrentZoneConfig = {
      zoneId: zone.id,
      baseSpawnRate: 0.02,
      preferredTypes: ['updraft', 'turbulence'],
      minStrength: 0.06,
      maxStrength: 0.18,
      radiusMultiplier: 1.0,
    };

    if (zone.specialEffect?.includes('updraft') || zone.type === 'mountain_side' || zone.type === 'industrial') {
      baseConfig.preferredTypes = ['updraft', 'updraft', 'turbulence'];
      baseConfig.minStrength = 0.08;
      baseConfig.maxStrength = 0.25;
      baseConfig.baseSpawnRate = 0.028;
      baseConfig.radiusMultiplier = 1.2;
    }

    if (zone.specialEffect?.includes('wind_tunnel') || zone.specialEffect?.includes('tunnel')) {
      baseConfig.preferredTypes = ['updraft', 'turbulence', 'turbulence'];
      baseConfig.maxStrength = 0.28;
      baseConfig.radiusMultiplier = 1.15;
    }

    if (zone.type === 'park' || zone.type === 'waterfront') {
      baseConfig.preferredTypes = ['updraft', 'downdraft'];
      baseConfig.minStrength = 0.05;
      baseConfig.maxStrength = 0.16;
      baseConfig.baseSpawnRate = 0.018;
    }

    if (zone.specialEffect === 'vortex_chamber' || zone.specialEffect === 'peak_turbulence') {
      baseConfig.preferredTypes = ['turbulence', 'turbulence', 'updraft'];
      baseConfig.minStrength = 0.1;
      baseConfig.maxStrength = 0.3;
      baseConfig.baseSpawnRate = 0.032;
      baseConfig.radiusMultiplier = 1.3;
    }

    if (terrain === 'sky_island') {
      baseConfig.minStrength *= 1.2;
      baseConfig.maxStrength *= 1.2;
      baseConfig.baseSpawnRate *= 1.2;
    }

    return baseConfig;
  });
}

function generateRefreshConfig(terrain: string): RegionRefreshConfig {
  const baseTriggers: RegionRefreshConfig['triggers'] = ['flight_complete', 'building_explored', 'stage_complete'];

  const configByTerrain: Record<string, Partial<RegionRefreshConfig>> = {
    urban: { maxRefreshesPerSession: 3, buildingDensityVariance: 0.1 },
    coastal: { maxRefreshesPerSession: 4, buildingDensityVariance: 0.15, triggers: [...baseTriggers, 'story_complete'] },
    mountain: { maxRefreshesPerSession: 5, buildingDensityVariance: 0.2, triggers: [...baseTriggers, 'region_enter'] },
    industrial: { maxRefreshesPerSession: 4, buildingDensityVariance: 0.18, triggers: [...baseTriggers, 'story_complete'] },
    ancient: { maxRefreshesPerSession: 2, buildingDensityVariance: 0.12, preserveExploredBuildings: true },
    sky_island: { maxRefreshesPerSession: 6, buildingDensityVariance: 0.25, triggers: [...baseTriggers, 'region_enter', 'story_complete'], airCurrentRefreshOnZoneEntry: true },
  };

  const cfg = configByTerrain[terrain] || {};
  return {
    enabled: true,
    triggers: cfg.triggers || baseTriggers,
    maxRefreshesPerSession: cfg.maxRefreshesPerSession ?? 3,
    buildingDensityVariance: cfg.buildingDensityVariance ?? 0.15,
    preserveExploredBuildings: cfg.preserveExploredBuildings ?? false,
    airCurrentRefreshOnZoneEntry: cfg.airCurrentRefreshOnZoneEntry ?? false,
  };
}

function generateFlightObjectiveModifiers(terrain: string): Region['flightObjectiveModifiers'] {
  const modifiers: Record<string, Region['flightObjectiveModifiers']> = {
    urban: { distanceMultiplier: 1.0, scoreMultiplier: 1.0 },
    coastal: { distanceMultiplier: 1.1, airCurrentBonus: 5 },
    mountain: { heightMultiplier: 1.2, airCurrentBonus: 10 },
    industrial: { scoreMultiplier: 1.1, airCurrentBonus: 8 },
    ancient: { scoreMultiplier: 1.15, distanceMultiplier: 1.05 },
    sky_island: { heightMultiplier: 1.3, scoreMultiplier: 1.2, airCurrentBonus: 15 },
  };
  return modifiers[terrain];
}

function createZoneExplorationStates(zones: ZoneConfig[]): Record<string, ZoneExplorationState> {
  const states: Record<string, ZoneExplorationState> = {};
  zones.forEach((zone) => {
    const estimatedBuildings = Math.floor(
      ((zone.boundingBox.maxX - zone.boundingBox.minX) / 12) *
      ((zone.boundingBox.maxZ - zone.boundingBox.minZ) / 12) *
      zone.baseBuildingDensity
    );
    states[zone.id] = {
      zoneId: zone.id,
      entered: false,
      exploredBuildingsCount: 0,
      totalBuildingsInZone: Math.max(3, estimatedBuildings),
      explorationPercent: 0,
      flightsEntered: 0,
      firstEnteredAt: null,
      lastVisitedAt: null,
    };
  });
  return states;
}

const OLD_TOWN_ZONES = generateDefaultZones('region_old_town', 400, 'urban');
const RIVERSIDE_ZONES = generateDefaultZones('region_riverside', 500, 'coastal');
const MOUNTAIN_ZONES = generateDefaultZones('region_mountain_peak', 600, 'mountain');
const INDUSTRIAL_ZONES = generateDefaultZones('region_industrial', 500, 'industrial');
const ANCIENT_ZONES = generateDefaultZones('region_ancient_ruins', 550, 'ancient');
const SKY_ISLAND_ZONES = generateDefaultZones('region_sky_island', 700, 'sky_island');

export const REGIONS: Region[] = [
  {
    id: 'region_old_town',
    name: '老城街区',
    description: '古老的风筝文化发源地，建筑低矮密集，气流稳定温和。适合新手探索的区域。',
    icon: '🏘️',
    terrain: 'urban',
    position: { x: 150, y: 280 },
    primaryColor: '#8b7355',
    secondaryColor: '#d4a574',
    unlockCost: 0,
    buildingClusterIds: ['bc_old_market', 'bc_temple_roof', 'bc_alley_network'],
    rareAirCurrentIds: ['rac_old_town_thermal'],
    storyEventIds: ['se_kite_origin', 'se_old_craftsman'],
    stageIds: ['stage_old_town_1', 'stage_old_town_2', 'stage_old_town_3'],
    worldSize: 400,
    gravity: 0.012,
    airCurrentSpawnRate: 0.025,
    minAirCurrentStrength: 0.06,
    maxAirCurrentStrength: 0.15,
    buildingDensity: 0.35,
    turbulenceLevel: 0.15,
    cloudCoverage: 0.3,
    zones: OLD_TOWN_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_old_town', OLD_TOWN_ZONES, 'urban'),
    refreshConfig: generateRefreshConfig('urban'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('urban'),
  },
  {
    id: 'region_riverside',
    name: '滨河走廊',
    description: '沿河而建的现代商业区，高楼林立间河流制造了独特的气流走廊。',
    icon: '🌊',
    terrain: 'coastal',
    position: { x: 380, y: 220 },
    primaryColor: '#0ea5e9',
    secondaryColor: '#7dd3fc',
    unlockCost: 200,
    unlockCondition: 'region_old_town',
    buildingClusterIds: ['bc_river_towers', 'bc_bridge_arch', 'bc_dock_district'],
    rareAirCurrentIds: ['rac_river_tunnel', 'rac_water_spray'],
    storyEventIds: ['se_river_spirit', 'se_bridge_challenge'],
    stageIds: ['stage_riverside_1', 'stage_riverside_2', 'stage_riverside_3'],
    worldSize: 500,
    gravity: 0.014,
    airCurrentSpawnRate: 0.022,
    minAirCurrentStrength: 0.08,
    maxAirCurrentStrength: 0.18,
    buildingDensity: 0.4,
    turbulenceLevel: 0.2,
    cloudCoverage: 0.4,
    zones: RIVERSIDE_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_riverside', RIVERSIDE_ZONES, 'coastal'),
    refreshConfig: generateRefreshConfig('coastal'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('coastal'),
  },
  {
    id: 'region_mountain_peak',
    name: '翠峰山脉',
    description: '高耸入云的山脉区域，强烈的上升热气流和危险的下降风并存。',
    icon: '🏔️',
    terrain: 'mountain',
    position: { x: 280, y: 80 },
    primaryColor: '#059669',
    secondaryColor: '#6ee7b7',
    unlockCost: 500,
    unlockCondition: 'region_riverside',
    buildingClusterIds: ['bc_mountain_temple', 'bc_cliff_village', 'bc_peak_station'],
    rareAirCurrentIds: ['rac_mountain_thermal', 'rac_peak_vortex', 'rac_valley_wind'],
    storyEventIds: ['se_mountain_hermit', 'se_sky_gate'],
    stageIds: ['stage_mountain_1', 'stage_mountain_2', 'stage_mountain_3'],
    worldSize: 600,
    gravity: 0.018,
    airCurrentSpawnRate: 0.03,
    minAirCurrentStrength: 0.1,
    maxAirCurrentStrength: 0.25,
    buildingDensity: 0.2,
    turbulenceLevel: 0.35,
    cloudCoverage: 0.6,
    zones: MOUNTAIN_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_mountain_peak', MOUNTAIN_ZONES, 'mountain'),
    refreshConfig: generateRefreshConfig('mountain'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('mountain'),
  },
  {
    id: 'region_industrial',
    name: '钢铁工坊',
    description: '烟囱与管道交错的工业区，热废气形成了强劲而不可预测的热气流。',
    icon: '🏭',
    terrain: 'industrial',
    position: { x: 560, y: 350 },
    primaryColor: '#78716c',
    secondaryColor: '#a8a29e',
    unlockCost: 400,
    unlockCondition: 'region_riverside',
    buildingClusterIds: ['bc_factory_row', 'bc_chimney_alley', 'bc_steel_bridge'],
    rareAirCurrentIds: ['rac_heat_exhaust', 'rac_steam_burst'],
    storyEventIds: ['se_lost_blueprint', 'se_smoke_signal'],
    stageIds: ['stage_industrial_1', 'stage_industrial_2', 'stage_industrial_3'],
    worldSize: 500,
    gravity: 0.016,
    airCurrentSpawnRate: 0.028,
    minAirCurrentStrength: 0.1,
    maxAirCurrentStrength: 0.22,
    buildingDensity: 0.45,
    turbulenceLevel: 0.3,
    cloudCoverage: 0.5,
    zones: INDUSTRIAL_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_industrial', INDUSTRIAL_ZONES, 'industrial'),
    refreshConfig: generateRefreshConfig('industrial'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('industrial'),
  },
  {
    id: 'region_ancient_ruins',
    name: '古迹遗迹',
    description: '被时间遗忘的古老建筑群，据说隐藏着传说级风筝的秘密。',
    icon: '🏛️',
    terrain: 'ancient',
    position: { x: 100, y: 140 },
    primaryColor: '#92400e',
    secondaryColor: '#fbbf24',
    unlockCost: 800,
    unlockCondition: 'region_mountain_peak',
    buildingClusterIds: ['bc_ruins_cathedral', 'bc_stone_pillars', 'bc_underground_hall'],
    rareAirCurrentIds: ['rac_ancient_spirit_wind', 'rac_pillar_updraft', 'rac_ruins_storm'],
    storyEventIds: ['se_ancient_legend', 'se_spirit_pact', 'se_forbidden_chamber'],
    stageIds: ['stage_ancient_1', 'stage_ancient_2', 'stage_ancient_3'],
    worldSize: 550,
    gravity: 0.013,
    airCurrentSpawnRate: 0.02,
    minAirCurrentStrength: 0.08,
    maxAirCurrentStrength: 0.2,
    buildingDensity: 0.3,
    turbulenceLevel: 0.25,
    cloudCoverage: 0.35,
    zones: ANCIENT_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_ancient_ruins', ANCIENT_ZONES, 'ancient'),
    refreshConfig: generateRefreshConfig('ancient'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('ancient'),
  },
  {
    id: 'region_sky_island',
    name: '浮空群岛',
    description: '传说中漂浮在云层之上的神秘群岛，只有最顶尖的风筝飞行者才能抵达。',
    icon: '🏝️',
    terrain: 'sky_island',
    position: { x: 420, y: 60 },
    primaryColor: '#7c3aed',
    secondaryColor: '#c4b5fd',
    unlockCost: 1500,
    unlockCondition: 'region_ancient_ruins',
    buildingClusterIds: ['bc_cloud_palace', 'bc_sky_dock', 'bc_wind_shrine'],
    rareAirCurrentIds: ['rac_sky_bridge', 'rac_zenith_updraft', 'rac_astral_vortex', 'rac_cloud_highway'],
    storyEventIds: ['se_sky_king', 'se_wind_ceremony', 'se_final_trial'],
    stageIds: ['stage_sky_1', 'stage_sky_2', 'stage_sky_3', 'stage_sky_4'],
    worldSize: 700,
    gravity: 0.008,
    airCurrentSpawnRate: 0.035,
    minAirCurrentStrength: 0.12,
    maxAirCurrentStrength: 0.3,
    buildingDensity: 0.25,
    turbulenceLevel: 0.4,
    cloudCoverage: 0.7,
    zones: SKY_ISLAND_ZONES,
    zoneAirCurrentConfigs: generateZoneAirCurrentConfigs('region_sky_island', SKY_ISLAND_ZONES, 'sky_island'),
    refreshConfig: generateRefreshConfig('sky_island'),
    flightObjectiveModifiers: generateFlightObjectiveModifiers('sky_island'),
  },
];

export const BUILDING_CLUSTERS: BuildingCluster[] = [
  {
    id: 'bc_old_market', regionId: 'region_old_town', name: '老集市场', description: '密集的低矮商铺屋檐，适合练习低空飞行技巧',
    icon: '🏪', position: { x: 130, y: 300 }, unlockCost: 0, buildingCount: 8, minHeight: 12, maxHeight: 25,
    explorationCondition: { type: 'distance', target: 200, description: '在老城区飞行距离达到200米' },
    rewardCoins: 30,
  },
  {
    id: 'bc_temple_roof', regionId: 'region_old_town', name: '古庙飞檐', description: '高耸的寺庙屋顶，檐角形成了独特的上升气流',
    icon: '🏯', position: { x: 180, y: 260 }, unlockCost: 50, buildingCount: 4, minHeight: 25, maxHeight: 40,
    specialEffect: 'updraft_boost',
    explorationCondition: { type: 'height', target: 50, description: '在老城区达到50米飞行高度' },
    rewardCoins: 60,
  },
  {
    id: 'bc_alley_network', regionId: 'region_old_town', name: '巷道迷网', description: '错综复杂的窄巷系统，考验转向和操控能力',
    icon: '🏘️', position: { x: 160, y: 320 }, unlockCost: 80, buildingCount: 12, minHeight: 10, maxHeight: 20,
    specialEffect: 'narrow_passage',
    explorationCondition: { type: 'no_collision', target: 1, description: '在老城区完成一次零碰撞飞行' },
    rewardCoins: 50,
  },
  {
    id: 'bc_river_towers', regionId: 'region_riverside', name: '河滨双塔', description: '河畔矗立的现代化双子塔，塔间风道气流强劲',
    icon: '🏙️', position: { x: 370, y: 200 }, unlockCost: 0, buildingCount: 2, minHeight: 50, maxHeight: 80,
    specialEffect: 'wind_tunnel',
    explorationCondition: { type: 'distance', target: 400, description: '在滨河走廊飞行距离达到400米' },
    rewardCoins: 80,
  },
  {
    id: 'bc_bridge_arch', regionId: 'region_riverside', name: '拱桥走廊', description: '横跨河流的古老石拱桥，桥下暗藏上升气流',
    icon: '🌉', position: { x: 400, y: 240 }, unlockCost: 100, buildingCount: 3, minHeight: 20, maxHeight: 35,
    specialEffect: 'bridge_updraft',
    explorationCondition: { type: 'aircurrent_count', target: 8, description: '在滨河走廊单局捕获8个气流' },
    rewardCoins: 70,
  },
  {
    id: 'bc_dock_district', regionId: 'region_riverside', name: '码头仓库区', description: '沿河分布的低矮仓库和码头设施',
    icon: '⚓', position: { x: 420, y: 270 }, unlockCost: 120, buildingCount: 6, minHeight: 15, maxHeight: 28,
    explorationCondition: { type: 'score', target: 2000, description: '在滨河走廊单局得分达到2000分' },
    rewardCoins: 60,
  },
  {
    id: 'bc_mountain_temple', regionId: 'region_mountain_peak', name: '山巅古寺', description: '矗立于山巅的古老寺院，是热气流汇聚之地',
    icon: '⛩️', position: { x: 260, y: 60 }, unlockCost: 0, buildingCount: 3, minHeight: 30, maxHeight: 50,
    specialEffect: 'thermal_focus',
    explorationCondition: { type: 'height', target: 200, description: '在翠峰山脉达到200米飞行高度' },
    rewardCoins: 100,
  },
  {
    id: 'bc_cliff_village', regionId: 'region_mountain_peak', name: '悬崖村落', description: '依附悬崖而建的村落，飞行路径险峻',
    icon: '🏔️', position: { x: 300, y: 90 }, unlockCost: 150, buildingCount: 7, minHeight: 15, maxHeight: 35,
    specialEffect: 'cliff_wind',
    explorationCondition: { type: 'distance', target: 600, description: '在翠峰山脉飞行距离达到600米' },
    rewardCoins: 90,
  },
  {
    id: 'bc_peak_station', regionId: 'region_mountain_peak', name: '顶峰观测站', description: '山脉最高处的气象观测站，可遭遇最强烈气流',
    icon: '📡', position: { x: 280, y: 40 }, unlockCost: 200, buildingCount: 2, minHeight: 40, maxHeight: 60,
    specialEffect: 'peak_turbulence',
    explorationCondition: { type: 'aircurrent_count', target: 15, description: '在翠峰山脉单局捕获15个气流' },
    rewardCoins: 120,
  },
  {
    id: 'bc_factory_row', regionId: 'region_industrial', name: '厂房列阵', description: '排列整齐的工业厂房，屋顶排放的热气形成稳定上升流',
    icon: '🏭', position: { x: 550, y: 370 }, unlockCost: 0, buildingCount: 5, minHeight: 20, maxHeight: 35,
    specialEffect: 'heat_updraft',
    explorationCondition: { type: 'aircurrent_count', target: 10, description: '在钢铁工坊单局捕获10个气流' },
    rewardCoins: 80,
  },
  {
    id: 'bc_chimney_alley', regionId: 'region_industrial', name: '烟囱小巷', description: '密集烟囱产生的多股独立上升气流',
    icon: '🗼', position: { x: 580, y: 340 }, unlockCost: 120, buildingCount: 8, minHeight: 30, maxHeight: 55,
    specialEffect: 'multi_updraft',
    explorationCondition: { type: 'score', target: 4000, description: '在钢铁工坊单局得分达到4000分' },
    rewardCoins: 100,
  },
  {
    id: 'bc_steel_bridge', regionId: 'region_industrial', name: '钢铁大桥', description: '巨大的工业钢桥，桥梁结构间暗藏风洞',
    icon: '🏗️', position: { x: 540, y: 310 }, unlockCost: 160, buildingCount: 4, minHeight: 25, maxHeight: 45,
    specialEffect: 'bridge_tunnel',
    explorationCondition: { type: 'no_collision', target: 1, description: '在钢铁工坊完成一次零碰撞飞行' },
    rewardCoins: 90,
  },
  {
    id: 'bc_ruins_cathedral', regionId: 'region_ancient_ruins', name: '遗迹大殿', description: '宏伟的古代殿堂残骸，内部空间形成了奇异气流',
    icon: '🏛️', position: { x: 80, y: 160 }, unlockCost: 0, buildingCount: 3, minHeight: 35, maxHeight: 55,
    specialEffect: 'ancient_resonance',
    explorationCondition: { type: 'distance', target: 500, description: '在古迹遗迹飞行距离达到500米' },
    rewardCoins: 120,
  },
  {
    id: 'bc_stone_pillars', regionId: 'region_ancient_ruins', name: '石柱森林', description: '密集的石柱群，窄间距飞行考验精准操控',
    icon: '🗿', position: { x: 120, y: 130 }, unlockCost: 200, buildingCount: 10, minHeight: 20, maxHeight: 40,
    specialEffect: 'pillar_slalom',
    explorationCondition: { type: 'score', target: 5000, description: '在古迹遗迹单局得分达到5000分' },
    rewardCoins: 110,
  },
  {
    id: 'bc_underground_hall', regionId: 'region_ancient_ruins', name: '地下大厅', description: '隐藏在地下的巨大空腔，气流在此汇聚旋转',
    icon: '🕳️', position: { x: 100, y: 180 }, unlockCost: 250, buildingCount: 2, minHeight: 45, maxHeight: 65,
    specialEffect: 'vortex_chamber',
    explorationCondition: { type: 'aircurrent_count', target: 20, description: '在古迹遗迹单局捕获20个气流' },
    rewardScore: 500, rewardCoins: 150,
  },
  {
    id: 'bc_cloud_palace', regionId: 'region_sky_island', name: '云中宫殿', description: '漂浮于云端的华丽宫殿，传说的风筝王曾居于此',
    icon: '🏰', position: { x: 400, y: 40 }, unlockCost: 0, buildingCount: 4, minHeight: 40, maxHeight: 70,
    specialEffect: 'cloud_lift',
    explorationCondition: { type: 'height', target: 350, description: '在浮空群岛达到350米飞行高度' },
    rewardCoins: 150,
  },
  {
    id: 'bc_sky_dock', regionId: 'region_sky_island', name: '天空码头', description: '岛屿间的连接通道，强风贯穿其间',
    icon: '🚁', position: { x: 450, y: 70 }, unlockCost: 300, buildingCount: 3, minHeight: 25, maxHeight: 45,
    specialEffect: 'crosswind',
    explorationCondition: { type: 'distance', target: 800, description: '在浮空群岛飞行距离达到800米' },
    rewardCoins: 130,
  },
  {
    id: 'bc_wind_shrine', regionId: 'region_sky_island', name: '风之神殿', description: '最终的秘密地点，掌控着所有气流的起源',
    icon: '🎐', position: { x: 430, y: 30 }, unlockCost: 500, buildingCount: 2, minHeight: 50, maxHeight: 80,
    specialEffect: 'wind_origin',
    explorationCondition: { type: 'score', target: 12000, description: '在浮空群岛单局得分达到12000分' },
    rewardScore: 1000, rewardCoins: 200,
  },
];

export const RARE_AIR_CURRENTS: RareAirCurrent[] = [
  {
    id: 'rac_old_town_thermal', regionId: 'region_old_town', name: '古刹暖流', description: '从老庙屋顶升起的金色暖流，温暖而稳定',
    icon: '✨', type: 'golden_updraft', position: { x: 170, y: 270 }, strength: 0.25, duration: 8,
    discoveryCondition: '在老城街区飞行距离超过300米',
    captureCondition: { type: 'aircurrent_count', target: 5, description: '单局捕获5个气流' },
    captureScore: 200, rewardCoins: 50,
  },
  {
    id: 'rac_river_tunnel', regionId: 'region_riverside', name: '河风通道', description: '河流与建筑间形成的稳定水平气流带',
    icon: '💨', type: 'wind_tunnel', position: { x: 390, y: 230 }, strength: 0.3, duration: 10,
    discoveryCondition: '在滨河走廊完成零碰撞飞行',
    captureCondition: { type: 'no_collision', target: 1, description: '零碰撞飞行' },
    captureScore: 350, rewardCoins: 80,
  },
  {
    id: 'rac_water_spray', regionId: 'region_riverside', name: '水雾喷射', description: '河面水花被风卷起形成的上升水雾气流',
    icon: '💦', type: 'thermal_highway', position: { x: 410, y: 250 }, strength: 0.2, duration: 6,
    discoveryCondition: '在滨河走廊达到150米高度',
    captureCondition: { type: 'height', target: 180, description: '飞行高度达到180米' },
    captureScore: 280, rewardCoins: 70,
  },
  {
    id: 'rac_mountain_thermal', regionId: 'region_mountain_peak', name: '山脊热流', description: '日照加热山脊产生的强劲上升热气流',
    icon: '🌡️', type: 'thermal_highway', position: { x: 270, y: 70 }, strength: 0.35, duration: 12,
    discoveryCondition: '在翠峰山脉达到250米高度',
    captureCondition: { type: 'height', target: 280, description: '飞行高度达到280米' },
    captureScore: 450, rewardCoins: 100,
  },
  {
    id: 'rac_peak_vortex', regionId: 'region_mountain_peak', name: '峰顶漩涡', description: '山峰背风面形成的强大漩涡气流',
    icon: '🌀', type: 'vortex_ring', position: { x: 295, y: 50 }, strength: 0.4, duration: 8,
    discoveryCondition: '在翠峰山脉捕获3个上升气流',
    captureCondition: { type: 'aircurrent_count', target: 12, description: '单局捕获12个气流' },
    captureScore: 500, rewardCoins: 120,
  },
  {
    id: 'rac_valley_wind', regionId: 'region_mountain_peak', name: '谷地穿堂风', description: '山谷间穿梭的高速水平气流',
    icon: '🌬️', type: 'wind_tunnel', position: { x: 310, y: 100 }, strength: 0.3, duration: 10,
    discoveryCondition: '在翠峰山脉完成2次飞行',
    captureCondition: { type: 'distance', target: 700, description: '飞行距离达到700米' },
    captureScore: 380, rewardCoins: 90,
  },
  {
    id: 'rac_heat_exhaust', regionId: 'region_industrial', name: '热废喷射', description: '工厂排放的高温废气形成的强烈上升流',
    icon: '🔥', type: 'golden_updraft', position: { x: 560, y: 380 }, strength: 0.35, duration: 7,
    discoveryCondition: '在钢铁工坊得分超过3000',
    captureCondition: { type: 'score', target: 4000, description: '单局得分达到4000分' },
    captureScore: 400, rewardCoins: 90,
  },
  {
    id: 'rac_steam_burst', regionId: 'region_industrial', name: '蒸汽爆发', description: '管道间歇性喷出的蒸汽形成的脉冲上升气流',
    icon: '♨️', type: 'storm_cell', position: { x: 590, y: 350 }, strength: 0.45, duration: 5,
    discoveryCondition: '在钢铁工坊探索2个建筑群',
    captureCondition: { type: 'aircurrent_count', target: 15, description: '单局捕获15个气流' },
    captureScore: 500, rewardCoins: 110,
  },
  {
    id: 'rac_ancient_spirit_wind', regionId: 'region_ancient_ruins', name: '古灵之风', description: '遗迹中传说的灵风，据说由古代风筝大师的残留意志驱动',
    icon: '👻', type: 'cloud_bridge', position: { x: 90, y: 150 }, strength: 0.4, duration: 15,
    discoveryCondition: '在古迹遗迹完成剧情事件「古老传说」',
    captureCondition: { type: 'score', target: 6000, description: '单局得分达到6000分' },
    captureScore: 600, rewardCoins: 130,
  },
  {
    id: 'rac_pillar_updraft', regionId: 'region_ancient_ruins', name: '石柱升腾', description: '石柱间聚焦的上升气流，力量惊人',
    icon: '⬆️', type: 'golden_updraft', position: { x: 115, y: 135 }, strength: 0.3, duration: 9,
    discoveryCondition: '在古迹遗迹飞行距离超过800米',
    captureCondition: { type: 'distance', target: 900, description: '飞行距离达到900米' },
    captureScore: 420, rewardCoins: 100,
  },
  {
    id: 'rac_ruins_storm', regionId: 'region_ancient_ruins', name: '遗迹风暴', description: '遗迹上空突然形成的局部风暴',
    icon: '⛈️', type: 'storm_cell', position: { x: 105, y: 170 }, strength: 0.5, duration: 6,
    discoveryCondition: '在古迹遗迹探索3个建筑群',
    captureCondition: { type: 'no_collision', target: 1, description: '零碰撞飞行' },
    captureScore: 550, rewardCoins: 120,
  },
  {
    id: 'rac_sky_bridge', regionId: 'region_sky_island', name: '云端之桥', description: '连接浮空岛的云层桥梁，由极度压缩的气流构成',
    icon: '🌈', type: 'cloud_bridge', position: { x: 415, y: 55 }, strength: 0.45, duration: 12,
    discoveryCondition: '在浮空群岛完成2次飞行',
    captureCondition: { type: 'distance', target: 900, description: '飞行距离达到900米' },
    captureScore: 700, rewardCoins: 150,
  },
  {
    id: 'rac_zenith_updraft', regionId: 'region_sky_island', name: '天顶极流', description: '天空最高处的终极上升气流，力量超凡',
    icon: '🌟', type: 'golden_updraft', position: { x: 430, y: 25 }, strength: 0.6, duration: 10,
    discoveryCondition: '在浮空群岛达到500米高度',
    captureCondition: { type: 'height', target: 520, description: '飞行高度达到520米' },
    captureScore: 1000, rewardCoins: 200,
  },
  {
    id: 'rac_astral_vortex', regionId: 'region_sky_island', name: '星辰漩涡', description: '传说中连接天地的漩涡，蕴含无限飞行能量',
    icon: '💫', type: 'vortex_ring', position: { x: 445, y: 45 }, strength: 0.55, duration: 8,
    discoveryCondition: '在浮空群岛捕获3个稀有气流',
    captureCondition: { type: 'aircurrent_count', target: 25, description: '单局捕获25个气流' },
    captureScore: 800, rewardCoins: 180,
  },
  {
    id: 'rac_cloud_highway', regionId: 'region_sky_island', name: '云际高速公路', description: '云层间的高速通道，速度极快',
    icon: '🛤️', type: 'thermal_highway', position: { x: 460, y: 65 }, strength: 0.5, duration: 14,
    discoveryCondition: '在浮空群岛得分超过10000',
    captureCondition: { type: 'score', target: 12000, description: '单局得分达到12000分' },
    captureScore: 750, rewardCoins: 160,
  },
];

export const STORY_EVENTS: StoryEvent[] = [
  {
    id: 'se_kite_origin', regionId: 'region_old_town', name: '风筝起源', description: '在老城区发现了风筝文化的起源故事',
    icon: '📜', type: 'discovery', position: { x: 140, y: 290 },
    triggerCondition: 'region_old_town_unlocked',
    rewardCoins: 30, rewardScore: 100,
    dialogue: [
      { speaker: '老工匠', text: '年轻人，你知道风筝为何能飞吗？', emotion: 'neutral' },
      { speaker: '老工匠', text: '不是因为力量，而是因为与风的默契。', emotion: 'happy' },
      { speaker: '旁白', text: '老工匠向你展示了古老的扎风筝技法，你感受到了传统工艺的温度。', emotion: 'neutral' },
      { speaker: '老工匠', text: '去吧，去探索更远的天空。记住，风会指引你。', emotion: 'happy' },
    ],
    unlocksBuildingId: 'bc_temple_roof',
  },
  {
    id: 'se_old_craftsman', regionId: 'region_old_town', name: '匠人之约', description: '老工匠委托你完成一次特别的飞行考验',
    icon: '🤝', type: 'challenge', position: { x: 170, y: 310 },
    triggerCondition: 'se_kite_origin_completed',
    rewardCoins: 60, rewardScore: 200,
    dialogue: [
      { speaker: '老工匠', text: '我有个请求……在寺庙屋顶有一股特别的上升气流。', emotion: 'neutral' },
      { speaker: '老工匠', text: '如果你能捕获那股气流，我就把我珍藏的风筝线轴送给你。', emotion: 'happy' },
      { speaker: '旁白', text: '你决定接受老工匠的考验，飞向古庙飞檐。', emotion: 'neutral' },
    ],
    unlocksRareCurrentId: 'rac_old_town_thermal',
  },
  {
    id: 'se_river_spirit', regionId: 'region_riverside', name: '河神低语', description: '河面上似乎传来了神秘的声音',
    icon: '🌊', type: 'mystery', position: { x: 385, y: 230 },
    triggerCondition: 'region_riverside_unlocked',
    rewardCoins: 80, rewardScore: 250,
    dialogue: [
      { speaker: '???', text: '……来……来这里……', emotion: 'neutral' },
      { speaker: '旁白', text: '河面泛起涟漪，一股不同寻常的气流从水面上方升起。', emotion: 'surprised' },
      { speaker: '河神', text: '我是这片河流的守护者。你能感受到我赐予的风吗？', emotion: 'neutral' },
      { speaker: '河神', text: '在河塔之间，有一条风之路径。找到它，你就获得了我的祝福。', emotion: 'happy' },
    ],
    unlocksRareCurrentId: 'rac_river_tunnel',
  },
  {
    id: 'se_bridge_challenge', regionId: 'region_riverside', name: '桥梁挑战', description: '拱桥走廊出现了异常的强劲风势',
    icon: '🌉', type: 'challenge', position: { x: 405, y: 250 },
    triggerCondition: 'se_river_spirit_completed',
    rewardCoins: 100, rewardScore: 300,
    dialogue: [
      { speaker: '工程师', text: '注意！桥下风速异常增大，这不正常！', emotion: 'worried' },
      { speaker: '旁白', text: '古老石桥下涌出强烈的上升气流，这是难得的飞行机会。', emotion: 'surprised' },
      { speaker: '工程师', text: '太惊人了！桥梁结构竟然能引导气流形成通道！', emotion: 'happy' },
    ],
    unlocksBuildingId: 'bc_bridge_arch',
  },
  {
    id: 'se_mountain_hermit', regionId: 'region_mountain_peak', name: '山间隐者', description: '在山巅遇到了与世隔绝的飞行大师',
    icon: '🧙', type: 'legend', position: { x: 275, y: 55 },
    triggerCondition: 'region_mountain_peak_unlocked',
    rewardCoins: 120, rewardScore: 400,
    dialogue: [
      { speaker: '隐者', text: '又一个追寻天空的人……', emotion: 'neutral' },
      { speaker: '隐者', text: '我在此修行三十年，终于领悟了风的语言。', emotion: 'neutral' },
      { speaker: '隐者', text: '山巅的热流是大地的呼吸，漩涡是天空的脉搏。', emotion: 'happy' },
      { speaker: '隐者', text: '让我教你感受真正的风。', emotion: 'happy' },
    ],
    unlocksRareCurrentId: 'rac_mountain_thermal',
  },
  {
    id: 'se_sky_gate', regionId: 'region_mountain_peak', name: '天空之门', description: '隐者指引你寻找传说中的天空入口',
    icon: '🚪', type: 'legend', position: { x: 290, y: 65 },
    triggerCondition: 'se_mountain_hermit_completed',
    rewardCoins: 150, rewardScore: 500,
    dialogue: [
      { speaker: '隐者', text: '你已准备好了。在最高的山峰之上，有一道天空之门。', emotion: 'neutral' },
      { speaker: '隐者', text: '穿过那道门，你将看到常人无法想象的世界。', emotion: 'happy' },
      { speaker: '旁白', text: '你跟随隐者的指引，向峰顶飞去。云层在脚下翻涌，风在耳边低吟。', emotion: 'surprised' },
      { speaker: '旁白', text: '在峰顶的漩涡中，你隐约看到了通往更高天空的路径。', emotion: 'happy' },
    ],
    unlocksRareCurrentId: 'rac_peak_vortex',
  },
  {
    id: 'se_lost_blueprint', regionId: 'region_industrial', name: '失落蓝图', description: '在工厂废墟中发现了一份神秘的图纸',
    icon: '📐', type: 'discovery', position: { x: 555, y: 365 },
    triggerCondition: 'region_industrial_unlocked',
    rewardCoins: 80, rewardScore: 300,
    dialogue: [
      { speaker: '旁白', text: '在一座废弃工厂中，你发现了泛黄的图纸。', emotion: 'neutral' },
      { speaker: '旁白', text: '图纸上画着一种奇特的建筑结构，标注着「风能聚合器」的字样。', emotion: 'surprised' },
      { speaker: '老工人', text: '那是我师父留下的……他曾经想利用工厂热能创造最强的飞行气流。', emotion: 'sad' },
    ],
    unlocksBuildingId: 'bc_chimney_alley',
  },
  {
    id: 'se_smoke_signal', regionId: 'region_industrial', name: '烟信号', description: '工厂烟囱发出了规律性的烟雾信号',
    icon: '📡', type: 'crisis', position: { x: 585, y: 345 },
    triggerCondition: 'se_lost_blueprint_completed',
    rewardCoins: 100, rewardScore: 350,
    dialogue: [
      { speaker: '老工人', text: '烟囱信号！有人在用老办法召唤飞行者！', emotion: 'worried' },
      { speaker: '老工人', text: '这是蒸汽管道的安全阀被触发了，会喷出极强气流！', emotion: 'surprised' },
      { speaker: '旁白', text: '蒸汽喷涌而出，你决定迎着蒸汽飞行。', emotion: 'neutral' },
    ],
    unlocksRareCurrentId: 'rac_steam_burst',
  },
  {
    id: 'se_ancient_legend', regionId: 'region_ancient_ruins', name: '古老传说', description: '遗迹中发现了关于风之起源的古老传说',
    icon: '📖', type: 'legend', position: { x: 85, y: 155 },
    triggerCondition: 'region_ancient_ruins_unlocked',
    rewardCoins: 150, rewardScore: 500,
    dialogue: [
      { speaker: '旁白', text: '壁画上描绘着远古时代，人类与风之精灵共存的故事。', emotion: 'neutral' },
      { speaker: '旁白', text: '传说风之精灵被封印在这些遗迹之中，等待被释放。', emotion: 'surprised' },
      { speaker: '古灵', text: '你……能听到我的声音吗？千年了……终于有人来了。', emotion: 'sad' },
      { speaker: '古灵', text: '释放我需要你在遗迹中找到三处封印节点。', emotion: 'neutral' },
    ],
    unlocksRareCurrentId: 'rac_ancient_spirit_wind',
  },
  {
    id: 'se_spirit_pact', regionId: 'region_ancient_ruins', name: '精灵契约', description: '与风之精灵缔结了古老的契约',
    icon: '🔮', type: 'alliance', position: { x: 95, y: 165 },
    triggerCondition: 'se_ancient_legend_completed',
    rewardCoins: 200, rewardScore: 600,
    dialogue: [
      { speaker: '古灵', text: '你的诚意我已感受到。我愿与你缔结风之契约。', emotion: 'happy' },
      { speaker: '古灵', text: '从今以后，我会在你需要时引导气流。', emotion: 'happy' },
      { speaker: '旁白', text: '一道柔和的光芒将你与古灵连接在一起，你感到风变得更加亲切。', emotion: 'happy' },
    ],
    unlocksBuildingId: 'bc_underground_hall',
  },
  {
    id: 'se_forbidden_chamber', regionId: 'region_ancient_ruins', name: '禁忌之间', description: '遗迹深处发现了被封禁的神秘空间',
    icon: '⚠️', type: 'crisis', position: { x: 105, y: 175 },
    triggerCondition: 'se_spirit_pact_completed',
    rewardCoins: 250, rewardScore: 700,
    dialogue: [
      { speaker: '古灵', text: '等等……这扇门后是禁忌之间！', emotion: 'worried' },
      { speaker: '古灵', text: '千年前封印在那里的……是暴风之灵。', emotion: 'worried' },
      { speaker: '旁白', text: '门被推开，狂暴的气流涌出。你必须在风暴中稳住风筝。', emotion: 'surprised' },
      { speaker: '古灵', text: '你居然……驯服了暴风之灵！不可思议！', emotion: 'surprised' },
    ],
    unlocksRareCurrentId: 'rac_ruins_storm',
  },
  {
    id: 'se_sky_king', regionId: 'region_sky_island', name: '天空之王', description: '在浮空群岛遇到了传说中的天空之王',
    icon: '👑', type: 'legend', position: { x: 405, y: 35 },
    triggerCondition: 'region_sky_island_unlocked',
    rewardCoins: 200, rewardScore: 800,
    dialogue: [
      { speaker: '天空之王', text: '踏足浮空群岛的飞行者……百年只有一位。', emotion: 'neutral' },
      { speaker: '天空之王', text: '我在此等待能继承风之力量的人。', emotion: 'neutral' },
      { speaker: '天空之王', text: '你必须通过四重考验，才能获得天空的认可。', emotion: 'happy' },
    ],
    unlocksRareCurrentId: 'rac_sky_bridge',
  },
  {
    id: 'se_wind_ceremony', regionId: 'region_sky_island', name: '风之仪式', description: '参加古老的风之加冕仪式',
    icon: '🎐', type: 'alliance', position: { x: 425, y: 50 },
    triggerCondition: 'se_sky_king_completed',
    rewardCoins: 300, rewardScore: 1000,
    dialogue: [
      { speaker: '天空之王', text: '仪式将唤醒所有的风之力量。', emotion: 'happy' },
      { speaker: '天空之王', text: '听……天空在歌唱。', emotion: 'happy' },
      { speaker: '旁白', text: '无数气流汇聚成壮观的螺旋，你感到前所未有的飞行力量。', emotion: 'surprised' },
    ],
    unlocksRareCurrentId: 'rac_zenith_updraft',
  },
  {
    id: 'se_final_trial', regionId: 'region_sky_island', name: '终极试炼', description: '面对最终的风之考验',
    icon: '🌟', type: 'challenge', position: { x: 440, y: 55 },
    triggerCondition: 'se_wind_ceremony_completed',
    rewardCoins: 500, rewardScore: 2000,
    dialogue: [
      { speaker: '天空之王', text: '最终的试炼——在星辰漩涡中飞行，直至天顶。', emotion: 'neutral' },
      { speaker: '天空之王', text: '这是只有传说中的飞行家才能完成的壮举。', emotion: 'neutral' },
      { speaker: '旁白', text: '你纵身飞入星辰漩涡，天地之间的所有气流都为你让路。', emotion: 'surprised' },
      { speaker: '天空之王', text: '你就是……新一代的天空之主！', emotion: 'happy' },
    ],
    unlocksRareCurrentId: 'rac_astral_vortex',
  },
];

export const STAGES: Stage[] = [
  {
    id: 'stage_old_town_1', regionId: 'region_old_town', name: '初探老城', description: '在老城街区完成首次飞行探索',
    icon: '🎯', order: 1,
    objectives: [
      { type: 'distance', target: 300, description: '飞行距离达到300米' },
      { type: 'score', target: 500, description: '得分达到500分' },
    ],
    rewardCoins: 50, rewardScore: 100, bonusCondition: '零碰撞完成', bonusRewardCoins: 30,
  },
  {
    id: 'stage_old_town_2', regionId: 'region_old_town', name: '古刹翱翔', description: '探索老城区的建筑群并捕获气流',
    icon: '🏯', order: 2,
    objectives: [
      { type: 'explore_buildings', target: 2, description: '探索2个建筑群' },
      { type: 'aircurrent_count', target: 5, description: '捕获5个气流' },
    ],
    rewardCoins: 80, rewardScore: 200, bonusCondition: '完成剧情事件', bonusRewardCoins: 50,
  },
  {
    id: 'stage_old_town_3', regionId: 'region_old_town', name: '老城征服', description: '彻底探索老城街区',
    icon: '✅', order: 3,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 1, description: '捕获1个稀有气流' },
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
    ],
    rewardCoins: 120, rewardScore: 300,
  },
  {
    id: 'stage_riverside_1', regionId: 'region_riverside', name: '沿河起航', description: '在滨河走廊完成初步探索',
    icon: '⛵', order: 1,
    objectives: [
      { type: 'distance', target: 500, description: '飞行距离达到500米' },
      { type: 'height', target: 150, description: '达到150米高度' },
    ],
    rewardCoins: 80, rewardScore: 200, bonusCondition: '单次得分超过3000', bonusRewardCoins: 50,
  },
  {
    id: 'stage_riverside_2', regionId: 'region_riverside', name: '河风猎手', description: '掌握河岸特有的气流规律',
    icon: '💨', order: 2,
    objectives: [
      { type: 'aircurrent_count', target: 8, description: '捕获8个气流' },
      { type: 'no_collision', target: 1, description: '完成1次零碰撞飞行' },
    ],
    rewardCoins: 100, rewardScore: 250, bonusCondition: '零碰撞且飞行500米', bonusRewardCoins: 60,
  },
  {
    id: 'stage_riverside_3', regionId: 'region_riverside', name: '滨河全境', description: '完全探索滨河走廊',
    icon: '🌊', order: 3,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 1, description: '捕获1个稀有气流' },
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
    ],
    rewardCoins: 150, rewardScore: 350,
  },
  {
    id: 'stage_mountain_1', regionId: 'region_mountain_peak', name: '登山试炼', description: '在山区完成初步飞行挑战',
    icon: '⛰️', order: 1,
    objectives: [
      { type: 'height', target: 250, description: '达到250米高度' },
      { type: 'distance', target: 800, description: '飞行距离达到800米' },
    ],
    rewardCoins: 120, rewardScore: 300, bonusCondition: '得分超过5000', bonusRewardCoins: 70,
  },
  {
    id: 'stage_mountain_2', regionId: 'region_mountain_peak', name: '气旋驭手', description: '掌握山区的复杂气流系统',
    icon: '🌪️', order: 2,
    objectives: [
      { type: 'aircurrent_count', target: 12, description: '捕获12个气流' },
      { type: 'capture_rare_current', target: 1, description: '捕获1个稀有气流' },
    ],
    rewardCoins: 150, rewardScore: 350, bonusCondition: '零碰撞完成', bonusRewardCoins: 80,
  },
  {
    id: 'stage_mountain_3', regionId: 'region_mountain_peak', name: '山巅征服', description: '完全征服翠峰山脉',
    icon: '🏔️', order: 3,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 2, description: '捕获2个稀有气流' },
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
    ],
    rewardCoins: 200, rewardScore: 500,
  },
  {
    id: 'stage_industrial_1', regionId: 'region_industrial', name: '工厂探路', description: '探索钢铁工坊的飞行可能性',
    icon: '🔧', order: 1,
    objectives: [
      { type: 'distance', target: 600, description: '飞行距离达到600米' },
      { type: 'score', target: 3000, description: '得分达到3000分' },
    ],
    rewardCoins: 100, rewardScore: 250, bonusCondition: '得分超过5000', bonusRewardCoins: 60,
  },
  {
    id: 'stage_industrial_2', regionId: 'region_industrial', name: '热流驾驭', description: '利用工厂热能形成的气流飞行',
    icon: '🔥', order: 2,
    objectives: [
      { type: 'aircurrent_count', target: 10, description: '捕获10个气流' },
      { type: 'explore_buildings', target: 2, description: '探索2个建筑群' },
    ],
    rewardCoins: 130, rewardScore: 300, bonusCondition: '完成剧情事件', bonusRewardCoins: 70,
  },
  {
    id: 'stage_industrial_3', regionId: 'region_industrial', name: '工坊全境', description: '完全探索钢铁工坊',
    icon: '🏭', order: 3,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 2, description: '捕获2个稀有气流' },
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
    ],
    rewardCoins: 180, rewardScore: 400,
  },
  {
    id: 'stage_ancient_1', regionId: 'region_ancient_ruins', name: '遗迹初探', description: '踏入神秘的古迹遗迹',
    icon: '🏛️', order: 1,
    objectives: [
      { type: 'distance', target: 800, description: '飞行距离达到800米' },
      { type: 'height', target: 300, description: '达到300米高度' },
    ],
    rewardCoins: 150, rewardScore: 350, bonusCondition: '零碰撞完成', bonusRewardCoins: 80,
  },
  {
    id: 'stage_ancient_2', regionId: 'region_ancient_ruins', name: '古灵共鸣', description: '与遗迹中的古灵建立联系',
    icon: '👻', order: 2,
    objectives: [
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
      { type: 'capture_rare_current', target: 2, description: '捕获2个稀有气流' },
    ],
    rewardCoins: 200, rewardScore: 450, bonusCondition: '探索3个建筑群', bonusRewardCoins: 100,
  },
  {
    id: 'stage_ancient_3', regionId: 'region_ancient_ruins', name: '古迹征服', description: '完全征服古迹遗迹',
    icon: '✨', order: 3,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 3, description: '捕获全部3个稀有气流' },
      { type: 'complete_story', target: 3, description: '完成全部3个剧情事件' },
    ],
    rewardCoins: 300, rewardScore: 600,
  },
  {
    id: 'stage_sky_1', regionId: 'region_sky_island', name: '云端初行', description: '在浮空群岛完成第一次飞行',
    icon: '☁️', order: 1,
    objectives: [
      { type: 'distance', target: 1000, description: '飞行距离达到1000米' },
      { type: 'height', target: 400, description: '达到400米高度' },
      { type: 'score', target: 5000, description: '得分达到5000分' },
    ],
    rewardCoins: 200, rewardScore: 500, bonusCondition: '得分超过10000', bonusRewardCoins: 100,
  },
  {
    id: 'stage_sky_2', regionId: 'region_sky_island', name: '云海驭风', description: '驾驭浮空群岛的各种稀有气流',
    icon: '🌬️', order: 2,
    objectives: [
      { type: 'capture_rare_current', target: 2, description: '捕获2个稀有气流' },
      { type: 'aircurrent_count', target: 15, description: '捕获15个气流' },
      { type: 'explore_buildings', target: 2, description: '探索2个建筑群' },
    ],
    rewardCoins: 250, rewardScore: 600, bonusCondition: '零碰撞飞行', bonusRewardCoins: 120,
  },
  {
    id: 'stage_sky_3', regionId: 'region_sky_island', name: '天空试炼', description: '完成天空之王的考验',
    icon: '👑', order: 3,
    objectives: [
      { type: 'complete_story', target: 2, description: '完成2个剧情事件' },
      { type: 'capture_rare_current', target: 3, description: '捕获3个稀有气流' },
      { type: 'no_collision', target: 2, description: '完成2次零碰撞飞行' },
    ],
    rewardCoins: 350, rewardScore: 800, bonusCondition: '全部剧情完成', bonusRewardCoins: 150,
  },
  {
    id: 'stage_sky_4', regionId: 'region_sky_island', name: '天空之主', description: '征服浮空群岛的终极挑战',
    icon: '🌟', order: 4,
    objectives: [
      { type: 'explore_buildings', target: 3, description: '探索全部3个建筑群' },
      { type: 'capture_rare_current', target: 4, description: '捕获全部4个稀有气流' },
      { type: 'complete_story', target: 3, description: '完成全部3个剧情事件' },
      { type: 'score', target: 15000, description: '单次得分达到15000分' },
    ],
    rewardCoins: 500, rewardScore: 1500,
  },
];

export function createDefaultRegionProgress(region: Region): RegionProgress {
  const buildingClusterStatuses: Record<string, BuildingClusterStatus> = {};
  region.buildingClusterIds.forEach((id) => {
    buildingClusterStatuses[id] = 'locked';
  });

  const rareAirCurrentStatuses: Record<string, RareAirCurrentStatus> = {};
  region.rareAirCurrentIds.forEach((id) => {
    rareAirCurrentStatuses[id] = 'undiscovered';
  });

  const storyEventStatuses: Record<string, StoryEventStatus> = {};
  region.storyEventIds.forEach((id) => {
    storyEventStatuses[id] = 'locked';
  });

  const stageStatuses: Record<string, StageStatus> = {};
  const stageProgress: Record<string, Record<string, number>> = {};
  region.stageIds.forEach((id) => {
    stageStatuses[id] = 'locked';
    stageProgress[id] = {};
  });

  const zoneExplorationStates = createZoneExplorationStates(region.zones);

  const isInitial = region.unlockCost === 0;

  return {
    status: isInitial ? 'unlocked' : 'locked',
    unlockedAt: isInitial ? Date.now() : null,
    buildingClusterStatuses,
    rareAirCurrentStatuses,
    storyEventStatuses,
    stageStatuses,
    stageProgress,
    explorationPercent: 0,
    totalFlightsInRegion: 0,
    totalScoreInRegion: 0,
    totalDistanceInRegion: 0,
    bestScoreInRegion: 0,
    zoneExplorationStates,
    currentBuildingSeed: Math.floor(Math.random() * 100000),
    lastRefreshTime: null,
    refreshCountThisSession: 0,
    crossZoneFlightsCompleted: 0,
    activeZoneId: null,
  };
}

export function createDefaultMapExploreState(): MapExploreState {
  const regionProgress: Record<string, RegionProgress> = {};
  REGIONS.forEach((region) => {
    regionProgress[region.id] = createDefaultRegionProgress(region);
  });

  const oldTownProgress = regionProgress['region_old_town'];
  if (oldTownProgress) {
    const firstBc = REGIONS[0].buildingClusterIds[0];
    if (firstBc) oldTownProgress.buildingClusterStatuses[firstBc] = 'unlockable';

    const firstStory = REGIONS[0].storyEventIds[0];
    if (firstStory) oldTownProgress.storyEventStatuses[firstStory] = 'available';

    const firstStage = REGIONS[0].stageIds[0];
    if (firstStage) oldTownProgress.stageStatuses[firstStage] = 'active';
  }

  let totalZonesExplored = 0;
  REGIONS.forEach((region) => {
    totalZonesExplored += region.zones.length;
  });

  return {
    currentRegionId: null,
    regionProgress,
    totalExplorationPercent: 0,
    totalRegionsUnlocked: 1,
    totalBuildingClustersUnlocked: 0,
    totalRareCurrentsCaptured: 0,
    totalStoryEventsCompleted: 0,
    totalStagesCompleted: 0,
    activeStoryEventId: null,
    activeStoryDialogueIndex: 0,
    lastSettlementResults: [],
    totalZonesExplored: 0,
    totalCrossZoneFlights: 0,
    lastRegionRefreshTriggers: {},
  };
}
