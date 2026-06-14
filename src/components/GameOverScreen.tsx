import React from 'react';
import type { GameStats } from '../game/types';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  onRestart,
  onMainMenu,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRank = (score: number): { rank: string; color: string } => {
    if (score >= 5000) return { rank: 'S', color: '#ffd700' };
    if (score >= 3000) return { rank: 'A', color: '#ff6b6b' };
    if (score >= 1500) return { rank: 'B', color: '#4ecdc4' };
    if (score >= 500) return { rank: 'C', color: '#95e1d3' };
    return { rank: 'D', color: '#aaaaaa' };
  };

  const { rank, color } = getRank(stats.score);

  return (
    <div className="menu-overlay gameover-overlay">
      <div className="menu-content gameover-content">
        <div className="gameover-icon">
          <svg viewBox="0 0 100 100" width="60" height="60">
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="4" />
            <text
              x="50"
              y="65"
              textAnchor="middle"
              fontSize="48"
              fontWeight="bold"
              fill={color}
            >
              {rank}
            </text>
          </svg>
        </div>

        <h2 className="gameover-title">游戏结束</h2>
        <p className="gameover-subtitle">风筝已降落</p>

        <div className="final-score">
          <div className="final-score-label">最终得分</div>
          <div className="final-score-value" style={{ color }}>
            {stats.score.toLocaleString()}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-icon">⏱</div>
            <div className="stat-info">
              <div className="stat-name">飞行时间</div>
              <div className="stat-number">{formatTime(stats.time)}</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">📏</div>
            <div className="stat-info">
              <div className="stat-name">飞行距离</div>
              <div className="stat-number">{Math.floor(stats.distance)}m</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">🏔</div>
            <div className="stat-info">
              <div className="stat-name">最高高度</div>
              <div className="stat-number">{Math.floor(stats.maxHeight)}m</div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-icon">💨</div>
            <div className="stat-info">
              <div className="stat-name">气流捕获</div>
              <div className="stat-number">{stats.airCurrentCount}</div>
            </div>
          </div>
        </div>

        <div className="gameover-buttons">
          <button className="menu-button primary" onClick={onRestart}>
            再来一次
          </button>
          <button className="menu-button" onClick={onMainMenu}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
};
