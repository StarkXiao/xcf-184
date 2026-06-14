import React from 'react';
import type { Achievement } from '../types';
import { RARITY_COLORS, RARITY_BG_COLORS, RARITY_NAMES } from '../types';

interface AchievementsPanelProps {
  achievements: Achievement[];
  compact?: boolean;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ achievements }) => {
  const formatProgress = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return Math.floor(value).toString();
  };

  return (
    <div className="achievement-grid">
      {achievements.map((achievement) => {
        const rarityColor = RARITY_COLORS[achievement.rarity];
        const rarityBg = RARITY_BG_COLORS[achievement.rarity];
        const progressPct =
          achievement.maxProgress > 0
            ? Math.min((achievement.progress / achievement.maxProgress) * 100, 100)
            : 0;

        return (
          <div
            key={achievement.id}
            className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}
            style={
              {
                '--rarity-color': rarityColor,
                '--rarity-bg': rarityBg,
                '--rarity-color-transparent': `${rarityColor}33`,
              } as React.CSSProperties
            }
          >
            {achievement.unlocked && <div className="achievement-unlocked-badge" />}

            <div className="achievement-reward">🪙 {achievement.rewardCoins}</div>

            <div className="achievement-header">
              <div className={`achievement-icon ${achievement.unlocked ? 'unlocked' : ''}`}>
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              <div className="achievement-info">
                <div className="achievement-name">{achievement.name}</div>
                <span className="achievement-rarity"
                  style={
                    {
                      '--rarity-color': rarityColor,
                      '--rarity-color-transparent': `${rarityColor}33`,
                    } as React.CSSProperties
                  }
                >
                  {RARITY_NAMES[achievement.rarity]}
                </span>
              </div>
            </div>

            <div className="achievement-description">{achievement.description}</div>

            {!achievement.unlocked && (
              <>
                <div className="achievement-progress">
                  <div
                    className="achievement-progress-fill"
                    style={{
                      width: `${progressPct}%`,
                      background: rarityColor,
                    }}
                  />
                </div>
                <div className="achievement-progress-text">
                  <span>{formatProgress(achievement.progress)}</span>
                  <span>{formatProgress(achievement.maxProgress)}</span>
                </div>
              </>
            )}

            {achievement.unlocked && achievement.unlockedAt && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'rgba(52, 211, 153, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>✅</span>
                解锁于 {new Date(achievement.unlockedAt).toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
