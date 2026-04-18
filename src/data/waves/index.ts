import { stage1WaveScript } from './stage1-waves';
import { stage2WaveScript } from './stage2-waves';
import type { WaveScript } from './types';

export type { WaveScript, WaveSpawnBatch } from './types';

const byId: Record<string, WaveScript> = {
  [stage1WaveScript.id]: stage1WaveScript,
  [stage2WaveScript.id]: stage2WaveScript,
};

export function getWaveScript(id: string): WaveScript {
  return byId[id] ?? stage1WaveScript;
}
