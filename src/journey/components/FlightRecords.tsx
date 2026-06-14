import React, { useState } from 'react';
import type { FlightRecord, FlightMode } from '../types';
import { ANOMALY_TYPE_NAMES, ANOMALY_TYPE_ICONS } from '../types';

interface FlightRecordsProps {
  records: FlightRecord[];
}

type FilterMode = 'all' | FlightMode;

const FILTER_OPTIONS: Array<{ id: FilterMode; label: string; icon: string }> = [
  { id: 'all', label: '全部', icon: '📋' },
  { id: 'free', label: '自由飞行', icon: '🕊️' },
  { id: 'tournament', label: '赛事', icon: '🏆' },
  { id: 'training', label: '训练', icon: '🎓' },
  { id: 'weatherLab', label: '气象实验', icon: '🌤️' },
  { id: 'levelEditor', label: '自定义', icon: '🎮' },
];

export const FlightRecords: React.FC<FlightRecordsProps> = ({ records }) => {
  const [filter, setFilter] = useState<FilterMode>('all');

  const filteredRecords =
    filter === 'all' ? records : records.filter((r) => r.mode === filter);

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

    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  const getContextLabel = (record: FlightRecord): string | null => {
    if (record.trackName) return `赛事: ${record.trackName}`;
    if (record.lessonName) return `课程: ${record.lessonName}`;
    if (record.sceneName) return `场景: ${record.sceneName}`;
    if (record.levelName) return `关卡: ${record.levelName}`;
    return null;
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">
          <span>✈️</span>
          飞行记录
        </div>
        <div className="section-subtitle">共 {records.length} 次飞行</div>
      </div>

      <div className="flight-filter-bar">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`flight-filter-btn ${filter === opt.id ? 'active' : ''}`}
            onClick={() => setFilter(opt.id)}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✈️</div>
          <div className="empty-state-title">暂无飞行记录</div>
          <div className="empty-state-desc">
            {filter === 'all' ? '开始你的第一次飞行吧！' : '该模式下暂无飞行记录'}
          </div>
        </div>
      ) : (
        <div className="flight-list">
          {filteredRecords.map((record) => {
            const contextLabel = getContextLabel(record);
            return (
              <div key={record.id} className="flight-record-card">
                <div className="flight-record-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className={`flight-mode-tag ${record.mode}`}>
                      {FILTER_OPTIONS.find((f) => f.id === record.mode)?.icon}
                      {record.modeName}
                    </span>
                    {contextLabel && (
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.5)',
                          padding: '4px 10px',
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: 6,
                        }}
                      >
                        {contextLabel}
                      </span>
                    )}
                    {record.weatherCondition && (
                      <span
                        style={{
                          fontSize: 12,
                          color: '#22d3ee',
                          padding: '4px 10px',
                          background: 'rgba(6,182,212,0.08)',
                          borderRadius: 6,
                        }}
                      >
                        🌤️ {record.weatherCondition}
                      </span>
                    )}
                  </div>
                  <span className="flight-timestamp">{formatTime(record.timestamp)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div className="flight-score-display">
                    <span className="flight-score">{Math.floor(record.adjustedScore).toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>分</span>
                    {record.earnedCoins > 0 && (
                      <span className="flight-coins">🪙 +{record.earnedCoins}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                    ⏱️ 时长 {formatDuration(record.duration)}
                  </div>
                </div>

                <div className="flight-metrics-grid">
                  <div className="flight-metric">
                    <div className="flight-metric-label">距离</div>
                    <div className="flight-metric-value">{Math.floor(record.stats.distance)}m</div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">最高</div>
                    <div className="flight-metric-value">{Math.floor(record.stats.maxHeight)}m</div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">气流</div>
                    <div className="flight-metric-value">{record.stats.airCurrentCount}</div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">碰撞</div>
                    <div
                      className="flight-metric-value"
                      style={{ color: record.stats.collisions === 0 ? '#10b981' : '#ef4444' }}
                    >
                      {record.stats.collisions}
                    </div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">稳定性</div>
                    <div className="flight-metric-value">
                      {(record.stats.flightStability * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">影子追踪</div>
                    <div className="flight-metric-value">
                      {(record.stats.shadowTracking * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">影子加成</div>
                    <div className="flight-metric-value">+{Math.floor(record.stats.shadowBonus)}</div>
                  </div>
                  <div className="flight-metric">
                    <div className="flight-metric-label">当前高度</div>
                    <div className="flight-metric-value">{Math.floor(record.stats.height)}m</div>
                  </div>
                </div>

                {record.anomalies.length > 0 && (
                  <div className="flight-anomalies">
                    {record.anomalies.map((a, idx) => {
                      const type = a as keyof typeof ANOMALY_TYPE_NAMES;
                      return (
                        <span key={idx} className="flight-anomaly-tag">
                          {ANOMALY_TYPE_ICONS[type] || '⚠️'}
                          {ANOMALY_TYPE_NAMES[type] || type}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
