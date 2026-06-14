import React from 'react';
import type { FestivalItem, PlayerInventory } from '../types';
import {
  ITEM_RARITY_COLORS,
  ITEM_RARITY_NAMES,
  ITEM_CATEGORY_NAMES,
} from '../types';

interface ItemsPanelProps {
  items: FestivalItem[];
  inventory: PlayerInventory[];
  getItemQuantity: (itemId: string) => number;
  onUseItem: (itemId: string) => void;
}

export const ItemsPanel: React.FC<ItemsPanelProps> = ({
  items,
  getItemQuantity,
  onUseItem,
}) => {
  const usableItems = items.filter(
    (i) => i.category === 'buff' && i.buffEffect
  );
  const displayItems = items.filter(
    (i) => i.category !== 'buff' || !i.buffEffect
  );

  const renderItemCard = (item: FestivalItem) => {
    const quantity = getItemQuantity(item.id);
    const hasItem = quantity > 0;
    const isUsable = item.category === 'buff' && item.buffEffect;

    return (
      <div
        key={item.id}
        className={`festival-item-card ${hasItem ? 'owned' : 'not-owned'}`}
        style={{ borderColor: ITEM_RARITY_COLORS[item.rarity] }}
      >
        <div
          className="festival-item-rarity"
          style={{ background: ITEM_RARITY_COLORS[item.rarity] }}
        >
          {ITEM_RARITY_NAMES[item.rarity]}
        </div>
        <div className="festival-item-icon">{item.icon}</div>
        <div className="festival-item-name">{item.name}</div>
        <div className="festival-item-category">
          {ITEM_CATEGORY_NAMES[item.category]}
        </div>
        <div className="festival-item-desc">{item.description}</div>

        {item.buffEffect && (
          <div className="festival-item-buff">
            {getBuffDescription(item.buffEffect)}
          </div>
        )}

        <div className="festival-item-quantity">数量：{quantity}</div>

        {isUsable && (
          <button
            className="festival-item-use-btn"
            disabled={!hasItem}
            onClick={() => hasItem && onUseItem(item.id)}
          >
            使用
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="festival-items-panel">
      {usableItems.length > 0 && (
        <div className="festival-item-group">
          <div className="festival-item-group-title">增益道具</div>
          <div className="festival-items-grid">
            {usableItems.map(renderItemCard)}
          </div>
        </div>
      )}

      {displayItems.length > 0 && (
        <div className="festival-item-group">
          <div className="festival-item-group-title">其他收藏</div>
          <div className="festival-items-grid">
            {displayItems.map(renderItemCard)}
          </div>
        </div>
      )}
    </div>
  );
};

function getBuffDescription(effect: {
  type: string;
  value: number;
  duration?: number;
}): string {
  const typeMap: Record<string, string> = {
    score: '得分',
    distance: '距离',
    height: '高度',
    stability: '稳定性',
    wind_resist: '抗风性',
    combo: '连击倍率',
  };
  return `${typeMap[effect.type] || effect.type} +${Math.round(
    effect.value * 100
  )}%${effect.duration ? `，持续${effect.duration}局` : ''}`;
}
