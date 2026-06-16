import * as THREE from 'three';
import type { Building, Obstacle } from './types';

export interface CollisionResult {
  collided: boolean;
  normal: THREE.Vector3;
  penetration: number;
  damage: number;
  impactVelocity: number;
  obstacleId?: string;
  obstacleType?: string;
  collisionType: 'building' | 'obstacle' | 'none';
}

export interface ObstacleCollisionResult extends CollisionResult {
  obstacleId: string;
  obstacleType: string;
}

export class CollisionSystem {
  private buildings: { mesh: THREE.Mesh; data: Building }[];
  private obstacles: { data: Obstacle; mesh: THREE.Group }[] = [];
  private collisionDamageMultiplier: number = 1.0;
  private baseCollisionDamage: number = 25;
  private obstacleDamageMultiplier: number = 1.0;

  constructor(buildings: { mesh: THREE.Mesh; data: Building }[]) {
    this.buildings = buildings;
  }

  public setDamageConfig(baseDamage: number, multiplier: number = 1.0): void {
    this.baseCollisionDamage = baseDamage;
    this.collisionDamageMultiplier = multiplier;
  }

  public setObstacleDamageMultiplier(multiplier: number): void {
    this.obstacleDamageMultiplier = multiplier;
  }

  public setObstacles(obstacles: { data: Obstacle; mesh: THREE.Group }[]): void {
    this.obstacles = obstacles;
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
      collisionType: 'none',
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
        result = { ...collision, collisionType: 'building' };
        break;
      }
    }

    if (!result.collided) {
      const obstacleCollision = this.checkObstacleCollision(
        kitePosition,
        kiteVelocity,
        kiteRadius
      );
      if (obstacleCollision.collided) {
        result = obstacleCollision;
      }
    }

    return result;
  }

  public checkObstacleCollision(
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    kiteRadius: number = 3
  ): ObstacleCollisionResult | CollisionResult {
    let closestCollision: CollisionResult | null = null;
    let closestObstacle: { data: Obstacle; mesh: THREE.Group } | null = null;
    let minDistance = Infinity;

    for (const obstacle of this.obstacles) {
      if (obstacle.data.hasCollided) continue;

      const collision = this.checkSphereCollision(
        kitePosition,
        kiteVelocity,
        kiteRadius,
        new THREE.Vector3(
          obstacle.data.position.x,
          obstacle.data.position.y,
          obstacle.data.position.z
        ),
        obstacle.data.radius,
        obstacle.data.damage
      );

      if (collision.collided) {
        const distance = kitePosition.distanceTo(
          new THREE.Vector3(
            obstacle.data.position.x,
            obstacle.data.position.y,
            obstacle.data.position.z
          )
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCollision = collision;
          closestObstacle = obstacle;
        }
      }
    }

    if (closestCollision && closestObstacle) {
      return {
        ...closestCollision,
        obstacleId: closestObstacle.data.id,
        obstacleType: closestObstacle.data.type,
        collisionType: 'obstacle',
      };
    }

    return {
      collided: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      damage: 0,
      impactVelocity: 0,
      collisionType: 'none',
    };
  }

  private checkSphereCollision(
    kitePos: THREE.Vector3,
    kiteVel: THREE.Vector3,
    kiteRadius: number,
    obstaclePos: THREE.Vector3,
    obstacleRadius: number,
    obstacleDamage: number
  ): CollisionResult {
    const dx = kitePos.x - obstaclePos.x;
    const dy = kitePos.y - obstaclePos.y;
    const dz = kitePos.z - obstaclePos.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    const combinedRadius = kiteRadius + obstacleRadius;

    if (distanceSquared < combinedRadius * combinedRadius) {
      const distance = Math.sqrt(distanceSquared);
      const normal = new THREE.Vector3(
        dx / (distance || 1),
        dy / (distance || 1),
        dz / (distance || 1)
      );

      const impactVelocity = Math.abs(kiteVel.dot(normal));
      const speedFactor = Math.min(2, impactVelocity * 0.3);
      const damage = obstacleDamage * (0.6 + speedFactor * 0.4) * this.obstacleDamageMultiplier;

      return {
        collided: true,
        normal,
        penetration: combinedRadius - distance,
        damage,
        impactVelocity,
        collisionType: 'obstacle',
      };
    }

    return {
      collided: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      damage: 0,
      impactVelocity: 0,
      collisionType: 'none',
    };
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
        collisionType: 'building',
      };
    }

    return {
      collided: false,
      normal: new THREE.Vector3(0, 1, 0),
      penetration: 0,
      damage: 0,
      impactVelocity: 0,
      collisionType: 'none',
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
