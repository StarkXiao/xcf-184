import React from 'react';
import type { ReplayReview, ReplaySession } from '../types';
import { SCORE_DIMENSIONS, GRADE_THRESHOLDS } from '../types';

interface ReviewPanelProps {
  replay: ReplaySession;
  review: ReplayReview | null;
  onGenerateReview: () => void;
  isGenerating: boolean;
}

const getScoreColor = (score: number): string => {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#38bdf8';
  if (score >= 55) return '#fbbf24';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};

export const ReviewPanel: React.FC<ReviewPanelProps> = ({
  replay,
  review,
  onGenerateReview,
  isGenerating,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 style={{ margin: 0, fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
          📊 复盘评分
        </h4>
      </div>

      <div className="replay-sidebar-content">
        {!review ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div
              style={{
                fontSize: 56,
                marginBottom: 16,
                opacity: 0.4,
              }}
            >
              📊
            </div>
            <h3
              style={{
                color: '#94a3b8',
                fontSize: 16,
                margin: '0 0 8px 0',
              }}
            >
              生成复盘评分报告
            </h3>
            <p
              style={{
                color: '#64748b',
                fontSize: 12,
                margin: '0 0 20px 0',
                lineHeight: 1.6,
              }}
            >
              系统将从6个维度对本次飞行进行专业评分和分析，帮助你发现提升空间
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 20,
              }}
            >
              {SCORE_DIMENSIONS.map((dim) => (
                <div
                  key={dim.id}
                  style={{
                    padding: 10,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span>{dim.icon}</span>
                    <span>{dim.name}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onGenerateReview}
              disabled={isGenerating}
              className="generate-review-btn"
              style={{
                opacity: isGenerating ? 0.7 : 1,
              }}
            >
              {isGenerating ? (
                <React.Fragment>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                  <span>正在分析...</span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <span>✨</span>
                  <span>生成复盘报告</span>
                </React.Fragment>
              )}
            </button>
          </div>
        ) : (
          <React.Fragment>
            <div className="review-summary">
              <div
                className="review-grade"
                style={{
                  color:
                    GRADE_THRESHOLDS.find((g) => g.grade === review.grade)?.color || '#9ca3af',
                  textShadow: `0 0 30px ${
                    (GRADE_THRESHOLDS.find((g) => g.grade === review.grade)?.color || '#9ca3af')}40`,
                }}
              >
                {review.grade}
              </div>
              <div className="review-score">
                <span style={{ color: getScoreColor(review.overallScore) }}>
                  {review.overallScore.toFixed(1)}
                </span>
                <span className="total"> / {review.maxOverallScore}</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                综合评分
              </div>
              {review.achievements.length > 0 && (
                <div className="review-achievements">
                  {review.achievements.map((a, i) => (
                    <span key={i} className="review-achievement">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="dimension-score-list">
              {review.scores.map((s) => {
                const dim = SCORE_DIMENSIONS.find((d) => d.id === s.dimension);
                const color = getScoreColor(s.score);
                return (
                  <div key={s.dimension} className="dimension-score-item">
                    <div className="dimension-score-header">
                      <span className="dimension-score-name">
                        {dim?.icon} {dim?.name || s.dimension}
                      </span>
                      <span className="dimension-score-value" style={{ color }}>
                        {s.score}
                        <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>
                          /{s.maxScore}
                        </span>
                      </span>
                    </div>
                    <div className="dimension-score-bar">
                      <div
                        className="dimension-score-fill"
                        style={{
                          width: `${(s.score / s.maxScore) * 100}%`,
                          background: `linear-gradient(90deg, ${color}80, ${color})`,
                        }}
                      />
                    </div>
                    <div className="dimension-score-comment">{s.comment}</div>
                    {s.highlights.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {s.highlights.map((h, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 10,
                              color: '#22c55e',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 3,
                            }}
                          >
                            ✅ {h}
                          </div>
                        ))}
                      </div>
                    )}
                    {s.suggestions.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {s.suggestions.map((h, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: 10,
                              color: '#f97316',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              marginTop: 2,
                            }}
                          >
                            💡 {h}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {review.strengths.length > 0 && (
              <div className="review-section">
                <div className="review-section-title">
                  <span style={{ color: '#22c55e' }}>💪</span> 本次飞行亮点
                </div>
                <div className="review-list">
                  {review.strengths.map((s, i) => (
                    <div key={i} className="review-list-item strength">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {review.improvements.length > 0 && (
              <div className="review-section">
                <div className="review-section-title">
                  <span style={{ color: '#f97316' }}>🎯</span> 可提升方面
                </div>
                <div className="review-list">
                  {review.improvements.map((s, i) => (
                    <div key={i} className="review-list-item improvement">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {review.tips.length > 0 && (
              <div className="review-section">
                <div className="review-section-title">
                  <span style={{ color: '#8b5cf6' }}>📝</span> 训练建议
                </div>
                <div className="review-list">
                  {review.tips.map((s, i) => (
                    <div key={i} className="review-list-item tip">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.2)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#94a3b8',
                  marginBottom: 8,
                }}
              >
                📈 与本次飞行数据对比
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}
                  >
                    最终得分
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                    {replay.adjustedScore.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}
                  >
                    获得金币
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24' }}>
                    🪙 {replay.earnedCoins}
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}
                  >
                    飞行距离
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa' }}>
                    {Math.round(replay.finalStats.distance)}m
                  </div>
                </div>
                <div>
                  <div
                    style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}
                  >
                    最高高度
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#60a5fa' }}>
                    {Math.round(replay.finalStats.maxHeight)}m
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onGenerateReview}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#94a3b8',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              🔄 重新生成评分
            </button>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};
