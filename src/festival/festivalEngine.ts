import type {
  FestivalConfig,
  FestivalTask,
  FestivalScene,
  FestivalItem,
  ExchangeItem,
  FestivalState,
  FestivalProgress,
  FestivalStatus,
  TaskStatus,
  FestivalLeaderboardEntry,
  TaskReward,
  ActiveBuff,
  ItemBuffEffect,
  GameConfigOverride,
  PlayerInventory,
} from './types';
import { DEFAULT_FESTIVAL_PROGRESS } from './types';
import {
  FESTIVALS,
  FESTIVAL_TASKS,
  FESTIVAL_SCENES,
  FESTIVAL_ITEMS,
  EXCHANGE_ITEMS,
  NPC_LEADERBOARD,
} from './festivalData';

const SAVE_KEY = 'kite_festival_save';
const DAY_MS = 24 * 60 * 60 * 1000;

type ProgressKeyHandler = (
  args: Record<string, number | string | boolean>,
) => number;

export class FestivalEngine {
  private state: FestivalState;
  private progressKeyHandlers: Record<string, ProgressKeyHandler>;

  constructor() {
    this.state = {
      status: 'upcoming',
      currentFestivalId: null,
      currentSceneId: null,
      activeBuffs: [],
      progress: { ...DEFAULT_FESTIVAL_PROGRESS },
      leaderboard: [],
    };

    this.progressKeyHandlers = this.initProgressKeyHandlers();
    this.initializeActiveFestival();
    this.generateLeaderboard();
  }

  private initProgressKeyHandlers(): Record<string, ProgressKeyHandler> {
    return {
      flights_completed: () => 1,
      single_score_2000: (args) => ((args.score as number) >= 2000 ? 1 : 0),
      single_distance_500: (args) => ((args.distance as number) >= 500 ? 1 : 0),
      no_collision_flights: (args) => (args.collisions === 0 ? 1 : 0),
      total_flights: () => 1,
      total_score: (args) => (args.score as number) || 0,
      total_air_currents: (args) => (args.airCurrentCount as number) || 0,
      spring_scene_flights: (args) =>
        args.sceneId === 'scene_spring_sakura' ? 1 : 0,
      leaderboard_top10: () => 0,
    };
  }

  private initializeActiveFestival(): void {
    const now = Date.now();
    const activeFestival = FESTIVALS.find(
      (f) => f.startDate <= now && f.endDate >= now
    );

    if (activeFestival) {
      this.state.currentFestivalId = activeFestival.id;
      this.state.status = 'active';
      this.initProgressForFestival(activeFestival.id);
    } else {
      const upcomingFestival = FESTIVALS.find((f) => f.startDate > now);
      if (upcomingFestival) {
        this.state.currentFestivalId = upcomingFestival.id;
        this.state.status = 'upcoming';
      } else if (FESTIVALS.length > 0) {
        const lastFestival = FESTIVALS[FESTIVALS.length - 1];
        this.state.currentFestivalId = lastFestival.id;
        this.state.status = 'ended';
      }
    }
  }

  private initProgressForFestival(festivalId: string): void {
    const tasks = this.getTasksForFestival(festivalId);
    tasks.forEach((task) => {
      if (!(task.id in this.state.progress.taskStatuses)) {
        this.state.progress.taskStatuses[task.id] = task.unlockCondition
          ? 'locked'
          : 'in_progress';
        this.state.progress.taskProgress[task.id] = 0;
      }
    });

    const scenes = this.getScenesForFestival(festivalId);
    scenes.forEach((scene) => {
      if (
        scene.unlocked &&
        !this.state.progress.unlockedScenes.includes(scene.id)
      ) {
        this.state.progress.unlockedScenes.push(scene.id);
      }
    });
  }

  public getState(): FestivalState {
    return {
      ...this.state,
      progress: { ...this.state.progress },
      leaderboard: [...this.state.leaderboard],
      activeBuffs: [...this.state.activeBuffs],
    };
  }

  public getStatus(): FestivalStatus {
    return this.state.status;
  }

