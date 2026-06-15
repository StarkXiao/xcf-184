import React, { useState } from 'react';
import type { KeyNode, ReplaySession, KeyNodeType } from '../types';
import { KEY_NODE_TYPES } from '../types';
import { formatDuration } from '../replayData';

interface KeyNodePanelProps {
  replay: ReplaySession;
  currentIndex: number;
  currentTime: number;
  onSeekToKeyNode: (id: string) => void;
  onAddKeyNode: (params: {
    type: KeyNodeType;
    trajectoryIndex: number;
    title: string;
    description?: string;
    tags?: string[];
  }) => void;
  onRemoveKeyNode: (id: string) => void;
  onUpdateKeyNode: (
    id: string,
    updates: Partial<Pick<KeyNode, 'title' | 'description' | 'tags'>>
  ) => void;
  currentTrajectoryIndex: number;
}

export const KeyNodePanel: React.FC<KeyNodePanelProps> = ({
  replay,
  currentIndex,
  currentTime,
  onSeekToKeyNode,
  onAddKeyNode,
  onRemoveKeyNode,
  onUpdateKeyNode,
  currentTrajectoryIndex,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNodeType, setNewNodeType] = useState<KeyNodeType>('custom');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const startTime = replay.trajectory[0]?.t || 0;

  const handleAdd = () => {
    if (!newNodeTitle.trim()) return;
    onAddKeyNode({
      type: newNodeType,
      trajectoryIndex: currentTrajectoryIndex,
      title: newNodeTitle.trim(),
      description: newNodeDesc.trim() || undefined,
    });
    setNewNodeTitle('');
    setNewNodeDesc('');
    setShowAddForm(false);
  };

  const handleEditStart = (kn: KeyNode) => {
    setEditingId(kn.id);
    setEditTitle(kn.title);
    setEditDesc(kn.description);
  };

  const handleEditSave = (id: string) => {
    onUpdateKeyNode(id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
          📍 关键节点
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: '#64748b',
              fontWeight: 400,
            }}
          >
            ({replay.keyNodes.length})
          </span>
        </h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '6px 12px',
            background: showAddForm
              ? 'rgba(239,68,68,0.15)'
              : 'rgba(139,92,246,0.15)',
            border: `1px solid ${
              showAddForm ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.4)'
            }`,
            borderRadius: 8,
            color: showAddForm ? '#ef4444' : '#a78bfa',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showAddForm ? '取消' : '+ 添加'}
        </button>
      </div>

      {showAddForm && (
        <div
          style={{
            padding: 14,
            background: 'rgba(139,92,246,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#94a3b8',
                marginBottom: 4,
              }}
            >
              节点类型
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {KEY_NODE_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setNewNodeType(t.type)}
                  style={{
                    padding: '4px 8px',
                    background: newNodeType === t.type ? `${t.color}30` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${newNodeType === t.type ? t.color : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 6,
                    color: newNodeType === t.type ? t.color : '#94a3b8',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {t.icon}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#94a3b8',
                marginBottom: 4,
              }}
            >
              标题 *
            </label>
            <input
              value={newNodeTitle}
              onChange={(e) => setNewNodeTitle(e.target.value)}
              placeholder="输入节点标题..."
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: '#94a3b8',
                marginBottom: 4,
              }}
            >
              描述（可选）
            </label>
            <textarea
              value={newNodeDesc}
              onChange={(e) => setNewNodeDesc(e.target.value)}
              placeholder="添加描述信息..."
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 12,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#64748b',
              marginBottom: 10,
            }}
          >
            ⏱️ 位置: {formatDuration((currentTime - startTime) / 1000)}
          </div>
          <button
            onClick={handleAdd}
            disabled={!newNodeTitle.trim()}
            style={{
              width: '100%',
              padding: '10px',
              background: newNodeTitle.trim()
                ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 8,
              color: newNodeTitle.trim() ? 'white' : '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: newNodeTitle.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            确认添加
          </button>
        </div>
      )}

      <div className="replay-sidebar-content">
        {replay.keyNodes.length === 0 ? (
          <div className="empty-replay-state">
            <div className="big-icon" style={{ fontSize: 48 }}>
              📍
            </div>
            <h3>暂无关键节点</h3>
            <p>系统会自动检测关键节点，你也可以在回放时手动添加</p>
          </div>
        ) : (
          <div className="keynode-list">
            {replay.keyNodes.map((kn) => (
              <React.Fragment key={kn.id}>
                {editingId === kn.id ? (
                  <div
                    style={{
                      padding: 12,
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: 10,
                    }}
                  >
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: 12,
                        marginBottom: 8,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: 11,
                        marginBottom: 8,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleEditSave(kn.id)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: '#22c55e',
                          border: 'none',
                          borderRadius: 6,
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          flex: 1,
                          padding: '6px',
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: 6,
                          color: '#94a3b8',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`keynode-item ${
                      currentIndex >= kn.trajectoryIndex - 3 &&
                      currentIndex <= kn.trajectoryIndex + 3
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => onSeekToKeyNode(kn.id)}
                  >
                    <div
                      className="keynode-icon"
                      style={{
                        background: `${kn.color}20`,
                        borderColor: kn.color,
                        color: kn.color,
                      }}
                    >
                      {kn.icon}
                    </div>
                    <div className="keynode-content">
                      <div className="keynode-title">
                        {kn.title}
                        {kn.isUserAdded && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              padding: '1px 5px',
                              background: 'rgba(139,92,246,0.2)',
                              borderRadius: 4,
                              color: '#a78bfa',
                              fontWeight: 500,
                            }}
                          >
                            手动
                          </span>
                        )}
                      </div>
                      {kn.description && (
                        <div className="keynode-desc">{kn.description}</div>
                      )}
                      {kn.statsAtMoment && Object.keys(kn.statsAtMoment).length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 4,
                            marginTop: 4,
                          }}
                        >
                          {kn.statsAtMoment.height !== undefined && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: 'rgba(59,130,246,0.1)',
                                borderRadius: 4,
                                color: '#60a5fa',
                              }}
                            >
                              ⛰️ {kn.statsAtMoment.height}m
                            </span>
                          )}
                          {kn.statsAtMoment.distance !== undefined && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: 'rgba(139,92,246,0.1)',
                                borderRadius: 4,
                                color: '#a78bfa',
                              }}
                            >
                              📍 {kn.statsAtMoment.distance}m
                            </span>
                          )}
                          {kn.statsAtMoment.stability !== undefined && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                background: 'rgba(34,197,94,0.1)',
                                borderRadius: 4,
                                color: '#4ade80',
                              }}
                            >
                              ⚖️ {Math.round((kn.statsAtMoment.stability as number) * 100)}%
                            </span>
                          )}
                        </div>
                      )}
                      <div className="keynode-time">
                        ⏱️ {formatDuration((kn.timestamp - startTime) / 1000)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(kn);
                          }}
                          style={{
                            padding: '3px 8px',
                            background: 'rgba(56,189,248,0.1)',
                            border: 'none',
                            borderRadius: 5,
                            color: '#38bdf8',
                            fontSize: 10,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ 编辑
                        </button>
                        {kn.isUserAdded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveKeyNode(kn.id);
                            }}
                            style={{
                              padding: '3px 8px',
                              background: 'rgba(239,68,68,0.1)',
                              border: 'none',
                              borderRadius: 5,
                              color: '#ef4444',
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            🗑️ 删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
