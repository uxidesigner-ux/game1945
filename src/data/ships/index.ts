import { falconShip } from './falcon';
import { wyvernShip } from './wyvern';
import type { ShipDefinition, ShipId } from './types';

export type { ShipDefinition, ShipId } from './types';

const byId: Record<ShipId, ShipDefinition> = {
  falcon: falconShip,
  wyvern: wyvernShip,
};

export function getShip(id: ShipId): ShipDefinition {
  return byId[id];
}

export const allShips: ShipDefinition[] = [falconShip, wyvernShip];
