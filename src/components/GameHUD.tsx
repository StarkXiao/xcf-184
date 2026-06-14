import React from 'react';
import type { GameStats } from '../game/types';

interface GameHUDProps {
  stats: GameStats;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ stats, onPause }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const heightPercent = Math.min(100, (stats.height / 200) * 100);

  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="stat-card score-card">
          <div className="stat-label">得分</div>
          <div className="stat-value">{stats.score.toLocaleString()}</div>
        </div>

        <div className="stat-card time-card">
          <div className="stat-label">时间</div>
          <div className="stat-value">{formatTime(stats.time)}</div>
        </div>

        <button className="pause-button" onClick={onPause}>
          ⏸
        </button>
      </div>

      <div className="hud-left">
        <div className="altitude-meter">
          <div className="meter-label">高度</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ height: `${heightPercent}%` }}
            />
            <div className="meter-marker">200m</div>
            <div className="meter-marker mid">100m</div>
            <div className="meter-marker low">0m</div>
          </div>
          <div className="meter-value">{Math.floor(stats.height)}m</div>
        </div>
      </div>

      <div className="hud-right">
        <div className="info-panel">
          <div className="info-row">
            <span className="info-label">飞行距离</span>
            <span className="info-value">{Math.floor(stats.distance)}m</span>
          </div>
          <div className="info-row">
            <span className="info-label">最高高度</span>
            <span className="info-value">{Math.floor(stats.maxHeight)}m</span>
          </div>
          <div className="info-row">
            <span className="info-label">气流捕获</span>
            <span className="info-value">{stats.airCurrentCount}</span>
          </div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="shadow-indicator">
          <span className="indicator-label">影子追踪</span>
          <div className="indicator-bar">
            <div className="indicator-glow" />
          </div>
        </div>
      </div>
    </div>
  );
};
