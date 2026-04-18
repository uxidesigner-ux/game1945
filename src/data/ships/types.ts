export type ShipId = 'falcon' | 'wyvern';

export interface ShipDefinition {
  id: ShipId;
  displayName: string;
  role: string;
  /** Short flavor text for ship select; no real-world aircraft names. */
  description: string;
}
