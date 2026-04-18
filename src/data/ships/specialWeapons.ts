/** Charge shot, bomb tuning per ship — MVP numbers; move to stage modifiers later. */
export const specialWeaponStats = {
  charge: {
    fillPerSecond: 0.9,
    decayPerSecond: 0.55,
    minRelease: 0.24,
    falcon: {
      laserSpeed: 860,
    },
    wyvern: {
      missileCount: 5,
      spreadDeg: 24,
      missileSpeed: 360,
      turnRateRadPerSec: 4.8,
    },
  },
  bomb: {
    falcon: {
      forwardOffset: 240,
      radius: 168,
    },
    wyvern: {
      aheadY: 300,
      radius: 118,
      spreadX: 100,
    },
  },
} as const;

export const OrdnanceKind = {
  Primary: 'primary',
  Laser: 'laser',
  Missile: 'missile',
} as const;
