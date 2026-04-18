import Phaser from 'phaser';
import { formatTimeMs } from '../core/formatTime';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class MVPClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MVPClear);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.32, 'MVP CLEAR', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: '#ffd27f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.44, 'VORTEX STRIKERS — demo run complete.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        color: '#e8f4ff',
        align: 'center',
        wordWrap: { width: width * 0.85 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.54, `Final score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.62, `Total run ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.74, 'ENTER — title', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.Title);
    });
  }
}
