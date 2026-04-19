import { ironCentipedeBoss } from './iron-centipede';
import { siegeCarrierBoss } from './siege-carrier';
import { ironBasiliskBoss } from './iron-basilisk';
import { stormRaptorBoss } from './storm-raptor';
import { overlordBoss } from './overlord';
import type { BossDefinition, BossId } from './types';

export type { BossDefinition, BossId } from './types';
export { bossPhaseIndex } from './types';

const byId: Record<BossId, BossDefinition> = {
  siege_carrier: siegeCarrierBoss,
  iron_centipede: ironCentipedeBoss,
  iron_basilisk: ironBasiliskBoss,
  storm_raptor: stormRaptorBoss,
  overlord: overlordBoss,
};

export function getBossDefinition(id: string | undefined): BossDefinition | undefined {
  if (!id) return undefined;
  return byId[id as BossId];
}
