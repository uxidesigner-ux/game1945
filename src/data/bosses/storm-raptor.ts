import { TextureKeys } from '../../core/textureKeys';
import { SCORE_BOSS_STORM_RAPTOR } from '../scoring';
import type { BossDefinition } from './types';

export const stormRaptorBoss: BossDefinition = {
  id: 'storm_raptor',
  displayName: 'Storm Raptor',
  textureKey: TextureKeys.BossStormRaptor,
  maxHp: 5_800,
  scoreReward: SCORE_BOSS_STORM_RAPTOR,
  enterYRatio: 0.10,
  patrolSpeed: 140,
  bodySize: { w: 130, h: 38 },
  bodyOffset: { x: 15, y: 10 },
  aimedShotSpeed: 320,
  aimedIntervalMs: [600, 380, 240],
  burstIntervalMs: [0, 1300, 800],
  burstCount: [0, 5, 7],
  burstSpreadDeg: [22, 32, 42],
  bombDamageChunk: 38,
};
