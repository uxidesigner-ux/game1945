import { stage1CoastalRuins } from './stage1-coastal-ruins';
import { stage2DesertConvoy } from './stage2-desert-convoy';
import { stage3SteelFactory } from './stage3-steel-factory';
import { stage4AerialFortress } from './stage4-aerial-fortress';
import { stage5CommandCenter } from './stage5-command-center';
import type { StageDefinition } from './types';

export type { StageDefinition } from './types';

export const stagesInOrder: StageDefinition[] = [
  stage1CoastalRuins,
  stage2DesertConvoy,
  stage3SteelFactory,
  stage4AerialFortress,
  stage5CommandCenter,
];

export function getStageByIndex(oneBased: number): StageDefinition | undefined {
  return stagesInOrder[oneBased - 1];
}
