import Phaser from 'phaser';
import type { RunState } from '../core/RunState';
import { getShip } from '../data/ships';
import { getStageByIndex } from '../data/stages';

const HUD_COLOR = '#e8f4ff';
const DIM_COLOR = '#7aa6c8';

const BOSS_BAR_W = 268;
const BOSS_BAR_H = 14;
const BOSS_FILL_INSET = 3;

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

  private readonly bossBar: {
    bg: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
    name: Phaser.GameObjects.Text;
    phase: Phaser.GameObjects.Text;
  };

  constructor(scene: Phaser.Scene) {
    const pad = 16;
    const w = scene.scale.width;
    const h = scene.scale.height;

    this.texts = {
      stage: scene.add.text(pad, pad, '', { fontSize: '18px', color: HUD_COLOR }),
      ship: scene.add.text(pad, pad + 26, '', { fontSize: '16px', color: DIM_COLOR }),
      lives: scene.add.text(pad, pad + 52, '', { fontSize: '18px', color: HUD_COLOR }),
      bombs: scene.add.text(pad, pad + 78, '', { fontSize: '18px', color: HUD_COLOR }),
      charge: scene.add.text(pad, pad + 104, '', { fontSize: '18px', color: HUD_COLOR }),
      score: scene.add.text(w - pad, pad, '', { fontSize: '20px', color: HUD_COLOR }).setOrigin(1, 0),
    };

    const by = h - 28;
    const cx = w / 2;
    const bg = scene.add
      .rectangle(cx, by, BOSS_BAR_W, BOSS_BAR_H, 0x152535, 0.94)
      .setStrokeStyle(2, 0x6a8daf, 0.95)
      .setDepth(130);
    const fill = scene.add
      .rectangle(cx - BOSS_BAR_W / 2 + BOSS_FILL_INSET, by, BOSS_BAR_W - BOSS_FILL_INSET * 2, BOSS_BAR_H - 4, 0xff7a6a)
      .setOrigin(0, 0.5)
      .setDepth(131);
    const name = scene.add
      .text(cx, by - 18, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#ffccaa',
      })
      .setOrigin(0.5)
      .setDepth(132);
    const phase = scene.add
      .text(cx, by + 16, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#9ec8e8',
      })
      .setOrigin(0.5)
      .setDepth(132);

    this.bossBar = { bg, fill, name, phase };
    this.setBossBar(false, '', 0, 1, 0);
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

  setBossBar(show: boolean, displayName: string, hp: number, maxHp: number, phaseIdx: number): void {
    const { bg, fill, name, phase } = this.bossBar;
    bg.setVisible(show);
    fill.setVisible(show);
    name.setVisible(show);
    phase.setVisible(show);
    if (!show) return;

    const frac = Phaser.Math.Clamp(hp / Math.max(1, maxHp), 0, 1);
    const innerW = BOSS_BAR_W - BOSS_FILL_INSET * 2;
    fill.width = Math.max(2, innerW * frac);

    const colors = [0xff7a6a, 0xffb347, 0xff4d6a] as const;
    fill.setFillStyle(colors[Math.min(phaseIdx, 2)] ?? 0xff7a6a);

    name.setText(displayName);
    phase.setText(`Phase ${phaseIdx + 1}/3`);
  }

  destroy(): void {
    Object.values(this.texts).forEach((t) => t.destroy());
    this.bossBar.bg.destroy();
    this.bossBar.fill.destroy();
    this.bossBar.name.destroy();
    this.bossBar.phase.destroy();
  }
}
