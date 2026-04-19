import { TextureKeys } from '../../core/textureKeys';
import { SCORE_BOSS_OVERLORD } from '../scoring';
import type { BossDefinition } from './types';

export const overlordBoss: BossDefinition = {
  id: 'overlord',
  displayName: 'OVERLORD',
  textureKey: TextureKeys.BossOverlord,
  maxHp: 9_000,
  scoreReward: SCORE_BOSS_OVERLORD,
  enterYRatio: 0.09,
  patrolSpeed: 160,
  bodySize: { w: 172, h: 44 },
  bodyOffset: { x: 10, y: 16 },
  aimedShotSpeed: 350,
  aimedIntervalMs: [480, 300, 180],
  burstIntervalMs: [0, 1000, 600],
  burstCount: [0, 6, 8],
  burstSpreadDeg: [24, 36, 48],
  bombDamageChunk: 48,
};
