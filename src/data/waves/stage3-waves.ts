import type { WaveScript } from './types';

export const stage3WaveScript: WaveScript = {
  id: 'stage3_waves',
  batches: [
    { enemyType: 'grunt',  count: 8,  intervalMs: 540, delayMs: 240 },
    { enemyType: 'raider', count: 5,  intervalMs: 740, delayMs: 340 },
    { enemyType: 'turret', count: 5,  intervalMs: 880, delayMs: 380 },
    { enemyType: 'raider', count: 5,  intervalMs: 660, delayMs: 280 },
    { enemyType: 'grunt',  count: 7,  intervalMs: 460, delayMs: 200 },
  ],
};
