import type {
  ChapterConfig,
  ChapterProgress,
  ExamObjective,
  ExamResult,
  GameConfigOverride,
  LessonConfig,
  LessonProgress,
  LessonStatus,
  PendingReward,
  TrainingEntry,
  TrainingState,
} from './types';
import { CHAPTERS, LESSONS } from './trainingData';
import type { GameStats } from '../game/types';

const SAVE_KEY = 'kite_training_save';

export class TrainingEngine {
  private state: TrainingState;

  constructor() {
    this.state = {
      status: 'idle',
      entry: null,
      currentLessonId: null,
      currentTutorialStepIndex: 0,
      lessonProgress: {},
      chapterProgress: {},
      lastExamResult: null,
      pendingReward: null,
    };
    this.initProgress();
  }

  private initProgress(): void {
    CHAPTERS.forEach((chapter) => {
      this.state.chapterProgress[chapter.id] = {
        chapterId: chapter.id,
        status: chapter.unlockChapterId === null ? 'available' : 'locked',
        completedLessons: [],
        masteredLessons: [],
        completionBonusClaimed: false,
      };
    });

    LESSONS.forEach((lesson) => {
      this.state.lessonProgress[lesson.id] = {
        lessonId: lesson.id,
        status: this.isLessonInitiallyAvailable(lesson) ? 'available' : 'locked',
        bestScore: 0,
        attempts: 0,
        objectivesPassed: [],
        completedAt: null,
        masteredAt: null,
      };
    });
  }

  private isLessonInitiallyAvailable(lesson: LessonConfig): boolean {
    if (lesson.unlockLessonId !== null) return false;
    const chapter = CHAPTERS.find((c) => c.id === lesson.chapterId);
    if (!chapter) return false;
    return chapter.unlockChapterId === null;
  }

  public getState(): TrainingState {
    return { ...this.state };
  }

  public enroll(playerName: string): boolean {
    if (this.state.status !== 'idle') return false;

    const entry: TrainingEntry = {
      id: `trainee_${Date.now()}`,
      playerName,
      enrolledAt: Date.now(),
      totalCoinsEarned: 0,
      totalScore: 0,
    };

    this.state.entry = entry;
    this.state.status = 'enrolled';
    return true;
  }

  public selectLesson(lessonId: string): boolean {
    if (this.state.status !== 'enrolled' && this.state.status !== 'exam_completed') return false;
    if (!this.isLessonUnlocked(lessonId)) return false;

    const lesson = this.getLesson(lessonId);
    if (!lesson) return false;

    this.state.currentLessonId = lessonId;
    this.state.currentTutorialStepIndex = 0;
    this.state.lastExamResult = null;
    this.state.status = 'lesson_active';

    const progress = this.state.lessonProgress[lessonId];
    if (progress && progress.status === 'available') {
      progress.status = 'in_progress';
    }

    return true;
  }

  public getLesson(lessonId: string): LessonConfig | undefined {
    return LESSONS.find((l) => l.id === lessonId);
  }

  public getAllLessons(): LessonConfig[] {
    return [...LESSONS];
  }

  public getLessonsForChapter(chapterId: string): LessonConfig[] {
    return LESSONS.filter((l) => l.chapterId === chapterId).sort((a, b) => a.order - b.order);
  }

  public getChapter(chapterId: string): ChapterConfig | undefined {
    return CHAPTERS.find((c) => c.id === chapterId);
  }

  public getAllChapters(): ChapterConfig[] {
    return [...CHAPTERS].sort((a, b) => a.order - b.order);
  }

  public getLessonProgress(lessonId: string): LessonProgress {
    return (
      this.state.lessonProgress[lessonId] || {
        lessonId,
        status: 'locked',
        bestScore: 0,
        attempts: 0,
        objectivesPassed: [],
        completedAt: null,
        masteredAt: null,
      }
    );
  }

  public getChapterProgress(chapterId: string): ChapterProgress {
    return (
      this.state.chapterProgress[chapterId] || {
        chapterId,
        status: 'locked',
        completedLessons: [],
        masteredLessons: [],
        completionBonusClaimed: false,
      }
    );
  }

  public isLessonUnlocked(lessonId: string): boolean {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return false;

    const chapterProgress = this.getChapterProgress(lesson.chapterId);
    if (chapterProgress.status === 'locked') return false;

    if (lesson.unlockLessonId === null) return true;

    const prevProgress = this.state.lessonProgress[lesson.unlockLessonId];
    return prevProgress?.completedAt != null;
  }

  public isChapterUnlocked(chapterId: string): boolean {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return false;
    if (chapter.unlockChapterId === null) return true;

    const prerequisiteProgress = this.getChapterProgress(chapter.unlockChapterId);
    return prerequisiteProgress.completedLessons.length >= (this.getChapter(chapter.unlockChapterId)?.requiredCompletions || 0);
  }

