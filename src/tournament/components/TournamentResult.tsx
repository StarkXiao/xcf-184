import React from 'react';
import type { TrackResult } from '../types';
import { RANK_TIER_COLORS } from '../types';

interface TournamentResultProps {
  result: TrackResult;
  trackName: string;
  onRestart: () => void;
  onBack: () => void;
}

export const TournamentResult: React.FC<TournamentResultProps> = ({
  result,
  trackName,
  onRestart,
  onBack,
}) => {
  const tierColor = RANK_TIER_COLORS[result.rank];

  return (
    <div className="tournament-result">
      <div
        className="result-rank-circle"
        style={{ borderColor: tierColor, color: tierColor }}
      >
        {result.rank}
      </div>

      <div className="result-track-name">{trackName}</div>
      <div className="result-subtitle">
        {result.mastered ? '⭐ 完美通关！' : '赛道完成'}
      </div>

      <div className="result-score-section">
        <div className="result-score-label">最终得分</div>
        <div className="result-score-value" style={{ color: tierColor }}>
          {result.score.toLocaleString()}
        </div>
      </div>

      <div className="result-detail-grid">
        <div className="result-detail-item">
          <div className="result-detail-label">最佳记录</div>
          <div className="result-detail-value">{result.bestScore.toLocaleString()}</div>
        </div>
        <div className="result-detail-item">
          <div className="result-detail-label">尝试次数</div>
          <div className="result-detail-value">{result.attempts}</div>
        </div>
        <div className="result-detail-item">
          <div className="result-detail-label">评级</div>
          <div className="result-detail-value" style={{ color: tierColor }}>
            {result.rank}
          </div>
        </div>
      </div>

      <div className="result-coins">
        <span className="result-coins-icon">🪙</span>
        <span className="result-coins-text">+{result.coinReward.toLocaleString()} 金币</span>
      </div>

      <div className="result-buttons">
        <button className="result-btn-secondary" onClick={onBack}>
          返回赛事
        </button>
        <button className="result-btn-primary" onClick={onRestart}>
          再来一次
        </button>
      </div>
    </div>
  );
};
