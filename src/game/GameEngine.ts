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
} from './types';
import {
  DEFAULT_GAME_CONFIG,
} from './types';

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
      this.config.worldSize
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

    const timeProgress = (this.stats.time % 120) / 120;
    this.weatherSystem.update(delta);
    this.weatherSystem.setTimeOfDay(timeProgress);
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

    const windForce = this.weatherSystem.getWindForce();
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
}
