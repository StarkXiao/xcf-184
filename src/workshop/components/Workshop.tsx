import React, { useState, useMemo } from 'react';
import type { PartSlot, KitePart } from '../types';
import { useWorkshop } from '../useWorkshop';
import { EquipSlots } from './EquipSlots';
import { PartsList } from './PartsList';
import { AttributesPanel } from './AttributesPanel';
import { KitePreview } from './KitePreview';

interface WorkshopProps {
  onClose: () => void;
  onStartGame: () => void;
}

export const Workshop: React.FC<WorkshopProps> = ({ onClose, onStartGame }) => {
  const {
    state,
    parts,
    equipped,
    totalAttributes,
    flightParams,
    equipPart,
    unlockPart,
    getEquippedPart,
    getCombinedVisuals,
  } = useWorkshop();

  const [selectedSlot, setSelectedSlot] = useState<PartSlot>('sail');

  const equippedParts = useMemo(() => {
    const result: Record<PartSlot, KitePart | null> = {
      sail: null,
      frame: null,
      tail: null,
      string: null,
      decoration: null,
    };
    const slots: PartSlot[] = ['sail', 'frame', 'tail', 'string', 'decoration'];
    slots.forEach((slot) => {
      result[slot] = getEquippedPart(slot);
    });
    return result;
  }, [getEquippedPart]);

  const visuals = getCombinedVisuals();

  const handleSlotSelect = (slot: PartSlot) => {
    setSelectedSlot(slot);
  };

  const handleEquip = (partId: string) => {
    equipPart(partId);
  };

  const handleUnlock = (partId: string) => {
    unlockPart(partId);
  };

  return (
    <div className="workshop-overlay">
      <div className="workshop-container">
        <div className="workshop-header">
          <div className="workshop-title-section">
            <h1 className="workshop-title">
              <span className="title-icon">🛠️</span>
              风筝改装工坊
            </h1>
            <p className="workshop-subtitle">打造专属于你的最强风筝</p>
          </div>

          <div className="workshop-header-actions">
            <div className="coins-display">
              <span className="coins-icon">🪙</span>
              <span className="coins-value">{state.coins.toLocaleString()}</span>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="workshop-body">
          <div className="workshop-left">
            <KitePreview
              sailColor={visuals.sailColor}
              frameColor={visuals.frameColor}
              tailColor={visuals.tailColor}
              tailLength={visuals.tailLength}
              stringColor={visuals.stringColor}
            />
            <EquipSlots
              equippedParts={equippedParts}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
            />
          </div>

          <div className="workshop-center">
            <PartsList
              parts={parts}
              selectedSlot={selectedSlot}
              equippedPartId={equipped[selectedSlot]}
              onEquip={handleEquip}
              onUnlock={handleUnlock}
              coins={state.coins}
            />
          </div>

          <div className="workshop-right">
            <AttributesPanel
              totalAttributes={totalAttributes}
              flightParams={flightParams}
              scoreBonus={state.totalScoreBonus}
            />

            <div className="bonus-info-panel">
              <h3 className="panel-title">收益加成</h3>
              <div className="bonus-items">
                <div className="bonus-item">
                  <span className="bonus-item-label">距离加成</span>
                  <span className="bonus-item-value positive">+{state.distanceBonus}%</span>
                </div>
                <div className="bonus-item">
                  <span className="bonus-item-label">高度加成</span>
                  <span className="bonus-item-value positive">+{state.heightBonus}%</span>
                </div>
                <div className="bonus-item highlight">
                  <span className="bonus-item-label">总分数加成</span>
                  <span className="bonus-item-value positive">+{state.totalScoreBonus}%</span>
                </div>
              </div>
            </div>

            <button className="start-game-button" onClick={onStartGame}>
              <span className="button-text">开始飞行</span>
              <span className="button-icon">🚀</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
