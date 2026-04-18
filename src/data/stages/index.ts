import { stage1CoastalRuins } from './stage1-coastal-ruins';
import { stage2DesertConvoy } from './stage2-desert-convoy';
import type { StageDefinition } from './types';

export type { StageDefinition } from './types';

export const stagesInOrder: StageDefinition[] = [
  stage1CoastalRuins,
  stage2DesertConvoy,
];

export function getStageByIndex(oneBased: number): StageDefinition | undefined {
  return stagesInOrder[oneBased - 1];
}
