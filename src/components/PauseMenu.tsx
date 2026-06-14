import React from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="menu-overlay pause-overlay">
      <div className="menu-content pause-content">
        <h2 className="pause-title">游戏暂停</h2>

        <div className="pause-buttons">
          <button className="menu-button primary" onClick={onResume}>
            继续游戏
          </button>
          <button className="menu-button" onClick={onRestart}>
            重新开始
          </button>
          <button className="menu-button" onClick={onMainMenu}>
            返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
};
