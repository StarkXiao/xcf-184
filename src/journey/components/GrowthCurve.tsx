import React, { useState, useMemo } from 'react';
import type { GrowthDataPoint } from '../types';

type MetricType = 'avgScore' | 'avgDistance' | 'avgMaxHeight' | 'avgStability' | 'totalFlights' | 'collisions';

const METRIC_OPTIONS: Array<{ id: MetricType; label: string; unit: string; color: string; icon: string }> = [
  { id: 'avgScore', label: '平均得分', unit: '', color: '#a855f7', icon: '⭐' },
  { id: 'avgDistance', label: '平均距离', unit: 'm', color: '#3b82f6', icon: '🛤️' },
  { id: 'avgMaxHeight', label: '平均最高', unit: 'm', color: '#06b6d4', icon: '🏔️' },
  { id: 'avgStability', label: '平均稳定', unit: '%', color: '#10b981', icon: '💎' },
  { id: 'totalFlights', label: '每日飞行', unit: '次', color: '#f59e0b', icon: '✈️' },
  { id: 'collisions', label: '每日碰撞', unit: '次', color: '#ef4444', icon: '💥' },
];

interface GrowthCurveProps {
  history: GrowthDataPoint[];
}

export const GrowthCurve: React.FC<GrowthCurveProps> = ({ history }) => {
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [metric, setMetric] = useState<MetricType>('avgScore');

  const recentData = useMemo(() => {
    return history.slice(-days);
  }, [history, days]);

  const metricConfig = METRIC_OPTIONS.find((m) => m.id === metric)!;

  const chartData = useMemo(() => {
    if (recentData.length === 0) return [];
    return recentData.map((d) => ({
      date: d.date.slice(5).replace('-', '/'),
      value: d[metric],
    }));
  }, [recentData, metric]);

  const statsSummary = useMemo(() => {
    if (chartData.length < 2) return null;

    const values = chartData.map((d) => d.value);
    const current = values[values.length - 1];
    const previous = values[values.length - 2];
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const trend = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return { current, previous, avg, max, min, trend };
  }, [chartData]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '80px 20px' }}>
          <div className="empty-state-icon">📈</div>
          <div className="empty-state-title">暂无成长数据</div>
          <div className="empty-state-desc">完成飞行后自动生成成长曲线</div>
        </div>
      );
    }

    const w = 100;
    const h = 100;
    const paddingL = 8;
    const paddingR = 4;
    const paddingT = 8;
    const paddingB = 14;

    const values = chartData.map((d) => d.value);
    const maxV = Math.max(...values, 1);
    const minV = Math.min(...values, 0);
    const rangeV = Math.max(maxV - minV, 1);

    const points = chartData.map((d, i) => {
      const x = paddingL + (i / Math.max(chartData.length - 1, 1)) * (w - paddingL - paddingR);
      const y = paddingT + (1 - (d.value - minV) / rangeV) * (h - paddingT - paddingB);
      return { x, y, value: d.value, date: d.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${h - paddingB} L ${points[0].x.toFixed(2)} ${h - paddingB} Z`;

    const gridLines = [0.25, 0.5, 0.75].map((ratio) => {
      const y = paddingT + ratio * (h - paddingT - paddingB);
      const value = maxV - ratio * rangeV;
      return { y, value };
    });

    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metricConfig.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={metricConfig.color} stopOpacity="0" />
          </linearGradient>
          <filter id="glowFilter">
            <feGaussianBlur stdDeviation="0.3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={paddingL}
              y1={g.y}
              x2={w - paddingR}
              y2={g.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.2"
              strokeDasharray="1 1"
            />
            <text
              x={paddingL}
              y={g.y - 0.8}
              fill="rgba(255,255,255,0.25)"
              fontSize="2.2"
              fontFamily="monospace"
            >
              {metricConfig.id === 'avgStability' || metricConfig.id === 'avgScore'
                ? g.value.toFixed(0)
                : g.value.toFixed(0)}
            </text>
          </g>
        ))}

        {points.length > 1 && (
          <>
            <path d={areaD} fill="url(#growthGrad)" />
            <path
              d={pathD}
              fill="none"
              stroke={metricConfig.color}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowFilter)"
            />
          </>
        )}

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={i === points.length - 1 ? 1.8 : 1}
              fill={metricConfig.color}
              stroke={i === points.length - 1 ? '#fff' : 'transparent'}
              strokeWidth="0.3"
            />
            {i % Math.max(1, Math.ceil(points.length / 7)) === 0 || i === points.length - 1 ? (
              <text
                x={p.x}
                y={h - 4}
                fill="rgba(255,255,255,0.35)"
                fontSize="2.3"
                textAnchor="middle"
              >
                {p.date}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <span>📈</span>
          成长曲线
        </div>
        <div className="section-subtitle">
          追踪 {history.length} 天的飞行数据
        </div>
      </div>

      <div className="growth-chart-section">
        <div className="growth-chart-header">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`growth-chart-btn ${metric === opt.id ? 'active' : ''}`}
                onClick={() => setMetric(opt.id)}
                style={metric === opt.id ? {
                  background: `${opt.color}22`,
                  borderColor: `${opt.color}55`,
                  color: opt.color,
                } : undefined}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                className={`flight-filter-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d as 7 | 14 | 30)}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>

        <div className="growth-chart">
          {renderChart()}
        </div>
      </div>

      {statsSummary && (
        <div className="growth-summary-cards">
          <div className="growth-summary-card">
            <div className="growth-summary-label">当前值</div>
            <div className="growth-summary-value" style={{ color: metricConfig.color }}>
              {metricConfig.id === 'avgStability' || metricConfig.id === 'avgScore'
                ? statsSummary.current.toFixed(1)
                : statsSummary.current.toFixed(0)}
              <span style={{ fontSize: 13, opacity: 0.5, marginLeft: 4, fontWeight: 500 }}>
                {metricConfig.unit}
              </span>
            </div>
            <div className={`growth-summary-trend ${statsSummary.trend >= 0 ? 'up' : 'down'}`}>
              {statsSummary.trend >= 0 ? '↑' : '↓'}
              {Math.abs(statsSummary.trend).toFixed(1)}% vs 前一日
            </div>
          </div>
          <div className="growth-summary-card">
            <div className="growth-summary-label">{days}日平均</div>
            <div className="growth-summary-value" style={{ color: '#a855f7' }}>
              {metricConfig.id === 'avgStability' || metricConfig.id === 'avgScore'
                ? statsSummary.avg.toFixed(1)
                : statsSummary.avg.toFixed(0)}
              <span style={{ fontSize: 13, opacity: 0.5, marginLeft: 4, fontWeight: 500 }}>
                {metricConfig.unit}
              </span>
            </div>
          </div>
          <div className="growth-summary-card">
            <div className="growth-summary-label">{days}日最高</div>
            <div className="growth-summary-value" style={{ color: '#10b981' }}>
              {metricConfig.id === 'avgStability' || metricConfig.id === 'avgScore'
                ? statsSummary.max.toFixed(1)
                : statsSummary.max.toFixed(0)}
              <span style={{ fontSize: 13, opacity: 0.5, marginLeft: 4, fontWeight: 500 }}>
                {metricConfig.unit}
              </span>
            </div>
          </div>
          <div className="growth-summary-card">
            <div className="growth-summary-label">{days}日最低</div>
            <div className="growth-summary-value" style={{ color: '#f59e0b' }}>
              {metricConfig.id === 'avgStability' || metricConfig.id === 'avgScore'
                ? statsSummary.min.toFixed(1)
                : statsSummary.min.toFixed(0)}
              <span style={{ fontSize: 13, opacity: 0.5, marginLeft: 4, fontWeight: 500 }}>
                {metricConfig.unit}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
