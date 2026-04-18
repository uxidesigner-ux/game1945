const STORAGE_KEY = 'vortex_strikers_high_score';

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Persists if `score` beats the stored best. Returns the best score after the attempt. */
export function recordHighScoreIfBest(score: number): number {
  const prev = loadHighScore();
  const next = Math.max(prev, Math.max(0, Math.floor(score)));
  if (next > prev) {
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* private mode */
    }
  }
  return next;
}
