import React from 'react';
import type { RankingEntry } from '../types';
import { RANK_TIER_COLORS, DIVISION_NAMES } from '../types';

interface RankingBoardProps {
  rankings: RankingEntry[];
  playerEntry: RankingEntry | undefined;
}

const DivisionColors: Record<string, string> = {
  novice: '#4ecdc4',
  intermediate: '#3b82f6',
  advanced: '#ff6b6b',
  master: '#ffd700',
};

export const RankingBoard: React.FC<RankingBoardProps> = ({
  rankings,
  playerEntry,
}) => {
  return (
    <div className="ranking-board">
      {playerEntry && (
        <div className="ranking-player-summary">
          <div className="ranking-player-avatar">
            {playerEntry.playerName.charAt(0)}
          </div>
          <div className="ranking-player-info">
            <div className="ranking-player-name">{playerEntry.playerName}</div>
            <div
              className="ranking-player-division"
              style={{ color: DivisionColors[playerEntry.division] || '#fff' }}
            >
              {DIVISION_NAMES[playerEntry.division]}
            </div>
          </div>
          <div className="ranking-player-rank">
            <div className="ranking-player-rank-number">#{playerEntry.rank}</div>
            <div className="ranking-player-rank-label">排名</div>
          </div>
        </div>
      )}

      <div className="ranking-list">
        {rankings.map((entry) => {
          const rankClass =
            entry.rank === 1 ? 'top1' : entry.rank === 2 ? 'top2' : entry.rank === 3 ? 'top3' : '';
          const tierColor = RANK_TIER_COLORS[entry.rankTier];

          return (
            <div key={entry.entryId} className={`ranking-entry ${entry.isPlayer ? 'player' : ''}`}>
              <div className={`ranking-entry-rank ${rankClass}`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
              </div>
              <div className="ranking-entry-name">
                {entry.isPlayer ? '⭐ ' : ''}
                {entry.playerName}
              </div>
              <div
                className="ranking-entry-division"
                style={{
                  color: DivisionColors[entry.division] || '#fff',
                  background: `${DivisionColors[entry.division] || '#fff'}20`,
                }}
              >
                {DIVISION_NAMES[entry.division]}
              </div>
              <div className="ranking-entry-score">
                {entry.score.toLocaleString()}
              </div>
              <div
                className="ranking-entry-tier"
                style={{ borderColor: tierColor, color: tierColor }}
              >
                {entry.rankTier}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
