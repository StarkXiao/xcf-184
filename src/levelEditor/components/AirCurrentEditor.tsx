import React, { useCallback } from 'react';
import { useLevelEditor } from '../useLevelEditor';
import type { LevelScene, EditorAirCurrent } from '../types';

interface AirCurrentEditorProps {
  currentLevel: LevelScene;
  selectedAirCurrentId: string | null;
}

export const AirCurrentEditor: React.FC<AirCurrentEditorProps> = ({
  currentLevel,
  selectedAirCurrentId,
}) => {
  const {
    addAirCurrent,
    updateAirCurrent,
    deleteAirCurrent,
    setSelectedAirCurrent,
    generateAirCurrentDefaults,
    updateGameConfig,
    updateWeatherConfig,
  } = useLevelEditor();

  const selectedAirCurrent = currentLevel.airCurrents.find(
    (a) => a.id === selectedAirCurrentId
  );

  const handleAddAirCurrent = useCallback(() => {
    const defaults = generateAirCurrentDefaults();
    addAirCurrent(defaults);
  }, [addAirCurrent, generateAirCurrentDefaults]);

  const handleUpdateAirCurrent = useCallback(
    (updates: Partial<EditorAirCurrent>) => {
      if (!selectedAirCurrentId) return;
      updateAirCurrent(selectedAirCurrentId, updates);
    },
    [selectedAirCurrentId, updateAirCurrent]
  );

  const handleDeleteAirCurrent = useCallback(() => {
    if (!selectedAirCurrentId) return;
    deleteAirCurrent(selectedAirCurrentId);
  }, [selectedAirCurrentId, deleteAirCurrent]);

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedAirCurrent) return;
    handleUpdateAirCurrent({
      position: {
        ...selectedAirCurrent.position,
        [axis]: value,
      },
    });
  };

  const handleDirectionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedAirCurrent) return;
    handleUpdateAirCurrent({
      direction: {
        ...selectedAirCurrent.direction,
        [axis]: value,
      },
    });
  };

  const getAirCurrentColor = (type: string) => {
    switch (type) {
      case 'updraft':
        return '#60a5fa';
      case 'downdraft':
        return '#f97316';
      case 'turbulence':
        return '#a78bfa';
      default:
        return '#6b7280';
    }
  };

  const getAirCurrentTypeName = (type: string) => {
    switch (type) {
      case 'updraft':
        return '上升气流';
      case 'downdraft':
        return '下降气流';
      case 'turbulence':
        return '湍流';
      default:
        return type;
    }
  };

  return (
    <div className="editor-panel">
      <div className="editor-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">全局设置</h3>
          <div className="form-group">
            <label>重力系数</label>
            <input
              type="number"
              value={currentLevel.gameConfig.gravity ?? 0.015}
              onChange={(e) => updateGameConfig({ gravity: Number(e.target.value) })}
              step={0.001}
              min={0}
              max={0.05}
            />
          </div>
          <div className="form-group">
            <label>基础风速</label>
            <input
              type="number"
              value={currentLevel.weatherConfig.windSpeed ?? 0.3}
              onChange={(e) => updateWeatherConfig({ windSpeed: Number(e.target.value) })}
              step={0.05}
              min={0}
              max={1}
            />
          </div>
          <div className="form-group">
            <label>湍流强度</label>
            <input
              type="number"
              value={currentLevel.weatherConfig.turbulenceLevel ?? 0.1}
              onChange={(e) => updateWeatherConfig({ turbulenceLevel: Number(e.target.value) })}
              step={0.05}
              min={0}
              max={1}
            />
          </div>
          <div className="form-group">
            <label>云层覆盖</label>
            <input
              type="number"
              value={currentLevel.weatherConfig.cloudCoverage ?? 0.3}
              onChange={(e) => updateWeatherConfig({ cloudCoverage: Number(e.target.value) })}
              step={0.1}
              min={0}
              max={1}
            />
          </div>
          <div className="form-group">
            <label>时间</label>
            <input
              type="number"
              value={currentLevel.weatherConfig.timeOfDay ?? 0.5}
              onChange={(e) => updateWeatherConfig({ timeOfDay: Number(e.target.value) })}
              step={0.05}
              min={0}
              max={1}
            />
          </div>
          <div className="form-group">
            <label>世界大小</label>
            <input
              type="number"
              value={currentLevel.gameConfig.worldSize ?? 500}
              onChange={(e) => updateGameConfig({ worldSize: Number(e.target.value) })}
              step={50}
              min={200}
              max={1000}
            />
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <h3 className="sidebar-title">气流列表</h3>
            <button className="btn btn-small btn-primary" onClick={handleAddAirCurrent}>
              + 添加
            </button>
          </div>
          <div className="item-list">
            {currentLevel.airCurrents.length === 0 ? (
              <div className="empty-list">暂无气流，点击上方按钮添加</div>
            ) : (
              currentLevel.airCurrents.map((airCurrent, index) => (
                <div
                  key={airCurrent.id}
                  className={`item-card ${selectedAirCurrentId === airCurrent.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAirCurrent(airCurrent.id)}
                >
                  <div
                    className="item-color"
                    style={{ backgroundColor: getAirCurrentColor(airCurrent.type) }}
                  />
                  <div className="item-info">
                    <span className="item-name">
                      {getAirCurrentTypeName(airCurrent.type)} {index + 1}
                    </span>
                    <span className="item-desc">
                      强度: {airCurrent.strength.toFixed(2)} | 半径: {airCurrent.radius}
                    </span>
                  </div>
                  <span className="item-type">
                    {airCurrent.type === 'updraft'
                      ? '⬆️'
                      : airCurrent.type === 'downdraft'
                        ? '⬇️'
                        : '🌀'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="editor-content">
        {selectedAirCurrent ? (
          <div className="property-editor">
            <div className="property-header">
              <h3>气流属性</h3>
              <button className="btn btn-danger btn-small" onClick={handleDeleteAirCurrent}>
                🗑️ 删除
              </button>
            </div>

            <div className="property-section">
              <h4>类型</h4>
              <div className="type-selector">
                <button
                  className={`type-btn ${selectedAirCurrent.type === 'updraft' ? 'active' : ''}`}
                  onClick={() => handleUpdateAirCurrent({ type: 'updraft' })}
                  style={{ borderColor: getAirCurrentColor('updraft') }}
                >
                  <span className="type-icon">⬆️</span>
                  <span>上升气流</span>
                </button>
                <button
                  className={`type-btn ${selectedAirCurrent.type === 'downdraft' ? 'active' : ''}`}
                  onClick={() => handleUpdateAirCurrent({ type: 'downdraft' })}
                  style={{ borderColor: getAirCurrentColor('downdraft') }}
                >
                  <span className="type-icon">⬇️</span>
                  <span>下降气流</span>
                </button>
                <button
                  className={`type-btn ${selectedAirCurrent.type === 'turbulence' ? 'active' : ''}`}
                  onClick={() => handleUpdateAirCurrent({ type: 'turbulence' })}
                  style={{ borderColor: getAirCurrentColor('turbulence') }}
                >
                  <span className="type-icon">🌀</span>
                  <span>湍流</span>
                </button>
              </div>
            </div>

            <div className="property-section">
              <h4>位置</h4>
              <div className="vector3-input">
                <div className="input-group">
                  <label className="axis-label x">X</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.position.x}
                    onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label y">Y</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.position.y}
                    onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                    step={5}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label z">Z</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.position.z}
                    onChange={(e) => handlePositionChange('z', Number(e.target.value))}
                    step={5}
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>属性</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>半径</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.radius}
                    onChange={(e) => handleUpdateAirCurrent({ radius: Number(e.target.value) })}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
                <div className="form-group">
                  <label>强度</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.strength}
                    onChange={(e) => handleUpdateAirCurrent({ strength: Number(e.target.value) })}
                    min={0.05}
                    max={0.5}
                    step={0.01}
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>方向向量</h4>
              <div className="vector3-input">
                <div className="input-group">
                  <label className="axis-label x">X</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.direction.x}
                    onChange={(e) => handleDirectionChange('x', Number(e.target.value))}
                    step={0.05}
                    min={-1}
                    max={1}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label y">Y</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.direction.y}
                    onChange={(e) => handleDirectionChange('y', Number(e.target.value))}
                    step={0.05}
                    min={-1}
                    max={1}
                  />
                </div>
                <div className="input-group">
                  <label className="axis-label z">Z</label>
                  <input
                    type="number"
                    value={selectedAirCurrent.direction.z}
                    onChange={(e) => handleDirectionChange('z', Number(e.target.value))}
                    step={0.05}
                    min={-1}
                    max={1}
                  />
                </div>
              </div>
            </div>

            <div className="property-section">
              <h4>静态</h4>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={selectedAirCurrent.isStatic}
                  onChange={(e) => handleUpdateAirCurrent({ isStatic: e.target.checked })}
                />
                静态气流（不随时间消失）
              </label>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-icon">💨</div>
            <h3>选择一个气流进行编辑</h3>
            <p>从左侧列表中选择一个气流，或点击"添加"按钮创建新气流</p>
          </div>
        )}
      </div>
    </div>
  );
};
