import { ironCentipedeBoss } from './iron-centipede';
import { siegeCarrierBoss } from './siege-carrier';
import type { BossDefinition, BossId } from './types';

export type { BossDefinition, BossId } from './types';
export { bossPhaseIndex } from './types';

const byId: Record<BossId, BossDefinition> = {
  siege_carrier: siegeCarrierBoss,
  iron_centipede: ironCentipedeBoss,
};

export function getBossDefinition(id: string | undefined): BossDefinition | undefined {
  if (!id) return undefined;
  return byId[id as BossId];
}
