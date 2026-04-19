import { TextureKeys } from '../../core/textureKeys';
import { SCORE_BOSS_IRON_BASILISK } from '../scoring';
import type { BossDefinition } from './types';

export const ironBasiliskBoss: BossDefinition = {
  id: 'iron_basilisk',
  displayName: 'Iron Basilisk',
  textureKey: TextureKeys.BossIronBasilisk,
  maxHp: 4_000,
  scoreReward: SCORE_BOSS_IRON_BASILISK,
  enterYRatio: 0.12,
  patrolSpeed: 110,
  bodySize: { w: 148, h: 36 },
  bodyOffset: { x: 6, y: 14 },
  aimedShotSpeed: 290,
  aimedIntervalMs: [740, 480, 330],
  burstIntervalMs: [0, 1600, 1050],
  burstCount: [0, 4, 6],
  burstSpreadDeg: [20, 28, 36],
  bombDamageChunk: 32,
};
