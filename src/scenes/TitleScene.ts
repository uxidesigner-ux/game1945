import Phaser from 'phaser';
import { runState } from '../core/RunState';
import {
  difficultyDisplay,
  loadDifficultyFromStorage,
  persistDifficultyToStorage,
} from '../data/difficulty';
import { SceneKeys } from './sceneKeys';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  create(): void {
    const { width, height } = this.scale;

    runState.difficulty = loadDifficultyFromStorage();

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
      .text(width / 2, height * 0.52, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffd27f',
        align: 'center',
      })
      .setOrigin(0.5);

    const refreshHint = (): void => {
      const d = difficultyDisplay[runState.difficulty];
      hint.setText(`Press ENTER — Ship select\nH — Difficulty: ${d}`);
    };
    refreshHint();

    this.tweens.add({
      targets: hint,
      alpha: 0.45,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const kb = this.input.keyboard;
    const onDifficulty = (): void => {
      runState.difficulty = runState.difficulty === 'normal' ? 'hard' : 'normal';
      persistDifficultyToStorage(runState.difficulty);
      refreshHint();
    };
    kb?.on('keydown-H', onDifficulty);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-H', onDifficulty);
    });

    kb?.once('keydown-ENTER', () => {
      this.scene.start(SceneKeys.ShipSelect);
    });
  }
}
