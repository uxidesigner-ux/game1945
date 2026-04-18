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
      .text(width / 2, height * 0.3, 'DEMO COMPLETE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        color: '#ffd27f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.4, 'All demo stages cleared. Thanks for playing.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#e8f4ff',
        align: 'center',
        wordWrap: { width: width * 0.85 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5, `Final score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.58, `Total run ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.7, 'ENTER — title · R — new run (ship select)', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
        align: 'center',
        wordWrap: { width: width * 0.88 },
      })
      .setOrigin(0.5);

    const toTitle = (): void => {
      this.scene.start(SceneKeys.Title);
    };
    const toSelect = (): void => {
      this.scene.start(SceneKeys.ShipSelect);
    };
    this.input.keyboard?.once('keydown-ENTER', toTitle);
    this.input.keyboard?.once('keydown-R', toSelect);
  }
}
