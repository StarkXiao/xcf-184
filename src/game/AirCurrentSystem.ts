import * as THREE from 'three';
import type { AirCurrent, GameConfig, Vector3, ShadowTrailPoint, ZoneAirCurrentConfig } from './types';

export class AirCurrentSystem {
  public airCurrents: AirCurrent[] = [];
  private scene: THREE.Scene;
  private config: GameConfig;
  private visualMeshes: Map<string, THREE.Group> = new Map();
  private shadowTrail: ShadowTrailPoint[] = [];
  private zoneConfigs: ZoneAirCurrentConfig[] = [];
  private permanentCurrentsPlaced: boolean = false;

  constructor(scene: THREE.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
    this.zoneConfigs = config.zoneAirCurrentConfigs ?? [];
  }

  public updateShadowTrail(trail: ShadowTrailPoint[]): void {
    this.shadowTrail = trail.slice();
  }

  private getZoneConfigForPosition(x: number, z: number): ZoneAirCurrentConfig | null {
    for (const zone of this.zoneConfigs) {
      // Check position approximately by zoneId hash if no bounding box
      if (this.zoneConfigs.length > 0) {
        // If zone has permanent positions, use zone directly
        if (zone.permanentCurrentPositions && zone.permanentCurrentPositions.length > 0) {
          return zone;
        }
        // Approximate zone mapping: distribute zones across world
        const zoneIndex = this.zoneConfigs.indexOf(zone);
        const divisions = Math.ceil(Math.sqrt(this.zoneConfigs.length));
        const half = this.config.worldSize / 2;
        const divisionSize = this.config.worldSize / divisions;
        const gx = Math.floor((x + half) / divisionSize);
        const gz = Math.floor((z + half) / divisionSize);
        const idx = gx + gz * divisions;
        if (idx === zoneIndex || idx % this.zoneConfigs.length === zoneIndex) {
          return zone;
        }
      }
    }
    return this.zoneConfigs.length > 0 ? this.zoneConfigs[0] : null;
  }

  public placePermanentAirCurrents(): void {
    if (this.permanentCurrentsPlaced) return;

    this.zoneConfigs.forEach((zone) => {
      if (zone.permanentCurrentPositions) {
        zone.permanentCurrentPositions.forEach((pos, idx) => {
          const id = `perm-${zone.zoneId}-${idx}`;
          const existing = this.airCurrents.find((a) => a.id === id);
          if (existing) return;

          let direction: Vector3;
          switch (pos.type) {
            case 'updraft':
              direction = { x: 0, y: pos.strength, z: 0 };
              break;
            case 'downdraft':
              direction = { x: 0, y: -pos.strength * 0.6, z: 0 };
              break;
            case 'turbulence':
            default:
              direction = {
                x: (Math.random() - 0.5) * pos.strength,
                y: (Math.random() - 0.5) * pos.strength * 0.5,
                z: (Math.random() - 0.5) * pos.strength,
              };
              break;
          }

          const airCurrent: AirCurrent = {
            id,
            position: pos.position,
            radius: pos.radius,
            strength: pos.strength,
            direction,
            type: pos.type,
            lifeTime: -1,
            maxLifeTime: -1,
            shadowBrightness: 0.8,
          };

          this.addPermanentAirCurrent(airCurrent);
        });
      }
    });

    this.permanentCurrentsPlaced = true;
  }

  public spawnAirCurrent(
    position: Vector3,
    type: 'updraft' | 'downdraft' | 'turbulence',
    strength?: number,
    shadowBrightness: number = 0.5
  ): void {
    const id = `air-${Date.now()}-${Math.random()}`;
    const brightnessMultiplier = 0.5 + shadowBrightness * 1.0;
    const currentStrength =
      (strength ??
        this.config.minAirCurrentStrength +
          Math.random() *
            (this.config.maxAirCurrentStrength -
              this.config.minAirCurrentStrength)) * brightnessMultiplier;

    const radius = (15 + Math.random() * 25) * (0.8 + shadowBrightness * 0.6);

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
      shadowBrightness,
    };

