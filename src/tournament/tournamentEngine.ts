import type {
  Division,
  DivisionConfig,
  TrackConfig,
  ChapterConfig,
  ChapterProgress,
  TrackResult,
  LiveScore,
  ScoringEvent,
  ScoringEventType,
  RankTier,
  RankingEntry,
  TournamentState,
  TournamentEntry,
  GameConfigOverride,
} from './types';
import {
  RANK_TIER_THRESHOLDS,
  DEFAULT_LIVE_SCORE,
} from './types';
import { DIVISIONS, TRACKS, CHAPTERS, NPC_LEADERBOARD } from './tournamentData';

const COMBO_WINDOW = 3000;
const COMBO_MULTIPLIER_STEP = 0.25;
const MAX_COMBO_MULTIPLIER = 3.0;
const SAVE_KEY = 'kite_tournament_save';

export class TournamentEngine {
  private state: TournamentState;

  constructor() {
    this.state = {
      status: 'idle',
      currentEntry: null,
      currentTrackId: null,
      liveScore: { ...DEFAULT_LIVE_SCORE },
      trackResults: {},
      chapterProgress: {},
      rankings: [],
      totalCoins: 0,
    };

    this.initChapterProgress();
  }

  private initChapterProgress(): void {
    CHAPTERS.forEach((chapter) => {
      this.state.chapterProgress[chapter.id] = {
        chapterId: chapter.id,
        status: chapter.unlockChapterId === null ? 'unlocked' : 'locked',
        completedTracks: [],
        masteredTracks: [],
        bestScores: {},
        totalAttempts: 0,
      };
    });
  }

  public getState(): TournamentState {
    return { ...this.state };
  }

  public getDivision(division: Division): DivisionConfig {
    return DIVISIONS.find((d) => d.id === division)!;
  }

  public getDivisionForScore(score: number): Division {
    for (let i = DIVISIONS.length - 1; i >= 0; i--) {
      if (score >= DIVISIONS[i].minScore) return DIVISIONS[i].id;
    }
    return 'novice';
  }

  public getAllDivisions(): DivisionConfig[] {
    return [...DIVISIONS];
  }

  public getTrack(trackId: string): TrackConfig | undefined {
    return TRACKS.find((t) => t.id === trackId);
  }

  public getTracksForChapter(chapterId: string): TrackConfig[] {
    return TRACKS.filter((t) => t.chapterId === chapterId);
  }

  public getAllTracks(): TrackConfig[] {
    return [...TRACKS];
  }

  public getChapter(chapterId: string): ChapterConfig | undefined {
    return CHAPTERS.find((c) => c.id === chapterId);
  }

  public getAllChapters(): ChapterConfig[] {
    return [...CHAPTERS];
  }

  public getChapterProgress(chapterId: string): ChapterProgress {
    return this.state.chapterProgress[chapterId] || {
      chapterId,
      status: 'locked',
      completedTracks: [],
      masteredTracks: [],
      bestScores: {},
      totalAttempts: 0,
    };
  }

  public isTrackUnlocked(trackId: string): boolean {
    const track = this.getTrack(trackId);
    if (!track) return false;

    const chapterProgress = this.getChapterProgress(track.chapterId);
    if (chapterProgress.status === 'locked') return false;

    const chapter = this.getChapter(track.chapterId);
    if (!chapter) return false;

    const trackIndex = chapter.trackIds.indexOf(trackId);
    if (trackIndex === 0) return true;

    const prevTrackId = chapter.trackIds[trackIndex - 1];
    return this.state.trackResults[prevTrackId]?.completedAt != null;
  }

  public isChapterUnlocked(chapterId: string): boolean {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return false;
    if (chapter.unlockChapterId === null) return true;

    const prerequisiteProgress = this.getChapterProgress(chapter.unlockChapterId);
    return prerequisiteProgress.status === 'completed' || prerequisiteProgress.status === 'mastered';
  }

  public register(playerName: string): boolean {
    if (this.state.status !== 'idle') return false;

    const entry: TournamentEntry = {
      id: `player_${Date.now()}`,
      playerName,
      division: 'novice',
      totalScore: 0,
      completedTracks: [],
      chapterProgress: { ...this.state.chapterProgress },
      joinedAt: Date.now(),
    };

    this.state.currentEntry = entry;
    this.state.status = 'registered';
    this.generateRankings();

    return true;
  }

  public selectTrack(trackId: string): boolean {
    if (this.state.status !== 'registered' && this.state.status !== 'completed') return false;
    if (!this.isTrackUnlocked(trackId)) return false;

    this.state.currentTrackId = trackId;
    this.state.liveScore = { ...DEFAULT_LIVE_SCORE };
    this.state.status = 'in_progress';

    return true;
  }

