import React from 'react';
import type { GameStats } from '../game/types';

interface GameOverScreenProps {
  stats: GameStats;
  baseStats?: GameStats;
  earnedCoins?: number;
  scoreBonus?: number;
  onRestart: () => void;
  onMainMenu: () => void;
  onWorkshop?: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  baseStats,
  earnedCoins = 0,
  scoreBonus = 0,
  onRestart,
  onMainMenu,
  onWorkshop,
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
          {baseStats && scoreBonus > 0 && (
            <div className="score-bonus-info">
              <span className="bonus-prefix">基础分 {baseStats.score.toLocaleString()}</span>
              <span className="bonus-add">+{scoreBonus}% 改装加成</span>
            </div>
          )}
        </div>

        {earnedCoins > 0 && (
          <div className="coins-earned">
            <span className="coins-icon">🪙</span>
            <span className="coins-text">获得 {earnedCoins.toLocaleString()} 金币</span>
          </div>
        )}

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

        <div className="performance-section">
          <h3 className="section-title">操作表现</h3>
          <div className="performance-grid">
            <div className="performance-item">
              <div className="performance-icon">🛡️</div>
              <div className="performance-info">
                <div className="performance-label">剩余耐久</div>
                <div className="performance-value">
                  {Math.floor(stats.durability.current)}/{stats.durability.max}
                </div>
                {stats.durabilityBonus > 0 && (
                  <div className="performance-bonus positive">+{stats.durabilityBonus} 耐久奖励</div>
                )}
                <div className="performance-bar">
                  <div 
                    className="performance-fill"
                    style={{ 
                      width: `${(stats.durability.current / stats.durability.max) * 100}%`,
                      background: getPerformanceColor(stats.durability.current / stats.durability.max)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="performance-item">
              <div className="performance-icon">🧵</div>
              <div className="performance-info">
                <div className="performance-label">平均张力</div>
                <div className="performance-value">
                  {Math.floor(stats.avgTension)}/{stats.tension.max}
                </div>
                {stats.tensionBonus > 0 && (
                  <div className="performance-bonus positive">+{stats.tensionBonus} 张力奖励</div>
                )}
                <div className="performance-sub">
                  最优张力: {stats.tension.optimal} | 效率: {Math.floor(getTensionEfficiency(stats.avgTension, stats.tension.optimal, stats.tension.max) * 100)}%
                </div>
              </div>
            </div>

            <div className="performance-item">
              <div className="performance-icon">💥</div>
              <div className="performance-info">
                <div className="performance-label">总损伤</div>
                <div className="performance-value negative">
                  {Math.floor(stats.totalDamageTaken)}
                </div>
                <div className="performance-sub">
                  碰撞次数: {stats.collisions}
                </div>
                {stats.totalDamageTaken > 0 && (
                  <div className="performance-bonus negative">-{Math.floor(stats.totalDamageTaken * 0.5)} 扣分</div>
                )}
              </div>
            </div>

            <div className="performance-item">
              <div className="performance-icon">⭐</div>
              <div className="performance-info">
                <div className="performance-label">综合评分</div>
                <div className="performance-value highlight">
                  {getPerformanceGrade(stats)}
                </div>
                <div className="performance-sub">
                  {getPerformanceComment(stats)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="gameover-buttons">
          <button className="menu-button primary" onClick={onRestart}>
            再来一次
          </button>
          {onWorkshop && (
            <button className="menu-button workshop-btn" onClick={onWorkshop}>
              🛠️ 前往工坊
            </button>
          )}
          <button className="menu-button" onClick={onMainMenu}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
};

const getPerformanceColor = (value: number): string => {
  if (value >= 0.8) return '#00ff88';
  if (value >= 0.6) return '#00c6ff';
  if (value >= 0.4) return '#ffc107';
  if (value >= 0.2) return '#ff6b00';
  return '#ff0000';
};

const getTensionEfficiency = (current: number, optimal: number, max: number): number => {
  const diff = Math.abs(current - optimal);
  const maxDiff = Math.max(optimal, max - optimal);
  return Math.max(0.3, 1 - diff / maxDiff);
};

const getPerformanceGrade = (stats: GameStats): string => {
  const durabilityRatio = stats.durability.current / stats.durability.max;
  const tensionEfficiency = getTensionEfficiency(stats.avgTension, stats.tension.optimal, stats.tension.max);
  const avgTracking = stats.shadowTracking;
  const stability = stats.flightStability;
  
  const compositeScore = (durabilityRatio * 0.3 + tensionEfficiency * 0.3 + avgTracking * 0.2 + stability * 0.2) * 100;
  
  if (compositeScore >= 85) return 'S+';
  if (compositeScore >= 75) return 'S';
  if (compositeScore >= 65) return 'A';
  if (compositeScore >= 55) return 'B';
  if (compositeScore >= 40) return 'C';
  return 'D';
};

const getPerformanceComment = (stats: GameStats): string => {
  const durabilityRatio = stats.durability.current / stats.durability.max;
  const tensionEfficiency = getTensionEfficiency(stats.avgTension, stats.tension.optimal, stats.tension.max);
  
  if (durabilityRatio >= 0.9 && tensionEfficiency >= 0.9) {
    return '完美操作！风筝几乎无损，张力控制极佳！';
  }
  if (durabilityRatio >= 0.7 && tensionEfficiency >= 0.7) {
    return '出色的操控！继续保持！';
  }
  if (stats.totalDamageTaken > 100) {
    return '注意避开障碍物和控制收线速度！';
  }
  if (tensionEfficiency < 0.5) {
    return '尝试将张力保持在最优值附近以提升效率！';
  }
  if (durabilityRatio < 0.3) {
    return '风筝受损严重！请更加小心操作！';
  }
  return '不错的飞行！还有提升空间哦～';
};
