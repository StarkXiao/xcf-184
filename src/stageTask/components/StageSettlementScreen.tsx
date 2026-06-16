import React from 'react';
import type { StageSettlement, StageTask, ObstacleSettlement } from '../types';

interface StageSettlementScreenProps {
  settlement: StageSettlement;
  tasks: StageTask[];
  onRestart: () => void;
  onNextStage?: () => void;
  onMainMenu: () => void;
  hasNextStage: boolean;
}

export const StageSettlementScreen: React.FC<StageSettlementScreenProps> = ({
  settlement,
  tasks,
  onRestart,
  onNextStage,
  onMainMenu,
  hasNextStage,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAvoidanceRateColor = (rate: number): string => {
    if (rate >= 0.9) return '#00ff88';
    if (rate >= 0.7) return '#ffd700';
    if (rate >= 0.5) return '#ff8c00';
    return '#ff4444';
  };

  const getAvoidanceRateGradient = (rate: number): string => {
    if (rate >= 0.9) return 'linear-gradient(90deg, #00ff88, #00b85c)';
    if (rate >= 0.7) return 'linear-gradient(90deg, #ffd700, #ffaa00)';
    if (rate >= 0.5) return 'linear-gradient(90deg, #ff8c00, #ff6600)';
    return 'linear-gradient(90deg, #ff4444, #cc0000)';
  };

  const getStarsDisplay = (stars: number): string[] => {
    return Array.from({ length: 3 }, (_, i) => i < stars ? 'star-filled' : 'star-empty');
  };

  const stars = getStarsDisplay(settlement.stars);

  return (
    <div className="menu-overlay stage-settlement-overlay">
      <div className="menu-content stage-settlement-content">
        <div className="settlement-header">
          <h2 className={`settlement-title ${settlement.isFailed ? 'failed' : ''}`}>
            {settlement.isFailed ? '💔 挑战失败' : settlement.stars > 0 ? '🎉 挑战成功！' : '挑战结束'}
          </h2>
          <p className="settlement-stage-name">{settlement.stageName}</p>
        </div>

        {settlement.isFailed && settlement.failReason && (
          <div className="fail-reason">
            ⚠️ {settlement.failReason}
          </div>
        )}

        <div className="stars-display">
          {stars.map((star, index) => (
            <span key={index} className={`star ${star} ${settlement.isFailed ? 'dimmed' : ''}`}>
              ★
            </span>
          ))}
        </div>

        {settlement.isNewRecord && !settlement.isFailed && (
          <div className="new-record-badge">
            🏆 新纪录！
          </div>
        )}

        <div className="settlement-score">
          <div className="score-label">最终得分</div>
          <div className="score-value">{settlement.totalScore.toLocaleString()}</div>
          <div className="score-breakdown">
            <span className="base-score">基础分 {settlement.baseScore}</span>
            <span className="bonus-score">+{settlement.bonusScore} 奖励</span>
          </div>
        </div>

        <div className="settlement-rewards">
          <div className="reward-item">
            <span className="reward-icon">🪙</span>
            <span className="reward-text">获得 {settlement.earnedCoins} 金币</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">⚡</span>
            <span className="reward-text">最高连击 {settlement.maxCombo}</span>
          </div>
          <div className="reward-item">
            <span className="reward-icon">⏱</span>
            <span className="reward-text">用时 {formatTime(settlement.timeUsed)}</span>
          </div>
        </div>

        {(() => {
          const obstacleStats: ObstacleSettlement | undefined = settlement.obstacleStats;
          if (!obstacleStats || obstacleStats.totalSpawned <= 0) return null;
          
          return (
            <div className="settlement-obstacles">
              <h4>🚁 空中目标统计</h4>
              <div className="obstacle-stats-grid">
                <div className="obstacle-stat-card">
                  <div className="obstacle-stat-icon">🚁</div>
                  <div className="obstacle-stat-value">{obstacleStats.totalSpawned}</div>
                  <div className="obstacle-stat-label">总目标数</div>
                </div>
                <div className="obstacle-stat-card success">
                  <div className="obstacle-stat-icon">✅</div>
                  <div className="obstacle-stat-value">{obstacleStats.totalAvoided}</div>
                  <div className="obstacle-stat-label">成功躲避</div>
                </div>
                <div className="obstacle-stat-card danger">
                  <div className="obstacle-stat-icon">💥</div>
                  <div className="obstacle-stat-value">{obstacleStats.totalCollided}</div>
                  <div className="obstacle-stat-label">发生碰撞</div>
                </div>
                <div className="obstacle-stat-card warning">
                  <div className="obstacle-stat-icon">😅</div>
                  <div className="obstacle-stat-value">{obstacleStats.nearMissCount}</div>
                  <div className="obstacle-stat-label">险兆</div>
                </div>
              </div>

              <div className="obstacle-avoidance-rate">
                <div className="avoidance-rate-header">
                  <span>躲避率</span>
                  <span style={{ color: getAvoidanceRateColor(obstacleStats.avoidanceRate) }}>
                    {(obstacleStats.avoidanceRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="avoidance-rate-bar">
                  <div
                    className="avoidance-rate-fill"
                    style={{
                      width: `${obstacleStats.avoidanceRate * 100}%`,
                      background: getAvoidanceRateGradient(obstacleStats.avoidanceRate),
                    }}
                  />
                </div>
              </div>

              <div className="obstacle-breakdown">
                <div className="obstacle-breakdown-title">各类型碰撞统计</div>
                <div className="obstacle-breakdown-list">
                  <div className="obstacle-breakdown-item">
                    <span className="obstacle-icon">🚁</span>
                    <span className="obstacle-name">无人机</span>
                    <span className={`obstacle-count ${obstacleStats.droneCollided > 0 ? 'danger' : ''}`}>
                      {obstacleStats.droneCollided} 次
                    </span>
                  </div>
                  <div className="obstacle-breakdown-item">
                    <span className="obstacle-icon">🎈</span>
                    <span className="obstacle-name">广告气球</span>
                    <span className={`obstacle-count ${obstacleStats.adBalloonCollided > 0 ? 'danger' : ''}`}>
                      {obstacleStats.adBalloonCollided} 次
                    </span>
                  </div>
                  <div className="obstacle-breakdown-item">
                    <span className="obstacle-icon">🐦</span>
                    <span className="obstacle-name">飞鸟</span>
                    <span className={`obstacle-count ${obstacleStats.birdCollided > 0 ? 'danger' : ''}`}>
                      {obstacleStats.birdCollided} 次
                    </span>
                  </div>
                  <div className="obstacle-breakdown-item">
                    <span className="obstacle-icon">✈️</span>
                    <span className="obstacle-name">飞机</span>
                    <span className={`obstacle-count ${obstacleStats.airplaneCollided > 0 ? 'danger' : ''}`}>
                      {obstacleStats.airplaneCollided} 次
                    </span>
                  </div>
                </div>
              </div>

              <div className="obstacle-extra-stats">
                <div className="extra-stat-item">
                  <span className="extra-stat-label">预警次数</span>
                  <span className="extra-stat-value">{obstacleStats.warningsIssued}</span>
                </div>
                <div className="extra-stat-item">
                  <span className="extra-stat-label">同屏最多</span>
                  <span className="extra-stat-value">{obstacleStats.maxObstaclesOnScreen}</span>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="settlement-tasks">
          <h4>任务完成情况</h4>
          <div className="tasks-completion">
            {settlement.completedTasks} / {settlement.totalTasks} 任务完成
          </div>
          <div className="task-results-list">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`task-result-item ${task.completed ? 'completed' : ''}`}
              >
                <span className="task-result-icon">
                  {task.completed ? '✅' : '❌'}
                </span>
                <span className="task-result-name">{task.name}</span>
                <span className="task-result-reward">
                  {task.completed ? `+${task.rewardScore}分` : '未完成'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="settlement-buttons">
          {hasNextStage && settlement.stars > 0 && (
            <button className="menu-button primary" onClick={onNextStage}>
              下一关 →
            </button>
          )}
          <button className="menu-button" onClick={onRestart}>
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
