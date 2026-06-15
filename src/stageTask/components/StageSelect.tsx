import React, { useState } from 'react';
import type { Stage } from '../types';
import { WEATHER_THEME_NAMES, AIR_CURRENT_THEME_NAMES, DIFFICULTY_COLORS } from '../types';

interface StageSelectProps {
  stages: Stage[];
  onSelectStage: (stageId: string) => void;
  onClose: () => void;
}

export const StageSelect: React.FC<StageSelectProps> = ({
  stages,
  onSelectStage,
  onClose,
}) => {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);

  const getStarsDisplay = (stars: number) => {
    return '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  };

  const getWeatherIcon = (theme: string): string => {
    switch (theme) {
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'windy': return '🌬️';
      case 'stormy': return '⛈️';
      case 'night': return '🌙';
      default: return '🌤️';
    }
  };

  return (
    <div className="menu-overlay stage-select-overlay">
      <div className="menu-content stage-select-content">
        <h2 className="stage-select-title">🏁 赛段挑战</h2>
        <p className="stage-select-subtitle">选择赛段，完成任务，获取奖励！</p>

        <div className="stage-list">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className={`stage-card ${stage.unlocked ? '' : 'locked'} ${
                selectedStage?.id === stage.id ? 'selected' : ''
              }`}
              onClick={() => stage.unlocked && setSelectedStage(stage)}
            >
              <div className="stage-card-header">
                <span className="stage-number-badge">第 {stage.stageNumber} 关</span>
                <span className="stage-stars">{getStarsDisplay(stage.stars)}</span>
              </div>

              <h3 className="stage-card-title">{stage.name}</h3>
              <p className="stage-card-desc">{stage.description}</p>

              <div className="stage-card-themes">
                <span className="theme-tag">
                  {getWeatherIcon(stage.weatherTheme)} {WEATHER_THEME_NAMES[stage.weatherTheme]}
                </span>
                <span className="theme-tag">
                  💨 {AIR_CURRENT_THEME_NAMES[stage.airCurrentTheme]}
                </span>
              </div>

              <div className="stage-card-footer">
                <span className="task-count">
                  📋 {stage.tasks.length} 个任务
                </span>
                <span className="reward-info">
                  🏆 {stage.totalRewardScore} 分
                </span>
              </div>

              {!stage.unlocked && (
                <div className="stage-lock-overlay">
                  <span className="lock-icon">🔒</span>
                  <span className="lock-text">未解锁</span>
                </div>
              )}

              {stage.completed && (
                <div className="stage-completed-badge">已通关</div>
              )}
            </div>
          ))}
        </div>

        {selectedStage && (
          <div className="selected-stage-detail">
            <h3>{selectedStage.name}</h3>
            <p className="stage-story">{selectedStage.backgroundStory}</p>

            <div className="stage-tasks-preview">
              <h4>任务列表</h4>
              {selectedStage.tasks.map((task) => (
                <div key={task.id} className="task-preview-item">
                  <span
                    className="task-difficulty-dot"
                    style={{ backgroundColor: DIFFICULTY_COLORS[task.difficulty] }}
                  />
                  <span className="task-preview-name">{task.name}</span>
                  <span className="task-preview-reward">+{task.rewardScore}分</span>
                </div>
              ))}
            </div>

            <div className="stage-rewards-summary">
              <div className="reward-item">
                <span className="reward-icon">🏆</span>
                <span className="reward-label">总得分奖励</span>
                <span className="reward-value">{selectedStage.totalRewardScore}</span>
              </div>
              <div className="reward-item">
                <span className="reward-icon">🪙</span>
                <span className="reward-label">金币奖励</span>
                <span className="reward-value">{selectedStage.totalRewardCoins}</span>
              </div>
            </div>

            {selectedStage.timeLimit && (
              <div className="stage-time-limit">
                ⏱ 限时 {selectedStage.timeLimit} 秒
              </div>
            )}
          </div>
        )}

        <div className="stage-select-buttons">
          <button className="menu-button" onClick={onClose}>
            返回
          </button>
          <button
            className="menu-button primary"
            disabled={!selectedStage}
            onClick={() => selectedStage && onSelectStage(selectedStage.id)}
          >
            开始挑战
          </button>
        </div>
      </div>
    </div>
  );
};
