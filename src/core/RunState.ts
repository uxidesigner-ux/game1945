import { clearRunCheckpoint, type RunSnapshot } from './runCheckpoint';
import type { DifficultyId } from '../data/difficulty';
import type { ShipId } from '../data/ships/types';

/** Per-run state passed between scenes (lives, bombs, score, selection). */
export class RunState {
  /** Set from title; not cleared by `resetForNewRun`. */
  difficulty: DifficultyId = 'normal';
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
  /** Ms since current GameScene started (Energy Core time bonus). */
  stageElapsedMs = 0;
  /** Cumulative ms in gameplay this run (all GameScene time, excl. pause). */
  runElapsedMs = 0;

  toSnapshot(): RunSnapshot {
    return {
      difficulty: this.difficulty,
      lives: this.lives,
      bombs: this.bombs,
      score: this.score,
      charge01: this.charge01,
      powerLevel: this.powerLevel,
      selectedShipId: this.selectedShipId,
      currentStageIndex: this.currentStageIndex,
      runElapsedMs: this.runElapsedMs,
    };
  }

  applyFromSnapshot(s: RunSnapshot): void {
    this.difficulty = s.difficulty;
    this.lives = s.lives;
    this.bombs = s.bombs;
    this.score = s.score;
    this.charge01 = s.charge01;
    this.powerLevel = s.powerLevel;
    this.selectedShipId = s.selectedShipId;
    this.currentStageIndex = s.currentStageIndex;
    this.stageElapsedMs = 0;
    this.runElapsedMs = s.runElapsedMs;
  }

  resetForNewRun(shipId: ShipId): void {
    clearRunCheckpoint();
    this.lives = 3;
    this.bombs = 2;
    this.score = 0;
    this.charge01 = 0;
    this.powerLevel = 0;
    this.selectedShipId = shipId;
    this.currentStageIndex = 1;
    this.stageElapsedMs = 0;
    this.runElapsedMs = 0;
  }
}

export const runState = new RunState();
