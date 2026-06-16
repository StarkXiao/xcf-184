import React, { useState, useRef } from 'react';
import type { WindObservationData, UIFlightTip } from '../game/types';
import { WIND_RELATION_NAMES, WIND_RELATION_ICONS, WIND_RELATION_COLORS } from '../game/StrategyEngine';
import { WEATHER_SAFETY_THRESHOLDS } from '../game/types';

interface WindObservationPanelProps {
  observation: WindObservationData | null;
  tips: UIFlightTip[];
  onClose?: () => void;
  compact?: boolean;
}

export const WindObservationPanel: React.FC<WindObservationPanelProps> = ({
  observation,
  tips,
  onClose,
  compact = false,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!observation) return null;

  const {
    windSpeed,
    windDirectionAngle,
    kiteVelocityAngle,
    windRelation,
    turbulenceLevel,
    gustStrength,
    gustFrequency,
    windAtAltitude,
    recommendedAltitude,
    windHistory,
  } = observation;

  const getWindSpeedLevel = (speed: number): { level: string; color: string } => {
    if (speed > WEATHER_SAFETY_THRESHOLDS.dangerWindSpeed) return { level: '危险', color: '#ff0000' };
    if (speed > WEATHER_SAFETY_THRESHOLDS.warningWindSpeed) return { level: '警告', color: '#ff8c00' };
    if (speed > WEATHER_SAFETY_THRESHOLDS.safeWindSpeed) return { level: '适中', color: '#ffd700' };
    return { level: '温和', color: '#4ecdc4' };
  };

  const getTurbulenceLevel = (level: number): { level: string; color: string } => {
    if (level > WEATHER_SAFETY_THRESHOLDS.dangerTurbulence) return { level: '极强', color: '#ff0000' };
    if (level > WEATHER_SAFETY_THRESHOLDS.warningTurbulence) return { level: '较强', color: '#ff8c00' };
    if (level > WEATHER_SAFETY_THRESHOLDS.safeTurbulence) return { level: '中等', color: '#ffd700' };
    return { level: '轻微', color: '#4ecdc4' };
  };

  const windSpeedInfo = getWindSpeedLevel(windSpeed);
  const turbulenceInfo = getTurbulenceLevel(turbulenceLevel);

  const CompassRose: React.FC<{ angle: number; kiteAngle: number }> = ({ angle, kiteAngle }) => {
    const size = compact ? 100 : 140;
    const center = size / 2;
    const radius = size * 0.35;

    const windX = center + Math.cos((angle * Math.PI) / 180) * radius;
    const windY = center + Math.sin((angle * Math.PI) / 180) * radius;
    const kiteX = center + Math.cos((kiteAngle * Math.PI) / 180) * radius * 0.7;
    const kiteY = center + Math.sin((kiteAngle * Math.PI) / 180) * radius * 0.7;

    const directionLabels = [
      { label: 'N', angle: -90 },
      { label: 'E', angle: 0 },
      { label: 'S', angle: 90 },
      { label: 'W', angle: 180 },
    ];

    return (
      <svg width={size} height={size} className="compass-rose">
        <circle cx={center} cy={center} r={radius + 15} fill="none" stroke="#333" strokeWidth="2" opacity="0.5" />
        <circle cx={center} cy={center} r={radius * 0.7} fill="none" stroke="#444" strokeWidth="1" opacity="0.3" />
        <circle cx={center} cy={center} r={radius * 0.3} fill="none" stroke="#444" strokeWidth="1" opacity="0.3" />

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
          x2={windX}
          y2={windY}
          stroke="#00bfff"
          strokeWidth="3"
          markerEnd="url(#windArrow)"
          className="wind-direction-line"
        />

        <line
          x1={center}
          y1={center}
          x2={kiteX}
          y2={kiteY}
          stroke="#ff6b6b"
          strokeWidth="2"
          strokeDasharray="4,2"
          opacity="0.8"
        />

        <circle cx={center} cy={center} r="6" fill="#333" stroke="#fff" strokeWidth="2" />

        <text
          x={windX + 12}
          y={windY - 5}
          fill="#00bfff"
          fontSize="9"
          fontWeight="bold"
        >
          风
        </text>
        <text
          x={kiteX + 12}
          y={kiteY - 5}
          fill="#ff6b6b"
          fontSize="9"
        >
          你
        </text>

        <defs>
          <marker id="windArrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#00bfff" />
          </marker>
        </defs>
      </svg>
    );
  };

  const WindHistoryChart: React.FC = () => {
    if (windHistory.length < 2) return null;

    const width = 200;
    const height = 60;
    const padding = 5;

    const maxSpeed = Math.max(...windHistory.map((d) => d.speed), 0.5);
    const minSpeed = Math.min(...windHistory.map((d) => d.speed), 0);

    const points = windHistory.map((d, i) => {
      const x = padding + (i / (windHistory.length - 1)) * (width - padding * 2);
      const y = height - padding - ((d.speed - minSpeed) / (maxSpeed - minSpeed || 1)) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="wind-history-chart">
        <div className="chart-label">风速变化</div>
        <svg width={width} height={height}>
          <polyline
            points={points}
            fill="none"
            stroke="#00bfff"
            strokeWidth="2"
          />
          <circle
            cx={parseFloat(points.split(' ').pop()?.split(',')[0] || '0')}
            cy={parseFloat(points.split(' ').pop()?.split(',')[1] || '0')}
            r="3"
            fill="#00bfff"
          />
        </svg>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="wind-observation-compact" ref={panelRef}>
        <div className="compact-header">
          <div className="compact-relation" style={{ color: WIND_RELATION_COLORS[windRelation] }}>
            {WIND_RELATION_ICONS[windRelation]} {WIND_RELATION_NAMES[windRelation]}
          </div>
          <div className="compact-wind-speed" style={{ color: windSpeedInfo.color }}>
            {windSpeed.toFixed(2)} m/s
          </div>
        </div>
        <CompassRose angle={windDirectionAngle} kiteAngle={kiteVelocityAngle} />
      </div>
    );
  }

  return (
    <div className="wind-observation-panel" ref={panelRef}>
      <div className="panel-header">
        <h3 className="panel-title">
          <span className="panel-icon">🌬️</span>
          风向观测站
        </h3>
        {onClose && (
          <button className="panel-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="panel-content">
        <div className="compass-section">
          <CompassRose angle={windDirectionAngle} kiteAngle={kiteVelocityAngle} />
          <div className="wind-relation-badge" style={{ background: WIND_RELATION_COLORS[windRelation] }}>
            {WIND_RELATION_ICONS[windRelation]} {WIND_RELATION_NAMES[windRelation]}
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">风速</div>
            <div className="metric-value" style={{ color: windSpeedInfo.color }}>
              {windSpeed.toFixed(2)}
            </div>
            <div className="metric-unit">m/s</div>
            <div className="metric-status" style={{ color: windSpeedInfo.color }}>
              {windSpeedInfo.level}
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">当前高度风速</div>
            <div className="metric-value" style={{ color: windSpeedInfo.color }}>
              {windAtAltitude.toFixed(2)}
            </div>
            <div className="metric-unit">m/s</div>
            <div className="metric-sub">
              高度影响
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">湍流强度</div>
            <div className="metric-value" style={{ color: turbulenceInfo.color }}>
              {(turbulenceLevel * 100).toFixed(0)}%
            </div>
            <div className="metric-status" style={{ color: turbulenceInfo.color }}>
              {turbulenceInfo.level}
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-label">阵风强度</div>
            <div className="metric-value">
              {(gustStrength * 100).toFixed(0)}%
            </div>
            <div className="metric-label-small">
              频率: {(gustFrequency * 60).toFixed(1)}/min
            </div>
          </div>

          <div className="metric-item full-width">
            <div className="metric-row">
              <div>
                <span className="metric-label">风向角度:</span>
                <span className="metric-value-small"> {windDirectionAngle.toFixed(0)}°</span>
              </div>
              <div>
                <span className="metric-label">飞行方向:</span>
                <span className="metric-value-small"> {kiteVelocityAngle.toFixed(0)}°</span>
              </div>
            </div>
            <div className="metric-row">
              <div>
                <span className="metric-label">推荐高度:</span>
                <span className="metric-value-small highlight"> {Math.floor(recommendedAltitude)}m</span>
              </div>
            </div>
          </div>
        </div>

        <button
          className="history-toggle"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? '隐藏历史' : '显示风速历史'}
        </button>

        {showHistory && <WindHistoryChart />}

        {tips.length > 0 && (
          <div className="flight-tips">
            <div className="tips-header">💡 飞行提示</div>
            <div className="tips-list">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className={`tip-item tip-${tip.type}`}
                >
                  <span className="tip-icon">{tip.icon}</span>
                  <span className="tip-message">{tip.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
