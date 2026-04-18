import Phaser from 'phaser';
import { runState } from '../core/RunState';
import { getStageByIndex } from '../data/stages';
import { HUD } from '../ui/HUD';
import { SceneKeys } from './sceneKeys';

/**
 * Playfield placeholder (step 0–1). Combat and waves land here next.
 * Debug routing: R result, G game over, M MVP clear, T title.
 */
export class GameScene extends Phaser.Scene {
  private hud?: HUD;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1520, 1);

    const stage = getStageByIndex(runState.currentStageIndex);
    this.add
      .text(width / 2, height * 0.42, stage?.displayName ?? 'STAGE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.5,
        'MVP scaffold — gameplay in next step\n\nDebug: R Result · G Game Over · M MVP Clear · T Title',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#5c7a92',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    this.hud = new HUD(this);
    this.hud.sync(runState);

    const kb = this.input.keyboard;
    kb?.on('keydown-R', () => this.scene.start(SceneKeys.Result));
    kb?.on('keydown-G', () => this.scene.start(SceneKeys.GameOver));
    kb?.on('keydown-M', () => this.scene.start(SceneKeys.MVPClear));
    kb?.on('keydown-T', () => this.scene.start(SceneKeys.Title));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-R');
      kb?.off('keydown-G');
      kb?.off('keydown-M');
      kb?.off('keydown-T');
      this.hud?.destroy();
      this.hud = undefined;
    });
  }

  update(): void {
    this.hud?.sync(runState);
  }
}