  public getCurrentTutorialStep() {
    if (!this.state.currentLessonId) return null;
    const lesson = this.getLesson(this.state.currentLessonId);
    if (!lesson) return null;
    return lesson.tutorials[this.state.currentTutorialStepIndex] || null;
  }

  public getCurrentTutorialStepIndex(): number {
    return this.state.currentTutorialStepIndex;
  }

  public getTotalTutorialSteps(): number {
    if (!this.state.currentLessonId) return 0;
    const lesson = this.getLesson(this.state.currentLessonId);
    return lesson?.tutorials.length || 0;
  }

  public advanceTutorialStep(): boolean {
    if (!this.state.currentLessonId) return false;
    const lesson = this.getLesson(this.state.currentLessonId);
    if (!lesson) return false;
    if (this.state.currentTutorialStepIndex >= lesson.tutorials.length - 1) return false;

    this.state.currentTutorialStepIndex++;
    return true;
  }

  public resetTutorialStep(): void {
    this.state.currentTutorialStepIndex = 0;
  }

  public startExam(): boolean {
    if (this.state.status !== 'lesson_active' || !this.state.currentLessonId) return false;
    this.state.status = 'exam_active';
    return true;
  }

  public completeExam(gameStats: GameStats): ExamResult | null {
    if (this.state.status !== 'exam_active' || !this.state.currentLessonId) return null;

    const lessonId = this.state.currentLessonId;
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;

    const objectives: Record<string, { achieved: boolean; value: number; target: number; score: number }> = {};
    let totalScore = 0;

    lesson.examObjectives.forEach((obj) => {
      const value = this.getMetricValue(gameStats, obj);
      const achieved = this.checkObjective(obj, value);
      const objScore = achieved ? obj.weight : 0;
      totalScore += objScore;
      objectives[obj.id] = {
        achieved,
        value,
        target: obj.targetValue,
        score: objScore,
      };
    });

    const passed = totalScore >= lesson.passScore;
    const mastered = totalScore >= lesson.masterScore;
    const coinsEarned = mastered ? lesson.coinReward * 2 : passed ? lesson.coinReward : 0;

    const result: ExamResult = {
      lessonId,
      score: totalScore,
      passed,
      mastered,
      objectives,
      coinsEarned,
      completedAt: Date.now(),
    };

    this.state.lastExamResult = result;
    this.updateLessonProgress(lessonId, totalScore, passed, mastered, Object.keys(objectives).filter((k) => objectives[k].achieved));

    if (this.state.entry) {
      this.state.entry.totalCoinsEarned += coinsEarned;
      this.state.entry.totalScore += totalScore;
    }

    if (passed || mastered) {
      this.state.pendingReward = {
        type: mastered ? 'lesson_master' : 'lesson_pass',
        coins: coinsEarned,
        title: mastered ? '完美通关！' : '考核通过！',
        description: mastered ? `你以精通成绩完成了「${lesson.name}」` : `你成功通过了「${lesson.name}」的考核`,
        icon: mastered ? '🌟' : '✅',
        lessonId,
      };
    }

    const chapterReward = this.checkChapterCompletion(lesson.chapterId);
    if (chapterReward) {
      this.state.pendingReward = chapterReward;
    }

    this.state.currentLessonId = null;
    this.state.status = this.checkAllCompleted() ? 'all_completed' : 'exam_completed';

    return result;
  }

  private getMetricValue(stats: GameStats, objective: ExamObjective): number {
    switch (objective.metric) {
      case 'distance':
        return stats.distance;
      case 'height':
        return stats.maxHeight;
      case 'airCurrentCount':
        return stats.airCurrentCount;
      case 'shadowTracking':
        return stats.shadowTracking;
      case 'flightStability':
        return stats.flightStability;
      case 'collisions':
        return stats.collisions;
      case 'time':
        return stats.time;
      case 'score':
        return stats.score;
      default:
        return 0;
    }
  }

  private checkObjective(objective: ExamObjective, value: number): boolean {
    if (objective.isPenalty) {
      return value <= objective.targetValue;
    }
    return value >= objective.targetValue;
  }

  private updateLessonProgress(lessonId: string, score: number, passed: boolean, mastered: boolean, objectivesPassed: string[]): void {
    const progress = this.state.lessonProgress[lessonId];
    if (!progress) return;

    progress.attempts++;
    progress.bestScore = Math.max(progress.bestScore, score);
    progress.objectivesPassed = Array.from(new Set([...progress.objectivesPassed, ...objectivesPassed]));

    if (passed && !progress.completedAt) {
      progress.completedAt = Date.now();
      progress.status = 'completed';
    }

    if (mastered) {
      progress.masteredAt = Date.now();
      progress.status = 'mastered';
    }

    this.checkLessonUnlocks();
  }

