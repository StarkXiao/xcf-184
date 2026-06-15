import React from 'react';
import type { BuildingCluster, BuildingClusterStatus } from '../types';
import { BUILDING_CLUSTER_STATUS_NAMES } from '../types';

interface BuildingClusterPanelProps {
  clusters: BuildingCluster[];
  clusterStatuses: Record<string, BuildingClusterStatus>;
  onUnlock: (clusterId: string) => void;
}

export const BuildingClusterPanel: React.FC<BuildingClusterPanelProps> = ({
  clusters,
  clusterStatuses,
  onUnlock,
}) => {
  return (
    <div className="me-building-cluster-panel">
      <div className="me-section-header">
        <div className="me-section-title">
          <span>🏗️</span> 建筑群
        </div>
      </div>
      <div className="me-building-cluster-grid">
        {clusters.map((cluster) => {
          const status = clusterStatuses[cluster.id] || 'locked';
          const isLocked = status === 'locked';
          const isUnlockable = status === 'unlockable';
          const isUnlocked = status === 'unlocked';
          const isCompleted = status === 'completed';

          return (
            <div
              key={cluster.id}
              className={`me-bc-card ${status}`}
            >
              <div className="me-bc-icon">{isLocked ? '🔒' : cluster.icon}</div>
              <div className="me-bc-info">
                <div className="me-bc-name">{cluster.name}</div>
                <div className="me-bc-desc">{cluster.description}</div>
                <div className="me-bc-meta">
                  <span className="me-bc-meta-item">🏢 {cluster.buildingCount}栋</span>
                  <span className="me-bc-meta-item">📏 {cluster.minHeight}-{cluster.maxHeight}m</span>
                  {cluster.specialEffect && (
                    <span className="me-bc-meta-item special">✨ 特殊效果</span>
                  )}
                </div>
                <div className="me-bc-condition">
                  <span className="me-bc-condition-label">探索条件：</span>
                  <span className="me-bc-condition-text">{cluster.explorationCondition.description}</span>
                </div>
                {isUnlockable && (
                  <button className="me-bc-unlock-btn" onClick={() => onUnlock(cluster.id)}>
                    🔓 解锁 {cluster.unlockCost > 0 ? `(${cluster.unlockCost}🪙)` : '免费'}
                  </button>
                )}
                {isUnlocked && (
                  <div className="me-bc-unlocked-hint">
                    🎯 已解锁 — 在区域飞行中满足探索条件即可完成
                  </div>
                )}
                {isCompleted && (
                  <div className="me-bc-completed">✅ 已探索</div>
                )}
                {isLocked && (
                  <div className="me-bc-locked-hint">{BUILDING_CLUSTER_STATUS_NAMES[status]}</div>
                )}
              </div>
              <div className="me-bc-reward">
                🪙 {cluster.rewardCoins}
                {cluster.rewardScore && (
                  <span className="me-bc-reward-score"> ⭐ {cluster.rewardScore}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
