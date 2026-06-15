import * as THREE from 'three';
import type { Building } from './types';

export interface CollisionResult {
  collided: boolean;
  normal: THREE.Vector3;
  penetration: number;
  damage: number;
  impactVelocity: number;
}

export class CollisionSystem {
  private buildings: { mesh: THREE.Mesh; data: Building }[];
  private collisionDamageMultiplier: number = 1.0;
  private baseCollisionDamage: number = 25;

  constructor(buildings: { mesh: THREE.Mesh; data: Building }[]) {
    this.buildings = buildings;
  }

  public setDamageConfig(baseDamage: number, multiplier: number = 1.0): void {
    this.baseCollisionDamage = baseDamage;
    this.collisionDamageMultiplier = multiplier;
  }

  public checkKiteCollision(
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    kiteRadius: number = 3
  ): CollisionResult {
    let result: CollisionResult = {
      collided: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      damage: 0,
      impactVelocity: 0,
    };

    for (const building of this.buildings) {
      const collision = this.checkBoxCollision(
        kitePosition,
        kiteVelocity,
        kiteRadius,
        building.data.position,
        building.data.width,
        building.data.height,
        building.data.depth
      );

      if (collision.collided) {
        result = collision;
        break;
      }
    }

    return result;
  }

  private checkBoxCollision(
    kitePos: THREE.Vector3,
    kiteVel: THREE.Vector3,
    kiteRadius: number,
    boxCenter: { x: number; y: number; z: number },
    boxWidth: number,
    boxHeight: number,
    boxDepth: number
  ): CollisionResult {
    const halfW = boxWidth / 2;
    const halfH = boxHeight / 2;
    const halfD = boxDepth / 2;

    const minX = boxCenter.x - halfW;
    const maxX = boxCenter.x + halfW;
    const minY = boxCenter.y - halfH;
    const maxY = boxCenter.y + halfH;
    const minZ = boxCenter.z - halfD;
    const maxZ = boxCenter.z + halfD;

    const closestX = Math.max(minX, Math.min(kitePos.x, maxX));
    const closestY = Math.max(minY, Math.min(kitePos.y, maxY));
    const closestZ = Math.max(minZ, Math.min(kitePos.z, maxZ));

    const distanceX = kitePos.x - closestX;
    const distanceY = kitePos.y - closestY;
    const distanceZ = kitePos.z - closestZ;

    const distanceSquared =
      distanceX * distanceX +
      distanceY * distanceY +
      distanceZ * distanceZ;

    if (distanceSquared < kiteRadius * kiteRadius) {
      const distance = Math.sqrt(distanceSquared);
      const normal = new THREE.Vector3(
        distanceX / (distance || 1),
        distanceY / (distance || 1),
        distanceZ / (distance || 1)
      );

      const impactVelocity = Math.abs(kiteVel.dot(normal));
      const speedFactor = Math.min(2, impactVelocity * 0.5);
      const damage = this.baseCollisionDamage * (0.5 + speedFactor * 0.5) * this.collisionDamageMultiplier;

      return {
        collided: true,
        normal,
        penetration: kiteRadius - distance,
        damage,
        impactVelocity,
      };
    }

    return {
      collided: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      damage: 0,
      impactVelocity: 0,
    };
  }

  public resolveCollision(
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    collision: CollisionResult
  ): { position: THREE.Vector3; velocity: THREE.Vector3; damage: number } {
    const newPosition = kitePosition
      .clone()
      .add(collision.normal.multiplyScalar(collision.penetration * 1.5));

    const bounceFactor = 0.3 + (collision.damage / this.baseCollisionDamage) * 0.2;
    const reflection = kiteVelocity
      .clone()
      .reflect(collision.normal)
      .multiplyScalar(bounceFactor);

    return {
      position: newPosition,
      velocity: reflection,
      damage: collision.damage,
    };
  }

  public checkGroundCollision(
    kitePosition: THREE.Vector3,
    minHeight: number = 5
  ): boolean {
    return kitePosition.y <= minHeight;
  }

  public checkOutOfBounds(
    kitePosition: THREE.Vector3,
    worldSize: number
  ): boolean {
    return (
      Math.abs(kitePosition.x) > worldSize ||
      Math.abs(kitePosition.z) > worldSize
    );
  }
}
