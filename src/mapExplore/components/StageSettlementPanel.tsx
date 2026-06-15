import React from 'react';
import type { Stage, StageStatus, StageSettlementResult } from '../types';
import { STAGE_STATUS_NAMES } from '../types';

interface StageSettlementPanelProps {
  stages: Stage[];
  stageStatuses: Record<string, StageStatus>;
  stageProgress: Record<string, Record<string, number>>;
  onSettle: (stageId: string) => void;
  lastResults: StageSettlementResult[];
}

export const StageSettlementPanel: React.FC<StageSettlementPanelProps> = ({
  stages,
  stageStatuses,
  stageProgress,
  onSettle,
  lastResults,
}) => {
  return (
    <div className="me-stage-settlement-panel">
      <div className="me-section-header">
        <div className="me-section-title">
          <span>📋</span> 阶段目标
        </div>
      </div>
      <div className="me-stage-list">
        {stages.map((stage) => {
          const status = stageStatuses[stage.id] || 'locked';
          const progress = stageProgress[stage.id] || {};
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';
          const isClaimed = status === 'claimed';

          return (
            <div key={stage.id} className={`me-stage-card ${status}`}>
              <div className="me-stage-header">
                <div className="me-stage-icon">{isLocked ? '🔒' : stage.icon}</div>
                <div className="me-stage-title-row">
                  <div className="me-stage-name">
                    {isLocked ? '???' : stage.name}
                  </div>
                  <div className={`me-stage-status-badge ${status}`}>
                    {STAGE_STATUS_NAMES[status]}
                  </div>
                </div>
              </div>
              {!isLocked && (
                <>
                  <div className="me-stage-desc">{stage.description}</div>
                  <div className="me-stage-objectives">
                    {stage.objectives.map((obj, idx) => {
                      const current = progress[obj.type] || 0;
                      const achieved = current >= obj.target;
                      return (
                        <div key={idx} className={`me-stage-obj ${achieved ? 'achieved' : ''}`}>
                          <span className="me-stage-obj-check">
                            {achieved ? '✅' : '⬜'}
                          </span>
                          <span className="me-stage-obj-desc">{obj.description}</span>
                          <span className="me-stage-obj-progress">
                            {Math.min(current, obj.target)} / {obj.target}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {stage.bonusCondition && (
                    <div className="me-stage-bonus">
                      🎁 额外奖励：{stage.bonusCondition}
                      {stage.bonusRewardCoins && ` (+${stage.bonusRewardCoins}🪙)`}
                    </div>
                  )}
                  <div className="me-stage-rewards">
                    <span>🪙 {stage.rewardCoins}</span>
                    <span>⭐ {stage.rewardScore}</span>
                  </div>
                  {isCompleted && (
                    <button className="me-stage-settle-btn" onClick={() => onSettle(stage.id)}>
                      🎉 领取奖励
                    </button>
                  )}
                  {isClaimed && (
                    <div className="me-stage-claimed">✅ 奖励已领取</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {lastResults.length > 0 && (
        <div className="me-stage-results">
          <div className="me-section-subtitle">最近结算</div>
          {lastResults.slice(-3).reverse().map((result, idx) => (
            <div key={idx} className="me-stage-result-card">
              <div className="me-result-title">{result.stageName}</div>
              <div className="me-result-objectives">
                {result.objectives.map((obj, oi) => (
                  <div key={oi} className={`me-result-obj ${obj.achieved ? 'achieved' : ''}`}>
                    {obj.achieved ? '✅' : '❌'} {obj.description}
                  </div>
                ))}
              </div>
              {result.bonusAchieved && (
                <div className="me-result-bonus">🎁 额外奖励达成！+{result.bonusRewardCoins}🪙</div>
              )}
              <div className="me-result-rewards">
                总计 🪙 {result.totalRewardCoins} ⭐ {result.scoreReward}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
