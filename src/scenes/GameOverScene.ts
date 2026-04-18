import Phaser from 'phaser';
import { ensureAudioUnlocked } from '../audio/proceduralSfx';
import { formatTimeMs } from '../core/formatTime';
import { loadHighScore, recordHighScoreIfBest } from '../core/highScore';
import { runState } from '../core/RunState';
import { getStageByIndex } from '../data/stages';
import { SceneKeys } from './sceneKeys';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(): void {
    const { width, height } = this.scale;
    const stage = getStageByIndex(runState.currentStageIndex);

    const prevBest = loadHighScore();
    recordHighScoreIfBest(runState.score);
    const newRecord = runState.score > prevBest;

    this.add
      .text(width / 2, height * 0.34, 'GAME OVER', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        color: '#ff8a8a',
      })
      .setOrigin(0.5);

    if (stage) {
      this.add
        .text(width / 2, height * 0.44, stage.displayName, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#8fb8d9',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.5, `Score ${runState.score.toLocaleString()}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5);

    if (newRecord) {
      this.add
        .text(width / 2, height * 0.56, 'New best score!', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffd27f',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.62, `This stage ${formatTimeMs(runState.stageElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.69, `Run time ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.78, 'ENTER / T / tap — title', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#5c7a92',
      })
      .setOrigin(0.5);

    const goTitle = (): void => {
      this.scene.start(SceneKeys.Title);
    };
    this.input.keyboard?.once('keydown-ENTER', () => {
      void ensureAudioUnlocked();
      goTitle();
    });
    this.input.keyboard?.once('keydown-T', () => {
      void ensureAudioUnlocked();
      goTitle();
    });
    this.input.once('pointerdown', () => {
      void ensureAudioUnlocked();
      goTitle();
    });
  }
}