  public getCurrentFestival(): FestivalConfig | undefined {
    if (!this.state.currentFestivalId) return undefined;
    return FESTIVALS.find((f) => f.id === this.state.currentFestivalId);
  }

  public getAllFestivals(): FestivalConfig[] {
    return [...FESTIVALS];
  }

  public getFestival(festivalId: string): FestivalConfig | undefined {
    return FESTIVALS.find((f) => f.id === festivalId);
  }

  public getTasksForFestival(festivalId: string): FestivalTask[] {
    return FESTIVAL_TASKS.filter((t) => t.festivalId === festivalId).sort(
      (a, b) => a.order - b.order
    );
  }

  public getTask(taskId: string): FestivalTask | undefined {
    return FESTIVAL_TASKS.find((t) => t.id === taskId);
  }

  public getTaskProgress(taskId: string): number {
    return this.state.progress.taskProgress[taskId] || 0;
  }

  public getTaskStatus(taskId: string): TaskStatus {
    return this.state.progress.taskStatuses[taskId] || 'locked';
  }

  public getScenesForFestival(festivalId: string): FestivalScene[] {
    return FESTIVAL_SCENES.filter((s) => s.festivalId === festivalId);
  }

  public getScene(sceneId: string): FestivalScene | undefined {
    return FESTIVAL_SCENES.find((s) => s.id === sceneId);
  }

  public isSceneUnlocked(sceneId: string): boolean {
    const scene = this.getScene(sceneId);
    if (!scene) return false;
    if (scene.unlocked) return true;
    return this.state.progress.unlockedScenes.includes(sceneId);
  }

  public unlockScene(sceneId: string): boolean {
    const scene = this.getScene(sceneId);
    if (!scene) return false;
    if (this.isSceneUnlocked(sceneId)) return false;

    const cost = scene.unlockCost || 0;
    if (this.state.progress.festivalCurrency < cost) return false;

    this.state.progress.festivalCurrency -= cost;
    this.state.progress.unlockedScenes.push(sceneId);
    return true;
  }

  public getItemsForFestival(festivalId: string): FestivalItem[] {
    return FESTIVAL_ITEMS.filter((i) => i.festivalId === festivalId);
  }

  public getItem(itemId: string): FestivalItem | undefined {
    return FESTIVAL_ITEMS.find((i) => i.id === itemId);
  }

  public getInventory(): PlayerInventory[] {
    return [...this.state.progress.inventory];
  }

  public getItemQuantity(itemId: string): number {
    const inv = this.state.progress.inventory.find((i) => i.itemId === itemId);
    return inv?.quantity || 0;
  }

  public addItem(itemId: string, quantity: number): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;

