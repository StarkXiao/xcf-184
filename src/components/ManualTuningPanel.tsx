import React, { useState } from 'react';
import type { WindFieldConfig, FlightParams, WeatherConfig, TuningPreset, StrategySuggestion } from '../game/types';
import { TUNING_PRESETS } from '../game/types';

interface ManualTuningPanelProps {
  windField: WindFieldConfig | null;
  flightParams: FlightParams | null;
  weatherConfig: WeatherConfig | null;
  suggestions: StrategySuggestion[];
  onWindFieldChange: (config: Partial<WindFieldConfig>) => void;
  onFlightParamsChange: (params: Partial<FlightParams>) => void;
  onWeatherConfigChange: (config: Partial<WeatherConfig>) => void;
  onApplyPreset: (preset: TuningPreset) => void;
  onReset: () => void;
  onClose?: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description?: string;
  onChange: (value: number) => void;
  color?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  description,
  onChange,
  color = '#4ecdc4',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value" style={{ color }}>
          {value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
          {unit}
        </span>
      </div>
      <div className="slider-track">
        <div
          className="slider-fill"
          style={{ width: `${percentage}%`, background: color }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
        />
      </div>
      {description && <div className="slider-description">{description}</div>}
    </div>
  );
};

export const ManualTuningPanel: React.FC<ManualTuningPanelProps> = ({
  windField,
  flightParams,
  weatherConfig,
  suggestions,
  onWindFieldChange,
  onFlightParamsChange,
  onWeatherConfigChange,
  onApplyPreset,
  onReset,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'weather' | 'flight' | 'presets'>('weather');
  const [directionAngle, setDirectionAngle] = useState(
    windField ? Math.atan2(windField.windDirection.z, windField.windDirection.x) * (180 / Math.PI) : 0
  );

  if (!windField || !flightParams || !weatherConfig) return null;

  const handleDirectionChange = (angle: number) => {
    setDirectionAngle(angle);
    const rad = (angle * Math.PI) / 180;
    onWindFieldChange({
      windDirection: {
        x: Math.cos(rad),
        y: windField.windDirection.y,
        z: Math.sin(rad),
      },
    });
  };

  const DirectionWheel: React.FC = () => {
    const size = 120;
    const center = size / 2;
    const radius = size * 0.4;

    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - center;
      const y = e.clientY - rect.top - center;
      const angle = Math.atan2(y, x) * (180 / Math.PI);
      handleDirectionChange(angle);
    };

    const arrowX = center + Math.cos((directionAngle * Math.PI) / 180) * radius;
    const arrowY = center + Math.sin((directionAngle * Math.PI) / 180) * radius;

    const directionLabels = [
      { label: '北', angle: -90 },
      { label: '东', angle: 0 },
      { label: '南', angle: 90 },
      { label: '西', angle: 180 },
    ];

    return (
      <div className="direction-wheel-container">
        <div className="direction-wheel-label">风向控制 (点击设置)</div>
        <svg width={size} height={size} onClick={handleClick} className="direction-wheel">
          <circle cx={center} cy={center} r={radius + 10} fill="#1a1a2e" stroke="#444" strokeWidth="2" />
          
          {directionLabels.map((d, i) => {
            const x = center + Math.cos((d.angle * Math.PI) / 180) * (radius + 22);
            const y = center + Math.sin((d.angle * Math.PI) / 180) * (radius + 22);
            return (
              <text
                key={i}
                x={x}
                y={y}
                fill="#888"
                fontSize="10"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {d.label}
              </text>
            );
          })}

          <line
            x1={center}
            y1={center}
            x2={arrowX}
            y2={arrowY}
            stroke="#00bfff"
            strokeWidth="3"
            markerEnd="url(#directionArrow)"
          />
          <circle cx={center} cy={center} r="4" fill="#333" />
          
          <text
            x={arrowX + 15}
            y={arrowY}
            fill="#00bfff"
            fontSize="10"
            fontWeight="bold"
          >
            {Math.round(directionAngle)}°
          </text>

          <defs>
            <marker id="directionArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#00bfff" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  };

  const getSuggestionForParam = (paramName: string): StrategySuggestion | undefined => {
    return suggestions.find(
      (s) => s.action?.params && s.action.params[paramName] !== undefined
    );
  };

  const renderWeatherTab = () => (
    <div className="tuning-tab-content">
      <div className="tuning-section">
        <h4 className="section-title">🌬️ 风场参数</h4>
        <DirectionWheel />
        
        <SliderControl
          label="基础风速"
          value={windField.windSpeed}
          min={0}
          max={2}
          step={0.01}
          unit=" m/s"
          description="控制风筝受到的基础风力大小"
          onChange={(v) => onWindFieldChange({ windSpeed: v })}
          color={getSuggestionForParam('windSpeed')?.priority === 'critical' ? '#ff0000' : '#00bfff'}
        />

        <SliderControl
          label="湍流强度"
          value={windField.turbulenceLevel}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="影响飞行稳定性和控制难度"
          onChange={(v) => onWindFieldChange({ turbulenceLevel: v })}
          color={getSuggestionForParam('turbulenceLevel')?.priority === 'critical' ? '#ff0000' : '#ff8c00'}
        />

        <SliderControl
          label="阵风强度"
          value={windField.gustStrength}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="突然的风力变化幅度"
          onChange={(v) => onWindFieldChange({ gustStrength: v })}
          color="#ffd700"
        />

        <SliderControl
          label="阵风频率"
          value={windField.gustFrequency}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="阵风发生的频率"
          onChange={(v) => onWindFieldChange({ gustFrequency: v })}
          color="#ffd700"
        />

        <SliderControl
          label="风切变因子"
          value={windField.shearFactor}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="高空风速随高度变化率"
          onChange={(v) => onWindFieldChange({ shearFactor: v })}
          color="#96ceb4"
        />

        <SliderControl
          label="边界层高度"
          value={windField.boundaryLayerHeight}
          min={10}
          max={200}
          step={5}
          unit=" m"
          description="近地面风场受摩擦影响的高度"
          onChange={(v) => onWindFieldChange({ boundaryLayerHeight: v })}
          color="#45b7d1"
        />

        <div className="toggle-control">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={windField.windDirectionLocked}
              onChange={(e) => onWindFieldChange({ windDirectionLocked: e.target.checked })}
            />
            <span className="toggle-switch" />
            锁定风向 (防止随机变化)
          </label>
        </div>
      </div>

      <div className="tuning-section">
        <h4 className="section-title">☁️ 天气参数</h4>
        
        <SliderControl
          label="云量"
          value={weatherConfig.cloudCoverage}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="影响能见度和光照"
          onChange={(v) => onWeatherConfigChange({ cloudCoverage: v })}
          color="#88c9f9"
        />

        <SliderControl
          label="时间"
          value={weatherConfig.timeOfDay}
          min={0}
          max={1}
          step={0.01}
          unit=""
          description="0=午夜, 0.25=日出, 0.5=正午, 0.75=日落"
          onChange={(v) => {
            onWeatherConfigChange({ timeOfDay: v });
            if (weatherConfig.timeOfDayFrozen) {
              onWeatherConfigChange({ timeOfDayFrozen: true });
            }
          }}
          color="#ffa07a"
        />

        <div className="toggle-control">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={weatherConfig.timeOfDayFrozen}
              onChange={(e) => onWeatherConfigChange({ timeOfDayFrozen: e.target.checked })}
            />
            <span className="toggle-switch" />
            冻结时间
          </label>
        </div>
      </div>
    </div>
  );

  const renderFlightTab = () => (
    <div className="tuning-tab-content">
      <div className="tuning-section">
        <h4 className="section-title">🎮 飞行参数</h4>
        
        <SliderControl
          label="最大速度"
          value={flightParams.maxSpeed}
          min={0.5}
          max={3}
          step={0.05}
          unit=""
          description="风筝的最大飞行速度"
          onChange={(v) => onFlightParamsChange({ maxSpeed: v })}
          color={getSuggestionForParam('maxSpeed') ? '#ff6b6b' : '#4ecdc4'}
        />

        <SliderControl
          label="加速度"
          value={flightParams.acceleration}
          min={0.1}
          max={1}
          step={0.05}
          unit=""
          description="达到最大速度的快慢"
          onChange={(v) => onFlightParamsChange({ acceleration: v })}
          color="#45b7d1"
        />

        <SliderControl
          label="升力系数"
          value={flightParams.liftForce}
          min={0.005}
          max={0.05}
          step={0.001}
          unit=""
          description="风筝获得的上升力大小"
          onChange={(v) => onFlightParamsChange({ liftForce: v })}
          color="#96ceb4"
        />

        <SliderControl
          label="阻力系数"
          value={flightParams.dragCoefficient}
          min={0.9}
          max={1}
          step={0.001}
          unit=""
          description="速度衰减系数，越小滑翔越远"
          onChange={(v) => onFlightParamsChange({ dragCoefficient: v })}
          color="#dda0dd"
        />

        <SliderControl
          label="稳定性因子"
          value={flightParams.stabilityFactor}
          min={0.5}
          max={2}
          step={0.05}
          unit=""
          description="抵抗湍流和保持航向的能力"
          onChange={(v) => onFlightParamsChange({ stabilityFactor: v })}
          color={getSuggestionForParam('stabilityFactor') ? '#ff8c00' : '#ffd700'}
        />

        <SliderControl
          label="风力响应"
          value={flightParams.windResponse}
          min={0.5}
          max={2}
          step={0.05}
          unit=""
          description="风筝对风力变化的敏感程度"
          onChange={(v) => onFlightParamsChange({ windResponse: v })}
          color="#87ceeb"
        />

        <SliderControl
          label="最大高度"
          value={flightParams.maxAltitude}
          min={100}
          max={500}
          step={10}
          unit=" m"
          description="风筝能到达的最大高度"
          onChange={(v) => onFlightParamsChange({ maxAltitude: v })}
          color="#98d8c8"
        />

        <SliderControl
          label="转向速率"
          value={flightParams.turnRate}
          min={0.5}
          max={2}
          step={0.05}
          unit=""
          description="转向的灵活程度"
          onChange={(v) => onFlightParamsChange({ turnRate: v })}
          color="#f7dc6f"
        />
      </div>
    </div>
  );

  const renderPresetsTab = () => (
    <div className="tuning-tab-content">
      <div className="tuning-section">
        <h4 className="section-title">📋 快速预设</h4>
        <div className="presets-grid">
          {TUNING_PRESETS.map((preset) => (
            <div key={preset.id} className="preset-card">
              <div className="preset-header">
                <h5 className="preset-name">{preset.name}</h5>
                <div className="preset-tags">
                  {preset.conditions.map((cond, i) => (
                    <span key={i} className="preset-tag">{cond}</span>
                  ))}
                </div>
              </div>
              <p className="preset-description">{preset.description}</p>
              <div className="preset-preview">
                <div className="preview-item">
                  <span>风速:</span>
                  <span>{preset.weatherConfig.windSpeed?.toFixed(2) || '-'}</span>
                </div>
                <div className="preview-item">
                  <span>湍流:</span>
                  <span>{preset.weatherConfig.turbulenceLevel?.toFixed(2) || '-'}</span>
                </div>
                <div className="preview-item">
                  <span>最大速度:</span>
                  <span>{preset.flightParams.maxSpeed?.toFixed(2) || '-'}</span>
                </div>
                <div className="preview-item">
                  <span>稳定性:</span>
                  <span>{preset.flightParams.stabilityFactor?.toFixed(2) || '-'}</span>
                </div>
              </div>
              <button
                className="preset-apply-btn"
                onClick={() => onApplyPreset(preset)}
              >
                应用预设
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="manual-tuning-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <span className="panel-icon">⚙️</span>
          手动调参面板
        </h3>
        {onClose && (
          <button className="panel-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="tuning-tabs">
        <button
          className={`tuning-tab ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          🌬️ 天气
        </button>
        <button
          className={`tuning-tab ${activeTab === 'flight' ? 'active' : ''}`}
          onClick={() => setActiveTab('flight')}
        >
          🎮 飞行
        </button>
        <button
          className={`tuning-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          📋 预设
        </button>
      </div>

      <div className="tuning-content">
        {activeTab === 'weather' && renderWeatherTab()}
        {activeTab === 'flight' && renderFlightTab()}
        {activeTab === 'presets' && renderPresetsTab()}
      </div>

      <div className="tuning-actions">
        <button className="reset-btn" onClick={onReset}>
          🔄 重置默认
        </button>
      </div>
    </div>
  );
};
