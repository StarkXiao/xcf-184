import * as THREE from 'three';
import type { GameConfig, Vector3, FlightParams, KiteDurabilityState, SpoolTensionState, DurabilityConfig, TensionConfig } from './types';
import { DEFAULT_DURABILITY_CONFIG, DEFAULT_TENSION_CONFIG } from './types';

const DEFAULT_FLIGHT_PARAMS: FlightParams = {
  maxSpeed: 1.2,
  acceleration: 0.5,
  liftForce: 0.015,
  dragCoefficient: 0.98,
  stabilityFactor: 1.0,
  windResponse: 1.0,
  maxAltitude: 300,
  turnRate: 1.0,
};

export class Kite {
  public group: THREE.Group;
  public mesh: THREE.Group;
  public shadowMesh!: THREE.Mesh;
  public stringMesh!: THREE.Line;
  public trailParticles: THREE.Points;
  public velocity: THREE.Vector3;
  public rotation: THREE.Vector3;
  private config: GameConfig;
  private flightParams: FlightParams;
  private tailSegments: THREE.Vector3[] = [];
  private durabilityConfig: DurabilityConfig;
  private tensionConfig: TensionConfig;
  public durability: KiteDurabilityState;
  public tension: SpoolTensionState;
  private currentStringLength: number = 80;
  private damageFlashTimer: number = 0;

  constructor(config: GameConfig) {
    this.config = config;
    this.flightParams = config.flightParams ?? { ...DEFAULT_FLIGHT_PARAMS };
    this.durabilityConfig = config.durabilityConfig ?? { ...DEFAULT_DURABILITY_CONFIG };
    this.tensionConfig = config.tensionConfig ?? { ...DEFAULT_TENSION_CONFIG };
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Vector3(0, 0, 0);

    this.durability = this.createDurabilityState();
    this.tension = this.createTensionState();
    this.currentStringLength = 80;

    this.group = new THREE.Group();
    this.mesh = this.createKiteMesh();
    this.createShadow();
    this.createString();
    this.trailParticles = this.createTrail();
    this.group.add(this.mesh);

    this.group.position.set(0, 80, 0);
  }

  private createDurabilityState(): KiteDurabilityState {
    return {
      current: this.durabilityConfig.maxDurability,
      max: this.durabilityConfig.maxDurability,
      criticalThreshold: this.durabilityConfig.criticalThreshold,
      warningThreshold: this.durabilityConfig.warningThreshold,
      isCritical: false,
      isWarning: false,
    };
  }

  private createTensionState(): SpoolTensionState {
    return {
      current: this.tensionConfig.baseTension,
      max: this.tensionConfig.maxTension,
      optimal: this.tensionConfig.optimalTension,
      criticalThreshold: this.tensionConfig.criticalThreshold,
      warningThreshold: this.tensionConfig.warningThreshold,
      isOverTension: false,
      isUnderTension: false,
      stringLength: this.currentStringLength,
      maxStringLength: this.tensionConfig.maxStringLength,
      minStringLength: this.tensionConfig.minStringLength,
      reelRate: this.tensionConfig.baseReelRate,
      tensionDamageRate: this.tensionConfig.tensionDamageRate,
    };
  }

  public setDurabilityConfig(config: Partial<DurabilityConfig>): void {
    this.durabilityConfig = { ...this.durabilityConfig, ...config };
    this.durability.max = this.durabilityConfig.maxDurability;
    this.durability.criticalThreshold = this.durabilityConfig.criticalThreshold;
    this.durability.warningThreshold = this.durabilityConfig.warningThreshold;
  }

  public setTensionConfig(config: Partial<TensionConfig>): void {
    this.tensionConfig = { ...this.tensionConfig, ...config };
    this.tension.max = this.tensionConfig.maxTension;
    this.tension.optimal = this.tensionConfig.optimalTension;
    this.tension.criticalThreshold = this.tensionConfig.criticalThreshold;
    this.tension.warningThreshold = this.tensionConfig.warningThreshold;
    this.tension.maxStringLength = this.tensionConfig.maxStringLength;
    this.tension.minStringLength = this.tensionConfig.minStringLength;
    this.tension.reelRate = this.tensionConfig.baseReelRate;
    this.tension.tensionDamageRate = this.tensionConfig.tensionDamageRate;
  }

  public takeDamage(amount: number): number {
    const actualDamage = amount;
    this.durability.current = Math.max(0, this.durability.current - actualDamage);
    this.damageFlashTimer = 0.3;
    this.updateDurabilityStatus();
    return actualDamage;
  }

  public recoverDurability(amount: number): void {
    this.durability.current = Math.min(this.durability.max, this.durability.current + amount);
    this.updateDurabilityStatus();
  }

