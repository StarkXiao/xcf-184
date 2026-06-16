import React, { useState } from 'react';
import type { StrategySuggestion, WindObservationData, GameStats } from '../game/types';
import { WIND_RELATION_NAMES, WIND_RELATION_ICONS, WIND_RELATION_COLORS } from '../game/StrategyEngine';
import { WEATHER_SAFETY_THRESHOLDS } from '../game/types';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  suggestions?: StrategySuggestion[];
  observation?: WindObservationData | null;
  stats?: GameStats;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#4ecdc4',
  medium: '#ffd700',
  high: '#ff8c00',
  critical: '#ff0000',
};

const PRIORITY_NAMES: Record<string, string> = {
  low: '建议',
  medium: '注意',
  high: '警告',
  critical: '紧急',
};

const TYPE_ICONS: Record<string, string> = {
  flight: '🎮',
  weather: '🌤️',
  safety: '⚠️',
  optimization: '📈',
};

const TYPE_NAMES: Record<string, string> = {
  flight: '飞行建议',
  weather: '天气建议',
  safety: '安全警告',
  optimization: '优化建议',
};

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
  suggestions = [],
  observation,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'strategy' | 'analysis'>('main');

  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const criticalCount = suggestions.filter((s) => s.priority === 'critical').length;
  const highCount = suggestions.filter((s) => s.priority === 'high').length;

  const renderMainTab = () => (
    <>
      <h2 className="pause-title">游戏暂停</h2>

      {(criticalCount > 0 || highCount > 0) && (
        <div className="pause-alert-banner" style={{
          background: criticalCount > 0
            ? 'linear-gradient(135deg, #ff000033 0%, #ff444433 100%)'
            : 'linear-gradient(135deg, #ff8c0033 0%, #ffaa0033 100%)',
          borderColor: criticalCount > 0 ? '#ff0000' : '#ff8c00',
        }}>
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <div className="alert-title">
              {criticalCount > 0 ? '存在紧急问题需要处理' : '有重要建议可供参考'}
            </div>
            <div className="alert-details">
              {criticalCount > 0 && <span>紧急: {criticalCount}项</span>}
              {highCount > 0 && <span>警告: {highCount}项</span>}
            </div>
          </div>
          <button
            className="alert-view-btn"
            onClick={() => setActiveTab('strategy')}
          >
            查看详情
          </button>
        </div>
      )}

      <div className="pause-buttons">
        <button className="menu-button primary" onClick={onResume}>
          继续游戏
        </button>
        <button className="menu-button" onClick={onRestart}>
          重新开始
        </button>
        <button className="menu-button" onClick={onMainMenu}>
          返回主菜单
        </button>
      </div>
    </>
  );

  const renderStrategyTab = () => (
    <div className="strategy-tab">
      <div className="strategy-header">
        <h3>📋 策略建议</h3>
        <div className="strategy-summary">
          <span className="summary-item critical">{criticalCount} 紧急</span>
          <span className="summary-item high">{highCount} 警告</span>
          <span className="summary-item medium">
            {suggestions.filter((s) => s.priority === 'medium').length} 注意
          </span>
          <span className="summary-item low">
            {suggestions.filter((s) => s.priority === 'low').length} 建议
          </span>
        </div>
      </div>

      <div className="strategy-list">
        {sortedSuggestions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">当前没有需要处理的建议</div>
            <div className="empty-subtext">继续保持良好的飞行状态！</div>
          </div>
        ) : (
          sortedSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`strategy-card priority-${suggestion.priority}`}
              style={{
                borderLeftColor: PRIORITY_COLORS[suggestion.priority],
              }}
            >
              <div className="strategy-card-header">
                <div className="strategy-type">
                  <span className="type-icon">{TYPE_ICONS[suggestion.type]}</span>
                  <span className="type-name">{TYPE_NAMES[suggestion.type]}</span>
                </div>
                <div
                  className="strategy-priority-badge"
                  style={{ background: PRIORITY_COLORS[suggestion.priority] }}
                >
                  {PRIORITY_NAMES[suggestion.priority]}
                </div>
              </div>

              <h4 className="strategy-title">{suggestion.title}</h4>
              <p className="strategy-description">{suggestion.description}</p>

              {suggestion.action && (
                <div className="strategy-action">
                  <div className="action-label">建议操作:</div>
                  <div className="action-params">
                    {Object.entries(suggestion.action.params).map(([key, value]) => (
                      <span key={key} className="param-tag">
                        {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="analysis-tab">
      <h3 className="analysis-title">📊 当前状态分析</h3>

      {observation && (
        <div className="analysis-section">
          <h4 className="section-title">风场状态</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">风向关系</div>
              <div
                className="analysis-value"
                style={{ color: WIND_RELATION_COLORS[observation.windRelation] }}
              >
                {WIND_RELATION_ICONS[observation.windRelation]}{' '}
                {WIND_RELATION_NAMES[observation.windRelation]}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">风速</div>
              <div className="analysis-value">
                {observation.windSpeed.toFixed(2)} m/s
                {observation.windSpeed > WEATHER_SAFETY_THRESHOLDS.warningWindSpeed && (
                  <span className="warning-dot" style={{ background: '#ff8c00' }} />
                )}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">当前高度风速</div>
              <div className="analysis-value">
                {observation.windAtAltitude.toFixed(2)} m/s
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">湍流强度</div>
              <div className="analysis-value">
                {(observation.turbulenceLevel * 100).toFixed(0)}%
                {observation.turbulenceLevel > WEATHER_SAFETY_THRESHOLDS.warningTurbulence && (
                  <span className="warning-dot" style={{ background: '#ff0000' }} />
                )}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">阵风强度</div>
              <div className="analysis-value">
                {(observation.gustStrength * 100).toFixed(0)}%
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">推荐高度</div>
              <div className="analysis-value highlight">
                {Math.floor(observation.recommendedAltitude)} m
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="analysis-section">
          <h4 className="section-title">飞行状态</h4>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">当前高度</div>
              <div className="analysis-value">{Math.floor(stats.height)} m</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">飞行距离</div>
              <div className="analysis-value">{Math.floor(stats.distance)} m</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">飞行时间</div>
              <div className="analysis-value">
                {Math.floor(stats.time / 60)}:{Math.floor(stats.time % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">飞行稳定性</div>
              <div
                className="analysis-value"
                style={{
                  color: stats.flightStability > 0.8
                    ? '#4ecdc4'
                    : stats.flightStability > 0.5
                    ? '#ffd700'
                    : '#ff6b6b',
                }}
              >
                {(stats.flightStability * 100).toFixed(0)}%
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">影子追踪</div>
              <div
                className="analysis-value"
                style={{
                  color: stats.shadowTracking > 0.8
                    ? '#ffd700'
                    : stats.shadowTracking > 0.6
                    ? '#4ecdc4'
                    : '#ff6b6b',
                }}
              >
                {(stats.shadowTracking * 100).toFixed(0)}%
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">得分倍率</div>
              <div className="analysis-value highlight">
                x{stats.scoreMultiplier.toFixed(1)}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">耐久度</div>
              <div
                className="analysis-value"
                style={{
                  color: stats.durability.isCritical
                    ? '#ff0000'
                    : stats.durability.isWarning
                    ? '#ff8c00'
                    : '#4ecdc4',
                }}
              >
                {Math.floor(stats.durability.current)}/{stats.durability.max}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">线轴张力</div>
              <div
                className="analysis-value"
                style={{
                  color: stats.tension.isOverTension
                    ? '#ff0000'
                    : stats.tension.isUnderTension
                    ? '#ff8c00'
                    : '#4ecdc4',
                }}
              >
                {Math.floor(stats.tension.current)}/{stats.tension.max}
              </div>
            </div>
          </div>
        </div>
      )}

      {observation && stats && (
        <div className="analysis-section recommendations">
          <h4 className="section-title">💡 优化建议</h4>
          <div className="recommendation-list">
            {Math.abs(observation.recommendedAltitude - stats.height) > 30 && (
              <div className="recommendation-item">
                <span className="rec-icon">📏</span>
                <span className="rec-text">
                  建议{observation.recommendedAltitude > stats.height ? '提升' : '降低'}高度约{' '}
                  {Math.floor(Math.abs(observation.recommendedAltitude - stats.height))}m 以获得更优风况
                </span>
              </div>
            )}
            {observation.windRelation === 'headwind' && (
              <div className="recommendation-item">
                <span className="rec-icon">💨</span>
                <span className="rec-text">逆风飞行可获得更大升力，适当放长线保持高度</span>
              </div>
            )}
            {observation.windRelation === 'tailwind' && (
              <div className="recommendation-item">
                <span className="rec-icon">🚀</span>
                <span className="rec-text">顺风飞行速度快但升力不足，注意收线维持高度</span>
              </div>
            )}
            {observation.turbulenceLevel > 0.5 && (
              <div className="recommendation-item warning">
                <span className="rec-icon">🌪️</span>
                <span className="rec-text">强湍流中飞行，建议降低高度或增加稳定性因子</span>
              </div>
            )}
            {stats.flightStability < 0.5 && (
              <div className="recommendation-item warning">
                <span className="rec-icon">⚖️</span>
                <span className="rec-text">稳定性偏低，避免突然转向，平稳操作</span>
              </div>
            )}
            {stats.durability.current < stats.durability.warningThreshold && (
              <div className="recommendation-item danger">
                <span className="rec-icon">🛡️</span>
                <span className="rec-text">耐久度不足，注意躲避障碍物，考虑准备降落</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="menu-overlay pause-overlay">
      <div className="menu-content pause-content expanded">
        <div className="pause-tabs">
          <button
            className={`pause-tab ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            🏠 主菜单
          </button>
          <button
            className={`pause-tab ${activeTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategy')}
          >
            📋 策略建议
            {(criticalCount > 0 || highCount > 0) && (
              <span className="tab-badge" style={{
                background: criticalCount > 0 ? '#ff0000' : '#ff8c00',
              }}>
                {criticalCount + highCount}
              </span>
            )}
          </button>
          <button
            className={`pause-tab ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            📊 状态分析
          </button>
        </div>

        <div className="pause-tab-content">
          {activeTab === 'main' && renderMainTab()}
          {activeTab === 'strategy' && renderStrategyTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
        </div>

        {activeTab !== 'main' && (
          <div className="pause-footer">
            <button className="menu-button primary" onClick={onResume}>
              继续游戏
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
