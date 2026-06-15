import type {
  MapExploreState,
  RegionProgress,
  StageSettlementResult,
  Stage,
  MapExploreFlightResult,
} from './types';
import {
  REGIONS,
  BUILDING_CLUSTERS,
  RARE_AIR_CURRENTS,
  STORY_EVENTS,
  STAGES,
  createDefaultMapExploreState,
} from './mapExploreData';
import type { GameStats } from '../game/types';

const SAVE_KEY = 'kite_map_explore_save';

export class MapExploreEngine {
  private state: MapExploreState;

  constructor() {
    this.state = createDefaultMapExploreState();
  }

  public getState(): MapExploreState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public getRegion(id: string) {
    return REGIONS.find((r) => r.id === id);
  }

  public getRegions() {
    return [...REGIONS];
  }

  public getBuildingCluster(id: string) {
    return BUILDING_CLUSTERS.find((b) => b.id === id);
  }

  public getBuildingClustersForRegion(regionId: string) {
    return BUILDING_CLUSTERS.filter((b) => b.regionId === regionId);
  }

  public getRareAirCurrent(id: string) {
    return RARE_AIR_CURRENTS.find((r) => r.id === id);
  }

  public getRareAirCurrentsForRegion(regionId: string) {
    return RARE_AIR_CURRENTS.filter((r) => r.regionId === regionId);
  }

  public getStoryEvent(id: string) {
    return STORY_EVENTS.find((e) => e.id === id);
  }

  public getStoryEventsForRegion(regionId: string) {
    return STORY_EVENTS.filter((e) => e.regionId === regionId);
  }

  public getStage(id: string) {
    return STAGES.find((s) => s.id === id);
  }

  public getStagesForRegion(regionId: string) {
    return STAGES.filter((s) => s.regionId === regionId).sort((a, b) => a.order - b.order);
  }

  public getRegionProgress(regionId: string): RegionProgress | undefined {
    return this.state.regionProgress[regionId]
      ? JSON.parse(JSON.stringify(this.state.regionProgress[regionId]))
      : undefined;
  }

  public unlockRegion(regionId: string, spendCoins: () => boolean): boolean {
    const region = this.getRegion(regionId);
    if (!region) return false;

    const progress = this.state.regionProgress[regionId];
    if (!progress || (progress.status !== 'locked' && progress.status !== 'unlockable')) return false;

    if (region.unlockCondition) {
      const condRegionProgress = this.state.regionProgress[region.unlockCondition];
      if (!condRegionProgress || condRegionProgress.status !== 'unlocked') return false;
    }

    if (region.unlockCost > 0) {
      const success = spendCoins();
      if (!success) return false;
    }

    progress.status = 'unlocked';
    progress.unlockedAt = Date.now();

    if (region.buildingClusterIds.length > 0) {
      progress.buildingClusterStatuses[region.buildingClusterIds[0]] = 'unlockable';
    }
    if (region.storyEventIds.length > 0) {
      progress.storyEventStatuses[region.storyEventIds[0]] = 'available';
    }
    if (region.stageIds.length > 0) {
      progress.stageStatuses[region.stageIds[0]] = 'active';
    }

    this.state.totalRegionsUnlocked += 1;
    this.updateAdjacentRegions();
    this.recalculateExploration();
    this.saveToLocalStorage();

    return true;
  }

  private updateAdjacentRegions(): void {
    REGIONS.forEach((region) => {
      const progress = this.state.regionProgress[region.id];
      if (!progress || progress.status !== 'locked') return;

      if (region.unlockCondition) {
        const condProgress = this.state.regionProgress[region.unlockCondition];
        if (condProgress && condProgress.status === 'unlocked') {
          progress.status = 'unlockable';
        }
      }
    });
  }

