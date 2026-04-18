import type { ShipId } from './types';

export type PrimaryPattern =
  | { kind: 'forward' }
  | { kind: 'fan'; count: number; spreadDeg: number };

export interface ShipCombatStats {
  moveSpeed: number;
  fireCooldownMs: number;
  bulletSpeed: number;
  primaryPattern: PrimaryPattern;
}

export const shipCombatById: Record<ShipId, ShipCombatStats> = {
  falcon: {
    moveSpeed: 420,
    fireCooldownMs: 130,
    bulletSpeed: 640,
    primaryPattern: { kind: 'forward' },
  },
  wyvern: {
    moveSpeed: 400,
    fireCooldownMs: 155,
    bulletSpeed: 600,
    primaryPattern: { kind: 'fan', count: 3, spreadDeg: 26 },
  },
};

export function getShipCombat(id: ShipId): ShipCombatStats {
  return shipCombatById[id];
}

/** Primary shot damage per hit (power level 0–2). */
export function primaryHitDamage(powerLevel: number): number {
  return 1 + Math.min(2, Math.max(0, powerLevel));
}

/** Homing charge missile damage per hit. */
export const PLAYER_MISSILE_HIT_DAMAGE = 5;

/** Charge laser damage per throttled tick (see `LASER_HIT_INTERVAL_MS`). */
export function laserTickDamage(powerLevel: number): number {
  return 3 + Math.min(2, Math.max(0, powerLevel));
}

export const LASER_HIT_INTERVAL_MS = 88;
