import { useState, useCallback, useEffect } from 'react';
import { trainingEngine } from './trainingEngine';
import type {
  ChapterConfig,
  ChapterProgress,
  ExamResult,
  GameConfigOverride,
  LessonConfig,
  LessonProgress,
  PendingReward,
  TrainingEntry,
  TrainingState,
  TutorialStep,
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

  const enroll = useCallback((playerName: string): boolean => {
    const success = trainingEngine.enroll(playerName);
    if (success) {
      trainingEngine.saveToLocalStorage();
      refreshState();
    }
    return success;
  }, [refreshState]);

  const selectLesson = useCallback((lessonId: string): boolean => {
    const success = trainingEngine.selectLesson(lessonId);
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const getCurrentTutorialStep = useCallback((): TutorialStep | null => {
    return trainingEngine.getCurrentTutorialStep();
  }, []);

  const getCurrentTutorialStepIndex = useCallback((): number => {
    return trainingEngine.getCurrentTutorialStepIndex();
  }, []);

  const getTotalTutorialSteps = useCallback((): number => {
    return trainingEngine.getTotalTutorialSteps();
  }, []);

  const advanceTutorialStep = useCallback((): boolean => {
    const success = trainingEngine.advanceTutorialStep();
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const resetTutorialStep = useCallback((): void => {
    trainingEngine.resetTutorialStep();
    refreshState();
  }, [refreshState]);

  const startExam = useCallback((): boolean => {
    const success = trainingEngine.startExam();
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const completeExam = useCallback((gameStats: {
    score: number;
    distance: number;
    height: number;
    maxHeight: number;
    time: number;
    airCurrentCount: number;
    shadowTracking: number;
    flightStability: number;
    collisions: number;
  }): ExamResult | null => {
    const result = trainingEngine.completeExam(gameStats);
    if (result) {
      trainingEngine.saveToLocalStorage();
      refreshState();
    }
    return result;
  }, [refreshState]);

  const claimPendingReward = useCallback((): PendingReward | null => {
    const reward = trainingEngine.claimPendingReward();
    if (reward) {
      trainingEngine.saveToLocalStorage();
      refreshState();
    }
    return reward;
  }, [refreshState]);

  const returnToTraining = useCallback((): boolean => {
    const success = trainingEngine.returnToTraining();
    if (success) {
      refreshState();
    }
    return success;
  }, [refreshState]);

  const getLesson = useCallback((lessonId: string): LessonConfig | undefined => {
    return trainingEngine.getLesson(lessonId);
  }, []);

  const getAllLessons = useCallback((): LessonConfig[] => {
    return trainingEngine.getAllLessons();
  }, []);

  const getLessonsForChapter = useCallback((chapterId: string): LessonConfig[] => {
    return trainingEngine.getLessonsForChapter(chapterId);
  }, []);

  const getChapter = useCallback((chapterId: string): ChapterConfig | undefined => {
    return trainingEngine.getChapter(chapterId);
  }, []);

  const getAllChapters = useCallback((): ChapterConfig[] => {
    return trainingEngine.getAllChapters();
  }, []);

  const getLessonProgress = useCallback((lessonId: string): LessonProgress => {
    return trainingEngine.getLessonProgress(lessonId);
  }, []);

  const getChapterProgress = useCallback((chapterId: string): ChapterProgress => {
    return trainingEngine.getChapterProgress(chapterId);
  }, []);

  const isLessonUnlocked = useCallback((lessonId: string): boolean => {
    return trainingEngine.isLessonUnlocked(lessonId);
  }, []);

  const isChapterUnlocked = useCallback((chapterId: string): boolean => {
    return trainingEngine.isChapterUnlocked(chapterId);
  }, []);

  const getGameConfigOverride = useCallback((lessonId: string): GameConfigOverride | null => {
    return trainingEngine.getGameConfigOverride(lessonId);
  }, []);

  const getTotalCoinsEarned = useCallback((): number => {
    return trainingEngine.getTotalCoinsEarned();
  }, []);

  const getLastExamResult = useCallback((): ExamResult | null => {
    return trainingEngine.getLastExamResult();
  }, []);

  const getPendingReward = useCallback((): PendingReward | null => {
    return trainingEngine.getPendingReward();
  }, []);

  const getEntry = useCallback((): TrainingEntry | null => {
    return trainingEngine.getEntry();
  }, []);

  const reset = useCallback(() => {
    trainingEngine.reset();
    trainingEngine.saveToLocalStorage();
    refreshState();
  }, [refreshState]);

  return {
    state,
    enroll,
    selectLesson,
    getCurrentTutorialStep,
    getCurrentTutorialStepIndex,
    getTotalTutorialSteps,
    advanceTutorialStep,
    resetTutorialStep,
    startExam,
    completeExam,
    claimPendingReward,
    returnToTraining,
    getLesson,
    getAllLessons,
    getLessonsForChapter,
    getChapter,
    getAllChapters,
    getLessonProgress,
    getChapterProgress,
    isLessonUnlocked,
    isChapterUnlocked,
    getGameConfigOverride,
    getTotalCoinsEarned,
    getLastExamResult,
    getPendingReward,
    getEntry,
    reset,
    refreshState,
  };
}