    this.airCurrents.push(airCurrent);
    this.createVisual(airCurrent);
  }

  private createVisual(airCurrent: AirCurrent): void {
    const group = new THREE.Group();

    const particleCount = Math.floor(40 * (0.7 + airCurrent.shadowBrightness * 0.8));
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const baseColor =
      airCurrent.type === 'updraft'
        ? [0.4, 0.8, 1.0]
        : airCurrent.type === 'downdraft'
          ? [1.0, 0.5, 0.3]
          : [0.8, 0.6, 1.0];

    const brightnessBoost = 0.6 + airCurrent.shadowBrightness * 0.4;
    const color = baseColor.map((c) => Math.min(1, c * brightnessBoost)) as [number, number, number];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * airCurrent.radius;

      positions[i * 3] = airCurrent.position.x + r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = airCurrent.position.y + r * Math.cos(phi);
      positions[i * 3 + 2] = airCurrent.position.z + r * Math.sin(phi) * Math.sin(theta);

      const jitter = 0.85 + Math.random() * 0.3;
      colors[i * 3] = color[0] * jitter;
      colors[i * 3 + 1] = color[1] * jitter;
      colors[i * 3 + 2] = color[2] * jitter;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8 + airCurrent.shadowBrightness * 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.4 + airCurrent.shadowBrightness * 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);

    const ringGeometry = new THREE.TorusGeometry(airCurrent.radius, 0.3 + airCurrent.shadowBrightness * 0.3, 8, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color[0], color[1], color[2]),
      transparent: true,
      opacity: 0.2 + airCurrent.shadowBrightness * 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    if (airCurrent.shadowBrightness > 0.7) {
      const innerRingGeometry = new THREE.TorusGeometry(airCurrent.radius * 0.6, 0.15, 8, 48);
      const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25 * (airCurrent.shadowBrightness - 0.7) / 0.3,
        side: THREE.DoubleSide,
      });
      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      innerRing.rotation.x = Math.PI / 2;
      group.add(innerRing);
    }

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
    turbulenceLevel: number,
    recommendedPosition: Vector3 | null,
    shadowBrightness: number
  ): Vector3 {
    const totalForce: Vector3 = { x: 0, y: 0, z: 0 };

    if (!this.permanentCurrentsPlaced && this.zoneConfigs.length > 0) {
      this.placePermanentAirCurrents();
    }

    const zoneConfig = this.getZoneConfigForPosition(kitePosition.x, kitePosition.z);
    const effectiveSpawnRate = zoneConfig
      ? zoneConfig.baseSpawnRate * (0.8 + shadowBrightness * 0.8)
      : this.config.airCurrentSpawnRate * (0.8 + shadowBrightness * 0.8);

    if (Math.random() < effectiveSpawnRate) {
      let spawnPosition: Vector3;
      let effectiveBrightness = shadowBrightness;

      if (recommendedPosition && Math.random() < 0.75) {
        spawnPosition = {
          x: recommendedPosition.x + (Math.random() - 0.5) * 40,
          y: recommendedPosition.y + (Math.random() - 0.5) * 30,
          z: recommendedPosition.z + (Math.random() - 0.5) * 40,
        };

        if (this.shadowTrail.length > 0) {
          let maxBrightness = 0;
          for (const point of this.shadowTrail) {
            const dist = Math.sqrt(
              (spawnPosition.x - point.x) ** 2 + (spawnPosition.z - point.z) ** 2
            );
            if (dist < 40) {
              maxBrightness = Math.max(maxBrightness, point.brightness);
            }
          }
          if (maxBrightness > 0) {
            effectiveBrightness = maxBrightness;
          }
        }
      } else if (this.shadowTrail.length > 5 && Math.random() < 0.5) {
        const trailIndex = Math.floor(Math.random() * Math.min(15, this.shadowTrail.length - 1));
        const trailPoint = this.shadowTrail[trailIndex];
        spawnPosition = {
          x: trailPoint.x + (Math.random() - 0.5) * 50,
          y: 30 + Math.random() * 100,
          z: trailPoint.z + (Math.random() - 0.5) * 50,
        };
        effectiveBrightness = trailPoint.brightness;
      } else {
        spawnPosition = {
          x: kitePosition.x + (Math.random() - 0.5) * 200,
          y: 30 + Math.random() * 120,
          z: kitePosition.z - 50 - Math.random() * 150,
        };
      }

      const spawnZoneConfig = this.getZoneConfigForPosition(spawnPosition.x, spawnPosition.z);

      let types: Array<'updraft' | 'downdraft' | 'turbulence'>;
      let minStrength: number;
      let maxStrength: number;
      let radiusMultiplier: number;

      if (spawnZoneConfig) {
        types = spawnZoneConfig.preferredTypes;
        minStrength = spawnZoneConfig.minStrength;
        maxStrength = spawnZoneConfig.maxStrength;
        radiusMultiplier = spawnZoneConfig.radiusMultiplier;
      } else {
        types = ['updraft', 'updraft', 'turbulence', 'downdraft'];
        minStrength = this.config.minAirCurrentStrength;
        maxStrength = this.config.maxAirCurrentStrength;
        radiusMultiplier = 1.0;
      }

      const brightTypes: Array<'updraft' | 'downdraft' | 'turbulence'> =
        spawnZoneConfig?.preferredTypes.filter((t) => t === 'updraft').length >= 2
          ? spawnZoneConfig.preferredTypes
          : ['updraft', 'updraft', 'updraft', 'turbulence'];

      const useBright = effectiveBrightness > 0.6;
      const typePool = useBright ? brightTypes : types;
      const type = typePool[Math.floor(Math.random() * typePool.length)];

      const strengthRange = maxStrength - minStrength;
      const baseStrength = minStrength + Math.random() * strengthRange;
      const adjustedStrength = baseStrength * (0.8 + effectiveBrightness * 0.6);

      this.spawnAirCurrent(
        spawnPosition,
        type,
        adjustedStrength,
        effectiveBrightness
      );

      if (radiusMultiplier !== 1.0 && this.airCurrents.length > 0) {
        const lastCurrent = this.airCurrents[this.airCurrents.length - 1];
        lastCurrent.radius *= radiusMultiplier;
        const mesh = this.visualMeshes.get(lastCurrent.id);
        if (mesh) {
          mesh.scale.setScalar(radiusMultiplier);
        }
      }
    }

    for (let i = this.airCurrents.length - 1; i >= 0; i--) {
      const current = this.airCurrents[i];

      const isPermanent = current.lifeTime < 0;
      if (!isPermanent) {
        current.lifeTime += delta;
      }

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

      if (!isPermanent && current.lifeTime > current.maxLifeTime) {
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

    const isPermanent = airCurrent.lifeTime < 0;
    const fadeFactor = isPermanent ? 1 : (() => {
      const lifeRatio = airCurrent.lifeTime / airCurrent.maxLifeTime;
      return lifeRatio < 0.1
        ? lifeRatio / 0.1
        : lifeRatio > 0.8
          ? (1 - lifeRatio) / 0.2
          : 1;
    })();

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
    this.permanentCurrentsPlaced = false;
  }

  public reconfigure(config: Partial<GameConfig>): void {
    if (config.airCurrentSpawnRate !== undefined) {
      this.config.airCurrentSpawnRate = config.airCurrentSpawnRate;
    }
    if (config.minAirCurrentStrength !== undefined) {
      this.config.minAirCurrentStrength = config.minAirCurrentStrength;
    }
    if (config.maxAirCurrentStrength !== undefined) {
      this.config.maxAirCurrentStrength = config.maxAirCurrentStrength;
    }
    if (config.zoneAirCurrentConfigs !== undefined) {
      this.zoneConfigs = config.zoneAirCurrentConfigs;
    }
    if (config.worldSize !== undefined) {
      this.config.worldSize = config.worldSize;
    }
    this.clear();
  }

  public addPermanentAirCurrent(airCurrent: AirCurrent): void {
    this.airCurrents.push(airCurrent);
    this.createVisual(airCurrent);
  }
}