  private updateDurabilityStatus(): void {
    this.durability.isCritical = this.durability.current <= this.durability.criticalThreshold;
    this.durability.isWarning = this.durability.current <= this.durability.warningThreshold;
  }

  public updateTension(windSpeed: number): void {
    const speedMagnitude = this.velocity.length();
    const lengthFactor = this.currentStringLength * this.tensionConfig.tensionPerLength;
    const speedFactor = speedMagnitude * this.tensionConfig.tensionPerSpeed;
    const windFactor = windSpeed * this.tensionConfig.tensionPerWind;
    
    const targetTension = this.tensionConfig.baseTension + lengthFactor + speedFactor + windFactor;
    const tensionSmooth = 0.1;
    this.tension.current = THREE.MathUtils.lerp(this.tension.current, targetTension, tensionSmooth);
    
    this.tension.current = Math.max(0, Math.min(this.tension.max, this.tension.current));
    this.tension.isOverTension = this.tension.current >= this.tension.criticalThreshold;
    this.tension.isUnderTension = this.tension.current <= 15;
    this.tension.stringLength = this.currentStringLength;
  }

  public adjustStringLength(reelInput: number, delta: number): { reelDelta: number; isRapid: boolean } {
    const reelAmount = reelInput * this.tensionConfig.baseReelRate * delta;
    const newLength = THREE.MathUtils.clamp(
      this.currentStringLength + reelAmount,
      this.tensionConfig.minStringLength,
      this.tensionConfig.maxStringLength
    );
    const actualDelta = newLength - this.currentStringLength;
    this.currentStringLength = newLength;
    
    const isRapid = Math.abs(actualDelta) > this.tensionConfig.rapidReelThreshold * delta;
    
    return { reelDelta: actualDelta, isRapid };
  }

  public updateDurabilityAndTension(delta: number, turbulenceLevel: number = 0): { tensionDamage: number; turbulenceDamage: number; recovery: number } {
    const tensionDamage = this.tension.isOverTension 
      ? this.durabilityConfig.highTensionDamage * (this.tension.current / this.tension.max) * delta * 60 
      : 0;
    
    const turbulenceDamage = turbulenceLevel > 0.3 
      ? this.durabilityConfig.turbulenceDamage * turbulenceLevel * delta * 60 
      : 0;
    
    const totalDamage = tensionDamage + turbulenceDamage;
    if (totalDamage > 0) {
      this.takeDamage(totalDamage);
    }
    
    const isStable = !this.tension.isOverTension && !this.tension.isUnderTension && turbulenceLevel < 0.3;
    const recovery = isStable && this.durability.current < this.durability.max
      ? this.durabilityConfig.passiveRecoveryRate * delta * 60
      : 0;
    if (recovery > 0) {
      this.recoverDurability(recovery);
    }

    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= delta;
      this.updateDamageVisual();
    }

