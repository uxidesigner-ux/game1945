import type { WaveScript } from './types';

export const stage2WaveScript: WaveScript = {
  id: 'stage2_waves',
  batches: [
    { enemyType: 'grunt', count: 7, intervalMs: 680, delayMs: 300 },
    { enemyType: 'raider', count: 5, intervalMs: 880, delayMs: 450 },
    { enemyType: 'turret', count: 4, intervalMs: 1150, delayMs: 500 },
    { enemyType: 'grunt', count: 6, intervalMs: 620, delayMs: 380 },
  ],
};
