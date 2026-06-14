import React, { useState, useEffect, useMemo } from 'react';
import type { WindFieldConfig, WeatherScene, WeatherConfig } from '../types';
import { DIFFICULTY_NAMES, DIFFICULTY_COLORS } from '../types';
import type { GameConfig } from '../../game/types';
import { DEFAULT_WEATHER, DEFAULT_WIND_FIELD } from '../../game/types';

interface WindConfigPanelProps {
  currentScene: WeatherScene | null;
  onUpdateScene: (sceneId: string, updates: Partial<WeatherScene>) => boolean;
  onSaveScene: (
    name: string,
    description: string,
    weatherConfig: WeatherConfig,
    gameConfig: Partial<GameConfig>,
    windField: WindFieldConfig,
    icon: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme',
    tags: string[]
  ) => WeatherScene;
  onSetCurrentScene: (scene: WeatherScene | null) => void;
  onStartFlight: (scene: WeatherScene) => void;
}

interface ConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const ConfigSlider: React.FC<ConfigSliderProps> = ({
  label, value, min, max, step, unit = '', disabled = false, onChange
}) => (
  <div className={`config-slider ${disabled ? 'disabled' : ''}`}>
    <div className="config-slider-header">
      <span className="config-slider-label">{label}</span>
      <span className="config-slider-value">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="config-slider-input"
      disabled={disabled}
    />
    <div className="config-slider-scale">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

export const WindConfigPanel: React.FC<WindConfigPanelProps> = ({
  currentScene,
  onUpdateScene,
  onSaveScene,
  onSetCurrentScene,
  onStartFlight,
}) => {
  const [windField, setWindField] = useState<WindFieldConfig>(DEFAULT_WIND_FIELD);
  const [weatherConfig, setWeatherConfig] = useState<WeatherConfig>(DEFAULT_WEATHER);
  const [gameConfig, setGameConfig] = useState<Partial<GameConfig>>({});
  const [sceneName, setSceneName] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('☀️');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'extreme'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [previewForce, setPreviewForce] = useState({ x: 0, y: 0, z: 0 });

  const icons = ['☀️', '☁️', '💨', '⛈️', '🌫️', '🌅', '🌆', '🌙', '🦅', '🌀', '🏔️'];

  useEffect(() => {
    setTimeout(() => {
      if (currentScene) {
        setWindField(currentScene.windField);
        setWeatherConfig(currentScene.weatherConfig);
        setGameConfig(currentScene.gameConfig);
        setSceneName(currentScene.name);
        setSceneDescription(currentScene.description);
        setSelectedIcon(currentScene.icon);
        setSelectedDifficulty(currentScene.difficulty);
        setTags(currentScene.tags);
      } else {
        setWindField(DEFAULT_WIND_FIELD);
        setWeatherConfig(DEFAULT_WEATHER);
        setGameConfig({});
        setSceneName('');
        setSceneDescription('');
        setSelectedIcon('☀️');
        setSelectedDifficulty('medium');
        setTags([]);
      }
    }, 0);
  }, [currentScene]);

  useEffect(() => {
    const interval = setInterval(() => {
      const wind = windField.windDirection;
      const speed = windField.windSpeed;
      const turbulence = (Math.random() - 0.5) * windField.turbulenceLevel * 0.2;
      const gust = Math.sin(Date.now() * windField.gustFrequency * 0.01) * windField.gustStrength;

      setPreviewForce({
        x: wind.x * (speed + gust + turbulence),
        y: wind.y * (speed + gust),
        z: wind.z * (speed + gust + turbulence),
      });
    }, 100);

    return () => clearInterval(interval);
  }, [windField]);

  const estimatedDifficulty = useMemo((): 'easy' | 'medium' | 'hard' | 'extreme' => {
    const score = windField.windSpeed * 50 + windField.turbulenceLevel * 50 + windField.gustStrength * 30;
    if (score < 25) return 'easy';
    if (score < 50) return 'medium';
    if (score < 75) return 'hard';
    return 'extreme';
  }, [windField]);

  const handleWindFieldChange = (key: keyof WindFieldConfig, value: number | boolean | { x: number; y: number; z: number }) => {
    setWindField((prev) => ({ ...prev, [key]: value }));
    if (currentScene) {
      onUpdateScene(currentScene.id, {
        windField: { ...windField, [key]: value },
      });
    }
  };

  const handleWeatherConfigChange = (key: keyof WeatherConfig, value: number | boolean | { x: number; y: number; z: number }) => {
    setWeatherConfig((prev: WeatherConfig) => ({ ...prev, [key]: value }));
    if (currentScene) {
      onUpdateScene(currentScene.id, {
        weatherConfig: { ...weatherConfig, [key]: value },
      });
    }
  };

  const handleGameConfigChange = (key: keyof GameConfig, value: number) => {
    setGameConfig((prev: Partial<GameConfig>) => ({ ...prev, [key]: value }));
    if (currentScene) {
      onUpdateScene(currentScene.id, {
        gameConfig: { ...gameConfig, [key]: value },
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      if (currentScene) {
        onUpdateScene(currentScene.id, { tags: updatedTags });
      }
    }
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    if (currentScene) {
      onUpdateScene(currentScene.id, { tags: updatedTags });
    }
  };

  const handleSave = () => {
    if (!sceneName.trim()) return;

    const scene = onSaveScene(
      sceneName.trim(),
      sceneDescription.trim(),
      weatherConfig,
      gameConfig,
      windField,
      selectedIcon,
      selectedDifficulty,
      tags
    );
    onSetCurrentScene(scene);
    setShowSaveModal(false);
  };

  const handleReset = () => {
    setWindField(DEFAULT_WIND_FIELD);
    setWeatherConfig(DEFAULT_WEATHER);
    setGameConfig({});
    onSetCurrentScene(null);
  };

  const handleStartFlight = () => {
    if (currentScene) {
      onStartFlight(currentScene);
    } else {
      const scene = onSaveScene(
        sceneName.trim() || '自定义场景',
        sceneDescription.trim(),
        weatherConfig,
        gameConfig,
        windField,
        selectedIcon,
        estimatedDifficulty,
        tags
      );
      onStartFlight(scene);
    }
  };

  const windAngle = Math.atan2(windField.windDirection.z, windField.windDirection.x) * (180 / Math.PI);

  return (
    <div className="wind-config-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-icon">💨</span>
          风场配置
        </h2>
        <div className="panel-actions">
          <button className="btn-secondary" onClick={handleReset}>
            重置
          </button>
          <button className="btn-primary" onClick={() => setShowSaveModal(true)}>
            保存场景
          </button>
        </div>
      </div>

      <div className="config-grid">
        <div className="config-section">
          <h3 className="section-title">基础风场参数</h3>

          <ConfigSlider
            label="风速"
            value={windField.windSpeed}
            min={0}
            max={2}
            step={0.05}
            unit=" m/s"
            onChange={(v) => handleWindFieldChange('windSpeed', v)}
          />

          <ConfigSlider
            label="湍流强度"
            value={windField.turbulenceLevel}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => handleWindFieldChange('turbulenceLevel', v)}
          />

          <div className="config-slider">
            <div className="config-slider-header">
              <span className="config-slider-label">风向</span>
              <span className="config-slider-value">{windAngle.toFixed(0)}°</span>
            </div>
            <div className="wind-direction-control">
              <div
                className="wind-compass"
                style={{ transform: `rotate(${-windAngle}deg)` }}
              >
                <div className="wind-arrow">↑</div>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={5}
                value={windAngle}
                onChange={(e) => {
                  const angle = parseFloat(e.target.value) * (Math.PI / 180);
                  handleWindFieldChange('windDirection', {
                    x: Math.cos(angle),
                    y: 0,
                    z: Math.sin(angle),
                  });
                }}
                className="config-slider-input"
                disabled={windField.windDirectionLocked}
              />
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={windField.windDirectionLocked}
                onChange={(e) => handleWindFieldChange('windDirectionLocked', e.target.checked)}
              />
              锁定风向（场景复现更稳定）
            </label>
          </div>
        </div>

        <div className="config-section">
          <h3 className="section-title">高级风场参数</h3>

          <ConfigSlider
            label="阵风强度"
            value={windField.gustStrength}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(v) => handleWindFieldChange('gustStrength', v)}
          />

          <ConfigSlider
            label="阵风频率"
            value={windField.gustFrequency}
            min={0}
            max={0.2}
            step={0.01}
            onChange={(v) => handleWindFieldChange('gustFrequency', v)}
          />

          <ConfigSlider
            label="风切变系数"
            value={windField.shearFactor}
            min={0}
            max={0.1}
            step={0.005}
            onChange={(v) => handleWindFieldChange('shearFactor', v)}
          />

          <ConfigSlider
            label="边界层高度"
            value={windField.boundaryLayerHeight}
            min={20}
            max={200}
            step={10}
            unit=" m"
            onChange={(v) => handleWindFieldChange('boundaryLayerHeight', v)}
          />
        </div>

        <div className="config-section">
          <h3 className="section-title">天气参数</h3>

          <ConfigSlider
            label="云量"
            value={weatherConfig.cloudCoverage}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => handleWeatherConfigChange('cloudCoverage', v)}
          />

          <ConfigSlider
            label="时间"
            value={weatherConfig.timeOfDay}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => handleWeatherConfigChange('timeOfDay', v)}
            disabled={weatherConfig.timeOfDayFrozen}
          />

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={weatherConfig.timeOfDayFrozen}
              onChange={(e) => handleWeatherConfigChange('timeOfDayFrozen', e.target.checked)}
            />
            固定时间（禁用昼夜循环）
          </label>

          <ConfigSlider
            label="湍流等级"
            value={weatherConfig.turbulenceLevel}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => handleWeatherConfigChange('turbulenceLevel', v)}
          />
        </div>

        <div className="config-section">
          <h3 className="section-title">游戏参数</h3>

          <ConfigSlider
            label="重力"
            value={gameConfig.gravity ?? 0.015}
            min={0.01}
            max={0.03}
            step={0.001}
            onChange={(v) => handleGameConfigChange('gravity', v)}
          />

          <ConfigSlider
            label="气流生成率"
            value={gameConfig.airCurrentSpawnRate ?? 0.02}
            min={0.01}
            max={0.05}
            step={0.005}
            onChange={(v) => handleGameConfigChange('airCurrentSpawnRate', v)}
          />

          <ConfigSlider
            label="建筑密度"
            value={gameConfig.buildingDensity ?? 0.3}
            min={0.1}
            max={0.5}
            step={0.05}
            onChange={(v) => handleGameConfigChange('buildingDensity', v)}
          />
        </div>
      </div>

      <div className="preview-section">
        <h3 className="section-title">风场预览</h3>
        <div className="wind-visualization">
          <div className="wind-vector-display">
            <div
              className="wind-vector"
              style={{
                transform: `rotate(${-windAngle}deg) scaleX(${0.5 + windField.windSpeed * 2})`,
                opacity: 0.3 + windField.windSpeed * 0.5,
              }}
            />
            <div className="preview-stats">
              <div className="preview-stat">
                <span className="preview-stat-label">X 轴风力</span>
                <span className="preview-stat-value">{previewForce.x.toFixed(3)}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">Y 轴风力</span>
                <span className="preview-stat-value">{previewForce.y.toFixed(3)}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">Z 轴风力</span>
                <span className="preview-stat-value">{previewForce.z.toFixed(3)}</span>
              </div>
              <div className="preview-stat">
                <span className="preview-stat-label">预估难度</span>
                <span
                  className="preview-stat-value"
                  style={{ color: DIFFICULTY_COLORS[estimatedDifficulty] }}
                >
                  {DIFFICULTY_NAMES[estimatedDifficulty]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="config-footer">
        <button className="btn-primary btn-large" onClick={handleStartFlight}>
          <span className="btn-icon">🚀</span>
          开始飞行测试
        </button>
      </div>

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">保存天气场景</h3>

            <div className="form-group">
              <label>场景名称</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                placeholder="请输入场景名称"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>场景描述</label>
              <textarea
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                placeholder="描述这个天气场景的特点..."
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>选择图标</label>
              <div className="icon-selector">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    className={`icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>难度等级</label>
              <div className="difficulty-selector">
                {(['easy', 'medium', 'hard', 'extreme'] as const).map((diff) => (
                  <button
                    key={diff}
                    className={`difficulty-option ${selectedDifficulty === diff ? 'selected' : ''}`}
                    style={{
                      borderColor: DIFFICULTY_COLORS[diff],
                      color: selectedDifficulty === diff ? '#fff' : DIFFICULTY_COLORS[diff],
                      backgroundColor: selectedDifficulty === diff ? DIFFICULTY_COLORS[diff] : 'transparent',
                    }}
                    onClick={() => setSelectedDifficulty(diff)}
                  >
                    {DIFFICULTY_NAMES[diff]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>标签</label>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="输入标签后按回车添加"
                  className="form-input tag-input"
                />
                <button className="btn-secondary" onClick={handleAddTag}>添加</button>
              </div>
              <div className="tags-display">
                {tags.map((tag) => (
                  <span key={tag} className="tag-badge">
                    {tag}
                    <button className="tag-remove" onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSave}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
