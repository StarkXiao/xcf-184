import React from 'react';
import type { LessonConfig, LessonStep, LessonProgress } from '../types';

interface LessonDetailProps {
  lesson: LessonConfig;
  progress: LessonProgress;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onStartPractice: () => void;
  onBack: () => void;
}

const STEP_TYPE_LABELS: Record<LessonStep['type'], string> = {
  tutorial: '教程',
  interactive: '互动练习',
  quiz: '考核',
  challenge: '挑战',
};

export const LessonDetail: React.FC<LessonDetailProps> = ({
  lesson,
  progress,
  currentStepIndex,
  isFirstStep,
  isLastStep,
  onPrevStep,
  onNextStep,
  onStartPractice,
  onBack,
}) => {
  const currentStep = lesson.steps[currentStepIndex];
  const isPracticeStep = currentStep?.type === 'interactive' || currentStep?.type === 'challenge' || currentStep?.type === 'quiz';

  return (
    <div className="lesson-detail">
      <button className="back-btn" onClick={onBack}>
        ← 返回课程列表
      </button>

      <div className="lesson-detail-header">
        <div className="lesson-detail-title-row">
          <div
            className="lesson-detail-icon"
            style={{
              background: `linear-gradient(135deg, ${lesson.color}25, ${lesson.color}10)`,
              border: `2px solid ${lesson.color}50`,
            }}
          >
            {lesson.icon}
          </div>
          <div>
            <div className="lesson-detail-title">{lesson.title}</div>
            <div className="lesson-detail-subtitle">{lesson.subtitle}</div>
          </div>
        </div>
        <div className="lesson-detail-description">{lesson.description}</div>
      </div>

      <div className="step-progress">
        {lesson.steps.map((step, index) => (
          <div
            key={step.id}
            className={`step-dot ${
              index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'current' : ''
            }`}
          />
        ))}
      </div>

      {currentStep && (
        <div className="step-content" style={{ borderColor: `${lesson.color}20` }}>
          <div className="step-title">
            <span>第 {currentStepIndex + 1} 步：{currentStep.title}</span>
            <span className="step-type-tag" style={{ background: `${lesson.color}20`, color: lesson.color }}>
              {STEP_TYPE_LABELS[currentStep.type]}
            </span>
          </div>

          <div className="step-description">{currentStep.description}</div>

          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="step-tips">
              <div className="step-tips-title">💡 专业提示</div>
              <ul className="step-tips-list">
                {currentStep.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {isPracticeStep && (currentStep.targetScore || currentStep.duration) && (
            <div className="step-challenge-info">
              {currentStep.targetScore && (
                <div className="challenge-info-item">
                  <div className="challenge-info-label">目标分数</div>
                  <div className="challenge-info-value">{currentStep.targetScore.toLocaleString()}</div>
                </div>
              )}
              {currentStep.duration && (
                <div className="challenge-info-item">
                  <div className="challenge-info-label">时间限制</div>
                  <div className="challenge-info-value">{currentStep.duration}s</div>
                </div>
              )}
              {progress.bestScore > 0 && (
                <div className="challenge-info-item">
                  <div className="challenge-info-label">最佳成绩</div>
                  <div className="challenge-info-value">{progress.bestScore.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="step-nav-buttons">
        <button
          className="step-nav-btn secondary"
          onClick={onPrevStep}
          disabled={isFirstStep}
        >
          ← 上一步
        </button>

        {isPracticeStep ? (
          <button
            className="step-nav-btn warning"
            onClick={onStartPractice}
          >
            🎮 开始练习
          </button>
        ) : isLastStep ? (
          <button
            className="step-nav-btn success"
            onClick={onNextStep}
          >
            完成课程 ✓
          </button>
        ) : (
          <button
            className="step-nav-btn primary"
            onClick={onNextStep}
          >
            下一步 →
          </button>
        )}
      </div>
    </div>
  );
};
