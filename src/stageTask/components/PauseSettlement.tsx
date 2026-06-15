import React from 'react';
import type { Stage, StageProgress, StageTask } from '../types';

interface PauseSettlementProps {
  currentStage: Stage | null;
  progress: StageProgress;
  tasks: StageTask[];
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseSettlement: React.FC<PauseSettlementProps> = ({
  currentStage,
  progress,
  tasks,
  onResume,
  onRestart,
  onQuit,
}) => {
  if (!currentStage) return null;

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercent = Math.floor((completedTasks / totalTasks) * 100);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timeElapsed = (Date.now() - progress.stageStartTime) / 1000;
  const timeRemaining = currentStage.timeLimit
    ? Math.max(0, currentStage.timeLimit - timeElapsed)
    : null;

  return (
    <div className="pause-settlement">
      <div className="pause-settlement-header">
        <h3>游戏暂停</h3>
        <p className="stage-name-pause">{currentStage.name}</p>
      </div>

      <div className="settlement-stats">
        <div className="settlement-stat-item">
          <span className="stat-icon">📋</span>
          <div className="stat-info">
            <span className="stat-label">任务进度</span>
            <span className="stat-value">{completedTasks}/{totalTasks}</span>
          </div>
        </div>

        <div className="settlement-stat-item">
          <span className="stat-icon">🏆</span>
          <div className="stat-info">
            <span className="stat-label">当前得分</span>
            <span className="stat-value">{progress.totalScoreEarned}</span>
          </div>
        </div>

        <div className="settlement-stat-item">
          <span className="stat-icon">⏱</span>
          <div className="stat-info">
            <span className="stat-label">已用时间</span>
            <span className="stat-value">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {timeRemaining !== null && (
          <div className="settlement-stat-item">
            <span className="stat-icon">⌛</span>
            <div className="stat-info">
              <span className="stat-label">剩余时间</span>
              <span className={`stat-value ${timeRemaining < 30 ? 'warning' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        )}

        {progress.maxCombo > 0 && (
          <div className="settlement-stat-item">
            <span className="stat-icon">⚡</span>
            <div className="stat-info">
              <span className="stat-label">最高连击</span>
              <span className="stat-value">{progress.maxCombo}</span>
            </div>
          </div>
        )}
      </div>

      <div className="completion-bar">
        <div className="completion-label">完成度 {completionPercent}%</div>
        <div className="completion-progress">
          <div
            className="completion-fill"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="task-progress-list">
        <h4>任务详情</h4>
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-progress-item ${task.completed ? 'completed' : ''}`}
          >
            <span className="task-checkbox">
              {task.completed ? '✓' : '○'}
            </span>
            <span className="task-name">{task.name}</span>
            <span className="task-reward">+{task.rewardScore}分</span>
          </div>
        ))}
      </div>

      <div className="settlement-buttons">
        <button className="menu-button primary" onClick={onResume}>
          继续游戏
        </button>
        <button className="menu-button" onClick={onRestart}>
          重新开始
        </button>
        <button className="menu-button danger" onClick={onQuit}>
          退出赛段
        </button>
      </div>
    </div>
  );
};
