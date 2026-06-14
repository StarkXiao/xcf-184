import React from 'react';
import type { TrackConfig, TrackResult } from '../types';
import { DIFFICULTY_NAMES } from '../types';

interface TrackSelectionProps {
  tracks: TrackConfig[];
  isTrackUnlocked: (id: string) => boolean;
  getTrackResult: (id: string) => TrackResult | undefined;
  onSelectTrack: (trackId: string) => void;
  onStartTrack: (trackId: string) => void;
  selectedTrackId: string | null;
}

export const TrackSelection: React.FC<TrackSelectionProps> = ({
  tracks,
  isTrackUnlocked,
  getTrackResult,
  onSelectTrack,
  onStartTrack,
  selectedTrackId,
}) => {
  return (
    <div className="track-selection">
      <div className="track-grid">
        {tracks.map((track) => {
          const unlocked = isTrackUnlocked(track.id);
          const result = getTrackResult(track.id);
          const isSelected = selectedTrackId === track.id;

          return (
            <div
              key={track.id}
              className={`track-card ${!unlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => unlocked && onSelectTrack(track.id)}
            >
              <span className={`track-difficulty-badge ${track.difficulty}`}>
                {DIFFICULTY_NAMES[track.difficulty]}
              </span>

              <div className="track-name">
                {track.name}
                {!unlocked && ' 🔒'}
              </div>

              <div className="track-description">{track.description}</div>

              <div className="track-rules">
                {track.rules.map((rule) => (
                  <div key={rule.id} className="track-rule">
                    <span className="track-rule-icon">⚡</span>
                    <span>{rule.label} - {rule.description}</span>
                  </div>
                ))}
              </div>

              <div className="track-meta">
                <div className="track-target">
                  目标 <span>{track.targetScore.toLocaleString()}</span> 分
                </div>
                <div className="track-reward">
                  🪙 {track.coinReward}
                </div>
              </div>

              {result && (
                <div className="track-best">
                  最佳 <span>{result.bestScore.toLocaleString()}</span> 分
                  {' · '}
                  {result.attempts} 次尝试
                  {result.mastered && ' · ⭐ 已精通'}
                </div>
              )}

              {unlocked && isSelected && (
                <button
                  className="track-start-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTrack(track.id);
                  }}
                >
                  开始挑战
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
