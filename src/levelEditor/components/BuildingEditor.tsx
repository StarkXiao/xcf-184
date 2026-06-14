import React, { useState, useCallback } from 'react';
import { useLevelEditor } from '../useLevelEditor';
import type { LevelScene, EditorBuilding } from '../types';
import { BUILDING_COLORS } from '../types';

interface BuildingEditorProps {
  currentLevel: LevelScene;
  selectedBuildingId: string | null;
}

export const BuildingEditor: React.FC<BuildingEditorProps> = ({
  currentLevel,
  selectedBuildingId,
}) => {
  const {
    addBuilding,
    updateBuilding,
    deleteBuilding,
    setSelectedBuilding,
    generateBuildingDefaults,
    updateLevel,
  } = useLevelEditor();

  const [editingName, setEditingName] = useState(currentLevel.name);
  const [editingDesc, setEditingDesc] = useState(currentLevel.description);
  const [editingDifficulty, setEditingDifficulty] = useState(currentLevel.difficulty);
  const [editingIcon, setEditingIcon] = useState(currentLevel.icon);
  const [editingTags, setEditingTags] = useState(currentLevel.tags.join(', '));

  const selectedBuilding = currentLevel.buildings.find(
    (b) => b.id === selectedBuildingId
  );

  const handleAddBuilding = useCallback(() => {
    const defaults = generateBuildingDefaults();
    addBuilding(defaults);
  }, [addBuilding, generateBuildingDefaults]);

  const handleUpdateBuilding = useCallback(
    (updates: Partial<EditorBuilding>) => {
      if (!selectedBuildingId) return;
      updateBuilding(selectedBuildingId, updates);
    },
    [selectedBuildingId, updateBuilding]
  );

  const handleDeleteBuilding = useCallback(() => {
    if (!selectedBuildingId) return;
    deleteBuilding(selectedBuildingId);
  }, [selectedBuildingId, deleteBuilding]);

  const handleSaveLevelInfo = () => {
    updateLevel(currentLevel.id, {
      name: editingName,
      description: editingDesc,
      difficulty: editingDifficulty,
      icon: editingIcon,
      tags: editingTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedBuilding) return;
    handleUpdateBuilding({
      position: {
        ...selectedBuilding.position,
        [axis]: value,
      },
    });
  };

  const handleSizeChange = (dimension: 'width' | 'height' | 'depth', value: number) => {
    handleUpdateBuilding({ [dimension]: value });
  };

  const handleColorChange = (color: number) => {
    handleUpdateBuilding({ color });
  };

  return (
    <div className="editor-panel">
      <div className="editor-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">关卡信息</h3>
          <div className="form-group">
            <label>关卡名称</label>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveLevelInfo}
            />
          </div>
          <div className="form-group">
            <label>描述</label>
            <textarea
              value={editingDesc}
              onChange={(e) => setEditingDesc(e.target.value)}
              onBlur={handleSaveLevelInfo}
              rows={3}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>图标</label>
              <input
                type="text"
                value={editingIcon}
                onChange={(e) => setEditingIcon(e.target.value)}
                onBlur={handleSaveLevelInfo}
                maxLength={2}
                className="icon-input"
              />
            </div>
            <div className="form-group">
              <label>难度</label>
              <select
                value={editingDifficulty}
                onChange={(e) => {
                  setEditingDifficulty(e.target.value as any);
                  setTimeout(handleSaveLevelInfo, 0);
                }}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
                <option value="extreme">极限</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>标签 (逗号分隔)</label>
            <input
              type="text"
              value={editingTags}
              onChange={(e) => setEditingTags(e.target.value)}
              onBlur={handleSaveLevelInfo}
              placeholder="例如: 城市, 峡谷, 挑战"
            />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="sidebar-title">建筑列表</h3>
            <button className="btn btn-small btn-primary" onClick={handleAddBuilding}>
              + 添加
            </button>
          </div>
          <div className="item-list">
            {currentLevel.buildings.length === 0 ? (
              <div className="empty-list">暂无建筑，点击上方按钮添加</div>
            ) : (
              currentLevel.buildings.map((building, index) => (
                <div
                  key={building.id}
                  className={`item-card ${selectedBuildingId === building.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBuilding(building.id)}
                >
                  <div
                    className="item-color"
                    style={{ backgroundColor: `#${building.color.toString(16).padStart(6, '0')}` }}
                  />
                  <div className="item-info">
                    <span className="item-name">建筑 {index + 1}</span>
                    <span className="item-desc">
                      {building.width}×{building.height}×{building.depth}
                    </span>
                  </div>
                  <span className="item-collidable">
                    {building.isCollidable ? '🛡️' : '👻'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="editor-content">
        {selectedBuilding ? (
          <div className="property-editor">
            <div className="property-header">
              <h3>建筑属性</h3>
              <button className="btn btn-danger btn-small" onClick={handleDeleteBuilding}>
                🗑️ 删除
              </button>
            </div>

            <div className="property-section">
              <h4>位置</h4>
              <div className="vector3-input">
                <div className="input-group">
                  <label className="axis-label x">X</label>
                  <input
                    type="number"
                    value={selectedBuilding.position.x}
                    onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label y">Y</label>
                  <input
                    type="number"
                    value={selectedBuilding.position.y}
                    onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label z">Z</label>
                  <input
                    type="number"
                    value={selectedBuilding.position.z}
                    onChange={(e) => handlePositionChange('z', Number(e.target.value))}
                    step={5}
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>尺寸</h4>
              <div className="vector3-input">
                <div className="input-group">
                  <label className="axis-label">宽</label>
                  <input
                    type="number"
                    value={selectedBuilding.width}
                    onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                    min={10}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label">高</label>
                  <input
                    type="number"
                    value={selectedBuilding.height}
                    onChange={(e) => handleSizeChange('height', Number(e.target.value))}
                    min={10}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label">深</label>
                  <input
                    type="number"
                    value={selectedBuilding.depth}
                    onChange={(e) => handleSizeChange('depth', Number(e.target.value))}
                    min={10}
                    step={5}
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>外观</h4>
              <div className="color-picker">
                {BUILDING_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`color-swatch ${selectedBuilding.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>

            <div className="property-section">
              <h4>碰撞</h4>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={selectedBuilding.isCollidable}
                  onChange={(e) => handleUpdateBuilding({ isCollidable: e.target.checked })}
                />
                启用碰撞检测
              </label>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-icon">🏢</div>
            <h3>选择一个建筑进行编辑</h3>
            <p>从左侧列表中选择一个建筑，或点击"添加"按钮创建新建筑</p>
          </div>
        )}
      </div>
    </div>
  );
};
