import Phaser from 'phaser';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.38, 'GAME OVER', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: '#ff8a8a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, `Score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.64, 'ENTER — title', {
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
