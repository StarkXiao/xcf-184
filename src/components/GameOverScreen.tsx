import React, { useMemo } from 'react';
import type { GameStats, ComboFlowHit } from '../game/types';
import type { NewlyUnlockedAchievement, NewlyUnlockedTitle } from '../journey';
import { RARITY_COLORS, RARITY_NAMES } from '../journey/types';

interface GameOverScreenProps {
  stats: GameStats;
  baseStats?: GameStats;
  earnedCoins?: number;
  scoreBonus?: number;
  newAchievements?: NewlyUnlockedAchievement[];
  newTitles?: NewlyUnlockedTitle[];
  onRestart: () => void;
  onMainMenu: () => void;
  onWorkshop?: () => void;
}

const AIR_CURRENT_TYPE_NAMES: Record<string, string> = {
  updraft: '上升气流',
  downdraft: '下沉气流',
  turbulence: '湍流',
};

const getComboColor = (combo: number): string => {
  if (combo >= 50) return '#ff0080';
  if (combo >= 30) return '#ff00ff';
  if (combo >= 20) return '#ff4040';
  if (combo >= 10) return '#ff8c00';
  if (combo >= 5) return '#ffd700';
  return '#4ecdc4';
};

const getComboGrade = (maxCombo: number, perfectHits: number, totalHits: number): { grade: string; color: string } => {
  const perfectRate = totalHits > 0 ? perfectHits / totalHits : 0;
  if (maxCombo >= 100 && perfectRate >= 0.5) return { grade: 'SS+', color: '#ff0080' };
  if (maxCombo >= 50) return { grade: 'SS', color: '#ff00ff' };
  if (maxCombo >= 30) return { grade: 'S', color: '#ffd700' };
  if (maxCombo >= 20) return { grade: 'A+', color: '#ff6b6b' };
  if (maxCombo >= 10) return { grade: 'A', color: '#ff8c00' };
  if (maxCombo >= 5) return { grade: 'B', color: '#4ecdc4' };
  if (maxCombo >= 3) return { grade: 'C', color: '#95e1d3' };
  return { grade: 'D', color: '#aaaaaa' };
};

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  stats,
  baseStats,
  earnedCoins = 0,
  scoreBonus = 0,
  newAchievements = [],
  newTitles = [],
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
  const comboFlow = stats.comboFlow;
  const hasComboData = comboFlow && comboFlow.totalHits > 0;

  const comboGrade = useMemo(() => {
    if (!comboFlow) return { grade: 'D', color: '#aaaaaa' };
    return getComboGrade(comboFlow.maxCombo, comboFlow.perfectHits, comboFlow.totalHits);
  }, [comboFlow]);

  const topHits = useMemo(() => {
    if (!comboFlow || !comboFlow.hits) return [];
    return [...comboFlow.hits]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [comboFlow]);

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

        {hasComboData && (
          <div className="combo-review-section">
            <div className="combo-review-header">
              <span className="combo-review-icon">⚡</span>
              <span className="combo-review-title">连击击穿复盘</span>
            </div>

            <div className="combo-grade-display">
              <div
                className="combo-grade-badge"
                style={{
                  color: comboGrade.color,
                  borderColor: comboGrade.color,
                }}
              >
                {comboGrade.grade}
              </div>
              <div className="combo-grade-label">连击评级</div>
            </div>

            <div className="combo-review-stats">
              <div className="combo-review-item">
                <div
                  className="combo-review-value"
                  style={{ color: getComboColor(comboFlow.maxCombo) }}
                >
                  {comboFlow.maxCombo}
                </div>
                <div className="combo-review-label">最高连击</div>
              </div>

              <div className="combo-review-item">
                <div className="combo-review-value" style={{ color: '#4ecdc4' }}>
                  +{comboFlow.totalComboScore}
                </div>
                <div className="combo-review-label">连击总得分</div>
              </div>

              <div className="combo-review-item">
                <div className="combo-review-value" style={{ color: '#ffd700' }}>
                  {comboFlow.perfectHits}
                </div>
                <div className="combo-review-label">完美命中</div>
              </div>

              <div className="combo-review-item">
                <div className="combo-review-value" style={{ color: '#a855f7' }}>
                  {comboFlow.totalHits}
                </div>
                <div className="combo-review-label">总命中数</div>
              </div>

              <div className="combo-review-item">
                <div className="combo-review-value" style={{ color: '#ff6b6b' }}>
                  {comboFlow.comboBreakCount}
                </div>
                <div className="combo-review-label">连击中断</div>
              </div>

              <div className="combo-review-item">
                <div className="combo-review-value" style={{ color: '#00c6ff' }}>
                  {comboFlow.longestComboTime.toFixed(1)}s
                </div>
                <div className="combo-review-label">最长连击时长</div>
              </div>
            </div>

            <div className="combo-review-hits">
              <div className="combo-hits-header">
                <span className="combo-hits-title">🏆 最佳命中 TOP {Math.min(topHits.length, 10)}</span>
                <span className="combo-hits-count">共 {comboFlow.hits?.length || 0} 次记录</span>
              </div>

              {topHits.length > 0 ? (
                <div className="combo-hits-list">
                  {topHits.map((hit: ComboFlowHit, index: number) => (
                    <div key={hit.id} className="combo-hit-item">
                      <div className="combo-hit-left">
                        <span
                          className="combo-hit-type"
                          style={{ opacity: 1 - index * 0.05 }}
                        >
                          {AIR_CURRENT_TYPE_NAMES[hit.type] || hit.type}
                        </span>
                        {hit.isPerfect && (
                          <span className="combo-hit-perfect-badge">PERFECT</span>
                        )}
                        <span className="combo-hit-combo">#{hit.comboCount}</span>
                      </div>
                      <div
                        className="combo-hit-score"
                        style={{ color: getComboColor(hit.comboCount) }}
                      >
                        +{hit.score}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="combo-empty-hits">暂无命中记录</div>
              )}
            </div>
          </div>
        )}

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

        {(newAchievements.length > 0 || newTitles.length > 0) && (
          <div className="unlock-rewards-section">
            <h3 className="section-title">🎉 本次解锁</h3>
            
            {newTitles.length > 0 && (
              <div className="unlock-group">
                <h4 className="unlock-group-title">👑 称号</h4>
                <div className="unlock-grid">
                  {newTitles.map((nt) => {
                    const title = nt.title;
                    const rarityColor = RARITY_COLORS[title.rarity];
                    return (
                      <div
                        key={title.id}
                        className="unlock-card unlock-card-title"
                        style={{
                          ['--rarity-color' as string]: rarityColor,
                          boxShadow: `0 0 20px ${rarityColor}44`,
                        } as React.CSSProperties}
                      >
                        <div className="unlock-icon">{title.icon}</div>
                        <div className="unlock-info">
                          <div className="unlock-name" style={{ color: rarityColor }}>
                            {title.name}
                          </div>
                          <div className="unlock-desc">{title.description}</div>
                          <div className="unlock-rarity" style={{ color: rarityColor }}>
                            {RARITY_NAMES[title.rarity]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {newAchievements.length > 0 && (
              <div className="unlock-group">
                <h4 className="unlock-group-title">🏆 成就</h4>
                <div className="unlock-grid">
                  {newAchievements.map((na) => {
                    const achievement = na.achievement;
                    const rarityColor = RARITY_COLORS[achievement.rarity];
                    return (
                      <div
                        key={achievement.id}
                        className="unlock-card unlock-card-achievement"
                        style={{
                          ['--rarity-color' as string]: rarityColor,
                          boxShadow: `0 0 20px ${rarityColor}44`,
                        } as React.CSSProperties}
                      >
                        <div className="unlock-icon">{achievement.icon}</div>
                        <div className="unlock-info">
                          <div className="unlock-name" style={{ color: rarityColor }}>
                            {achievement.name}
                          </div>
                          <div className="unlock-desc">{achievement.description}</div>
                          <div className="unlock-reward">
                            <span className="reward-icon">🪙</span>
                            <span>+{na.rewardCoins}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
