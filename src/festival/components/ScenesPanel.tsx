import React from 'react';
import type { FestivalScene } from '../types';

interface ScenesPanelProps {
  scenes: FestivalScene[];
  isSceneUnlocked: (sceneId: string) => boolean;
  getHighScore: (sceneId: string) => number;
  onSelectScene: (sceneId: string) => void;
  onUnlockScene: (sceneId: string) => void;
  festivalCurrency: number;
  currentSceneId: string | null;
}

export const ScenesPanel: React.FC<ScenesPanelProps> = ({
  scenes,
  isSceneUnlocked,
  getHighScore,
  onSelectScene,
  onUnlockScene,
  festivalCurrency,
  currentSceneId,
}) => {
  return (
    <div className="festival-scenes-panel">
      <div className="festival-scenes-grid">
        {scenes.map((scene) => {
          const unlocked = isSceneUnlocked(scene.id);
          const highScore = getHighScore(scene.id);
          const isCurrent = currentSceneId === scene.id;
          const canUnlock =
            !unlocked &&
            scene.unlockCost !== undefined &&
            festivalCurrency >= scene.unlockCost;

          return (
            <div
              key={scene.id}
              className={`festival-scene-card ${
                isCurrent ? 'active' : ''
              } ${unlocked ? 'unlocked' : 'locked'}`}
              style={{
                background: `linear-gradient(135deg, ${scene.backgroundGradient[0]}, ${scene.backgroundGradient[1]})`,
              }}
            >
              <div className="festival-scene-icon">{scene.icon}</div>
              <div className="festival-scene-name">{scene.name}</div>
              <div className="festival-scene-desc">{scene.description}</div>

              <div className="festival-scene-stats">
                <div className="festival-scene-stat">
                  <span>得分加成</span>
                  <strong>+{Math.round((scene.scoreMultiplier - 1) * 100)}%</strong>
                </div>
                <div className="festival-scene-stat">
                  <span>金币加成</span>
                  <strong>+{Math.round((scene.coinMultiplier - 1) * 100)}%</strong>
                </div>
              </div>

              {highScore > 0 && (
                <div className="festival-scene-highscore">
                  最高分：{highScore.toLocaleString()}
                </div>
              )}

              {unlocked ? (
                <button
                  className={`festival-scene-btn ${
                    isCurrent ? 'selected' : ''
                  }`}
                  onClick={() => onSelectScene(scene.id)}
                >
                  {isCurrent ? '✓ 已选择' : '选择场景'}
                </button>
              ) : (
                <button
                  className="festival-scene-btn unlock"
                  disabled={!canUnlock}
                  onClick={() => canUnlock && onUnlockScene(scene.id)}
                >
                  🌸 {scene.unlockCost} 解锁
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
