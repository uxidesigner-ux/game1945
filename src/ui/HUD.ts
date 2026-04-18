import Phaser from 'phaser';
import type { RunState } from '../core/RunState';
import { getShip } from '../data/ships';
import { getStageByIndex } from '../data/stages';

const HUD_COLOR = '#e8f4ff';
const DIM_COLOR = '#7aa6c8';

/**
 * In-game HUD: lives, bombs, charge, score. Updates from RunState each frame or on demand.
 */
export class HUD {
  private readonly texts: {
    stage: Phaser.GameObjects.Text;
    ship: Phaser.GameObjects.Text;
    lives: Phaser.GameObjects.Text;
    bombs: Phaser.GameObjects.Text;
    charge: Phaser.GameObjects.Text;
    score: Phaser.GameObjects.Text;
  };

  constructor(scene: Phaser.Scene) {
    const pad = 16;
    const w = scene.scale.width;

    this.texts = {
      stage: scene.add.text(pad, pad, '', { fontSize: '18px', color: HUD_COLOR }),
      ship: scene.add.text(pad, pad + 26, '', { fontSize: '16px', color: DIM_COLOR }),
      lives: scene.add.text(pad, pad + 52, '', { fontSize: '18px', color: HUD_COLOR }),
      bombs: scene.add.text(pad, pad + 78, '', { fontSize: '18px', color: HUD_COLOR }),
      charge: scene.add.text(pad, pad + 104, '', { fontSize: '18px', color: HUD_COLOR }),
      score: scene.add.text(w - pad, pad, '', { fontSize: '20px', color: HUD_COLOR }).setOrigin(1, 0),
    };
  }

  sync(state: RunState): void {
    const stage = getStageByIndex(state.currentStageIndex);
    const stageLine = stage
      ? `${stage.displayName}`
      : `Stage ${state.currentStageIndex}`;
    this.texts.stage.setText(stageLine);

    const ship = getShip(state.selectedShipId);
    this.texts.ship.setText(`${ship.displayName}  ·  PWR ${state.powerLevel}`);

    this.texts.lives.setText(`Lives ${state.lives}`);
    this.texts.bombs.setText(`Bombs ${state.bombs}`);
    const pct = Math.round(state.charge01 * 100);
    this.texts.charge.setText(`Charge ${pct}%`);
    this.texts.score.setText(`Score ${state.score.toLocaleString()}`);
  }

  destroy(): void {
    Object.values(this.texts).forEach((t) => t.destroy());
  }
}
