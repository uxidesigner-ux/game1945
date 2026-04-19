import type { WaveScript } from './types';

export const stage5WaveScript: WaveScript = {
  id: 'stage5_waves',
  batches: [
    { enemyType: 'grunt',  count: 10, intervalMs: 320, delayMs: 140 },
    { enemyType: 'raider', count: 7,  intervalMs: 460, delayMs: 220 },
    { enemyType: 'turret', count: 6,  intervalMs: 580, delayMs: 260 },
    { enemyType: 'raider', count: 8,  intervalMs: 400, delayMs: 180 },
    { enemyType: 'grunt',  count: 12, intervalMs: 280, delayMs: 120 },
  ],
};
