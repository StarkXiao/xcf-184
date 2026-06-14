import React from 'react';
import { useWeatherLab } from '../useWeatherLab';
import { WindConfigPanel } from './WindConfigPanel';
import { SceneManagerPanel } from './SceneManagerPanel';
import { ResultsComparison } from './ResultsComparison';
import { AnomalyReview } from './AnomalyReview';
import { TAB_NAMES } from '../types';
import type { WeatherLabTab, WeatherScene } from '../types';

interface WeatherLabProps {
  onClose: () => void;
  onStartFlight: (scene: WeatherScene) => void;
}

export const WeatherLab: React.FC<WeatherLabProps> = ({ onClose, onStartFlight }) => {
  const {
    state,
    scenes,
    currentScene,
    flightRecords,
    anomalyEvents,
    comparisonGroups,
    activeComparisonGroup,
    selectedAnomaly,
    setCurrentTab,
    setCurrentScene,
    createScene,
    updateScene,
    deleteScene,
    toggleFavorite,
    duplicateScene,
    getSceneStats,
    getUnreviewedAnomalies,
    markAnomalyReviewed,
    setSelectedAnomaly,
    createComparisonGroup,
    addToComparisonGroup,
    removeFromComparisonGroup,
    setActiveComparisonGroup,
    getComparisonRecords,
    deleteComparisonGroup,
    exportScene,
    importScene,
  } = useWeatherLab();

  const tabs: { key: WeatherLabTab; icon: string }[] = [
    { key: 'windConfig', icon: '💨' },
    { key: 'scenes', icon: '📁' },
    { key: 'comparison', icon: '📊' },
    { key: 'anomaly', icon: '🔍' },
  ];

  const handleStartFlight = (scene: WeatherScene) => {
    onStartFlight(scene);
    onClose();
  };

  return (
    <div className="weatherlab-overlay">
      <div className="weatherlab-container">
        <div className="weatherlab-header">
          <div className="weatherlab-title-section">
            <h1 className="weatherlab-title">
              <span className="title-icon">🌤️</span>
              天气实验室
            </h1>
            <p className="weatherlab-subtitle">
              探索不同风场条件下的飞行表现，提升你的风筝操控技术
            </p>
          </div>

          <div className="weatherlab-header-actions">
            <div className="stats-summary">
              <div className="summary-item">
                <span className="summary-icon">🌪️</span>
                <span className="summary-value">{scenes.length}</span>
                <span className="summary-label">场景</span>
              </div>
              <div className="summary-item">
                <span className="summary-icon">📋</span>
                <span className="summary-value">{flightRecords.length}</span>
                <span className="summary-label">记录</span>
              </div>
              <div className="summary-item warning">
                <span className="summary-icon">⚠️</span>
                <span className="summary-value">{getUnreviewedAnomalies().length}</span>
                <span className="summary-label">待复盘</span>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="weatherlab-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`weatherlab-tab ${state.currentTab === tab.key ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{TAB_NAMES[tab.key]}</span>
            </button>
          ))}
        </div>

        <div className="weatherlab-body">
          {state.currentTab === 'windConfig' && (
            <WindConfigPanel
              currentScene={currentScene}
              onUpdateScene={updateScene}
              onSaveScene={createScene}
              onSetCurrentScene={setCurrentScene}
              onStartFlight={handleStartFlight}
            />
          )}

          {state.currentTab === 'scenes' && (
            <SceneManagerPanel
              scenes={scenes}
              currentScene={currentScene}
              onSelectScene={(scene) => {
                setCurrentScene(scene);
                setCurrentTab('windConfig');
              }}
              onToggleFavorite={toggleFavorite}
              onDuplicateScene={duplicateScene}
              onDeleteScene={deleteScene}
              onGetSceneStats={getSceneStats}
              onStartFlight={handleStartFlight}
              onExportScene={exportScene}
              onImportScene={importScene}
            />
          )}

          {state.currentTab === 'comparison' && (
            <ResultsComparison
              flightRecords={flightRecords}
              comparisonGroups={comparisonGroups}
              activeComparisonGroup={activeComparisonGroup}
              onCreateComparisonGroup={createComparisonGroup}
              onAddToComparisonGroup={addToComparisonGroup}
              onRemoveFromComparisonGroup={removeFromComparisonGroup}
              onSetActiveComparisonGroup={setActiveComparisonGroup}
              onGetComparisonRecords={getComparisonRecords}
              onDeleteComparisonGroup={deleteComparisonGroup}
            />
          )}

          {state.currentTab === 'anomaly' && (
            <AnomalyReview
              anomalyEvents={anomalyEvents}
              flightRecords={flightRecords}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
              onMarkReviewed={markAnomalyReviewed}
              onGetUnreviewedAnomalies={getUnreviewedAnomalies}
            />
          )}
        </div>
      </div>
    </div>
  );
};
