import type { ShipId } from '../data/ships/types';

/** Per-run state passed between scenes (lives, bombs, score, selection). */
export class RunState {
  lives = 3;
  bombs = 2;
  score = 0;
  /** 0–1 charge; gameplay systems will drive this in later steps. */
  charge01 = 0;
  /** Primary shot tier0–2 (power pickups). */
  powerLevel = 0;
  selectedShipId: ShipId = 'falcon';
  /** 1-based stage index for the MVP flow. */
  currentStageIndex = 1;

  resetForNewRun(shipId: ShipId): void {
    this.lives = 3;
    this.bombs = 2;
    this.score = 0;
    this.charge01 = 0;
    this.powerLevel = 0;
    this.selectedShipId = shipId;
    this.currentStageIndex = 1;
  }
}

export const runState = new RunState();
