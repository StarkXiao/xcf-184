import { useState, useCallback, useEffect, useRef } from 'react';
import { StageTaskEngine } from './stageTaskEngine';
import type { Stage, StageTask, StageProgress, Announcement, StageSettlement } from './types';

const stageTaskEngineRef = { current: new StageTaskEngine() };

let emitter: { listeners: Set<() => void>; emit: () => void } = {
  listeners: new Set(),
  emit() {
    this.listeners.forEach((l) => l());
  },
};

export const stageTaskStateEmitter = emitter;

export function useStageTask() {
  const [, forceUpdate] = useState(0);
  const engineRef = useRef<StageTaskEngine>(stageTaskEngineRef.current);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    emitter.listeners.add(listener);
    return () => {
      emitter.listeners.delete(listener);
    };
  }, []);

  const getStages = useCallback((): Stage[] => {
    return engineRef.current.getStages();
  }, []);

  const getCurrentStage = useCallback((): Stage | null => {
    return engineRef.current.getCurrentStage();
  }, []);

  const getProgress = useCallback((): StageProgress => {
    return engineRef.current.getProgress();
  }, []);

  const getCurrentTasks = useCallback((): StageTask[] => {
    return engineRef.current.getCurrentTasks();
  }, []);

  const getActiveTasks = useCallback((): StageTask[] => {
    return engineRef.current.getActiveTasks();
  }, []);

  const getAnnouncements = useCallback((): Announcement[] => {
    return engineRef.current.getAnnouncements();
  }, []);

  const startStage = useCallback((stageId: string): boolean => {
    const result = engineRef.current.startStage(stageId);
    if (result) {
      emitter.emit();
    }
    return result;
  }, []);

  const getStageSettlement = useCallback((): StageSettlement | null => {
    return engineRef.current.getStageSettlement();
  }, []);

  const reset = useCallback(() => {
    engineRef.current.reset();
    emitter.emit();
  }, []);

  const getWeatherConfigOverride = useCallback((stage: Stage) => {
    return engineRef.current.getWeatherConfigOverride(stage);
  }, []);

  const getAirCurrentConfigOverride = useCallback((stage: Stage) => {
    return engineRef.current.getAirCurrentConfigOverride(stage);
  }, []);

  return {
    getStages,
    getCurrentStage,
    getProgress,
    getCurrentTasks,
    getActiveTasks,
    getAnnouncements,
    startStage,
    getStageSettlement,
    reset,
    getWeatherConfigOverride,
    getAirCurrentConfigOverride,
    engine: engineRef.current,
  };
}
