import * as THREE from 'three';
import type { GameConfig, Vector3 } from './types';

export class Kite {
  public group: THREE.Group;
  public mesh: THREE.Group;
  public shadowMesh!: THREE.Mesh;
  public stringMesh!: THREE.Line;
  public trailParticles: THREE.Points;
  public velocity: THREE.Vector3;
  public rotation: THREE.Vector3;
  private config: GameConfig;
  private tailSegments: THREE.Vector3[] = [];

  constructor(config: GameConfig) {
    this.config = config;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Vector3(0, 0, 0);

    this.group = new THREE.Group();
    this.mesh = this.createKiteMesh();
    this.createShadow();
    this.createString();
    this.trailParticles = this.createTrail();
    this.group.add(this.mesh);

    this.group.position.set(0, 80, 0);
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
  ): void {
    const stabilityFactor = 0.7 + flightStability * 0.5;
    const trackingBoost = 1 + trackingScore * 0.3;

    const acceleration = new THREE.Vector3(
      input.x * this.config.kiteSpeed * stabilityFactor * trackingBoost,
      input.y * this.config.kiteSpeed * 0.8 * stabilityFactor,
      -input.z * this.config.kiteSpeed * stabilityFactor * trackingBoost
    );

    this.velocity.add(acceleration.multiplyScalar(delta));
    this.velocity.y -= gravity * (1 - trackingScore * 0.2);

    const dragFactor = 0.98 - flightStability * 0.015;
    this.velocity.multiplyScalar(dragFactor);

    const maxSpeed = 1.2 + flightStability * 0.6 + trackingScore * 0.3;
    if (this.velocity.length() > maxSpeed) {
      this.velocity.setLength(maxSpeed);
    }

    this.group.position.add(this.velocity);

    this.group.position.y = Math.max(5, this.group.position.y);

    const boundary = this.config.worldSize;
    this.group.position.x = Math.max(
      -boundary,
      Math.min(boundary, this.group.position.x)
    );
    this.group.position.z = Math.max(
      -boundary,
      Math.min(boundary, this.group.position.z)
    );

    const targetRotationX = -this.velocity.y * 0.5;
    const targetRotationZ = -this.velocity.x * 0.3;
    const targetRotationY = this.velocity.z * 0.2;

    this.rotation.x += (targetRotationX - this.rotation.x) * 0.1;
    this.rotation.y += (targetRotationY - this.rotation.y) * 0.1;
    this.rotation.z += (targetRotationZ - this.rotation.z) * 0.1;

    this.mesh.rotation.x = this.rotation.x;
    this.mesh.rotation.y = this.rotation.y;
    this.mesh.rotation.z = this.rotation.z;

    this.updateTail();
    this.updateShadow();
    this.updateString();
    this.updateTrail();
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
    const trackingMultiplier = 0.7 + trackingScore * 0.8;
    const stabilityMultiplier = 0.8 + flightStability * 0.4;
    const multiplier = trackingMultiplier * stabilityMultiplier;

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

  public reset(): void {
    this.group.position.set(0, 80, 0);
    this.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0);
  }
}
