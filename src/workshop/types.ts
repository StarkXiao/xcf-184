export type PartSlot = 'sail' | 'frame' | 'tail' | 'string' | 'decoration';

export type PartRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface KitePart {
  id: string;
  name: string;
  description: string;
  slot: PartSlot;
  rarity: PartRarity;
  icon: string;
  attributes: PartAttributes;
  visual: PartVisual;
  unlocked: boolean;
  price: number;
}

export interface PartAttributes {
  lift: number;
  stability: number;
  speed: number;
  durability: number;
  maneuverability: number;
  windResistance: number;
}

export interface PartVisual {
  color?: string;
  secondaryColor?: string;
  scale?: number;
  tailLength?: number;
  pattern?: string;
}

export interface EquippedParts {
  sail: string | null;
  frame: string | null;
  tail: string | null;
  string: string | null;
  decoration: string | null;
}

export interface FlightParams {
  maxSpeed: number;
  acceleration: number;
  liftForce: number;
  dragCoefficient: number;
  stabilityFactor: number;
  windResponse: number;
  maxAltitude: number;
  turnRate: number;
}

export interface WorkshopState {
  parts: KitePart[];
  equipped: EquippedParts;
  coins: number;
  totalScoreBonus: number;
  distanceBonus: number;
  heightBonus: number;
}

export const DEFAULT_ATTRIBUTES: PartAttributes = {
  lift: 0,
  stability: 0,
  speed: 0,
  durability: 0,
  maneuverability: 0,
  windResistance: 0,
};

export const DEFAULT_FLIGHT_PARAMS: FlightParams = {
  maxSpeed: 1.2,
  acceleration: 0.5,
  liftForce: 0.015,
  dragCoefficient: 0.98,
  stabilityFactor: 1.0,
  windResponse: 1.0,
  maxAltitude: 300,
  turnRate: 1.0,
};

export const RARITY_COLORS: Record<PartRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export const RARITY_NAMES: Record<PartRarity, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const SLOT_NAMES: Record<PartSlot, string> = {
  sail: '风筝面',
  frame: '骨架',
  tail: '尾巴',
  string: '风筝线',
  decoration: '装饰',
};

export const ATTRIBUTE_NAMES: Record<keyof PartAttributes, string> = {
  lift: '升力',
  stability: '稳定性',
  speed: '速度',
  durability: '耐久度',
  maneuverability: '机动性',
  windResistance: '抗风性',
};
