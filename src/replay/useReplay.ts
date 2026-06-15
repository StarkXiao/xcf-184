import { useEffect, useState, useCallback, useRef } from 'react';
import { replayEngine, ReplayEngine } from './replayEngine';
import type {
  ReplaySession,
  KeyNode,
  ShareConfig,
  ShareResult,
  ViewMode,
  KeyNodeType,
  ReplayFilter,
  PlaybackStateData,
} from './types';

type EngineState = ReturnType<ReplayEngine['getState']>;

export function useReplay() {
  const [state, setState] = useState<EngineState>(() => replayEngine.getState());
  const [, forceUpdate] = useState(0);
  const playbackRAFRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = replayEngine.subscribe(() => {
      setState(replayEngine.getState());
      forceUpdate((n) => n + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state.playback.isPlaying && state.currentReplayId) {
      const tick = (time: number) => {
        if (lastTimeRef.current > 0) {
          const delta = time - lastTimeRef.current;
          replayEngine.advancePlayback(delta);
        }
        lastTimeRef.current = time;
        playbackRAFRef.current = requestAnimationFrame(tick);
      };
      lastTimeRef.current = 0;
      playbackRAFRef.current = requestAnimationFrame(tick);
      return () => {
        if (playbackRAFRef.current) {
          cancelAnimationFrame(playbackRAFRef.current);
          playbackRAFRef.current = null;
        }
      };
    }
  }, [state.playback.isPlaying, state.currentReplayId]);

  const createReplayFromFlightRecord = useCallback(
    (
      flightRecord: Parameters<typeof replayEngine.createReplayFromFlightRecord>[0],
      options?: Parameters<typeof replayEngine.createReplayFromFlightRecord>[1]
    ) => replayEngine.createReplayFromFlightRecord(flightRecord, options),
    []
  );

  const setCurrentReplay = useCallback((id: string | null) => {
    replayEngine.setCurrentReplay(id);
  }, []);

  const togglePlay = useCallback(() => {
    replayEngine.togglePlay();
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    replayEngine.setPlaybackSpeed(speed);
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    replayEngine.setViewMode(mode);
  }, []);

  const seekToTime = useCallback((timeMs: number) => {
    replayEngine.seekToTime(timeMs);
  }, []);

  const seekToIndex = useCallback((index: number) => {
    replayEngine.seekToIndex(index);
  }, []);

  const seekToKeyNode = useCallback((keyNodeId: string) => {
    replayEngine.seekToKeyNode(keyNodeId);
  }, []);

  const toggleLoop = useCallback(() => {
    replayEngine.toggleLoop();
  }, []);

  const setShowTrajectory = useCallback((show: boolean) => {
    replayEngine.setShowTrajectory(show);
  }, []);

  const setShowKeyNodes = useCallback((show: boolean) => {
    replayEngine.setShowKeyNodes(show);
  }, []);

  const setShowStatsOverlay = useCallback((show: boolean) => {
    replayEngine.setShowStatsOverlay(show);
  }, []);

  const addKeyNode = useCallback(
    (
      replayId: string,
      params: {
        type: KeyNodeType;
        trajectoryIndex: number;
        title: string;
        description?: string;
        tags?: string[];
      }
    ) => replayEngine.addKeyNode(replayId, params),
    []
  );

  const removeKeyNode = useCallback((replayId: string, keyNodeId: string) => {
    return replayEngine.removeKeyNode(replayId, keyNodeId);
  }, []);

  const updateKeyNode = useCallback(
    (
      replayId: string,
      keyNodeId: string,
      updates: Partial<Pick<KeyNode, 'title' | 'description' | 'tags'>>
    ) => replayEngine.updateKeyNode(replayId, keyNodeId, updates),
    []
  );

  const toggleFavorite = useCallback((replayId: string) => {
    return replayEngine.toggleFavorite(replayId);
  }, []);

  const updateReplay = useCallback(
    (replayId: string, updates: Partial<Pick<ReplaySession, 'title' | 'tags'>>) =>
      replayEngine.updateReplay(replayId, updates),
    []
  );

  const deleteReplay = useCallback((replayId: string) => {
    return replayEngine.deleteReplay(replayId);
  }, []);

  const generateReview = useCallback((replayId: string) => {
    return replayEngine.generateReview(replayId);
  }, []);

  const getReview = useCallback((replayId: string) => {
    return replayEngine.getReview(replayId);
  }, []);

  const createShare = useCallback((replayId: string, config: ShareConfig) => {
    return replayEngine.createShare(replayId, config);
  }, []);

  const copyShareCode = useCallback((share: ShareResult) => {
    return replayEngine.copyShareCode(share);
  }, []);

  const setFilters = useCallback((filters: Partial<ReplayFilter>) => {
    replayEngine.setFilters(filters);
  }, []);

  const resetFilters = useCallback(() => {
    replayEngine.resetFilters();
  }, []);

  const setSortBy = useCallback(
    (sortBy: 'date' | 'score' | 'duration' | 'views') => {
      replayEngine.setSortBy(sortBy);
    },
    []
  );

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    replayEngine.setSortOrder(order);
  }, []);

  const getFilteredReplays = useCallback(() => {
    return replayEngine.getFilteredReplays();
  }, []);

  const calculateCameraFrame = useCallback(
    (replay: ReplaySession, index: number, viewMode: ViewMode) => {
      return replayEngine.calculateCameraFrame(replay, index, viewMode);
    },
    []
  );

  const getPlaybackInfo = useCallback(() => {
    return replayEngine.getPlaybackInfo();
  }, []);

  const getReplayById = useCallback((id: string) => {
    return replayEngine.getReplayById(id);
  }, []);

  const getAllTags = useCallback(() => {
    return replayEngine.getAllTags();
  }, []);

  const addTagToReplay = useCallback((replayId: string, tag: string) => {
    return replayEngine.addTagToReplay(replayId, tag);
  }, []);

  const removeTagFromReplay = useCallback((replayId: string, tag: string) => {
    return replayEngine.removeTagFromReplay(replayId, tag);
  }, []);

  const currentReplay = state.currentReplayId
    ? state.replays.find((r: ReplaySession) => r.id === state.currentReplayId) || null
    : null;

  const currentReview = state.currentReplayId ? state.reviews[state.currentReplayId] : undefined;

  return {
    state,
    replays: state.replays,
    reviews: state.reviews,
    shares: state.shares,
    currentReplayId: state.currentReplayId,
    currentReplay,
    currentReview,
    playback: state.playback as PlaybackStateData,
    filters: state.filters as ReplayFilter,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    createReplayFromFlightRecord,
    setCurrentReplay,
    togglePlay,
    setPlaybackSpeed,
    setViewMode,
    seekToTime,
    seekToIndex,
    seekToKeyNode,
    toggleLoop,
    setShowTrajectory,
    setShowKeyNodes,
    setShowStatsOverlay,

    addKeyNode,
    removeKeyNode,
    updateKeyNode,

    toggleFavorite,
    updateReplay,
    deleteReplay,

    generateReview,
    getReview,

    createShare,
    copyShareCode,

    setFilters,
    resetFilters,
    setSortBy,
    setSortOrder,
    getFilteredReplays,

    calculateCameraFrame,
    getPlaybackInfo,
    getReplayById,
    getAllTags,
    addTagToReplay,
    removeTagFromReplay,
  };
}

export type UseReplayReturn = ReturnType<typeof useReplay>;
