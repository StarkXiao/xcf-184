import * as THREE from 'three';
import type {
  Cloud,
  WeatherConfig,
  Vector3,
  WindFieldConfig,
  WeatherEventType,
  WeatherEventState,
  WeatherEventConfig,
  LightningStrike,
  TimeOfDayPhase,
} from './types';
import { DEFAULT_WIND_FIELD, DEFAULT_WEATHER_EVENT_CONFIG } from './types';

interface WeatherEventEffect {
  scoreMultiplier: number;
  turbulenceMultiplier: number;
  windSpeedMultiplier: number;
  visibility: number;
  damageMultiplier: number;
  fogDensity: number;
  cloudTarget: number;
  hasLightning: boolean;
  lightningInterval: number;
}

const WEATHER_EVENT_EFFECTS: Record<WeatherEventType, WeatherEventEffect> = {
  clear: {
    scoreMultiplier: 1.0,
    turbulenceMultiplier: 1.0,
    windSpeedMultiplier: 1.0,
    visibility: 1.0,
    damageMultiplier: 1.0,
    fogDensity: 0,
    cloudTarget: 0.3,
    hasLightning: false,
    lightningInterval: 0,
  },
  suddenStorm: {
    scoreMultiplier: 1.8,
    turbulenceMultiplier: 2.5,
    windSpeedMultiplier: 1.8,
    visibility: 0.6,
    damageMultiplier: 1.5,
    fogDensity: 0.3,
    cloudTarget: 0.9,
    hasLightning: false,
    lightningInterval: 0,
  },
  goldenHour: {
    scoreMultiplier: 2.0,
    turbulenceMultiplier: 0.7,
    windSpeedMultiplier: 0.9,
    visibility: 1.0,
    damageMultiplier: 0.8,
    fogDensity: 0.05,
    cloudTarget: 0.4,
    hasLightning: false,
    lightningInterval: 0,
  },
  morningBreeze: {
    scoreMultiplier: 1.3,
    turbulenceMultiplier: 0.5,
    windSpeedMultiplier: 0.7,
    visibility: 0.95,
    damageMultiplier: 0.7,
    fogDensity: 0.15,
    cloudTarget: 0.25,
    hasLightning: false,
    lightningInterval: 0,
  },
  nightFall: {
    scoreMultiplier: 2.5,
    turbulenceMultiplier: 1.2,
    windSpeedMultiplier: 1.1,
    visibility: 0.7,
    damageMultiplier: 1.3,
    fogDensity: 0.1,
    cloudTarget: 0.5,
    hasLightning: false,
    lightningInterval: 0,
  },
  denseFog: {
    scoreMultiplier: 2.2,
    turbulenceMultiplier: 0.9,
    windSpeedMultiplier: 0.6,
    visibility: 0.3,
    damageMultiplier: 2.0,
    fogDensity: 0.6,
    cloudTarget: 0.7,
    hasLightning: false,
    lightningInterval: 0,
  },
  sunBreak: {
    scoreMultiplier: 1.6,
    turbulenceMultiplier: 0.8,
    windSpeedMultiplier: 0.85,
    visibility: 1.0,
    damageMultiplier: 0.6,
    fogDensity: 0,
    cloudTarget: 0.2,
    hasLightning: false,
    lightningInterval: 0,
  },
  thunderStorm: {
    scoreMultiplier: 3.0,
    turbulenceMultiplier: 3.0,
    windSpeedMultiplier: 2.0,
    visibility: 0.4,
    damageMultiplier: 2.5,
    fogDensity: 0.4,
    cloudTarget: 0.95,
    hasLightning: true,
    lightningInterval: 3,
  },
};

export class WeatherSystem {
  public config: WeatherConfig;
  public windField: WindFieldConfig;
  public clouds: Cloud[] = [];
  private scene: THREE.Scene;
  private cloudMeshes: Map<string, THREE.Group> = new Map();
  private worldSize: number;

  private gustPhase: number = 0;
  private gustTimer: number = 0;
  private currentGustStrength: number = 0;
  private targetGustStrength: number = 0;

