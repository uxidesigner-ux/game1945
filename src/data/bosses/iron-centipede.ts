import { TextureKeys } from '../../core/textureKeys';
import { SCORE_BOSS_IRON_CENTIPEDE } from '../scoring';
import type { BossDefinition } from './types';

export const ironCentipedeBoss: BossDefinition = {
  id: 'iron_centipede',
  displayName: 'Iron Centipede',
  textureKey: TextureKeys.BossIronCentipede,
  maxHp: 58,
  scoreReward: SCORE_BOSS_IRON_CENTIPEDE,
  enterYRatio: 0.11,
  patrolSpeed: 92,
  bodySize: { w: 132, h: 44 },
  bodyOffset: { x: 14, y: 18 },
  aimedShotSpeed: 265,
  aimedIntervalMs: [860, 520, 380],
  burstIntervalMs: [0, 1900, 1200],
  burstCount: [0, 4, 6],
  burstSpreadDeg: [20, 26, 34],
  bombDamageChunk: 9,
};
