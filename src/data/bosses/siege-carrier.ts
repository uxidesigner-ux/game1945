import { TextureKeys } from '../../core/textureKeys';
import { SCORE_BOSS_SIEGE_CARRIER } from '../scoring';
import type { BossDefinition } from './types';

export const siegeCarrierBoss: BossDefinition = {
  id: 'siege_carrier',
  displayName: 'Siege Carrier',
  textureKey: TextureKeys.BossSiegeCarrier,
  maxHp: 48,
  scoreReward: SCORE_BOSS_SIEGE_CARRIER,
  enterYRatio: 0.13,
  patrolSpeed: 68,
  bodySize: { w: 92, h: 48 },
  bodyOffset: { x: 14, y: 20 },
  aimedShotSpeed: 238,
  aimedIntervalMs: [980, 640, 460],
  burstIntervalMs: [0, 2400, 1700],
  burstCount: [0, 3, 5],
  burstSpreadDeg: [16, 22, 28],
  bombDamageChunk: 10,
};
