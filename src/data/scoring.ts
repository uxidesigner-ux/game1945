/** MVP scoring; tune later with time multipliers. */
export const SCORE_GRUNT_KILL = 120;
export const SCORE_ENERGY_CORE = 650;
export const SCORE_BOSS_SIEGE_CARRIER = 8200;
export const SCORE_BOSS_IRON_CENTIPEDE = 9600;

/**
 * Energy Core value rises slowly with stage time (caps at +35% over ~4 minutes).
 */
export function energyCoreScoreAt(elapsedMs: number): number {
  const t = Math.min(elapsedMs / 240_000, 1);
  const mult = 1 + 0.35 * t;
  return Math.floor(SCORE_ENERGY_CORE * mult);
}
