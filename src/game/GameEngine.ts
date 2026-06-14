import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Kite } from './Kite';
import { FlightController } from './FlightController';
import { AirCurrentSystem } from './AirCurrentSystem';
import { CollisionSystem } from './CollisionSystem';
import { WeatherSystem } from './WeatherSystem';
import { ShadowTrackingSystem } from './ShadowTrackingSystem';
import type {
  GameConfig,
  GameStats,
  GameState,
  FlightParams,
  Building,
  AirCurrent,
} from './types';
import {
  DEFAULT_GAME_CONFIG,
} from './types';
import type { LevelScene, EditorBuilding, EditorAirCurrent } from '../levelEditor/types';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onStateChange: (state: GameState) => void;
  onGameOver: (finalStats: GameStats) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private config: GameConfig;
  private callbacks: GameEngineCallbacks;

  public state: GameState = 'menu';
  public stats: GameStats;

  private sceneManager!: SceneManager;
  private kite!: Kite;
  private flightController!: FlightController;
  private airCurrentSystem!: AirCurrentSystem;
  private collisionSystem!: CollisionSystem;
  private weatherSystem!: WeatherSystem;
  private shadowTrackingSystem!: ShadowTrackingSystem;

  private animationId: number | null = null;
  private lastTime: number = 0;
  private startTime: number = 0;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private previousKitePosition: THREE.Vector3 = new THREE.Vector3();
  private collisions = 0;
  private shadowTrackingAccumulator = 0;
  private shadowTrackingSamples = 0;

  constructor(
    container: HTMLElement,
    callbacks: GameEngineCallbacks,
    config?: GameConfig
  ) {
    this.container = container;
    this.config = config ?? DEFAULT_GAME_CONFIG;
    this.callbacks = callbacks;

    this.stats = {
      score: 0,
      distance: 0,
      height: 80,
      time: 0,
      maxHeight: 80,
      airCurrentCount: 0,
      shadowTracking: 0.5,
      flightStability: 1,
      shadowBonus: 0,
      collisions: 0,
    };
  }

  public init(): void {
    this.sceneManager = new SceneManager(this.container, this.config);
    this.kite = new Kite(this.config);
    this.flightController = new FlightController();
    this.airCurrentSystem = new AirCurrentSystem(
      this.sceneManager.scene,
      this.config
    );
    this.collisionSystem = new CollisionSystem(this.sceneManager.buildings);
    this.weatherSystem = new WeatherSystem(
      this.sceneManager.scene,
      this.config.worldSize,
      {
        windSpeed: this.config.windSpeed,
        windDirection: { x: 1, y: 0, z: 0.3 },
        cloudCoverage: this.config.cloudCoverage,
        timeOfDay: 0.5,
        turbulenceLevel: this.config.turbulenceLevel,
        timeOfDayFrozen: false,
      }
    );
    this.shadowTrackingSystem = new ShadowTrackingSystem(
      this.sceneManager.scene,
      this.config
    );

    this.sceneManager.scene.add(this.kite.group);
    this.sceneManager.scene.add(this.kite.shadowMesh);
    this.sceneManager.scene.add(this.kite.stringMesh);
    this.sceneManager.scene.add(this.kite.trailParticles);

    this.startPosition.copy(this.kite.group.position);
    this.previousKitePosition.copy(this.kite.group.position);
  }

  public start(): void {
    if (this.state === 'playing') return;

    this.state = 'playing';
    this.startTime = performance.now();
    this.lastTime = performance.now();
    this.callbacks.onStateChange(this.state);

    this.animate();
  }

  public pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.callbacks.onStateChange(this.state);

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTime = performance.now();
    this.callbacks.onStateChange(this.state);
    this.animate();
  }

  public restart(): void {
    this.kite.reset();
    this.airCurrentSystem.clear();
    this.shadowTrackingSystem.clear();

    this.shadowTrackingSystem = new ShadowTrackingSystem(
      this.sceneManager.scene,
      this.config
    );

    this.stats = {
      score: 0,
      distance: 0,
      height: 80,
      time: 0,
      maxHeight: 80,
      airCurrentCount: 0,
      shadowTracking: 0.5,
      flightStability: 1,
      shadowBonus: 0,
      collisions: 0,
    };

    this.startPosition.copy(this.kite.group.position);
    this.previousKitePosition.copy(this.kite.group.position);
    this.collisions = 0;
    this.shadowTrackingAccumulator = 0;
    this.shadowTrackingSamples = 0;
    this.startTime = performance.now();
    this.lastTime = performance.now();

    this.callbacks.onStatsUpdate(this.stats);

    if (this.state !== 'playing') {
      this.state = 'playing';
      this.callbacks.onStateChange(this.state);
      this.animate();
    }
  }

  private animate(): void {
    if (this.state !== 'playing') return;

    this.animationId = requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();
    const delta = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(delta);
    this.sceneManager.render();
  }

  private update(delta: number): void {
    this.stats.time = (performance.now() - this.startTime) / 1000;

    this.flightController.update();

    this.weatherSystem.update(delta);

    const timeProgress = !this.weatherSystem.config.timeOfDayFrozen
      ? (this.stats.time % 120) / 120
      : this.weatherSystem.config.timeOfDay;

    if (!this.weatherSystem.config.timeOfDayFrozen) {
      this.weatherSystem.setTimeOfDay(timeProgress);
    }
    this.sceneManager.setSkyColor(timeProgress);
    this.sceneManager.setSunPosition(timeProgress);

    this.shadowTrackingSystem.update(
      delta,
      this.kite.group.position,
      this.kite.velocity,
      timeProgress
    );

    this.stats.shadowTracking = this.shadowTrackingSystem.getTrackingScore();
    this.stats.flightStability = this.shadowTrackingSystem.getFlightStability();

    this.shadowTrackingAccumulator += this.stats.shadowTracking;
    this.shadowTrackingSamples++;

    this.airCurrentSystem.updateShadowTrail(this.shadowTrackingSystem.shadowTrail);

    this.kite.updatePhysics(
      this.flightController.input,
      this.config.gravity,
      delta,
      this.stats.flightStability,
      this.stats.shadowTracking
    );

    const kiteAltitude = this.kite.group.position.y;
    const windForce = this.weatherSystem.getWindForce(kiteAltitude);
    this.kite.applyAirCurrent(windForce, this.stats.shadowTracking, this.stats.flightStability);

    const recommendedPosition = this.shadowTrackingSystem.getRecommendedAirCurrentPosition();
    const shadowBrightness = this.shadowTrackingSystem.getShadowBrightness();

    const airForce = this.airCurrentSystem.update(
      delta,
      this.kite.getPosition(),
      this.weatherSystem.config.turbulenceLevel,
      recommendedPosition,
      shadowBrightness
    );
    if (Math.abs(airForce.x) + Math.abs(airForce.y) + Math.abs(airForce.z) > 0.01) {
      this.kite.applyAirCurrent(airForce, this.stats.shadowTracking, this.stats.flightStability);
      this.stats.airCurrentCount++;
    }

    const collision = this.collisionSystem.checkKiteCollision(this.kite.group.position);
    if (collision.collided) {
      const resolved = this.collisionSystem.resolveCollision(
        this.kite.group.position,
        this.kite.velocity,
        collision
      );
      this.kite.group.position.copy(resolved.position);
      this.kite.velocity.copy(resolved.velocity);
      this.collisions++;
    }

    if (this.collisionSystem.checkGroundCollision(this.kite.group.position)) {
      this.endGame();
      return;
    }

    this.stats.height = this.kite.group.position.y;
    this.stats.maxHeight = Math.max(this.stats.maxHeight, this.stats.height);

    const travelDistance = this.kite.group.position.distanceTo(
      this.previousKitePosition
    );
    this.stats.distance += travelDistance;
    this.previousKitePosition.copy(this.kite.group.position);

    const avgTracking = this.shadowTrackingSamples > 0
      ? this.shadowTrackingAccumulator / this.shadowTrackingSamples
      : 0;

    const shadowBonusScore = Math.floor(
      this.stats.distance * 0.15 * avgTracking +
        this.stats.airCurrentCount * 3 * avgTracking
    );
    this.stats.shadowBonus = shadowBonusScore;

    this.stats.score = Math.floor(
      this.stats.distance * 0.1 +
        this.stats.maxHeight * 2 +
        this.stats.airCurrentCount * 5 +
        shadowBonusScore +
        this.stats.flightStability * 50 -
        this.collisions * 10
    );
    this.stats.score = Math.max(0, this.stats.score);
    this.stats.collisions = this.collisions;

    this.sceneManager.updateCamera(this.kite.group.position);
    this.callbacks.onStatsUpdate(this.stats);
  }

  private endGame(): void {
    this.state = 'gameover';
    this.callbacks.onStateChange(this.state);
    this.callbacks.onGameOver(this.stats);

    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public setFlightParams(params: FlightParams): void {
    if (this.kite) {
      this.kite.setFlightParams(params);
    }
    this.config = {
      ...this.config,
      flightParams: params,
    };
  }

  public getFlightParams(): FlightParams | undefined {
    return this.kite?.getFlightParams();
  }

  public reconfigure(config: Partial<GameConfig> & { weatherConfig?: Partial<import('./types').WeatherConfig> }): void {
    this.config = { ...this.config, ...config };

    this.sceneManager.reconfigure(this.config);
    this.airCurrentSystem.reconfigure(config);

    const weatherConfig: Partial<import('./types').WeatherConfig> = {
      windSpeed: this.config.windSpeed,
      cloudCoverage: this.config.cloudCoverage,
      turbulenceLevel: this.config.turbulenceLevel,
      ...config.weatherConfig,
    };
    this.weatherSystem.reconfigure(this.config.worldSize, weatherConfig);

    this.collisionSystem = new CollisionSystem(this.sceneManager.buildings);
    this.shadowTrackingSystem.clear();
    this.shadowTrackingSystem = new ShadowTrackingSystem(
      this.sceneManager.scene,
      this.config
    );
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }

    this.airCurrentSystem.clear();
    this.weatherSystem.clear();
    this.shadowTrackingSystem.clear();
    this.flightController.dispose();
    this.sceneManager.dispose();
  }

  public getCurrentFlightDataPoint() {
    if (!this.kite) return null;

    const kiteAltitude = this.kite.group.position.y;
    const windForce = this.weatherSystem.getWindForce(kiteAltitude);
    const position = this.kite.getPosition();

    return {
      timestamp: this.stats.time,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
      velocity: {
        x: this.kite.velocity.x,
        y: this.kite.velocity.y,
        z: this.kite.velocity.z,
      },
      rotation: {
        x: this.kite.rotation.x,
        y: this.kite.rotation.y,
        z: this.kite.rotation.z,
      },
      windForce: {
        x: windForce.x,
        y: windForce.y,
        z: windForce.z,
      },
      airCurrentForce: {
        x: 0,
        y: 0,
        z: 0,
      },
      windSpeed: this.weatherSystem.getCurrentWindSpeed(kiteAltitude),
      altitude: kiteAltitude,
      stability: this.stats.flightStability,
      shadowTracking: this.stats.shadowTracking,
    };
  }

  public getWeatherConfig() {
    return { ...this.weatherSystem.config };
  }

  public getWindField() {
    return this.weatherSystem.getWindFieldConfig();
  }

  public setWindField(config: Partial<import('./types').WindFieldConfig>): void {
    this.weatherSystem.setWindField(config);
  }

  public setWeatherConfig(config: Partial<import('./types').WeatherConfig>): void {
    this.weatherSystem.reconfigure(this.config.worldSize, config);
  }

  public loadLevelScene(level: LevelScene): void {
    this.loadBuildings(level.buildings);
    this.loadAirCurrents(level.airCurrents);
    this.setStartPosition(level.startPosition);
    this.setWeatherConfig({
      windSpeed: level.globalSettings.gravity,
      turbulenceLevel: level.globalSettings.turbulence,
    });
    this.config.gravity = level.globalSettings.gravity;
  }

  public loadBuildings(buildings: EditorBuilding[]): void {
    this.sceneManager.clearBuildings();

    const convertedBuildings: Building[] = buildings.map((b) => ({
      id: b.id,
      position: b.position,
      width: b.size.x,
      height: b.size.y,
      depth: b.size.z,
      color: b.color,
    }));

    convertedBuildings.forEach((building) => {
      this.sceneManager.addBuilding(building);
    });

    this.collisionSystem = new CollisionSystem(this.sceneManager.buildings);
  }

  public loadAirCurrents(airCurrents: EditorAirCurrent[]): void {
    this.airCurrentSystem.clear();

    airCurrents.forEach((ac) => {
      const converted: AirCurrent = {
        id: ac.id,
        position: ac.position,
        radius: ac.radius,
        strength: ac.strength,
        direction: ac.direction,
        type: ac.type,
        lifeTime: -1,
        maxLifeTime: -1,
        shadowBrightness: 1,
      };
      this.airCurrentSystem.addPermanentAirCurrent(converted);
    });
  }

  public setStartPosition(position: { x: number; y: number; z: number }): void {
    if (this.kite) {
      this.kite.group.position.set(position.x, position.y, position.z);
      this.kite.reset();
      this.startPosition.copy(this.kite.group.position);
      this.previousKitePosition.copy(this.kite.group.position);
    }
  }

  public checkWinLoseConditions(level: LevelScene): { isWin: boolean; isLose: boolean; reason?: string } {
    const { winCondition, loseCondition, objectives } = level;
    const stats = this.stats;

    let isWin = false;
    let isLose = false;
    let reason: string | undefined;

    const completedObjectives = objectives.filter((obj) => {
      if (obj.completed) return true;
      switch (obj.type) {
        case 'reachPoint':
          if (!obj.position || obj.radius === undefined) return false;
          const dist = Math.sqrt(
            Math.pow(this.kite.group.position.x - obj.position.x, 2) +
            Math.pow(this.kite.group.position.y - obj.position.y, 2) +
            Math.pow(this.kite.group.position.z - obj.position.z, 2)
          );
          return dist < obj.radius;
        case 'scoreTarget':
          return stats.score >= (obj.targetScore ?? obj.targetValue ?? 0);
        case 'timeLimit':
          return stats.time >= (obj.targetTime ?? obj.targetValue ?? 0);
        case 'distanceTarget':
          return stats.distance >= (obj.targetDistance ?? obj.targetValue ?? 0);
        case 'heightTarget':
          return stats.height >= (obj.targetHeight ?? obj.targetValue ?? 0);
        default:
          return false;
      }
    });

    switch (winCondition.type) {
      case 'allObjectives':
        isWin = completedObjectives.length === objectives.length && objectives.length > 0;
        if (isWin) reason = '所有目标已完成！';
        break;
      case 'anyObjective':
        isWin = completedObjectives.length > 0;
        if (isWin) reason = '目标已完成！';
        break;
      case 'scoreThreshold':
        isWin = stats.score >= (winCondition.targetScore ?? 0);
        if (isWin) reason = `达成目标分数 ${winCondition.targetScore}！`;
        break;
    }

    if (loseCondition.enabled) {
      switch (loseCondition.type) {
        case 'timeOut':
          if (stats.time >= (loseCondition.timeLimit ?? 0)) {
            isLose = true;
            reason = `时间超过 ${loseCondition.timeLimit} 秒`;
          }
          break;
        case 'crash':
          if (this.collisionSystem.checkGroundCollision(this.kite.group.position)) {
            isLose = true;
            reason = '坠毁了！';
          }
          break;
        case 'scoreBelow':
          if (stats.time >= (loseCondition.timeLimit ?? 30) && stats.score < (loseCondition.minScore ?? 0)) {
            isLose = true;
            reason = `分数低于 ${loseCondition.minScore}`;
          }
          break;
      }
    }

    return { isWin, isLose, reason };
  }
}
