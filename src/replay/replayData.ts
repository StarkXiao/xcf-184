import type { ReplayState } from './types';
import { DEFAULT_PLAYBACK, DEFAULT_FILTERS } from './types';

export const createDefaultReplayState = (): ReplayState => ({
  replays: [],
  reviews: {},
  shares: [],
  currentReplayId: null,
  playback: { ...DEFAULT_PLAYBACK },
  filters: { ...DEFAULT_FILTERS },
  sortBy: 'date',
  sortOrder: 'desc',
});

export const generateReplayId = (): string => {
  return `replay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const generateKeyNodeId = (): string => {
  return `kn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const generateShareId = (): string => {
  return `share_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const getGradeForScore = (score: number): { grade: string; color: string } => {
  const thresholds = [
    { grade: 'S+', min: 95, color: '#ff00ff' },
    { grade: 'S', min: 90, color: '#ffd700' },
    { grade: 'A+', min: 85, color: '#ff8c00' },
    { grade: 'A', min: 80, color: '#ff6b6b' },
    { grade: 'B', min: 70, color: '#4ecdc4' },
    { grade: 'C', min: 60, color: '#95e1d3' },
    { grade: 'D', min: 0, color: '#9ca3af' },
  ];
  for (const t of thresholds) {
    if (score >= t.min) return { grade: t.grade, color: t.color };
  }
  return { grade: 'D', color: '#9ca3af' };
};

export const generateShareCode = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const SAVE_KEY = 'kite_replay_save';
