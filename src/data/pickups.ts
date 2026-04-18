/** Collectible drops — tuned for MVP readability over generosity. */
export const PickupKind = {
  Power: 'power',
  EnergyCore: 'energy_core',
} as const;

/** Chance on scored enemy kill to drop (power checked first, then core). */
export const PICKUP_CHANCE_POWER = 0.09;
export const PICKUP_CHANCE_ENERGY_CORE = 0.12;
