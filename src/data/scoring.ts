/** MVP scoring; tune later with time multipliers. */
export const SCORE_GRUNT_KILL = 120;
export const SCORE_ENERGY_CORE = 650;
export const SCORE_BOSS_SIEGE_CARRIER = 8_200;
export const SCORE_BOSS_IRON_CENTIPEDE = 9_600;
export const SCORE_BOSS_IRON_BASILISK = 14_000;
export const SCORE_BOSS_STORM_RAPTOR = 20_000;
export const SCORE_BOSS_OVERLORD = 32_000;

/** Per-stage enemy kill reward (increases with stage to reward survival). */
const STAGE_KILL_SCORES = [120, 160, 240, 360, 520] as const;
export function stageKillScore(stageIndex: number): number {
  const idx = Math.max(0, Math.min(4, stageIndex - 1));
  return STAGE_KILL_SCORES[idx] ?? 120;
}

/**
 * Energy Core value rises slowly with stage time (caps at +35% over ~4 minutes).
 */
export function energyCoreScoreAt(elapsedMs: number): number {
  const t = Math.min(elapsedMs / 240_000, 1);
  const mult = 1 + 0.35 * t;
  return Math.floor(SCORE_ENERGY_CORE * mult);
}
