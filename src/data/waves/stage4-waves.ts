import type { WaveScript } from './types';

export const stage4WaveScript: WaveScript = {
  id: 'stage4_waves',
  batches: [
    { enemyType: 'grunt',  count: 9,  intervalMs: 420, delayMs: 180 },
    { enemyType: 'raider', count: 6,  intervalMs: 600, delayMs: 280 },
    { enemyType: 'turret', count: 5,  intervalMs: 720, delayMs: 320 },
    { enemyType: 'raider', count: 7,  intervalMs: 520, delayMs: 220 },
    { enemyType: 'grunt',  count: 10, intervalMs: 360, delayMs: 160 },
  ],
};
