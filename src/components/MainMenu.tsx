import React, { useState } from 'react';

interface MainMenuProps {
  onStart: () => void;
  onWorkshop: () => void;
  onTournament: () => void;
  onTraining: () => void;
  onWeatherLab: () => void;
  onLevelEditor: () => void;
  onJourney: () => void;
  onFestival: () => void;
  onMapExplore: () => void;
  onReplay: () => void;
  onStageChallenge: () => void;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  onDifficultyChange: (difficulty: 'easy' | 'normal' | 'hard' | 'extreme') => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStart, 
  onWorkshop, 
  onTournament, 
  onTraining, 
  onWeatherLab, 
  onLevelEditor, 
  onJourney, 
  onFestival, 
  onMapExplore, 
  onReplay, 
  onStageChallenge,
  difficulty,
  onDifficultyChange
}) => {
  const [showDifficultyInfo, setShowDifficultyInfo] = useState(false);
  
  const difficultyInfo = {
    easy: { label: '简单', color: '#00ff88', desc: '耐久更高，伤害更低，适合新手' },
    normal: { label: '普通', color: '#00c6ff', desc: '标准难度，平衡的游戏体验' },
    hard: { label: '困难', color: '#ffc107', desc: '耐久降低，伤害提高，适合老手' },
    extreme: { label: '极限', color: '#ff4444', desc: '极高的操作要求，只有真正的风筝大师才能驾驭！' },
  };
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

        <div className="difficulty-selector">
          <h3>难度选择</h3>
          <div className="difficulty-buttons">
            {(['easy', 'normal', 'hard', 'extreme'] as const).map((d) => (
              <button
                key={d}
                className={`difficulty-btn ${difficulty === d ? 'active' : ''}`}
                style={{ 
                  borderColor: difficultyInfo[d].color,
                  color: difficulty === d ? '#fff' : difficultyInfo[d].color,
                  background: difficulty === d ? difficultyInfo[d].color : 'transparent'
                }}
                onClick={() => onDifficultyChange(d)}
              >
                {difficultyInfo[d].label}
              </button>
            ))}
          </div>
          <div 
            className="difficulty-desc"
            style={{ color: difficultyInfo[difficulty].color }}
          >
            {difficultyInfo[difficulty].desc}
          </div>
          <button 
            className="difficulty-info-toggle"
            onClick={() => setShowDifficultyInfo(!showDifficultyInfo)}
          >
            {showDifficultyInfo ? '▼ 收起详情' : '▶ 查看机制详情'}
          </button>
          
          {showDifficultyInfo && (
            <div className="mechanics-info">
              <h4>🎮 核心机制</h4>
              <div className="mechanic-item">
                <span className="mechanic-icon">🛡️</span>
                <div className="mechanic-content">
                  <strong>风筝耐久度</strong>
                  <p>碰撞建筑、快速收放线、张力过高或在乱流中飞行都会降低耐久。耐久归零则游戏结束。平稳飞行可缓慢恢复耐久。</p>
                </div>
              </div>
              <div className="mechanic-item">
                <span className="mechanic-icon">🧵</span>
                <div className="mechanic-content">
                  <strong>线轴张力</strong>
                  <p>张力受线长、风速、飞行速度影响。保持张力在最优值附近可获得最高效率，过高或过低都会降低飞行性能。</p>
                </div>
              </div>
              <div className="mechanic-item">
                <span className="mechanic-icon">⭐</span>
                <div className="mechanic-content">
                  <strong>评分奖励</strong>
                  <p>保持高耐久度和优秀的张力控制可获得额外得分奖励，总损伤会扣除分数。</p>
                </div>
              </div>
            </div>
          )}
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
            <div className="control-item">
              <span className="key">R</span>
              <span className="key-desc">收线</span>
            </div>
            <div className="control-item">
              <span className="key">F</span>
              <span className="key-desc">放线</span>
            </div>
            <div className="control-item touch-control">
              <span className="key">触屏滑动</span>
              <span className="key-desc">控制方向</span>
            </div>
            <div className="control-item touch-control">
              <span className="key">双指捏合</span>
              <span className="key-desc">收放线</span>
            </div>
          </div>
        </div>

        <button className="start-button" onClick={onStart}>
          <span className="button-text">开始游戏</span>
          <span className="button-icon">▶</span>
        </button>

        <button className="workshop-menu-button" onClick={onWorkshop}>
          <span className="button-icon">🛠️</span>
          <span className="button-text">风筝改装工坊</span>
        </button>

        <button className="tournament-menu-button" onClick={onTournament}>
          <span className="button-icon">🏆</span>
          <span className="button-text">赛事中心</span>
        </button>

        <button className="tournament-menu-button" onClick={onTraining} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
          <span className="button-icon">🎓</span>
          <span className="button-text">教学训练营</span>
        </button>

        <button className="tournament-menu-button" onClick={onWeatherLab} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
          <span className="button-icon">🌤️</span>
          <span className="button-text">天气实验室</span>
        </button>

        <button className="tournament-menu-button" onClick={onLevelEditor} style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
          <span className="button-icon">🎮</span>
          <span className="button-text">关卡编辑器</span>
        </button>

        <button className="tournament-menu-button" onClick={onJourney} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
          <span className="button-icon">🗂️</span>
          <span className="button-text">旅程档案</span>
        </button>

        <button className="tournament-menu-button" onClick={onMapExplore} style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <span className="button-icon">🗺️</span>
          <span className="button-text">地图探索</span>
        </button>

        <button className="tournament-menu-button" onClick={onFestival} style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}>
          <span className="button-icon">🎉</span>
          <span className="button-text">节日活动</span>
        </button>

        <button className="tournament-menu-button" onClick={onReplay} style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>
          <span className="button-icon">🎮</span>
          <span className="button-text">观战与回放中心</span>
        </button>

        <button className="tournament-menu-button" onClick={onStageChallenge} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          <span className="button-icon">🏁</span>
          <span className="button-text">赛段挑战</span>
        </button>

        <div className="tips">
          <p>💡 提示：蓝色光环是上升气流，紫色是乱流，橙色是下降气流</p>
        </div>
      </div>
    </div>
  );
};
