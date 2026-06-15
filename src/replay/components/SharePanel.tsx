import React, { useState } from 'react';
import type { ReplaySession, ShareConfig, ShareResult } from '../types';
import { formatDuration } from '../replayData';

interface SharePanelProps {
  replay: ReplaySession;
  onCreateShare: (config: ShareConfig) => ShareResult;
  onCopyShareCode: (share: ShareResult) => boolean;
  previousShares: ShareResult[];
}

export const SharePanel: React.FC<SharePanelProps> = ({
  replay,
  onCreateShare,
  onCopyShareCode,
  previousShares,
}) => {
  const [selectedMode, setSelectedMode] = useState<ShareConfig['mode']>('link');
  const [includeTrajectory, setIncludeTrajectory] = useState(true);
  const [includeKeyNodes, setIncludeKeyNodes] = useState(true);
  const [includeScore, setIncludeScore] = useState(true);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [clipEnabled, setClipEnabled] = useState(false);
  const [clipStartRatio, setClipStartRatio] = useState(0);
  const [clipEndRatio, setClipEndRatio] = useState(1);
  const [lastResult, setLastResult] = useState<ShareResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const config: ShareConfig = {
      mode: selectedMode,
      includeTrajectory,
      includeKeyNodes,
      includeScore,
      quality,
    };
    if (clipEnabled) {
      const startTime = replay.trajectory[0]?.t || 0;
      const endTime = replay.trajectory[replay.trajectory.length - 1]?.t || startTime;
      const duration = endTime - startTime;
      config.clipStart = startTime + clipStartRatio * duration;
      config.clipEnd = startTime + clipEndRatio * duration;
    }
    const result = onCreateShare(config);
    setLastResult(result);
    setCopied(false);
  };

  const handleCopy = () => {
    if (lastResult) {
      const ok = onCopyShareCode(lastResult);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const startTime = replay.trajectory[0]?.t || 0;
  const endTime = replay.trajectory[replay.trajectory.length - 1]?.t || 0;
  const totalDuration = endTime - startTime;

  const shareOptions = [
    {
      mode: 'link' as const,
      icon: '🔗',
      name: '分享链接',
      desc: '生成可访问的链接',
    },
    {
      mode: 'image' as const,
      icon: '🖼️',
      name: '精彩海报',
      desc: '生成数据海报图片',
    },
    {
      mode: 'clip' as const,
      icon: '🎞️',
      name: '视频剪辑',
      desc: '导出精彩片段视频',
    },
    {
      mode: 'social' as const,
      icon: '📱',
      name: '一键分享',
      desc: '分享到社交平台',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
          🚀 分享中心
        </h4>
      </div>

      <div className="replay-sidebar-content">
        <div className="share-section">
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            分享方式
          </div>
          <div className="share-options-grid">
            {shareOptions.map((opt) => (
              <div
                key={opt.mode}
                className={`share-option-card ${selectedMode === opt.mode ? 'active' : ''}`}
                onClick={() => setSelectedMode(opt.mode)}
                style={{
                  borderColor:
                    selectedMode === opt.mode
                      ? 'rgba(56,189,248,0.5)'
                      : 'rgba(255,255,255,0.08)',
                  background:
                    selectedMode === opt.mode
                      ? 'rgba(56,189,248,0.1)'
                      : 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="icon">{opt.icon}</div>
                <div className="name">{opt.name}</div>
                <div className="desc">{opt.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="share-section">
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            内容配置
          </div>
          <div className="share-config">
            <div className="share-config-item">
              <span className="share-config-label">🛤️ 包含轨迹数据</span>
              <div
                className={`share-toggle ${includeTrajectory ? 'on' : ''}`}
                onClick={() => setIncludeTrajectory(!includeTrajectory)}
              />
            </div>
            <div className="share-config-item">
              <span className="share-config-label">📍 包含关键节点</span>
              <div
                className={`share-toggle ${includeKeyNodes ? 'on' : ''}`}
                onClick={() => setIncludeKeyNodes(!includeKeyNodes)}
              />
            </div>
            <div className="share-config-item">
              <span className="share-config-label">🏆 包含得分数据</span>
              <div
                className={`share-toggle ${includeScore ? 'on' : ''}`}
                onClick={() => setIncludeScore(!includeScore)}
              />
            </div>
          </div>
        </div>

        {(selectedMode === 'clip' || selectedMode === 'image') && (
          <div className="share-section">
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              导出质量
            </div>
            <div className="quality-select">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  className={`quality-btn ${quality === q ? 'active' : ''}`}
                  onClick={() => setQuality(q)}
                >
                  {q === 'low' && '标清'}
                  {q === 'medium' && '高清'}
                  {q === 'high' && '超清'}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'clip' && (
          <div className="share-section">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                剪辑片段
              </div>
              <div
                className={`share-toggle ${clipEnabled ? 'on' : ''}`}
                onClick={() => setClipEnabled(!clipEnabled)}
              />
            </div>
            {clipEnabled && (
              <div className="clip-range">
                <div className="clip-range-label">
                  <span>{formatDuration(clipStartRatio * totalDuration / 1000)}</span>
                  <span>{formatDuration(clipEndRatio * totalDuration / 1000)}</span>
                </div>
                <div className="clip-range-inputs" style={{ marginTop: 8 }}>
                  <input
                    type="range"
                    min="0"
                    max={clipEndRatio * 100}
                    value={clipStartRatio * 100}
                    onChange={(e) => setClipStartRatio(Number(e.target.value) / 100)}
                    className="clip-range-input"
                  />
                  <span style={{ color: '#64748b', fontSize: 10 }}>—</span>
                  <input
                    type="range"
                    min={clipStartRatio * 100}
                    max="100"
                    value={clipEndRatio * 100}
                    onChange={(e) => setClipEndRatio(Number(e.target.value) / 100)}
                    className="clip-range-input"
                  />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  剪辑时长:{' '}
                  {formatDuration(
                    ((clipEndRatio - clipStartRatio) * totalDuration) / 1000
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {lastResult && (
          <div className="share-section">
            <div
              style={{
                fontSize: 11,
                color: '#22c55e',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✅ 生成成功！
            </div>
            <div className="share-result">
              <div className="share-result-code">{lastResult.code}</div>
              {lastResult.url && (
                <div className="share-result-url">
                  🔗 {lastResult.url}
                </div>
              )}
              <button
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? (
                  <>✅ 已复制到剪贴板</>
                ) : (
                  <>📋 复制{lastResult.url ? '链接' : '代码'}</>
                )}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow =
              '0 8px 24px rgba(56,189,248,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {selectedMode === 'link' && '🔗'}
          {selectedMode === 'image' && '🖼️'}
          {selectedMode === 'clip' && '🎞️'}
          {selectedMode === 'social' && '📱'}
          生成{selectedMode === 'link' ? '链接' : selectedMode === 'image' ? '海报' : selectedMode === 'clip' ? '剪辑' : '分享'}
        </button>

        {previousShares.length > 0 && (
          <div className="share-section">
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              历史分享 ({previousShares.length})
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {previousShares.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: 10,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'SF Mono, monospace',
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#38bdf8',
                        letterSpacing: 2,
                      }}
                    >
                      {s.code}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#64748b',
                        marginTop: 2,
                      }}
                    >
                      {new Date(s.createdAt).toLocaleDateString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' · '}
                      {s.type === 'link' ? '链接' : s.type === 'image' ? '海报' : s.type === 'clip' ? '剪辑' : '社交'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const ok = onCopyShareCode(s);
                      if (ok) {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      background: 'rgba(56,189,248,0.1)',
                      border: '1px solid rgba(56,189,248,0.3)',
                      borderRadius: 6,
                      color: '#38bdf8',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    📋 复制
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: 'auto',
            padding: 12,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#a78bfa',
              fontWeight: 600,
              marginBottom: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            💡 小提示
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            通过分享代码，其他玩家可以在观战中心导入你的回放数据，用于学习交流和战术分析。
          </div>
        </div>
      </div>
    </div>
  );
};
