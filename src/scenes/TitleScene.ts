import Phaser from 'phaser';
import { SceneKeys } from './sceneKeys';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.28, 'VORTEX STRIKERS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, 'Vertical action — original work', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    const hint = this.add
      .text(width / 2, height * 0.55, 'Press ENTER — Ship select', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#ffd27f',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.ShipSelect);
    });
  }
}
