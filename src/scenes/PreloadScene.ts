import Phaser from 'phaser';
import { primeAudioContext } from '../audio/proceduralSfx';
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
    primeAudioContext();
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

    paint(
      (g) => {
        g.fillStyle(0x7af8ff, 1);
        g.fillRoundedRect(2, 0, 8, 64, 3);
        g.fillStyle(0xffffff, 0.35);
        g.fillRect(4, 4, 2, 52);
      },
      TextureKeys.ChargeLaser,
      12,
      64,
    );

    paint(
      (g) => {
        g.fillStyle(0xffb347, 1);
        g.fillTriangle(6, 2, 2, 16, 10, 16);
        g.fillStyle(0xff6b2d, 1);
        g.fillTriangle(6, 6, 4, 14, 8, 14);
      },
      TextureKeys.HomingMissile,
      12,
      18,
    );

    paint(
      (g) => {
        g.fillStyle(0xff7a6a, 1);
        g.fillEllipse(5, 10, 10, 14);
        g.fillStyle(0xffc4b8, 0.9);
        g.fillEllipse(5, 9, 4, 6);
      },
      TextureKeys.BulletEnemy,
      10,
      18,
    );

    paint(
      (g) => {
        g.fillStyle(0x7aff9a, 1);
        g.fillCircle(10, 10, 9);
        g.fillStyle(0x1a3d24, 1);
        g.fillCircle(10, 10, 4);
      },
      TextureKeys.PickupPower,
      20,
      20,
    );

    paint(
      (g) => {
        g.fillStyle(0x5fd4ff, 1);
        g.fillCircle(10, 10, 9);
        g.fillStyle(0xffffff, 0.55);
        g.fillCircle(10, 10, 5);
        g.fillStyle(0xa8e8ff, 1);
        g.fillCircle(7, 7, 3);
      },
      TextureKeys.PickupEnergy,
      20,
      20,
    );

    paint(
      (g) => {
        g.fillStyle(0x6a7a8c, 1);
        g.fillRoundedRect(4, 8, 28, 22, 4);
        g.fillStyle(0x3d4a5c, 1);
        g.fillRoundedRect(10, 4, 16, 10, 3);
        g.fillStyle(0xff9a7a, 1);
        g.fillCircle(16, 26, 4);
      },
      TextureKeys.EnemyTurret,
      36,
      36,
    );

    paint(
      (g) => {
        g.fillStyle(0xb58cff, 1);
        g.fillTriangle(16, 4, 6, 30, 26, 30);
        g.fillStyle(0x6a3dc7, 1);
        g.fillTriangle(16, 10, 10, 26, 22, 26);
      },
      TextureKeys.EnemyRaider,
      32,
      34,
    );

    paint(
      (g) => {
        g.fillStyle(0x4a5f78, 1);
        g.fillRoundedRect(8, 28, 112, 28, 6);
        g.fillStyle(0x35475c, 1);
        g.fillRoundedRect(20, 16, 88, 20, 4);
        g.fillStyle(0x8a9cb0, 1);
        g.fillRoundedRect(52, 8, 24, 16, 3);
        g.fillStyle(0xff6b5a, 0.85);
        g.fillCircle(96, 36, 5);
      },
      TextureKeys.BossSiegeCarrier,
      128,
      72,
    );

    paint(
      (g) => {
        const colors = [0x8a5a4a, 0x6d4538];
        for (let i = 0; i < 6; i++) {
          g.fillStyle(colors[i % 2] ?? 0x6d4538, 1);
          g.fillRoundedRect(4 + i * 26, 10 + (i % 2) * 3, 24, 30, 4);
        }
        g.fillStyle(0xffb38a, 1);
        g.fillCircle(158, 20, 7);
      },
      TextureKeys.BossIronCentipede,
      168,
      52,
    );
  }
}
