import * as THREE from 'three';
import type {
  Obstacle,
  ObstacleType,
  ObstacleMovementPattern,
  ObstacleConfig,
  ObstacleStats,
  ObstacleWarning,
  Vector3,
} from './types';
import {
  DEFAULT_OBSTACLE_CONFIG,
  DEFAULT_OBSTACLE_STATS,
} from './types';

const OBSTACLE_COLORS: Record<ObstacleType, number> = {
  drone: 0x333333,
  adBalloon: 0xff6b6b,
  bird: 0x8b4513,
  airplane: 0xffffff,
};

const OBSTACLE_RADII: Record<ObstacleType, number> = {
  drone: 2,
  adBalloon: 5,
  bird: 1.5,
  airplane: 8,
};

const OBSTACLE_HEIGHTS: Record<ObstacleType, number> = {
  drone: 1.5,
  adBalloon: 12,
  bird: 1,
  airplane: 4,
};

const OBSTACLE_DAMAGES: Record<ObstacleType, number> = {
  drone: 20,
  adBalloon: 15,
  bird: 10,
  airplane: 35,
};

export class ObstacleSystem {
  private scene: THREE.Scene;
  private config: ObstacleConfig;
  private worldSize: number;

  public obstacles: Obstacle[] = [];
  public obstacleMeshes: Map<string, THREE.Group> = new Map();
  public warnings: ObstacleWarning[] = [];
  public stats: ObstacleStats;

  private obstacleGroup: THREE.Group;
  private warningGroup: THREE.Group;

  private spawnTimer: number = 0;
  private lastWarningCheck: number = 0;

  constructor(scene: THREE.Scene, worldSize: number, config?: Partial<ObstacleConfig>) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.config = { ...DEFAULT_OBSTACLE_CONFIG, ...config };
    this.stats = { ...DEFAULT_OBSTACLE_STATS };

