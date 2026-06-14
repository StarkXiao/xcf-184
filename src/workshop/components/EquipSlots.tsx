import React from 'react';
import type { PartSlot, KitePart } from '../types';
import { SLOT_NAMES, RARITY_COLORS } from '../types';

interface EquipSlotsProps {
  equippedParts: Record<PartSlot, KitePart | null>;
  selectedSlot: PartSlot | null;
  onSlotSelect: (slot: PartSlot) => void;
}

const SLOT_ICONS: Record<PartSlot, string> = {
  sail: '🪁',
  frame: '🎋',
  tail: '🎀',
  string: '🧵',
  decoration: '✨',
};

export const EquipSlots: React.FC<EquipSlotsProps> = ({
  equippedParts,
  selectedSlot,
  onSlotSelect,
}) => {
  const slots: PartSlot[] = ['sail', 'frame', 'tail', 'string', 'decoration'];

  return (
    <div className="equip-slots">
      <h3 className="panel-title">装配槽</h3>
      <div className="slots-grid">
        {slots.map((slot) => {
          const equippedPart = equippedParts[slot];
          const isSelected = selectedSlot === slot;
          const rarityColor = equippedPart ? RARITY_COLORS[equippedPart.rarity] : '#666';

          return (
            <div
              key={slot}
              className={`slot-item ${isSelected ? 'selected' : ''} ${equippedPart ? 'filled' : 'empty'}`}
              onClick={() => onSlotSelect(slot)}
              style={{ borderColor: isSelected ? rarityColor : undefined }}
            >
              <div className="slot-icon" style={{ background: equippedPart ? `${rarityColor}22` : 'rgba(255,255,255,0.05)' }}>
                {equippedPart ? equippedPart.icon : SLOT_ICONS[slot]}
              </div>
              <div className="slot-info">
                <span className="slot-name">{SLOT_NAMES[slot]}</span>
                <span className="slot-part-name">
                  {equippedPart ? equippedPart.name : '未装备'}
                </span>
              </div>
              {equippedPart && (
                <div
                  className="slot-rarity-indicator"
                  style={{ background: rarityColor }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
