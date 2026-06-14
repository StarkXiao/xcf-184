import React, { useState } from 'react';
import { useJourney } from '../useJourney';
import { ProfileCard } from './ProfileCard';
import { FlightRecords } from './FlightRecords';
import { AchievementsPanel } from './AchievementsPanel';
import { BestTrajectories } from './BestTrajectories';
import { AnomalyEvents } from './AnomalyEvents';
import { GrowthCurve } from './GrowthCurve';
import type { NewlyUnlockedAchievement } from '../journeyEngine';

type TabType = 'overview' | 'flights' | 'achievements' | 'trajectories' | 'anomalies' | 'growth';

const TABS: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'overview', label: '总览', icon: '📊' },
  { id: 'flights', label: '飞行记录', icon: '✈️' },
  { id: 'achievements', label: '成就勋章', icon: '🏅' },
  { id: 'trajectories', label: '最佳轨迹', icon: '🏆' },
  { id: 'anomalies', label: '异常事件', icon: '⚠️' },
  { id: 'growth', label: '成长曲线', icon: '📈' },
];

interface JourneyCenterProps {
  onClose: () => void;
  newAchievements?: NewlyUnlockedAchievement[];
}

export const JourneyCenter: React.FC<JourneyCenterProps> = ({ onClose, newAchievements = [] }) => {
  const journey = useJourney();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(journey.state.profile.name);
  const [toastAchievement, setToastAchievement] = useState<NewlyUnlockedAchievement | null>(
    newAchievements.length > 0 ? newAchievements[0] : null
  );

  React.useEffect(() => {
    if (newAchievements.length > 0) {
      let index = 0;
      const showNext = () => {
        if (index < newAchievements.length) {
          setToastAchievement(newAchievements[index]);
          index++;
          setTimeout(() => {
            setToastAchievement(null);
            setTimeout(showNext, 400);
          }, 2600);
        }
      };
      showNext();
    }
  }, [newAchievements]);

  const handleStartEditName = () => {
    setTempName(journey.state.profile.name);
    setEditingName(true);
  };

  const handleConfirmEditName = () => {
    if (tempName.trim().length > 0) {
      journey.setPilotName(tempName.trim());
    }
    setEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditingName(false);
  };

  const achievementProgress = journey.getAchievementProgress();

  return (
    <div className="journey-overlay">
      <div className="journey-content">
        <div className="journey-header">
          <div className="journey-title">
            <span className="journey-title-icon">🗂️</span>
            飞行员旅程档案
          </div>
          <button className="journey-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="journey-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`journey-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <ProfileCard
              profile={journey.state.profile}
              onEditName={handleStartEditName}
              totalAchievements={achievementProgress.total}
              unlockedAchievements={achievementProgress.unlocked}
              bestTrajectories={journey.state.bestTrajectories}
            />
            <div className="section-header" style={{ marginTop: 28 }}>
              <div className="section-title">
                <span>🏅</span>
                成就进度
              </div>
              <div className="section-subtitle">
                {achievementProgress.unlocked} / {achievementProgress.total} 解锁
              </div>
            </div>
            <div className="achievement-progress-bar">
              <div
                className="achievement-progress-fill"
                style={{ width: `${achievementProgress.percentage}%` }}
              />
            </div>
            <AchievementsPanel
              achievements={journey.state.achievements.slice(0, 6)}
              compact
            />
            {journey.state.bestTrajectories.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="section-header">
                  <div className="section-title">
                    <span>🏆</span>
                    最佳纪录
                  </div>
                </div>
                <BestTrajectories trajectories={journey.state.bestTrajectories} compact />
              </div>
            )}
          </div>
        )}

        {activeTab === 'flights' && (
          <FlightRecords records={journey.state.flightRecords} />
        )}

        {activeTab === 'achievements' && (
          <AchievementsPanel achievements={journey.state.achievements} />
        )}

        {activeTab === 'trajectories' && (
          <BestTrajectories trajectories={journey.state.bestTrajectories} />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyEvents anomalies={journey.state.anomalies} />
        )}

        {activeTab === 'growth' && (
          <GrowthCurve history={journey.state.growthHistory} />
        )}

        {editingName && (
          <div className="name-edit-modal" onClick={handleCancelEditName}>
            <div className="name-edit-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="name-edit-title">修改飞行员名称</div>
              <div className="name-edit-desc">请输入 1-20 个字符的新名称</div>
              <input
                className="name-edit-input"
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmEditName();
                  if (e.key === 'Escape') handleCancelEditName();
                }}
              />
              <div className="name-edit-buttons">
                <button className="name-edit-btn cancel" onClick={handleCancelEditName}>
                  取消
                </button>
                <button className="name-edit-btn confirm" onClick={handleConfirmEditName}>
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toastAchievement && (
        <div className="new-achievement-toast">
          <div className="new-achievement-toast-icon">{toastAchievement.achievement.icon}</div>
          <div className="new-achievement-toast-text">
            <div className="new-achievement-toast-label">🎉 成就解锁！</div>
            <div className="new-achievement-toast-name">{toastAchievement.achievement.name}</div>
            <div className="new-achievement-toast-reward">🪙 +{toastAchievement.rewardCoins} 金币</div>
          </div>
        </div>
      )}
    </div>
  );
};