    const existing = this.state.progress.inventory.find(
      (i) => i.itemId === itemId
    );
    if (existing) {
      if (!item.stackable && existing.quantity > 0) return false;
      existing.quantity += quantity;
    } else {
      this.state.progress.inventory.push({
        itemId,
        quantity,
        firstAcquiredAt: Date.now(),
      });
    }
    return true;
  }

  public useItem(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item || !item.buffEffect) return false;

    const invItem = this.state.progress.inventory.find(
      (i) => i.itemId === itemId
    );
    if (!invItem || invItem.quantity <= 0) return false;

    invItem.quantity -= 1;
    invItem.lastUsedAt = Date.now();

    const buff: ActiveBuff = {
      itemId,
      effect: { ...item.buffEffect },
      activatedAt: Date.now(),
      expiresAt: Date.now() + (item.buffEffect.duration || 1) * DAY_MS,
    };
    this.state.activeBuffs.push(buff);

    if (invItem.quantity <= 0) {
      this.state.progress.inventory = this.state.progress.inventory.filter(
        (i) => i.itemId !== itemId
      );
    }

    return true;
  }

  public getActiveBuffs(): ActiveBuff[] {
    const now = Date.now();
    this.state.activeBuffs = this.state.activeBuffs.filter(
      (b) => b.expiresAt > now
    );
    return [...this.state.activeBuffs];
  }

  public getTotalBuffValue(effectType: ItemBuffEffect['type']): number {
    return this.getActiveBuffs()
      .filter((b) => b.effect.type === effectType)
      .reduce((sum, b) => sum + b.effect.value, 0);
  }

  public getExchangesForFestival(festivalId: string): ExchangeItem[] {
    return EXCHANGE_ITEMS.filter((e) => e.festivalId === festivalId);
  }

  public getExchange(exchangeId: string): ExchangeItem | undefined {
    return EXCHANGE_ITEMS.find((e) => e.id === exchangeId);
  }

  public getExchangePurchaseCount(exchangeId: string): number {
    return this.state.progress.claimedExchanges.filter(
      (id) => id === exchangeId
    ).length;
  }

  public canPurchaseExchange(exchangeId: string): boolean {
    const exchange = this.getExchange(exchangeId);
    if (!exchange) return false;
    if (this.state.progress.festivalCurrency < exchange.cost) return false;

    const purchased = this.getExchangePurchaseCount(exchangeId);
    if (exchange.limitPerPlayer && purchased >= exchange.limitPerPlayer) {
      return false;
    }
    if (exchange.dailyLimit) {
      const todayPurchased = this.state.progress.claimedExchanges.filter(
        (id) => id === exchangeId
      ).length;
      if (todayPurchased >= exchange.dailyLimit) return false;
    }

    return true;
  }

  public purchaseExchange(exchangeId: string): {
    reward: TaskReward;
    coinValue: number;
  } | null {
    const exchange = this.getExchange(exchangeId);
    if (!exchange || !this.canPurchaseExchange(exchangeId)) return null;

    this.state.progress.festivalCurrency -= exchange.cost;
    this.state.progress.claimedExchanges.push(exchangeId);

    const reward = exchange.reward;
    const festival = this.getCurrentFestival();
    const currencyId = festival?.currencyId ?? '';
    let coinValue = 0;

    if (reward.type === 'coin') {
      coinValue = reward.amount;
    } else if (reward.type === 'item' && reward.id) {
      if (reward.id === currencyId) {
        this.state.progress.festivalCurrency += reward.amount;
      } else {
        this.addItem(reward.id, reward.amount);
      }
    }

    return { reward, coinValue };
  }

  public getFestivalCurrency(): number {
    return this.state.progress.festivalCurrency;
  }

  public addFestivalCurrency(amount: number): void {
    this.state.progress.festivalCurrency += Math.max(0, amount);
  }

  public getTotalScore(): number {
    return this.state.progress.totalScore;
  }

  public selectScene(sceneId: string): boolean {
    if (!this.isSceneUnlocked(sceneId)) return false;
    this.state.currentSceneId = sceneId;
    return true;
  }

  public getCurrentScene(): FestivalScene | undefined {
    if (!this.state.currentSceneId) return undefined;
    return this.getScene(this.state.currentSceneId);
  }

  public getGameConfigOverride(sceneId: string): GameConfigOverride | null {
    const scene = this.getScene(sceneId);
    if (!scene) return null;

    const scoreBuff = this.getTotalBuffValue('score');
    const coinBuff = 0;

    return {
      worldSize: scene.worldSize,
      gravity: scene.gravity,
      airCurrentSpawnRate: scene.airCurrentSpawnRate,
      minAirCurrentStrength: scene.minAirCurrentStrength,
      maxAirCurrentStrength: scene.maxAirCurrentStrength,
      buildingDensity: scene.buildingDensity,
      turbulenceLevel: scene.turbulenceLevel,
      cloudCoverage: scene.cloudCoverage,
      scoreMultiplier: scene.scoreMultiplier * (1 + scoreBuff),
      coinMultiplier: scene.coinMultiplier * (1 + coinBuff),
    };
  }

  public recordFlight(flightData: {
    score: number;
    distance: number;
    maxHeight: number;
    airCurrentCount: number;
    collisions: number;
    sceneId?: string;
  }): void {
    if (this.state.status !== 'active' || !this.state.currentFestivalId)
      return;

    this.checkDailyReset();

    const festivalId = this.state.currentFestivalId;
    const tasks = this.getTasksForFestival(festivalId);

    tasks.forEach((task) => {
      const handler = this.progressKeyHandlers[task.progressKey];
      if (!handler) return;

      const currentStatus = this.getTaskStatus(task.id);
      if (currentStatus === 'locked' || currentStatus === 'claimed') return;

      const progress = handler({
        score: flightData.score,
        distance: flightData.distance,
        maxHeight: flightData.maxHeight,
        airCurrentCount: flightData.airCurrentCount,
        collisions: flightData.collisions,
        sceneId: (flightData.sceneId || this.state.currentSceneId) ?? '',
      });

      if (progress > 0) {
        this.state.progress.taskProgress[task.id] = Math.min(
          (this.state.progress.taskProgress[task.id] || 0) + progress,
          task.target
        );

        if (
          this.state.progress.taskProgress[task.id] >= task.target &&
          currentStatus === 'in_progress'
        ) {
          this.state.progress.taskStatuses[task.id] = 'completed';
        }
      }
    });

    this.state.progress.totalScore += flightData.score;

    if (flightData.sceneId) {
      const currentHigh = this.state.progress.highScores[flightData.sceneId] || 0;
      if (flightData.score > currentHigh) {
        this.state.progress.highScores[flightData.sceneId] = flightData.score;
      }
    }

    this.updateLeaderboardRankCheck();
    this.generateLeaderboard();
  }

  private updateLeaderboardRankCheck(): void {
    const playerRank = this.state.leaderboard.findIndex((e) => e.isPlayer);
    if (playerRank >= 0 && playerRank < 10) {
      const task = FESTIVAL_TASKS.find(
        (t) => t.progressKey === 'leaderboard_top10'
      );
      if (task) {
        const status = this.getTaskStatus(task.id);
        if (status === 'in_progress') {
          this.state.progress.taskProgress[task.id] = 1;
          this.state.progress.taskStatuses[task.id] = 'completed';
        }
      }
    }
  }

  public claimTaskReward(taskId: string): {
    rewards: TaskReward[];
    coinValue: number;
    festivalCurrencyValue: number;
  } | null {
    const task = this.getTask(taskId);
    if (!task) return null;

    const status = this.getTaskStatus(taskId);
    if (status !== 'completed') return null;

    const festival = this.getCurrentFestival();
    const currencyId = festival?.currencyId ?? '';

    this.state.progress.taskStatuses[taskId] = 'claimed';

    let totalCoinValue = 0;
    let totalFestivalCurrencyValue = 0;

    task.rewards.forEach((reward) => {
      if (reward.type === 'coin') {
        totalCoinValue += reward.amount;
      } else if (reward.type === 'item' && reward.id) {
        if (reward.id === currencyId) {
          this.state.progress.festivalCurrency += reward.amount;
          totalFestivalCurrencyValue += reward.amount;
        } else {
          this.addItem(reward.id, reward.amount);
        }
      } else if (reward.type === 'badge' && reward.id) {
        if (!this.state.progress.badges.includes(reward.id)) {
          this.state.progress.badges.push(reward.id);
        }
      } else if (reward.type === 'score_bonus') {
        // 得分加成类型奖励可在此处理
      }
    });

    return {
      rewards: task.rewards,
      coinValue: totalCoinValue,
      festivalCurrencyValue: totalFestivalCurrencyValue,
    };
  }

  public getRewardsCoinValue(rewards: TaskReward[]): number {
    return rewards
      .filter((r) => r.type === 'coin')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  private checkDailyReset(): void {
    const todayStart = new Date().setHours(0, 0, 0, 0);

    if (this.state.progress.lastDailyReset < todayStart) {
      this.state.progress.lastDailyReset = todayStart;

      if (!this.state.currentFestivalId) return;
      const tasks = this.getTasksForFestival(this.state.currentFestivalId);

      tasks.forEach((task) => {
        if (task.dailyReset) {
          this.state.progress.taskProgress[task.id] = 0;
          this.state.progress.taskStatuses[task.id] = task.unlockCondition
            ? 'locked'
            : 'in_progress';
        }
      });
    }
  }

  private generateLeaderboard(): void {
    const entries: FestivalLeaderboardEntry[] = [];
    const playerScore = this.state.progress.totalScore;
    const playerCurrency = this.state.progress.festivalCurrency;
    const completedTasks = Object.values(
      this.state.progress.taskStatuses
    ).filter((s) => s === 'completed' || s === 'claimed').length;
    const badgeCount = this.state.progress.badges.length;

    entries.push({
      rank: 0,
      playerId: 'player',
      playerName: '我',
      score: playerScore,
      festivalCurrency: playerCurrency,
      completedTasks,
      badgeCount,
      isPlayer: true,
    });

    NPC_LEADERBOARD.forEach((npc) => {
      const variance = 0.85 + Math.random() * 0.3;
      entries.push({
        rank: 0,
        playerId: npc.playerId,
        playerName: npc.playerName,
        score: Math.floor(npc.score * variance),
        festivalCurrency: Math.floor(npc.festivalCurrency * variance),
        completedTasks: npc.completedTasks,
        badgeCount: npc.badgeCount,
        isPlayer: false,
      });
    });

    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.badgeCount !== a.badgeCount) return b.badgeCount - a.badgeCount;
      return b.completedTasks - a.completedTasks;
    });

    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.state.leaderboard = entries;
  }

  public getLeaderboard(): FestivalLeaderboardEntry[] {
    return [...this.state.leaderboard];
  }

  public getPlayerRank(): number {
    const playerEntry = this.state.leaderboard.find((e) => e.isPlayer);
    return playerEntry?.rank || -1;
  }

  public getProgress(): FestivalProgress {
    return { ...this.state.progress };
  }

  public getBadges(): string[] {
    return [...this.state.progress.badges];
  }

  public getHighScore(sceneId: string): number {
    return this.state.progress.highScores[sceneId] || 0;
  }

  public calculateAdjustedScore(baseScore: number, sceneId?: string): number {
    let multiplier = 1;

    if (sceneId) {
      const scene = this.getScene(sceneId);
      if (scene) multiplier *= scene.scoreMultiplier;
    }

    multiplier *= 1 + this.getTotalBuffValue('score');
    return Math.floor(baseScore * multiplier);
  }

  public calculateAdjustedCoins(baseCoins: number, sceneId?: string): number {
    let multiplier = 1;

    if (sceneId) {
      const scene = this.getScene(sceneId);
      if (scene) multiplier *= scene.coinMultiplier;
    }

    return Math.floor(baseCoins * multiplier);
  }

  public reset(): void {
    this.state = {
      status: 'upcoming',
      currentFestivalId: null,
      currentSceneId: null,
      activeBuffs: [],
      progress: { ...DEFAULT_FESTIVAL_PROGRESS },
      leaderboard: [],
    };
    this.initializeActiveFestival();
    this.generateLeaderboard();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        currentFestivalId: this.state.currentFestivalId,
        currentSceneId: this.state.currentSceneId,
        progress: this.state.progress,
        activeBuffs: this.state.activeBuffs,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save festival data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);

      if (data.progress) {
        this.state.progress = {
          ...DEFAULT_FESTIVAL_PROGRESS,
          ...data.progress,
        };
      }

      if (data.currentFestivalId) {
        this.state.currentFestivalId = data.currentFestivalId;
      }

      if (data.currentSceneId) {
        this.state.currentSceneId = data.currentSceneId;
      }

      if (data.activeBuffs) {
        this.state.activeBuffs = data.activeBuffs;
      }

      this.initializeActiveFestival();
      this.generateLeaderboard();

      return true;
    } catch (e) {
      console.error('Failed to load festival data:', e);
      return false;
    }
  }
}

export const festivalEngine = new FestivalEngine();
