import { useState, useEffect, useCallback } from 'react';
import { workshopEngine } from './workshopEngine';
import type {
  KitePart,
  EquippedParts,
  PartAttributes,
  FlightParams,
  PartSlot,
  WorkshopState,
} from './types';

export function useWorkshop() {
  const [state, setState] = useState<WorkshopState>(workshopEngine.getState());
  const [parts, setParts] = useState<KitePart[]>(workshopEngine.getParts());
  const [equipped, setEquipped] = useState<EquippedParts>(workshopEngine.getEquippedParts());
  const [totalAttributes, setTotalAttributes] = useState<PartAttributes>(workshopEngine.getTotalAttributes());
  const [flightParams, setFlightParams] = useState<FlightParams>(workshopEngine.getFlightParams());

  const refreshState = useCallback(() => {
    setState(workshopEngine.getState());
    setParts(workshopEngine.getParts());
    setEquipped(workshopEngine.getEquippedParts());
    setTotalAttributes(workshopEngine.getTotalAttributes());
    setFlightParams(workshopEngine.getFlightParams());
  }, []);

  useEffect(() => {
    workshopEngine.loadFromLocalStorage();
    refreshState();
  }, [refreshState]);

  const equipPart = useCallback((partId: string): boolean => {
    const success = workshopEngine.equipPart(partId);
    if (success) {
      workshopEngine.saveToLocalStorage();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const unequipPart = useCallback((slot: PartSlot): void => {
    workshopEngine.unequipPart(slot);
    workshopEngine.saveToLocalStorage();
    refreshState();
  }, [refreshState]);

  const unlockPart = useCallback((partId: string): boolean => {
    const success = workshopEngine.unlockPart(partId);
    if (success) {
      workshopEngine.saveToLocalStorage();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const addCoins = useCallback((amount: number): void => {
    workshopEngine.addCoins(amount);
    workshopEngine.saveToLocalStorage();
    refreshState();
  }, [refreshState]);

  const getPartsBySlot = useCallback((slot: PartSlot): KitePart[] => {
    return workshopEngine.getPartsBySlot(slot);
  }, []);

  const getEquippedPart = useCallback((slot: PartSlot): KitePart | null => {
    return workshopEngine.getEquippedPart(slot);
  }, []);

  const getCombinedVisuals = useCallback(() => {
    return workshopEngine.getCombinedVisuals();
  }, []);

  const calculateFinalScore = useCallback((baseScore: number): number => {
    return workshopEngine.calculateFinalScore(baseScore);
  }, []);

  const calculateCoinsEarned = useCallback((baseScore: number): number => {
    return workshopEngine.calculateCoinsEarned(baseScore);
  }, []);

  return {
    state,
    parts,
    equipped,
    totalAttributes,
    flightParams,
    equipPart,
    unequipPart,
    unlockPart,
    addCoins,
    getPartsBySlot,
    getEquippedPart,
    getCombinedVisuals,
    calculateFinalScore,
    calculateCoinsEarned,
    refreshState,
  };
}
