import React from 'react';
import type { BestTrajectory, TrajectoryPoint } from '../types';

interface BestTrajectoriesProps {
  trajectories: BestTrajectory[];
  compact?: boolean;
}

export const BestTrajectories: React.FC<BestTrajectoriesProps> = ({ trajectories, compact = false }) => {
  const formatValue = (type: BestTrajectory['type'], value: number): { num: string; unit: string } => {
    switch (type) {
      case 'distance':
        if (value >= 1000) return { num: (value / 1000).toFixed(2), unit: 'km' };
        return { num: Math.floor(value).toString(), unit: 'm' };
      case 'score':
        return { num: Math.floor(value).toLocaleString(), unit: '分' };
      case 'height':
        return { num: Math.floor(value).toString(), unit: 'm' };
      case 'stability':
        return { num: value.toFixed(1), unit: '%' };
      default:
        return { num: value.toFixed(1), unit: '' };
    }
  };

  const getTypeIcon = (type: BestTrajectory['type']): string => {
    switch (type) {
      case 'distance': return '🛤️';
      case 'score': return '⭐';
      case 'height': return '🏔️';
      case 'stability': return '💎';
    }
  };

  const renderMiniChart = (points: TrajectoryPoint[]) => {
    if (points.length < 2) {
      return (
        <div className="trajectory-mini-chart">
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)'
          }}>
            无轨迹数据
          </div>
        </div>
      );
    }

    const heightPoints = points.map((p) => p.y);
    const minH = Math.min(...heightPoints);
    const maxH = Math.max(...heightPoints);
    const rangeH = Math.max(maxH - minH, 1);
    const w = 100;
    const h = 70;
    const padding = 4;

    const pathD = heightPoints
      .map((p, i) => {
        const x = padding + (i / (heightPoints.length - 1)) * (w - 2 * padding);
        const y = h - padding - ((p - minH) / rangeH) * (h - 2 * padding);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');

    const areaD = `${pathD} L ${w - padding} ${h - padding} L ${padding} ${h - padding} Z`;

    return (
      <div className="trajectory-mini-chart">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${Math.random().toString(36).slice(2, 8)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaD}
            fill="url(#grad-f59e0b)"
            opacity="0.6"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  const formatDate = (timestamp: number): string => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (trajectories.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <div className="empty-state-title">暂无最佳纪录</div>
        <div className="empty-state-desc">完成飞行后自动记录最佳成绩</div>
      </div>
    );
  }

  const displayTrajectories = compact ? trajectories.slice(0, 4) : trajectories;

  return (
    <div className="best-trajectories-grid">
      {displayTrajectories.map((traj) => {
        const formatted = formatValue(traj.type, traj.value);
        return (
          <div key={traj.id} className="best-trajectory-card">
            <div className="best-trajectory-type">
              <span>{getTypeIcon(traj.type)}</span>
              {traj.title}
            </div>
            <div className="best-trajectory-value">{formatted.num}</div>
            <div className="best-trajectory-unit">{formatted.unit}</div>

            {!compact && renderMiniChart(traj.trajectory)}

            <div className="best-trajectory-meta">
              <span>🎮 {traj.modeName}</span>
              <span>📅 {formatDate(traj.achievedAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
