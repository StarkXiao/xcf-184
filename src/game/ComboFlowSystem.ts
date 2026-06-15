import * as THREE from 'three';
import type {
  AirCurrent,
  ComboFlowState,
  ComboFlowHit,
  ComboVisualEffect,
  Vector3,
} from './types';
import { DEFAULT_COMBO_FLOW_STATE } from './types';

export interface ComboFlowCallbacks {
  onComboHit?: (hit: ComboFlowHit) => void;
  onComboBreak?: (finalCombo: number, totalScore: number) => void;
  onComboMilestone?: (combo: number, milestone: number) => void;
  onPerfectHit?: (hit: ComboFlowHit) => void;
  onVisualEffect?: (effect: ComboVisualEffect) => void;
}

export class ComboFlowSystem {
  public state: ComboFlowState;
  private callbacks: ComboFlowCallbacks;
  private processedAirCurrents: Set<string> = new Set();
  private currentAirCurrentEntries: Map<string, { entryTime: number; entryPos: THREE.Vector3; entryAngle: number }> = new Map();
  private visualEffects: ComboVisualEffect[] = [];
  private scene: THREE.Scene;
  private effectMeshes: Map<string, THREE.Group> = new Map();

  private readonly BASE_SCORE = 10;
  private readonly PERFECT_BONUS = 2.5;
  private readonly GOOD_BONUS = 1.5;
  private readonly COMBO_MULTIPLIER_STEP = 0.1;
  private readonly MAX_COMBO_MULTIPLIER = 5.0;
  private readonly COMBO_TIMEOUT = 2.5;
  private readonly MILESTONES = [5, 10, 20, 30, 50, 100];
  private readonly PERFECT_ANGLE_THRESHOLD = 0.3;
  private readonly GOOD_ANGLE_THRESHOLD = 0.6;
  private readonly PERFECT_CENTER_THRESHOLD = 0.25;
  private readonly GOOD_CENTER_THRESHOLD = 0.5;

