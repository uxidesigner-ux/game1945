import Phaser from 'phaser';
import { TextureKeys } from '../core/textureKeys';
import { SceneKeys } from './sceneKeys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    // External assets load here later.
  }

  create(): void {
    this.createProceduralTextures();
    this.scene.start(SceneKeys.Title);
  }

  private createProceduralTextures(): void {
    const paint = (draw: (g: Phaser.GameObjects.Graphics) => void, key: string, w: number, h: number) => {
      const g = this.add.graphics();
      g.setVisible(false);
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    paint(
      (g) => {
        g.fillStyle(0x5fd4ff, 1);
        g.fillTriangle(16, 4, 4, 34, 28, 34);
      },
      TextureKeys.Player,
      32,
      36,
    );

    paint(
      (g) => {
        g.fillStyle(0xff6b5a, 1);
        g.fillCircle(16, 16, 14);
        g.fillStyle(0x3b1f1f, 1);
        g.fillCircle(16, 16, 5);
      },
      TextureKeys.Grunt,
      32,
      32,
    );

    paint(
      (g) => {
        g.fillStyle(0xffe08a, 1);
        g.fillRoundedRect(0, 0, 6, 18, 2);
      },
      TextureKeys.BulletPlayer,
      6,
      18,
    );
  }
}
