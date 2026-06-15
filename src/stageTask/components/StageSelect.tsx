import React, { useState } from 'react';
import type { Stage, Chapter } from '../types';
import { WEATHER_THEME_NAMES, AIR_CURRENT_THEME_NAMES, DIFFICULTY_COLORS } from '../types';

interface StageSelectProps {
  stages: Stage[];
  chapters: Chapter[];
  onSelectStage: (stageId: string) => void;
  onClose: () => void;
  getChapterUnlockDescription: (chapter: Chapter) => string;
}

export const StageSelect: React.FC<StageSelectProps> = ({
  stages,
  chapters,
  onSelectStage,
  onClose,
  getChapterUnlockDescription,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
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

  const getStagesForChapter = (chapterId: string): Stage[] => {
    return stages.filter(s => s.chapterId === chapterId);
  };

  const activeChapter = selectedChapter || chapters.find(c => c.unlocked) || null;

  return (
    <div className="menu-overlay stage-select-overlay">
      <div className="menu-content stage-select-content chapter-select-content">
        <h2 className="stage-select-title">🏁 章节挑战</h2>
        <p className="stage-select-subtitle">逐章解锁，挑战你的飞行极限！</p>

        <div className="chapter-progress-overview">
          <div className="chapter-progress-stats">
            <span className="cp-stat">
              <span className="cp-stat-icon">⭐</span>
              <span className="cp-stat-value">{stages.reduce((s, st) => s + st.stars, 0)}</span>
              <span className="cp-stat-label">总星数</span>
            </span>
            <span className="cp-stat">
              <span className="cp-stat-icon">🏆</span>
              <span className="cp-stat-value">{stages.filter(s => s.completed).length}/{stages.length}</span>
              <span className="cp-stat-label">通关</span>
            </span>
            <span className="cp-stat">
              <span className="cp-stat-icon">📖</span>
              <span className="cp-stat-value">{chapters.filter(c => c.unlocked).length}/{chapters.length}</span>
              <span className="cp-stat-label">章节</span>
            </span>
          </div>
        </div>

        <div className="chapter-path">
          {chapters.map((chapter, idx) => {
            const chapterStages = getStagesForChapter(chapter.id);
            const completedInChapter = chapterStages.filter(s => s.completed).length;

            return (
              <React.Fragment key={chapter.id}>
                {idx > 0 && (
                  <div className={`chapter-connector ${chapter.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="connector-line" />
                  </div>
                )}
                <div
                  className={`chapter-node ${chapter.unlocked ? 'unlocked' : 'locked'} ${
                    activeChapter?.id === chapter.id ? 'active' : ''
                  } ${chapter.completed ? 'completed' : ''}`}
                  onClick={() => chapter.unlocked && setSelectedChapter(chapter)}
                  style={{
                    borderColor: chapter.unlocked ? chapter.themeColor : '#555',
                  }}
                >
                  <div
                    className="chapter-node-bg"
                    style={{
                      background: chapter.unlocked ? chapter.themeGradient : 'linear-gradient(135deg, #333, #444)',
                    }}
                  />
                  <span className="chapter-node-icon">{chapter.unlocked ? chapter.icon : '🔒'}</span>
                  <span className="chapter-node-number">{chapter.chapterNumber}</span>
                  <span className="chapter-node-name">{chapter.name}</span>
                  <span className="chapter-node-stars">
                    ⭐ {chapter.totalStars}/{chapter.maxStars}
                  </span>
                  <span className="chapter-node-progress">
                    {completedInChapter}/{chapterStages.length} 关
                  </span>

                  {!chapter.unlocked && (
                    <div className="chapter-lock-tooltip">
                      {getChapterUnlockDescription(chapter)}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {activeChapter && (
          <div className="chapter-detail-panel">
            <div
              className="chapter-detail-header"
              style={{ background: activeChapter.themeGradient }}
            >
              <span className="chapter-detail-icon">{activeChapter.icon}</span>
              <div className="chapter-detail-title-area">
                <h3 className="chapter-detail-title">{activeChapter.name}</h3>
                <span className="chapter-detail-subtitle">{activeChapter.subtitle}</span>
              </div>
            </div>
            <p className="chapter-detail-desc">{activeChapter.description}</p>

            {activeChapter.unlockedDifficulties.length > 0 && (
              <div className="chapter-difficulty-unlock">
                <span className="cd-label">已开放难度：</span>
                <div className="cd-badges">
                  {activeChapter.unlockedDifficulties.map(d => (
                    <span key={d} className={`cd-badge cd-${d}`}>
                      {d === 'easy' ? '简单' : d === 'normal' ? '普通' : d === 'hard' ? '困难' : '极限'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="chapter-stages-list">
              {getStagesForChapter(activeChapter.id).map(stage => (
                <div
                  key={stage.id}
                  className={`chapter-stage-card ${stage.unlocked ? '' : 'locked'} ${
                    selectedStage?.id === stage.id ? 'selected' : ''
                  } ${stage.completed ? 'completed' : ''}`}
                  onClick={() => stage.unlocked && setSelectedStage(stage)}
                >
                  <div className="csc-header">
                    <span className="csc-number">第 {stage.stageNumber} 关</span>
                    <span className="csc-stars">{getStarsDisplay(stage.stars)}</span>
                  </div>
                  <h4 className="csc-name">{stage.name}</h4>
                  <p className="csc-desc">{stage.description}</p>
                  <div className="csc-themes">
                    <span className="theme-tag">
                      {getWeatherIcon(stage.weatherTheme)} {WEATHER_THEME_NAMES[stage.weatherTheme]}
                    </span>
                    <span className="theme-tag">
                      💨 {AIR_CURRENT_THEME_NAMES[stage.airCurrentTheme]}
                    </span>
                  </div>
                  <div className="csc-footer">
                    <span>📋 {stage.tasks.length} 个任务</span>
                    <span>🏆 {stage.totalRewardScore} 分</span>
                    {stage.bestScore > 0 && <span className="csc-best">最高 {stage.bestScore}</span>}
                  </div>
                  {!stage.unlocked && (
                    <div className="stage-lock-overlay">
                      <span className="lock-icon">🔒</span>
                    </div>
                  )}
                  {stage.completed && <div className="stage-completed-badge">已通关</div>}
                </div>
              ))}
            </div>

            {selectedStage && (
              <div className="selected-stage-detail">
                <h3>{selectedStage.name}</h3>
                <p className="stage-story">{selectedStage.backgroundStory}</p>

                <div className="stage-tasks-preview">
                  <h4>任务列表</h4>
                  {selectedStage.tasks.map(task => (
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
