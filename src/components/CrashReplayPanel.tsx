import React, { useState, useMemo } from 'react';
import type {
  CrashAnalysisResult,
  CrashTimelineEntry,
  FallCauseAnalysis,
  RestartGuidance,
  CrashStateSnapshot,
} from '../game/types';
import {
  SEVERITY_LABELS,
  GUIDANCE_CATEGORY_LABELS,
} from '../game/types';

interface CrashReplayPanelProps {
  crashAnalysis: CrashAnalysisResult | null;
  onRestart?: () => void;
  onApplyPreset?: (presetId: string) => void;
}

type TabId = 'timeline' | 'analysis' | 'guidance';

const SEVERITY_COLORS: Record<string, string> = {
  minor: '#22c55e',
  moderate: '#f59e0b',
  severe: '#f97316',
  catastrophic: '#ef4444',
};

const PRESET_NAMES: Record<string, string> = {
  calm_flying: '平稳飞行',
  speed_demon: '极速挑战',
  storm_rider: '风暴骑士',
  thermal_hunter: '热气流猎手',
  precision_flying: '精准操控',
};

const DURABILITY_BAR_COLORS = (pct: number): string => {
  if (pct > 60) return '#22c55e';
  if (pct > 30) return '#f59e0b';
  return '#ef4444';
};

export const CrashReplayPanel: React.FC<CrashReplayPanelProps> = ({
  crashAnalysis,
  onRestart,
  onApplyPreset,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  if (!crashAnalysis) return null;

  const { analysis, guidance } = crashAnalysis;

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'analysis', label: '坠毁分析', icon: '🔍' },
    { id: 'timeline', label: '事件时间线', icon: '📋' },
    { id: 'guidance', label: '改进建议', icon: '💡' },
  ];

  return (
    <div className="crash-replay-panel">
      <div className="crash-replay-header">
        <span className="crash-replay-icon">🪂</span>
        <span className="crash-replay-title">失误回放与坠落分析</span>
      </div>

      <CrashSummaryBar analysis={analysis} />

      <div className="crash-replay-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`crash-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="crash-tab-icon">{tab.icon}</span>
            <span className="crash-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="crash-replay-content">
        {activeTab === 'analysis' && <AnalysisTab analysis={analysis} />}
        {activeTab === 'timeline' && <TimelineTab timeline={analysis.timeline} snapshots={crashAnalysis.snapshots} />}
        {activeTab === 'guidance' && (
          <GuidanceTab
            guidance={guidance}
            onRestart={onRestart}
            onApplyPreset={onApplyPreset}
          />
        )}
      </div>
    </div>
  );
};

const CrashSummaryBar: React.FC<{ analysis: FallCauseAnalysis }> = ({ analysis }) => {
  const severityColor = SEVERITY_COLORS[analysis.severity] || '#9ca3af';

  return (
    <div className="crash-summary-bar">
      <div className="crash-summary-cause" style={{ borderColor: severityColor }}>
        <span className="crash-cause-icon">
          {analysis.primaryCause === 'ground_collision' ? '💀' :
           analysis.primaryCause === 'lightning_strike' ? '⚡' :
           analysis.primaryCause === 'durability_depleted' ? '💔' :
           analysis.primaryCause === 'tension_overload' ? '🔥' :
           analysis.primaryCause === 'obstacle_chain' ? '💥' : '📉'}
        </span>
        <div className="crash-cause-info">
          <div className="crash-cause-label" style={{ color: severityColor }}>
            {analysis.primaryCauseLabel}
          </div>
          <div className="crash-cause-desc">{analysis.primaryCauseDescription}</div>
        </div>
        <div className="crash-severity-badge" style={{ background: severityColor }}>
          {SEVERITY_LABELS[analysis.severity]}
        </div>
      </div>
    </div>
  );
};

