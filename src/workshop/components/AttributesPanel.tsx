import React from 'react';
import type { PartAttributes, FlightParams } from '../types';
import { ATTRIBUTE_NAMES } from '../types';

interface AttributesPanelProps {
  totalAttributes: PartAttributes;
  flightParams: FlightParams;
  scoreBonus: number;
}

export const AttributesPanel: React.FC<AttributesPanelProps> = ({
  totalAttributes,
  flightParams,
  scoreBonus,
}) => {
  const maxAttrValue = 100;

  return (
    <div className="attributes-panel">
      <h3 className="panel-title">综合属性</h3>

      <div className="score-bonus-display">
        <span className="bonus-label">分数加成</span>
        <span className="bonus-value">+{scoreBonus}%</span>
      </div>

      <div className="attributes-grid">
        {(Object.keys(totalAttributes) as (keyof PartAttributes)[]).map((key) => {
          const value = totalAttributes[key];
          const percentage = Math.min(100, Math.max(0, (value / maxAttrValue) * 100));
          const isPositive = value >= 0;

          return (
            <div key={key} className="attribute-row">
              <div className="attribute-header">
                <span className="attribute-name">{ATTRIBUTE_NAMES[key]}</span>
                <span className={`attribute-num ${isPositive ? 'positive' : 'negative'}`}>
                  {value > 0 ? '+' : ''}{value}
                </span>
              </div>
              <div className="attribute-bar-container">
                <div
                  className={`attribute-bar ${isPositive ? 'positive' : 'negative'}`}
                  style={{ width: `${Math.abs(percentage)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flight-params-section">
        <h4 className="section-subtitle">飞行参数</h4>
        <div className="params-grid">
          <div className="param-item">
            <span className="param-label">最大速度</span>
            <span className="param-value">{flightParams.maxSpeed.toFixed(2)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">加速能力</span>
            <span className="param-value">{flightParams.acceleration.toFixed(3)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">升力系数</span>
            <span className="param-value">{flightParams.liftForce.toFixed(4)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">阻力系数</span>
            <span className="param-value">{flightParams.dragCoefficient.toFixed(3)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">稳定系数</span>
            <span className="param-value">{flightParams.stabilityFactor.toFixed(2)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">风速响应</span>
            <span className="param-value">{flightParams.windResponse.toFixed(2)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">最大高度</span>
            <span className="param-value">{Math.floor(flightParams.maxAltitude)}</span>
          </div>
          <div className="param-item">
            <span className="param-label">转向速率</span>
            <span className="param-value">{flightParams.turnRate.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
