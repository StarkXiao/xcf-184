import React from 'react';
import type { KitePart } from '../types';
import { RARITY_COLORS, RARITY_NAMES, ATTRIBUTE_NAMES } from '../types';

interface PartCardProps {
  part: KitePart;
  isEquipped: boolean;
  onEquip: (partId: string) => void;
  onUnlock: (partId: string) => void;
  coins: number;
}

export const PartCard: React.FC<PartCardProps> = ({
  part,
  isEquipped,
  onEquip,
  onUnlock,
  coins,
}) => {
  const rarityColor = RARITY_COLORS[part.rarity];
  const rarityName = RARITY_NAMES[part.rarity];

  const handleClick = () => {
    if (part.unlocked) {
      onEquip(part.id);
    } else if (coins >= part.price) {
      onUnlock(part.id);
    }
  };

  return (
    <div
      className={`part-card ${isEquipped ? 'equipped' : ''} ${!part.unlocked ? 'locked' : ''}`}
      style={{ borderColor: rarityColor }}
      onClick={handleClick}
    >
      <div className="part-card-header" style={{ background: `linear-gradient(135deg, ${rarityColor}22, transparent)` }}>
        <span className="part-icon">{part.icon}</span>
        <span className="part-rarity-badge" style={{ background: rarityColor }}>
          {rarityName}
        </span>
      </div>

      <div className="part-card-body">
        <h3 className="part-name">{part.name}</h3>
        <p className="part-description">{part.description}</p>

        <div className="part-attributes">
          {Object.entries(part.attributes).map(([key, value]) => {
            if (value === 0) return null;
            return (
              <div key={key} className={`attr-item ${value > 0 ? 'positive' : 'negative'}`}>
                <span className="attr-name">{ATTRIBUTE_NAMES[key as keyof typeof ATTRIBUTE_NAMES]}</span>
                <span className="attr-value">{value > 0 ? '+' : ''}{value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="part-card-footer">
        {part.unlocked ? (
          isEquipped ? (
            <span className="equipped-label">已装备</span>
          ) : (
            <button className="equip-button">装备</button>
          )
        ) : (
          <button
            className={`unlock-button ${coins < part.price ? 'disabled' : ''}`}
            disabled={coins < part.price}
          >
            <span className="price-icon">🪙</span>
            <span className="price-text">{part.price}</span>
          </button>
        )}
      </div>

      {!part.unlocked && <div className="part-lock-overlay">🔒</div>}
    </div>
  );
};
