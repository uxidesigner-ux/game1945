import Phaser from 'phaser';
import { runState } from '../core/RunState';
import { allShips, getShip } from '../data/ships';
import type { ShipId } from '../data/ships/types';
import { SceneKeys } from './sceneKeys';

export class ShipSelectScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.ShipSelect);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height * 0.12, 'SELECT CRAFT', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    const startY = height * 0.28;
    const step = 140;

    allShips.forEach((ship, index) => {
      const y = startY + index * step;
      const def = getShip(ship.id);

      const label = this.add
        .text(width / 2, y, `${def.displayName} — ${def.role}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '26px',
          color: '#cfe9ff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(width / 2, y + 32, def.description, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#7aa6c8',
          align: 'center',
          wordWrap: { width: width * 0.82 },
        })
        .setOrigin(0.5);

      label.on('pointerdown', () => {
        this.startRun(ship.id);
      });
    });

    this.add
      .text(width / 2, height * 0.88, '1 / 2 — keyboard  ·  Click — start', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#5c7a92',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    const k1 = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const k2 = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    k1?.on('down', () => this.startRun('falcon'));
    k2?.on('down', () => this.startRun('wyvern'));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      k1?.removeAllListeners();
      k2?.removeAllListeners();
    });
  }

  private startRun(shipId: ShipId): void {
    runState.resetForNewRun(shipId);
    this.scene.start(SceneKeys.Game);
  }
}
