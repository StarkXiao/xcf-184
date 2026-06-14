import * as THREE from 'three';
import type { AirCurrent, GameConfig, Vector3 } from './types';

export class AirCurrentSystem {
  public airCurrents: AirCurrent[] = [];
  private scene: THREE.Scene;
  private config: GameConfig;
  private visualMeshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  public spawnAirCurrent(
    position: Vector3,
    type: 'updraft' | 'downdraft' | 'turbulence',
    strength?: number
  ): void {
    const id = `air-${Date.now()}-${Math.random()}`;
    const currentStrength =
      strength ??
      this.config.minAirCurrentStrength +
        Math.random() *
          (this.config.maxAirCurrentStrength -
            this.config.minAirCurrentStrength);

    const radius = 15 + Math.random() * 25;

    let direction: Vector3;
    switch (type) {
      case 'updraft':
        direction = { x: 0, y: currentStrength, z: 0 };
        break;
      case 'downdraft':
        direction = { x: 0, y: -currentStrength * 0.6, z: 0 };
        break;
      case 'turbulence':
        direction = {
          x: (Math.random() - 0.5) * currentStrength,
          y: (Math.random() - 0.5) * currentStrength * 0.5,
          z: (Math.random() - 0.5) * currentStrength,
        };
        break;
    }

    const airCurrent: AirCurrent = {
      id,
      position,
      radius,
      strength: currentStrength,
      direction,
      type,
      lifeTime: 0,
      maxLifeTime: 8 + Math.random() * 12,
    };

    this.airCurrents.push(airCurrent);
    this.createVisual(airCurrent);
  }

  private createVisual(airCurrent: AirCurrent): void {
    const group = new THREE.Group();

    const particleCount = 40;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color =
      airCurrent.type === 'updraft'
        ? [0.4, 0.8, 1.0]
        : airCurrent.type === 'downdraft'
          ? [1.0, 0.5, 0.3]
          : [0.8, 0.6, 1.0];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * airCurrent.radius;

      positions[i * 3] = airCurrent.position.x + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = airCurrent.position.y + r * Math.cos(phi);
      positions[i * 3 + 2] = airCurrent.position.z + r * Math.sin(phi) * Math.sin(theta);

      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    const ringGeometry = new THREE.TorusGeometry(airCurrent.radius, 0.3, 8, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0], color[1], color[2]),
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    group.position.set(
      airCurrent.position.x,
      airCurrent.position.y,
      airCurrent.position.z
    );

    this.visualMeshes.set(airCurrent.id, group);
    this.scene.add(group);
  }

  public update(
    delta: number,
    kitePosition: THREE.Vector3,
    turbulenceLevel: number
  ): Vector3 {
    let totalForce: Vector3 = { x: 0, y: 0, z: 0 };

    if (Math.random() < this.config.airCurrentSpawnRate) {
      const spawnX = kitePosition.x + (Math.random() - 0.5) * 200;
      const spawnY = 30 + Math.random() * 120;
      const spawnZ = kitePosition.z - 50 - Math.random() * 150;

      const types: Array<'updraft' | 'downdraft' | 'turbulence'> = [
        'updraft',
        'updraft',
        'turbulence',
        'downdraft',
      ];
      const type = types[Math.floor(Math.random() * types.length)];

      this.spawnAirCurrent(
        { x: spawnX, y: spawnY, z: spawnZ },
        type
      );
    }

    for (let i = this.airCurrents.length - 1; i >= 0; i--) {
      const current = this.airCurrents[i];
      current.lifeTime += delta;

      const distance = Math.sqrt(
        (kitePosition.x - current.position.x) ** 2 +
          (kitePosition.y - current.position.y) ** 2 +
          (kitePosition.z - current.position.z) ** 2
      );

      if (distance < current.radius) {
        const falloff = 1 - distance / current.radius;
        const turbulence = turbulenceLevel * (Math.random() - 0.5) * 0.1;

        totalForce.x += current.direction.x * falloff + turbulence;
        totalForce.y += current.direction.y * falloff;
        totalForce.z += current.direction.z * falloff + turbulence;
      }

      this.updateVisual(current);

      if (current.lifeTime > current.maxLifeTime) {
        const mesh = this.visualMeshes.get(current.id);
        if (mesh) {
          this.scene.remove(mesh);
        }
        this.visualMeshes.delete(current.id);
        this.airCurrents.splice(i, 1);
      }
    }

    return totalForce;
  }

  private updateVisual(airCurrent: AirCurrent): void {
    const mesh = this.visualMeshes.get(airCurrent.id);
    if (!mesh) return;

    const lifeRatio = airCurrent.lifeTime / airCurrent.maxLifeTime;
    const fadeFactor =
      lifeRatio < 0.1
        ? lifeRatio / 0.1
        : lifeRatio > 0.8
          ? (1 - lifeRatio) / 0.2
          : 1;

    mesh.children.forEach((child) => {
      if (child instanceof THREE.Points) {
        (child.material as THREE.PointsMaterial).opacity =
          0.5 * fadeFactor;

        const positions = child.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          if (airCurrent.type === 'updraft') {
            positions[i + 1] += 0.5;
            if (
              positions[i + 1] >
              airCurrent.position.y + airCurrent.radius
            ) {
              positions[i + 1] =
                airCurrent.position.y - airCurrent.radius;
            }
          } else if (airCurrent.type === 'downdraft') {
            positions[i + 1] -= 0.3;
            if (
              positions[i + 1] <
              airCurrent.position.y - airCurrent.radius
            ) {
              positions[i + 1] =
                airCurrent.position.y + airCurrent.radius;
            }
          } else {
            positions[i] += (Math.random() - 0.5) * 0.5;
            positions[i + 1] += (Math.random() - 0.5) * 0.5;
            positions[i + 2] += (Math.random() - 0.5) * 0.5;
          }
        }
        child.geometry.attributes.position.needsUpdate = true;
      } else if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshBasicMaterial).opacity =
          0.3 * fadeFactor;
        child.rotation.z += 0.01;
      }
    });
  }

  public clear(): void {
    this.airCurrents.forEach((current) => {
      const mesh = this.visualMeshes.get(current.id);
      if (mesh) {
        this.scene.remove(mesh);
      }
    });
    this.airCurrents = [];
    this.visualMeshes.clear();
  }
}
