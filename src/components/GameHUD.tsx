import React, { useEffect, useState, useRef } from 'react';
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

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  duration: number;
  size: number;
}

const getComboColor = (combo: number): string => {
  if (combo >= 50) return '#ff0080';
  if (combo >= 30) return '#ff00ff';
  if (combo >= 20) return '#ff4040';
  if (combo >= 10) return '#ff8c00';
  if (combo >= 5) return '#ffd700';
  return '#4ecdc4';
};

export const GameHUD: React.FC<GameHUDProps> = ({ stats, onPause }) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [comboPulse, setComboPulse] = useState(false);
  const prevComboRef = useRef(0);
  const hudRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const heightPercent = Math.min(100, (stats.height / 200) * 100);
  const trackingPercent = Math.floor(stats.shadowTracking * 100);
  const stabilityPercent = Math.floor(stats.flightStability * 100);
  const comboFlow = stats.comboFlow;

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

  useEffect(() => {
    if (comboFlow.combo > prevComboRef.current && comboFlow.combo > 0) {
      const newCombo = comboFlow.combo;

      if (newCombo % 5 === 0 && newCombo >= 5) {
        const text: FloatingText = {
          id: `milestone-${Date.now()}`,
          text: `🏆 ${newCombo} 连击里程碑!`,
          x: 50,
          y: 35,
          color: '#ffd700',
          createdAt: Date.now(),
          duration: 2000,
          size: 28,
        };
        setFloatingTexts((prev) => [...prev, text]);
      } else if (newCombo >= 3) {
        const text: FloatingText = {
          id: `combo-${Date.now()}`,
          text: `${newCombo} COMBO!`,
          x: 50 + (Math.random() - 0.5) * 10,
          y: 40,
          color: getComboColor(newCombo),
          createdAt: Date.now(),
          duration: 1200,
          size: 24 + Math.min(newCombo, 30) * 0.5,
        };
        setFloatingTexts((prev) => [...prev, text]);
      }

      setComboPulse(true);
      setTimeout(() => setComboPulse(false), 300);
    }
    prevComboRef.current = comboFlow.combo;
  }, [comboFlow.combo]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingTexts((prev) =>
        prev.filter((t) => now - t.createdAt < t.duration)
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const isWeatherEventActive = stats.weatherEvent !== 'clear';
  const showComboPanel = comboFlow.combo > 0 || comboFlow.totalHits > 0;

  return (
    <div className="game-hud" ref={hudRef}>
      {floatingTexts.map((ft) => {
        const elapsed = Date.now() - ft.createdAt;
        const progress = Math.min(1, elapsed / ft.duration);
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const opacity = 1 - progress;
        const translateY = -easeOut * 80;
        const scale = 1 + easeOut * 0.2;

        return (
          <div
            key={ft.id}
            className="combo-floating-text"
            style={{
              left: `${ft.x}%`,
              top: `${ft.y}%`,
              color: ft.color,
              fontSize: `${ft.size}px`,
              opacity,
              transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
              textShadow: `0 0 20px ${ft.color}, 0 0 40px ${ft.color}55`,
            }}
          >
            {ft.text}
          </div>
        );
      })}

      {comboFlow.combo >= 10 && (
        <div
          className={`combo-screen-overlay ${comboPulse ? 'pulse' : ''}`}
          style={{
            background: `radial-gradient(circle at center, ${getComboColor(comboFlow.combo)}11 0%, transparent 60%)`,
          }}
        />
      )}

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
          {comboFlow.totalComboScore > 0 && (
            <div className="stat-bonus combo-bonus" style={{ color: getComboColor(comboFlow.maxCombo) }}>
              +{comboFlow.totalComboScore} 连击分
            </div>
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

      {showComboPanel && (
        <div
          className={`combo-panel ${comboPulse ? 'combo-panel-pulse' : ''}`}
          style={{
            borderColor: getComboColor(comboFlow.combo),
            boxShadow: comboFlow.combo >= 5 ? `0 0 30px ${getComboColor(comboFlow.combo)}55, inset 0 0 20px ${getComboColor(comboFlow.combo)}22` : 'none',
          }}
        >
          <div className="combo-panel-header">
            <span className="combo-panel-icon">⚡</span>
            <span className="combo-panel-title">连击击穿</span>
          </div>

          <div className="combo-main-display">
            <div
              className="combo-number"
              style={{
                color: getComboColor(comboFlow.combo),
                textShadow: `0 0 20px ${getComboColor(comboFlow.combo)}`,
              }}
            >
              {comboFlow.combo}
            </div>
            <div className="combo-label">当前连击</div>
          </div>

          <div className="combo-stats-row">
            <div className="combo-stat-item">
              <div className="combo-stat-value" style={{ color: '#ffd700' }}>
                x{comboFlow.currentMultiplier.toFixed(1)}
              </div>
              <div className="combo-stat-label">连击倍率</div>
            </div>
            <div className="combo-stat-divider" />
            <div className="combo-stat-item">
              <div className="combo-stat-value" style={{ color: '#4ecdc4' }}>
                +{comboFlow.comboScore}
              </div>
              <div className="combo-stat-label">本轮得分</div>
            </div>
            <div className="combo-stat-divider" />
            <div className="combo-stat-item">
              <div className="combo-stat-value" style={{ color: '#ff6b6b' }}>
                {comboFlow.maxCombo}
              </div>
              <div className="combo-stat-label">最高连击</div>
            </div>
          </div>

          {comboFlow.combo > 0 && (
            <div className="combo-timer-bar">
              <div
                className="combo-timer-fill"
                style={{
                  width: `${Math.max(0, 100 - ((Date.now() - comboFlow.lastHitTime) / (comboFlow.comboTimeout * 1000)) * 100)}%`,
                  background: `linear-gradient(90deg, ${getComboColor(comboFlow.combo)}, #ffffff)`,
                  boxShadow: `0 0 10px ${getComboColor(comboFlow.combo)}`,
                }}
              />
            </div>
          )}

          <div className="combo-secondary-stats">
            <span>完美: {comboFlow.perfectHits}</span>
            <span>总命中: {comboFlow.totalHits}</span>
            <span>中断: {comboFlow.comboBreakCount}</span>
          </div>
        </div>
      )}

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
          {showComboPanel && comboFlow.totalHits > 0 && (
            <div className="info-row info-row-highlight" style={{ borderLeft: `3px solid ${getComboColor(comboFlow.maxCombo)}` }}>
              <span className="info-label">⚡ 连击击穿</span>
              <span className="info-value" style={{ color: getComboColor(comboFlow.maxCombo) }}>
                {comboFlow.maxCombo} 连击
              </span>
            </div>
          )}
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
          {comboFlow.totalComboScore > 0 && (
            <div
              className="info-row info-row-highlight"
              style={{ borderLeft: `3px solid ${getComboColor(comboFlow.maxCombo)}` }}
            >
              <span className="info-label">连击击穿奖励</span>
              <span
                className="info-value"
                style={{ color: getComboColor(comboFlow.maxCombo) }}
              >
                +{comboFlow.totalComboScore}
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
