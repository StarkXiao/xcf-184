import React from 'react';
import type { FestivalLeaderboardEntry } from '../types';

interface LeaderboardProps {
  rankings: FestivalLeaderboardEntry[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ rankings }) => {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' };
    if (rank === 2) return { icon: '🥈', color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.15)' };
    if (rank === 3) return { icon: '🥉', color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.15)' };
    return { icon: `#${rank}`, color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' };
  };

  return (
    <div className="festival-leaderboard">
      <div className="festival-leaderboard-header">
        <span>排名</span>
        <span>玩家</span>
        <span>完成任务</span>
        <span>徽章</span>
        <span>总分数</span>
      </div>
      <div className="festival-leaderboard-list">
        {rankings.slice(0, 50).map((entry) => {
          const style = getRankStyle(entry.rank);
          return (
            <div
              key={entry.playerId}
              className={`festival-leaderboard-row ${
                entry.isPlayer ? 'player' : ''
              }`}
              style={{ background: entry.isPlayer ? 'rgba(236, 72, 153, 0.1)' : style.bg }}
            >
              <div
                className="festival-leaderboard-rank"
                style={{ color: style.color }}
              >
                {style.icon}
              </div>
              <div className="festival-leaderboard-name">
                {entry.playerName}
                {entry.isPlayer && (
                  <span className="festival-leaderboard-you">(你)</span>
                )}
              </div>
              <div className="festival-leaderboard-stat">
                {entry.completedTasks}
              </div>
              <div className="festival-leaderboard-stat">
                {entry.badgeCount}
              </div>
              <div className="festival-leaderboard-score">
                {entry.score.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
