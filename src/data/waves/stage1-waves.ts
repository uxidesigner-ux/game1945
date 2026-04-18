import type { WaveScript } from './types';

export const stage1WaveScript: WaveScript = {
  id: 'stage1_waves',
  batches: [
    { enemyType: 'grunt', count: 6, intervalMs: 820, delayMs: 380 },
    { enemyType: 'turret', count: 3, intervalMs: 1300, delayMs: 550 },
    { enemyType: 'raider', count: 4, intervalMs: 950, delayMs: 480 },
    { enemyType: 'grunt', count: 5, intervalMs: 700, delayMs: 420 },
  ],
};
