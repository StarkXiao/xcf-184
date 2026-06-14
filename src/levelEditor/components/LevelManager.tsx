import React, { useState, useRef } from 'react';
import { useLevelEditor } from '../useLevelEditor';
import type { LevelScene, LevelStats, LevelCategory } from '../types';
import { DIFFICULTY_NAMES, DIFFICULTY_COLORS } from '../types';

interface LevelManagerProps {
  currentLevel: LevelScene | null;
  onSelectLevel: (level: LevelScene) => void;
  onStartLevel: (level: LevelScene) => void;
  onGetLevelStats: (levelId: string) => LevelStats;
  onExportLevel: (levelId: string) => string | null;
  onImportLevel: (jsonString: string) => LevelScene | null;
}

export const LevelManager: React.FC<LevelManagerProps> = ({
  currentLevel,
  onSelectLevel,
  onStartLevel,
  onGetLevelStats,
  onExportLevel,
  onImportLevel,
}) => {
  const {
    toggleFavorite,
    duplicateLevel,
    deleteLevel,
    createEmptyLevel,
    getLevelsByCategory,
  } = useLevelEditor();

  const [activeCategory, setActiveCategory] = useState<LevelCategory>('preset');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLevels = getLevelsByCategory(activeCategory).filter((level) =>
    level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    level.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExport = (level: LevelScene, e: React.MouseEvent) => {
    e.stopPropagation();
    const json = onExportLevel(level.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${level.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const json = event.target?.result as string;
        onImportLevel(json);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categories: { key: LevelCategory; label: string; icon: string }[] = [
    { key: 'preset', label: '预设关卡', icon: '📋' },
    { key: 'saved', label: '我的关卡', icon: '💾' },
    { key: 'favorite', label: '收藏', icon: '⭐' },
  ];

  return (
    <div className="level-manager">
      <div className="level-manager-header">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="count-badge">
                {getLevelsByCategory(cat.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="manager-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索关卡..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleImportClick}
          >
            📥 导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-primary btn-small"
            onClick={createEmptyLevel}
          >
            ✨ 新建
          </button>
        </div>
      </div>

      <div className="level-grid">
        {filteredLevels.length === 0 ? (
          <div className="empty-levels">
            <div className="empty-icon">📭</div>
            <h3>暂无关卡</h3>
            <p>
              {activeCategory === 'preset'
                ? '没有找到预设关卡'
                : activeCategory === 'saved'
                  ? '你还没有创建任何自定义关卡，点击"新建"开始创建'
                  : '你还没有收藏任何关卡'}
            </p>
            {activeCategory === 'saved' && (
              <button className="btn btn-primary" onClick={createEmptyLevel}>
                ✨ 创建第一个关卡
              </button>
            )}
          </div>
        ) : (
          filteredLevels.map((level) => {
            const stats = onGetLevelStats(level.id);
            return (
              <div
                key={level.id}
                className={`level-card ${currentLevel?.id === level.id ? 'active' : ''}`}
              >
                <div className="level-card-header">
                  <div className="level-icon">{level.icon}</div>
                  <div className="level-info">
                    <h3 className="level-name">{level.name}</h3>
                    <span
                      className="level-difficulty"
                      style={{ backgroundColor: DIFFICULTY_COLORS[level.difficulty] }}
                    >
                      {DIFFICULTY_NAMES[level.difficulty]}
                    </span>
                  </div>
                  <button
                    className={`favorite-btn ${level.isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(level.id);
                    }}
                  >
                    {level.isFavorite ? '⭐' : '☆'}
                  </button>
                </div>

                <p className="level-description">{level.description}</p>

                <div className="level-meta">
                  <div className="meta-item">
                    <span className="meta-icon">🏢</span>
                    <span>{level.buildings.length} 建筑</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">💨</span>
                    <span>{level.airCurrents.length} 气流</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">🎯</span>
                    <span>{level.objectives.length} 目标</span>
                  </div>
                </div>

                {stats.totalPlays > 0 && (
                  <div className="level-stats">
                    <div className="stat-row">
                      <span className="stat-label">游玩次数</span>
                      <span className="stat-value">{stats.totalPlays}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">最高分</span>
                      <span className="stat-value">{stats.bestScore}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">胜率</span>
                      <span className="stat-value">{stats.winRate}%</span>
                    </div>
                  </div>
                )}

                <div className="level-tags">
                  {level.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="level-card-actions">
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLevel(level);
                    }}
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLevel(level.id);
                    }}
                  >
                    📋 复制
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => handleExport(level, e)}
                  >
                    📤 导出
                  </button>
                  {level.category !== 'preset' && (
                    <button
                      className="btn btn-danger btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`确定要删除关卡"${level.name}"吗？`)) {
                          deleteLevel(level.id);
                        }
                      }}
                    >
                      🗑️ 删除
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartLevel(level);
                    }}
                  >
                    🚀 开始
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