  constructor(scene: THREE.Scene, callbacks: ComboFlowCallbacks = {}) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.state = { ...DEFAULT_COMBO_FLOW_STATE, hits: [] };
  }

  public update(
    _delta: number,
    currentTime: number,
    kitePosition: THREE.Vector3,
    kiteVelocity: THREE.Vector3,
    airCurrents: AirCurrent[],
    shadowBrightness: number,
    flightStability: number
  ): void {
    if (this.state.isActive) {
      const timeSinceLastHit = (currentTime - this.state.lastHitTime) / 1000;
      if (timeSinceLastHit > this.COMBO_TIMEOUT && this.state.combo > 0) {
        this.breakCombo(currentTime);
      }
    }

    for (const airCurrent of airCurrents) {
      const distance = Math.sqrt(
        (kitePosition.x - airCurrent.position.x) ** 2 +
          (kitePosition.y - airCurrent.position.y) ** 2 +
          (kitePosition.z - airCurrent.position.z) ** 2
      );

      const isInside = distance < airCurrent.radius;
      const hasEntry = this.currentAirCurrentEntries.has(airCurrent.id);

      if (isInside && !hasEntry && !this.processedAirCurrents.has(airCurrent.id)) {
        const velocityNorm = kiteVelocity.clone().normalize();
        const toCenter = new THREE.Vector3(
          airCurrent.position.x - kitePosition.x,
          airCurrent.position.y - kitePosition.y,
          airCurrent.position.z - kitePosition.z
        ).normalize();
        const entryAngle = velocityNorm.dot(toCenter);

        this.currentAirCurrentEntries.set(airCurrent.id, {
          entryTime: currentTime,
          entryPos: kitePosition.clone(),
          entryAngle,
        });
      }

      if (!isInside && hasEntry) {
        const entry = this.currentAirCurrentEntries.get(airCurrent.id)!;
        this.processAirCurrentHit(
          airCurrent,
          entry,
          kitePosition,
          currentTime,
          shadowBrightness,
          flightStability
        );
        this.currentAirCurrentEntries.delete(airCurrent.id);
        this.processedAirCurrents.add(airCurrent.id);
      }
    }

    this.updateVisualEffects(currentTime);
  }

  private processAirCurrentHit(
    airCurrent: AirCurrent,
    entry: { entryTime: number; entryPos: THREE.Vector3; entryAngle: number },
    exitPos: THREE.Vector3,
    currentTime: number,
    shadowBrightness: number,
    flightStability: number
  ): void {
    const distToCenter = Math.sqrt(
      (exitPos.x - airCurrent.position.x) ** 2 +
        (exitPos.y - airCurrent.position.y) ** 2 +
        (exitPos.z - airCurrent.position.z) ** 2
    );
    const centerRatio = Math.min(1, distToCenter / airCurrent.radius);

    const angleScore = entry.entryAngle;

    const isPerfect =
      angleScore > 1 - this.PERFECT_ANGLE_THRESHOLD &&
      centerRatio < this.PERFECT_CENTER_THRESHOLD &&
      shadowBrightness > 0.6 &&
      flightStability > 0.7;

    const isGood =
      !isPerfect &&
      (angleScore > 1 - this.GOOD_ANGLE_THRESHOLD ||
        centerRatio < this.GOOD_CENTER_THRESHOLD);

    this.state.combo++;
    this.state.totalHits++;

    if (isPerfect) {
      this.state.perfectHits++;
    }

    this.state.currentMultiplier = Math.min(
      this.MAX_COMBO_MULTIPLIER,
      1.0 + (this.state.combo - 1) * this.COMBO_MULTIPLIER_STEP
    );

    let hitScore = this.BASE_SCORE;
    hitScore *= airCurrent.strength * 5;
    hitScore *= 1 + shadowBrightness * 0.8;
    hitScore *= 1 + flightStability * 0.3;

    if (isPerfect) {
      hitScore *= this.PERFECT_BONUS;
    } else if (isGood) {
      hitScore *= this.GOOD_BONUS;
    }

    hitScore *= this.state.currentMultiplier;
    hitScore = Math.floor(hitScore);

    this.state.comboScore += hitScore;
    this.state.totalComboScore += hitScore;

    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    if (!this.state.isActive || this.state.combo === 1) {
      this.state.isActive = true;
      this.state.comboStartTime = currentTime;
    }

    const comboDuration = (currentTime - this.state.comboStartTime) / 1000;
    if (comboDuration > this.state.longestComboTime) {
      this.state.longestComboTime = comboDuration;
    }

    this.state.lastHitTime = currentTime;

    const hit: ComboFlowHit = {
      id: `hit-${Date.now()}-${Math.random()}`,
      airCurrentId: airCurrent.id,
      timestamp: currentTime,
      type: airCurrent.type,
      strength: airCurrent.strength,
      shadowBrightness,
      score: hitScore,
      comboCount: this.state.combo,
      isPerfect,
      position: {
        x: airCurrent.position.x,
        y: airCurrent.position.y,
        z: airCurrent.position.z,
      },
    };

    this.state.hits.push(hit);
    if (this.state.hits.length > 200) {
      this.state.hits = this.state.hits.slice(-200);
    }

    this.spawnHitEffect(hit, airCurrent, isPerfect, isGood, currentTime);

    if (this.callbacks.onComboHit) {
      this.callbacks.onComboHit(hit);
    }

    if (isPerfect && this.callbacks.onPerfectHit) {
      this.callbacks.onPerfectHit(hit);
    }

    for (const milestone of this.MILESTONES) {
      if (this.state.combo === milestone && this.callbacks.onComboMilestone) {
        this.callbacks.onComboMilestone(this.state.combo, milestone);
        this.spawnMilestoneEffect(milestone, airCurrent.position, currentTime);
      }
    }
  }

  private spawnHitEffect(
    hit: ComboFlowHit,
    airCurrent: AirCurrent,
    isPerfect: boolean,
    isGood: boolean,
    currentTime: number
  ): void {
    const pos = {
      x: airCurrent.position.x,
      y: airCurrent.position.y,
      z: airCurrent.position.z,
    };

    const hitEffect: ComboVisualEffect = {
      id: `vfx-hit-${Date.now()}-${Math.random()}`,
      type: 'hit',
      position: pos,
      startTime: currentTime,
      duration: 600,
      value: hit.score,
    };
    this.visualEffects.push(hitEffect);
    this.createHitMesh(hitEffect, airCurrent, isPerfect, isGood);

    if (isPerfect) {
      const perfectEffect: ComboVisualEffect = {
        id: `vfx-perfect-${Date.now()}-${Math.random()}`,
        type: 'perfect',
        position: pos,
        startTime: currentTime,
        duration: 800,
        text: 'PERFECT!',
      };
      this.visualEffects.push(perfectEffect);
      this.createTextMesh(perfectEffect, '#ffd700', 1.5);
    } else if (isGood) {
      const goodEffect: ComboVisualEffect = {
        id: `vfx-good-${Date.now()}-${Math.random()}`,
        type: 'combo',
        position: pos,
        startTime: currentTime,
        duration: 600,
        text: 'GOOD!',
      };
      this.visualEffects.push(goodEffect);
      this.createTextMesh(goodEffect, '#4ecdc4', 1.2);
    }

    if (hit.comboCount >= 3) {
      const comboEffect: ComboVisualEffect = {
        id: `vfx-combo-${Date.now()}-${Math.random()}`,
        type: 'combo',
        position: { ...pos, y: pos.y + 5 },
        startTime: currentTime,
        duration: 700,
        text: `${hit.comboCount} COMBO!`,
        value: hit.comboCount,
      };
      this.visualEffects.push(comboEffect);
      this.createTextMesh(comboEffect, this.getComboColor(hit.comboCount), 1.8);
    }

    if (this.callbacks.onVisualEffect) {
      this.callbacks.onVisualEffect(hitEffect);
    }
  }

  private spawnMilestoneEffect(milestone: number, position: Vector3, currentTime: number): void {
    const effect: ComboVisualEffect = {
      id: `vfx-milestone-${Date.now()}-${Math.random()}`,
      type: 'milestone',
      position: { ...position, y: position.y + 10 },
      startTime: currentTime,
      duration: 1500,
      text: `${milestone} 连击里程碑!`,
      value: milestone,
    };
    this.visualEffects.push(effect);
    this.createMilestoneMesh(effect);

    if (this.callbacks.onVisualEffect) {
      this.callbacks.onVisualEffect(effect);
    }
  }

  private createHitMesh(
    effect: ComboVisualEffect,
    airCurrent: AirCurrent,
    isPerfect: boolean,
    isGood: boolean
  ): void {
    const group = new THREE.Group();

    const color = isPerfect
      ? 0xffd700
      : isGood
      ? 0x4ecdc4
      : airCurrent.type === 'updraft'
      ? 0x4ac6ff
      : airCurrent.type === 'downdraft'
      ? 0xff6b4a
      : 0xa855f7;

    const ringCount = isPerfect ? 3 : isGood ? 2 : 1;
    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(
        airCurrent.radius * (0.3 + i * 0.2),
        airCurrent.radius * (0.35 + i * 0.2),
        32
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8 - i * 0.2,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.userData.baseScale = 1;
      group.add(ring);
    }

    const particleCount = isPerfect ? 40 : isGood ? 25 : 15;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const c = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = airCurrent.radius * (0.2 + Math.random() * 0.6);
      const height = (Math.random() - 0.5) * airCurrent.radius * 0.5;
      positions[i * 3] = r * Math.cos(angle);
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = r * Math.sin(angle);

      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particles.userData.isParticles = true;
    group.add(particles);

    group.position.set(effect.position.x, effect.position.y, effect.position.z);
    group.userData.effectId = effect.id;

    this.effectMeshes.set(effect.id, group);
    this.scene.add(group);
  }

  private createTextMesh(effect: ComboVisualEffect, colorHex: string, scale: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.font = `bold ${48 * scale}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText(effect.text || '', 256, 64);
    ctx.fillStyle = colorHex;
    ctx.fillText(effect.text || '', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12 * scale, 3 * scale, 1);
    sprite.position.set(effect.position.x, effect.position.y + 8, effect.position.z);
    sprite.userData.effectId = effect.id;
    sprite.userData.isText = true;

    this.effectMeshes.set(`text-${effect.id}`, sprite as unknown as THREE.Group);
    this.scene.add(sprite);
  }

  private createMilestoneMesh(effect: ComboVisualEffect): void {
    const group = new THREE.Group();

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 8;
      const geometry = new THREE.SphereGeometry(0.4, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffd700 : 0xff6b9d,
        transparent: true,
        opacity: 1,
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      sphere.userData.orbitAngle = angle;
      sphere.userData.orbitRadius = radius;
      group.add(sphere);
    }

    this.createTextMesh(effect, '#ffd700', 2.5);

    group.position.set(effect.position.x, effect.position.y, effect.position.z);
    group.userData.effectId = effect.id;
    group.userData.isMilestone = true;

    this.effectMeshes.set(effect.id, group);
    this.scene.add(group);
  }

  private breakCombo(currentTime: number): void {
    if (this.state.combo > 1) {
      const duration = (currentTime - this.state.comboStartTime) / 1000;
      if (duration > this.state.longestComboTime) {
        this.state.longestComboTime = duration;
      }

      if (this.callbacks.onComboBreak) {
        this.callbacks.onComboBreak(this.state.combo, this.state.comboScore);
      }

      this.state.comboBreakCount++;

      const breakEffect: ComboVisualEffect = {
        id: `vfx-break-${Date.now()}-${Math.random()}`,
        type: 'break',
        position: { x: 0, y: 0, z: 0 },
        startTime: currentTime,
        duration: 500,
        text: `连击中断! 得分: ${this.state.comboScore}`,
      };
      if (this.callbacks.onVisualEffect) {
        this.callbacks.onVisualEffect(breakEffect);
      }
    }

    this.state.combo = 0;
    this.state.comboScore = 0;
    this.state.currentMultiplier = 1.0;
    this.state.isActive = false;
  }

  private updateVisualEffects(currentTime: number): void {
    for (let i = this.visualEffects.length - 1; i >= 0; i--) {
      const effect = this.visualEffects[i];
      const elapsed = currentTime - effect.startTime;
      const progress = Math.min(1, elapsed / effect.duration);

      const mesh = this.effectMeshes.get(effect.id);
      if (mesh) {
        this.animateEffectMesh(mesh, effect, progress);
      }

      const textMesh = this.effectMeshes.get(`text-${effect.id}`);
      if (textMesh) {
        this.animateTextMesh(textMesh, effect, progress);
      }

      if (progress >= 1) {
        this.removeEffect(effect.id);
        this.visualEffects.splice(i, 1);
      }
    }
  }

  private animateEffectMesh(
    mesh: THREE.Group,
    _effect: ComboVisualEffect,
    progress: number
  ): void {
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const fadeOut = 1 - progress;

    mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
        child.scale.setScalar(1 + easeOut * 1.5);
        if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = fadeOut * 0.8;
        }
      } else if (child instanceof THREE.Points) {
        if (child.material instanceof THREE.PointsMaterial) {
          child.material.opacity = fadeOut;
        }
        const positions = child.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= 1.02;
          positions[i + 1] += 0.1;
          positions[i + 2] *= 1.02;
        }
        child.geometry.attributes.position.needsUpdate = true;
      } else if (child instanceof THREE.Mesh && child.userData.orbitAngle !== undefined) {
        const angle = child.userData.orbitAngle + progress * Math.PI * 2;
        const radius = child.userData.orbitRadius * (1 + easeOut * 0.5);
        child.position.x = Math.cos(angle) * radius;
        child.position.y = easeOut * 10;
        child.position.z = Math.sin(angle) * radius;
        if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = fadeOut;
        }
      }
    });
  }

  private animateTextMesh(
    mesh: THREE.Group,
    _effect: ComboVisualEffect,
    progress: number
  ): void {
    const sprite = mesh as unknown as THREE.Sprite;
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const fadeOut = 1 - progress;

    sprite.position.y += 0.05;
    sprite.scale.setScalar(1 + easeOut * 0.3);

    if (sprite.material instanceof THREE.SpriteMaterial) {
      sprite.material.opacity = fadeOut;
    }
  }

  private removeEffect(id: string): void {
    const mesh = this.effectMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.effectMeshes.delete(id);
    }

    const textId = `text-${id}`;
    const textMesh = this.effectMeshes.get(textId);
    if (textMesh) {
      this.scene.remove(textMesh);
      const sprite = textMesh as unknown as THREE.Sprite;
      if (sprite.material instanceof THREE.SpriteMaterial) {
        sprite.material.map?.dispose();
        sprite.material.dispose();
      }
      this.effectMeshes.delete(textId);
    }
  }

  private getComboColor(combo: number): string {
    if (combo >= 50) return '#ff0080';
    if (combo >= 30) return '#ff00ff';
    if (combo >= 20) return '#ff4040';
    if (combo >= 10) return '#ff8c00';
    if (combo >= 5) return '#ffd700';
    return '#4ecdc4';
  }

  public getComboGrade(): { grade: string; color: string } {
    const maxCombo = this.state.maxCombo;
    const perfectRate = this.state.totalHits > 0 ? this.state.perfectHits / this.state.totalHits : 0;

    if (maxCombo >= 100 && perfectRate >= 0.5) return { grade: 'SS+', color: '#ff0080' };
    if (maxCombo >= 50) return { grade: 'SS', color: '#ff00ff' };
    if (maxCombo >= 30) return { grade: 'S', color: '#ffd700' };
    if (maxCombo >= 20) return { grade: 'A+', color: '#ff6b6b' };
    if (maxCombo >= 10) return { grade: 'A', color: '#ff8c00' };
    if (maxCombo >= 5) return { grade: 'B', color: '#4ecdc4' };
    if (maxCombo >= 3) return { grade: 'C', color: '#95e1d3' };
    return { grade: 'D', color: '#aaaaaa' };
  }

  public getState(): ComboFlowState {
    return {
      ...this.state,
      hits: [...this.state.hits],
    };
  }

  public reset(): void {
    const effectsToRemove = [...this.visualEffects];
    for (const effect of effectsToRemove) {
      this.removeEffect(effect.id);
    }
    this.visualEffects = [];
    this.processedAirCurrents.clear();
    this.currentAirCurrentEntries.clear();
    this.state = { ...DEFAULT_COMBO_FLOW_STATE, hits: [] };
  }

  public clearExpiredProcessed(): void {
    if (this.processedAirCurrents.size > 500) {
      const entries = Array.from(this.processedAirCurrents);
      this.processedAirCurrents = new Set(entries.slice(-300));
    }
  }
}
