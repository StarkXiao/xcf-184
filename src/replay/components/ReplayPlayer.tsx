import React, { useMemo } from 'react';
import { TrajectoryCanvas } from './TrajectoryCanvas';
import type { ReplaySession, ViewMode, PlaybackStateData } from '../types';
import { VIEW_MODES, PLAYBACK_SPEEDS } from '../types';
import { formatDuration } from '../replayData';

interface ReplayPlayerProps {
  replay: ReplaySession;
  playback: PlaybackStateData;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSeekToTime: (timeMs: number) => void;
  onSeekToIndex: (index: number) => void;
  onSeekToKeyNode: (keyNodeId: string) => void;
  onToggleLoop: () => void;
  onSetShowTrajectory: (show: boolean) => void;
  onSetShowKeyNodes: (show: boolean) => void;
  onSetShowStatsOverlay: (show: boolean) => void;
  onAddKeyNodeAtCurrent: () => void;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({
  replay,
  playback,
  onTogglePlay,
  onSetSpeed,
  onSetViewMode,
  onSeekToTime,
  onSeekToIndex,
  onSeekToKeyNode,
  onToggleLoop,
  onSetShowTrajectory,
  onSetShowKeyNodes,
  onSetShowStatsOverlay,
  onAddKeyNodeAtCurrent,
}) => {
  const startTime = replay.trajectory[0]?.t || 0;
  const endTime = replay.trajectory[replay.trajectory.length - 1]?.t || 0;
  const durationMs = endTime - startTime;
  const progress = durationMs > 0 ? (playback.currentTime - startTime) / durationMs : 0;

  const currentPoint = replay.trajectory[playback.currentIndex];
  const currentStats = useMemo(() => {
    if (!currentPoint) return null;
    const dist = Math.sqrt(currentPoint.x ** 2 + currentPoint.z ** 2);
    const speed = Math.sqrt(currentPoint.vx ** 2 + currentPoint.vy ** 2 + currentPoint.vz ** 2);
    return {
      height: Math.round(currentPoint.y),
      distance: Math.round(dist),
      speed: speed.toFixed(1),
      stability: Math.round(currentPoint.stability * 100),
      shadowTracking: Math.round(currentPoint.shadowTracking * 100),
    };
  }, [currentPoint]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const targetTime = startTime + ratio * durationMs;
    onSeekToTime(targetTime);
  };

  return (
    <div className="replay-main">
      <div className="replay-info-panel">
        <div className="replay-info-title">
          <h3>{replay.title}</h3>
          <span className="replay-mode-tag">{replay.modeName}</span>
          {replay.weatherCondition && (
            <span className="replay-tag">{replay.weatherCondition}</span>
          )}
        </div>
        <div className="replay-info-stats">
          <div className="replay-info-stat">
            <div className="label">总得分</div>
            <div className="value">{replay.adjustedScore.toLocaleString()}</div>
          </div>
          <div className="replay-info-stat">
            <div className="label">飞行距离</div>
            <div className="value">{Math.round(replay.finalStats.distance)}m</div>
          </div>
          <div className="replay-info-stat">
            <div className="label">最高高度</div>
            <div className="value">{Math.round(replay.finalStats.maxHeight)}m</div>
          </div>
          <div className="replay-info-stat">
            <div className="label">时长</div>
            <div className="value">{formatDuration(replay.duration)}</div>
          </div>
        </div>
      </div>

      <div className="replay-canvas-area">
        <div className="replay-visualization">
          <TrajectoryCanvas
            replay={replay}
            currentIndex={playback.currentIndex}
            viewMode={playback.viewMode}
            showTrajectory={playback.showTrajectory}
            showKeyNodes={playback.showKeyNodes}
            onKeyNodeClick={onSeekToKeyNode}
          />
        </div>

        {playback.showStatsOverlay && currentStats && (
          <div className="replay-stats-overlay">
            <div className="replay-stat-badge">
              <span className="icon">⛰️</span>
              <div>
                <div className="label">高度</div>
                <div className="value">{currentStats.height}m</div>
              </div>
            </div>
            <div className="replay-stat-badge">
              <span className="icon">📍</span>
              <div>
                <div className="label">距离</div>
                <div className="value">{currentStats.distance}m</div>
              </div>
            </div>
            <div className="replay-stat-badge">
              <span className="icon">💨</span>
              <div>
                <div className="label">速度</div>
                <div className="value">{currentStats.speed}</div>
              </div>
            </div>
            <div className="replay-stat-badge">
              <span className="icon">⚖️</span>
              <div>
                <div className="label">稳定性</div>
                <div className="value">{currentStats.stability}%</div>
              </div>
            </div>
            <div className="replay-stat-badge">
              <span className="icon">👤</span>
              <div>
                <div className="label">影子追踪</div>
                <div className="value">{currentStats.shadowTracking}%</div>
              </div>
            </div>
          </div>
        )}

        <div className="view-mode-panel">
          {VIEW_MODES.map((vm) => (
            <button
              key={vm.id}
              className={`view-mode-btn ${playback.viewMode === vm.id ? 'active' : ''}`}
              onClick={() => onSetViewMode(vm.id)}
              title={`${vm.name} - ${vm.description}`}
            >
              {vm.icon}
            </button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          <button
            className={`view-mode-btn ${playback.showTrajectory ? 'active' : ''}`}
            onClick={() => onSetShowTrajectory(!playback.showTrajectory)}
            title="显示/隐藏轨迹"
          >
            🛤️
          </button>
          <button
            className={`view-mode-btn ${playback.showKeyNodes ? 'active' : ''}`}
            onClick={() => onSetShowKeyNodes(!playback.showKeyNodes)}
            title="显示/隐藏关键节点"
          >
            📍
          </button>
          <button
            className={`view-mode-btn ${playback.showStatsOverlay ? 'active' : ''}`}
            onClick={() => onSetShowStatsOverlay(!playback.showStatsOverlay)}
            title="显示/隐藏数据面板"
          >
            📊
          </button>
        </div>

        {playback.showKeyNodes && replay.keyNodes.length > 0 && (
          <div className="keynode-indicators">
            {replay.keyNodes.slice(0, 8).map((kn) => (
              <div
                key={kn.id}
                className="keynode-dot"
                style={{ borderColor: kn.color, background: `${kn.color}40` }}
                onClick={() => onSeekToKeyNode(kn.id)}
              >
                {kn.icon}
                <div className="tooltip">{kn.title}</div>
              </div>
            ))}
            {replay.keyNodes.length > 8 && (
              <div
                className="keynode-dot"
                style={{ borderColor: '#64748b', background: 'rgba(100,116,139,0.3)' }}
              >
                +{replay.keyNodes.length - 8}
                <div className="tooltip">侧边栏查看更多</div>
              </div>
            )}
          </div>
        )}

        <button
          className="add-keynode-btn"
          onClick={onAddKeyNodeAtCurrent}
          title="在此处添加关键节点"
        >
          +
        </button>
      </div>

      <div className="replay-controls">
        <div className="replay-progress-bar" onClick={handleProgressClick}>
          <div
            className="replay-progress-fill"
            style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }}
          />
          <div className="replay-progress-markers">
            {replay.keyNodes.map((kn) => {
              const knTp = replay.trajectory[kn.trajectoryIndex];
              if (!knTp) return null;
              const ratio = durationMs > 0 ? (knTp.t - startTime) / durationMs : 0;
              if (ratio < 0 || ratio > 1) return null;
              return (
                <div
                  key={kn.id}
                  className="replay-progress-marker"
                  style={{ left: `${ratio * 100}%`, background: kn.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeekToKeyNode(kn.id);
                  }}
                  title={kn.title}
                />
              );
            })}
          </div>
        </div>

        <div className="replay-controls-row">
          <div className="replay-controls-left">
            <button
              className="replay-ctrl-btn"
              onClick={() => onSeekToIndex(Math.max(0, playback.currentIndex - 30))}
              title="后退5秒"
            >
              ⏮
            </button>
            <button
              className="replay-ctrl-btn"
              onClick={() => onSeekToIndex(Math.max(0, playback.currentIndex - 5))}
              title="后退1秒"
            >
              ⏪
            </button>
            <button
              className="replay-ctrl-btn play"
              onClick={onTogglePlay}
              title={playback.isPlaying ? '暂停' : '播放'}
            >
              {playback.isPlaying ? '⏸' : '▶'}
            </button>
            <button
              className="replay-ctrl-btn"
              onClick={() =>
                onSeekToIndex(Math.min(replay.trajectory.length - 1, playback.currentIndex + 5))
              }
              title="前进1秒"
            >
              ⏩
            </button>
            <button
              className="replay-ctrl-btn"
              onClick={() =>
                onSeekToIndex(Math.min(replay.trajectory.length - 1, playback.currentIndex + 30))
              }
              title="前进5秒"
            >
              ⏭
            </button>
            <div className="replay-time">
              <span className="current">{formatDuration((playback.currentTime - startTime) / 1000)}</span>
              <span> / {formatDuration(durationMs / 1000)}</span>
            </div>
          </div>

          <div className="replay-controls-right">
            <div className="replay-speed-select">
              {PLAYBACK_SPEEDS.map((s) => (
                <button
                  key={s}
                  className={`replay-speed-btn ${playback.playbackSpeed === s ? 'active' : ''}`}
                  onClick={() => onSetSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
            <button
              className={`replay-ctrl-btn ${playback.isLooping ? 'active' : ''}`}
              onClick={onToggleLoop}
              title={playback.isLooping ? '循环播放中' : '开启循环'}
            >
              🔁
            </button>
            <button
              className="replay-ctrl-btn"
              onClick={() => onSeekToIndex(0)}
              title="回到开头"
            >
              ⏺
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
