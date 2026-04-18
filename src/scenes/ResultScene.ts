import Phaser from 'phaser';
import { formatTimeMs } from '../core/formatTime';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Result);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.35, 'STAGE CLEAR', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        color: '#a8e6a3',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.46, `Score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.53, `Stage time ${formatTimeMs(runState.stageElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.59, `Run time ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.68, 'ENTER — next stage · T — title', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      runState.currentStageIndex += 1;
      if (runState.currentStageIndex > 2) {
        this.scene.start(SceneKeys.MVPClear);
      } else {
        this.scene.start(SceneKeys.Game);
      }
    });

    this.input.keyboard?.once('keydown-T', () => {
      this.scene.start(SceneKeys.Title);
    });
  }
}
