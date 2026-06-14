import React, { useState } from 'react';
import type { Division, DivisionConfig } from '../types';
import { DIVISION_NAMES } from '../types';

interface RegistrationPanelProps {
  divisions: DivisionConfig[];
  onRegister: (playerName: string, division: Division) => boolean;
}

export const RegistrationPanel: React.FC<RegistrationPanelProps> = ({
  divisions,
  onRegister,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<Division>('novice');

  const handleSubmit = () => {
    if (!playerName.trim()) return;
    onRegister(playerName.trim(), selectedDivision);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="registration-panel">
      <div className="registration-welcome">
        <h2>🏆 报名参赛</h2>
        <p>选择你的参赛组别，开启赛事之旅！</p>

        <div className="division-grid">
          {divisions.map((division) => (
            <div
              key={division.id}
              className={`division-card ${selectedDivision === division.id ? 'selected' : ''}`}
              style={{
                borderColor: selectedDivision === division.id ? division.color : undefined,
              }}
              onClick={() => setSelectedDivision(division.id)}
            >
              <div className="division-icon">{division.icon}</div>
              <div
                className="division-name"
                style={{ color: division.color }}
              >
                {division.name}
              </div>
              <div className="division-desc">{division.description}</div>
              <div className="division-score-range">
                {division.minScore} - {division.maxScore === Infinity ? '∞' : division.maxScore} 分
              </div>
            </div>
          ))}
        </div>

        <input
          className="registration-name-input"
          type="text"
          placeholder="输入你的参赛名称..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={12}
        />

        <button
          className="registration-submit"
          onClick={handleSubmit}
          disabled={!playerName.trim()}
        >
          确认报名 · {DIVISION_NAMES[selectedDivision]}
        </button>
      </div>
    </div>
  );
};
