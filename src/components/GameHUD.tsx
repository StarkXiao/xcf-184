import React from 'react';
import type { GameStats, WeatherEventType, TimeOfDayPhase } from '../game/types';

interface GameHUDProps {
  stats: GameStats;
  onPause: () => void;
}

const WEATHER_EVENT_NAMES: Record<WeatherEventType, string> = {
  clear: '晴朗',
  suddenStorm: '突发风暴',
  goldenHour: '金色小时',
  morningBreeze: '清晨微风',
  nightFall: '夜幕降临',
  denseFog: '浓雾弥漫',
  sunBreak: '阳光破云',
  thunderStorm: '雷暴天气',
};

const WEATHER_EVENT_ICONS: Record<WeatherEventType, string> = {
  clear: '☀️',
  suddenStorm: '🌪️',
  goldenHour: '🌅',
  morningBreeze: '🍃',
  nightFall: '🌙',
  denseFog: '🌫️',
  sunBreak: '🌤️',
  thunderStorm: '⛈️',
};

const WEATHER_EVENT_COLORS: Record<WeatherEventType, string> = {
  clear: 'linear-gradient(135deg, #87ceeb 0%, #4a90d9 100%)',
  suddenStorm: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  goldenHour: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  morningBreeze: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  nightFall: 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
  denseFog: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
  sunBreak: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  thunderStorm: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
};

const TIME_OF_DAY_NAMES: Record<TimeOfDayPhase, string> = {
  dawn: '黎明',
  morning: '上午',
  noon: '正午',
  afternoon: '下午',
  sunset: '黄昏',
  night: '夜晚',
};

const TIME_OF_DAY_ICONS: Record<TimeOfDayPhase, string> = {
  dawn: '🌄',
  morning: '🌤️',
  noon: '☀️',
  afternoon: '🌞',
  sunset: '🌇',
  night: '🌃',
};

