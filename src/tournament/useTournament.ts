import { useState, useCallback, useEffect } from 'react';
import { tournamentEngine } from './tournamentEngine';
import type {
  Division,
  DivisionConfig,
  TrackConfig,
  ChapterConfig,
  ChapterProgress,
  TrackResult,
  LiveScore,
  RankingEntry,
  RankTier,
  TournamentState,
  ScoringEventType,
  GameConfigOverride,
} from './types';

type Listener = () => void;

class TournamentStateEmitter {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const tournamentStateEmitter = new TournamentStateEmitter();

export function useTournament(autoRefresh = true) {
  const [state, setState] = useState<TournamentState>(() => {
    tournamentEngine.loadFromLocalStorage();
    return tournamentEngine.getState();
  });
  const [liveScore, setLiveScore] = useState<LiveScore>({ ...tournamentEngine.getLiveScore() });
  const [rankings, setRankings] = useState<RankingEntry[]>([...tournamentEngine.getRankings()]);

  const refreshState = useCallback(() => {
    setState({ ...tournamentEngine.getState() });
    setLiveScore({ ...tournamentEngine.getLiveScore() });
    setRankings([...tournamentEngine.getRankings()]);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const unsubscribe = tournamentStateEmitter.subscribe(refreshState);
    return unsubscribe;
  }, [autoRefresh, refreshState]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => {
      if (tournamentEngine.getState().status === 'in_progress') {
        refreshState();
      }
    }, 500);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshState]);

  const register = useCallback((playerName: string, division: Division): boolean => {
    const success = tournamentEngine.register(playerName, division);
    if (success) {
      tournamentEngine.saveToLocalStorage();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const selectTrack = useCallback((trackId: string): boolean => {
    const success = tournamentEngine.selectTrack(trackId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const addScoringEvent = useCallback((type: ScoringEventType, value: number, description: string) => {
    tournamentEngine.addScoringEvent(type, value, description);
    setLiveScore(tournamentEngine.getLiveScore());
  }, []);

  const updateLiveScoreFromGameStats = useCallback((
    distance: number,
    maxHeight: number,
    airCurrentCount: number,
    shadowTracking: number,
    flightStability: number,
    collisions: number,
    timeElapsed: number,
  ) => {
    tournamentEngine.updateLiveScoreFromGameStats(
      distance, maxHeight, airCurrentCount, shadowTracking, flightStability, collisions, timeElapsed,
    );
    setLiveScore(tournamentEngine.getLiveScore());
  }, []);

  const completeTrack = useCallback((finalScore: number): TrackResult | null => {
    const result = tournamentEngine.completeTrack(finalScore);
    if (result) {
      tournamentEngine.saveToLocalStorage();
      refreshState();
    }
    return result;
  }, [refreshState]);

  const getDivision = useCallback((division: Division): DivisionConfig => {
    return tournamentEngine.getDivision(division);
  }, []);

  const getDivisionForScore = useCallback((score: number): Division => {
    return tournamentEngine.getDivisionForScore(score);
  }, []);

  const getAllDivisions = useCallback((): DivisionConfig[] => {
    return tournamentEngine.getAllDivisions();
  }, []);

  const getTrack = useCallback((trackId: string): TrackConfig | undefined => {
    return tournamentEngine.getTrack(trackId);
  }, []);

  const getTracksForChapter = useCallback((chapterId: string): TrackConfig[] => {
    return tournamentEngine.getTracksForChapter(chapterId);
  }, []);

  const getAllTracks = useCallback((): TrackConfig[] => {
    return tournamentEngine.getAllTracks();
  }, []);

  const getChapter = useCallback((chapterId: string): ChapterConfig | undefined => {
    return tournamentEngine.getChapter(chapterId);
  }, []);

  const getAllChapters = useCallback((): ChapterConfig[] => {
    return tournamentEngine.getAllChapters();
  }, []);

  const getChapterProgress = useCallback((chapterId: string): ChapterProgress => {
    return tournamentEngine.getChapterProgress(chapterId);
  }, []);

  const isTrackUnlocked = useCallback((trackId: string): boolean => {
    return tournamentEngine.isTrackUnlocked(trackId);
  }, []);

  const isChapterUnlocked = useCallback((chapterId: string): boolean => {
    return tournamentEngine.isChapterUnlocked(chapterId);
  }, []);

  const getTrackResult = useCallback((trackId: string): TrackResult | undefined => {
    return tournamentEngine.getTrackResult(trackId);
  }, []);

  const getGameConfigOverride = useCallback((trackId: string): GameConfigOverride | null => {
    return tournamentEngine.getGameConfigOverride(trackId);
  }, []);

  const getPlayerRanking = useCallback((): RankingEntry | undefined => {
    return tournamentEngine.getPlayerRanking();
  }, []);

  const calculateRank = useCallback((score: number): RankTier => {
    if (score >= 12000) return 'SSS';
    if (score >= 8000) return 'SS';
    if (score >= 5000) return 'S';
    if (score >= 3000) return 'A';
    if (score >= 1500) return 'B';
    if (score >= 500) return 'C';
    return 'D';
  }, []);

  const reset = useCallback(() => {
    tournamentEngine.reset();
    tournamentEngine.saveToLocalStorage();
    refreshState();
  }, [refreshState]);

  return {
    state,
    liveScore,
    rankings,
    register,
    selectTrack,
    addScoringEvent,
    updateLiveScoreFromGameStats,
    completeTrack,
    getDivision,
    getDivisionForScore,
    getAllDivisions,
    getTrack,
    getTracksForChapter,
    getAllTracks,
    getChapter,
    getAllChapters,
    getChapterProgress,
    isTrackUnlocked,
    isChapterUnlocked,
    getTrackResult,
    getGameConfigOverride,
    getPlayerRanking,
    calculateRank,
    reset,
    refreshState,
  };
}
