import React, { useState, useEffect } from 'react';
import { useTraining } from '../useTraining';
import { PhaseProgress } from './PhaseProgress';
import { LessonList } from './LessonList';
import { LessonDetail } from './LessonDetail';
import { TrainingResult } from './TrainingResult';
import type { TrainingResult as TrainingResultType } from '../types';

interface TrainingCenterProps {
  onClose: () => void;
  onStartLesson: (lessonId: string) => void;
  lastResult: { lessonId: string; score: number } | null;
  onClearResult: () => void;
}

export const TrainingCenter: React.FC<TrainingCenterProps> = ({
  onClose,
  onStartLesson,
  lastResult,
  onClearResult,
}) => {
  const training = useTraining();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentResult, setCurrentResult] = useState<TrainingResultType | null>(null);

  const selectedLesson = selectedLessonId ? training.getLesson(selectedLessonId) : null;
  const selectedProgress = selectedLessonId ? training.getLessonProgress(selectedLessonId) : null;

  const allLessons = training.getAllLessons();

  const handleSelectLesson = (lessonId: string) => {
    training.startLesson(lessonId);
    setSelectedLessonId(lessonId);
    setShowResult(false);
    setCurrentResult(null);
  };

  const handleBackToList = () => {
    training.exitLesson();
    setSelectedLessonId(null);
    setShowResult(false);
    setCurrentResult(null);
  };

  const handlePrevStep = () => {
    training.prevStep();
  };

  const handleNextStep = () => {
    if (training.isLastStep()) {
      const lesson = training.getCurrentLesson();
      if (lesson) {
        const targetScore = lesson.steps.find((s) => s.targetScore)?.targetScore || 0;
        const bestScore = training.getLessonProgress(lesson.id).bestScore;
        const score = bestScore > 0 ? bestScore : targetScore;
        const result = training.completeLesson(score);
        if (result) {
          setCurrentResult(result);
          setShowResult(true);
        }
      }
    } else {
      training.nextStep();
    }
  };

  const handleStartPractice = () => {
    if (selectedLessonId) {
      onStartLesson(selectedLessonId);
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setCurrentResult(null);
    if (selectedLessonId) {
      onStartLesson(selectedLessonId);
    }
  };

  const handleGoNext = () => {
    if (!selectedLessonId) return;
    const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      if (training.isLessonUnlocked(nextLesson.id)) {
        handleSelectLesson(nextLesson.id);
      } else {
        handleBackToList();
      }
    } else {
      handleBackToList();
    }
  };

  const handleLastResultView = () => {
    if (lastResult) {
      const lesson = training.getLesson(lastResult.lessonId);
      const progress = training.getLessonProgress(lastResult.lessonId);
      if (lesson) {
        const targetScore = lesson.steps.find((s) => s.targetScore)?.targetScore || 0;
        const passed = lastResult.score >= targetScore || lesson.type !== 'exam';
        const stars = calculateStars(lastResult.score, targetScore);
        const coinReward = progress.status === 'completed' ? 0 : lesson.coinReward * (stars >= 3 ? 1.5 : 1);

        setCurrentResult({
          lessonId: lastResult.lessonId,
          score: lastResult.score,
          passed,
          stars,
          coinReward: Math.floor(coinReward),
          completedAt: Date.now(),
        });
        training.startLesson(lastResult.lessonId);
        setSelectedLessonId(lastResult.lessonId);
        setShowResult(true);
      }
    }
  };

  const hasNextLesson = (): boolean => {
    if (!selectedLessonId) return false;
    const currentIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
    if (currentIndex < 0 || currentIndex >= allLessons.length - 1) return false;
    const nextLesson = allLessons[currentIndex + 1];
    return training.isLessonUnlocked(nextLesson.id);
  };

  useEffect(() => {
    if (lastResult && !showResult && !selectedLessonId) {
      handleLastResultView();
    }
  }, [lastResult, showResult, selectedLessonId]);

  useEffect(() => {
    if (lastResult && showResult) {
      onClearResult();
    }
  }, [lastResult, showResult, onClearResult]);

  return (
    <div className="training-overlay">
      <div className="training-content">
        <div className="training-header">
          <div className="training-title">
            <span className="training-title-icon">🎓</span>
            风筝训练营
          </div>
          <button className="training-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="training-stats-row">
          <div className="training-stat-card">
            <div className="training-stat-label">已完成课程</div>
            <div className="training-stat-value">
              {training.state.lessonsCompleted} / {allLessons.length}
            </div>
          </div>
          <div className="training-stat-card">
            <div className="training-stat-label">累计获得金币</div>
            <div className="training-stat-value gold">
              🪙 {training.state.totalCoinsEarned.toLocaleString()}
            </div>
          </div>
          <div className="training-stat-card">
            <div className="training-stat-label">当前阶段</div>
            <div className="training-stat-value">
              {training.state.lessonsCompleted === 0
                ? '准备开始'
                : training.state.lessonsCompleted >= allLessons.length
                ? '全部完成 🎉'
                : '学习中'}
            </div>
          </div>
        </div>

        <PhaseProgress
          state={training.state}
          lessons={allLessons}
          getLessonProgress={(id) => training.getLessonProgress(id)}
        />

        {showResult && currentResult && selectedLesson && (
          <TrainingResult
            result={currentResult}
            lesson={selectedLesson}
            onRetry={handleRetry}
            onBack={handleBackToList}
            onNext={handleGoNext}
            hasNextLesson={hasNextLesson()}
          />
        )}

        {!showResult && selectedLesson && selectedProgress && (
          <LessonDetail
            lesson={selectedLesson}
            progress={selectedProgress}
            currentStepIndex={training.state.currentStepIndex}
            isFirstStep={training.isFirstStep()}
            isLastStep={training.isLastStep()}
            onPrevStep={handlePrevStep}
            onNextStep={handleNextStep}
            onStartPractice={handleStartPractice}
            onBack={handleBackToList}
          />
        )}

        {!showResult && !selectedLesson && (
          <LessonList
            lessons={allLessons}
            getLessonProgress={training.getLessonProgress}
            isLessonUnlocked={training.isLessonUnlocked}
            onSelectLesson={handleSelectLesson}
          />
        )}
      </div>
    </div>
  );
};

function calculateStars(score: number, targetScore: number): number {
  if (targetScore <= 0) return 3;
  const ratio = score / targetScore;
  if (ratio >= 2) return 3;
  if (ratio >= 1.3) return 2;
  if (ratio >= 1) return 1;
  return 0;
}
