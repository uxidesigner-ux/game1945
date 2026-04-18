import Phaser from 'phaser';
import { ensureAudioUnlocked, SFX } from '../audio/proceduralSfx';
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

    void SFX.stageClear();

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

    const autoContinueSec = 5;
    let autoSecondsLeft = autoContinueSec;
    const autoLine = this.add
      .text(width / 2, height * 0.635, `Next stage in ${autoSecondsLeft}s (ENTER / SPACE / NEXT to skip)`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#9ec8e8',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.68, 'T — title · tap buttons', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);

    let autoTimer: Phaser.Time.TimerEvent | undefined;
    let tickTimer: Phaser.Time.TimerEvent | undefined;
    let navigated = false;

    const cancelAutoContinue = (): void => {
      tickTimer?.destroy();
      tickTimer = undefined;
      autoTimer?.destroy();
      autoTimer = undefined;
      autoLine.setVisible(false);
    };

    const goNext = (): void => {
      if (navigated) return;
      navigated = true;
      cancelAutoContinue();
      void ensureAudioUnlocked();
      runState.currentStageIndex += 1;
      if (runState.currentStageIndex > 2) {
        this.scene.start(SceneKeys.MVPClear);
      } else {
        this.scene.start(SceneKeys.Game);
      }
    };

    const goTitle = (): void => {
      if (navigated) return;
      navigated = true;
      cancelAutoContinue();
      void ensureAudioUnlocked();
      this.scene.start(SceneKeys.Title);
    };

    autoTimer = this.time.delayedCall(autoContinueSec * 1000, goNext);

    // repeat = (n - 2): n−1 ticks ending at "1s" before delayedCall fires (avoids racing the last tick at t=n).
    const tickRepeats = Math.max(0, autoContinueSec - 2);
    if (tickRepeats > 0) {
      tickTimer = this.time.addEvent({
        delay: 1000,
        repeat: tickRepeats,
        callback: () => {
          autoSecondsLeft -= 1;
          if (autoSecondsLeft >= 1) {
            autoLine.setText(`Next stage in ${autoSecondsLeft}s (ENTER / SPACE / NEXT to skip)`);
          }
        },
      });
    }

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

    const wireNext = (): void => {
      goNext();
    };
    const wireTitle = (): void => {
      goTitle();
    };
    nextBg.on('pointerdown', wireNext);
    nextTxt.on('pointerdown', wireNext);
    titleBg.on('pointerdown', wireTitle);
    titleTxt.on('pointerdown', wireTitle);

    let enterKey: Phaser.Input.Keyboard.Key | undefined;
    let spaceKey: Phaser.Input.Keyboard.Key | undefined;
    let tKey: Phaser.Input.Keyboard.Key | undefined;
    const kb = this.input.keyboard;
    if (kb) {
      enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      tKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      enterKey.once('down', goNext);
      spaceKey.once('down', goNext);
      tKey.once('down', goTitle);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cancelAutoContinue();
      enterKey?.destroy();
      spaceKey?.destroy();
      tKey?.destroy();
    });
  }
}
