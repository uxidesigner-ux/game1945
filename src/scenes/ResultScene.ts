import Phaser from 'phaser';
import { ensureAudioUnlocked } from '../audio/proceduralSfx';
import { formatTimeMs } from '../core/formatTime';
import { loadHighScore, recordHighScoreIfBest } from '../core/highScore';
import { runState } from '../core/RunState';
import { SceneKeys } from './sceneKeys';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Result);
  }

  create(): void {
    const { width, height } = this.scale;

    const prevBest = loadHighScore();
    recordHighScoreIfBest(runState.score);
    const newRecord = runState.score > prevBest;

    this.add
      .text(width / 2, height * 0.32, 'STAGE CLEAR', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
        color: '#a8e6a3',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.42, `Score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    if (newRecord) {
      this.add
        .text(width / 2, height * 0.48, 'New best score!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffd27f',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.55, `Stage time ${formatTimeMs(runState.stageElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#8fb8d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.61, `Run time ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.68, 'ENTER — next · T — title · tap buttons', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);

    const goNext = (): void => {
      runState.currentStageIndex += 1;
      if (runState.currentStageIndex > 2) {
        this.scene.start(SceneKeys.MVPClear);
      } else {
        this.scene.start(SceneKeys.Game);
      }
    };

    const goTitle = (): void => {
      this.scene.start(SceneKeys.Title);
    };

    const btnY = height * 0.8;
    const bw = 168;
    const bh = 50;
    const nextBg = this.add
      .rectangle(width * 0.3, btnY, bw, bh, 0x1a2838, 0.88)
      .setStrokeStyle(2, 0x5c7a92, 0.95)
      .setInteractive({ useHandCursor: true });
    const nextTxt = this.add
      .text(width * 0.3, btnY, 'NEXT', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const titleBg = this.add
      .rectangle(width * 0.7, btnY, bw, bh, 0x1a2838, 0.88)
      .setStrokeStyle(2, 0x5c7a92, 0.95)
      .setInteractive({ useHandCursor: true });
    const titleTxt = this.add
      .text(width * 0.7, btnY, 'TITLE', {
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
    nextBg.on('pointerdown', () => wire(goNext));
    nextTxt.on('pointerdown', () => wire(goNext));
    titleBg.on('pointerdown', () => wire(goTitle));
    titleTxt.on('pointerdown', () => wire(goTitle));

    this.input.keyboard?.once('keydown-ENTER', () => {
      void ensureAudioUnlocked();
      goNext();
    });

    this.input.keyboard?.once('keydown-T', () => {
      void ensureAudioUnlocked();
      goTitle();
    });
  }
}
