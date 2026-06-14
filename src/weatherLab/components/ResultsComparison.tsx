import React, { useState, useMemo } from 'react';
import type { FlightRecord, ComparisonGroup } from '../types';

interface ResultsComparisonProps {
  flightRecords: FlightRecord[];
  comparisonGroups: ComparisonGroup[];
  activeComparisonGroup: ComparisonGroup | null;
  onCreateComparisonGroup: (name: string, flightRecordIds: string[], notes?: string) => ComparisonGroup;
  onAddToComparisonGroup: (groupId: string, flightRecordId: string) => boolean;
  onRemoveFromComparisonGroup: (groupId: string, flightRecordId: string) => boolean;
  onSetActiveComparisonGroup: (groupId: string | null) => void;
  onGetComparisonRecords: (groupId: string) => FlightRecord[];
  onDeleteComparisonGroup: (groupId: string) => boolean;
}

interface StatComparisonRowProps {
  label: string;
  values: { recordId: string; value: number; color: string }[];
  format?: (v: number) => string;
  isHigherBetter?: boolean;
}

const StatComparisonRow: React.FC<StatComparisonRowProps> = ({
  label,
  values,
  format = (v) => v.toLocaleString(),
  isHigherBetter = true,
}) => {
  const maxValue = Math.max(...values.map((v) => v.value));
  const minValue = Math.min(...values.map((v) => v.value));

  return (
    <div className="stat-comparison-row">
      <span className="stat-comparison-label">{label}</span>
      <div className="stat-comparison-values">
        {values.map(({ recordId, value, color }) => {
          const isBest = isHigherBetter ? value === maxValue : value === minValue;
          const percentage = ((value - minValue) / (maxValue - minValue || 1)) * 100;

          return (
            <div key={recordId} className="stat-comparison-value">
              <div
                className="stat-comparison-bar"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  opacity: isBest ? 1 : 0.6,
                }}
              />
              <span
                className={`stat-comparison-number ${isBest ? 'best' : ''}`}
                style={{ color }}
              >
                {format(value)}
                {isBest && <span className="best-badge">最佳</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const COMPARISON_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#06b6d4',
  '#f97316',
  '#ec4899',
];

export const ResultsComparison: React.FC<ResultsComparisonProps> = ({
  flightRecords,
  comparisonGroups,
  activeComparisonGroup,
  onCreateComparisonGroup,
  onAddToComparisonGroup,
  onRemoveFromComparisonGroup,
  onSetActiveComparisonGroup,
  onGetComparisonRecords,
  onDeleteComparisonGroup,
}) => {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterScene, setFilterScene] = useState<string>('all');

  const availableScenes = useMemo(() => {
    const sceneMap = new Map<string, string>();
    flightRecords.forEach((r) => {
      sceneMap.set(r.sceneId, r.sceneName);
    });
    return Array.from(sceneMap.entries());
  }, [flightRecords]);

  const filteredRecords = useMemo(() => {
    if (filterScene === 'all') return flightRecords;
    return flightRecords.filter((r) => r.sceneId === filterScene);
  }, [flightRecords, filterScene]);

  const comparisonRecords = useMemo(() => {
    if (!activeComparisonGroup) return [];
    return onGetComparisonRecords(activeComparisonGroup.id);
  }, [activeComparisonGroup, onGetComparisonRecords]);

  const handleToggleRecord = (recordId: string) => {
    setSelectedRecords((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedRecords.length < 2) return;

    const group = onCreateComparisonGroup(newGroupName.trim(), selectedRecords);
    if (group) {
      setNewGroupName('');
      setSelectedRecords([]);
      setShowCreateModal(false);
      onSetActiveComparisonGroup(group.id);
    }
  };

  const handleQuickCompare = () => {
    if (selectedRecords.length < 2) return;

    const group = onCreateComparisonGroup(
      `快速对比 ${new Date().toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      selectedRecords
    );
    if (group) {
      setSelectedRecords([]);
      onSetActiveComparisonGroup(group.id);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="results-comparison">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-icon">📊</span>
          结果对比
        </h2>
        <div className="panel-actions">
          {selectedRecords.length >= 2 && (
            <button className="btn-secondary" onClick={handleQuickCompare}>
              快速对比 ({selectedRecords.length})
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            disabled={selectedRecords.length < 2}
          >
            创建对比组
          </button>
        </div>
      </div>

      <div className="comparison-layout">
        <div className="comparison-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">对比组</h3>
            <div className="group-list">
              <button
                className={`group-item ${activeComparisonGroup === null ? 'active' : ''}`}
                onClick={() => onSetActiveComparisonGroup(null)}
              >
                <span className="group-icon">📋</span>
                <span className="group-name">所有记录</span>
              </button>
              {comparisonGroups.map((group) => (
                <div
                  key={group.id}
                  className={`group-item ${activeComparisonGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => onSetActiveComparisonGroup(group.id)}
                >
                  <span className="group-icon">📊</span>
                  <div className="group-info">
                    <span className="group-name">{group.name}</span>
                    <span className="group-count">{group.flightRecordIds.length} 条记录</span>
                  </div>
                  <button
                    className="group-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除对比组 "${group.name}" 吗？`)) {
                        onDeleteComparisonGroup(group.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">筛选记录</h3>
            <select
              value={filterScene}
              onChange={(e) => setFilterScene(e.target.value)}
              className="filter-select"
            >
              <option value="all">所有场景</option>
              {availableScenes.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              飞行记录
              {selectedRecords.length > 0 && (
                <span className="selected-count">已选 {selectedRecords.length}</span>
              )}
            </h3>
            <div className="records-list">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`record-item ${selectedRecords.includes(record.id) ? 'selected' : ''} ${record.isAnomaly ? 'anomaly' : ''}`}
                  onClick={() => handleToggleRecord(record.id)}
                >
                  <div className="record-checkbox">
                    {selectedRecords.includes(record.id) ? '✓' : ''}
                  </div>
                  <div className="record-info">
                    <div className="record-header">
                      <span className="record-scene">{record.sceneName}</span>
                      {record.isAnomaly && <span className="anomaly-badge">异常</span>}
                    </div>
                    <div className="record-meta">
                      <span>{formatDate(record.endTime)}</span>
                      <span>{formatDuration(record.duration)}</span>
                    </div>
                    <div className="record-score">
                      得分: <strong>{record.stats.score.toLocaleString()}</strong>
                    </div>
                  </div>
                  {activeComparisonGroup && (
                    <button
                      className={`record-action ${activeComparisonGroup.flightRecordIds.includes(record.id) ? 'in-group' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeComparisonGroup.flightRecordIds.includes(record.id)) {
                          onRemoveFromComparisonGroup(activeComparisonGroup.id, record.id);
                        } else {
                          onAddToComparisonGroup(activeComparisonGroup.id, record.id);
                        }
                      }}
                    >
                      {activeComparisonGroup.flightRecordIds.includes(record.id) ? '移除' : '添加'}
                    </button>
                  )}
                </div>
              ))}
              {filteredRecords.length === 0 && (
                <div className="empty-state small">
                  <p>暂无飞行记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="comparison-content">
          {activeComparisonGroup && comparisonRecords.length > 0 ? (
            <>
              <div className="comparison-header">
                <h3>{activeComparisonGroup.name}</h3>
                <p>{activeComparisonGroup.notes || `${comparisonRecords.length} 条记录对比`}</p>
              </div>

              <div className="comparison-legend">
                {comparisonRecords.map((record, index) => (
                  <div key={record.id} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }}
                    />
                    <span className="legend-text">
                      {record.sceneName} - {formatDate(record.endTime)}
                    </span>
                    <button
                      className="legend-remove"
                      onClick={() => onRemoveFromComparisonGroup(activeComparisonGroup.id, record.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="comparison-charts">
                <div className="chart-section">
                  <h4 className="chart-title">核心数据对比</h4>
                  <div className="stat-comparison-table">
                    <StatComparisonRow
                      label="总得分"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.score,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                    />
                    <StatComparisonRow
                      label="飞行距离"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.distance,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${v.toFixed(0)} m`}
                    />
                    <StatComparisonRow
                      label="最大高度"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.maxHeight,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${v.toFixed(1)} m`}
                    />
                    <StatComparisonRow
                      label="飞行时间"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.time,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => formatDuration(v)}
                    />
                  </div>
                </div>

                <div className="chart-section">
                  <h4 className="chart-title">飞行质量指标</h4>
                  <div className="stat-comparison-table">
                    <StatComparisonRow
                      label="飞行稳定性"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.flightStability,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${(v * 100).toFixed(1)}%`}
                    />
                    <StatComparisonRow
                      label="阴影追踪"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.shadowTracking,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${(v * 100).toFixed(1)}%`}
                    />
                    <StatComparisonRow
                      label="气流利用次数"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.airCurrentCount,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                    />
                    <StatComparisonRow
                      label="碰撞次数"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.stats.collisions,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      isHigherBetter={false}
                    />
                  </div>
                </div>

                <div className="chart-section">
                  <h4 className="chart-title">风场参数</h4>
                  <div className="stat-comparison-table">
                    <StatComparisonRow
                      label="风速"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.windField.windSpeed,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${v.toFixed(2)} m/s`}
                      isHigherBetter={false}
                    />
                    <StatComparisonRow
                      label="湍流强度"
                      values={comparisonRecords.map((r, i) => ({
                        recordId: r.id,
                        value: r.windField.turbulenceLevel,
                        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
                      }))}
                      format={(v) => `${(v * 100).toFixed(0)}%`}
                      isHigherBetter={false}
                    />
                  </div>
                </div>
              </div>

              <div className="comparison-footer">
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (confirm(`确定要删除对比组 "${activeComparisonGroup.name}" 吗？`)) {
                      onDeleteComparisonGroup(activeComparisonGroup.id);
                    }
                  }}
                >
                  删除对比组
                </button>
              </div>
            </>
          ) : (
            <div className="comparison-placeholder">
              <span className="placeholder-icon">📈</span>
              <h3>选择记录进行对比</h3>
              <p>从左侧选择 2 条或更多飞行记录，然后点击"快速对比"或"创建对比组"</p>
              <div className="placeholder-tips">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  对比同一风场下不同风筝配置的表现
                </div>
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  分析不同风场参数对飞行结果的影响
                </div>
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  追踪飞行技术的进步轨迹
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">创建对比组</h3>
            <p className="modal-description">
              已选择 {selectedRecords.length} 条记录进行对比
            </p>

            <div className="form-group">
              <label>对比组名称</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="例如：不同风速对比测试"
                className="form-input"
              />
            </div>

            <div className="selected-preview">
              <h4>已选记录：</h4>
              <ul>
                {selectedRecords.map((id) => {
                  const record = flightRecords.find((r) => r.id === id);
                  if (!record) return null;
                  return (
                    <li key={id}>
                      {record.sceneName} - {record.stats.score.toLocaleString()} 分
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedRecords.length < 2}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
