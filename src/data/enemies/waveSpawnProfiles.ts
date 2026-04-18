import { TextureKeys } from '../../core/textureKeys';
import type { WaveEnemyType } from '../waves/types';

export interface WaveEnemySpawnProfile {
  textureKey: string;
  vyMin: number;
  vyMax: number;
  hitSize: number;
  offsetX: number;
  offsetY: number;
  depth: number;
  /** Base HP before stage multiplier. */
  maxHp: number;
}

/** Spawn motion & hitbox per wave enemy id. */
export const waveEnemySpawnByType: Record<WaveEnemyType, WaveEnemySpawnProfile> = {
  grunt: {
    textureKey: TextureKeys.Grunt,
    vyMin: 72,
    vyMax: 108,
    hitSize: 20,
    offsetX: 6,
    offsetY: 6,
    depth: 41,
    maxHp: 4,
  },
  turret: {
    textureKey: TextureKeys.EnemyTurret,
    vyMin: 30,
    vyMax: 44,
    hitSize: 26,
    offsetX: 3,
    offsetY: 10,
    depth: 41,
    maxHp: 10,
  },
  raider: {
    textureKey: TextureKeys.EnemyRaider,
    vyMin: 85,
    vyMax: 102,
    hitSize: 18,
    offsetX: 7,
    offsetY: 5,
    depth: 41,
    maxHp: 6,
  },
};

export interface EnemyGunnerTiming {
  firstDelayMin: number;
  firstDelayMax: number;
  repeatMin: number;
  repeatMax: number;
  shotSpeed: number;
}

/** Aim-fire cadence (ms) and bullet speed per role. */
export const enemyGunnerByType: Record<WaveEnemyType, EnemyGunnerTiming> = {
  grunt: {
    firstDelayMin: 900,
    firstDelayMax: 1600,
    repeatMin: 2600,
    repeatMax: 4000,
    shotSpeed: 230,
  },
  turret: {
    firstDelayMin: 500,
    firstDelayMax: 900,
    repeatMin: 1500,
    repeatMax: 2200,
    shotSpeed: 205,
  },
  raider: {
    firstDelayMin: 900,
    firstDelayMax: 1600,
    repeatMin: 2200,
    repeatMax: 3400,
    shotSpeed: 252,
  },
};
