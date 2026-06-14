import React from 'react';
import type { Region, RegionProgress } from '../types';
import { REGION_TERRAIN_NAMES, REGION_STATUS_NAMES } from '../types';

interface RegionMapProps {
  regions: Region[];
  regionProgress: Record<string, RegionProgress>;
  currentRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onUnlockRegion: (regionId: string) => void;
  totalExplorationPercent: number;
}

export const RegionMap: React.FC<RegionMapProps> = ({
  regions,
  regionProgress,
  currentRegionId,
  onSelectRegion,
  onUnlockRegion,
  totalExplorationPercent,
}) => {
  return (
    <div className="me-region-map">
      <div className="me-region-map-header">
        <div className="me-region-map-title">🗺️ 探索地图</div>
        <div className="me-region-map-progress">
          总探索度 <span className="me-progress-value">{totalExplorationPercent}%</span>
        </div>
      </div>
      <div className="me-region-map-progress-bar">
        <div
          className="me-region-map-progress-fill"
          style={{ width: `${totalExplorationPercent}%` }}
        />
      </div>
      <div className="me-region-map-canvas">
        <svg viewBox="0 0 700 420" className="me-region-svg">
          <defs>
            {regions.map((region) => (
              <radialGradient key={`grad-${region.id}`} id={`grad-${region.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={region.secondaryColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={region.primaryColor} stopOpacity="0.15" />
              </radialGradient>
            ))}
          </defs>

          {regions.map((region) => {
            const progress = regionProgress[region.id];
            const status = progress?.status || 'locked';
            const isCurrent = currentRegionId === region.id;
            const isLocked = status === 'locked';
            const isUnlockable = status === 'unlockable';

            return (
              <g
                key={region.id}
                className={`me-region-node ${isLocked ? 'locked' : ''} ${isCurrent ? 'current' : ''} ${isUnlockable ? 'unlockable' : ''}`}
                onClick={() => {
                  if (isUnlockable) {
                    onUnlockRegion(region.id);
                  } else if (!isLocked) {
                    onSelectRegion(region.id);
                  }
                }}
              >
                <circle
                  cx={region.position.x}
                  cy={region.position.y}
                  r={isLocked ? 38 : 42}
                  fill={isLocked ? 'rgba(50,50,60,0.6)' : `url(#grad-${region.id})`}
                  stroke={isCurrent ? '#fbbf24' : isUnlockable ? '#22c55e' : isLocked ? '#4b5563' : region.primaryColor}
                  strokeWidth={isCurrent ? 3 : 2}
                  strokeDasharray={isLocked ? '4 4' : undefined}
                  opacity={isLocked ? 0.5 : 1}
                />
                {isCurrent && (
                  <circle
                    cx={region.position.x}
                    cy={region.position.y}
                    r={48}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth={1}
                    opacity={0.5}
                  >
                    <animate attributeName="r" from="44" to="52" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <text
                  x={region.position.x}
                  y={region.position.y - 8}
                  textAnchor="middle"
                  className="me-region-icon"
                  fontSize="22"
                >
                  {isLocked ? '🔒' : region.icon}
                </text>
                <text
                  x={region.position.x}
                  y={region.position.y + 14}
                  textAnchor="middle"
                  className="me-region-name"
                  fill={isLocked ? '#6b7280' : '#e5e7eb'}
                  fontSize="11"
                  fontWeight="bold"
                >
                  {region.name}
                </text>
                <text
                  x={region.position.x}
                  y={region.position.y + 27}
                  textAnchor="middle"
                  className="me-region-status"
                  fill={status === 'completed' ? '#22c55e' : status === 'unlocked' ? '#3b82f6' : '#6b7280'}
                  fontSize="9"
                >
                  {isUnlockable ? `${region.unlockCost}🪙解锁` : REGION_STATUS_NAMES[status]}
                </text>
                {!isLocked && progress && (
                  <text
                    x={region.position.x}
                    y={region.position.y + 38}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="8"
                  >
                    {progress.explorationPercent}%
                  </text>
                )}
              </g>
            );
          })}

          {regions.map((region) => {
            const progress = regionProgress[region.id];
            const isUnlocked = progress?.status === 'unlocked' || progress?.status === 'completed';
            if (!isUnlocked || !region.unlockCondition) return null;

            const fromRegion = regions.find((r) => r.id === region.unlockCondition);
            if (!fromRegion) return null;

            return (
              <line
                key={`conn-${region.id}`}
                x1={fromRegion.position.x}
                y1={fromRegion.position.y}
                x2={region.position.x}
                y2={region.position.y}
                stroke="#4b5563"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.4}
              />
            );
          })}
        </svg>
      </div>

      <div className="me-region-legend">
        <div className="me-legend-item">
          <span className="me-legend-dot locked" /> 未解锁
        </div>
        <div className="me-legend-item">
          <span className="me-legend-dot unlockable" /> 可解锁
        </div>
        <div className="me-legend-item">
          <span className="me-legend-dot unlocked" /> 已解锁
        </div>
        <div className="me-legend-item">
          <span className="me-legend-dot completed" /> 已完成
        </div>
      </div>
    </div>
  );
};
