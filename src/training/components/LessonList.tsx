import React from 'react';
import type { LessonConfig, LessonProgress, LessonStatus } from '../types';
import { LESSON_STATUS_NAMES, PHASE_NAMES, PHASE_ICONS } from '../types';

interface LessonListProps {
  lessons: LessonConfig[];
  getLessonProgress: (id: string) => LessonProgress;
  isLessonUnlocked: (id: string) => boolean;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  getLessonProgress,
  isLessonUnlocked,
  onSelectLesson,
}) => {
  return (
    <div className="lesson-list">
      {lessons.map((lesson, index) => {
        const progress = getLessonProgress(lesson.id);
        const unlocked = isLessonUnlocked(lesson.id);
        const status: LessonStatus = unlocked ? progress.status : 'locked';

        return (
          <div
            key={lesson.id}
            className={`lesson-card ${status} ${progress.status === 'in_progress' ? 'in-progress' : ''} ${progress.status === 'completed' ? 'completed' : ''}`}
            onClick={() => unlocked && onSelectLesson(lesson.id)}
          >
            <div
              className="lesson-icon"
              style={{
                background: `linear-gradient(135deg, ${lesson.color}20, ${lesson.color}10)`,
                border: `2px solid ${lesson.color}40`,
              }}
            >
              {unlocked ? lesson.icon : '🔒'}
            </div>

            <div className="lesson-info">
              <div className="lesson-title-row">
                <span className="lesson-title" style={{ color: unlocked ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {index + 1}. {lesson.title}
                </span>
                <span
                  className={`lesson-badge status-${status}`}
                >
                  {unlocked ? LESSON_STATUS_NAMES[progress.status] : LESSON_STATUS_NAMES.locked}
                </span>
              </div>

              <div className="lesson-subtitle">{lesson.subtitle}</div>

              <div className="lesson-description">{lesson.description}</div>

              <div className="lesson-badges">
                <span className="lesson-badge" style={{ background: `${lesson.color}15`, color: lesson.color, borderColor: `${lesson.color}30` }}>
                  {PHASE_ICONS[lesson.phase]} {PHASE_NAMES[lesson.phase]}
                </span>
                {lesson.coinReward > 0 && (
                  <span className="lesson-badge gold">
                    🪙 {lesson.coinReward}
                  </span>
                )}
                {lesson.requiredScore !== undefined && progress.status !== 'completed' && (
                  <span className="lesson-badge">
                    📊 需上一关 {lesson.requiredScore}+ 分
                  </span>
                )}
                <span className="lesson-badge">
                  📝 {lesson.steps.length} 个步骤
                </span>
              </div>

              <div className="lesson-meta-row">
                {progress.bestScore > 0 ? (
                  <div className="lesson-best">
                    最佳成绩: <span>{progress.bestScore.toLocaleString()}</span>
                    {progress.attempts > 0 && ` · 尝试 ${progress.attempts} 次`}
                  </div>
                ) : (
                  <div className="lesson-best" />
                )}
                {progress.status === 'completed' && progress.completedAt && (
                  <div className="lesson-best">
                    ✅ 已完成
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
