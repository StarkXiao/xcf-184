import React from 'react';
import type { KitePart, PartSlot } from '../types';
import { SLOT_NAMES } from '../types';
import { PartCard } from './PartCard';

interface PartsListProps {
  parts: KitePart[];
  selectedSlot: PartSlot;
  equippedPartId: string | null;
  onEquip: (partId: string) => void;
  onUnlock: (partId: string) => void;
  coins: number;
}

export const PartsList: React.FC<PartsListProps> = ({
  parts,
  selectedSlot,
  equippedPartId,
  onEquip,
  onUnlock,
  coins,
}) => {
  const slotParts = parts.filter((p) => p.slot === selectedSlot);

  return (
    <div className="parts-list">
      <h3 className="panel-title">
        {SLOT_NAMES[selectedSlot]} · 部件库
        <span className="parts-count">({slotParts.length})</span>
      </h3>
      <div className="parts-grid">
        {slotParts.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            isEquipped={equippedPartId === part.id}
            onEquip={onEquip}
            onUnlock={onUnlock}
            coins={coins}
          />
        ))}
      </div>
    </div>
  );
};