  public unlockBuildingCluster(clusterId: string, spendCoins: () => boolean): boolean {
    const cluster = this.getBuildingCluster(clusterId);
    if (!cluster) return false;

    const regionProgress = this.state.regionProgress[cluster.regionId];
    if (!regionProgress || regionProgress.status !== 'unlocked') return false;

    const currentStatus = regionProgress.buildingClusterStatuses[clusterId];
    if (currentStatus !== 'unlockable') return false;

    if (cluster.unlockCost > 0) {
      const success = spendCoins();
      if (!success) return false;
    }

    regionProgress.buildingClusterStatuses[clusterId] = 'unlocked';
    this.state.totalBuildingClustersUnlocked += 1;

    const region = this.getRegion(cluster.regionId);
    if (region) {
      const clusterIds = region.buildingClusterIds;
      const currentIdx = clusterIds.indexOf(clusterId);
      if (currentIdx >= 0 && currentIdx < clusterIds.length - 1) {
        const nextId = clusterIds[currentIdx + 1];
        if (regionProgress.buildingClusterStatuses[nextId] === 'locked') {
          regionProgress.buildingClusterStatuses[nextId] = 'unlockable';
        }
      }
    }

    this.recalculateExploration();
    this.saveToLocalStorage();
    return true;
  }

  public completeBuildingCluster(clusterId: string): boolean {
    const cluster = this.getBuildingCluster(clusterId);
    if (!cluster) return false;

    const regionProgress = this.state.regionProgress[cluster.regionId];
    if (!regionProgress) return false;

    if (regionProgress.buildingClusterStatuses[clusterId] !== 'unlocked') return false;

    regionProgress.buildingClusterStatuses[clusterId] = 'completed';
    this.recalculateExploration();
    this.saveToLocalStorage();
    return true;
  }

  public discoverRareAirCurrent(currentId: string): boolean {
    const rac = this.getRareAirCurrent(currentId);
    if (!rac) return false;

    const regionProgress = this.state.regionProgress[rac.regionId];
    if (!regionProgress) return false;

    if (regionProgress.rareAirCurrentStatuses[currentId] !== 'undiscovered') return false;

    regionProgress.rareAirCurrentStatuses[currentId] = 'discovered';
    this.recalculateExploration();
    this.saveToLocalStorage();
    return true;
  }

  public captureRareAirCurrent(currentId: string): boolean {
    const rac = this.getRareAirCurrent(currentId);
    if (!rac) return false;

    const regionProgress = this.state.regionProgress[rac.regionId];
    if (!regionProgress) return false;

    if (regionProgress.rareAirCurrentStatuses[currentId] !== 'discovered') return false;

    regionProgress.rareAirCurrentStatuses[currentId] = 'captured';
    this.state.totalRareCurrentsCaptured += 1;

    const region = this.getRegion(rac.regionId);
    if (region) {
      const racIds = region.rareAirCurrentIds;
      const currentIdx = racIds.indexOf(currentId);
      if (currentIdx >= 0 && currentIdx < racIds.length - 1) {
        const nextId = racIds[currentIdx + 1];
        if (regionProgress.rareAirCurrentStatuses[nextId] === 'undiscovered') {
          regionProgress.rareAirCurrentStatuses[nextId] = 'discovered';
        }
      }
    }

    this.recalculateExploration();
    this.saveToLocalStorage();
    return true;
  }

  public startStoryEvent(eventId: string): boolean {
    const event = this.getStoryEvent(eventId);
    if (!event) return false;

    const regionProgress = this.state.regionProgress[event.regionId];
    if (!regionProgress) return false;

    if (regionProgress.storyEventStatuses[eventId] !== 'available') return false;

    regionProgress.storyEventStatuses[eventId] = 'active';
    this.state.activeStoryEventId = eventId;
    this.state.activeStoryDialogueIndex = 0;
    this.saveToLocalStorage();
    return true;
  }

  public advanceStoryDialogue(): boolean {
    if (!this.state.activeStoryEventId) return false;

    const event = this.getStoryEvent(this.state.activeStoryEventId);
    if (!event) return false;

    const nextIndex = this.state.activeStoryDialogueIndex + 1;
    if (nextIndex >= event.dialogue.length) {
      return this.completeStoryEvent(this.state.activeStoryEventId);
    }

    this.state.activeStoryDialogueIndex = nextIndex;
    this.saveToLocalStorage();
    return true;
  }

  public getActiveStoryDialogue() {
    if (!this.state.activeStoryEventId) return null;
    const event = this.getStoryEvent(this.state.activeStoryEventId);
    if (!event) return null;
    if (this.state.activeStoryDialogueIndex >= event.dialogue.length) return null;

    return {
      event,
      dialogue: event.dialogue[this.state.activeStoryDialogueIndex],
      dialogueIndex: this.state.activeStoryDialogueIndex,
      totalDialogues: event.dialogue.length,
    };
  }

