import React, { useEffect, useState } from 'react';
import type { NewlyUnlockedAchievement, NewlyUnlockedTitle } from '../journey';
import { RARITY_COLORS, RARITY_NAMES } from '../journey/types';

interface AchievementToastProps {
  achievements: NewlyUnlockedAchievement[];
  titles: NewlyUnlockedTitle[];
  onDismiss?: () => void;
}

interface ToastItem {
  id: string;
  type: 'achievement' | 'title';
  icon: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rewardCoins?: number;
  createdAt: number;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievements, titles, onDismiss }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const newToasts: ToastItem[] = [];

    achievements.forEach((a) => {
      newToasts.push({
        id: `achievement_${a.achievement.id}_${Date.now()}_${Math.random()}`,
        type: 'achievement',
        icon: a.achievement.icon,
        name: a.achievement.name,
        description: a.achievement.description,
        rarity: a.achievement.rarity,
        rewardCoins: a.rewardCoins,
        createdAt: Date.now(),
      });
    });

    titles.forEach((t) => {
      newToasts.push({
        id: `title_${t.title.id}_${Date.now()}_${Math.random()}`,
        type: 'title',
        icon: t.title.icon,
        name: t.title.name,
        description: t.title.description,
        rarity: t.title.rarity,
        createdAt: Date.now(),
      });
    });

    if (newToasts.length > 0) {
      setToasts((prev) => [...prev, ...newToasts]);
    }
  }, [achievements, titles]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => now - t.createdAt < 3500));
    }, 100);

    return () => clearInterval(interval);
  }, [toasts.length]);

  useEffect(() => {
    if (toasts.length === 0 && onDismiss) {
      const timer = setTimeout(onDismiss, 500);
      return () => clearTimeout(timer);
    }
  }, [toasts.length, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="achievement-toast-container">
      {toasts.slice(-3).map((toast, index) => {
        const rarityColor = RARITY_COLORS[toast.rarity];
        const elapsed = Date.now() - toast.createdAt;
        const progress = Math.min(1, elapsed / 300);
        const opacity = Math.min(1, (3500 - elapsed) / 500);
        const translateY = (toasts.length - 1 - index) * 100;

        return (
          <div
            key={toast.id}
            className={`achievement-toast toast-${toast.type}`}
            style={{
              '--rarity-color': rarityColor,
              transform: `translateY(${translateY}px) scale(${0.85 + progress * 0.15})`,
              opacity,
              boxShadow: `0 0 30px ${rarityColor}66, 0 0 60px ${rarityColor}33`,
            }}
          >
            <div className="toast-glow" style={{ background: `radial-gradient(circle, ${rarityColor}22 0%, transparent 70%)` }} />
            
            <div className="toast-icon-wrapper">
              <div className="toast-icon-ring" style={{ borderColor: rarityColor }} />
              <div className="toast-icon">
                {toast.icon}
              </div>
            </div>

            <div className="toast-content">
              <div className="toast-type-label" style={{ color: rarityColor }}>
                {toast.type === 'achievement' ? '🏆 成就解锁' : '👑 称号解锁'}
              </div>
              <div className="toast-name" style={{ color: rarityColor }}>
                {toast.name}
              </div>
              <div className="toast-description">
                {toast.description}
              </div>
              {toast.rewardCoins !== undefined && toast.rewardCoins > 0 && (
                <div className="toast-reward">
                  <span className="reward-icon">🪙</span>
                  <span className="reward-text">+{toast.rewardCoins}</span>
                </div>
              )}
              <div className="toast-rarity" style={{ color: rarityColor }}>
                {RARITY_NAMES[toast.rarity]}
              </div>
            </div>

            <div className="toast-particles">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="toast-particle"
                  style={{
                    '--particle-delay': `${i * 0.1}s`,
                    '--particle-angle': `${(i * 60) + 30}deg`,
                    background: rarityColor,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
