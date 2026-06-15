import React from 'react';
import type { StageSettlement, StageTask } from '../types';

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

  const getStarsDisplay = (stars: number): string[] => {
    return Array.from({ length: 3 }, (_, i) => i < stars ? 'star-filled' : 'star-empty');
  };

  const stars = getStarsDisplay(settlement.stars);

  return (
    <div className="menu-overlay stage-settlement-overlay">
      <div className="menu-content stage-settlement-content">
        <div className="settlement-header">
          <h2 className="settlement-title">
            {settlement.stars > 0 ? '🎉 挑战成功！' : '挑战结束'}
          </h2>
          <p className="settlement-stage-name">{settlement.stageName}</p>
        </div>

        <div className="stars-display">
          {stars.map((star, index) => (
            <span key={index} className={`star ${star}`}>
              ★
            </span>
          ))}
        </div>

        {settlement.isNewRecord && (
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
