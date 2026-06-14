import React from 'react';
import type { FestivalTask, TaskStatus } from '../types';
import {
  TASK_TYPE_NAMES,
  TASK_STATUS_NAMES,
  TASK_STATUS_COLORS,
} from '../types';

interface TasksPanelProps {
  tasks: FestivalTask[];
  getTaskProgress: (taskId: string) => number;
  getTaskStatus: (taskId: string) => TaskStatus;
  onClaimReward: (taskId: string) => void;
}

export const TasksPanel: React.FC<TasksPanelProps> = ({
  tasks,
  getTaskProgress,
  getTaskStatus,
  onClaimReward,
}) => {
  const dailyTasks = tasks.filter((t) => t.type === 'daily');
  const cumulativeTasks = tasks.filter((t) => t.type === 'cumulative');
  const specialTasks = tasks.filter((t) => t.type === 'special');

  const renderTaskGroup = (
    title: string,
    taskList: FestivalTask[]
  ) => (
    <div className="festival-task-group" key={title}>
      <div className="festival-task-group-title">{title}</div>
      <div className="festival-task-list">
        {taskList.map((task) => {
          const progress = getTaskProgress(task.id);
          const status = getTaskStatus(task.id);
          const percent = Math.min(100, (progress / task.target) * 100);
          const canClaim = status === 'completed';
          const isClaimed = status === 'claimed';

          return (
            <div
              key={task.id}
              className={`festival-task-card ${isClaimed ? 'claimed' : ''}`}
            >
              <div className="festival-task-header">
                <div>
                  <div className="festival-task-title">{task.title}</div>
                  <div className="festival-task-desc">{task.description}</div>
                </div>
                <div
                  className="festival-task-type"
                  style={{
                    background: TASK_STATUS_COLORS[status],
                  }}
                >
                  {TASK_STATUS_NAMES[status]}
                </div>
              </div>

              <div className="festival-task-progress-bar">
                <div
                  className="festival-task-progress-fill"
                  style={{
                    width: `${percent}%`,
                    background: TASK_STATUS_COLORS[status],
                  }}
                />
                <div className="festival-task-progress-text">
                  {progress} / {task.target}
                </div>
              </div>

              <div className="festival-task-rewards">
                <span className="festival-task-rewards-label">奖励：</span>
                {task.rewards.map((reward, idx) => (
                  <span key={idx} className="festival-task-reward">
                    {reward.icon} {reward.name} x{reward.amount}
                  </span>
                ))}
              </div>

              <button
                className={`festival-task-claim-btn ${
                  canClaim ? 'active' : ''
                }`}
                disabled={!canClaim}
                onClick={() => canClaim && onClaimReward(task.id)}
              >
                {isClaimed ? '已领取' : canClaim ? '领取奖励' : '未完成'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="festival-tasks-panel">
      {renderTaskGroup(
        TASK_TYPE_NAMES.daily,
        dailyTasks
      )}
      {renderTaskGroup(
        TASK_TYPE_NAMES.cumulative,
        cumulativeTasks
      )}
      {renderTaskGroup(
        TASK_TYPE_NAMES.special,
        specialTasks
      )}
    </div>
  );
};
