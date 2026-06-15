import React, { useState, useMemo, useEffect } from 'react';
import { useReplay } from '../useReplay';
import { ReplayList } from './ReplayList';
import { ReplayPlayer } from './ReplayPlayer';
import { KeyNodePanel } from './KeyNodePanel';
import { ReviewPanel } from './ReviewPanel';
import { SharePanel } from './SharePanel';
import type { FlightMode, FlightRecord } from '../../journey/types';
import type { ShareConfig, ShareResult } from '../types';

interface ReplayCenterProps {
  onClose: () => void;
  flightRecords?: FlightRecord[];
}

type SidebarTab = 'list' | 'keynodes' | 'review' | 'share';

export const ReplayCenter: React.FC<ReplayCenterProps> = ({
  onClose,
  flightRecords = [],
}) => {
  const replay = useReplay();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('list');
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && flightRecords.length > 0 && replay.replays.length === 0) {
      const records = flightRecords.filter((r) => r.trajectory && r.trajectory.length > 10).slice(0, 10);
      records.forEach((r, idx) => {
        setTimeout(() => {
          replay.createReplayFromFlightRecord(r);
        }, idx * 100);
      });
      setInitialized(true);
    } else if (initialized === false) {
      setInitialized(true);
    }
  }, [flightRecords, initialized, replay]);

  const filteredReplays = useMemo(() => replay.getFilteredReplays(), [replay]);

  const allTags = useMemo(() => replay.getAllTags(), [replay]);

  const previousShares = useMemo<ShareResult[]>(() => {
    if (!replay.currentReplayId) return [];
    return replay.shares;
  }, [replay.currentReplayId, replay.shares]);

  const handleToggleModeFilter = (mode: FlightMode) => {
    const modes = [...replay.filters.modes];
    const idx = modes.indexOf(mode);
    if (idx === -1) {
      modes.push(mode);
    } else {
      modes.splice(idx, 1);
    }
    replay.setFilters({ modes });
  };

  const handleToggleTag = (tag: string) => {
    const tags = [...replay.filters.tags];
    const idx = tags.indexOf(tag);
    if (idx === -1) {
      tags.push(tag);
    } else {
      tags.splice(idx, 1);
    }
    replay.setFilters({ tags });
  };

  const handleSortOrderChange = () => {
    replay.setSortOrder(replay.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleGenerateReview = () => {
    if (!replay.currentReplayId) return;
    setIsGeneratingReview(true);
    setTimeout(() => {
      replay.generateReview(replay.currentReplayId!);
      setIsGeneratingReview(false);
    }, 800);
  };

  const handleAddKeyNodeAtCurrent = () => {
    if (!replay.currentReplay) return;
    setSidebarTab('keynodes');
    setTimeout(() => {
      const idx = replay.playback.currentIndex;
      const tp = replay.currentReplay?.trajectory[idx];
      if (tp) {
        replay.addKeyNode(replay.currentReplayId!, {
          type: 'custom',
          trajectoryIndex: idx,
          title: `自定义标记 ${replay.currentReplay!.keyNodes.length + 1}`,
        });
      }
    }, 200);
  };

  const tabs: Array<{ id: SidebarTab; name: string; icon: string }> = [
    { id: 'list', name: '回放列表', icon: '🎬' },
    { id: 'keynodes', name: '关键节点', icon: '📍' },
    { id: 'review', name: '复盘评分', icon: '📊' },
    { id: 'share', name: '分享', icon: '🚀' },
  ];

  const handleSelectReplay = (id: string) => {
    replay.setCurrentReplay(id);
  };

  return (
    <div className="replay-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="replay-container">
        <div className="replay-header">
          <div className="replay-header-title">
            <span className="icon">🎮</span>
            <h2>观战与回放中心</h2>
            <span
              style={{
                padding: '4px 12px',
                background: 'rgba(56,189,248,0.12)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: 20,
                fontSize: 12,
                color: '#38bdf8',
                fontWeight: 600,
              }}
            >
              {replay.replays.length} 场回放
            </span>
          </div>
          <button className="replay-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="replay-body">
          <div className="replay-sidebar">
            <div className="replay-sidebar-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`replay-sidebar-tab ${sidebarTab === t.id ? 'active' : ''}`}
                  onClick={() => setSidebarTab(t.id)}
                >
                  <span style={{ marginRight: 4 }}>{t.icon}</span>
                  {t.name}
                </button>
              ))}
            </div>

            {sidebarTab === 'list' && (
              <ReplayList
                replays={filteredReplays}
                currentReplayId={replay.currentReplayId}
                onSelect={handleSelectReplay}
                onToggleFavorite={replay.toggleFavorite}
                filters={replay.filters}
                onToggleModeFilter={handleToggleModeFilter}
                onToggleFavoritesOnly={() =>
                  replay.setFilters({ favoritesOnly: !replay.filters.favoritesOnly })
                }
                sortBy={replay.sortBy}
                sortOrder={replay.sortOrder}
                onSortChange={replay.setSortBy}
                onSortOrderChange={handleSortOrderChange}
                allTags={allTags}
                activeTags={replay.filters.tags}
                onToggleTag={handleToggleTag}
              />
            )}

            {sidebarTab === 'keynodes' && replay.currentReplay && (
              <KeyNodePanel
                replay={replay.currentReplay}
                currentIndex={replay.playback.currentIndex}
                currentTime={replay.playback.currentTime}
                onSeekToKeyNode={replay.seekToKeyNode}
                onAddKeyNode={(params) =>
                  replay.addKeyNode(replay.currentReplayId!, params)
                }
                onRemoveKeyNode={(id) =>
                  replay.removeKeyNode(replay.currentReplayId!, id)
                }
                onUpdateKeyNode={(id, updates) =>
                  replay.updateKeyNode(replay.currentReplayId!, id, updates)
                }
                currentTrajectoryIndex={replay.playback.currentIndex}
              />
            )}

            {sidebarTab === 'keynodes' && !replay.currentReplay && (
              <div className="empty-replay-state">
                <div className="big-icon">📍</div>
                <h3>请先选择回放</h3>
                <p>从回放列表中选择一个回放，查看和管理关键节点</p>
              </div>
            )}

            {sidebarTab === 'review' && replay.currentReplay && (
              <ReviewPanel
                replay={replay.currentReplay}
                review={replay.currentReview || null}
                onGenerateReview={handleGenerateReview}
                isGenerating={isGeneratingReview}
              />
            )}

            {sidebarTab === 'review' && !replay.currentReplay && (
              <div className="empty-replay-state">
                <div className="big-icon">📊</div>
                <h3>请先选择回放</h3>
                <p>从回放列表中选择一个回放，生成复盘评分报告</p>
              </div>
            )}

            {sidebarTab === 'share' && replay.currentReplay && (
              <SharePanel
                replay={replay.currentReplay}
                onCreateShare={(config: ShareConfig) =>
                  replay.createShare(replay.currentReplayId!, config)
                }
                onCopyShareCode={replay.copyShareCode}
                previousShares={previousShares}
              />
            )}

            {sidebarTab === 'share' && !replay.currentReplay && (
              <div className="empty-replay-state">
                <div className="big-icon">🚀</div>
                <h3>请先选择回放</h3>
                <p>从回放列表中选择一个回放，生成分享链接和内容</p>
              </div>
            )}
          </div>

          {replay.currentReplay ? (
            <ReplayPlayer
              replay={replay.currentReplay}
              playback={replay.playback}
              onTogglePlay={replay.togglePlay}
              onSetSpeed={replay.setPlaybackSpeed}
              onSetViewMode={replay.setViewMode}
              onSeekToTime={replay.seekToTime}
              onSeekToIndex={replay.seekToIndex}
              onSeekToKeyNode={(id) => {
                replay.seekToKeyNode(id);
                if (sidebarTab !== 'keynodes') setSidebarTab('keynodes');
              }}
              onToggleLoop={replay.toggleLoop}
              onSetShowTrajectory={replay.setShowTrajectory}
              onSetShowKeyNodes={replay.setShowKeyNodes}
              onSetShowStatsOverlay={replay.setShowStatsOverlay}
              onAddKeyNodeAtCurrent={handleAddKeyNodeAtCurrent}
            />
          ) : (
            <div className="empty-replay-view">
              <div className="big-icon">🎬</div>
              <h3>选择回放开始观看</h3>
              <p>
                从左侧列表中选择你想要观看的回放。支持多视角切换、关键节点标记、专业复盘评分和一键分享等功能。
              </p>
              <div
                style={{
                  marginTop: 40,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 20,
                  maxWidth: 600,
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    background: 'rgba(56,189,248,0.08)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎥</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    6种视角模式
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    跟随/追逐/俯视/自由/电影/第一视角
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    background: 'rgba(139,92,246,0.08)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    6维度评分
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    稳定性/高度/气流/追踪/风险/效率
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    padding: 20,
                    background: 'rgba(251,191,36,0.08)',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚀</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    多方式分享
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    链接/海报/剪辑/社交一键分享
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
