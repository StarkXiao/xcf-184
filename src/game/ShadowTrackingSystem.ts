import * as THREE from 'three';
import type { ShadowTrailPoint, GameConfig, Vector3 } from './types';

export class ShadowTrackingSystem {
  private scene: THREE.Scene;
  private config: GameConfig;

  public shadowTrail: ShadowTrailPoint[] = [];
  public shadowTrackingScore: number = 0;
  public flightStability: number = 1;

  private trailMesh!: THREE.Line;
  private trailGlowMesh!: THREE.Line;
  private markerMeshes: THREE.Mesh[] = [];
  private predictedPathMesh!: THREE.Line;
  private currentShadowBrightness: number = 0.8;

  private lastShadowPosition: THREE.Vector2 = new THREE.Vector2();
  private shadowDeviationAccumulator: number = 0;
  private velocitySmoothness: number = 1;
  private lastVelocityLength: number = 0;

  constructor(scene: THREE.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
    this.initVisuals();
  }

  private initVisuals(): void {
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.config.shadowTrailLength * 3);
    const colors = new Float32Array(this.config.shadowTrailLength * 3);

    for (let i = 0; i < this.config.shadowTrailLength; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0.05;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.3;
    }

    trailGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    trailGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );

    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    this.trailMesh = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.add(this.trailMesh);

    const glowMaterial = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
      linewidth: 6,
    });
    this.trailGlowMesh = new THREE.Line(trailGeometry.clone(), glowMaterial);
    this.scene.add(this.trailGlowMesh);

    const predictedGeometry = new THREE.BufferGeometry();
    const predictedPositions = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) {
      predictedPositions[i * 3] = 0;
      predictedPositions[i * 3 + 1] = 0.06;
      predictedPositions[i * 3 + 2] = 0;
    }
    predictedGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(predictedPositions, 3)
    );
    const predictedMaterial = new THREE.LineDashedMaterial({
      color: 0x00ffff,
      dashSize: 2,
      gapSize: 1,
      transparent: true,
      opacity: 0.6,
    });
    this.predictedPathMesh = new THREE.Line(predictedGeometry, predictedMaterial);
    this.predictedPathMesh.computeLineDistances();
    this.scene.add(this.predictedPathMesh);

    const markerGeometry = new THREE.RingGeometry(0.5, 1.2, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < 5; i++) {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial.clone());
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      this.markerMeshes.push(marker);
      this.scene.add(marker);
    }
  }

  public update(
    delta: number,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    timeOfDay: number
  ): void {
    this.updateShadowBrightness(timeOfDay, kitePosition.y);
    this.recordShadowTrail(kitePosition);
    this.updateTrailVisuals();
    this.updatePredictedPath(kitePosition, kiteVelocity);
    this.calculateTrackingScore(delta, kitePosition, kiteVelocity);
    this.updateFlightStability(delta, kiteVelocity);
  }

  private updateShadowBrightness(timeOfDay: number, height: number): void {
    const sunIntensity = Math.max(0, Math.sin(timeOfDay * Math.PI));
    const heightFactor = Math.min(1, height / 200);
    this.currentShadowBrightness = 0.3 + sunIntensity * 0.5 + heightFactor * 0.2;
    this.currentShadowBrightness = Math.max(0.1, Math.min(1, this.currentShadowBrightness));
  }

  private recordShadowTrail(kitePosition: THREE.Vector3): void {
    const shadowX = kitePosition.x;
    const shadowZ = kitePosition.z - 20;

    const point: ShadowTrailPoint = {
      x: shadowX,
      z: shadowZ,
      brightness: this.currentShadowBrightness,
      timestamp: performance.now(),
    };

    this.shadowTrail.unshift(point);
    if (this.shadowTrail.length > this.config.shadowTrailLength) {
      this.shadowTrail.pop();
    }

    this.lastShadowPosition.set(shadowX, shadowZ);
  }

  private updateTrailVisuals(): void {
    const positions = this.trailMesh.geometry.attributes.position
      .array as Float32Array;
    const colors = this.trailMesh.geometry.attributes.color
      .array as Float32Array;
    const glowPositions = this.trailGlowMesh.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < this.config.shadowTrailLength; i++) {
      if (i < this.shadowTrail.length) {
        const point = this.shadowTrail[i];
        const t = i / this.config.shadowTrailLength;

        positions[i * 3] = point.x;
        positions[i * 3 + 1] = 0.05;
        positions[i * 3 + 2] = point.z;

        glowPositions[i * 3] = point.x;
        glowPositions[i * 3 + 1] = 0.04;
        glowPositions[i * 3 + 2] = point.z;

        const brightness = point.brightness;
        const fade = 1 - t;

        colors[i * 3] = brightness * fade;
        colors[i * 3 + 1] = brightness * 0.85 * fade;
        colors[i * 3 + 2] = (1 - brightness) * 0.3 * fade;
      } else if (this.shadowTrail.length > 0) {
        const lastPoint = this.shadowTrail[this.shadowTrail.length - 1];
        positions[i * 3] = lastPoint.x;
        positions[i * 3 + 1] = 0.05;
        positions[i * 3 + 2] = lastPoint.z;
        glowPositions[i * 3] = lastPoint.x;
        glowPositions[i * 3 + 1] = 0.04;
        glowPositions[i * 3 + 2] = lastPoint.z;
      }
    }

    this.trailMesh.geometry.attributes.position.needsUpdate = true;
    this.trailMesh.geometry.attributes.color.needsUpdate = true;
    this.trailGlowMesh.geometry.attributes.position.needsUpdate = true;

    const glowMaterial = this.trailGlowMesh.material as THREE.LineBasicMaterial;
    glowMaterial.opacity = 0.2 + this.currentShadowBrightness * 0.3;
  }

  private updatePredictedPath(
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3
  ): void {
    const positions = this.predictedPathMesh.geometry.attributes.position
      .array as Float32Array;

    const shadowX = kitePosition.x;
    const shadowZ = kitePosition.z - 20;

    let dirX = kiteVelocity.x;
    let dirZ = kiteVelocity.z;

    const speed = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (speed < 0.01) {
      dirX = 0;
      dirZ = -1;
    } else {
      dirX /= speed;
      dirZ /= speed;
    }

    const pathLength = this.config.shadowTrackingTargetDistance * 1.5;
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const distance = t * pathLength;
      const waveOffset = Math.sin(t * Math.PI * 2 + performance.now() * 0.003) * 3 * t;
      positions[i * 3] = shadowX + dirX * distance + waveOffset;
      positions[i * 3 + 1] = 0.06;
      positions[i * 3 + 2] = shadowZ + dirZ * distance;
    }

    this.predictedPathMesh.geometry.attributes.position.needsUpdate = true;
    this.predictedPathMesh.computeLineDistances();

    this.updateAirCurrentMarkers(kitePosition, kiteVelocity);
  }

  private updateAirCurrentMarkers(
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3
  ): void {
    let dirX = kiteVelocity.x;
    let dirZ = kiteVelocity.z;

    const speed = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (speed < 0.01) {
      dirX = 0;
      dirZ = -1;
    } else {
      dirX /= speed;
      dirZ /= speed;
    }

    const perpX = -dirZ;
    const perpZ = dirX;

    const shadowX = kitePosition.x;
    const shadowZ = kitePosition.z - 20;

    for (let i = 0; i < this.markerMeshes.length; i++) {
      const marker = this.markerMeshes[i];
      const distance = (i + 1) * 15;
      const offset = Math.sin(i * 1.2 + performance.now() * 0.002) * 8;
      const markerX = shadowX + dirX * distance + perpX * offset;
      const markerZ = shadowZ + dirZ * distance + perpZ * offset;

      marker.position.set(markerX, 0.08, markerZ);
      marker.visible = true;

      const material = marker.material as THREE.MeshBasicMaterial;
      const hue = (i / this.markerMeshes.length) * 0.25 + 0.5;
      material.color.setHSL(hue, 0.8, 0.5 + this.currentShadowBrightness * 0.3);
      material.opacity = 0.3 + this.currentShadowBrightness * 0.4;

      const pulse = 1 + Math.sin(performance.now() * 0.005 + i * 0.8) * 0.25;
      marker.scale.setScalar(pulse * (0.6 + this.currentShadowBrightness * 0.6));
    }
  }

  private calculateTrackingScore(
    _delta: number,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3
  ): void {
    if (this.shadowTrail.length < 3) {
      this.shadowTrackingScore = 0.5;
      return;
    }

    const horizontalSpeed = Math.sqrt(
      kiteVelocity.x * kiteVelocity.x + kiteVelocity.z * kiteVelocity.z
    );

    const speedScore = Math.min(1, horizontalSpeed / 0.3);

    let directionConsistency = 0.5;
    if (this.shadowTrail.length >= 8) {
      const recent = this.shadowTrail.slice(0, 8);
      let totalAngleChange = 0;
      let validSegments = 0;

      for (let i = 0; i < recent.length - 2; i++) {
        const p1 = new THREE.Vector2(recent[i].x, recent[i].z);
        const p2 = new THREE.Vector2(recent[i + 1].x, recent[i + 1].z);
        const p3 = new THREE.Vector2(recent[i + 2].x, recent[i + 2].z);

        const v1 = new THREE.Vector2().subVectors(p2, p1);
        const v2 = new THREE.Vector2().subVectors(p3, p2);

        if (v1.length() > 0.1 && v2.length() > 0.1) {
          v1.normalize();
          v2.normalize();
          const dot = Math.max(-1, Math.min(1, v1.dot(v2)));
          const angle = Math.acos(dot);
          totalAngleChange += angle;
          validSegments++;
        }
      }

      if (validSegments > 0) {
        const avgAngleChange = totalAngleChange / validSegments;
        directionConsistency = Math.max(0, 1 - avgAngleChange / 0.8);
      }
    }

    const forwardAlignment = this.calculateForwardAlignment(kiteVelocity);

    const trackingScore =
      speedScore * 0.25 +
      directionConsistency * 0.45 +
      forwardAlignment * 0.3;

    this.shadowDeviationAccumulator =
      this.shadowDeviationAccumulator * 0.92 + trackingScore * 0.08;
    this.shadowTrackingScore = Math.max(0.1, Math.min(1, this.shadowDeviationAccumulator));
    void kitePosition;
  }

  private calculateForwardAlignment(kiteVelocity: THREE.Vector3): number {
    const horizontalSpeed = Math.sqrt(
      kiteVelocity.x * kiteVelocity.x + kiteVelocity.z * kiteVelocity.z
    );

    if (horizontalSpeed < 0.01) return 0.5;

    const forwardDir = new THREE.Vector2(0, -1);
    const velocityDir = new THREE.Vector2(
      kiteVelocity.x / horizontalSpeed,
      kiteVelocity.z / horizontalSpeed
    );

    const dot = forwardDir.dot(velocityDir);
    return Math.max(0, Math.min(1, (dot + 1) / 2));
  }

  private updateFlightStability(
    _delta: number,
    kiteVelocity: THREE.Vector3
  ): void {
    const currentVelocityLength = kiteVelocity.length();
    const velocityChange = Math.abs(currentVelocityLength - this.lastVelocityLength);
    const maxChange = 0.3;
    const smoothness = Math.max(0, 1 - velocityChange / maxChange);

    const directionStability = this.calculateDirectionStability(kiteVelocity);

    this.velocitySmoothness =
      this.velocitySmoothness * 0.92 + smoothness * 0.08;

    const combinedStability =
      this.velocitySmoothness * 0.5 + directionStability * 0.5;

    this.flightStability =
      this.flightStability * 0.95 + combinedStability * 0.05;
    this.flightStability = Math.max(0.3, Math.min(1, this.flightStability));

    this.lastVelocityLength = currentVelocityLength;
    void _delta;
  }

  private calculateDirectionStability(kiteVelocity: THREE.Vector3): number {
    if (kiteVelocity.length() < 0.01) return 0.5;

    const horizontalVel = new THREE.Vector2(kiteVelocity.x, kiteVelocity.z);
    if (horizontalVel.length() < 0.01) return 0.5;

    const angleFromForward = Math.abs(
      Math.atan2(horizontalVel.x, -horizontalVel.y)
    );
    const normalizedAngle = angleFromForward / Math.PI;
    return 1 - normalizedAngle * 0.5;
  }

  public getShadowBrightness(): number {
    return this.currentShadowBrightness;
  }

  public getTrackingScore(): number {
    return this.shadowTrackingScore;
  }

  public getFlightStability(): number {
    return this.flightStability;
  }

  public getRecommendedAirCurrentPosition(): Vector3 | null {
    if (this.shadowTrail.length < 3) return null;

    const recentPoints = this.shadowTrail.slice(0, 5);
    const avgX = recentPoints.reduce((s, p) => s + p.x, 0) / recentPoints.length;
    const avgZ = recentPoints.reduce((s, p) => s + p.z, 0) / recentPoints.length;

    const firstPoint = recentPoints[recentPoints.length - 1];
    const lastPoint = recentPoints[0];
    const dirX = (lastPoint.x - firstPoint.x) / Math.max(1, recentPoints.length - 1);
    const dirZ = (lastPoint.z - firstPoint.z) / Math.max(1, recentPoints.length - 1);

    const magnitude = Math.sqrt(dirX * dirX + dirZ * dirZ);
    const normDirX = magnitude > 0.01 ? dirX / magnitude : 0;
    const normDirZ = magnitude > 0.01 ? dirZ / magnitude : -1;

    return {
      x: avgX + normDirX * this.config.shadowTrackingTargetDistance,
      y: 40 + Math.random() * 80,
      z: avgZ + normDirZ * this.config.shadowTrackingTargetDistance,
    };
  }

  public getTrailBrightnessAt(position: Vector3): number {
    let maxBrightness = 0;

    for (const point of this.shadowTrail) {
      const dist = Math.sqrt(
        (position.x - point.x) ** 2 + (position.z - point.z) ** 2
      );
      if (dist < 25) {
        const falloff = 1 - dist / 25;
        maxBrightness = Math.max(maxBrightness, point.brightness * falloff);
      }
    }

    return maxBrightness;
  }

  public clear(): void {
    this.shadowTrail = [];
    this.scene.remove(this.trailMesh);
    this.scene.remove(this.trailGlowMesh);
    this.scene.remove(this.predictedPathMesh);
    for (const marker of this.markerMeshes) {
      this.scene.remove(marker);
    }
    this.markerMeshes = [];
  }
}