const AnalysisTab: React.FC<{ analysis: FallCauseAnalysis }> = ({ analysis }) => {
  const maxDamage = Math.max(
    analysis.damageBreakdown.collisionDamage,
    analysis.damageBreakdown.tensionDamage,
    analysis.damageBreakdown.weatherDamage,
    analysis.damageBreakdown.lightningDamage,
    1
  );

  return (
    <div className="crash-analysis-tab">
      <div className="crash-summary-text">{analysis.summary}</div>

      <div className="crash-damage-breakdown">
        <h4 className="crash-section-title">损伤构成</h4>
        <div className="crash-damage-bars">
          {analysis.damageBreakdown.collisionDamage > 0 && (
            <div className="crash-damage-row">
              <span className="crash-damage-label">💥 碰撞</span>
              <div className="crash-damage-bar-bg">
                <div
                  className="crash-damage-bar-fill"
                  style={{
                    width: `${(analysis.damageBreakdown.collisionDamage / maxDamage) * 100}%`,
                    background: '#f97316',
                  }}
                />
              </div>
              <span className="crash-damage-value">{Math.round(analysis.damageBreakdown.collisionDamage)}</span>
            </div>
          )}
          {analysis.damageBreakdown.tensionDamage > 0 && (
            <div className="crash-damage-row">
              <span className="crash-damage-label">🧵 张力</span>
              <div className="crash-damage-bar-bg">
                <div
                  className="crash-damage-bar-fill"
                  style={{
                    width: `${(analysis.damageBreakdown.tensionDamage / maxDamage) * 100}%`,
                    background: '#8b5cf6',
                  }}
                />
              </div>
              <span className="crash-damage-value">{Math.round(analysis.damageBreakdown.tensionDamage)}</span>
            </div>
          )}
          {analysis.damageBreakdown.weatherDamage > 0 && (
            <div className="crash-damage-row">
              <span className="crash-damage-label">🌪️ 天气</span>
              <div className="crash-damage-bar-bg">
                <div
                  className="crash-damage-bar-fill"
                  style={{
                    width: `${(analysis.damageBreakdown.weatherDamage / maxDamage) * 100}%`,
                    background: '#06b6d4',
                  }}
                />
              </div>
              <span className="crash-damage-value">{Math.round(analysis.damageBreakdown.weatherDamage)}</span>
            </div>
          )}
          {analysis.damageBreakdown.lightningDamage > 0 && (
            <div className="crash-damage-row">
              <span className="crash-damage-label">⚡ 雷击</span>
              <div className="crash-damage-bar-bg">
                <div
                  className="crash-damage-bar-fill"
                  style={{
                    width: `${(analysis.damageBreakdown.lightningDamage / maxDamage) * 100}%`,
                    background: '#eab308',
                  }}
                />
              </div>
              <span className="crash-damage-value">{Math.round(analysis.damageBreakdown.lightningDamage)}</span>
            </div>
          )}
        </div>
      </div>

      {analysis.contributingFactors.length > 0 && (
        <div className="crash-contributing-factors">
          <h4 className="crash-section-title">影响因素</h4>
          {analysis.contributingFactors.map((f, idx) => (
            <div key={idx} className="crash-factor-item">
              <div className="crash-factor-bar-bg">
                <div
                  className="crash-factor-bar-fill"
                  style={{ width: `${Math.round(f.weight * 100)}%` }}
                />
              </div>
              <div className="crash-factor-desc">{f.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TimelineTab: React.FC<{ timeline: CrashTimelineEntry[]; snapshots: CrashStateSnapshot[] }> = ({
  timeline,
  snapshots,
}) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const durabilityChartData = useMemo(() => {
    if (snapshots.length < 2) return null;
    const minTime = snapshots[0].time;
    const maxTime = snapshots[snapshots.length - 1].time;
    const timeRange = maxTime - minTime || 1;
    return snapshots.map(s => ({
      x: ((s.time - minTime) / timeRange) * 100,
      y: (s.durability / s.maxDurability) * 100,
      height: s.height,
    }));
  }, [snapshots]);

  return (
    <div className="crash-timeline-tab">
      {durabilityChartData && (
        <div className="crash-durability-chart">
          <div className="crash-chart-label">耐久度变化曲线</div>
          <div className="crash-chart-area">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="crash-chart-svg">
              <defs>
                <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {durabilityChartData.length >= 2 && (
                <>
                  <path
                    d={buildChartPath(durabilityChartData)}
                    fill="url(#durGrad)"
                    stroke="none"
                  />
                  <path
                    d={buildChartLinePath(durabilityChartData)}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="0.5"
                  />
                </>
              )}
              {timeline
                .filter(e => e.type !== 'recovery')
                .map(event => {
                  const maxTime = snapshots[snapshots.length - 1]?.time || 1;
                  const minTime = snapshots[0]?.time || 0;
                  const range = maxTime - minTime || 1;
                  const xPct = ((event.time - minTime) / range) * 100;
                  const yPct = 100 - event.durabilityPercent;
                  return (
                    <circle
                      key={`evt-${event.time}-${event.label}`}
                      cx={xPct}
                      cy={yPct * 0.4}
                      r="1.2"
                      fill={event.color}
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="0.3"
                    />
                  );
                })}
            </svg>
            <div className="crash-chart-axis">
              <span>100%</span>
              <span>0%</span>
            </div>
          </div>
        </div>
      )}

      <div className="crash-timeline-list">
        {timeline.map((entry, idx) => (
          <div
            key={`tl-${idx}`}
            className={`crash-timeline-item ${entry.type === 'critical' || entry.type === 'ground' ? 'critical' : ''} ${expandedIdx === idx ? 'expanded' : ''}`}
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <div className="crash-timeline-dot" style={{ background: entry.color }} />
            <div className="crash-timeline-connector" />
            <div className="crash-timeline-body">
              <div className="crash-timeline-header">
                <span className="crash-timeline-icon">{entry.icon}</span>
                <span className="crash-timeline-label">{entry.label}</span>
                <span className="crash-timeline-time">{formatTime(entry.time)}</span>
              </div>
              <div className="crash-timeline-desc">{entry.description}</div>
              {expandedIdx === idx && (
                <div className="crash-timeline-detail">
                  <div className="crash-detail-row">
                    <span>耐久度</span>
                    <div className="crash-detail-bar">
                      <div
                        className="crash-detail-fill"
                        style={{
                          width: `${entry.durabilityPercent}%`,
                          background: DURABILITY_BAR_COLORS(entry.durabilityPercent),
                        }}
                      />
                    </div>
                    <span>{Math.round(entry.durabilityPercent)}%</span>
                  </div>
                  {entry.damage > 0 && (
                    <div className="crash-detail-row">
                      <span>本次损伤</span>
                      <span className="crash-detail-damage">-{Math.round(entry.damage)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GuidanceTab: React.FC<{
  guidance: RestartGuidance;
  onRestart?: () => void;
  onApplyPreset?: (presetId: string) => void;
}> = ({ guidance, onRestart, onApplyPreset }) => {
  return (
    <div className="crash-guidance-tab">
      <div className="crash-quick-tip">
        <span className="crash-quick-tip-icon">💡</span>
        <span className="crash-quick-tip-text">{guidance.quickTip}</span>
      </div>

      <div className="crash-guidance-list">
        {guidance.suggestions.map((s, idx) => {
          const categoryLabel = GUIDANCE_CATEGORY_LABELS[s.category] || s.category;
          return (
            <div key={idx} className={`crash-guidance-item priority-${s.priority}`}>
              <div className="crash-guidance-header">
                <span className="crash-guidance-icon">{s.icon}</span>
                <span className="crash-guidance-title">{s.title}</span>
                <span className="crash-guidance-category">{categoryLabel}</span>
              </div>
              <div className="crash-guidance-desc">{s.description}</div>
            </div>
          );
        })}
      </div>

      {guidance.recommendedPreset && (
        <div className="crash-recommended-preset">
          <span className="crash-preset-label">推荐配置：</span>
          <button
            className="crash-preset-btn"
            onClick={() => onApplyPreset?.(guidance.recommendedPreset!)}
          >
            {PRESET_NAMES[guidance.recommendedPreset] || guidance.recommendedPreset}
          </button>
        </div>
      )}

      {onRestart && (
        <button className="crash-restart-btn" onClick={onRestart}>
          🚀 立即再战
        </button>
      )}
    </div>
  );
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildChartPath(data: Array<{ x: number; y: number }>): string {
  if (data.length < 2) return '';
  let d = `M ${data[0].x} ${40 - data[0].y * 0.4}`;
  for (let i = 1; i < data.length; i++) {
    d += ` L ${data[i].x} ${40 - data[i].y * 0.4}`;
  }
  d += ` L ${data[data.length - 1].x} 40 L ${data[0].x} 40 Z`;
  return d;
}

function buildChartLinePath(data: Array<{ x: number; y: number }>): string {
  if (data.length < 2) return '';
  let d = `M ${data[0].x} ${40 - data[0].y * 0.4}`;
  for (let i = 1; i < data.length; i++) {
    d += ` L ${data[i].x} ${40 - data[i].y * 0.4}`;
  }
  return d;
}
