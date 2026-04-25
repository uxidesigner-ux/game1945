import Phaser from 'phaser';
import { ensureAudioUnlocked, SFX } from '../audio/proceduralSfx';
import { formatTimeMs } from '../core/formatTime';
import { loadHighScore, recordHighScoreIfBest } from '../core/highScore';
import { runState } from '../core/RunState';
import { clearRunCheckpoint, writeRunSnapshot } from '../core/runCheckpoint';
import { startSceneAfterFrame } from '../core/sceneTransition';
import { SceneKeys } from './sceneKeys';

function safeRemoveTimer(t: Phaser.Time.TimerEvent | undefined): void {
  if (!t) return;
  try {
    t.destroy();
  } catch {
    /* already removed */
  }
}

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

    // Show inter-stage rewards if not last stage
    if (runState.currentStageIndex < 5) {
      const bonusParts: string[] = ['+1 BOMB'];
      if (runState.currentStageIndex === 3 || runState.currentStageIndex === 5) {
        bonusParts.push('+1 LIFE');
      }
      this.add
        .text(width / 2, height * 0.675, `BONUS  ${bonusParts.join('  ')}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#a8e6a3',
        })
        .setOrigin(0.5);
    }

    const autoContinueSec = 5;
    let autoSecondsLeft = autoContinueSec;
    const autoLine = this.add
      .text(width / 2, height * 0.725, `Next stage in ${autoSecondsLeft}s (ENTER / SPACE to continue)`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#9ec8e8',
        align: 'center',
        wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.77, 'T — title (abandons run) · tap buttons', {
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

    const cancelTimers = (): void => {
      safeRemoveTimer(tickTimer);
      tickTimer = undefined;
      safeRemoveTimer(autoTimer);
      autoTimer = undefined;
      autoLine.setVisible(false);
    };

    const advanceToNextStage = (): void => {
      if (navigated) return;
      navigated = true;
      cancelTimers();
      void ensureAudioUnlocked();
      // Inter-stage rewards
      runState.bombs = Math.min(3, runState.bombs + 1);
      if (runState.currentStageIndex === 3 || runState.currentStageIndex === 5) {
        runState.lives = Math.min(5, runState.lives + 1);
      }
      runState.currentStageIndex += 1;
      const nextKey = runState.currentStageIndex > 5 ? SceneKeys.MVPClear : SceneKeys.Game;
      if (nextKey === SceneKeys.Game) {
        writeRunSnapshot(runState.toSnapshot());
      } else {
        clearRunCheckpoint();
      }
      startSceneAfterFrame(this, nextKey);
    };

    const goTitle = (): void => {
      if (navigated) return;
      navigated = true;
      cancelTimers();
      void ensureAudioUnlocked();
      clearRunCheckpoint();
      startSceneAfterFrame(this, SceneKeys.Title);
    };

    autoTimer = this.time.delayedCall(autoContinueSec * 1000, advanceToNextStage);

    const tickRepeats = Math.max(0, autoContinueSec - 2);
    if (tickRepeats > 0) {
      tickTimer = this.time.addEvent({
        delay: 1000,
        repeat: tickRepeats,
        callback: () => {
          autoSecondsLeft -= 1;
          if (autoSecondsLeft >= 1) {
            autoLine.setText(`Next stage in ${autoSecondsLeft}s (ENTER / SPACE to continue)`);
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
      .text(width * 0.3, btnY, 'CONTINUE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
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

    nextBg.on('pointerdown', advanceToNextStage);
    nextTxt.on('pointerdown', advanceToNextStage);
    titleBg.on('pointerdown', goTitle);
    titleTxt.on('pointerdown', goTitle);

    let enterKey: Phaser.Input.Keyboard.Key | undefined;
    let spaceKey: Phaser.Input.Keyboard.Key | undefined;
    let tKey: Phaser.Input.Keyboard.Key | undefined;
    const kb = this.input.keyboard;
    if (kb) {
      enterKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      tKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      enterKey.once('down', advanceToNextStage);
      spaceKey.once('down', advanceToNextStage);
      tKey.once('down', goTitle);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      safeRemoveTimer(tickTimer);
      tickTimer = undefined;
      safeRemoveTimer(autoTimer);
      autoTimer = undefined;
      enterKey?.destroy();
      spaceKey?.destroy();
      tKey?.destroy();
    });
  }
}
