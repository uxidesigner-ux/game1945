import Phaser from 'phaser';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class MVPClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MVPClear);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.35, 'MVP CLEAR', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: '#ffd27f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.48, 'Thanks for playing the scaffold run.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.58, `Final score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.72, 'ENTER — title', {
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
