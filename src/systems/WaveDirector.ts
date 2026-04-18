import type { WaveEnemyType, WaveScript } from '../data/waves/types';

/** Consumes a data-driven wave script; call `trySpawn` each frame. */
export class WaveDirector {
  private batchIndex = 0;
  private spawnedInBatch = 0;
  private nextSpawnAt = 0;
  private initialized = false;

  constructor(private readonly script: WaveScript) {}

  trySpawn(time: number, spawn: (enemyType: WaveEnemyType) => void): void {
    if (this.doneSpawning) return;
    if (!this.initialized) {
      const first = this.script.batches[0];
      this.nextSpawnAt = time + (first?.delayMs ?? 0);
      this.initialized = true;
    }

    const batch = this.script.batches[this.batchIndex];
    if (!batch) return;
    if (time < this.nextSpawnAt) return;

    spawn(batch.enemyType);

    this.spawnedInBatch += 1;
    if (this.spawnedInBatch >= batch.count) {
      this.batchIndex += 1;
      this.spawnedInBatch = 0;
      const nextBatch = this.script.batches[this.batchIndex];
      if (nextBatch) {
        this.nextSpawnAt = time + nextBatch.delayMs;
      }
    } else {
      this.nextSpawnAt = time + batch.intervalMs;
    }
  }

  get doneSpawning(): boolean {
    return this.batchIndex >= this.script.batches.length;
  }
}
