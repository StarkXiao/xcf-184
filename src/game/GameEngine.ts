import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { Kite } from './Kite';
import { FlightController } from './FlightController';
import { AirCurrentSystem } from './AirCurrentSystem';
import { CollisionSystem } from './CollisionSystem';
import { WeatherSystem } from './WeatherSystem';
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

  private animationId: number | null = null;
  private lastTime: number = 0;
  private startTime: number = 0;
  private startPosition: THREE.Vector3 = new THREE.Vector3();
  private previousKitePosition: THREE.Vector3 = new THREE.Vector3();
  private collisions = 0;

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

    this.stats = {
      score: 0,
      distance: 0,
      height: 80,
      time: 0,
      maxHeight: 80,
      airCurrentCount: 0,
    };

    this.startPosition.copy(this.kite.group.position);
    this.previousKitePosition.copy(this.kite.group.position);
    this.collisions = 0;
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

    this.kite.updatePhysics(this.flightController.input, this.config.gravity, delta);

    this.weatherSystem.update(delta);
    const windForce = this.weatherSystem.getWindForce();
    this.kite.applyAirCurrent(windForce);

    const airForce = this.airCurrentSystem.update(
      delta,
      this.kite.getPosition(),
      this.weatherSystem.config.turbulenceLevel
    );
    if (Math.abs(airForce.x) + Math.abs(airForce.y) + Math.abs(airForce.z) > 0.01) {
      this.kite.applyAirCurrent(airForce);
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

    this.stats.score = Math.floor(
      this.stats.distance * 0.1 +
        this.stats.maxHeight * 2 +
        this.stats.airCurrentCount * 5 -
        this.collisions * 10
    );
    this.stats.score = Math.max(0, this.stats.score);

    const timeProgress = (this.stats.time % 120) / 120;
    this.weatherSystem.setTimeOfDay(timeProgress);
    this.sceneManager.setSkyColor(timeProgress);
    this.sceneManager.setSunPosition(timeProgress);

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
    this.flightController.dispose();
    this.sceneManager.dispose();
  }
}
