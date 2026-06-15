import React, { useState } from 'react';
import type { ReplaySession, FlightMode } from '../types';
import { formatDuration, formatDate } from '../replayData';
import { FLIGHT_MODE_NAMES } from '../../journey/types';

interface ReplayListProps {
  replays: ReplaySession[];
  currentReplayId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  filters: {
    modes: FlightMode[];
    favoritesOnly: boolean;
  };
  onToggleModeFilter: (mode: FlightMode) => void;
  onToggleFavoritesOnly: () => void;
  sortBy: 'date' | 'score' | 'duration' | 'views';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'date' | 'score' | 'duration' | 'views') => void;
  onSortOrderChange: () => void;
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
}

export const ReplayList: React.FC<ReplayListProps> = ({
  replays,
  currentReplayId,
  onSelect,
  onToggleFavorite,
  filters,
  onToggleModeFilter,
  onToggleFavoritesOnly,
  sortBy,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  allTags,
  activeTags,
  onToggleTag,
}) => {
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const modes: Array<{ mode: FlightMode; icon: string }> = [
    { mode: 'free', icon: '🪁' },
    { mode: 'tournament', icon: '🏆' },
    { mode: 'training', icon: '📚' },
    { mode: 'weatherLab', icon: '🌦️' },
    { mode: 'levelEditor', icon: '🛠️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="replay-filter-bar">
        {modes.map(({ mode, icon }) => (
          <button
            key={mode}
            className={`replay-filter-chip ${filters.modes.includes(mode) ? 'active' : ''}`}
            onClick={() => onToggleModeFilter(mode)}
            title={FLIGHT_MODE_NAMES[mode]}
          >
            {icon} {FLIGHT_MODE_NAMES[mode]}
          </button>
        ))}
        <button
          className={`replay-filter-chip ${filters.favoritesOnly ? 'active' : ''}`}
          onClick={onToggleFavoritesOnly}
          title="仅显示收藏"
        >
          ⭐ 收藏
        </button>
        {allTags.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className={`replay-filter-chip ${activeTags.length > 0 ? 'active' : ''}`}
              onClick={() => setShowTagDropdown(!showTagDropdown)}
            >
              🏷️ 标签 {activeTags.length > 0 && `(${activeTags.length})`}
            </button>
            {showTagDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: 8,
                  zIndex: 50,
                  minWidth: 160,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`replay-filter-chip ${activeTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => onToggleTag(tag)}
                    style={{ fontSize: 11 }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <select
          className="replay-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
        >
          <option value="date">按日期</option>
          <option value="score">按得分</option>
          <option value="duration">按时长</option>
          <option value="views">按热度</option>
        </select>
        <button
          className="replay-filter-chip"
          onClick={onSortOrderChange}
          title={sortOrder === 'desc' ? '降序' : '升序'}
        >
          {sortOrder === 'desc' ? '⬇️' : '⬆️'}
        </button>
      </div>

      <div className="replay-sidebar-content">
        {replays.length === 0 ? (
          <div className="empty-replay-state">
            <div className="big-icon">🎬</div>
            <h3>暂无回放记录</h3>
            <p>完成飞行后会自动生成回放，你可以在这里回看精彩瞬间</p>
          </div>
        ) : (
          <div className="replay-list">
            {replays.map((replay) => (
              <div
                key={replay.id}
                className={`replay-card ${currentReplayId === replay.id ? 'active' : ''}`}
                onClick={() => onSelect(replay.id)}
              >
                <div className="replay-card-header">
                  <h4 className="replay-card-title">{replay.title}</h4>
                  <span
                    className="replay-card-fav"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(replay.id);
                    }}
                  >
                    {replay.isFavorite ? '⭐' : '☆'}
                  </span>
                </div>
                <div className="replay-card-stats">
                  <div className="replay-card-stat">
                    <span>🏆</span>
                    <span className="value">{replay.adjustedScore.toLocaleString()}</span>
                    <span>分</span>
                  </div>
                  <div className="replay-card-stat">
                    <span>⏱️</span>
                    <span className="value">{formatDuration(replay.duration)}</span>
                  </div>
                  <div className="replay-card-stat">
                    <span>📍</span>
                    <span className="value">{Math.round(replay.finalStats.distance)}m</span>
                  </div>
                  <div className="replay-card-stat">
                    <span>⛰️</span>
                    <span className="value">{Math.round(replay.finalStats.maxHeight)}m</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    marginBottom: 6,
                  }}
                >
                  {formatDate(replay.createdAt)}
                </div>
                {replay.keyNodes.length > 0 && (
                  <div className="replay-card-tags">
                    <span className="replay-tag">📍 {replay.keyNodes.length} 个节点</span>
                    {replay.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="replay-tag">
                        🏷️ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
