import type { DifficultyId } from '../data/difficulty';
import type { ShipId } from '../data/ships/types';

const KEY = 'vortex_strikers_run_v1';

export interface RunSnapshot {
  difficulty: DifficultyId;
  lives: number;
  bombs: number;
  score: number;
  charge01: number;
  powerLevel: number;
  selectedShipId: ShipId;
  currentStageIndex: number;
  runElapsedMs: number;
}

export function hasRunCheckpoint(): boolean {
  return localStorage.getItem(KEY) !== null;
}

export function writeRunSnapshot(s: RunSnapshot): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode / quota */
  }
}

export function readRunSnapshot(): RunSnapshot | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as RunSnapshot;
    if (typeof s.currentStageIndex !== 'number' || s.currentStageIndex < 1) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearRunCheckpoint(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
