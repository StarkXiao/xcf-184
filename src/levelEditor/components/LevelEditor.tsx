import React from 'react';
import { useLevelEditor } from '../useLevelEditor';
import { BuildingEditor } from './BuildingEditor';
import { AirCurrentEditor } from './AirCurrentEditor';
import { ObjectiveEditor } from './ObjectiveEditor';
import { LevelManager } from './LevelManager';
import { TAB_NAMES } from '../types';
import type { LevelEditorTab, LevelScene } from '../types';

interface LevelEditorProps {
  onClose: () => void;
  onStartLevel: (level: LevelScene) => void;
  lastResult?: { levelId: string; score: number; isWin: boolean } | null;
  onClearResult?: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({ onClose, onStartLevel, lastResult, onClearResult }) => {
  if (lastResult && onClearResult) {
    setTimeout(() => {
      onClearResult();
    }, 3000);
  }
  const {
    state,
    levels,
    currentLevel,
    setCurrentTab,
    setCurrentLevel,
    createEmptyLevel,
    getLevelStats,
    exportLevel,
    importLevel,
  } = useLevelEditor();

  const tabs: { key: LevelEditorTab; icon: string }[] = [
    { key: 'buildings', icon: '🏢' },
    { key: 'airCurrents', icon: '💨' },
    { key: 'objectives', icon: '🎯' },
    { key: 'levels', icon: '📁' },
  ];

  const handleStartLevel = (level: LevelScene) => {
    onStartLevel(level);
    onClose();
  };

  return (
    <div className="leveleditor-overlay">
      <div className="leveleditor-container">
        <div className="leveleditor-header">
          <div className="leveleditor-title-section">
            <h1 className="leveleditor-title">
              <span className="title-icon">🛠️</span>
              关卡编辑器
            </h1>
            <p className="leveleditor-subtitle">
              设计你自己的关卡，配置建筑、气流、目标点，然后一键进入测试
            </p>
          </div>

          <div className="leveleditor-header-actions">
            <div className="stats-summary">
              <div className="summary-item">
                <span className="summary-icon">🏢</span>
                <span className="summary-value">{currentLevel?.buildings.length || 0}</span>
                <span className="summary-label">建筑</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">💨</span>
                <span className="summary-value">{currentLevel?.airCurrents.length || 0}</span>
                <span className="summary-label">气流</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">🎯</span>
                <span className="summary-value">{currentLevel?.objectives.length || 0}</span>
                <span className="summary-label">目标</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">📁</span>
                <span className="summary-value">{levels.length}</span>
                <span className="summary-label">关卡</span>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="leveleditor-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`leveleditor-tab ${state.currentTab === tab.key ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{TAB_NAMES[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="leveleditor-body">
          {!currentLevel && state.currentTab !== 'levels' && (
            <div className="no-level-selected">
              <div className="no-level-icon">📝</div>
              <h3>请选择或创建一个关卡</h3>
              <p>在关卡管理中选择现有关卡，或创建一个新的自定义关卡</p>
              <div className="no-level-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    createEmptyLevel();
                    setCurrentTab('buildings');
                  }}
                >
                  ✨ 创建新关卡
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentTab('levels')}
                >
                  📁 浏览关卡
                </button>
              </div>
            </div>
          )}

          {currentLevel && state.currentTab === 'buildings' && (
            <BuildingEditor
              currentLevel={currentLevel}
              selectedBuildingId={state.selectedBuildingId}
            />
          )}

          {currentLevel && state.currentTab === 'airCurrents' && (
            <AirCurrentEditor
              currentLevel={currentLevel}
              selectedAirCurrentId={state.selectedAirCurrentId}
            />
          )}

          {currentLevel && state.currentTab === 'objectives' && (
            <ObjectiveEditor
              currentLevel={currentLevel}
              selectedObjectiveId={state.selectedObjectiveId}
            />
          )}

          {state.currentTab === 'levels' && (
            <LevelManager
              currentLevel={currentLevel}
              onSelectLevel={(level) => {
                setCurrentLevel(level);
                setCurrentTab('buildings');
              }}
              onStartLevel={handleStartLevel}
              onGetLevelStats={getLevelStats}
              onExportLevel={exportLevel}
              onImportLevel={importLevel}
            />
          )}
        </div>

        {currentLevel && (
          <div className="leveleditor-footer">
            <div className="current-level-info">
              <span className="level-icon">{currentLevel.icon}</span>
              <span className="level-name">{currentLevel.name}</span>
              <span
                className="level-difficulty"
                style={{
                  backgroundColor:
                    currentLevel.difficulty === 'easy'
                      ? '#22c55e'
                      : currentLevel.difficulty === 'medium'
                        ? '#f59e0b'
                        : currentLevel.difficulty === 'hard'
                          ? '#ef4444'
                          : '#a855f7',
                }}
              >
                {currentLevel.difficulty === 'easy'
                  ? '简单'
                  : currentLevel.difficulty === 'medium'
                    ? '中等'
                    : currentLevel.difficulty === 'hard'
                      ? '困难'
                      : '极限'}
              </span>
            </div>
            <div className="footer-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentTab('levels')}
              >
                📁 关卡管理
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleStartLevel(currentLevel)}
              >
                🚀 开始测试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
