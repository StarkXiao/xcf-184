import React, { useCallback } from 'react';
import { useLevelEditor } from '../useLevelEditor';
import type { LevelScene, Objective, WinCondition, LoseCondition } from '../types';
import {
  OBJECTIVE_TYPE_NAMES,
  WIN_CONDITION_NAMES,
  LOSE_CONDITION_NAMES,
} from '../types';

interface ObjectiveEditorProps {
  currentLevel: LevelScene;
  selectedObjectiveId: string | null;
}

export const ObjectiveEditor: React.FC<ObjectiveEditorProps> = ({
  currentLevel,
  selectedObjectiveId,
}) => {
  const {
    addObjective,
    updateObjective,
    deleteObjective,
    setSelectedObjective,
    generateObjectiveDefaults,
    updateWinCondition,
    updateLoseCondition,
    updateStartPosition,
  } = useLevelEditor();

  const selectedObjective = currentLevel.objectives.find(
    (o) => o.id === selectedObjectiveId
  );

  const handleAddObjective = useCallback(() => {
    const defaults = generateObjectiveDefaults();
    addObjective(defaults);
  }, [addObjective, generateObjectiveDefaults]);

  const handleUpdateObjective = useCallback(
    (updates: Partial<Objective>) => {
      if (!selectedObjectiveId) return;
      updateObjective(selectedObjectiveId, updates);
    },
    [selectedObjectiveId, updateObjective]
  );

  const handleDeleteObjective = useCallback(() => {
    if (!selectedObjectiveId) return;
    deleteObjective(selectedObjectiveId);
  }, [selectedObjectiveId, deleteObjective]);

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedObjective?.position) return;
    handleUpdateObjective({
      position: {
        ...selectedObjective.position,
        [axis]: value,
      },
    });
  };

  const handleWinConditionChange = (type: WinCondition['type']) => {
    const newCondition: WinCondition = {
      ...currentLevel.winCondition,
      type,
    };
    if (type === 'scoreThreshold' && !newCondition.targetScore) {
      newCondition.targetScore = 500;
    }
    updateWinCondition(newCondition);
  };

  const handleLoseConditionChange = (type: LoseCondition['type']) => {
    const newCondition: LoseCondition = {
      ...currentLevel.loseCondition,
      type,
    };
    if (type === 'timeOut' && !newCondition.timeLimit) {
      newCondition.timeLimit = 60;
    }
    if (type === 'scoreBelow' && !newCondition.minScore) {
      newCondition.minScore = 100;
    }
    updateLoseCondition(newCondition);
  };

  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case 'reachPoint':
        return '🎯';
      case 'scoreTarget':
        return '🏆';
      case 'timeLimit':
        return '⏱️';
      case 'distanceTarget':
        return '📏';
      case 'heightTarget':
        return '⛰️';
      default:
        return '📌';
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">起始位置</h3>
          <div className="form-group">
            <label>起始位置 X</label>
            <input
              type="number"
              value={currentLevel.startPosition.x}
              onChange={(e) =>
                updateStartPosition({
                  ...currentLevel.startPosition,
                  x: Number(e.target.value),
                })
              }
              step={5}
            />
          </div>
          <div className="form-group">
            <label>起始位置 Y</label>
            <input
              type="number"
              value={currentLevel.startPosition.y}
              onChange={(e) =>
                updateStartPosition({
                  ...currentLevel.startPosition,
                  y: Number(e.target.value),
                })
              }
              step={5}
            />
          </div>
          <div className="form-group">
            <label>起始位置 Z</label>
            <input
              type="number"
              value={currentLevel.startPosition.z}
              onChange={(e) =>
                updateStartPosition({
                  ...currentLevel.startPosition,
                  z: Number(e.target.value),
                })
              }
              step={5}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">胜利条件</h3>
          <div className="condition-options">
            {(['allObjectives', 'anyObjective', 'scoreThreshold'] as const).map((type) => (
              <label key={type} className="condition-option">
                <input
                  type="radio"
                  name="winCondition"
                  value={type}
                  checked={currentLevel.winCondition.type === type}
                  onChange={() => handleWinConditionChange(type)}
                />
                <span>{WIN_CONDITION_NAMES[type]}</span>
              </label>
            ))}
          </div>
          {currentLevel.winCondition.type === 'scoreThreshold' && (
            <div className="form-group">
              <label>目标分数</label>
              <input
                type="number"
                value={currentLevel.winCondition.targetScore ?? 500}
                onChange={(e) =>
                  updateWinCondition({
                    ...currentLevel.winCondition,
                    targetScore: Number(e.target.value),
                  })
                }
                min={100}
                step={50}
              />
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">失败条件</h3>
          <div className="condition-options">
            {(['timeOut', 'crash', 'scoreBelow'] as const).map((type) => (
              <label key={type} className="condition-option">
                <input
                  type="radio"
                  name="loseCondition"
                  value={type}
                  checked={currentLevel.loseCondition.type === type}
                  onChange={() => handleLoseConditionChange(type)}
                />
                <span>{LOSE_CONDITION_NAMES[type]}</span>
              </label>
            ))}
          </div>
          {currentLevel.loseCondition.type === 'timeOut' && (
            <div className="form-group">
              <label>时间限制 (秒)</label>
              <input
                type="number"
                value={currentLevel.loseCondition.timeLimit ?? 60}
                onChange={(e) =>
                  updateLoseCondition({
                    ...currentLevel.loseCondition,
                    timeLimit: Number(e.target.value),
                  })
                }
                min={10}
                step={5}
              />
            </div>
          )}
          {currentLevel.loseCondition.type === 'scoreBelow' && (
            <div className="form-group">
              <label>最低分数</label>
              <input
                type="number"
                value={currentLevel.loseCondition.minScore ?? 100}
                onChange={(e) =>
                  updateLoseCondition({
                    ...currentLevel.loseCondition,
                    minScore: Number(e.target.value),
                  })
                }
                min={0}
                step={50}
              />
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="sidebar-title">目标列表</h3>
            <button className="btn btn-small btn-primary" onClick={handleAddObjective}>
              + 添加
            </button>
          </div>
          <div className="item-list">
            {currentLevel.objectives.length === 0 ? (
              <div className="empty-list">暂无目标，点击上方按钮添加</div>
            ) : (
              currentLevel.objectives.map((objective, index) => (
                <div
                  key={objective.id}
                  className={`item-card ${selectedObjectiveId === objective.id ? 'selected' : ''}`}
                  onClick={() => setSelectedObjective(objective.id)}
                >
                  <div className="item-icon">{getObjectiveIcon(objective.type)}</div>
                  <div className="item-info">
                    <span className="item-name">
                      {objective.name || `目标 ${index + 1}`}
                    </span>
                    <span className="item-desc">
                      {OBJECTIVE_TYPE_NAMES[objective.type]}
                    </span>
                  </div>
                  <span className="item-status">
                    {objective.completed ? '✅' : '⬜'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="editor-content">
        {selectedObjective ? (
          <div className="property-editor">
            <div className="property-header">
              <h3>目标属性</h3>
              <button className="btn btn-danger btn-small" onClick={handleDeleteObjective}>
                🗑️ 删除
              </button>
            </div>

            <div className="property-section">
              <h4>类型</h4>
              <div className="type-selector">
                {(
                  [
                    'reachPoint',
                    'scoreTarget',
                    'timeLimit',
                    'distanceTarget',
                    'heightTarget',
                  ] as const
                ).map((type) => (
                  <button
                    key={type}
                    className={`type-btn ${selectedObjective.type === type ? 'active' : ''}`}
                    onClick={() => handleUpdateObjective({ type })}
                  >
                    <span className="type-icon">{getObjectiveIcon(type)}</span>
                    <span>{OBJECTIVE_TYPE_NAMES[type]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="property-section">
              <h4>基本信息</h4>
              <div className="form-group">
                <label>名称</label>
                <input
                  type="text"
                  value={selectedObjective.name}
                  onChange={(e) => handleUpdateObjective({ name: e.target.value })}
                  placeholder="输入目标名称"
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={selectedObjective.description}
                  onChange={(e) => handleUpdateObjective({ description: e.target.value })}
                  placeholder="输入目标描述"
                  rows={2}
                />
              </div>
            </div>

            {selectedObjective.type === 'reachPoint' && (
              <div className="property-section">
                <h4>目标点位置</h4>
                <div className="vector3-input">
                  <div className="input-group">
                    <label className="axis-label x">X</label>
                    <input
                      type="number"
                      value={selectedObjective.position?.x ?? 0}
                      onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                      step={5}
                    />
                  </div>
                  <div className="input-group">
                    <label className="axis-label y">Y</label>
                    <input
                      type="number"
                      value={selectedObjective.position?.y ?? 0}
                      onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                      step={5}
                    />
                  </div>
                  <div className="input-group">
                    <label className="axis-label z">Z</label>
                    <input
                      type="number"
                      value={selectedObjective.position?.z ?? 0}
                      onChange={(e) => handlePositionChange('z', Number(e.target.value))}
                      step={5}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>触发半径</label>
                  <input
                    type="number"
                    value={selectedObjective.radius ?? 30}
                    onChange={(e) =>
                      handleUpdateObjective({ radius: Number(e.target.value) })
                    }
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )}

            {(selectedObjective.type === 'scoreTarget' ||
              selectedObjective.type === 'distanceTarget' ||
              selectedObjective.type === 'heightTarget' ||
              selectedObjective.type === 'timeLimit') && (
              <div className="property-section">
                <h4>目标值</h4>
                <div className="form-group">
                  <label>
                    {selectedObjective.type === 'scoreTarget'
                      ? '目标分数'
                      : selectedObjective.type === 'distanceTarget'
                        ? '目标距离 (米)'
                        : selectedObjective.type === 'heightTarget'
                          ? '目标高度 (米)'
                          : '目标时间 (秒)'}
                  </label>
                  <input
                    type="number"
                    value={selectedObjective.targetValue ?? 100}
                    onChange={(e) =>
                      handleUpdateObjective({ targetValue: Number(e.target.value) })
                    }
                    min={1}
                    step={selectedObjective.type === 'timeLimit' ? 5 : 50}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-icon">🎯</div>
            <h3>选择一个目标进行编辑</h3>
            <p>从左侧列表中选择一个目标，或点击"添加"按钮创建新目标</p>
          </div>
        )}
      </div>
    </div>
  );
};