  private completeStoryEvent(eventId: string): boolean {
    const event = this.getStoryEvent(eventId);
    if (!event) return false;

    const regionProgress = this.state.regionProgress[event.regionId];
    if (!regionProgress) return false;

    regionProgress.storyEventStatuses[eventId] = 'completed';
    this.state.totalStoryEventsCompleted += 1;

    if (this.state.activeStoryEventId === eventId) {
      this.state.activeStoryEventId = null;
      this.state.activeStoryDialogueIndex = 0;
    }

    if (event.unlocksBuildingId) {
      const bcStatus = regionProgress.buildingClusterStatuses[event.unlocksBuildingId];
      if (bcStatus === 'locked') {
        regionProgress.buildingClusterStatuses[event.unlocksBuildingId] = 'unlockable';
      }
    }

    if (event.unlocksRareCurrentId) {
      const racStatus = regionProgress.rareAirCurrentStatuses[event.unlocksRareCurrentId];
      if (racStatus === 'undiscovered') {
        regionProgress.rareAirCurrentStatuses[event.unlocksRareCurrentId] = 'discovered';
      }
    }

    const region = this.getRegion(event.regionId);
    if (region) {
      const eventIds = region.storyEventIds;
      const currentIdx = eventIds.indexOf(eventId);
      if (currentIdx >= 0 && currentIdx < eventIds.length - 1) {
        const nextId = eventIds[currentIdx + 1];
        if (regionProgress.storyEventStatuses[nextId] === 'locked') {
          regionProgress.storyEventStatuses[nextId] = 'available';
        }
      }
    }

    this.recalculateExploration();
    this.saveToLocalStorage();
    return true;
  }

  public recordFlightInRegion(regionId: string, stats: GameStats, adjustedScore: number): MapExploreFlightResult {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress || regionProgress.status !== 'unlocked') {
      return this.createEmptyFlightResult(regionId);
    }

    regionProgress.totalFlightsInRegion += 1;
    regionProgress.totalScoreInRegion += adjustedScore;
    regionProgress.totalDistanceInRegion += stats.distance;

    if (adjustedScore > regionProgress.bestScoreInRegion) {
      regionProgress.bestScoreInRegion = adjustedScore;
    }

    const result: MapExploreFlightResult = {
      regionId,
      newlyExploredBuildingClusters: [],
      newlyDiscoveredAirCurrents: [],
      newlyCapturedAirCurrents: [],
      newlyCompletedStages: [],
      newlyCompletedStoryEvents: [],
      totalRewardCoins: 0,
      totalRewardScore: 0,
    };

    this.checkBuildingClusterExploration(regionId, stats, adjustedScore, result);
    this.checkRareAirCurrentDiscovery(regionId, stats, adjustedScore, result);
    this.checkRareAirCurrentCapture(regionId, stats, adjustedScore, result);
    this.updateStageProgress(regionId, stats, adjustedScore);
    this.checkStageCompletion(regionId, result);

    regionProgress.totalScoreInRegion += result.totalRewardScore;

    const flightTotalScore = adjustedScore + result.totalRewardScore;
    if (flightTotalScore > regionProgress.bestScoreInRegion) {
      regionProgress.bestScoreInRegion = flightTotalScore;
    }

    this.recalculateExploration();
    this.saveToLocalStorage();

