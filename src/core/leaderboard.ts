import type { DifficultyId } from '../data/difficulty';
import { difficultyDisplay } from '../data/difficulty';

const STORAGE_KEY_V2 = 'vortex_strikers_leaderboard_v2';
const STORAGE_KEY_V1 = 'vortex_strikers_leaderboard_v1';
const MAX_ENTRIES = 5;

export interface LeaderboardEntry {
  score: number;
  /** `Date.now()` when the run was recorded. */
  at: number;
  difficulty: DifficultyId;
}

function normalizeDifficulty(raw: unknown): DifficultyId {
  return raw === 'hard' ? 'hard' : 'normal';
}

function migrateV1ToV2IfNeeded(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY_V2)) return;
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;
    const migrated: LeaderboardEntry[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const score = (item as { score?: unknown }).score;
      const at = (item as { at?: unknown }).at;
      if (typeof score !== 'number' || typeof at !== 'number') continue;
      if (!Number.isFinite(score) || !Number.isFinite(at)) continue;
      migrated.push({
        score: Math.max(0, Math.floor(score)),
        at: Math.floor(at),
        difficulty: 'normal',
      });
    }
    migrated.sort((a, b) => b.score - a.score);
    const trimmed = migrated.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(trimmed));
  } catch {
    /* ignore */
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  migrateV1ToV2IfNeeded();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: LeaderboardEntry[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const score = (item as { score?: unknown }).score;
      const at = (item as { at?: unknown }).at;
      const difficulty = normalizeDifficulty((item as { difficulty?: unknown }).difficulty);
      if (typeof score !== 'number' || typeof at !== 'number') continue;
      if (!Number.isFinite(score) || !Number.isFinite(at)) continue;
      out.push({
        score: Math.max(0, Math.floor(score)),
        at: Math.floor(at),
        difficulty,
      });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Inserts a score, keeps top `MAX_ENTRIES`, persists. Returns the stored board. */
export function submitRunToLeaderboard(score: number, difficulty: DifficultyId): LeaderboardEntry[] {
  const next = [
    ...loadLeaderboard(),
    {
      score: Math.max(0, Math.floor(score)),
      at: Date.now(),
      difficulty,
    },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function formatLeaderboardShortDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function formatLeaderboardDifficultyLine(entry: LeaderboardEntry): string {
  return difficultyDisplay[entry.difficulty];
}
