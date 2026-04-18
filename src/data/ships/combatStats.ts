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
