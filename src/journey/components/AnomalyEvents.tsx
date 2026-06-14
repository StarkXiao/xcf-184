import React, { useState } from 'react';
import type { AnomalyEvent } from '../types';
import { ANOMALY_TYPE_NAMES, ANOMALY_TYPE_ICONS } from '../types';

interface AnomalyEventsProps {
  anomalies: AnomalyEvent[];
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

const SEVERITY_FILTERS: Array<{ id: SeverityFilter; label: string; color: string }> = [
  { id: 'all', label: '全部', color: '#a78bfa' },
  { id: 'high', label: '高危', color: '#ef4444' },
  { id: 'medium', label: '中危', color: '#f59e0b' },
  { id: 'low', label: '低危', color: '#3b82f6' },
];

export const AnomalyEvents: React.FC<AnomalyEventsProps> = ({ anomalies }) => {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filtered = filter === 'all' ? anomalies : anomalies.filter((a) => a.severity === filter);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SEVERITY_LABELS: Record<AnomalyEvent['severity'], string> = {
    high: '高',
    medium: '中',
    low: '低',
  };

  const getStatsSummary = (event: AnomalyEvent): string | null => {
    if (!event.statsAtMoment) return null;
    const parts: string[] = [];
    if (event.statsAtMoment.distance) {
      parts.push(`${Math.floor(event.statsAtMoment.distance)}m`);
    }
    if (event.statsAtMoment.height !== undefined) {
      parts.push(`高度 ${Math.floor(event.statsAtMoment.height)}m`);
    }
    if (event.statsAtMoment.score) {
      parts.push(`得分 ${Math.floor(event.statsAtMoment.score)}`);
    }
    return parts.length > 0 ? parts.join(' · ') : null;
  };

  const totalBySeverity = {
    high: anomalies.filter((a) => a.severity === 'high').length,
    medium: anomalies.filter((a) => a.severity === 'medium').length,
    low: anomalies.filter((a) => a.severity === 'low').length,
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <span>⚠️</span>
          异常事件记录
        </div>
        <div className="section-subtitle">共 {anomalies.length} 起事件</div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(239, 68, 68, 0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>高危事件</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>{totalBySeverity.high}</div>
        </div>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(245, 158, 11, 0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>中危事件</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24' }}>{totalBySeverity.medium}</div>
        </div>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(59, 130, 246, 0.7)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>低危事件</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#60a5fa' }}>{totalBySeverity.low}</div>
        </div>
      </div>

      <div className="flight-filter-bar">
        {SEVERITY_FILTERS.map((opt) => (
          <button
            key={opt.id}
            className={`flight-filter-btn ${filter === opt.id ? 'active' : ''}`}
            onClick={() => setFilter(opt.id)}
            style={filter === opt.id ? {
              background: `${opt.color}22`,
              borderColor: `${opt.color}55`,
              color: opt.color,
            } : undefined}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <div className="empty-state-title">
            {filter === 'all' ? '暂无异常事件' : '该等级暂无异常事件'}
          </div>
          <div className="empty-state-desc">
            {filter === 'all' ? '保持安全飞行，避免异常事件！' : '继续保持！'}
          </div>
        </div>
      ) : (
        <div className="anomaly-list">
          {filtered.map((event) => {
            const typeName = ANOMALY_TYPE_NAMES[event.type] || event.type;
            const typeIcon = ANOMALY_TYPE_ICONS[event.type] || '⚠️';
            const statsSummary = getStatsSummary(event);

            return (
              <div key={event.id} className={`anomaly-card ${event.severity}`}>
                <div className="anomaly-icon">{typeIcon}</div>
                <div className="anomaly-content">
                  <div className="anomaly-title-row">
                    <span className="anomaly-type-name">{typeName}</span>
                    <span className="anomaly-severity-tag">
                      {SEVERITY_LABELS[event.severity]}危
                    </span>
                  </div>
                  <div className="anomaly-description">{event.description}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 8 }}>
                    <span className="anomaly-time">{formatTime(event.timestamp)}</span>
                    {statsSummary && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        📊 {statsSummary}
                      </span>
                    )}
                    {event.location && (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        📍 ({Math.floor(event.location.x)}, {Math.floor(event.location.y)}, {Math.floor(event.location.z)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