    return result;
  }

  private createEmptyFlightResult(regionId: string): MapExploreFlightResult {
    return {
      regionId,
      newlyExploredBuildingClusters: [],
      newlyDiscoveredAirCurrents: [],
      newlyCapturedAirCurrents: [],
      newlyCompletedStages: [],
      newlyCompletedStoryEvents: [],
      totalRewardCoins: 0,
      totalRewardScore: 0,
    };
  }

  private checkBuildingClusterExploration(
    regionId: string,
    stats: GameStats,
    adjustedScore: number,
    result: MapExploreFlightResult,
  ): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress) return;

    const region = this.getRegion(regionId);
    if (!region) return;

    region.buildingClusterIds.forEach((clusterId) => {
      const status = regionProgress.buildingClusterStatuses[clusterId];
      if (status !== 'unlocked') return;

      const cluster = this.getBuildingCluster(clusterId);
      if (!cluster) return;

      const condition = cluster.explorationCondition;
      let explored = false;

      switch (condition.type) {
        case 'distance':
          explored = stats.distance >= condition.target;
          break;
        case 'height':
          explored = stats.maxHeight >= condition.target;
          break;
        case 'score':
          explored = adjustedScore >= condition.target;
          break;
        case 'aircurrent_count':
          explored = stats.airCurrentCount >= condition.target;
          break;
        case 'no_collision':
          explored = stats.collisions === 0;
          break;
        default:
          break;
      }

      if (explored) {
        regionProgress.buildingClusterStatuses[clusterId] = 'completed';
        result.newlyExploredBuildingClusters.push({
          id: clusterId,
          name: cluster.name,
          rewardCoins: cluster.rewardCoins,
          rewardScore: cluster.rewardScore || 0,
        });
        result.totalRewardCoins += cluster.rewardCoins;
        result.totalRewardScore += cluster.rewardScore || 0;

        const clusterIds = region.buildingClusterIds;
        const currentIdx = clusterIds.indexOf(clusterId);
        if (currentIdx >= 0 && currentIdx < clusterIds.length - 1) {
          const nextId = clusterIds[currentIdx + 1];
          if (regionProgress.buildingClusterStatuses[nextId] === 'locked') {
            regionProgress.buildingClusterStatuses[nextId] = 'unlockable';
          }
        }
      }
    });
  }

  private checkRareAirCurrentDiscovery(
    regionId: string,
    stats: GameStats,
    adjustedScore: number,
    result: MapExploreFlightResult,
  ): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress) return;

    const region = this.getRegion(regionId);
    if (!region) return;

    region.rareAirCurrentIds.forEach((racId) => {
      if (regionProgress.rareAirCurrentStatuses[racId] !== 'undiscovered') return;

      const rac = this.getRareAirCurrent(racId);
      if (!rac) return;

      let shouldDiscover = false;

      switch (rac.regionId) {
        case 'region_old_town':
          if (stats.distance >= 300) shouldDiscover = true;
          break;
        case 'region_riverside':
          if (stats.collisions === 0 || stats.maxHeight >= 150) shouldDiscover = true;
          break;
        case 'region_mountain_peak':
          if (stats.maxHeight >= 250 || stats.airCurrentCount >= 3 || regionProgress.totalFlightsInRegion >= 2) shouldDiscover = true;
          break;
        case 'region_industrial':
          if (adjustedScore >= 3000) shouldDiscover = true;
          break;
        case 'region_ancient_ruins':
          if (stats.distance >= 800) shouldDiscover = true;
          break;
        case 'region_sky_island':
          if (regionProgress.totalFlightsInRegion >= 2 || stats.maxHeight >= 500 || adjustedScore >= 10000) shouldDiscover = true;
          break;
      }

      if (shouldDiscover) {
        regionProgress.rareAirCurrentStatuses[racId] = 'discovered';
        result.newlyDiscoveredAirCurrents.push({
          id: racId,
          name: rac.name,
        });
      }
    });
  }

  private checkRareAirCurrentCapture(
    regionId: string,
    stats: GameStats,
    adjustedScore: number,
    result: MapExploreFlightResult,
  ): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress) return;

    const region = this.getRegion(regionId);
    if (!region) return;

    region.rareAirCurrentIds.forEach((racId) => {
      if (regionProgress.rareAirCurrentStatuses[racId] !== 'discovered') return;

      const rac = this.getRareAirCurrent(racId);
      if (!rac) return;

      const condition = rac.captureCondition;
      let captured = false;

      switch (condition.type) {
        case 'distance':
          captured = stats.distance >= condition.target;
          break;
        case 'height':
          captured = stats.maxHeight >= condition.target;
          break;
        case 'score':
          captured = adjustedScore >= condition.target;
          break;
        case 'aircurrent_count':
          captured = stats.airCurrentCount >= condition.target;
          break;
        case 'no_collision':
          captured = stats.collisions === 0;
          break;
        default:
          break;
      }

      if (captured) {
        regionProgress.rareAirCurrentStatuses[racId] = 'captured';
        this.state.totalRareCurrentsCaptured += 1;
        result.newlyCapturedAirCurrents.push({
          id: racId,
          name: rac.name,
          rewardCoins: rac.rewardCoins,
          captureScore: rac.captureScore,
        });
        result.totalRewardCoins += rac.rewardCoins;
        result.totalRewardScore += rac.captureScore;

        const racIds = region.rareAirCurrentIds;
        const currentIdx = racIds.indexOf(racId);
        if (currentIdx >= 0 && currentIdx < racIds.length - 1) {
          const nextId = racIds[currentIdx + 1];
          if (regionProgress.rareAirCurrentStatuses[nextId] === 'undiscovered') {
            regionProgress.rareAirCurrentStatuses[nextId] = 'discovered';
          }
        }
      }
    });
  }

  private updateStageProgress(regionId: string, stats: GameStats, adjustedScore: number): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress) return;

    const region = this.getRegion(regionId);
    if (!region) return;

    region.stageIds.forEach((stageId) => {
      const stageStatus = regionProgress.stageStatuses[stageId];
      if (stageStatus !== 'active') return;

      const stage = this.getStage(stageId);
      if (!stage) return;

      if (!regionProgress.stageProgress[stageId]) {
        regionProgress.stageProgress[stageId] = {};
      }

      const progress = regionProgress.stageProgress[stageId];

      stage.objectives.forEach((obj) => {
        let value = 0;
        switch (obj.type) {
          case 'distance':
            value = stats.distance;
            break;
          case 'height':
            value = stats.maxHeight;
            break;
          case 'score':
            value = adjustedScore;
            break;
          case 'aircurrent_count':
            value = stats.airCurrentCount;
            break;
          case 'no_collision':
            value = stats.collisions === 0 ? 1 : 0;
            break;
          case 'explore_buildings': {
            const completedCount = Object.values(regionProgress.buildingClusterStatuses)
              .filter((s) => s === 'completed').length;
            value = completedCount;
            break;
          }
          case 'capture_rare_current': {
            const capturedCount = Object.values(regionProgress.rareAirCurrentStatuses)
              .filter((s) => s === 'captured').length;
            value = capturedCount;
            break;
          }
          case 'complete_story': {
            const completedStories = Object.values(regionProgress.storyEventStatuses)
              .filter((s) => s === 'completed').length;
            value = completedStories;
            break;
          }
        }

        progress[obj.type] = Math.max(progress[obj.type] || 0, value);
      });
    });
  }

  private checkStageCompletion(regionId: string, result: MapExploreFlightResult): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress) return;

    const region = this.getRegion(regionId);
    if (!region) return;

    region.stageIds.forEach((stageId) => {
      const stageStatus = regionProgress.stageStatuses[stageId];
      if (stageStatus !== 'active') return;

      const stage = this.getStage(stageId);
      if (!stage) return;

      const progress = regionProgress.stageProgress[stageId] || {};
      const allComplete = stage.objectives.every(
        (obj) => (progress[obj.type] || 0) >= obj.target
      );

      if (allComplete) {
        regionProgress.stageStatuses[stageId] = 'completed';
        this.state.totalStagesCompleted += 1;
        result.newlyCompletedStages.push({
          id: stageId,
          name: stage.name,
          rewardCoins: stage.rewardCoins,
          rewardScore: stage.rewardScore,
        });

        const stageIdx = region.stageIds.indexOf(stageId);
        if (stageIdx >= 0 && stageIdx < region.stageIds.length - 1) {
          const nextStageId = region.stageIds[stageIdx + 1];
          if (regionProgress.stageStatuses[nextStageId] === 'locked') {
            regionProgress.stageStatuses[nextStageId] = 'active';
          }
        }
      }
    });
  }

  public settleStage(stageId: string): StageSettlementResult | null {
    const stage = this.getStage(stageId);
    if (!stage) return null;

    const regionProgress = this.state.regionProgress[stage.regionId];
    if (!regionProgress || regionProgress.stageStatuses[stageId] !== 'completed') return null;

    const progress = regionProgress.stageProgress[stageId] || {};

    const objectives = stage.objectives.map((obj) => ({
      description: obj.description,
      current: progress[obj.type] || 0,
      target: obj.target,
      achieved: (progress[obj.type] || 0) >= obj.target,
    }));

    const allAchieved = objectives.every((o) => o.achieved);
    if (!allAchieved) return null;

    let bonusAchieved = false;
    if (stage.bonusCondition) {
      bonusAchieved = this.checkBonusCondition(stage, regionProgress, progress);
    }

    regionProgress.stageStatuses[stageId] = 'claimed';

    const baseRewardCoins = stage.rewardCoins;
    const bonusRewardCoins = bonusAchieved ? (stage.bonusRewardCoins || 0) : 0;
    const totalRewardCoins = baseRewardCoins + bonusRewardCoins;
    const totalRewardScore = stage.rewardScore;

    regionProgress.totalScoreInRegion += totalRewardScore;
    if (regionProgress.totalScoreInRegion > regionProgress.bestScoreInRegion) {
      regionProgress.bestScoreInRegion = regionProgress.totalScoreInRegion;
    }

    const result: StageSettlementResult = {
      stageId,
      stageName: stage.name,
      completed: true,
      objectives,
      baseRewardCoins,
      bonusAchieved,
      bonusRewardCoins,
      totalRewardCoins,
      scoreReward: totalRewardScore,
    };

    this.state.lastSettlementResults.push(result);
    if (this.state.lastSettlementResults.length > 10) {
      this.state.lastSettlementResults = this.state.lastSettlementResults.slice(-10);
    }

    this.checkRegionCompletion(stage.regionId);
    this.recalculateExploration();
    this.saveToLocalStorage();

    return result;
  }

  private checkBonusCondition(
    stage: Stage,
    regionProgress: RegionProgress,
    progress: Record<string, number>,
  ): boolean {
    if (!stage.bonusCondition) return false;

    switch (stage.bonusCondition) {
      case '零碰撞完成':
        return (progress['no_collision'] || 0) >= 1;
      case '完成剧情事件':
        return Object.values(regionProgress.storyEventStatuses).some((s) => s === 'completed');
      case '单次得分超过3000':
        return (progress['score'] || 0) >= 3000;
      case '零碰撞且飞行500米':
        return (progress['no_collision'] || 0) >= 1 && (progress['distance'] || 0) >= 500;
      case '得分超过5000':
        return (progress['score'] || 0) >= 5000;
      case '得分超过10000':
        return (progress['score'] || 0) >= 10000;
      case '探索3个建筑群':
        return Object.values(regionProgress.buildingClusterStatuses).filter((s) => s === 'completed').length >= 3;
      case '零碰撞飞行':
        return (progress['no_collision'] || 0) >= 1;
      case '全部剧情完成':
        return Object.values(regionProgress.storyEventStatuses).every((s) => s === 'completed');
      default:
        return false;
    }
  }

  private checkRegionCompletion(regionId: string): void {
    const regionProgress = this.state.regionProgress[regionId];
    if (!regionProgress || regionProgress.status !== 'unlocked') return;

    const region = this.getRegion(regionId);
    if (!region) return;

    const allBuildingsExplored = region.buildingClusterIds.every(
      (id) => regionProgress.buildingClusterStatuses[id] === 'completed'
    );
    const allRarCurrentsCaptured = region.rareAirCurrentIds.every(
      (id) => regionProgress.rareAirCurrentStatuses[id] === 'captured'
    );
    const allStoriesCompleted = region.storyEventIds.every(
      (id) => regionProgress.storyEventStatuses[id] === 'completed'
    );
    const allStagesClaimed = region.stageIds.every(
      (id) => regionProgress.stageStatuses[id] === 'claimed'
    );

    if (allBuildingsExplored && allRarCurrentsCaptured && allStoriesCompleted && allStagesClaimed) {
      regionProgress.status = 'completed';
      this.updateAdjacentRegions();
    }
  }

  public setCurrentRegion(regionId: string | null): void {
    this.state.currentRegionId = regionId;
  }

  public getGameConfigOverride(regionId: string) {
    const region = this.getRegion(regionId);
    if (!region) return null;

    return {
      worldSize: region.worldSize,
      gravity: region.gravity,
      airCurrentSpawnRate: region.airCurrentSpawnRate,
      minAirCurrentStrength: region.minAirCurrentStrength,
      maxAirCurrentStrength: region.maxAirCurrentStrength,
      buildingDensity: region.buildingDensity,
      turbulenceLevel: region.turbulenceLevel,
      cloudCoverage: region.cloudCoverage,
    };
  }

  private recalculateExploration(): void {
    let totalItems = 0;
    let completedItems = 0;

    REGIONS.forEach((region) => {
      const progress = this.state.regionProgress[region.id];

      const bcTotal = region.buildingClusterIds.length;
      const bcCompleted = region.buildingClusterIds.filter(
        (id) => progress?.buildingClusterStatuses[id] === 'completed'
      ).length;

      const racTotal = region.rareAirCurrentIds.length;
      const racCaptured = region.rareAirCurrentIds.filter(
        (id) => progress?.rareAirCurrentStatuses[id] === 'captured'
      ).length;

      const seTotal = region.storyEventIds.length;
      const seCompleted = region.storyEventIds.filter(
        (id) => progress?.storyEventStatuses[id] === 'completed'
      ).length;

      const stTotal = region.stageIds.length;
      const stClaimed = region.stageIds.filter(
        (id) => progress?.stageStatuses[id] === 'claimed'
      ).length;

      const regionTotal = bcTotal + racTotal + seTotal + stTotal;
      const regionCompleted = bcCompleted + racCaptured + seCompleted + stClaimed;

      totalItems += regionTotal;
      completedItems += regionCompleted;

      if (progress) {
        progress.explorationPercent = regionTotal > 0
          ? Math.floor((regionCompleted / regionTotal) * 100)
          : 0;
      }
    });

    this.state.totalExplorationPercent = totalItems > 0
      ? Math.floor((completedItems / totalItems) * 100)
      : 0;
  }

  public getRegionConfigForFlight(regionId: string) {
    const region = this.getRegion(regionId);
    if (!region) return null;

    return {
      regionId: region.id,
      regionName: region.name,
      worldSize: region.worldSize,
      gravity: region.gravity,
      airCurrentSpawnRate: region.airCurrentSpawnRate,
      minAirCurrentStrength: region.minAirCurrentStrength,
      maxAirCurrentStrength: region.maxAirCurrentStrength,
      buildingDensity: region.buildingDensity,
      turbulenceLevel: region.turbulenceLevel,
      cloudCoverage: region.cloudCoverage,
    };
  }

  public reset(): void {
    this.state = createDefaultMapExploreState();
    this.saveToLocalStorage();
  }

  public saveToLocalStorage(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save map explore data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved) as MapExploreState;

      if (data.regionProgress) {
        const defaultState = createDefaultMapExploreState();
        REGIONS.forEach((region) => {
          if (data.regionProgress[region.id]) {
            this.state.regionProgress[region.id] = {
              ...defaultState.regionProgress[region.id],
              ...data.regionProgress[region.id],
            };
          }
        });
      }

      if (data.totalExplorationPercent !== undefined) {
        this.state.totalExplorationPercent = data.totalExplorationPercent;
      }
      if (data.totalRegionsUnlocked !== undefined) {
        this.state.totalRegionsUnlocked = data.totalRegionsUnlocked;
      }
      if (data.totalBuildingClustersUnlocked !== undefined) {
        this.state.totalBuildingClustersUnlocked = data.totalBuildingClustersUnlocked;
      }
      if (data.totalRareCurrentsCaptured !== undefined) {
        this.state.totalRareCurrentsCaptured = data.totalRareCurrentsCaptured;
      }
      if (data.totalStoryEventsCompleted !== undefined) {
        this.state.totalStoryEventsCompleted = data.totalStoryEventsCompleted;
      }
      if (data.totalStagesCompleted !== undefined) {
        this.state.totalStagesCompleted = data.totalStagesCompleted;
      }
      if (data.currentRegionId !== undefined) {
        this.state.currentRegionId = data.currentRegionId;
      }
      if (data.activeStoryEventId !== undefined) {
        this.state.activeStoryEventId = data.activeStoryEventId;
      }
      if (data.activeStoryDialogueIndex !== undefined) {
        this.state.activeStoryDialogueIndex = data.activeStoryDialogueIndex;
      }
      if (data.lastSettlementResults) {
        this.state.lastSettlementResults = data.lastSettlementResults;
      }

      this.recalculateExploration();
      return true;
    } catch (e) {
      console.error('Failed to load map explore data:', e);
      return false;
    }
  }
}

export const mapExploreEngine = new MapExploreEngine();
