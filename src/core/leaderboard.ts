const STORAGE_KEY = 'vortex_strikers_leaderboard_v1';
const MAX_ENTRIES = 5;

export interface LeaderboardEntry {
  score: number;
  /** `Date.now()` when the run was recorded. */
  at: number;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: LeaderboardEntry[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const score = (item as { score?: unknown }).score;
      const at = (item as { at?: unknown }).at;
      if (typeof score !== 'number' || typeof at !== 'number') continue;
      if (!Number.isFinite(score) || !Number.isFinite(at)) continue;
      out.push({ score: Math.max(0, Math.floor(score)), at: Math.floor(at) });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Inserts a score, keeps top `MAX_ENTRIES`, persists. Returns the stored board. */
export function submitRunToLeaderboard(score: number): LeaderboardEntry[] {
  const next = [
    ...loadLeaderboard(),
    { score: Math.max(0, Math.floor(score)), at: Date.now() },
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