  private baseWindDirection: Vector3;
  private turbulenceOffset: Vector3 = { x: 0, y: 0, z: 0 };
  private turbulenceTimer: number = 0;

  public weatherEventState: WeatherEventState;
  private weatherEventConfig: WeatherEventConfig;
  private baseCloudCoverage: number;
  private baseTurbulence: number;
  private baseWindSpeed: number;
  private lightningTimer: number = 0;
  private targetCloudCoverage: number;

  constructor(scene: THREE.Scene, worldSize: number, config?: WeatherConfig) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.config = config ?? {
      windSpeed: 0.3,
      windDirection: { x: 1, y: 0, z: 0.3 },
      cloudCoverage: 0.5,
      timeOfDay: 0.5,
      turbulenceLevel: 0.2,
      timeOfDayFrozen: false,
    };

    this.windField = this.config.windField ?? { ...DEFAULT_WIND_FIELD };
    this.baseWindDirection = { ...this.windField.windDirection };
    this.weatherEventConfig = this.config.weatherEventConfig ?? { ...DEFAULT_WEATHER_EVENT_CONFIG };

    this.baseCloudCoverage = this.config.cloudCoverage;
    this.baseTurbulence = this.config.turbulenceLevel;
    this.baseWindSpeed = this.config.windSpeed;
    this.targetCloudCoverage = this.baseCloudCoverage;

    this.weatherEventState = this.createInitialEventState();

    if (this.config.forceWeatherEvent && this.config.forceWeatherEvent !== 'clear') {
      this.triggerWeatherEvent(this.config.forceWeatherEvent, true);
    }

