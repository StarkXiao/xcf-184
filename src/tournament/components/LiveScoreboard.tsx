import React from 'react';
import type { LiveScore, ScoringEventType } from '../types';

interface LiveScoreboardProps {
  liveScore: LiveScore;
  currentTrackName: string;
}

const EVENT_ICONS: Record<ScoringEventType, string> = {
  distance: '📏',
  height: '🏔',
  air_current: '💨',
  shadow_bonus: '🌑',
  stability: '🎯',
  collision: '💥',
  time_bonus: '⏱',
  checkpoint: '🏁',
};

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  liveScore,
  currentTrackName,
}) => {
  const recentEvents = [...liveScore.events].reverse().slice(0, 20);

  return (
    <div className="live-scoreboard">
      <div className="live-main-score">
        <div className="live-score-label">实时积分</div>
        <div className="live-score-value">
          {liveScore.totalScore.toLocaleString()}
        </div>
        {liveScore.multiplier > 1 && (
          <div className="live-multiplier">
            ×{liveScore.multiplier.toFixed(2)} 倍率
          </div>
        )}
        {liveScore.comboCount > 0 && (
          <div className="live-combo">
            🔥 {liveScore.comboCount} 连击
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
        当前赛道：{currentTrackName}
      </div>

      <div className="live-events">
        {recentEvents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)' }}>
            等待赛事开始...
          </div>
        )}
        {recentEvents.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="live-event">
            <div className="live-event-icon">
              {EVENT_ICONS[event.type] || '📝'}
            </div>
            <div className="live-event-desc">{event.description}</div>
            <div className={`live-event-value ${event.value >= 0 ? 'positive' : 'negative'}`}>
              {event.value >= 0 ? '+' : ''}{event.value.toLocaleString()}
              {event.multiplier > 1 && (
                <span className="live-event-multiplier">×{event.multiplier.toFixed(1)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
