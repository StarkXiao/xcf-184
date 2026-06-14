import type {
  TrainingState,
  LessonConfig,
  LessonProgress,
  TrainingResult,
  GameConfigOverride,
} from './types';
import { LESSONS, DEFAULT_LESSON_PROGRESS } from './trainingData';

const SAVE_KEY = 'kite_training_save';

export class TrainingEngine {
  private state: TrainingState;

  constructor() {
    this.state = {
      currentLessonId: null,
      currentStepIndex: 0,
      phase: 'intro',
      lessons: {},
      totalCoinsEarned: 0,
      lessonsCompleted: 0,
      isTraining: false,
    };
    this.initLessonProgress();
  }

  private initLessonProgress(): void {
    LESSONS.forEach((lesson, index) => {
      this.state.lessons[lesson.id] = DEFAULT_LESSON_PROGRESS(lesson.id, index);
    });
  }

  public getState(): TrainingState {
    return { ...this.state };
  }

  public getAllLessons(): LessonConfig[] {
    return [...LESSONS];
  }

  public getLesson(lessonId: string): LessonConfig | undefined {
    return LESSONS.find((l) => l.id === lessonId);
  }

  public getLessonProgress(lessonId: string): LessonProgress {
    return this.state.lessons[lessonId] || {
      lessonId,
      status: 'locked',
      completedSteps: [],
      bestScore: 0,
      attempts: 0,
      completedAt: null,
    };
  }

  public isLessonUnlocked(lessonId: string): boolean {
    const progress = this.getLessonProgress(lessonId);
    if (progress.status !== 'locked') {
      return true;
    }

    const lesson = this.getLesson(lessonId);
    if (!lesson) return false;

    const lessonIndex = LESSONS.findIndex((l) => l.id === lessonId);
    if (lessonIndex === 0) return true;

    const prevLesson = LESSONS[lessonIndex - 1];
    if (!prevLesson) return false;

    const prevProgress = this.getLessonProgress(prevLesson.id);
    if (prevProgress.status !== 'completed') return false;

    if (lesson.requiredScore !== undefined) {
      if (prevProgress.bestScore < lesson.requiredScore) return false;
    }

    return true;
  }

  public startLesson(lessonId: string): boolean {
    if (!this.isLessonUnlocked(lessonId)) return false;

    const lesson = this.getLesson(lessonId);
    if (!lesson) return false;

    this.state.currentLessonId = lessonId;
    this.state.currentStepIndex = 0;
    this.state.phase = lesson.phase;
    this.state.isTraining = true;

    const progress = this.state.lessons[lessonId];
    if (progress) {
      progress.status = 'in_progress';
    }

    return true;
  }

  public nextStep(): boolean {
    if (!this.state.currentLessonId) return false;

    const lesson = this.getLesson(this.state.currentLessonId);
    if (!lesson) return false;

    if (this.state.currentStepIndex < lesson.steps.length - 1) {
      const currentStep = lesson.steps[this.state.currentStepIndex];
      const progress = this.state.lessons[this.state.currentLessonId];
      if (progress && !progress.completedSteps.includes(currentStep.id)) {
        progress.completedSteps.push(currentStep.id);
      }
      this.state.currentStepIndex++;
      return true;
    }
    return false;
  }

  public prevStep(): boolean {
    if (!this.state.currentLessonId) return false;
    if (this.state.currentStepIndex > 0) {
      this.state.currentStepIndex--;
      return true;
    }
    return false;
  }

  public getCurrentStep() {
    if (!this.state.currentLessonId) return null;
    const lesson = this.getLesson(this.state.currentLessonId);
    if (!lesson) return null;
    return lesson.steps[this.state.currentStepIndex] || null;
  }

  public getCurrentLesson(): LessonConfig | null {
    if (!this.state.currentLessonId) return null;
    return this.getLesson(this.state.currentLessonId) || null;
  }

  public isLastStep(): boolean {
    if (!this.state.currentLessonId) return true;
    const lesson = this.getLesson(this.state.currentLessonId);
    if (!lesson) return true;
    return this.state.currentStepIndex >= lesson.steps.length - 1;
  }

  public isFirstStep(): boolean {
    return this.state.currentStepIndex === 0;
  }

  public completeStep(stepId: string): boolean {
    if (!this.state.currentLessonId) return false;
    const progress = this.state.lessons[this.state.currentLessonId];
    if (progress && !progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      return true;
    }
    return false;
  }

