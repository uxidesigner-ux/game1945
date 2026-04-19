import Phaser from 'phaser';
import { ensureAudioUnlocked, SFX } from '../audio/proceduralSfx';
import { formatTimeMs } from '../core/formatTime';
import { loadHighScore, recordHighScoreIfBest } from '../core/highScore';
import { submitRunToLeaderboard } from '../core/leaderboard';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class MVPClearScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MVPClear);
  }

  create(): void {
    const { width, height } = this.scale;

    const prevBest = loadHighScore();
    recordHighScoreIfBest(runState.score);
    submitRunToLeaderboard(runState.score, runState.difficulty, runState.currentStageIndex - 1);
    const newRecord = runState.score > prevBest;

    void SFX.demoClear();

    this.add
      .text(width / 2, height * 0.28, 'ALL CLEAR!!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        color: '#ffd700',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, 'All 5 stages cleared. Mission complete!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#e8f4ff',
        align: 'center',
        wordWrap: { width: width * 0.85 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.48, `Final score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5);

    if (newRecord) {
      this.add
        .text(width / 2, height * 0.54, 'New best score!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffd27f',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.6, `Total run ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.66, 'ENTER — title · R — ship select · tap buttons', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#7aa6c8',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);

    const toTitle = (): void => {
      this.scene.start(SceneKeys.Title);
    };
    const toSelect = (): void => {
      this.scene.start(SceneKeys.ShipSelect);
    };

    const btnY = height * 0.8;
    const bw = 188;
    const bh = 50;
    const titleBg = this.add
      .rectangle(width * 0.3, btnY, bw, bh, 0x1a2838, 0.88)
      .setStrokeStyle(2, 0x5c7a92, 0.95)
      .setInteractive({ useHandCursor: true });
    const titleTxt = this.add
      .text(width * 0.3, btnY, 'TITLE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const runBg = this.add
      .rectangle(width * 0.7, btnY, bw, bh, 0x1a2838, 0.88)
      .setStrokeStyle(2, 0x5c7a92, 0.95)
      .setInteractive({ useHandCursor: true });
    const runTxt = this.add
      .text(width * 0.7, btnY, 'NEW RUN', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const wire = (fn: () => void): void => {
      void ensureAudioUnlocked();
      fn();
    };
    titleBg.on('pointerdown', () => wire(toTitle));
    titleTxt.on('pointerdown', () => wire(toTitle));
    runBg.on('pointerdown', () => wire(toSelect));
    runTxt.on('pointerdown', () => wire(toSelect));

    this.input.keyboard?.once('keydown-ENTER', () => {
      void ensureAudioUnlocked();
      toTitle();
    });
    this.input.keyboard?.once('keydown-R', () => {
      void ensureAudioUnlocked();
      toSelect();
    });
  }
}
