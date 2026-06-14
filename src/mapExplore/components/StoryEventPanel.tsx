import React from 'react';
import type { StoryEvent, StoryEventStatus, StoryDialogue } from '../types';
import { STORY_EVENT_TYPE_NAMES } from '../types';

interface StoryEventPanelProps {
  events: StoryEvent[];
  eventStatuses: Record<string, StoryEventStatus>;
  activeEventId: string | null;
  activeDialogueIndex: number;
  onStartEvent: (eventId: string) => void;
  onAdvanceDialogue: () => void;
}

export const StoryEventPanel: React.FC<StoryEventPanelProps> = ({
  events,
  eventStatuses,
  activeEventId,
  activeDialogueIndex,
  onStartEvent,
  onAdvanceDialogue,
}) => {
  const activeEvent = activeEventId ? events.find((e) => e.id === activeEventId) : null;
  const activeDialogue: StoryDialogue | null = activeEvent && activeDialogueIndex < activeEvent.dialogue.length
    ? activeEvent.dialogue[activeDialogueIndex]
    : null;

  return (
    <div className="me-story-event-panel">
      <div className="me-section-header">
        <div className="me-section-title">
          <span>📖</span> 剧情事件
        </div>
      </div>

      {activeDialogue && activeEvent && (
        <div className="me-story-dialogue-box">
          <div className="me-dialogue-speaker">
            {activeDialogue.speaker}
          </div>
          <div className="me-dialogue-text">
            "{activeDialogue.text}"
          </div>
          <div className="me-dialogue-progress">
            {activeDialogueIndex + 1} / {activeEvent.dialogue.length}
          </div>
          <button className="me-dialogue-advance-btn" onClick={onAdvanceDialogue}>
            {activeDialogueIndex >= activeEvent.dialogue.length - 1 ? '完成' : '继续 ▶'}
          </button>
        </div>
      )}

      <div className="me-story-event-list">
        {events.map((event) => {
          const status = eventStatuses[event.id] || 'locked';
          const isLocked = status === 'locked';
          const isAvailable = status === 'available';
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div key={event.id} className={`me-se-card ${status}`}>
              <div className="me-se-icon">
                {isLocked ? '🔒' : event.icon}
              </div>
              <div className="me-se-info">
                <div className="me-se-name">
                  {isLocked ? '???' : event.name}
                </div>
                {!isLocked && (
                  <>
                    <div className="me-se-desc">{event.description}</div>
                    <div className="me-se-type">
                      {STORY_EVENT_TYPE_NAMES[event.type]}
                    </div>
                  </>
                )}
                {isAvailable && (
                  <button className="me-se-start-btn" onClick={() => onStartEvent(event.id)}>
                    📖 开始事件
                  </button>
                )}
                {isActive && (
                  <div className="me-se-active">⏳ 进行中</div>
                )}
                {isCompleted && (
                  <div className="me-se-completed">✅ 已完成</div>
                )}
                {isLocked && (
                  <div className="me-se-locked-hint">未触发</div>
                )}
              </div>
              <div className="me-se-reward">
                🪙 {event.rewardCoins}
                <span className="me-se-reward-score"> ⭐ {event.rewardScore}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
