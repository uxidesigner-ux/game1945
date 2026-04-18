/** Simple interval spawner for the first playable wave. */
export class WaveSpawner {
  private nextSpawnAt = 0;
  private spawned = 0;

  constructor(
    private readonly total: number,
    private readonly intervalMs: number,
  ) {}

  trySpawn(time: number, spawn: () => void): void {
    if (this.spawned >= this.total) return;
    if (time < this.nextSpawnAt) return;
    spawn();
    this.spawned += 1;
    this.nextSpawnAt = time + this.intervalMs;
  }

  get doneSpawning(): boolean {
    return this.spawned >= this.total;
  }

  get remainingToSpawn(): number {
    return Math.max(0, this.total - this.spawned);
  }
}
