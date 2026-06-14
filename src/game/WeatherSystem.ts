import * as THREE from 'three';
import type { Cloud, WeatherConfig, Vector3, WindFieldConfig } from './types';
import { DEFAULT_WIND_FIELD } from './types';

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

    this.initClouds();
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

  public update(delta: number): void {
    this.updateGust(delta);
    this.updateTurbulence(delta);

    if (!this.windField.windDirectionLocked) {
      this.updateWindDirectionVariation(delta);
    }

    this.updateClouds(delta);
  }

  private updateGust(delta: number): void {
    this.gustTimer += delta;
    const gustCycle = this.windField.gustFrequency;

    if (gustCycle > 0 && this.gustTimer >= 1 / gustCycle) {
      this.gustTimer = 0;
      this.targetGustStrength = (Math.random() - 0.3) * this.windField.gustStrength * 2;
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
    void _delta;
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

  private updateClouds(delta: number): void {
    void delta;
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

    if (
      this.clouds.length < this.config.cloudCoverage * 30 &&
      Math.random() < 0.02
    ) {
      this.spawnCloud(false);
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

    this.cloudMeshes.forEach((mesh) => {
      mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (isNight) {
            material.color.setHex(0xaaaaaa);
            material.opacity = 0.6;
          } else {
            material.color.setHex(0xffffff);
            material.opacity = 0.85;
          }
        }
      });
    });
  }

  public setCloudCoverage(coverage: number): void {
    this.config.cloudCoverage = Math.max(0, Math.min(1, coverage));
  }

  public setWindSpeed(speed: number): void {
    this.windField.windSpeed = Math.max(0, Math.min(2, speed));
    this.config.windSpeed = this.windField.windSpeed;
  }

  public setTurbulence(level: number): void {
    this.windField.turbulenceLevel = Math.max(0, Math.min(1, level));
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

  public getWindFieldConfig(): WindFieldConfig {
    return {
      ...this.windField,
      windDirection: { ...this.windField.windDirection },
    };
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

    this.clear();
    this.initClouds();
    this.updateCloudColors();
  }
}