    this.initClouds();
  }

  private createInitialEventState(): WeatherEventState {
    return {
      currentEvent: 'clear',
      eventStartTime: 0,
      eventDuration: 0,
      weatherEventDuration: 0,
      scoreMultiplier: 1.0,
      turbulenceMultiplier: 1.0,
      windSpeedMultiplier: 1.0,
      visibility: 1.0,
      damageMultiplier: 1.0,
      isTransitioning: false,
      transitionProgress: 1,
      lightningStrikes: [],
      activeLightning: null,
      fogDensity: 0,
      nextEventCheckTime: this.weatherEventConfig.eventCheckInterval,
      lastEventEndTime: -this.weatherEventConfig.minEventCooldown,
      eventHistory: [],
    };
  }

  public getTimeOfDayPhase(timeOfDay: number): TimeOfDayPhase {
    if (timeOfDay < 0.15) return 'night';
    if (timeOfDay < 0.25) return 'dawn';
    if (timeOfDay < 0.45) return 'morning';
    if (timeOfDay < 0.65) return 'noon';
    if (timeOfDay < 0.8) return 'afternoon';
    if (timeOfDay < 0.9) return 'sunset';
    return 'night';
  }

  private initClouds(): void {
    const cloudCount = Math.floor(this.config.cloudCoverage * 30);
    for (let i = 0; i < cloudCount; i++) {
      this.spawnCloud(true);
    }
  }

  private spawnCloud(random: boolean = false): void {
    const id = `cloud-${Date.now()}-${Math.random()}`;
    const position: Vector3 = {
      x: random
        ? (Math.random() - 0.5) * this.worldSize * 2
        : this.worldSize,
      y: 80 + Math.random() * 80,
      z: (Math.random() - 0.5) * this.worldSize * 2,
    };

    const cloud: Cloud = {
      id,
      position,
      scale: 2 + Math.random() * 5,
      speed: 0.5 + Math.random() * 1.5,
    };

    this.clouds.push(cloud);
    this.createCloudMesh(cloud);
  }

  private createCloudMesh(cloud: Cloud): void {
    const group = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      roughness: 1.0,
    });

    const puffCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < puffCount; i++) {
      const puffGeometry = new THREE.SphereGeometry(
        1 + Math.random() * 1.5,
        8,
        6
      );
      const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
      puff.position.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 2
      );
      puff.scale.y = 0.6 + Math.random() * 0.3;
      group.add(puff);
    }

    group.scale.setScalar(cloud.scale);
    group.position.set(cloud.position.x, cloud.position.y, cloud.position.z);

    this.cloudMeshes.set(cloud.id, group);
    this.scene.add(group);
  }

  public update(delta: number, gameTime?: number): void {
    const time = gameTime ?? performance.now() / 1000;

    this.updateWeatherEvents(delta, time);
    this.updateGust(delta);
    this.updateTurbulence(delta);

    if (!this.windField.windDirectionLocked) {
      this.updateWindDirectionVariation(delta);
    }

    this.updateClouds(delta);
    this.updateLightning(delta, time);
  }

  private updateWeatherEvents(delta: number, gameTime: number): void {
    const state = this.weatherEventState;
    const eventConfig = this.weatherEventConfig;

    if (!eventConfig.enabled && state.currentEvent === 'clear') {
      return;
    }

    if (state.isTransitioning) {
      state.transitionProgress = Math.min(1, state.transitionProgress + delta * 0.3);
      if (state.transitionProgress >= 1) {
        state.isTransitioning = false;
      }
    }

    const effect = WEATHER_EVENT_EFFECTS[state.currentEvent];
    const t = state.isTransitioning ? state.transitionProgress : 1;
    const clearEffect = WEATHER_EVENT_EFFECTS.clear;

    state.scoreMultiplier = this.lerp(clearEffect.scoreMultiplier, effect.scoreMultiplier, t);
    state.turbulenceMultiplier = this.lerp(clearEffect.turbulenceMultiplier, effect.turbulenceMultiplier, t);
    state.windSpeedMultiplier = this.lerp(clearEffect.windSpeedMultiplier, effect.windSpeedMultiplier, t);
    state.visibility = this.lerp(clearEffect.visibility, effect.visibility, t);
    state.damageMultiplier = this.lerp(clearEffect.damageMultiplier, effect.damageMultiplier, t);
    state.fogDensity = this.lerp(clearEffect.fogDensity, effect.fogDensity, t);

    this.targetCloudCoverage = this.baseCloudCoverage + (effect.cloudTarget - this.baseCloudCoverage) * t;

    if (state.currentEvent !== 'clear') {
      const elapsed = gameTime - state.eventStartTime;
      state.weatherEventDuration = state.eventDuration - elapsed;

      if (elapsed >= state.eventDuration) {
        this.endWeatherEvent(gameTime);
      }
    } else {
      if (gameTime >= state.nextEventCheckTime && eventConfig.enabled) {
        state.nextEventCheckTime = gameTime + eventConfig.eventCheckInterval;

        if (gameTime - state.lastEventEndTime >= eventConfig.minEventCooldown) {
          this.tryTriggerRandomEvent(gameTime);
        }
      }
    }

    this.config.turbulenceLevel = this.baseTurbulence * state.turbulenceMultiplier;
    this.windField.turbulenceLevel = this.config.turbulenceLevel;
    this.windField.windSpeed = this.baseWindSpeed * state.windSpeedMultiplier;
    this.config.windSpeed = this.windField.windSpeed;
  }

  private tryTriggerRandomEvent(gameTime: number): void {
    const eventConfig = this.weatherEventConfig;
    const timeOfDay = this.config.timeOfDay;
    const phase = this.getTimeOfDayPhase(timeOfDay);

    const candidates: { event: WeatherEventType; weight: number }[] = [];

    candidates.push({ event: 'sunBreak', weight: 0.15 });
    candidates.push({ event: 'morningBreeze', weight: phase === 'morning' || phase === 'dawn' ? 0.3 : 0.05 });
    candidates.push({ event: 'goldenHour', weight: phase === 'sunset' || phase === 'afternoon' ? 0.35 : 0.05 });
    candidates.push({ event: 'nightFall', weight: phase === 'sunset' || phase === 'night' ? 0.4 : 0.02 });
    candidates.push({ event: 'suddenStorm', weight: eventConfig.stormProbability });
    candidates.push({ event: 'denseFog', weight: (phase === 'dawn' || phase === 'morning' ? 0.25 : 0.08) * eventConfig.fogProbability * 3 });
    candidates.push({ event: 'thunderStorm', weight: phase === 'afternoon' || phase === 'noon' ? eventConfig.thunderProbability : 0.02 });

    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight <= 0) return;

    let roll = Math.random() * totalWeight;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) {
        this.triggerWeatherEvent(candidate.event, false, gameTime);
        return;
      }
    }
  }

  public triggerWeatherEvent(event: WeatherEventType, force: boolean = false, gameTime?: number): void {
    const time = gameTime ?? performance.now() / 1000;
    const state = this.weatherEventState;
    const effect = WEATHER_EVENT_EFFECTS[event];

    if (!force && state.currentEvent !== 'clear') {
      state.eventHistory.push({
        event: state.currentEvent,
        startTime: state.eventStartTime,
        endTime: time,
      });
    }

    state.currentEvent = event;
    state.eventStartTime = time;
    state.eventDuration = force
      ? 999999
      : this.weatherEventConfig.minEventDuration +
        Math.random() * (this.weatherEventConfig.maxEventDuration - this.weatherEventConfig.minEventDuration);
    state.isTransitioning = true;
    state.transitionProgress = 0;

    if (effect.hasLightning) {
      this.lightningTimer = effect.lightningInterval * Math.random();
    }
  }

  private endWeatherEvent(gameTime: number): void {
    const state = this.weatherEventState;

    state.eventHistory.push({
      event: state.currentEvent,
      startTime: state.eventStartTime,
      endTime: gameTime,
    });

    state.lastEventEndTime = gameTime;
    state.currentEvent = 'clear';
    state.eventStartTime = gameTime;
    state.eventDuration = 0;
    state.isTransitioning = true;
    state.transitionProgress = 0;
    state.weatherEventDuration = 0;
  }

  private updateLightning(delta: number, gameTime: number): void {
    const state = this.weatherEventState;
    const effect = WEATHER_EVENT_EFFECTS[state.currentEvent];

    if (!effect.hasLightning) {
      state.activeLightning = null;
      return;
    }

    this.lightningTimer -= delta;

    if (state.activeLightning) {
      state.activeLightning.duration -= delta;
      if (state.activeLightning.duration <= 0) {
        state.activeLightning = null;
      }
    }

    if (this.lightningTimer <= 0 && !state.activeLightning) {
      const strike: LightningStrike = {
        id: `lightning-${Date.now()}-${Math.random()}`,
        position: {
          x: (Math.random() - 0.5) * this.worldSize * 1.5,
          y: 100 + Math.random() * 100,
          z: (Math.random() - 0.5) * this.worldSize * 1.5,
        },
        startTime: gameTime,
        duration: 0.15 + Math.random() * 0.25,
        maxDuration: 0.4,
        intensity: 0.5 + Math.random() * 0.5,
      };
      strike.maxDuration = strike.duration;
      state.lightningStrikes.push(strike);
      state.activeLightning = strike;
      this.lightningTimer = effect.lightningInterval * (0.5 + Math.random());

      if (state.lightningStrikes.length > 20) {
        state.lightningStrikes = state.lightningStrikes.slice(-20);
      }
    }

    state.lightningStrikes = state.lightningStrikes.filter((s) => {
      return gameTime - s.startTime < 10;
    });
  }

  public checkLightningHit(kitePosition: Vector3): { hit: boolean; distance: number; damage: number } {
    const state = this.weatherEventState;
    if (!state.activeLightning) {
      return { hit: false, distance: Infinity, damage: 0 };
    }

    const dx = kitePosition.x - state.activeLightning.position.x;
    const dy = kitePosition.y - state.activeLightning.position.y;
    const dz = kitePosition.z - state.activeLightning.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const hitRadius = 30;
    const nearMissRadius = 80;

    if (distance < hitRadius) {
      const damage = 50 * state.activeLightning.intensity * state.damageMultiplier;
      return { hit: true, distance, damage };
    }

    if (distance < nearMissRadius) {
      const damage = 10 * (1 - distance / nearMissRadius) * state.damageMultiplier;
      return { hit: false, distance, damage };
    }

    return { hit: false, distance, damage: 0 };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private updateGust(delta: number): void {
    this.gustTimer += delta;
    const gustCycle = this.windField.gustFrequency;

    if (gustCycle > 0 && this.gustTimer >= 1 / gustCycle) {
      this.gustTimer = 0;
      this.targetGustStrength = (Math.random() - 0.3) * this.windField.gustStrength * 2 * this.weatherEventState.windSpeedMultiplier;
    }

    const gustSmooth = 3 * delta;
    this.currentGustStrength += (this.targetGustStrength - this.currentGustStrength) * gustSmooth;
    this.gustPhase += delta * gustCycle * Math.PI * 2;
  }

  private updateTurbulence(delta: number): void {
    this.turbulenceTimer += delta;

    if (this.turbulenceTimer > 0.1) {
      this.turbulenceTimer = 0;
      const turb = this.windField.turbulenceLevel;
      this.turbulenceOffset.x += (Math.random() - 0.5) * turb * 0.1;
      this.turbulenceOffset.y += (Math.random() - 0.5) * turb * 0.05;
      this.turbulenceOffset.z += (Math.random() - 0.5) * turb * 0.1;

      const decay = 0.9;
      this.turbulenceOffset.x *= decay;
      this.turbulenceOffset.y *= decay;
      this.turbulenceOffset.z *= decay;
    }
  }

  private updateWindDirectionVariation(_delta: number): void {
    const variationAmount = 0.005 * this.windField.turbulenceLevel;
    this.windField.windDirection.x += (Math.random() - 0.5) * variationAmount;
    this.windField.windDirection.z += (Math.random() - 0.5) * variationAmount;

    const length = Math.sqrt(
      this.windField.windDirection.x ** 2 +
        this.windField.windDirection.y ** 2 +
        this.windField.windDirection.z ** 2
    );

    if (length > 0) {
      this.windField.windDirection.x /= length;
      this.windField.windDirection.z /= length;
    }

    this.config.windDirection = { ...this.windField.windDirection };
  }

  private updateClouds(_delta: number): void {
    const windSpeed = this.getCurrentWindSpeed(100);

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      const speed = windSpeed * cloud.speed * 0.5;

      cloud.position.x += this.windField.windDirection.x * speed;
      cloud.position.z += this.windField.windDirection.z * speed;

      const mesh = this.cloudMeshes.get(cloud.id);
      if (mesh) {
        mesh.position.x = cloud.position.x;
        mesh.position.z = cloud.position.z;
      }

      if (
        cloud.position.x > this.worldSize + 100 ||
        cloud.position.x < -this.worldSize - 100 ||
        cloud.position.z > this.worldSize + 100 ||
        cloud.position.z < -this.worldSize - 100
      ) {
        if (mesh) {
          this.scene.remove(mesh);
        }
        this.cloudMeshes.delete(cloud.id);
        this.clouds.splice(i, 1);
      }
    }

    const targetCount = Math.floor(this.targetCloudCoverage * 30);
    if (this.clouds.length < targetCount && Math.random() < 0.05) {
      this.spawnCloud(false);
    } else if (this.clouds.length > targetCount + 5) {
      const removeCount = this.clouds.length - targetCount;
      for (let i = 0; i < removeCount && i < 2; i++) {
        const idx = Math.floor(Math.random() * this.clouds.length);
        const cloud = this.clouds[idx];
        const mesh = this.cloudMeshes.get(cloud.id);
        if (mesh) {
          this.scene.remove(mesh);
        }
        this.cloudMeshes.delete(cloud.id);
        this.clouds.splice(idx, 1);
      }
    }
  }

  public getCurrentWindSpeed(altitude: number): number {
    const baseSpeed = this.windField.windSpeed;
    const shearFactor = this.windField.shearFactor;
    const boundaryHeight = this.windField.boundaryLayerHeight;

    const speedMultiplier = altitude < boundaryHeight
      ? Math.pow(altitude / boundaryHeight, 0.3)
      : 1 + (altitude - boundaryHeight) * shearFactor * 0.01;

    const gustEffect = 1 + this.currentGustStrength;

    return baseSpeed * Math.max(0.1, speedMultiplier) * gustEffect;
  }

  public getWindForce(altitude: number = 80): Vector3 {
    const windSpeed = this.getCurrentWindSpeed(altitude);
    const forceScale = 0.02;

    const dirX = this.windField.windDirection.x + this.turbulenceOffset.x;
    const dirY = this.windField.windDirection.y + this.turbulenceOffset.y;
    const dirZ = this.windField.windDirection.z + this.turbulenceOffset.z;

    const length = Math.sqrt(dirX ** 2 + dirY ** 2 + dirZ ** 2);
    if (length > 0) {
      return {
        x: (dirX / length) * windSpeed * forceScale,
        y: (dirY / length) * windSpeed * forceScale * 0.3,
        z: (dirZ / length) * windSpeed * forceScale,
      };
    }

    return {
      x: this.windField.windDirection.x * windSpeed * forceScale,
      y: 0,
      z: this.windField.windDirection.z * windSpeed * forceScale,
    };
  }

  public getWindVector3(altitude: number = 80): THREE.Vector3 {
    const force = this.getWindForce(altitude);
    return new THREE.Vector3(force.x, force.y, force.z);
  }

  public setTimeOfDay(time: number, force: boolean = false): void {
    if (this.config.timeOfDayFrozen && !force) return;

    this.config.timeOfDay = ((time % 1) + 1) % 1;
    this.updateCloudColors();
  }

  private updateCloudColors(): void {
    const isNight =
      this.config.timeOfDay < 0.2 || this.config.timeOfDay > 0.9;
    const isSunset =
      this.config.timeOfDay > 0.7 && this.config.timeOfDay < 0.9;
    const isGoldenHour = this.weatherEventState.currentEvent === 'goldenHour';

    this.cloudMeshes.forEach((mesh) => {
      mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (isNight) {
            material.color.setHex(0xaaaaaa);
            material.opacity = 0.6;
          } else if (isGoldenHour || isSunset) {
            material.color.setHex(0xffccaa);
            material.opacity = 0.9;
          } else if (this.weatherEventState.currentEvent === 'thunderStorm' || this.weatherEventState.currentEvent === 'suddenStorm') {
            material.color.setHex(0x555566);
            material.opacity = 0.95;
          } else {
            material.color.setHex(0xffffff);
            material.opacity = 0.85;
          }
        }
      });
    });
  }

  public setCloudCoverage(coverage: number): void {
    this.baseCloudCoverage = Math.max(0, Math.min(1, coverage));
    this.config.cloudCoverage = this.baseCloudCoverage;
  }

  public setWindSpeed(speed: number): void {
    this.baseWindSpeed = Math.max(0, Math.min(2, speed));
    this.windField.windSpeed = this.baseWindSpeed * this.weatherEventState.windSpeedMultiplier;
    this.config.windSpeed = this.windField.windSpeed;
  }

  public setTurbulence(level: number): void {
    this.baseTurbulence = Math.max(0, Math.min(1, level));
    this.windField.turbulenceLevel = this.baseTurbulence * this.weatherEventState.turbulenceMultiplier;
    this.config.turbulenceLevel = this.windField.turbulenceLevel;
  }

  public setWindDirection(direction: Vector3): void {
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (length > 0) {
      this.windField.windDirection = {
        x: direction.x / length,
        y: direction.y / length,
        z: direction.z / length,
      };
      this.baseWindDirection = { ...this.windField.windDirection };
      this.config.windDirection = { ...this.windField.windDirection };
    }
  }

  public setGustStrength(strength: number): void {
    this.windField.gustStrength = Math.max(0, Math.min(1, strength));
  }

  public setGustFrequency(frequency: number): void {
    this.windField.gustFrequency = Math.max(0, Math.min(1, frequency));
  }

  public setShearFactor(factor: number): void {
    this.windField.shearFactor = Math.max(0, Math.min(1, factor));
  }

  public setBoundaryLayerHeight(height: number): void {
    this.windField.boundaryLayerHeight = Math.max(10, Math.min(200, height));
  }

  public setWindDirectionLocked(locked: boolean): void {
    this.windField.windDirectionLocked = locked;
    if (locked) {
      this.windField.windDirection = { ...this.baseWindDirection };
      this.config.windDirection = { ...this.baseWindDirection };
    }
  }

  public setTimeOfDayFrozen(frozen: boolean): void {
    this.config.timeOfDayFrozen = frozen;
  }

  public setWindField(config: Partial<WindFieldConfig>): void {
    if (config.windSpeed !== undefined) this.setWindSpeed(config.windSpeed);
    if (config.windDirection !== undefined) this.setWindDirection(config.windDirection);
    if (config.turbulenceLevel !== undefined) this.setTurbulence(config.turbulenceLevel);
    if (config.gustStrength !== undefined) this.setGustStrength(config.gustStrength);
    if (config.gustFrequency !== undefined) this.setGustFrequency(config.gustFrequency);
    if (config.shearFactor !== undefined) this.setShearFactor(config.shearFactor);
    if (config.boundaryLayerHeight !== undefined) this.setBoundaryLayerHeight(config.boundaryLayerHeight);
    if (config.windDirectionLocked !== undefined) this.setWindDirectionLocked(config.windDirectionLocked);
  }

  public setWeatherEventConfig(config: Partial<WeatherEventConfig>): void {
    this.weatherEventConfig = { ...this.weatherEventConfig, ...config };
  }

  public getWindFieldConfig(): WindFieldConfig {
    return {
      ...this.windField,
      windDirection: { ...this.windField.windDirection },
    };
  }

  public getWeatherEventState(): WeatherEventState {
    return { ...this.weatherEventState };
  }

  public getFogDensity(): number {
    return this.weatherEventState.fogDensity;
  }

  public getScoreMultiplier(): number {
    return this.weatherEventState.scoreMultiplier;
  }

  public getDamageMultiplier(): number {
    return this.weatherEventState.damageMultiplier;
  }

  public getVisibility(): number {
    return this.weatherEventState.visibility;
  }

  public getActiveLightning(): LightningStrike | null {
    return this.weatherEventState.activeLightning;
  }

  public clear(): void {
    this.clouds.forEach((cloud) => {
      const mesh = this.cloudMeshes.get(cloud.id);
      if (mesh) {
        this.scene.remove(mesh);
      }
    });
    this.clouds = [];
    this.cloudMeshes.clear();
  }

  public reconfigure(worldSize: number, config: Partial<WeatherConfig>): void {
    this.worldSize = worldSize;

    if (config.windSpeed !== undefined) this.setWindSpeed(config.windSpeed);
    if (config.cloudCoverage !== undefined) this.setCloudCoverage(config.cloudCoverage);
    if (config.turbulenceLevel !== undefined) this.setTurbulence(config.turbulenceLevel);
    if (config.windDirection !== undefined) this.setWindDirection(config.windDirection);
    if (config.timeOfDay !== undefined) {
      this.config.timeOfDay = config.timeOfDay;
    }
    if (config.timeOfDayFrozen !== undefined) {
      this.setTimeOfDayFrozen(config.timeOfDayFrozen);
    }
    if (config.windField) {
      this.setWindField(config.windField);
    }
    if (config.weatherEventConfig) {
      this.setWeatherEventConfig(config.weatherEventConfig);
    }
    if (config.forceWeatherEvent) {
      this.triggerWeatherEvent(config.forceWeatherEvent, true);
    }

    this.clear();
    this.initClouds();
    this.updateCloudColors();
  }
}
