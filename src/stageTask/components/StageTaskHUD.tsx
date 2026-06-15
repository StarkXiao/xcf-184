import React, { useState, useEffect, useRef } from 'react';
import type { Stage, StageTask, StageProgress } from '../types';
import { DIFFICULTY_COLORS } from '../types';

interface StageTaskHUDProps {
  currentStage: Stage | null;
  progress: StageProgress;
  tasks: StageTask[];
}

export const StageTaskHUD: React.FC<StageTaskHUDProps> = ({
  currentStage,
  progress,
  tasks,
}) => {
  const [, setTick] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = () => {
      setTick(t => t + 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (progress.isStageActive) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress.isStageActive]);

  if (!currentStage || !progress.isStageActive) return null;

  const completedCount = tasks.filter(t => t.completed).length;
  const timeRemaining = currentStage.timeLimit
    ? Math.max(0, currentStage.timeLimit - (Date.now() - progress.stageStartTime) / 1000)
    : null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTaskIcon = (type: string): string => {
    switch (type) {
      case 'distanceTarget': return '📏';
      case 'heightTarget': return '🏔';
      case 'airCurrentCount': return '💨';
      case 'timeSurvival': return '⏱';
      case 'shadowTracking': return '👤';
      case 'stabilityMaintain': return '🎯';
      case 'scoreTarget': return '🏆';
      case 'comboAirCurrent': return '⚡';
      default: return '📋';
    }
  };

  const formatTaskValue = (task: StageTask): string => {
    switch (task.type) {
      case 'distanceTarget':
      case 'heightTarget':
        return `${Math.floor(task.currentValue)} / ${task.targetValue}m`;
      case 'airCurrentCount':
      case 'comboAirCurrent':
        return `${Math.floor(task.currentValue)} / ${task.targetValue}个`;
      case 'timeSurvival':
      case 'shadowTracking':
      case 'stabilityMaintain':
        return `${Math.floor(task.currentValue)} / ${task.timeLimit ?? task.targetValue}s`;
      case 'scoreTarget':
        return `${Math.floor(task.currentValue)} / ${task.targetValue}分`;
      default:
        return `${Math.floor(task.currentValue)} / ${task.targetValue}`;
    }
  };

  return (
    <div className="stage-task-hud">
      <div className="stage-header">
        <div className="stage-info">
          <span className="stage-badge">第 {currentStage.stageNumber} 关</span>
          <span className="stage-name">{currentStage.name}</span>
        </div>
        <div className="stage-progress-info">
          <span className="task-count">{completedCount}/{tasks.length} 任务</span>
          {timeRemaining !== null && (
            <span className={`time-remaining ${timeRemaining < 30 ? 'warning' : ''}`}>
              ⏱ {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </div>

      <div className="stage-progress-bar">
        <div
          className="stage-progress-fill"
          style={{ width: `${(completedCount / tasks.length) * 100}%` }}
        />
      </div>

      <div className="task-list">
        {tasks.slice(0, 3).map((task, index) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? 'completed' : ''} ${index === 0 ? 'active' : ''}`}
          >
            <div className="task-icon">{getTaskIcon(task.type)}</div>
            <div className="task-content">
              <div className="task-name">
                {task.name}
                <span
                  className="task-difficulty"
                  style={{ color: DIFFICULTY_COLORS[task.difficulty] }}
                >
                  {task.difficulty.toUpperCase()}
                </span>
              </div>
              <div className="task-progress">
                <div
                  className="task-progress-fill"
                  style={{
                    width: `${task.progress * 100}%`,
                    background: task.completed
                      ? 'linear-gradient(90deg, #4ecdc4, #44a08d)'
                      : `linear-gradient(90deg, ${DIFFICULTY_COLORS[task.difficulty]}, ${DIFFICULTY_COLORS[task.difficulty]}aa)`,
                  }}
                />
              </div>
              <div className="task-value">
                {formatTaskValue(task)}
                <span className="task-reward">+{task.rewardScore}分</span>
              </div>
            </div>
            {task.completed && <div className="task-check">✓</div>}
          </div>
        ))}
        {tasks.length > 3 && (
          <div className="more-tasks-hint">还有 {tasks.length - 3} 个任务...</div>
        )}
      </div>

      {progress.comboCount >= 3 && (
        <div className="combo-display">
          <span className="combo-number">{progress.comboCount}</span>
          <span className="combo-label">连击</span>
        </div>
      )}
    </div>
  );
};
