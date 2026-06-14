import { useState, useCallback, useEffect } from 'react';
import { festivalEngine } from './festivalEngine';
import type {
  FestivalConfig,
  FestivalTask,
  FestivalScene,
  FestivalItem,
  ExchangeItem,
  FestivalState,
  FestivalProgress,
  FestivalLeaderboardEntry,
  TaskReward,
  TaskStatus,
  ActiveBuff,
  PlayerInventory,
  GameConfigOverride,
  ItemBuffEffect,
} from './types';

type Listener = () => void;

class FestivalStateEmitter {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const festivalStateEmitter = new FestivalStateEmitter();

export function useFestival(autoRefresh = true) {
  const [state, setState] = useState<FestivalState>(() => {
    festivalEngine.loadFromLocalStorage();
    return festivalEngine.getState();
  });
  const [progress, setProgress] = useState<FestivalProgress>(() =>
    festivalEngine.getProgress()
  );
  const [leaderboard, setLeaderboard] = useState<FestivalLeaderboardEntry[]>(
    () => festivalEngine.getLeaderboard()
  );
  const [inventory, setInventory] = useState<PlayerInventory[]>(() =>
    festivalEngine.getInventory()
  );
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>(() =>
    festivalEngine.getActiveBuffs()
  );

  const refreshState = useCallback(() => {
    setState({ ...festivalEngine.getState() });
    setProgress({ ...festivalEngine.getProgress() });
    setLeaderboard([...festivalEngine.getLeaderboard()]);
    setInventory([...festivalEngine.getInventory()]);
    setActiveBuffs([...festivalEngine.getActiveBuffs()]);
    festivalEngine.saveToLocalStorage();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const unsubscribe = festivalStateEmitter.subscribe(refreshState);
    return unsubscribe;
  }, [autoRefresh, refreshState]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => {
      refreshState();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshState]);

  const getCurrentFestival = useCallback((): FestivalConfig | undefined => {
    return festivalEngine.getCurrentFestival();
  }, []);

  const getAllFestivals = useCallback((): FestivalConfig[] => {
    return festivalEngine.getAllFestivals();
  }, []);

  const getFestival = useCallback(
    (festivalId: string): FestivalConfig | undefined => {
      return festivalEngine.getFestival(festivalId);
    },
    []
  );

  const getTasksForFestival = useCallback(
    (festivalId: string): FestivalTask[] => {
      return festivalEngine.getTasksForFestival(festivalId);
    },
    []
  );

  const getTask = useCallback(
    (taskId: string): FestivalTask | undefined => {
      return festivalEngine.getTask(taskId);
    },
    []
  );

  const getTaskProgress = useCallback((taskId: string): number => {
    return festivalEngine.getTaskProgress(taskId);
  }, []);

  const getTaskStatus = useCallback((taskId: string): TaskStatus => {
    return festivalEngine.getTaskStatus(taskId);
  }, []);

  const claimTaskReward = useCallback(
    (taskId: string): {
      rewards: TaskReward[];
      coinValue: number;
      festivalCurrencyValue: number;
    } | null => {
      const result = festivalEngine.claimTaskReward(taskId);
      if (result) {
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const getScenesForFestival = useCallback(
    (festivalId: string): FestivalScene[] => {
      return festivalEngine.getScenesForFestival(festivalId);
    },
    []
  );

  const getScene = useCallback(
    (sceneId: string): FestivalScene | undefined => {
      return festivalEngine.getScene(sceneId);
    },
    []
  );

  const isSceneUnlocked = useCallback((sceneId: string): boolean => {
    return festivalEngine.isSceneUnlocked(sceneId);
  }, []);

  const unlockScene = useCallback(
    (sceneId: string): boolean => {
      const success = festivalEngine.unlockScene(sceneId);
      if (success) {
        refreshState();
      }
      return success;
    },
    [refreshState]
  );

  const selectScene = useCallback(
    (sceneId: string): boolean => {
      const success = festivalEngine.selectScene(sceneId);
      if (success) {
        refreshState();
      }
      return success;
    },
    [refreshState]
  );

  const getCurrentScene = useCallback((): FestivalScene | undefined => {
    return festivalEngine.getCurrentScene();
  }, []);

  const getGameConfigOverride = useCallback(
    (sceneId: string): GameConfigOverride | null => {
      return festivalEngine.getGameConfigOverride(sceneId);
    },
    []
  );

  const getItemsForFestival = useCallback(
    (festivalId: string): FestivalItem[] => {
      return festivalEngine.getItemsForFestival(festivalId);
    },
    []
  );

  const getItem = useCallback(
    (itemId: string): FestivalItem | undefined => {
      return festivalEngine.getItem(itemId);
    },
    []
  );

  const getItemQuantity = useCallback((itemId: string): number => {
    return festivalEngine.getItemQuantity(itemId);
  }, []);

  const useItem = useCallback(
    (itemId: string): boolean => {
      const success = festivalEngine.useItem(itemId);
      if (success) {
        refreshState();
      }
      return success;
    },
    [refreshState]
  );

  const getTotalBuffValue = useCallback(
    (effectType: ItemBuffEffect['type']): number => {
      return festivalEngine.getTotalBuffValue(effectType);
    },
    []
  );

  const getExchangesForFestival = useCallback(
    (festivalId: string): ExchangeItem[] => {
      return festivalEngine.getExchangesForFestival(festivalId);
    },
    []
  );

  const getExchange = useCallback(
    (exchangeId: string): ExchangeItem | undefined => {
      return festivalEngine.getExchange(exchangeId);
    },
    []
  );

  const canPurchaseExchange = useCallback((exchangeId: string): boolean => {
    return festivalEngine.canPurchaseExchange(exchangeId);
  }, []);

  const getExchangePurchaseCount = useCallback((exchangeId: string): number => {
    return festivalEngine.getExchangePurchaseCount(exchangeId);
  }, []);

  const purchaseExchange = useCallback(
    (exchangeId: string): {
      reward: TaskReward;
      coinValue: number;
    } | null => {
      const result = festivalEngine.purchaseExchange(exchangeId);
      if (result) {
        refreshState();
      }
      return result;
    },
    [refreshState]
  );

  const getFestivalCurrency = useCallback((): number => {
    return festivalEngine.getFestivalCurrency();
  }, []);

  const addFestivalCurrency = useCallback(
    (amount: number): void => {
      festivalEngine.addFestivalCurrency(amount);
      refreshState();
    },
    [refreshState]
  );

  const getPlayerRank = useCallback((): number => {
    return festivalEngine.getPlayerRank();
  }, []);

  const getHighScore = useCallback((sceneId: string): number => {
    return festivalEngine.getHighScore(sceneId);
  }, []);

  const recordFlight = useCallback(
    (flightData: {
      score: number;
      distance: number;
      maxHeight: number;
      airCurrentCount: number;
      collisions: number;
      sceneId?: string;
    }): void => {
      festivalEngine.recordFlight(flightData);
      refreshState();
    },
    [refreshState]
  );

  const calculateAdjustedScore = useCallback(
    (baseScore: number, sceneId?: string): number => {
      return festivalEngine.calculateAdjustedScore(baseScore, sceneId);
    },
    []
  );

  const calculateAdjustedCoins = useCallback(
    (baseCoins: number, sceneId?: string): number => {
      return festivalEngine.calculateAdjustedCoins(baseCoins, sceneId);
    },
    []
  );

  const reset = useCallback(() => {
    festivalEngine.reset();
    refreshState();
  }, [refreshState]);

  return {
    state,
    progress,
    leaderboard,
    inventory,
    activeBuffs,
    getCurrentFestival,
    getAllFestivals,
    getFestival,
    getTasksForFestival,
    getTask,
    getTaskProgress,
    getTaskStatus,
    claimTaskReward,
    getScenesForFestival,
    getScene,
    isSceneUnlocked,
    unlockScene,
    selectScene,
    getCurrentScene,
    getGameConfigOverride,
    getItemsForFestival,
    getItem,
    getItemQuantity,
    useItem,
    getTotalBuffValue,
    getExchangesForFestival,
    getExchange,
    canPurchaseExchange,
    getExchangePurchaseCount,
    purchaseExchange,
    getFestivalCurrency,
    addFestivalCurrency,
    getPlayerRank,
    getHighScore,
    recordFlight,
    calculateAdjustedScore,
    calculateAdjustedCoins,
    reset,
    refreshState,
  };
}
