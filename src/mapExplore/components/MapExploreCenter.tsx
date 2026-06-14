import React, { useState } from 'react';
import { useMapExplore } from '../useMapExplore';
import { mapExploreEngine } from '../mapExploreEngine';
import { RegionMap } from './RegionMap';
import { BuildingClusterPanel } from './BuildingClusterPanel';
import { RareAirCurrentPanel } from './RareAirCurrentPanel';
import { StoryEventPanel } from './StoryEventPanel';
import { StageSettlementPanel } from './StageSettlementPanel';
import type { Region } from '../types';

type TabType = 'map' | 'buildings' | 'currents' | 'stories' | 'stages';

const TABS: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'map', label: '探索地图', icon: '🗺️' },
  { id: 'buildings', label: '建筑群', icon: '🏗️' },
  { id: 'currents', label: '稀有气流', icon: '🌀' },
  { id: 'stories', label: '剧情事件', icon: '📖' },
  { id: 'stages', label: '阶段目标', icon: '📋' },
];

interface MapExploreCenterProps {
  onClose: () => void;
  onStartFlight: (regionId: string) => void;
  onAddCoins: (amount: number) => void;
}

export const MapExploreCenter: React.FC<MapExploreCenterProps> = ({
  onClose,
  onStartFlight,
  onAddCoins,
}) => {
  const explore = useMapExplore();
  const [activeTab, setActiveTab] = useState<TabType>('map');
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);

  const regions = mapExploreEngine.getRegions();
  const selectedRegion = selectedRegionId ? mapExploreEngine.getRegion(selectedRegionId) : null;
  const selectedProgress = selectedRegionId ? explore.state.regionProgress[selectedRegionId] : null;

  const handleUnlockRegion = (regionId: string) => {
    const region = mapExploreEngine.getRegion(regionId);
    if (!region) return;
    explore.unlockRegion(regionId, () => {
      onAddCoins(-region.unlockCost);
      return true;
    });
  };

  const handleUnlockBuildingCluster = (clusterId: string) => {
    const cluster = mapExploreEngine.getBuildingCluster(clusterId);
    if (!cluster) return;
    explore.unlockBuildingCluster(clusterId, () => {
      onAddCoins(-cluster.unlockCost);
      return true;
    });
  };

  const handleExploreBuildingCluster = (clusterId: string) => {
    const cluster = mapExploreEngine.getBuildingCluster(clusterId);
    if (!cluster) return;
    explore.completeBuildingCluster(clusterId);
    onAddCoins(cluster.rewardCoins);
    if (cluster.rewardScore) {
      onStartFlight(cluster.regionId);
    }
  };

  const handleSettleStage = (stageId: string) => {
    const result = explore.settleStage(stageId);
    if (result) {
      onAddCoins(result.totalRewardCoins);
    }
  };

  const handleSelectRegion = (regionId: string) => {
    setSelectedRegionId(regionId);
    const region = mapExploreEngine.getRegion(regionId);
    if (region) {
      const isUnlocked = explore.state.regionProgress[regionId]?.status === 'unlocked'
        || explore.state.regionProgress[regionId]?.status === 'completed';
      if (isUnlocked && activeTab === 'map') {
        setActiveTab('buildings');
      }
    }
  };

  const regionStats = selectedRegion && selectedProgress ? (
    <div className="me-region-stats">
      <div className="me-region-stats-header" style={{ background: `linear-gradient(135deg, ${selectedRegion.primaryColor}, ${selectedRegion.secondaryColor})` }}>
        <div className="me-region-stats-icon">{selectedRegion.icon}</div>
        <div className="me-region-stats-info">
          <div className="me-region-stats-name">{selectedRegion.name}</div>
          <div className="me-region-stats-desc">{selectedRegion.description}</div>
        </div>
        <button className="me-region-fly-btn" onClick={() => onStartFlight(selectedRegion.id)}>
          ✈️ 飞行
        </button>
      </div>
      <div className="me-region-stats-grid">
        <div className="me-stat-item">
          <div className="me-stat-value">{selectedProgress.explorationPercent}%</div>
          <div className="me-stat-label">探索度</div>
        </div>
        <div className="me-stat-item">
          <div className="me-stat-value">{selectedProgress.totalFlightsInRegion}</div>
          <div className="me-stat-label">飞行次数</div>
        </div>
        <div className="me-stat-item">
          <div className="me-stat-value">{Math.floor(selectedProgress.bestScoreInRegion)}</div>
          <div className="me-stat-label">最高得分</div>
        </div>
        <div className="me-stat-item">
          <div className="me-stat-value">{Math.floor(selectedProgress.totalDistanceInRegion)}m</div>
          <div className="me-stat-label">总飞行距离</div>
        </div>
      </div>
    </div>
  ) : null;

  const unlockedRegions = regions.filter(
    (r) => explore.state.regionProgress[r.id]?.status === 'unlocked'
      || explore.state.regionProgress[r.id]?.status === 'completed'
  );

  return (
    <div className="me-overlay">
      <div className="me-content">
        <div className="me-header">
          <div className="me-title">
            <span className="me-title-icon">🗺️</span>
            地图探索
          </div>
          <div className="me-global-stats">
            <span>🗺️ {explore.state.totalRegionsUnlocked}/{regions.length} 区域</span>
            <span>🏗️ {explore.state.totalBuildingClustersUnlocked} 建筑</span>
            <span>🌀 {explore.state.totalRareCurrentsCaptured} 气流</span>
            <span>📖 {explore.state.totalStoryEventsCompleted} 剧情</span>
          </div>
          <button className="me-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="me-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`me-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="me-body">
          {activeTab === 'map' && (
            <>
              <RegionMap
                regions={regions}
                regionProgress={explore.state.regionProgress}
                currentRegionId={explore.state.currentRegionId}
                onSelectRegion={handleSelectRegion}
                onUnlockRegion={handleUnlockRegion}
                totalExplorationPercent={explore.state.totalExplorationPercent}
              />
              {regionStats}
            </>
          )}

          {activeTab === 'buildings' && (
            <div>
              {unlockedRegions.length === 0 ? (
                <div className="me-empty">暂无已解锁区域，请先在探索地图中解锁区域</div>
              ) : (
                unlockedRegions.map((region) => {
                  const clusters = mapExploreEngine.getBuildingClustersForRegion(region.id);
                  const progress = explore.state.regionProgress[region.id];
                  if (!progress || clusters.length === 0) return null;

                  return (
                    <div key={region.id} className="me-region-section">
                      <div className="me-region-section-header" style={{ borderLeftColor: region.primaryColor }}>
                        {region.icon} {region.name}
                      </div>
                      <BuildingClusterPanel
                        clusters={clusters}
                        clusterStatuses={progress.buildingClusterStatuses}
                        onUnlock={handleUnlockBuildingCluster}
                        onExplore={handleExploreBuildingCluster}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'currents' && (
            <div>
              {unlockedRegions.length === 0 ? (
                <div className="me-empty">暂无已解锁区域</div>
              ) : (
                unlockedRegions.map((region) => {
                  const currents = mapExploreEngine.getRareAirCurrentsForRegion(region.id);
                  const progress = explore.state.regionProgress[region.id];
                  if (!progress || currents.length === 0) return null;

                  return (
                    <div key={region.id} className="me-region-section">
                      <div className="me-region-section-header" style={{ borderLeftColor: region.primaryColor }}>
                        {region.icon} {region.name}
                      </div>
                      <RareAirCurrentPanel
                        currents={currents}
                        currentStatuses={progress.rareAirCurrentStatuses}
                        onStartFlight={(regionId) => onStartFlight(regionId)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'stories' && (
            <div>
              {unlockedRegions.length === 0 ? (
                <div className="me-empty">暂无已解锁区域</div>
              ) : (
                unlockedRegions.map((region) => {
                  const events = mapExploreEngine.getStoryEventsForRegion(region.id);
                  const progress = explore.state.regionProgress[region.id];
                  if (!progress || events.length === 0) return null;

                  return (
                    <div key={region.id} className="me-region-section">
                      <div className="me-region-section-header" style={{ borderLeftColor: region.primaryColor }}>
                        {region.icon} {region.name}
                      </div>
                      <StoryEventPanel
                        events={events}
                        eventStatuses={progress.storyEventStatuses}
                        activeEventId={explore.state.activeStoryEventId}
                        activeDialogueIndex={explore.state.activeStoryDialogueIndex}
                        onStartEvent={explore.startStoryEvent}
                        onAdvanceDialogue={explore.advanceStoryDialogue}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'stages' && (
            <div>
              {unlockedRegions.length === 0 ? (
                <div className="me-empty">暂无已解锁区域</div>
              ) : (
                unlockedRegions.map((region) => {
                  const stages = mapExploreEngine.getStagesForRegion(region.id);
                  const progress = explore.state.regionProgress[region.id];
                  if (!progress || stages.length === 0) return null;

                  return (
                    <div key={region.id} className="me-region-section">
                      <div className="me-region-section-header" style={{ borderLeftColor: region.primaryColor }}>
                        {region.icon} {region.name}
                      </div>
                      <StageSettlementPanel
                        stages={stages}
                        stageStatuses={progress.stageStatuses}
                        stageProgress={progress.stageProgress}
                        onSettle={handleSettleStage}
                        lastResults={explore.state.lastSettlementResults}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