    this.obstacleGroup = new THREE.Group();
    this.warningGroup = new THREE.Group();
    this.scene.add(this.obstacleGroup);
    this.scene.add(this.warningGroup);
  }

  public reconfigure(config: Partial<ObstacleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): ObstacleConfig {
    return { ...this.config };
  }

  public getStats(): ObstacleStats {
    return { ...this.stats };
  }

  public getWarnings(): ObstacleWarning[] {
    return [...this.warnings];
  }

  public update(
    delta: number,
    currentTime: number,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3
  ): void {
    if (!this.config.enabled) return;

    this.spawnTimer += delta;
    this.trySpawnObstacle(kitePosition);

    this.updateObstacles(delta, currentTime, kitePosition);
    this.updateWarnings(delta, currentTime, kitePosition, kiteVelocity);
    this.cleanupExpired(currentTime);

    this.stats.maxObstaclesOnScreen = Math.max(
      this.stats.maxObstaclesOnScreen,
      this.obstacles.length
    );
  }

  private trySpawnObstacle(kitePosition: THREE.Vector3): void {
    if (this.obstacles.length >= this.config.maxObstacles) return;
    if (this.spawnTimer < 1 / this.config.spawnRate) return;

    this.spawnTimer = 0;

    const type = this.selectObstacleType();
    const obstacle = this.createObstacle(type, kitePosition);

    this.obstacles.push(obstacle);
    this.createObstacleMesh(obstacle);
    this.stats.totalSpawned++;
  }

  private selectObstacleType(): ObstacleType {
    const rand = Math.random();
    let cumulative = 0;

    cumulative += this.config.droneProbability;
    if (rand < cumulative) return 'drone';

    cumulative += this.config.adBalloonProbability;
    if (rand < cumulative) return 'adBalloon';

    cumulative += this.config.birdProbability;
    if (rand < cumulative) return 'bird';

    return 'airplane';
  }

  private createObstacle(type: ObstacleType, kitePosition: THREE.Vector3): Obstacle {
    const angle = Math.random() * Math.PI * 2;
    const spawnDistance = this.worldSize * 0.6 + Math.random() * this.worldSize * 0.2;
    const height = this.config.minSpawnHeight +
      Math.random() * (this.config.maxSpawnHeight - this.config.minSpawnHeight);

    const spawnX = kitePosition.x + Math.cos(angle) * spawnDistance;
    const spawnZ = kitePosition.z + Math.sin(angle) * spawnDistance;

    const speed = this.config.minSpeed +
      Math.random() * (this.config.maxSpeed - this.config.minSpeed);

    const movementPattern = this.selectMovementPattern(type);

    const position: Vector3 = { x: spawnX, y: height, z: spawnZ };
    const velocity = this.calculateInitialVelocity(type, position, kitePosition, speed);

    const id = `obstacle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const obstacle: Obstacle = {
      id,
      type,
      position,
      velocity,
      radius: OBSTACLE_RADII[type],
      height: OBSTACLE_HEIGHTS[type],
      movementPattern,
      speed,
      lifeTime: 0,
      maxLifeTime: 60 + Math.random() * 60,
      damage: OBSTACLE_DAMAGES[type] * (this.config.baseDamage / 15),
      color: OBSTACLE_COLORS[type],
      rotation: { x: 0, y: angle, z: 0 },
      angularVelocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 2,
      },
      phase: Math.random() * Math.PI * 2,
      warningLevel: 0,
      isWarningActive: false,
      warningStartTime: 0,
      hasCollided: false,
    };

    if (movementPattern === 'circular' || movementPattern === 'hover') {
      obstacle.centerPosition = { ...position };
      obstacle.orbitRadius = 10 + Math.random() * 20;
      obstacle.orbitSpeed = 0.5 + Math.random() * 1.5;
    }

    return obstacle;
  }

  private selectMovementPattern(type: ObstacleType): ObstacleMovementPattern {
    const patterns: ObstacleMovementPattern[] = ['linear', 'zigzag', 'circular', 'hover'];
    const weights: Record<ObstacleType, number[]> = {
      drone: [0.3, 0.3, 0.25, 0.15],
      adBalloon: [0.2, 0.1, 0.3, 0.4],
      bird: [0.4, 0.4, 0.15, 0.05],
      airplane: [0.9, 0.1, 0, 0],
    };

    const typeWeights = weights[type];
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < patterns.length; i++) {
      cumulative += typeWeights[i];
      if (rand < cumulative) return patterns[i];
    }

    return 'linear';
  }

  private calculateInitialVelocity(
    type: ObstacleType,
    position: Vector3,
    targetPos: THREE.Vector3,
    speed: number
  ): Vector3 {
    const dx = targetPos.x - position.x;
    const dz = targetPos.z - position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.001) {
      return { x: speed, y: 0, z: 0 };
    }

    const angleOffset = (Math.random() - 0.5) * Math.PI * 0.5;
    const baseAngle = Math.atan2(dz, dx);
    const angle = baseAngle + angleOffset;

    return {
      x: Math.cos(angle) * speed,
      y: (Math.random() - 0.5) * speed * 0.3,
      z: Math.sin(angle) * speed,
    };
  }

  private createObstacleMesh(obstacle: Obstacle): void {
    const group = new THREE.Group();

    switch (obstacle.type) {
      case 'drone':
        this.createDroneMesh(group, obstacle);
        break;
      case 'adBalloon':
        this.createAdBalloonMesh(group, obstacle);
        break;
      case 'bird':
        this.createBirdMesh(group, obstacle);
        break;
      case 'airplane':
        this.createAirplaneMesh(group, obstacle);
        break;
    }

    group.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
    group.rotation.set(obstacle.rotation.x, obstacle.rotation.y, obstacle.rotation.z);

    this.obstacleGroup.add(group);
    this.obstacleMeshes.set(obstacle.id, group);
  }

  private createDroneMesh(group: THREE.Group, obstacle: Obstacle): void {
    const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: obstacle.color,
      metalness: 0.8,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    const armGeometry = new THREE.BoxGeometry(3.5, 0.1, 0.1);
    const armMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.2,
    });

    const arm1 = new THREE.Mesh(armGeometry, armMaterial);
    arm1.rotation.y = Math.PI / 4;
    group.add(arm1);

    const arm2 = new THREE.Mesh(armGeometry, armMaterial);
    arm2.rotation.y = -Math.PI / 4;
    group.add(arm2);

    const propellerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 8);
    const propellerMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      side: THREE.DoubleSide,
    });

    const propellerPositions = [
      [1.2, 0.3, 1.2],
      [1.2, 0.3, -1.2],
      [-1.2, 0.3, 1.2],
      [-1.2, 0.3, -1.2],
    ];

    propellerPositions.forEach(([x, y, z]) => {
      const prop = new THREE.Mesh(propellerGeometry, propellerMaterial);
      prop.position.set(x, y, z);
      prop.rotation.x = Math.PI / 2;
      prop.name = 'propeller';
      group.add(prop);
    });
  }

  private createAdBalloonMesh(group: THREE.Group, obstacle: Obstacle): void {
    const balloonGeometry = new THREE.SphereGeometry(4, 16, 16);
    const balloonMaterial = new THREE.MeshStandardMaterial({
      color: obstacle.color,
      transparent: true,
      opacity: 0.9,
      roughness: 0.5,
      metalness: 0.1,
    });
    const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    balloon.scale.set(1, 1.3, 1);
    balloon.castShadow = true;
    group.add(balloon);

    const bannerGeometry = new THREE.PlaneGeometry(6, 3);
    const bannerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      roughness: 0.8,
    });
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.y = -6;
    banner.castShadow = true;
    group.add(banner);

    const stringGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    const stringMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const string = new THREE.Mesh(stringGeometry, stringMaterial);
    string.position.y = -3.5;
    group.add(string);
  }

  private createBirdMesh(group: THREE.Group, obstacle: Obstacle): void {
    const bodyGeometry = new THREE.SphereGeometry(1, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: obstacle.color,
      roughness: 0.7,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.scale.set(1, 0.7, 1.5);
    body.castShadow = true;
    group.add(body);

    const wingGeometry = new THREE.PlaneGeometry(3, 1);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x654321,
      side: THREE.DoubleSide,
      roughness: 0.7,
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0.2, 0);
    leftWing.name = 'leftWing';
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0.2, 0);
    rightWing.name = 'rightWing';
    group.add(rightWing);
  }

  private createAirplaneMesh(group: THREE.Group, obstacle: Obstacle): void {
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1.2, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: obstacle.color,
      metalness: 0.6,
      roughness: 0.4,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    body.castShadow = true;
    group.add(body);

    const wingGeometry = new THREE.BoxGeometry(10, 0.3, 1.5);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.5,
      roughness: 0.5,
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.z = 0.5;
    wings.castShadow = true;
    group.add(wings);

    const tailGeometry = new THREE.BoxGeometry(2.5, 0.2, 1);
    const tailMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.5,
      roughness: 0.5,
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.z = -3.5;
    tail.position.y = 1;
    tail.rotation.x = -Math.PI / 6;
    tail.castShadow = true;
    group.add(tail);
  }

  private updateObstacles(
    delta: number,
    currentTime: number,
    kitePosition: THREE.Vector3
  ): void {
    for (const obstacle of this.obstacles) {
      if (obstacle.hasCollided) continue;

      this.updateObstaclePosition(obstacle, delta, currentTime);
      this.updateObstacleRotation(obstacle, delta);
      this.updateObstacleMesh(obstacle);

      const distance = Math.sqrt(
        Math.pow(obstacle.position.x - kitePosition.x, 2) +
        Math.pow(obstacle.position.y - kitePosition.y, 2) +
        Math.pow(obstacle.position.z - kitePosition.z, 2)
      );

      const nearMissDistance = obstacle.radius + 8;
      if (distance < nearMissDistance && distance > obstacle.radius + 2) {
        this.stats.nearMissCount++;
      }

      obstacle.lifeTime += delta;
    }
  }

  private updateObstaclePosition(
    obstacle: Obstacle,
    delta: number,
    currentTime: number
  ): void {
    switch (obstacle.movementPattern) {
      case 'linear':
        this.updateLinearMovement(obstacle, delta);
        break;
      case 'zigzag':
        this.updateZigzagMovement(obstacle, delta, currentTime);
        break;
      case 'circular':
        this.updateCircularMovement(obstacle, delta, currentTime);
        break;
      case 'hover':
        this.updateHoverMovement(obstacle, delta, currentTime);
        break;
    }
  }

  private updateLinearMovement(obstacle: Obstacle, delta: number): void {
    obstacle.position.x += obstacle.velocity.x * delta;
    obstacle.position.y += obstacle.velocity.y * delta;
    obstacle.position.z += obstacle.velocity.z * delta;
  }

  private updateZigzagMovement(
    obstacle: Obstacle,
    delta: number,
    currentTime: number
  ): void {
    obstacle.position.x += obstacle.velocity.x * delta;
    obstacle.position.z += obstacle.velocity.z * delta;

    const zigzagOffset = Math.sin(currentTime * 2 + obstacle.phase) * 3;
    const perpX = -obstacle.velocity.z;
    const perpZ = obstacle.velocity.x;
    const perpLength = Math.sqrt(perpX * perpX + perpZ * perpZ);

    if (perpLength > 0.001) {
      obstacle.position.x += (perpX / perpLength) * zigzagOffset * delta * 0.5;
      obstacle.position.z += (perpZ / perpLength) * zigzagOffset * delta * 0.5;
    }

    obstacle.position.y += Math.sin(currentTime * 1.5 + obstacle.phase) * delta * 2;
  }

  private updateCircularMovement(
    obstacle: Obstacle,
    delta: number,
    currentTime: number
  ): void {
    if (!obstacle.centerPosition || !obstacle.orbitRadius || !obstacle.orbitSpeed) {
      this.updateLinearMovement(obstacle, delta);
      return;
    }

    const angle = currentTime * obstacle.orbitSpeed + obstacle.phase;
    obstacle.position.x = obstacle.centerPosition.x + Math.cos(angle) * obstacle.orbitRadius;
    obstacle.position.z = obstacle.centerPosition.z + Math.sin(angle) * obstacle.orbitRadius;
    obstacle.position.y = obstacle.centerPosition.y +
      Math.sin(currentTime * 0.8 + obstacle.phase) * 3;

    obstacle.rotation.y = angle + Math.PI / 2;
  }

  private updateHoverMovement(
    obstacle: Obstacle,
    delta: number,
    currentTime: number
  ): void {
    if (!obstacle.centerPosition || !obstacle.orbitRadius || !obstacle.orbitSpeed) {
      obstacle.position.y += Math.sin(currentTime + obstacle.phase) * delta * 2;
      return;
    }

    const slowOrbitSpeed = obstacle.orbitSpeed * 0.3;
    const angle = currentTime * slowOrbitSpeed + obstacle.phase;
    const hoverRadius = obstacle.orbitRadius * 0.5;

    obstacle.position.x = obstacle.centerPosition.x + Math.cos(angle) * hoverRadius;
    obstacle.position.z = obstacle.centerPosition.z + Math.sin(angle) * hoverRadius;
    obstacle.position.y = obstacle.centerPosition.y +
      Math.sin(currentTime * 0.5 + obstacle.phase) * 5;
  }

  private updateObstacleRotation(obstacle: Obstacle, delta: number): void {
    if (obstacle.type === 'drone') {
      obstacle.rotation.y += delta * 0.5;
    } else if (obstacle.movementPattern === 'linear' || obstacle.movementPattern === 'zigzag') {
      const speed = Math.sqrt(
        obstacle.velocity.x * obstacle.velocity.x +
        obstacle.velocity.z * obstacle.velocity.z
      );
      if (speed > 0.01) {
        obstacle.rotation.y = Math.atan2(obstacle.velocity.z, obstacle.velocity.x);
      }
    }

    const mesh = this.obstacleMeshes.get(obstacle.id);
    if (mesh) {
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'propeller') {
          child.rotation.y += delta * 30;
        }
        if (child instanceof THREE.Mesh && child.name === 'leftWing') {
          child.rotation.z = Math.sin(performance.now() * 0.01) * 0.5;
        }
        if (child instanceof THREE.Mesh && child.name === 'rightWing') {
          child.rotation.z = -Math.sin(performance.now() * 0.01) * 0.5;
        }
      });
    }
  }

  private updateObstacleMesh(obstacle: Obstacle): void {
    const mesh = this.obstacleMeshes.get(obstacle.id);
    if (mesh) {
      mesh.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
      mesh.rotation.x = obstacle.rotation.x;
      mesh.rotation.y = obstacle.rotation.y;
      mesh.rotation.z = obstacle.rotation.z;
    }
  }

  private updateWarnings(
    delta: number,
    currentTime: number,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3
  ): void {
    this.lastWarningCheck += delta;
    if (this.lastWarningCheck < 0.1) return;
    this.lastWarningCheck = 0;

    const activeWarningIds = new Set<string>();

    for (const obstacle of this.obstacles) {
      if (obstacle.hasCollided) continue;

      const warning = this.calculateWarning(obstacle, kitePosition, kiteVelocity, currentTime);

      if (warning) {
        activeWarningIds.add(warning.id);

        const existingIndex = this.warnings.findIndex(w => w.obstacleId === obstacle.id);
        if (existingIndex >= 0) {
          this.warnings[existingIndex] = warning;
        } else {
          this.warnings.push(warning);
          this.stats.warningsIssued++;
        }

        obstacle.isWarningActive = true;
        obstacle.warningStartTime = currentTime;
        obstacle.warningLevel = this.getWarningLevel(warning.severity);
      } else {
        obstacle.isWarningActive = false;
        obstacle.warningLevel = 0;
      }
    }

    this.warnings = this.warnings.filter(w => activeWarningIds.has(w.id));
  }

  private calculateWarning(
    obstacle: Obstacle,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    currentTime: number
  ): ObstacleWarning | null {
    const dx = obstacle.position.x - kitePosition.x;
    const dy = obstacle.position.y - kitePosition.y;
    const dz = obstacle.position.z - kitePosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance > this.config.warningDistance) return null;

    const relVx = obstacle.velocity.x - kiteVelocity.x;
    const relVy = obstacle.velocity.y - kiteVelocity.y;
    const relVz = obstacle.velocity.z - kiteVelocity.z;

    const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy + relVz * relVz);
    let timeToCollision = Infinity;

    if (relSpeed > 0.1) {
      const relativeApproach =
        -(dx * relVx + dy * relVy + dz * relVz) / (distance * relSpeed);

      if (relativeApproach > 0) {
        timeToCollision = distance / (relSpeed * relativeApproach);
      }
    }

    let severity: ObstacleWarning['severity'];
    if (distance < 20 || timeToCollision < 2) {
      severity = 'critical';
    } else if (distance < 35 || timeToCollision < 4) {
      severity = 'high';
    } else if (distance < 50 || timeToCollision < 6) {
      severity = 'medium';
    } else {
      severity = 'low';
    }

    const direction: Vector3 = {
      x: dx / (distance || 1),
      y: dy / (distance || 1),
      z: dz / (distance || 1),
    };

    return {
      id: `warning-${obstacle.id}`,
      obstacleId: obstacle.id,
      type: obstacle.type,
      position: { ...obstacle.position },
      direction,
      distance,
      timeToCollision,
      severity,
      startTime: currentTime,
      duration: 1,
    };
  }

  private getWarningLevel(severity: ObstacleWarning['severity']): number {
    switch (severity) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  private cleanupExpired(currentTime: number): void {
    const toRemove: string[] = [];

    for (const obstacle of this.obstacles) {
      const distance = Math.sqrt(
        Math.pow(obstacle.position.x, 2) +
        Math.pow(obstacle.position.z, 2)
      );

      if (
        obstacle.lifeTime > obstacle.maxLifeTime ||
        distance > this.worldSize * 1.5 ||
        obstacle.position.y < 5 ||
        obstacle.position.y > 300
      ) {
        toRemove.push(obstacle.id);
        if (!obstacle.hasCollided) {
          this.stats.totalAvoided++;
        }
      }
    }

    for (const id of toRemove) {
      this.removeObstacle(id);
    }

    this.warnings = this.warnings.filter(w =>
      currentTime - w.startTime < w.duration
    );
  }

  private removeObstacle(id: string): void {
    const index = this.obstacles.findIndex(o => o.id === id);
    if (index >= 0) {
      this.obstacles.splice(index, 1);
    }

    const mesh = this.obstacleMeshes.get(id);
    if (mesh) {
      this.obstacleGroup.remove(mesh);
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.obstacleMeshes.delete(id);
    }

    this.warnings = this.warnings.filter(w => w.obstacleId !== id);
  }

  public notifyCollision(obstacleId: string): void {
    const obstacle = this.obstacles.find(o => o.id === obstacleId);
    if (obstacle && !obstacle.hasCollided) {
      obstacle.hasCollided = true;
      this.stats.totalCollided++;

      switch (obstacle.type) {
        case 'drone':
          this.stats.droneCollided++;
          break;
        case 'adBalloon':
          this.stats.adBalloonCollided++;
          break;
        case 'bird':
          this.stats.birdCollided++;
          break;
        case 'airplane':
          this.stats.airplaneCollided++;
          break;
      }

      setTimeout(() => {
        this.removeObstacle(obstacleId);
      }, 500);
    }
  }

  public clear(): void {
    const ids = this.obstacles.map(o => o.id);
    ids.forEach(id => this.removeObstacle(id));

    this.obstacles = [];
    this.warnings = [];
    this.stats = { ...DEFAULT_OBSTACLE_STATS };
    this.spawnTimer = 0;
  }

  public dispose(): void {
    this.clear();
    this.scene.remove(this.obstacleGroup);
    this.scene.remove(this.warningGroup);
  }

  public getObstaclesForCollision(): { data: Obstacle; mesh: THREE.Group }[] {
    return this.obstacles
      .filter(o => !o.hasCollided)
      .map(o => ({
        data: o,
        mesh: this.obstacleMeshes.get(o.id)!,
      }))
      .filter(item => item.mesh !== undefined);
  }
}
