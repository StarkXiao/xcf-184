import React, { useState, useMemo } from 'react';
import type { WeatherScene, SceneCategory, SceneStats } from '../types';
import { DIFFICULTY_NAMES, DIFFICULTY_COLORS } from '../types';

interface SceneManagerPanelProps {
  scenes: WeatherScene[];
  currentScene: WeatherScene | null;
  onSelectScene: (scene: WeatherScene) => void;
  onToggleFavorite: (sceneId: string) => boolean;
  onDuplicateScene: (sceneId: string) => WeatherScene | null;
  onDeleteScene: (sceneId: string) => boolean;
  onGetSceneStats: (sceneId: string) => SceneStats;
  onStartFlight: (scene: WeatherScene) => void;
  onExportScene: (sceneId: string) => string | null;
  onImportScene: (jsonString: string) => WeatherScene | null;
}

type FilterTab = SceneCategory | 'all';

export const SceneManagerPanel: React.FC<SceneManagerPanelProps> = ({
  scenes,
  currentScene,
  onSelectScene,
  onToggleFavorite,
  onDuplicateScene,
  onDeleteScene,
  onGetSceneStats,
  onStartFlight,
  onExportScene,
  onImportScene,
}) => {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'difficulty' | 'created' | 'flights'>('created');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');

  const filteredScenes = useMemo(() => {
    let result = [...scenes];

    if (filter === 'favorite') {
      result = result.filter((s) => s.isFavorite);
    } else if (filter !== 'all') {
      result = result.filter((s) => s.category === filter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difficulty': {
        const order = { easy: 0, medium: 1, hard: 2, extreme: 3 };
        result.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
        break;
      }
      case 'created':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'flights':
        result.sort((a, b) => {
          const statsA = onGetSceneStats(a.id);
          const statsB = onGetSceneStats(b.id);
          return statsB.totalFlights - statsA.totalFlights;
        });
        break;
    }

    return result;
  }, [scenes, filter, searchQuery, sortBy, onGetSceneStats]);

  const handleExport = (scene: WeatherScene) => {
    const json = onExportScene(scene.id);
    if (json) {
      navigator.clipboard.writeText(json).then(() => {
        alert(`场景 "${scene.name}" 已导出到剪贴板`);
      });
    }
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const scene = onImportScene(importJson);
    if (scene) {
      setImportJson('');
      setShowImportModal(false);
      alert(`场景 "${scene.name}" 导入成功`);
    } else {
      alert('导入失败，请检查 JSON 格式是否正确');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'preset', label: '预设' },
    { key: 'saved', label: '已保存' },
    { key: 'favorite', label: '收藏' },
  ];

  return (
    <div className="scene-manager-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-icon">📁</span>
          场景管理
        </h2>
        <button className="btn-primary" onClick={() => setShowImportModal(true)}>
          导入场景
        </button>
      </div>

      <div className="scene-filters">
        <div className="filter-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="filter-count">
                {tab.key === 'all'
                  ? scenes.length
                  : tab.key === 'favorite'
                  ? scenes.filter((s) => s.isFavorite).length
                  : scenes.filter((s) => s.category === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <input
            type="text"
            placeholder="搜索场景..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="sort-select"
          >
            <option value="created">最新创建</option>
            <option value="name">名称排序</option>
            <option value="difficulty">难度排序</option>
            <option value="flights">飞行次数</option>
          </select>
        </div>
      </div>

      <div className="scene-grid">
        {filteredScenes.map((scene) => {
          const stats = onGetSceneStats(scene.id);
          const isSelected = currentScene?.id === scene.id;

          return (
            <div
              key={scene.id}
              className={`scene-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelectScene(scene);
              }}
            >
              <div className="scene-card-header">
                <span className="scene-icon">{scene.icon}</span>
                <div className="scene-card-titles">
                  <h3 className="scene-name">{scene.name}</h3>
                  <span
                    className="scene-difficulty"
                    style={{
                      backgroundColor: `${DIFFICULTY_COLORS[scene.difficulty]}20`,
                      color: DIFFICULTY_COLORS[scene.difficulty],
                    }}
                  >
                    {DIFFICULTY_NAMES[scene.difficulty]}
                  </span>
                </div>
                <button
                  className={`favorite-btn ${scene.isFavorite ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(scene.id);
                  }}
                >
                  {scene.isFavorite ? '⭐' : '☆'}
                </button>
              </div>

              <p className="scene-description">{scene.description}</p>

              <div className="scene-tags">
                {scene.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="scene-tag">
                    {tag}
                  </span>
                ))}
                {scene.tags.length > 3 && (
                  <span className="scene-tag-more">+{scene.tags.length - 3}</span>
                )}
              </div>

              <div className="scene-stats">
                <div className="scene-stat">
                  <span className="stat-label">飞行次数</span>
                  <span className="stat-value">{stats.totalFlights}</span>
                </div>
                <div className="scene-stat">
                  <span className="stat-label">最高分</span>
                  <span className="stat-value">{stats.bestScore.toLocaleString()}</span>
                </div>
                <div className="scene-stat">
                  <span className="stat-label">成功率</span>
                  <span
                    className={`stat-value ${stats.successRate >= 70 ? 'positive' : stats.successRate >= 40 ? 'warning' : 'negative'}`}
                  >
                    {stats.successRate}%
                  </span>
                </div>
              </div>

              <div className="scene-wind-info">
                <span>风速: {scene.windField.windSpeed.toFixed(2)} m/s</span>
                <span>湍流: {(scene.windField.turbulenceLevel * 100).toFixed(0)}%</span>
              </div>

              <div className="scene-card-footer">
                <span className="scene-category">
                  {scene.category === 'preset' ? '预设场景' : '自定义场景'}
                </span>
                <span className="scene-date">{formatDate(scene.createdAt)}</span>
              </div>

              <div className="scene-card-actions">
                <button
                  className="btn-secondary btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateScene(scene.id);
                  }}
                >
                  复制
                </button>
                <button
                  className="btn-secondary btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(scene);
                  }}
                >
                  导出
                </button>
                {scene.category !== 'preset' && (
                  <button
                    className="btn-danger btn-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定要删除场景 "${scene.name}" 吗？`)) {
                        onDeleteScene(scene.id);
                      }
                    }}
                  >
                    删除
                  </button>
                )}
                <button
                  className="btn-primary btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFlight(scene);
                  }}
                >
                  开始飞行
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredScenes.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>没有找到匹配的场景</p>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">导入天气场景</h3>
            <p className="modal-description">
              粘贴场景的 JSON 数据以导入
            </p>

            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{\n  "id": "...",\n  "name": "...",\n  ...\n}'
              className="form-textarea"
              rows={10}
            />

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleImport}>
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
