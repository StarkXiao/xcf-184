import React, { useState, useEffect, useRef } from 'react';
import type { Announcement } from '../types';

interface SceneAnnouncerProps {
  announcements: Announcement[];
}

export const SceneAnnouncer: React.FC<SceneAnnouncerProps> = ({ announcements }) => {
  const [, setTick] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      setTick(t => t + 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (announcements.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [announcements.length]);

  const visibleAnnouncements = announcements
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  const getAnnouncementStyle = (type: string): React.CSSProperties => {
    switch (type) {
      case 'stage_start':
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderColor: '#a78bfa',
        };
      case 'stage_complete':
        return {
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderColor: '#f9a8d4',
        };
      case 'task_complete':
        return {
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderColor: '#7dd3fc',
        };
      case 'bonus':
        return {
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          borderColor: '#fcd34d',
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #c0392b 100%)',
          borderColor: '#fca5a5',
        };
      default:
        return {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderColor: '#a78bfa',
        };
    }
  };

  const getIcon = (type: string): string => {
    switch (type) {
      case 'stage_start': return '🎮';
      case 'stage_complete': return '🏆';
      case 'task_complete': return '✅';
      case 'bonus': return '⭐';
      case 'warning': return '⚠️';
      default: return '📢';
    }
  };

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="scene-announcer">
      {visibleAnnouncements.map((announcement, index) => {
        const elapsed = Date.now() - announcement.startTime;
        const progress = Math.min(1, elapsed / announcement.duration);
        const opacity = progress < 0.1
          ? progress / 0.1
          : progress > 0.8
            ? (1 - progress) / 0.2
            : 1;

        return (
          <div
            key={announcement.id}
            className={`announcement-card ${announcement.type}`}
            style={{
              ...getAnnouncementStyle(announcement.type),
              opacity,
              transform: `translateY(${index * 10}px)`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            <div className="announcement-icon">{getIcon(announcement.type)}</div>
            <div className="announcement-content">
              <div className="announcement-title">{announcement.title}</div>
              <div className="announcement-text">{announcement.content}</div>
            </div>
            <div className="announcement-progress">
              <div
                className="announcement-progress-fill"
                style={{ width: `${(1 - progress) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
