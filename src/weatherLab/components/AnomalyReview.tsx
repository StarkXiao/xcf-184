import React, { useState, useMemo } from 'react';
import type { AnomalyEvent, FlightRecord, AnomalyType } from '../types';
import { ANOMALY_TYPE_NAMES } from '../types';

interface AnomalyReviewProps {
  anomalyEvents: AnomalyEvent[];
  flightRecords: FlightRecord[];
  selectedAnomaly: AnomalyEvent | null;
  onSelectAnomaly: (anomaly: AnomalyEvent | null) => void;
  onMarkReviewed: (anomalyId: string) => boolean;
  onGetUnreviewedAnomalies: () => AnomalyEvent[];
}

interface DataChartProps {
  dataPoints: AnomalyEvent['dataPoints'];
  field: keyof AnomalyEvent['dataPoints'][0] | 'velocityMagnitude' | 'positionY';
  label: string;
  color: string;
  unit?: string;
}

const DataChart: React.FC<DataChartProps> = ({ dataPoints, field, label, color, unit = '' }) => {
  const values = useMemo(() => {
    return dataPoints.map((p) => {
      if (field === 'velocityMagnitude') {
        return Math.sqrt(p.velocity.x ** 2 + p.velocity.y ** 2 + p.velocity.z ** 2);
      }
      if (field === 'positionY') {
        return p.position.y;
      }
      const val = p[field];
      if (typeof val === 'number') return val;
      return 0;
    });
  }, [dataPoints, field]);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className="data-chart">
      <div className="chart-header">
        <span className="chart-label">{label}</span>
        <span className="chart-range">
          {min.toFixed(2)} - {max.toFixed(2)}{unit}
        </span>
      </div>
      <div className="chart-bars">
        {values.map((val, i) => {
          const height = ((val - min) / range) * 100;
          return (
            <div
              key={i}
              className="chart-bar"
              style={{
                height: `${Math.max(2, height)}%`,
                backgroundColor: color,
              }}
              title={`${label}: ${val.toFixed(2)}${unit}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#a855f7',
};

const getSeverityLevel = (severity: number): { level: string; color: string } => {
  if (severity < 25) return { level: '低', color: SEVERITY_COLORS.low };
  if (severity < 50) return { level: '中', color: SEVERITY_COLORS.medium };
  if (severity < 75) return { level: '高', color: SEVERITY_COLORS.high };
  return { level: '严重', color: SEVERITY_COLORS.critical };
};

export const AnomalyReview: React.FC<AnomalyReviewProps> = ({
  anomalyEvents,
  flightRecords,
  selectedAnomaly,
  onSelectAnomaly,
  onMarkReviewed,
  onGetUnreviewedAnomalies,
}) => {
  const [filterType, setFilterType] = useState<AnomalyType | 'all'>('all');
  const [showReviewed, setShowReviewed] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');

  const filteredAnomalies = useMemo(() => {
    let result = [...anomalyEvents];

    if (!showReviewed) {
      result = result.filter((a) => !a.isReviewed);
    }

    if (filterType !== 'all') {
      result = result.filter((a) => a.type === filterType);
    }

    if (filterSeverity !== 'all') {
      result = result.filter((a) => {
        if (filterSeverity === 'low') return a.severity < 25;
        if (filterSeverity === 'medium') return a.severity >= 25 && a.severity < 50;
        if (filterSeverity === 'high') return a.severity >= 50 && a.severity < 75;
        return a.severity >= 75;
      });
    }

    result.sort((a, b) => b.startTime - a.startTime);

    return result;
  }, [anomalyEvents, filterType, showReviewed, filterSeverity]);

  const anomalyStats = useMemo(() => {
    const unreviewed = onGetUnreviewedAnomalies().length;
    const byType: Record<AnomalyType, number> = {
      crash: 0,
      instability: 0,
      turbulence: 0,
      unexpected_drop: 0,
      control_loss: 0,
    };

    anomalyEvents.forEach((a) => {
      byType[a.type]++;
    });

    return {
      total: anomalyEvents.length,
      unreviewed,
      byType,
    };
  }, [anomalyEvents, onGetUnreviewedAnomalies]);

  const relatedFlightRecord = useMemo(() => {
    if (!selectedAnomaly) return null;
    return flightRecords.find((r) => r.id === selectedAnomaly.flightRecordId);
  }, [selectedAnomaly, flightRecords]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleMarkReviewed = () => {
    if (selectedAnomaly) {
      onMarkReviewed(selectedAnomaly.id);
      onSelectAnomaly(null);
    }
  };

  const anomalyTypes: Array<{ key: AnomalyType | 'all'; label: string }> = [
    { key: 'all', label: '全部类型' },
    { key: 'crash', label: ANOMALY_TYPE_NAMES.crash },
    { key: 'instability', label: ANOMALY_TYPE_NAMES.instability },
    { key: 'turbulence', label: ANOMALY_TYPE_NAMES.turbulence },
    { key: 'unexpected_drop', label: ANOMALY_TYPE_NAMES.unexpected_drop },
    { key: 'control_loss', label: ANOMALY_TYPE_NAMES.control_loss },
  ];

  return (
    <div className="anomaly-review">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-icon">🔍</span>
          异常复盘
          {anomalyStats.unreviewed > 0 && (
            <span className="unreviewed-badge">{anomalyStats.unreviewed} 待处理</span>
          )}
        </h2>
      </div>

      <div className="anomaly-stats">
        <div className="stat-card">
          <span className="stat-card-value">{anomalyStats.total}</span>
          <span className="stat-card-label">总异常次数</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-card-value">{anomalyStats.unreviewed}</span>
          <span className="stat-card-label">待复盘</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-card-value">{anomalyStats.byType.crash}</span>
          <span className="stat-card-label">坠毁事件</span>
        </div>
        <div className="stat-card info">
          <span className="stat-card-value">
            {anomalyStats.total > 0
              ? ((anomalyStats.total / flightRecords.length) * 100).toFixed(1)
              : 0}%
          </span>
          <span className="stat-card-label">异常率</span>
        </div>
      </div>

      <div className="anomaly-layout">
        <div className="anomaly-list-section">
          <div className="list-filters">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="filter-select"
            >
              {anomalyTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
              className="filter-select"
            >
              <option value="all">所有严重程度</option>
              <option value="low">轻度</option>
              <option value="medium">中度</option>
              <option value="high">重度</option>
              <option value="critical">严重</option>
            </select>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showReviewed}
                onChange={(e) => setShowReviewed(e.target.checked)}
              />
              显示已复盘
            </label>
          </div>

          <div className="anomaly-list">
            {filteredAnomalies.map((anomaly) => {
              const severity = getSeverityLevel(anomaly.severity);
              const isSelected = selectedAnomaly?.id === anomaly.id;

              return (
                <div
                  key={anomaly.id}
                  className={`anomaly-card ${isSelected ? 'selected' : ''} ${anomaly.isReviewed ? 'reviewed' : ''}`}
                  onClick={() => onSelectAnomaly(anomaly)}
                >
                  <div className="anomaly-card-header">
                    <span className="anomaly-type">{ANOMALY_TYPE_NAMES[anomaly.type]}</span>
                    <span
                      className="anomaly-severity"
                      style={{ backgroundColor: `${severity.color}20`, color: severity.color }}
                    >
                      {severity.level} ({anomaly.severity})
                    </span>
                    {anomaly.isReviewed && <span className="reviewed-badge">已复盘</span>}
                  </div>

                  <p className="anomaly-description">{anomaly.description}</p>

                  <div className="anomaly-meta">
                    <span>{formatTime(anomaly.startTime)}</span>
                    <span>
                      持续: {((anomaly.endTime - anomaly.startTime) / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredAnomalies.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>没有符合条件的异常事件</p>
              </div>
            )}
          </div>
        </div>

        <div className="anomaly-detail-section">
          {selectedAnomaly ? (
            <>
              <div className="detail-header">
                <h3 className="detail-title">{ANOMALY_TYPE_NAMES[selectedAnomaly.type]}</h3>
                <div className="detail-actions">
                  {!selectedAnomaly.isReviewed && (
                    <button className="btn-primary" onClick={handleMarkReviewed}>
                      标记为已复盘
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => onSelectAnomaly(null)}>
                    关闭
                  </button>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-section">
                  <h4 className="detail-section-title">事件概览</h4>
                  <div className="detail-info-grid">
                    <div className="detail-info-item">
                      <span className="info-label">严重程度</span>
                      <span
                        className="info-value"
                        style={{ color: getSeverityLevel(selectedAnomaly.severity).color }}
                      >
                        {getSeverityLevel(selectedAnomaly.severity).level} ({selectedAnomaly.severity}/100)
                      </span>
                    </div>
                    <div className="detail-info-item">
                      <span className="info-label">开始时间</span>
                      <span className="info-value">{formatTime(selectedAnomaly.startTime)}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="info-label">结束时间</span>
                      <span className="info-value">{formatTime(selectedAnomaly.endTime)}</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="info-label">持续时间</span>
                      <span className="info-value">
                        {((selectedAnomaly.endTime - selectedAnomaly.startTime) / 1000).toFixed(2)} 秒
                      </span>
                    </div>
                    <div className="detail-info-item">
                      <span className="info-label">数据点数</span>
                      <span className="info-value">{selectedAnomaly.dataPoints.length} 个</span>
                    </div>
                    <div className="detail-info-item">
                      <span className="info-label">复盘状态</span>
                      <span className={`info-value ${selectedAnomaly.isReviewed ? 'positive' : 'warning'}`}>
                        {selectedAnomaly.isReviewed ? '已完成' : '待处理'}
                      </span>
                    </div>
                  </div>
                </div>

                {relatedFlightRecord && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">关联飞行记录</h4>
                    <div className="detail-info-grid">
                      <div className="detail-info-item">
                        <span className="info-label">场景</span>
                        <span className="info-value">{relatedFlightRecord.sceneName}</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="info-label">最终得分</span>
                        <span className="info-value">{relatedFlightRecord.stats.score.toLocaleString()}</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="info-label">飞行距离</span>
                        <span className="info-value">{relatedFlightRecord.stats.distance.toFixed(0)} m</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="info-label">最大高度</span>
                        <span className="info-value">{relatedFlightRecord.stats.maxHeight.toFixed(1)} m</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="info-label">风速</span>
                        <span className="info-value">{relatedFlightRecord.windField.windSpeed.toFixed(2)} m/s</span>
                      </div>
                      <div className="detail-info-item">
                        <span className="info-label">湍流强度</span>
                        <span className="info-value">
                          {(relatedFlightRecord.windField.turbulenceLevel * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="detail-section full-width">
                  <h4 className="detail-section-title">可能原因</h4>
                  <div className="cause-box">
                    <span className="cause-icon">🔍</span>
                    <p>{selectedAnomaly.probableCause}</p>
                  </div>
                </div>

                <div className="detail-section full-width">
                  <h4 className="detail-section-title">改进建议</h4>
                  <ul className="recommendations-list">
                    {selectedAnomaly.recommendations.map((rec, index) => (
                      <li key={index}>
                        <span className="rec-number">{index + 1}</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="detail-section full-width">
                  <h4 className="detail-section-title">飞行数据分析</h4>
                  <div className="charts-grid">
                    <DataChart
                      dataPoints={selectedAnomaly.dataPoints}
                      field="positionY"
                      label="高度"
                      color="#3b82f6"
                      unit=" m"
                    />
                    <DataChart
                      dataPoints={selectedAnomaly.dataPoints}
                      field="velocityMagnitude"
                      label="速度"
                      color="#22c55e"
                      unit=" m/s"
                    />
                    <DataChart
                      dataPoints={selectedAnomaly.dataPoints}
                      field="stability"
                      label="稳定性"
                      color="#f59e0b"
                      unit="%"
                    />
                    <DataChart
                      dataPoints={selectedAnomaly.dataPoints}
                      field="shadowTracking"
                      label="阴影追踪"
                      color="#a855f7"
                      unit="%"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-placeholder">
              <span className="placeholder-icon">📋</span>
              <h3>选择异常事件查看详情</h3>
              <p>点击左侧列表中的异常事件卡片，查看详细分析和改进建议</p>
              <div className="placeholder-tips">
                <div className="tip-item">
                  <span className="tip-icon">🎯</span>
                  系统自动分析异常原因并提供改进建议
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📈</span>
                  查看飞行数据图表了解异常发生过程
                </div>
                <div className="tip-item">
                  <span className="tip-icon">✅</span>
                  完成复盘后标记为已处理
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
