export type BossId = 'siege_carrier' | 'iron_centipede' | 'iron_basilisk' | 'storm_raptor' | 'overlord';

/** Data-only boss tuning; movement and firing are interpreted by GameScene. */
export interface BossDefinition {
  id: BossId;
  displayName: string;
  textureKey: string;
  maxHp: number;
  scoreReward: number;
  /** Vertical enter position as ratio of view height (0 top). */
  enterYRatio: number;
  patrolSpeed: number;
  bodySize: { w: number; h: number };
  bodyOffset: { x: number; y: number };
  aimedShotSpeed: number;
  /** Indexed by phase0–2 (high / mid / low HP). */
  aimedIntervalMs: [number, number, number];
  burstIntervalMs: [number, number, number];
  burstCount: [number, number, number];
  burstSpreadDeg: [number, number, number];
  bombDamageChunk: number;
}

export function bossPhaseIndex(hp: number, maxHp: number): 0 | 1 | 2 {
  const r = hp / Math.max(1, maxHp);
  if (r > 0.66) return 0;
  if (r > 0.33) return 1;
  return 2;
}
