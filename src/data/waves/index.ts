import { stage1WaveScript } from './stage1-waves';
import { stage2WaveScript } from './stage2-waves';
import { stage3WaveScript } from './stage3-waves';
import { stage4WaveScript } from './stage4-waves';
import { stage5WaveScript } from './stage5-waves';
import type { WaveScript } from './types';

export type { WaveScript, WaveSpawnBatch } from './types';

const byId: Record<string, WaveScript> = {
  [stage1WaveScript.id]: stage1WaveScript,
  [stage2WaveScript.id]: stage2WaveScript,
  [stage3WaveScript.id]: stage3WaveScript,
  [stage4WaveScript.id]: stage4WaveScript,
  [stage5WaveScript.id]: stage5WaveScript,
};

export function getWaveScript(id: string): WaveScript {
  return byId[id] ?? stage1WaveScript;
}
