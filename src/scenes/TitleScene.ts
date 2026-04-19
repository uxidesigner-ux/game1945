import Phaser from 'phaser';
import { ensureAudioUnlocked } from '../audio/proceduralSfx';
import { loadHighScore } from '../core/highScore';
import { formatLeaderboardRow, loadLeaderboard } from '../core/leaderboard';
import { prefersReducedMotion } from '../core/motionPreference';
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
      .text(width / 2, height * 0.38, 'Vertical action  ·  5 Stages  ·  5 Bosses', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    const best = loadHighScore();
    this.add
      .text(width / 2, height * 0.44, `Best score ${best.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffd27f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.49, '— TOP RUNS  (this device) —', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#4a6a8a',
      })
      .setOrigin(0.5);

    const board = loadLeaderboard();
    const boardBody =
      board.length === 0
        ? 'No ranked runs yet.\nPlay and reach game over or ALL CLEAR!'
        : board.map((e, i) => `${i + 1}.  ${formatLeaderboardRow(e)}`).join('\n');
    this.add
      .text(width / 2, height * 0.515, boardBody, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#7aa6c8',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: width * 0.88 },
      })
      .setOrigin(0.5, 0);

    const hint = this.add
      .text(width / 2, height * 0.76, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffd27f',
        align: 'center',
      })
      .setOrigin(0.5);

    const refreshHint = (): void => {
      const d = difficultyDisplay[runState.difficulty];
      hint.setText(`ENTER or tap — Ship select\nH — Difficulty: ${d}`);
    };
    refreshHint();

    if (prefersReducedMotion()) {
      hint.setAlpha(0.92);
    } else {
      this.tweens.add({
        targets: hint,
        alpha: 0.45,
        duration: 700,
        yoyo: true,
        repeat: -1,
      });
    }

    this.add
      .text(width / 2, height * 0.94, `v${__APP_VERSION__}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#4a6078',
      })
      .setOrigin(0.5);

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

    const goShipSelect = (): void => {
      this.scene.start(SceneKeys.ShipSelect);
    };
    kb?.once('keydown-ENTER', () => {
      void ensureAudioUnlocked();
      goShipSelect();
    });
    this.input.once('pointerdown', () => {
      this.game.canvas?.focus();
      void ensureAudioUnlocked();
      goShipSelect();
    });
  }
}
