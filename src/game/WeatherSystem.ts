import * as THREE from 'three';
import type { Cloud, WeatherConfig, Vector3 } from './types';

export class WeatherSystem {
  public config: WeatherConfig;
  public clouds: Cloud[] = [];
  private scene: THREE.Scene;
  private cloudMeshes: Map<string, THREE.Group> = new Map();
  private worldSize: number;

  constructor(scene: THREE.Scene, worldSize: number, config?: WeatherConfig) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.config = config ?? {
      windSpeed: 0.3,
      windDirection: { x: 1, y: 0, z: 0.3 },
      cloudCoverage: 0.5,
      timeOfDay: 0.5,
      turbulenceLevel: 0.2,
    };

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

  public update(_delta: number): void {
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      const speed = this.config.windSpeed * cloud.speed;

      cloud.position.x += this.config.windDirection.x * speed;
      cloud.position.z += this.config.windDirection.z * speed;

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

    this.config.windDirection.x += (Math.random() - 0.5) * 0.005;
    this.config.windDirection.z += (Math.random() - 0.5) * 0.005;
    const length = Math.sqrt(
      this.config.windDirection.x ** 2 +
        this.config.windDirection.y ** 2 +
        this.config.windDirection.z ** 2
    );
    this.config.windDirection.x /= length;
    this.config.windDirection.z /= length;
  }

  public getWindForce(): Vector3 {
    return {
      x: this.config.windDirection.x * this.config.windSpeed * 0.02,
      y: 0,
      z: this.config.windDirection.z * this.config.windSpeed * 0.02,
    };
  }

  public setTimeOfDay(time: number): void {
    this.config.timeOfDay = ((time % 1) + 1) % 1;

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
    this.config.windSpeed = Math.max(0, Math.min(2, speed));
  }

  public setTurbulence(level: number): void {
    this.config.turbulenceLevel = Math.max(0, Math.min(1, level));
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
}
