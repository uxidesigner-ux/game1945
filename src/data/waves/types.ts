export type WaveEnemyType = 'grunt' | 'turret' | 'raider';

/** One timed batch of spawns inside a stage wave script. */
export interface WaveSpawnBatch {
  enemyType: WaveEnemyType;
  count: number;
  intervalMs: number;
  /** Delay from wave start (batch 0) or from previous batch’s last spawn (batch 1+). */
  delayMs: number;
}

export interface WaveScript {
  id: string;
  batches: WaveSpawnBatch[];
}
