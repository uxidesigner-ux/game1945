import type { DifficultyId } from '../data/difficulty';
import { difficultyDisplay } from '../data/difficulty';

const STORAGE_KEY_V2 = 'vortex_strikers_leaderboard_v2';
const STORAGE_KEY_V1 = 'vortex_strikers_leaderboard_v1';
const MAX_ENTRIES = 10;

export interface LeaderboardEntry {
  score: number;
  /** `Date.now()` when the run was recorded. */
  at: number;
  difficulty: DifficultyId;
  /** Highest stage index reached (1–5). */
  stage: number;
}

function normalizeDifficulty(raw: unknown): DifficultyId {
  return raw === 'hard' ? 'hard' : 'normal';
}

function normalizeStage(raw: unknown): number {
  if (typeof raw === 'number' && raw >= 1 && raw <= 5) return Math.floor(raw);
  return 1;
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
        stage: 1,
      });
    }
    migrated.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated.slice(0, MAX_ENTRIES)));
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
      const stage = normalizeStage((item as { stage?: unknown }).stage);
      if (typeof score !== 'number' || typeof at !== 'number') continue;
      if (!Number.isFinite(score) || !Number.isFinite(at)) continue;
      out.push({
        score: Math.max(0, Math.floor(score)),
        at: Math.floor(at),
        difficulty,
        stage,
      });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export interface SubmitResult {
  board: LeaderboardEntry[];
  /** 1-based rank of this run in the stored board, or null if not ranked. */
  rank: number | null;
}

/** Inserts a score, keeps top MAX_ENTRIES, persists. Returns board + rank. */
export function submitRunToLeaderboard(
  score: number,
  difficulty: DifficultyId,
  stage: number,
): SubmitResult {
  const entry: LeaderboardEntry = {
    score: Math.max(0, Math.floor(score)),
    at: Date.now(),
    difficulty,
    stage: Math.max(1, Math.min(5, stage)),
  };
  const next = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  const rank = next.findIndex(e => e.at === entry.at && e.score === entry.score);
  return { board: next, rank: rank === -1 ? null : rank + 1 };
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

/** One-line summary for leaderboard rows: "12,450 · S3 · Normal · Apr 19 14:32" */
export function formatLeaderboardRow(entry: LeaderboardEntry): string {
  return `${entry.score.toLocaleString()} · S${entry.stage} · ${formatLeaderboardDifficultyLine(entry)} · ${formatLeaderboardShortDate(entry.at)}`;
}
