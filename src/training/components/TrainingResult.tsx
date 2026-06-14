import React from 'react';
import type { TrainingResult as TrainingResultType, LessonConfig } from '../types';

interface TrainingResultProps {
  result: TrainingResultType;
  lesson: LessonConfig;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
  hasNextLesson: boolean;
}

export const TrainingResult: React.FC<TrainingResultProps> = ({
  result,
  lesson,
  onRetry,
  onBack,
  onNext,
  hasNextLesson,
}) => {
  const targetScore = lesson.steps.find((s) => s.targetScore)?.targetScore || 0;

  return (
    <div className="training-result">
      <div className="result-stars">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`result-star ${n <= result.stars ? 'earned' : ''}`}
            style={{ animationDelay: `${n * 0.2}s` }}
          >
            ⭐
          </span>
        ))}
      </div>

      <div className={`result-title ${result.passed ? 'passed' : 'failed'}`}>
        {result.passed ? '🎉 考核通过！' : '😅 再接再厉'}
      </div>
      <div className="result-subtitle">
        {result.passed
          ? `恭喜完成「${lesson.title}」课程`
          : `目标分数：${targetScore.toLocaleString()}，再试一次吧！`}
      </div>

      <div className="result-score-display">
        <div className="result-score-label">最终得分</div>
        <div className="result-score-number">{result.score.toLocaleString()}</div>
        {targetScore > 0 && (
          <div className="result-target">目标: {targetScore.toLocaleString()}</div>
        )}
      </div>

      {result.coinReward > 0 && (
        <div className="result-coins-earned">
          <span className="result-coins-icon">🪙</span>
          <span className="result-coins-text">+{result.coinReward} 金币</span>
        </div>
      )}

      <div className="result-buttons">
        {result.passed && hasNextLesson ? (
          <button className="result-btn primary" onClick={onNext}>
            继续下一课程 →
          </button>
        ) : (
          <button className="result-btn primary" onClick={onRetry}>
            {result.passed ? '再次挑战' : '重新尝试'}
          </button>
        )}
        <button className="result-btn secondary" onClick={onBack}>
          返回课程列表
        </button>
      </div>
    </div>
  );
};
