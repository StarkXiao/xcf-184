import { useState, useCallback, useEffect } from 'react';
import { trainingEngine } from './trainingEngine';
import type {
  TrainingState,
  LessonConfig,
  LessonProgress,
  TrainingResult,
  GameConfigOverride,
  LessonStep,
} from './types';

type Listener = () => void;

class TrainingStateEmitter {
  private listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const trainingStateEmitter = new TrainingStateEmitter();

export function useTraining(autoRefresh = true) {
  const [state, setState] = useState<TrainingState>(() => {
    trainingEngine.loadFromLocalStorage();
    return trainingEngine.getState();
  });

  const refreshState = useCallback(() => {
    setState({ ...trainingEngine.getState() });
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const unsubscribe = trainingStateEmitter.subscribe(refreshState);
    return unsubscribe;
  }, [autoRefresh, refreshState]);

  const startLesson = useCallback((lessonId: string): boolean => {
    const success = trainingEngine.startLesson(lessonId);
    if (success) {
      trainingStateEmitter.emit();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const nextStep = useCallback((): boolean => {
    const success = trainingEngine.nextStep();
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const prevStep = useCallback((): boolean => {
    const success = trainingEngine.prevStep();
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const completeStep = useCallback((stepId: string): boolean => {
    const success = trainingEngine.completeStep(stepId);
    if (success) {
      trainingEngine.saveToLocalStorage();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const completeLesson = useCallback((score: number): TrainingResult | null => {
    const result = trainingEngine.completeLesson(score);
    if (result) {
      trainingStateEmitter.emit();
      refreshState();
    }
    return result;
  }, [refreshState]);

  const exitLesson = useCallback(() => {
    trainingEngine.exitLesson();
    trainingStateEmitter.emit();
    refreshState();
  }, [refreshState]);

  const getAllLessons = useCallback((): LessonConfig[] => {
    return trainingEngine.getAllLessons();
  }, []);

  const getLesson = useCallback((lessonId: string): LessonConfig | undefined => {
    return trainingEngine.getLesson(lessonId);
  }, []);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress => {
    return trainingEngine.getLessonProgress(lessonId);
  }, []);

  const isLessonUnlocked = useCallback((lessonId: string): boolean => {
    return trainingEngine.isLessonUnlocked(lessonId);
  }, []);

  const getCurrentLesson = useCallback((): LessonConfig | null => {
    return trainingEngine.getCurrentLesson();
  }, []);

  const getCurrentStep = useCallback((): LessonStep | null => {
    return trainingEngine.getCurrentStep();
  }, []);

  const isLastStep = useCallback((): boolean => {
    return trainingEngine.isLastStep();
  }, []);

  const isFirstStep = useCallback((): boolean => {
    return trainingEngine.isFirstStep();
  }, []);

  const getGameConfigOverride = useCallback((lessonId: string): GameConfigOverride | null => {
    return trainingEngine.getGameConfigOverride(lessonId);
  }, []);

  const reset = useCallback(() => {
    trainingEngine.reset();
    trainingEngine.saveToLocalStorage();
    trainingStateEmitter.emit();
    refreshState();
  }, [refreshState]);

  return {
    state,
    startLesson,
    nextStep,
    prevStep,
    completeStep,
    completeLesson,
    exitLesson,
    getAllLessons,
    getLesson,
    getLessonProgress,
    isLessonUnlocked,
    getCurrentLesson,
    getCurrentStep,
    isLastStep,
    isFirstStep,
    getGameConfigOverride,
    reset,
    refreshState,
  };
}