export const GameHUD: React.FC<GameHUDProps> = ({ stats, onPause }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const heightPercent = Math.min(100, (stats.height / 200) * 100);
  const trackingPercent = Math.floor(stats.shadowTracking * 100);
  const stabilityPercent = Math.floor(stats.flightStability * 100);

  const getTrackingColor = (value: number): string => {
    if (value >= 0.8) return 'linear-gradient(180deg, #ffd700 0%, #ff8c00 100%)';
    if (value >= 0.6) return 'linear-gradient(180deg, #4ecdc4 0%, #44a08d 100%)';
    if (value >= 0.4) return 'linear-gradient(180deg, #95e1d3 0%, #7fb8a8 100%)';
    return 'linear-gradient(180deg, #ff6b6b 0%, #c0392b 100%)';
  };

  const getStabilityColor = (value: number): string => {
    if (value >= 0.85) return 'linear-gradient(180deg, #00ff88 0%, #00b85c 100%)';
    if (value >= 0.65) return 'linear-gradient(180deg, #00c6ff 0%, #0072ff 100%)';
    if (value >= 0.45) return 'linear-gradient(180deg, #f7971e 0%, #ffd200 100%)';
    return 'linear-gradient(180deg, #eb3349 0%, #f45c43 100%)';
  };

  const getTrackingGrade = (value: number): string => {
    if (value >= 0.85) return 'S';
    if (value >= 0.7) return 'A';
    if (value >= 0.55) return 'B';
    if (value >= 0.4) return 'C';
    return 'D';
  };

  const getMultiplierColor = (multiplier: number): string => {
    if (multiplier >= 2.5) return '#ff4444';
    if (multiplier >= 2.0) return '#ff8800';
    if (multiplier >= 1.5) return '#ffcc00';
    if (multiplier >= 1.2) return '#44ff44';
    if (multiplier >= 1.0) return '#ffffff';
    return '#888888';
  };

  const isWeatherEventActive = stats.weatherEvent !== 'clear';

  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="stat-card score-card">
          <div className="stat-label">得分</div>
          <div className="stat-value">{stats.score.toLocaleString()}</div>
          {stats.scoreMultiplier > 1.0 && (
            <div
              className="stat-bonus multiplier-bonus"
              style={{ color: getMultiplierColor(stats.scoreMultiplier) }}
            >
              x{stats.scoreMultiplier.toFixed(1)} 倍率
            </div>
          )}
          {stats.shadowBonus > 0 && (
            <div className="stat-bonus">+{stats.shadowBonus} 影子追踪</div>
          )}
          {stats.weatherBonusScore > 0 && (
            <div
              className="stat-bonus weather-bonus"
              style={{ color: getMultiplierColor(stats.scoreMultiplier) }}
            >
              +{stats.weatherBonusScore} 天气奖励
            </div>
          )}
        </div>

        <div className="stat-card time-card">
          <div className="stat-label">
            {TIME_OF_DAY_ICONS[stats.timeOfDayPhase]} {TIME_OF_DAY_NAMES[stats.timeOfDayPhase]}
          </div>
          <div className="stat-value">{formatTime(stats.time)}</div>
        </div>

        {isWeatherEventActive && (
          <div
            className="stat-card weather-event-card"
            style={{ background: WEATHER_EVENT_COLORS[stats.weatherEvent] }}
          >
            <div className="weather-event-header">
              <span className="weather-event-icon">
                {WEATHER_EVENT_ICONS[stats.weatherEvent]}
              </span>
              <span className="weather-event-name">
                {WEATHER_EVENT_NAMES[stats.weatherEvent]}
              </span>
            </div>
            {stats.weatherEventDuration > 0 && (
              <div className="weather-event-timer">
                剩余 {Math.ceil(stats.weatherEventDuration)}s
              </div>
            )}
            <div className="weather-event-effects">
              <span className="weather-effect-item">x{stats.scoreMultiplier.toFixed(1)}</span>
              {stats.visibility < 1.0 && (
                <span className="weather-effect-item visibility-low">👁 {Math.floor(stats.visibility * 100)}%</span>
              )}
              {stats.weatherEvent === 'thunderStorm' && (
                <span className="weather-effect-item danger">⚡危险</span>
              )}
            </div>
          </div>
        )}

        <div className="stat-card tracking-mini-card">
          <div className="stat-label">追踪评级</div>
          <div className="tracking-grade" style={{
            background: getTrackingColor(stats.shadowTracking),
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {getTrackingGrade(stats.shadowTracking)}
          </div>
        </div>

        <button className="pause-button" onClick={onPause}>
          ⏸
        </button>
      </div>

      <div className="hud-left">
        <div className="altitude-meter">
          <div className="meter-label">高度</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ height: `${heightPercent}%` }}
            />
            <div className="meter-marker">200m</div>
            <div className="meter-marker mid">100m</div>
            <div className="meter-marker low">0m</div>
          </div>
          <div className="meter-value">{Math.floor(stats.height)}m</div>
        </div>
      </div>

      <div className="hud-right">
        <div className="info-panel">
          <div className="info-row">
            <span className="info-label">飞行距离</span>
            <span className="info-value">{Math.floor(stats.distance)}m</span>
          </div>
          <div className="info-row">
            <span className="info-label">最高高度</span>
            <span className="info-value">{Math.floor(stats.maxHeight)}m</span>
          </div>
          <div className="info-row">
            <span className="info-label">气流捕获</span>
            <span className="info-value">{stats.airCurrentCount}</span>
          </div>
          {stats.lightningNearMiss > 0 && (
            <div className="info-row info-row-danger">
              <span className="info-label">⚡闪电擦边</span>
              <span className="info-value">{stats.lightningNearMiss}</span>
            </div>
          )}
          <div className="info-divider" />
          <div className="info-row info-row-highlight">
            <span className="info-label">影子追踪奖励</span>
            <span className="info-value info-value-gold">+{stats.shadowBonus}</span>
          </div>
          {stats.weatherBonusScore > 0 && (
            <div
              className="info-row info-row-highlight"
              style={{ borderLeft: `3px solid ${getMultiplierColor(stats.scoreMultiplier)}` }}
            >
              <span className="info-label">天气事件奖励</span>
              <span
                className="info-value"
                style={{ color: getMultiplierColor(stats.scoreMultiplier) }}
              >
                +{stats.weatherBonusScore}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="hud-bottom">
        <div className="shadow-indicator">
          <div className="indicator-header">
            <span className="indicator-label">影子追踪度</span>
            <span className="indicator-value">{trackingPercent}%</span>
          </div>
          <div className="indicator-bar">
            <div
              className="indicator-fill"
              style={{
                width: `${trackingPercent}%`,
                background: getTrackingColor(stats.shadowTracking),
              }}
            />
            <div className="indicator-glow" />
          </div>
        </div>

        <div className="stability-indicator">
          <div className="indicator-header">
            <span className="indicator-label">飞行稳定性</span>
            <span className="indicator-value">{stabilityPercent}%</span>
          </div>
          <div className="indicator-bar">
            <div
              className="indicator-fill stability-fill"
              style={{
                width: `${stabilityPercent}%`,
                background: getStabilityColor(stats.flightStability),
              }}
            />
          </div>
        </div>
      </div>

      <div className="hud-bottom-secondary">
        <div className="durability-indicator">
          <div className="indicator-header">
            <span className="indicator-label">
              🛡️ 风筝耐久
              {stats.durability.isCritical && <span className="warning-blink"> 危险!</span>}
              {stats.durability.isWarning && !stats.durability.isCritical && <span className="warning-text"> 警告</span>}
            </span>
            <span className="indicator-value">
              {Math.floor(stats.durability.current)}/{stats.durability.max}
            </span>
          </div>
          <div className="indicator-bar">
            <div
              className="indicator-fill"
              style={{
                width: `${(stats.durability.current / stats.durability.max) * 100}%`,
                background: getDurabilityColor(stats.durability.current / stats.durability.max),
              }}
            />
          </div>
          {stats.durabilityBonus > 0 && (
            <div className="indicator-bonus">+{stats.durabilityBonus} 耐久奖励</div>
          )}
        </div>

        <div className="tension-indicator">
          <div className="indicator-header">
            <span className="indicator-label">
              🧵 线轴张力
              {stats.tension.isOverTension && <span className="warning-blink"> 过紧!</span>}
              {stats.tension.isUnderTension && <span className="warning-text"> 过松</span>}
            </span>
            <span className="indicator-value">
              {Math.floor(stats.tension.current)}/{stats.tension.max}
            </span>
          </div>
          <div className="indicator-bar">
            <div 
              className="tension-optimal-marker"
              style={{ left: `${(stats.tension.optimal / stats.tension.max) * 100}%` }}
            />
            <div
              className="indicator-fill"
              style={{
                width: `${(stats.tension.current / stats.tension.max) * 100}%`,
                background: getTensionColor(stats.tension.current, stats.tension.optimal, stats.tension.max),
              }}
            />
          </div>
          <div className="tension-info">
            <span>线长: {Math.floor(stats.tension.stringLength)}m</span>
            <span>|</span>
            <span>R/F 收放线</span>
          </div>
          {stats.tensionBonus > 0 && (
            <div className="indicator-bonus">+{stats.tensionBonus} 张力奖励</div>
          )}
        </div>
      </div>
    </div>
  );
};

const getDurabilityColor = (value: number): string => {
  if (value <= 0.2) return 'linear-gradient(180deg, #ff0000 0%, #8b0000 100%)';
  if (value <= 0.5) return 'linear-gradient(180deg, #ff6b00 0%, #cc5500 100%)';
  if (value <= 0.75) return 'linear-gradient(180deg, #ffc107 0%, #e0a800 100%)';
  return 'linear-gradient(180deg, #00ff88 0%, #00b85c 100%)';
};

const getTensionColor = (current: number, optimal: number, max: number): string => {
  const diff = Math.abs(current - optimal);
  const maxDiff = Math.max(optimal, max - optimal);
  const efficiency = Math.max(0, 1 - diff / maxDiff);
  
  if (efficiency >= 0.8) return 'linear-gradient(180deg, #00ff88 0%, #00b85c 100%)';
  if (efficiency >= 0.5) return 'linear-gradient(180deg, #00c6ff 0%, #0072ff 100%)';
  if (current > optimal) return 'linear-gradient(180deg, #ff6b00 0%, #cc5500 100%)';
  return 'linear-gradient(180deg, #f7971e 0%, #ffd200 100%)';
};
