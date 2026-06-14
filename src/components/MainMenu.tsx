import React from 'react';

interface MainMenuProps {
  onStart: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="menu-overlay">
      <div className="menu-content">
        <div className="kite-icon" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="80" height="80">
            <path
              d="M50 5 L85 45 L50 85 L15 45 Z"
              fill="#ff4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="45"
              x2="85"
              y2="45"
              stroke="#8b4513"
              strokeWidth="3"
            />
            <line
              x1="50"
              y1="5"
              x2="50"
              y2="85"
              stroke="#8b4513"
              strokeWidth="3"
            />
            <path
              d="M50 85 Q45 95 50 105 Q55 95 50 85"
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="2"
            />
          </svg>
        </div>

        <h1 className="game-title">风筝影子追踪</h1>
        <p className="game-subtitle">Kite Shadow Chase</p>

        <div className="game-description">
          <p>
            根据地面影子的变化，控制风筝穿越城市屋顶气流！
          </p>
          <p>
            利用上升气流飞得更高更远，避开下降气流和建筑物。
          </p>
        </div>

        <div className="controls-info">
          <h3>操作说明</h3>
          <div className="control-grid">
            <div className="control-item">
              <span className="key">W / ↑</span>
              <span className="key-desc">上升</span>
            </div>
            <div className="control-item">
              <span className="key">S / ↓</span>
              <span className="key-desc">下降</span>
            </div>
            <div className="control-item">
              <span className="key">A / ←</span>
              <span className="key-desc">左转</span>
            </div>
            <div className="control-item">
              <span className="key">D / →</span>
              <span className="key-desc">右转</span>
            </div>
            <div className="control-item">
              <span className="key">Q</span>
              <span className="key-desc">减速</span>
            </div>
            <div className="control-item">
              <span className="key">E</span>
              <span className="key-desc">加速</span>
            </div>
            <div className="control-item touch-control">
              <span className="key">触屏</span>
              <span className="key-desc">滑动控制</span>
            </div>
          </div>
        </div>

        <button className="start-button" onClick={onStart}>
          <span className="button-text">开始游戏</span>
          <span className="button-icon">▶</span>
        </button>

        <div className="tips">
          <p>💡 提示：蓝色光环是上升气流，紫色是乱流，橙色是下降气流</p>
        </div>
      </div>
    </div>
  );
};
