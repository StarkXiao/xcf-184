import React from 'react';
import type { RareAirCurrent, RareAirCurrentStatus } from '../types';
import { RARE_AIR_CURRENT_TYPE_NAMES } from '../types';

interface RareAirCurrentPanelProps {
  currents: RareAirCurrent[];
  currentStatuses: Record<string, RareAirCurrentStatus>;
  onStartFlight: (regionId: string) => void;
}

export const RareAirCurrentPanel: React.FC<RareAirCurrentPanelProps> = ({
  currents,
  currentStatuses,
  onStartFlight,
}) => {
  return (
    <div className="me-rare-current-panel">
      <div className="me-section-header">
        <div className="me-section-title">
          <span>🌀</span> 稀有气流
        </div>
      </div>
      <div className="me-rare-current-list">
        {currents.map((rac) => {
          const status = currentStatuses[rac.id] || 'undiscovered';
          const isUndiscovered = status === 'undiscovered';
          const isDiscovered = status === 'discovered';
          const isCaptured = status === 'captured';

          return (
            <div key={rac.id} className={`me-rac-card ${status}`}>
              <div className="me-rac-icon">
                {isUndiscovered ? '❓' : rac.icon}
              </div>
              <div className="me-rac-info">
                <div className="me-rac-name">
                  {isUndiscovered ? '未发现的气流' : rac.name}
                </div>
                {!isUndiscovered && (
                  <>
                    <div className="me-rac-desc">{rac.description}</div>
                    <div className="me-rac-type">
                      {RARE_AIR_CURRENT_TYPE_NAMES[rac.type]}
                    </div>
                    <div className="me-rac-meta">
                      <span>💪 强度 {Math.round(rac.strength * 100)}%</span>
                      <span>⏱️ 持续 {rac.duration}秒</span>
                      <span>🎯 捕获得分 {rac.captureScore}</span>
                    </div>
                    <div className="me-rac-discovery">
                      发现条件：{rac.discoveryCondition}
                    </div>
                    <div className="me-rac-capture-condition">
                      捕获条件：{rac.captureCondition.description}
                    </div>
                  </>
                )}
                {isDiscovered && (
                  <button
                    className="me-rac-capture-btn"
                    onClick={() => onStartFlight(rac.regionId)}
                  >
                    ✈️ 前往飞行捕获
                  </button>
                )}
                {isCaptured && (
                  <div className="me-rac-captured">✅ 已捕获</div>
                )}
              </div>
              <div className="me-rac-reward">
                🪙 {rac.rewardCoins}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
