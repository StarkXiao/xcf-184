import React, { useState, useEffect, useRef } from 'react';
import type { UIFlightTip } from '../game/types';

interface FlightTipsProps {
  tips: UIFlightTip[];
}

const TIP_TYPE_STYLES: Record<string, { background: string; border: string; icon: string }> = {
  info: {
    background: 'linear-gradient(135deg, #4a90d9 0%, #357abd 100%)',
    border: '#4a90d9',
    icon: 'ℹ️',
  },
  warning: {
    background: 'linear-gradient(135deg, #ff8c00 0%, #cc7000 100%)',
    border: '#ff8c00',
    icon: '⚠️',
  },
  danger: {
    background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
    border: '#ff0000',
    icon: '🚨',
  },
  success: {
    background: 'linear-gradient(135deg, #00b85c 0%, #00994d 100%)',
    border: '#00b85c',
    icon: '✅',
  },
};

export const FlightTips: React.FC<FlightTipsProps> = ({ tips }) => {
  const [displayedTips, setDisplayedTips] = useState<UIFlightTip[]>([]);
  const tipsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const now = Date.now();
    const newTips: UIFlightTip[] = [];

    tips.forEach((tip) => {
      const lastShown = tipsRef.current.get(tip.id) || 0;
      if (now - lastShown > tip.duration * 0.5) {
        tipsRef.current.set(tip.id, now);
        newTips.push(tip);
      }
    });

    if (newTips.length > 0) {
      setDisplayedTips((prev) => {
        const combined = [...prev, ...newTips];
        const unique = combined.filter(
          (tip, index, self) =>
            index === self.findIndex((t) => t.id === tip.id)
        );
        return unique.slice(-5);
      });
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setDisplayedTips((prev) =>
        prev.filter((t) => currentTime - t.timestamp < t.duration)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [tips]);

  if (displayedTips.length === 0) return null;

  return (
    <div className="flight-tips-container">
      {displayedTips.map((tip, index) => {
        const style = TIP_TYPE_STYLES[tip.type] || TIP_TYPE_STYLES.info;
        const elapsed = Date.now() - tip.timestamp;
        const progress = Math.min(1, elapsed / tip.duration);
        const opacity = 1 - progress * 0.3;
        const translateY = index * 70;

        return (
          <div
            key={tip.id}
            className={`flight-tip tip-${tip.type}`}
            style={{
              background: style.background,
              borderColor: style.border,
              opacity,
              transform: `translateY(${translateY}px)`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="tip-icon">
              {tip.icon || style.icon}
            </div>
            <div className="tip-content">
              <div className="tip-message">{tip.message}</div>
            </div>
            <div
              className="tip-progress"
              style={{
                width: `${(1 - progress) * 100}%`,
                background: style.border,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
