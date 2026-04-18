import Phaser from 'phaser';
import { formatTimeMs } from '../core/formatTime';
import { runState } from '../core/RunState';
import { getStageByIndex } from '../data/stages';
import { SceneKeys } from './sceneKeys';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(): void {
    const { width, height } = this.scale;
    const stage = getStageByIndex(runState.currentStageIndex);

    this.add
      .text(width / 2, height * 0.34, 'GAME OVER', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: '#ff8a8a',
      })
      .setOrigin(0.5);

    if (stage) {
      this.add
        .text(width / 2, height * 0.44, stage.displayName, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#8fb8d9',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.52, `Score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.59, `This stage ${formatTimeMs(runState.stageElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.66, `Run time ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.76, 'ENTER — title', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#5c7a92',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.Title);
    });
  }
}