  public addScoringEvent(type: ScoringEventType, value: number, description: string): void {
    if (this.state.status !== 'in_progress') return;

    const now = Date.now();
    const comboActive = now - this.state.liveScore.lastEventTime < COMBO_WINDOW;

    let comboCount: number;
    let multiplier: number;

    if (comboActive && type !== 'collision') {
      comboCount = this.state.liveScore.comboCount + 1;
      multiplier = Math.min(MAX_COMBO_MULTIPLIER, 1 + comboCount * COMBO_MULTIPLIER_STEP);
    } else if (type === 'collision') {
      comboCount = 0;
      multiplier = 1;
    } else {
      comboCount = 0;
      multiplier = 1;
    }

    const actualValue = type === 'collision' ? -value : value;
    const eventScore = Math.floor(actualValue * multiplier);

    const event: ScoringEvent = {
      type,
      value: actualValue,
      timestamp: now,
      multiplier,
      description,
    };

    this.state.liveScore.events.push(event);
    this.state.liveScore.totalScore += eventScore;
    this.state.liveScore.comboCount = comboCount;
    this.state.liveScore.multiplier = multiplier;
    this.state.liveScore.lastEventTime = now;

    if (comboCount > 0) {
      this.state.liveScore.comboTimer = COMBO_WINDOW - (now - this.state.liveScore.lastEventTime);
    }
  }

  public getLiveScore(): LiveScore {
    return { ...this.state.liveScore };
  }

  public updateLiveScoreFromGameStats(
    distance: number,
    maxHeight: number,
    airCurrentCount: number,
    shadowTracking: number,
    flightStability: number,
    collisions: number,
    timeElapsed: number,
  ): void {
    if (this.state.status !== 'in_progress') return;

    const track = this.getTrack(this.state.currentTrackId || '');
    const timeLimit = track?.timeLimit || 120;

    const distScore = Math.floor(distance * 0.12);
    this.addScoringEvent('distance', distScore, `飞行距离 +${distScore}`);

    const heightScore = Math.floor(maxHeight * 2.5);
    this.addScoringEvent('height', heightScore, `最大高度 +${heightScore}`);

    if (airCurrentCount > 0) {
      const airScore = airCurrentCount * 6;
      this.addScoringEvent('air_current', airScore, `气流捕获 +${airScore}`);
    }

    const shadowScore = Math.floor(shadowTracking * 80);
    if (shadowScore > 0) {
      this.addScoringEvent('shadow_bonus', shadowScore, `影子追踪 +${shadowScore}`);
    }

    const stabilityScore = Math.floor(flightStability * 60);
    if (stabilityScore > 0) {
      this.addScoringEvent('stability', stabilityScore, `飞行稳定性 +${stabilityScore}`);
    }

    if (collisions > 0) {
      const collisionPenalty = collisions * 15;
      this.addScoringEvent('collision', collisionPenalty, `碰撞惩罚 -${collisionPenalty}`);
    }

    if (timeElapsed < timeLimit * 0.7) {
      const timeBonus = Math.floor((timeLimit - timeElapsed) * 2);
      this.addScoringEvent('time_bonus', timeBonus, `时间奖励 +${timeBonus}`);
    }
  }

  public completeTrack(finalScore: number): TrackResult | null {
    if (this.state.status !== 'in_progress' || !this.state.currentTrackId) return null;

    const trackId = this.state.currentTrackId;
    const track = this.getTrack(trackId);
    if (!track) return null;

    const adjustedScore = Math.floor(finalScore * this.getTrackScoreMultiplier(track));
    const rank = this.calculateRank(adjustedScore);
    const mastered = adjustedScore >= track.targetScore * 2;

    const existingResult = this.state.trackResults[trackId];
    const bestScore = existingResult ? Math.max(existingResult.bestScore, adjustedScore) : adjustedScore;
    const attempts = (existingResult?.attempts || 0) + 1;
    const coinReward = mastered ? track.coinReward * 2 : track.coinReward;

    const result: TrackResult = {
      trackId,
      score: adjustedScore,
      rank,
      completedAt: Date.now(),
      bestScore,
      attempts,
      mastered,
      coinReward,
    };

    this.state.trackResults[trackId] = result;
    this.state.totalCoins += coinReward;

    if (this.state.currentEntry) {
      this.state.currentEntry.totalScore += adjustedScore;
      if (!this.state.currentEntry.completedTracks.includes(trackId)) {
        this.state.currentEntry.completedTracks.push(trackId);
      }
      this.state.currentEntry.division = this.getDivisionForScore(this.state.currentEntry.totalScore);
    }

    this.updateChapterProgress(trackId, adjustedScore, mastered);
    this.state.status = 'completed';
    this.state.currentTrackId = null;
    this.generateRankings();

    return result;
  }

  private getTrackScoreMultiplier(track: TrackConfig): number {
    let multiplier = 1;
    track.rules.forEach((rule) => {
      if (rule.id.includes('score') || rule.id.includes('combo') || rule.id.includes('height')) {
        multiplier *= rule.modifier;
      }
    });
    return multiplier;
  }

  private calculateRank(score: number): RankTier {
    const tiers: RankTier[] = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D'];
    for (const tier of tiers) {
      if (score >= RANK_TIER_THRESHOLDS[tier]) return tier;
    }
    return 'D';
  }

