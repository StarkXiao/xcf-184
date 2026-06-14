import type {
  KitePart,
  EquippedParts,
  PartAttributes,
  FlightParams,
  PartSlot,
  WorkshopState,
} from './types';
import {
  DEFAULT_ATTRIBUTES,
  DEFAULT_FLIGHT_PARAMS,
} from './types';
import { ALL_PARTS, INITIAL_PART_IDS } from './partsData';

export class WorkshopEngine {
  private state: WorkshopState;

  constructor() {
    const initialParts = ALL_PARTS.map((part) => ({
      ...part,
      unlocked: INITIAL_PART_IDS.includes(part.id),
    }));

    this.state = {
      parts: initialParts,
      equipped: {
        sail: 'sail_basic_red',
        frame: 'frame_bamboo',
        tail: 'tail_short_ribbon',
        string: 'string_cotton',
        decoration: 'deco_bell',
      },
      coins: 2000,
      totalScoreBonus: 0,
      distanceBonus: 0,
      heightBonus: 0,
    };

    this.calculateBonuses();
  }

  public getState(): WorkshopState {
    return { ...this.state };
  }

  public getParts(): KitePart[] {
    return [...this.state.parts];
  }

  public getPartById(id: string): KitePart | undefined {
    return this.state.parts.find((p) => p.id === id);
  }

  public getPartsBySlot(slot: PartSlot): KitePart[] {
    return this.state.parts.filter((p) => p.slot === slot);
  }

  public getEquippedParts(): EquippedParts {
    return { ...this.state.equipped };
  }

  public getEquippedPart(slot: PartSlot): KitePart | null {
    const partId = this.state.equipped[slot];
    if (!partId) return null;
    return this.getPartById(partId) || null;
  }

  public equipPart(partId: string): boolean {
    const part = this.getPartById(partId);
    if (!part || !part.unlocked) return false;

    this.state.equipped[part.slot] = partId;
    this.calculateBonuses();
    return true;
  }

  public unequipPart(slot: PartSlot): void {
    this.state.equipped[slot] = null;
    this.calculateBonuses();
  }

  public unlockPart(partId: string): boolean {
    const part = this.getPartById(partId);
    if (!part || part.unlocked) return false;
    if (this.state.coins < part.price) return false;

    this.state.coins -= part.price;
    const partIndex = this.state.parts.findIndex((p) => p.id === partId);
    if (partIndex !== -1) {
      this.state.parts[partIndex] = { ...part, unlocked: true };
    }
    return true;
  }

  public addCoins(amount: number): void {
    this.state.coins += amount;
  }

  public getTotalAttributes(): PartAttributes {
    const total: PartAttributes = { ...DEFAULT_ATTRIBUTES };
    const slots: PartSlot[] = ['sail', 'frame', 'tail', 'string', 'decoration'];

    slots.forEach((slot) => {
      const part = this.getEquippedPart(slot);
      if (part) {
        (Object.keys(part.attributes) as (keyof PartAttributes)[]).forEach((key) => {
          total[key] += part.attributes[key];
        });
      }
    });

    return total;
  }

  public getFlightParams(): FlightParams {
    const attrs = this.getTotalAttributes();
    const params = { ...DEFAULT_FLIGHT_PARAMS };

    params.maxSpeed = DEFAULT_FLIGHT_PARAMS.maxSpeed * (1 + attrs.speed * 0.02);
    params.acceleration = DEFAULT_FLIGHT_PARAMS.acceleration * (1 + attrs.speed * 0.015);
    params.liftForce = DEFAULT_FLIGHT_PARAMS.liftForce * (1 + attrs.lift * 0.025);
    params.dragCoefficient = Math.min(
      0.995,
      DEFAULT_FLIGHT_PARAMS.dragCoefficient + attrs.speed * 0.001
    );
    params.stabilityFactor = DEFAULT_FLIGHT_PARAMS.stabilityFactor + attrs.stability * 0.015;
    params.windResponse = DEFAULT_FLIGHT_PARAMS.windResponse * (1 + attrs.windResistance * 0.02);
    params.maxAltitude = DEFAULT_FLIGHT_PARAMS.maxAltitude + attrs.lift * 3;
    params.turnRate = DEFAULT_FLIGHT_PARAMS.turnRate * (1 + attrs.maneuverability * 0.02);

    return params;
  }

  private calculateBonuses(): void {
    const attrs = this.getTotalAttributes();
    const totalAttrPoints = Object.values(attrs).reduce((sum, val) => sum + val, 0);

    this.state.totalScoreBonus = Math.floor(totalAttrPoints * 0.5);
    this.state.distanceBonus = Math.floor(attrs.lift * 0.8 + attrs.speed * 0.5);
    this.state.heightBonus = Math.floor(attrs.lift * 1.2 + attrs.stability * 0.3);
  }

  public getScoreBonus(): number {
    return this.state.totalScoreBonus;
  }

  public getDistanceMultiplier(): number {
    return 1 + this.state.distanceBonus / 100;
  }

  public getHeightMultiplier(): number {
    return 1 + this.state.heightBonus / 100;
  }

  public calculateFinalScore(baseScore: number): number {
    return Math.floor(baseScore * (1 + this.state.totalScoreBonus / 100));
  }

  public calculateCoinsEarned(baseScore: number): number {
    return Math.floor(baseScore * 0.1 * (1 + this.state.totalScoreBonus / 200));
  }

  public getCombinedVisuals() {
    const visuals = {
      sailColor: '#ff4444',
      frameColor: '#8b4513',
      tailColor: '#ff6b6b',
      tailLength: 20,
      stringColor: '#f5f5dc',
      scale: 1,
    };

    const sailPart = this.getEquippedPart('sail');
    if (sailPart?.visual?.color) {
      visuals.sailColor = sailPart.visual.color;
    }

    const framePart = this.getEquippedPart('frame');
    if (framePart?.visual?.color) {
      visuals.frameColor = framePart.visual.color;
    }

    const tailPart = this.getEquippedPart('tail');
    if (tailPart?.visual?.color) {
      visuals.tailColor = tailPart.visual.color;
    }
    if (tailPart?.visual?.tailLength) {
      visuals.tailLength = tailPart.visual.tailLength;
    }

    const stringPart = this.getEquippedPart('string');
    if (stringPart?.visual?.color) {
      visuals.stringColor = stringPart.visual.color;
    }

    return visuals;
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        parts: this.state.parts.map((p) => ({ id: p.id, unlocked: p.unlocked })),
        equipped: this.state.equipped,
        coins: this.state.coins,
      };
      localStorage.setItem('kite_workshop_save', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save workshop data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem('kite_workshop_save');
      if (!saved) return false;

      const data = JSON.parse(saved);
      
      if (data.parts) {
        data.parts.forEach((savedPart: { id: string; unlocked: boolean }) => {
          const partIndex = this.state.parts.findIndex((p) => p.id === savedPart.id);
          if (partIndex !== -1) {
            this.state.parts[partIndex] = {
              ...this.state.parts[partIndex],
              unlocked: savedPart.unlocked,
            };
          }
        });
      }

      if (data.equipped) {
        this.state.equipped = { ...this.state.equipped, ...data.equipped };
      }

      if (typeof data.coins === 'number') {
        this.state.coins = data.coins;
      }

      this.calculateBonuses();
      return true;
    } catch (e) {
      console.error('Failed to load workshop data:', e);
      return false;
    }
  }
}

export const workshopEngine = new WorkshopEngine();
