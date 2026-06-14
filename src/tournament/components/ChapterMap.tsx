import React from 'react';
import type { ChapterConfig, ChapterProgress } from '../types';
import { CHAPTER_STATUS_NAMES } from '../types';

interface ChapterMapProps {
  chapters: ChapterConfig[];
  getChapterProgress: (id: string) => ChapterProgress;
  isChapterUnlocked: (id: string) => boolean;
  isTrackUnlocked: (id: string) => boolean;
  getTrackBestScore: (id: string) => number | undefined;
  getTrackMastered: (id: string) => boolean;
  getTrackCompleted: (id: string) => boolean;
  onSelectChapter: (chapterId: string) => void;
}

export const ChapterMap: React.FC<ChapterMapProps> = ({
  chapters,
  getChapterProgress,
  isChapterUnlocked,
  isTrackUnlocked,
  getTrackBestScore,
  getTrackMastered,
  getTrackCompleted,
  onSelectChapter,
}) => {
  return (
    <div className="chapter-map">
      <div className="chapter-path">
        {chapters.map((chapter, index) => {
          const progress = getChapterProgress(chapter.id);
          const unlocked = isChapterUnlocked(chapter.id);
          const status = unlocked ? progress.status : 'locked';
          const totalTracks = chapter.trackIds.length;
          const completedCount = chapter.trackIds.filter((id) => getTrackCompleted(id)).length;
          const masteredCount = chapter.trackIds.filter((id) => getTrackMastered(id)).length;
          const progressPercent = totalTracks > 0 ? (completedCount / totalTracks) * 100 : 0;

          return (
            <React.Fragment key={chapter.id}>
              <div className={`chapter-card ${status}`}>
                <div className="chapter-header">
                  <div className="chapter-icon">{chapter.icon}</div>
                  <div className="chapter-info">
                    <div className="chapter-name">
                      {chapter.name}
                      {!unlocked && ' 🔒'}
                    </div>
                    <span className={`chapter-status-badge ${status}`}>
                      {CHAPTER_STATUS_NAMES[status]}
                    </span>
                  </div>
                </div>

                <div className="chapter-description">{chapter.description}</div>

                <div className="chapter-tracks">
                  {chapter.trackIds.map((trackId) => {
                    const completed = getTrackCompleted(trackId);
                    const mastered = getTrackMastered(trackId);
                    const bestScore = getTrackBestScore(trackId);
                    const trackUnlocked = isTrackUnlocked(trackId);

                    return (
                      <div
                        key={trackId}
                        className={`chapter-track-badge ${mastered ? 'mastered' : completed ? 'completed' : ''}`}
                      >
                        {mastered ? '⭐' : completed ? '✅' : trackUnlocked ? '🏁' : '🔒'}
                        {bestScore != null ? bestScore.toLocaleString() : '---'}
                      </div>
                    );
                  })}
                </div>

                <div className="chapter-progress-bar">
                  <div
                    className="chapter-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {unlocked && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {completedCount}/{totalTracks} 完成 · {masteredCount} 精通
                  </div>
                )}

                {unlocked && status !== 'completed' && (
                  <button
                    className="track-start-btn"
                    style={{ marginTop: '12px' }}
                    onClick={() => onSelectChapter(chapter.id)}
                  >
                    进入章节
                  </button>
                )}
              </div>

              {index < chapters.length - 1 && (
                <div className="chapter-connector">
                  <div
                    className={`chapter-connector-line ${status === 'completed' || status === 'mastered' ? 'active' : ''}`}
                  />
                  <div className="chapter-connector-arrow">▼</div>
                  <div className="chapter-connector-line" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