  private updateChapterProgress(trackId: string, score: number, mastered: boolean): void {
    const track = this.getTrack(trackId);
    if (!track) return;

    const progress = this.state.chapterProgress[track.chapterId];
    if (!progress) return;

    progress.bestScores[trackId] = Math.max(progress.bestScores[trackId] || 0, score);
    progress.totalAttempts++;

    if (!progress.completedTracks.includes(trackId)) {
      progress.completedTracks.push(trackId);
    }

    if (mastered && !progress.masteredTracks.includes(trackId)) {
      progress.masteredTracks.push(trackId);
    }

    const chapter = this.getChapter(track.chapterId);
    if (!chapter) return;

    const allCompleted = chapter.trackIds.every((id) => progress.completedTracks.includes(id));
    const masterCount = progress.masteredTracks.length;

    if (allCompleted && masterCount >= chapter.requiredMasteries) {
      progress.status = masterCount >= chapter.trackIds.length ? 'mastered' : 'completed';
    } else if (allCompleted) {
      progress.status = 'completed';
    } else {
      progress.status = 'unlocked';
    }

    this.checkChapterUnlocks();
  }

  private checkChapterUnlocks(): void {
    CHAPTERS.forEach((chapter) => {
      const progress = this.state.chapterProgress[chapter.id];
      if (progress.status !== 'locked') return;

      if (this.isChapterUnlocked(chapter.id)) {
        progress.status = 'unlocked';
      }
    });
  }

  private generateRankings(): void {
    const entries: RankingEntry[] = [];

    if (this.state.currentEntry) {
      const playerEntry = this.state.currentEntry;
      entries.push({
        rank: 0,
        entryId: playerEntry.id,
        playerName: playerEntry.playerName,
        division: playerEntry.division,
        score: playerEntry.totalScore,
        rankTier: this.calculateRank(playerEntry.totalScore),
        completedTracks: playerEntry.completedTracks.length,
        masteredTracks: Object.values(this.state.trackResults).filter((r) => r.mastered).length,
        isPlayer: true,
      });
    }

    NPC_LEADERBOARD.forEach((npc) => {
      const variance = 0.85 + Math.random() * 0.3;
      const score = Math.floor(npc.baseScore * variance);
      entries.push({
        rank: 0,
        entryId: `npc_${npc.name}`,
        playerName: npc.name,
        division: npc.division,
        score,
        rankTier: this.calculateRank(score),
        completedTracks: Math.floor(Math.random() * 6) + 1,
        masteredTracks: Math.floor(Math.random() * 3),
        isPlayer: false,
      });
    });

    entries.sort((a, b) => b.score - a.score);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    this.state.rankings = entries;
  }

  public getRankings(): RankingEntry[] {
    return [...this.state.rankings];
  }

  public getPlayerRanking(): RankingEntry | undefined {
    return this.state.rankings.find((r) => r.isPlayer);
  }

  public getTrackResult(trackId: string): TrackResult | undefined {
    return this.state.trackResults[trackId];
  }

  public getGameConfigOverride(trackId: string): GameConfigOverride | null {
    const track = this.getTrack(trackId);
    if (!track) return null;

    return {
      worldSize: track.worldSize,
      gravity: track.gravity,
      airCurrentSpawnRate: track.airCurrentSpawnRate,
      minAirCurrentStrength: track.minAirCurrentStrength,
      maxAirCurrentStrength: track.maxAirCurrentStrength,
      minBuildingHeight: track.minBuildingHeight,
      maxBuildingHeight: track.maxBuildingHeight,
      buildingDensity: track.buildingDensity,
      windSpeed: track.windSpeed,
      turbulenceLevel: track.turbulenceLevel,
      cloudCoverage: track.cloudCoverage,
    };
  }

  public getTotalCoins(): number {
    return this.state.totalCoins;
  }

  public reset(): void {
    this.state = {
      status: 'idle',
      currentEntry: null,
      currentTrackId: null,
      liveScore: { ...DEFAULT_LIVE_SCORE },
      trackResults: {},
      chapterProgress: {},
      rankings: [],
      totalCoins: 0,
    };
    this.initChapterProgress();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        status: this.state.status === 'in_progress' ? 'registered' : this.state.status,
        currentEntry: this.state.currentEntry,
        trackResults: this.state.trackResults,
        chapterProgress: this.state.chapterProgress,
        totalCoins: this.state.totalCoins,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save tournament data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);

      if (data.chapterProgress) {
        this.state.chapterProgress = data.chapterProgress;
      }

      if (data.trackResults) {
        this.state.trackResults = data.trackResults;
      }

      if (data.currentEntry) {
        this.state.currentEntry = data.currentEntry;
      }

      if (data.status) {
        this.state.status = data.status === 'in_progress' ? 'registered' : data.status;
      }

      if (typeof data.totalCoins === 'number') {
        this.state.totalCoins = data.totalCoins;
      }

      this.checkChapterUnlocks();
      this.generateRankings();

      return true;
    } catch (e) {
      console.error('Failed to load tournament data:', e);
      return false;
    }
  }
}

export const tournamentEngine = new TournamentEngine();
