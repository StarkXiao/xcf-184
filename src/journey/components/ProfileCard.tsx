import React from 'react';
import type { PilotProfile, BestTrajectory } from '../types';

interface ProfileCardProps {
  profile: PilotProfile;
  onEditName: () => void;
  totalAchievements: number;
  unlockedAchievements: number;
  bestTrajectories: BestTrajectory[];
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onEditName,
  totalAchievements,
  unlockedAchievements,
  bestTrajectories,
}) => {
  const expPercentage =
    profile.experienceToNext > 0
      ? (profile.experience / profile.experienceToNext) * 100
      : 0;

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}小时${mins}分`;
    }
    return `${mins}分钟`;
  };

  const formatDistance = (distance: number): string => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(1)} km`;
    }
    return `${Math.floor(distance)} m`;
  };

  const bestDistance = bestTrajectories.find((b) => b.type === 'distance')?.value || 0;
  const bestScore = bestTrajectories.find((b) => b.type === 'score')?.value || 0;
  const bestHeight = bestTrajectories.find((b) => b.type === 'height')?.value || 0;

  return (
    <div className="profile-section">
      <div className="profile-card">
        <div className="profile-avatar">
          🪁
          <div className="profile-level-badge">{profile.level}</div>
        </div>
        <div className="profile-name">{profile.name}</div>
        <div className="profile-title">{profile.title}</div>

        <div className="profile-exp-bar">
          <div className="profile-exp-fill" style={{ width: `${expPercentage}%` }} />
        </div>
        <div className="profile-exp-text">
          经验值: {profile.experience} / {profile.experienceToNext}
        </div>

        <button className="profile-edit-btn" onClick={onEditName}>
          ✏️ 修改名称
        </button>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">✈️</div>
          <div className="stat-label">总飞行次数</div>
          <div className="stat-value accent">{profile.totalFlights}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-label">累计飞行时间</div>
          <div className="stat-value cyan">{formatTime(profile.totalFlightTime)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛤️</div>
          <div className="stat-label">累计飞行距离</div>
          <div className="stat-value">{formatDistance(profile.totalDistance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-label">累计总得分</div>
          <div className="stat-value accent">
            {profile.totalScore.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌬️</div>
          <div className="stat-label">捕获气流</div>
          <div className="stat-value green">{profile.totalAirCurrents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💥</div>
          <div className="stat-label">碰撞总数</div>
          <div className="stat-value red">{profile.totalCollisions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✨</div>
          <div className="stat-label">完美飞行</div>
          <div className="stat-value green">{profile.perfectFlights}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏅</div>
          <div className="stat-label">成就解锁</div>
          <div className="stat-value gold">
            {unlockedAchievements} / {totalAchievements}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-label">最远距离</div>
          <div className="stat-value">{formatDistance(bestDistance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">最高得分</div>
          <div className="stat-value accent">{Math.floor(bestScore).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏔️</div>
          <div className="stat-label">最高高度</div>
          <div className="stat-value cyan">{Math.floor(bestHeight)} m</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-label">当前连胜</div>
          <div className="stat-value gold">
            {profile.currentStreak}
            {profile.bestStreak > 0 && (
              <span style={{ fontSize: 12, opacity: 0.6, marginLeft: 4 }}>
                / 最佳 {profile.bestStreak}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
