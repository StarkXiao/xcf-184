import React, { useState, useEffect } from 'react';
import { useFestival } from '../useFestival';
import { TasksPanel } from './TasksPanel';
import { ScenesPanel } from './ScenesPanel';
import { ItemsPanel } from './ItemsPanel';
import { Leaderboard } from './Leaderboard';
import { ExchangeShop } from './ExchangeShop';
import { FESTIVAL_STATUS_NAMES } from '../types';

type TabId = 'overview' | 'tasks' | 'scenes' | 'items' | 'leaderboard' | 'exchange';

interface FestivalCenterProps {
  onClose: () => void;
  onStartScene: (sceneId: string) => void;
  onAddCoins: (amount: number) => void;
}

export const FestivalCenter: React.FC<FestivalCenterProps> = ({
  onClose,
  onStartScene,
  onAddCoins,
}) => {
  const festival = useFestival();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const currentFestival = festival.getCurrentFestival();

  const handleStartScene = (sceneId: string) => {
    festival.selectScene(sceneId);
    onStartScene(sceneId);
  };

  const handleClaimTaskReward = (taskId: string) => {
    const result = festival.claimTaskReward(taskId);
    if (result && result.coinValue > 0) {
      onAddCoins(result.coinValue);
    }
  };

  const handlePurchaseExchange = (exchangeId: string) => {
    const result = festival.purchaseExchange(exchangeId);
    if (result && result.coinValue > 0) {
      onAddCoins(result.coinValue);
    }
  };

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: '总览', icon: '🏠' },
    { id: 'tasks', label: '任务', icon: '📋' },
    { id: 'scenes', label: '场景', icon: '🗺️' },
    { id: 'items', label: '道具', icon: '🎒' },
    { id: 'leaderboard', label: '排行榜', icon: '🏆' },
    { id: 'exchange', label: '兑换', icon: '🛒' },
  ];

  if (!currentFestival) {
    return (
      <div className="festival-overlay">
        <div className="festival-content">
          <div className="festival-header">
            <div className="festival-title">
              <span className="festival-title-icon">🎉</span>
              节日活动
            </div>
            <button className="festival-close" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="festival-empty">
            <div className="festival-empty-icon">🎪</div>
            <div className="festival-empty-title">暂无活动</div>
            <div className="festival-empty-desc">
              敬请期待即将到来的节日活动！
            </div>
          </div>
        </div>
      </div>
    );
  }

  const festivalTasks = festival.getTasksForFestival(currentFestival.id);
  const festivalScenes = festival.getScenesForFestival(currentFestival.id);
  const festivalItems = festival.getItemsForFestival(currentFestival.id);
  const festivalExchanges = festival.getExchangesForFestival(currentFestival.id);

  const completedTasks = festivalTasks.filter(
    (t) =>
      festival.getTaskStatus(t.id) === 'completed' ||
      festival.getTaskStatus(t.id) === 'claimed'
  ).length;

  const remainingTime = Math.max(0, currentFestival.endDate - now);
  const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor(
    (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  return (
    <div className="festival-overlay">
      <div
        className="festival-content"
        style={{
          borderColor: currentFestival.primaryColor,
        }}
      >
        <div
          className="festival-banner"
          style={{
            background: `linear-gradient(135deg, ${currentFestival.primaryColor}, ${currentFestival.secondaryColor})`,
          }}
        >
          <div className="festival-banner-left">
            <span className="festival-banner-icon">{currentFestival.icon}</span>
            <div>
              <div className="festival-banner-name">{currentFestival.name}</div>
              <div className="festival-banner-desc">
                {currentFestival.description}
              </div>
            </div>
          </div>
          <div className="festival-banner-right">
            <div
              className="festival-status"
              style={{
                background:
                  festival.state.status === 'active'
                    ? 'rgba(34, 197, 94, 0.8)'
                    : festival.state.status === 'upcoming'
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(107, 114, 128, 0.8)',
              }}
            >
              {FESTIVAL_STATUS_NAMES[festival.state.status]}
            </div>
            {festival.state.status === 'active' && (
              <div className="festival-countdown">
                剩余：{remainingDays}天 {remainingHours}小时
              </div>
            )}
            <button className="festival-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="festival-stats-bar">
          <div className="festival-stat">
            <span className="festival-stat-icon">🌸</span>
            <div>
              <div className="festival-stat-value">
                {festival.progress.festivalCurrency}
              </div>
              <div className="festival-stat-label">樱花花瓣</div>
            </div>
          </div>
          <div className="festival-stat">
            <span className="festival-stat-icon">📊</span>
            <div>
              <div className="festival-stat-value">
                {festival.progress.totalScore.toLocaleString()}
              </div>
              <div className="festival-stat-label">活动总分</div>
            </div>
          </div>
          <div className="festival-stat">
            <span className="festival-stat-icon">✅</span>
            <div>
              <div className="festival-stat-value">
                {completedTasks}/{festivalTasks.length}
              </div>
              <div className="festival-stat-label">完成任务</div>
            </div>
          </div>
          <div className="festival-stat">
            <span className="festival-stat-icon">🏅</span>
            <div>
              <div className="festival-stat-value">
                #{festival.getPlayerRank()}
              </div>
              <div className="festival-stat-label">当前排名</div>
            </div>
          </div>
        </div>

        <div className="festival-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`festival-tab ${activeTab === tab.id ? 'active' : ''}`}
              style={
                activeTab === tab.id
                  ? { borderColor: currentFestival.primaryColor }
                  : undefined
              }
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="festival-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="festival-tab-content">
          {activeTab === 'overview' && (
            <div className="festival-overview">
              <div className="festival-overview-section">
                <div className="festival-overview-title">🎯 活动进度</div>
                <div className="festival-progress-overview">
                  {festivalTasks.slice(0, 4).map((task) => {
                    const progress = festival.getTaskProgress(task.id);
                    const percent = Math.min(
                      100,
                      (progress / task.target) * 100
                    );
                    return (
                      <div key={task.id} className="festival-progress-item">
                        <div className="festival-progress-name">
                          {task.title}
                        </div>
                        <div className="festival-progress-bar-mini">
                          <div
                            className="festival-progress-fill-mini"
                            style={{
                              width: `${percent}%`,
                              background: currentFestival.primaryColor,
                            }}
                          />
                        </div>
                        <div className="festival-progress-text-mini">
                          {progress}/{task.target}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="festival-overview-section">
                <div className="festival-overview-title">🗺️ 节日场景</div>
                <div className="festival-scenes-preview">
                  {festivalScenes.map((scene) => {
                    const unlocked = festival.isSceneUnlocked(scene.id);
                    return (
                      <div
                        key={scene.id}
                        className={`festival-scene-preview ${
                          unlocked ? 'unlocked' : 'locked'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${scene.backgroundGradient[0]}, ${scene.backgroundGradient[1]})`,
                        }}
                        onClick={() => unlocked && setActiveTab('scenes')}
                      >
                        <span className="festival-scene-preview-icon">
                          {scene.icon}
                        </span>
                        <span className="festival-scene-preview-name">
                          {scene.name}
                        </span>
                        {!unlocked && (
                          <span className="festival-scene-preview-lock">
                            🔒
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {festival.activeBuffs.length > 0 && (
                <div className="festival-overview-section">
                  <div className="festival-overview-title">
                    ⚡ 当前生效增益
                  </div>
                  <div className="festival-active-buffs">
                    {festival.activeBuffs.map((buff, idx) => {
                      const item = festival.getItem(buff.itemId);
                      return (
                        <div key={idx} className="festival-buff-tag">
                          {item?.icon} {item?.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <TasksPanel
              tasks={festivalTasks}
              getTaskProgress={festival.getTaskProgress}
              getTaskStatus={festival.getTaskStatus}
              onClaimReward={handleClaimTaskReward}
            />
          )}

          {activeTab === 'scenes' && (
            <ScenesPanel
              scenes={festivalScenes}
              isSceneUnlocked={festival.isSceneUnlocked}
              getHighScore={festival.getHighScore}
              onSelectScene={handleStartScene}
              onUnlockScene={festival.unlockScene}
              festivalCurrency={festival.progress.festivalCurrency}
              currentSceneId={festival.state.currentSceneId}
            />
          )}

          {activeTab === 'items' && (
            <ItemsPanel
              items={festivalItems}
              inventory={festival.inventory}
              getItemQuantity={festival.getItemQuantity}
              onUseItem={festival.useItem}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard rankings={festival.leaderboard} />
          )}

          {activeTab === 'exchange' && (
            <ExchangeShop
              exchanges={festivalExchanges}
              festivalCurrency={festival.progress.festivalCurrency}
              canPurchaseExchange={festival.canPurchaseExchange}
              onPurchase={handlePurchaseExchange}
              getPurchaseCount={festival.getExchangePurchaseCount}
            />
          )}
        </div>
      </div>
    </div>
  );
};