  public completeLesson(score: number): TrainingResult | null {
    if (!this.state.currentLessonId) return null;

    const lessonId = this.state.currentLessonId;
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;

    const progress = this.state.lessons[lessonId];
    if (!progress) return null;

    const wasAlreadyCompleted = progress.status === 'completed';
    const previousBestScore = progress.bestScore;

    progress.attempts++;
    const isNewBestScore = score > previousBestScore;
    if (isNewBestScore) {
      progress.bestScore = score;
    }

    const targetScore = lesson.steps.find((s) => s.targetScore)?.targetScore || 0;
    const passed = score >= targetScore || lesson.type !== 'exam';
    const stars = this.calculateStars(score, targetScore);

    let coinReward = 0;

    if (!wasAlreadyCompleted && passed) {
      coinReward = lesson.coinReward;
      if (stars >= 3) {
        coinReward = Math.floor(coinReward * 1.5);
      }
      this.state.totalCoinsEarned += coinReward;
      progress.status = 'completed';
      progress.completedAt = Date.now();
      this.state.lessonsCompleted++;
      this.unlockNextLesson(lessonId);
    } else if (wasAlreadyCompleted && isNewBestScore) {
      coinReward = Math.floor(lesson.coinReward * 0.2);
      this.state.totalCoinsEarned += coinReward;
    }

    this.saveToLocalStorage();

    return {
      lessonId,
      score,
      passed,
      stars,
      coinReward,
      completedAt: Date.now(),
    };
  }

  private calculateStars(score: number, targetScore: number): number {
    if (targetScore <= 0) return 3;
    const ratio = score / targetScore;
    if (ratio >= 2) return 3;
    if (ratio >= 1.3) return 2;
    if (ratio >= 1) return 1;
    return 0;
  }

  private unlockNextLesson(lessonId: string): void {
    const lesson = this.getLesson(lessonId);
    if (!lesson || !lesson.unlockNextId) return;

    const nextProgress = this.state.lessons[lesson.unlockNextId];
    if (nextProgress && nextProgress.status === 'locked') {
      nextProgress.status = 'available';
    }
  }

  public exitLesson(): void {
    this.state.currentLessonId = null;
    this.state.currentStepIndex = 0;
    this.state.isTraining = false;
  }

  public getGameConfigOverride(lessonId: string): GameConfigOverride | null {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;
    if (lesson.worldSize === undefined) return null;

    return {
      worldSize: lesson.worldSize,
      gravity: lesson.gravity || 0.015,
      airCurrentSpawnRate: lesson.airCurrentSpawnRate || 0.03,
      minAirCurrentStrength: lesson.minAirCurrentStrength || 0.06,
      maxAirCurrentStrength: lesson.maxAirCurrentStrength || 0.18,
      minBuildingHeight: lesson.minBuildingHeight || 15,
      maxBuildingHeight: lesson.maxBuildingHeight || 50,
      buildingDensity: lesson.buildingDensity || 0.3,
      windSpeed: 0.3,
      turbulenceLevel: lesson.turbulenceLevel || 0.2,
      cloudCoverage: lesson.cloudCoverage || 0.4,
    };
  }

  public reset(): void {
    this.state = {
      currentLessonId: null,
      currentStepIndex: 0,
      phase: 'intro',
      lessons: {},
      totalCoinsEarned: 0,
      lessonsCompleted: 0,
      isTraining: false,
    };
    this.initLessonProgress();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        lessons: this.state.lessons,
        totalCoinsEarned: this.state.totalCoinsEarned,
        lessonsCompleted: this.state.lessonsCompleted,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save training data:', e);
    }
  }

  public loadFromLocalStorage(): boolean {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);

      if (data.lessons) {
        Object.keys(data.lessons).forEach((lessonId) => {
          if (this.state.lessons[lessonId]) {
            this.state.lessons[lessonId] = data.lessons[lessonId];
          }
        });
      }

      if (typeof data.totalCoinsEarned === 'number') {
        this.state.totalCoinsEarned = data.totalCoinsEarned;
      }

      if (typeof data.lessonsCompleted === 'number') {
        this.state.lessonsCompleted = data.lessonsCompleted;
      }

      return true;
    } catch (e) {
      console.error('Failed to load training data:', e);
      return false;
    }
  }
}

export const trainingEngine = new TrainingEngine();