  private checkLessonUnlocks(): void {
    LESSONS.forEach((lesson) => {
      const progress = this.state.lessonProgress[lesson.id];
      if (!progress || progress.status !== 'locked') return;

      if (this.isLessonUnlocked(lesson.id)) {
        progress.status = 'available';
      }
    });

    CHAPTERS.forEach((chapter) => {
      const progress = this.state.chapterProgress[chapter.id];
      if (!progress || progress.status !== 'locked') return;

      if (this.isChapterUnlocked(chapter.id)) {
        progress.status = 'available';
      }
    });
  }

  private checkChapterCompletion(chapterId: string): PendingReward | null {
    const chapter = this.getChapter(chapterId);
    const chapterProgress = this.getChapterProgress(chapterId);
    if (!chapter || chapterProgress.completionBonusClaimed) return null;

    const lessons = this.getLessonsForChapter(chapterId);
    const completedIds = lessons.filter((l) => this.state.lessonProgress[l.id]?.completedAt).map((l) => l.id);
    const masteredIds = lessons.filter((l) => this.state.lessonProgress[l.id]?.masteredAt).map((l) => l.id);

    chapterProgress.completedLessons = completedIds;
    chapterProgress.masteredLessons = masteredIds;

    if (completedIds.length >= chapter.requiredCompletions && !chapterProgress.completionBonusClaimed) {
      chapterProgress.status = masteredIds.length >= lessons.length ? 'mastered' : 'completed';
      chapterProgress.completionBonusClaimed = true;

      if (this.state.entry) {
        this.state.entry.totalCoinsEarned += chapter.completionCoinBonus;
      }

      return {
        type: 'chapter_complete',
        coins: chapter.completionCoinBonus,
        title: `${chapter.name} 完成！`,
        description: `恭喜你完成了整章课程，获得章节奖励！`,
        icon: '🎊',
        chapterId,
      };
    }

    return null;
  }

  private checkAllCompleted(): boolean {
    return CHAPTERS.every((ch) => {
      const progress = this.getChapterProgress(ch.id);
      return progress.status === 'completed' || progress.status === 'mastered';
    });
  }

  public claimPendingReward(): PendingReward | null {
    const reward = this.state.pendingReward;
    this.state.pendingReward = null;
    return reward;
  }

  public getPendingReward(): PendingReward | null {
    return this.state.pendingReward;
  }

  public returnToTraining(): boolean {
    if (this.state.status !== 'exam_completed' && this.state.status !== 'all_completed') return false;
    this.state.status = 'enrolled';
    this.state.currentLessonId = null;
    return true;
  }

  public getGameConfigOverride(lessonId: string): GameConfigOverride | null {
    const lesson = this.getLesson(lessonId);
    if (!lesson) return null;

    return {
      worldSize: lesson.worldSize,
      gravity: lesson.gravity,
      airCurrentSpawnRate: lesson.airCurrentSpawnRate,
      minAirCurrentStrength: lesson.minAirCurrentStrength,
      maxAirCurrentStrength: lesson.maxAirCurrentStrength,
      minBuildingHeight: lesson.minBuildingHeight,
      maxBuildingHeight: lesson.maxBuildingHeight,
      buildingDensity: lesson.buildingDensity,
      windSpeed: lesson.windSpeed,
      turbulenceLevel: lesson.turbulenceLevel,
      cloudCoverage: lesson.cloudCoverage,
    };
  }

  public getTotalCoinsEarned(): number {
    return this.state.entry?.totalCoinsEarned || 0;
  }

  public getLastExamResult(): ExamResult | null {
    return this.state.lastExamResult;
  }

  public getEntry(): TrainingEntry | null {
    return this.state.entry;
  }

  public reset(): void {
    this.state = {
      status: 'idle',
      entry: null,
      currentLessonId: null,
      currentTutorialStepIndex: 0,
      lessonProgress: {},
      chapterProgress: {},
      lastExamResult: null,
      pendingReward: null,
    };
    this.initProgress();
  }

  public saveToLocalStorage(): void {
    try {
      const data = {
        status: this.state.status === 'lesson_active' || this.state.status === 'exam_active' ? 'enrolled' : this.state.status,
        entry: this.state.entry,
        lessonProgress: this.state.lessonProgress,
        chapterProgress: this.state.chapterProgress,
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

      if (data.entry) {
        this.state.entry = data.entry;
      }

      if (data.lessonProgress) {
        Object.keys(data.lessonProgress).forEach((id) => {
          if (this.state.lessonProgress[id]) {
            this.state.lessonProgress[id] = data.lessonProgress[id];
          }
        });
      }

      if (data.chapterProgress) {
        Object.keys(data.chapterProgress).forEach((id) => {
          if (this.state.chapterProgress[id]) {
            this.state.chapterProgress[id] = data.chapterProgress[id];
          }
        });
      }

      if (data.status) {
        this.state.status = data.status;
      }

      this.checkLessonUnlocks();

      return true;
    } catch (e) {
      console.error('Failed to load training data:', e);
      return false;
    }
  }
}

export const trainingEngine = new TrainingEngine();
