import type { PrimaryPattern, ShipCombatStats } from './combatStats';
import type { ShipId } from './types';

export type ResolvedPrimary = {
  cooldownMs: number;
  pattern: PrimaryPattern;
  bulletSpeed: number;
};

export function resolvePrimaryStats(
  base: ShipCombatStats,
  shipId: ShipId,
  powerLevel: number,
): ResolvedPrimary {
  const lv = Math.min(2, Math.max(0, powerLevel));
  let cooldownMs = base.fireCooldownMs;
  if (lv >= 1) cooldownMs *= 0.9;
  if (lv >= 2) cooldownMs *= 0.9;

  const pattern = base.primaryPattern;
  if (shipId === 'wyvern' && pattern.kind === 'fan') {
    let count = pattern.count;
    let spreadDeg = pattern.spreadDeg;
    if (lv >= 1) {
      count += 1;
      spreadDeg += 3;
    }
    if (lv >= 2) {
      count += 1;
      spreadDeg += 2;
    }
    return {
      cooldownMs,
      pattern: { kind: 'fan', count, spreadDeg },
      bulletSpeed: base.bulletSpeed,
    };
  }

  return { cooldownMs, pattern, bulletSpeed: base.bulletSpeed };
}
