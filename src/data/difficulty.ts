export type DifficultyId = 'normal' | 'hard';

const STORAGE_KEY = 'vortex_strikers_difficulty';

export const difficultyDisplay: Record<DifficultyId, string> = {
  normal: 'Normal',
  hard: 'Hard',
};

/** Scales wave spawns and enemy/boss shot cadence (<1 = harder / faster). */
export function difficultyTuning(id: DifficultyId): {
  waveTimingMul: number;
  enemyFireMul: number;
  bossIntervalMul: number;
} {
  if (id === 'hard') {
    return {
      waveTimingMul: 0.82,
      enemyFireMul: 0.78,
      bossIntervalMul: 0.82,
    };
  }
  return {
    waveTimingMul: 1,
    enemyFireMul: 1,
    bossIntervalMul: 1,
  };
}

export function loadDifficultyFromStorage(): DifficultyId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'hard') return 'hard';
  } catch {
    /* ignore */
  }
  return 'normal';
}

export function persistDifficultyToStorage(id: DifficultyId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
