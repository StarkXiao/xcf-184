import React from 'react';
import type { TrainingState, LessonConfig } from '../types';
import { PHASE_NAMES, PHASE_ICONS } from '../types';

interface PhaseProgressProps {
  state: TrainingState;
  lessons: LessonConfig[];
  getLessonProgress: (id: string) => { status: string };
}

const ALL_PHASES: Array<TrainingState['phase']> = [
  'intro',
  'basic_controls',
  'airflow_recognition',
  'risk_demo',
  'segment_exam',
  'reward',
];

export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  state,
  lessons,
  getLessonProgress,
}) => {
  const phaseLessonMap = ALL_PHASES.map((phase) => ({
    phase,
    lessons: lessons.filter((l) => l.phase === phase),
  }));

  const getPhaseStatus = (phase: TrainingState['phase']) => {
    const phaseLessons = lessons.filter((l) => l.phase === phase);
    if (phaseLessons.length === 0) return 'locked';

    const allCompleted = phaseLessons.every(
      (l) => getLessonProgress(l.id).status === 'completed'
    );
    const anyInProgress = phaseLessons.some(
      (l) => getLessonProgress(l.id).status === 'in_progress'
    );
    const anyUnlocked = phaseLessons.some(
      (l) => getLessonProgress(l.id).status !== 'locked'
    );

    if (allCompleted) return 'completed';
    if (anyInProgress || state.phase === phase) return 'current';
    if (anyUnlocked) return 'current';
    return 'locked';
  };

  const completedPhases = phaseLessonMap.filter(
    ({ phase }) => getPhaseStatus(phase) === 'completed'
  ).length;
  const progressPercent = (completedPhases / ALL_PHASES.length) * 100;

  return (
    <div className="phase-progress">
      <div className="phase-progress-bar">
        <div
          className="phase-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="phase-steps">
        {ALL_PHASES.map((phase) => {
          const status = getPhaseStatus(phase);
          return (
            <div key={phase} className={`phase-step ${status}`}>
              <div className="phase-step-icon">
                {status === 'completed' ? '✓' : PHASE_ICONS[phase]}
              </div>
              <div className="phase-step-label">{PHASE_NAMES[phase]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