    return { tensionDamage, turbulenceDamage, recovery };
  }

  private updateDamageVisual(): void {
    const flashIntensity = this.damageFlashTimer > 0 ? Math.sin(this.damageFlashTimer * 30) * 0.5 + 0.5 : 0;
    const sail = this.mesh.children[0] as THREE.Mesh;
    if (sail && sail.material) {
      const material = sail.material as THREE.MeshStandardMaterial;
      material.emissive.setRGB(flashIntensity, 0, 0);
      material.emissiveIntensity = flashIntensity;
    }
  }

  public getStringLength(): number {
    return this.currentStringLength;
  }

  public isDurabilityCritical(): boolean {
    return this.durability.isCritical;
  }

  public isOverTension(): boolean {
    return this.tension.isOverTension;
  }

  public getTensionEfficiency(): number {
    const diffFromOptimal = Math.abs(this.tension.current - this.tension.optimal);
    const maxDiff = Math.max(this.tension.optimal, this.tension.max - this.tension.optimal);
    return Math.max(0.3, 1 - diffFromOptimal / maxDiff);
  }

  private createKiteMesh(): THREE.Group {
    const kiteGroup = new THREE.Group();

    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 8);
    sailShape.quadraticCurveTo(8, 4, 6, 0);
    sailShape.quadraticCurveTo(0, -2, -6, 0);
    sailShape.quadraticCurveTo(-8, 4, 0, 8);

    const sailGeometry = new THREE.ShapeGeometry(sailShape);
    const sailMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      side: THREE.DoubleSide,
      roughness: 0.6,
      metalness: 0.1,
    });
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.castShadow = true;
    sail.rotation.x = -0.3;
    kiteGroup.add(sail);

    const frameGeometry = new THREE.CylinderGeometry(0.08, 0.08, 14, 8);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    });

    const vFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    vFrame.rotation.z = Math.PI / 2;
    kiteGroup.add(vFrame);

    const hFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    hFrame.scale.y = 0.7;
    hFrame.rotation.x = Math.PI / 2;
    kiteGroup.add(hFrame);

    const tailGroup = this.createTail();
    tailGroup.position.set(0, -6, 0);
    kiteGroup.add(tailGroup);

    return kiteGroup;
  }

  private createTail(): THREE.Group {
    const tailGroup = new THREE.Group();
    const tailLength = 20;
    const segmentCount = 15;

    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const segmentPos = new THREE.Vector3(0, -t * tailLength, 0);
      this.tailSegments.push(segmentPos.clone());

      const ribbonGeometry = new THREE.PlaneGeometry(0.5, 1.5);
      const hue = (i / segmentCount) * 0.3;
      const ribbonMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.5),
        side: THREE.DoubleSide,
      });
      const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
      ribbon.position.copy(segmentPos);
      ribbon.name = `tail-${i}`;
      tailGroup.add(ribbon);
    }

    return tailGroup;
  }

  private createShadow(): void {
    const shadowShape = new THREE.Shape();
    shadowShape.ellipse(0, 0, 7, 4, 0, Math.PI * 2, false, 0);

    const shadowGeometry = new THREE.ShapeGeometry(shadowShape);
    const shadowMaterial = new THREE.ShadowMaterial({
      opacity: 0.4,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.receiveShadow = true;
  }

  private createString(): void {
    const stringPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      stringPoints.push(new THREE.Vector3(0, 0, 0));
    }
    const stringGeometry = new THREE.BufferGeometry().setFromPoints(
      stringPoints
    );
    const stringMaterial = new THREE.LineBasicMaterial({
      color: 0x444444,
      linewidth: 1,
    });
    this.stringMesh = new THREE.Line(stringGeometry, stringMaterial);
  }

  private createTrail(): THREE.Points {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.3;
      colors[i * 3 + 2] = 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  public updatePhysics(
    input: { x: number; y: number; z: number },
    gravity: number,
    delta: number,
    flightStability: number = 1,
    trackingScore: number = 0.5
  ): { efficiency: number; isDurabilityPenalized: boolean; isTensionPenalized: boolean } {
    const fp = this.flightParams;

    const durabilityRatio = this.durability.current / this.durability.max;
    const tensionEfficiency = this.getTensionEfficiency();
    
    const isDurabilityPenalized = durabilityRatio < 0.5;
    const isTensionPenalized = this.tension.isOverTension || this.tension.isUnderTension;
    
    const durabilityPenalty = isDurabilityPenalized ? 0.5 + durabilityRatio * 0.5 : 1;
    const tensionPenalty = tensionEfficiency;
    
    const combinedEfficiency = durabilityPenalty * tensionPenalty;

    const combinedStability = (0.7 + flightStability * 0.5) * fp.stabilityFactor * combinedEfficiency;
    const trackingBoost = 1 + trackingScore * 0.3;

    const effectiveAccel = fp.acceleration * this.config.kiteSpeed * 2 * combinedEfficiency;

    const acceleration = new THREE.Vector3(
      input.x * effectiveAccel * combinedStability * trackingBoost,
      input.y * effectiveAccel * 0.8 * combinedStability * (1 + fp.liftForce * 20),
      -input.z * effectiveAccel * combinedStability * trackingBoost * fp.turnRate
    );

    this.velocity.add(acceleration.multiplyScalar(delta));

    const liftOffset = fp.liftForce * 1.5 * tensionEfficiency;
    const gravityEffect = gravity * (1 - trackingScore * 0.2 - liftOffset);
    this.velocity.y -= gravityEffect;

    const baseDrag = fp.dragCoefficient;
    const stabilityDrag = flightStability * 0.015;
    const tensionDrag = this.tension.isUnderTension ? 0.01 : 0;
    const dragFactor = Math.min(0.995, baseDrag - stabilityDrag + tensionDrag);
    this.velocity.multiplyScalar(dragFactor);

    const baseMaxSpeed = fp.maxSpeed * combinedEfficiency;
    const stabilityBonus = flightStability * 0.6;
    const trackingBonus = trackingScore * 0.3;
    const maxSpeed = baseMaxSpeed + stabilityBonus + trackingBonus;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    this.group.position.add(this.velocity);

    const maxAltitude = fp.maxAltitude;
    this.group.position.y = Math.max(5, Math.min(maxAltitude, this.group.position.y));

    const boundary = this.config.worldSize;
    this.group.position.x = Math.max(
      -boundary,
      Math.min(boundary, this.group.position.x)
    );
    this.group.position.z = Math.max(
      -boundary,
      Math.min(boundary, this.group.position.z)
    );

    const turnMultiplier = fp.turnRate * combinedEfficiency;
    const targetRotationX = -this.velocity.y * 0.5 * turnMultiplier;
    const targetRotationZ = -this.velocity.x * 0.3 * turnMultiplier;
    const targetRotationY = this.velocity.z * 0.2 * turnMultiplier;

    const rotationSmooth = 0.1 * fp.stabilityFactor * (isDurabilityPenalized ? 0.7 : 1);
    this.rotation.x += (targetRotationX - this.rotation.x) * rotationSmooth;
    this.rotation.y += (targetRotationY - this.rotation.y) * rotationSmooth;
    this.rotation.z += (targetRotationZ - this.rotation.z) * rotationSmooth;

    this.mesh.rotation.x = this.rotation.x;
    this.mesh.rotation.y = this.rotation.y;
    this.mesh.rotation.z = this.rotation.z;

    this.updateTail();
    this.updateShadow();
    this.updateString();
    this.updateTrail();

    return { 
      efficiency: combinedEfficiency, 
      isDurabilityPenalized, 
      isTensionPenalized 
    };
  }

  private updateTail(): void {
    const tailGroup = this.mesh.children.find(
      (c) => c.children.length > 10
    ) as THREE.Group;
    if (!tailGroup) return;

    for (let i = 0; i < this.tailSegments.length; i++) {
      const ribbon = tailGroup.children[i] as THREE.Mesh;
      if (!ribbon) continue;

      const wave = Math.sin(Date.now() * 0.005 + i * 0.5) *
        0.3;
      ribbon.rotation.z = wave + this.rotation.z * 0.5;
      ribbon.position.x = wave * i * 0.2;
    }
  }

  private updateShadow(): void {
    this.shadowMesh.position.set(
      this.group.position.x,
      0.1,
      this.group.position.z - 20
    );

    const heightFactor = Math.min(1, this.group.position.y / 200);
    const scale = 1 + heightFactor * 1.5;
    this.shadowMesh.scale.set(scale * 1.5, scale * 1.2, scale);

    const shadowMaterial = this.shadowMesh
      .material as THREE.ShadowMaterial;
    shadowMaterial.opacity = 0.55 * (1 - heightFactor * 0.4);
  }

  private updateString(): void {
    const positions = this.stringMesh.geometry.attributes.position
      .array as Float32Array;
    const kitePos = this.group.position;
    const anchorPos = new THREE.Vector3(
      kitePos.x,
      0,
      kitePos.z - 20
    );

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const sag = Math.sin(t * Math.PI) * 5;
      positions[i * 3] = THREE.MathUtils.lerp(
        anchorPos.x,
        kitePos.x,
        t
      );
      positions[i * 3 + 1] = THREE.MathUtils.lerp(
        anchorPos.y,
        kitePos.y,
        t
      ) - sag;
      positions[i * 3 + 2] = THREE.MathUtils.lerp(
        anchorPos.z,
        kitePos.z,
        t
      );
    }
    this.stringMesh.geometry.attributes.position.needsUpdate = true;
  }

  private updateTrail(): void {
    const positions = this.trailParticles.geometry.attributes.position
      .array as Float32Array;

    for (let i = positions.length - 3; i >= 3; i -= 3) {
      positions[i] = positions[i - 3];
      positions[i + 1] = positions[i - 3 + 1];
      positions[i + 2] = positions[i - 3 + 2];
    }

    positions[0] = this.group.position.x;
    positions[1] = this.group.position.y;
    positions[2] = this.group.position.z;

    this.trailParticles.geometry.attributes.position.needsUpdate = true;
  }

  public applyAirCurrent(force: Vector3, trackingScore: number = 0.5, flightStability: number = 1): void {
    const fp = this.flightParams;
    const trackingMultiplier = 0.7 + trackingScore * 0.8;
    const stabilityMultiplier = 0.8 + flightStability * 0.4;
    const windMultiplier = fp.windResponse;
    const multiplier = trackingMultiplier * stabilityMultiplier * windMultiplier;

    this.velocity.x += force.x * multiplier;
    this.velocity.y += force.y * multiplier;
    this.velocity.z += force.z * multiplier;
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  public getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  public setFlightParams(params: FlightParams): void {
    this.flightParams = { ...params };
  }

  public getFlightParams(): FlightParams {
    return { ...this.flightParams };
  }

  public reset(): void {
    this.group.position.set(0, 80, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
    this.currentStringLength = 80;
    this.damageFlashTimer = 0;
    this.durability = this.createDurabilityState();
    this.tension = this.createTensionState();
    const sail = this.mesh.children[0] as THREE.Mesh;
    if (sail && sail.material) {
      const material = sail.material as THREE.MeshStandardMaterial;
      material.emissive.setRGB(0, 0, 0);
      material.emissiveIntensity = 0;
    }
  }
}
