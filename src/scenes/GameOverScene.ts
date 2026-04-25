import Phaser from 'phaser';
import { ensureAudioUnlocked, SFX } from '../audio/proceduralSfx';
import { formatTimeMs } from '../core/formatTime';
import { loadHighScore, recordHighScoreIfBest } from '../core/highScore';
import {
  formatLeaderboardRow,
  submitRunToLeaderboard,
} from '../core/leaderboard';
import { runState } from '../core/RunState';
import { clearRunCheckpoint, writeRunSnapshot } from '../core/runCheckpoint';
import { startSceneAfterFrame } from '../core/sceneTransition';
import { getStageByIndex } from '../data/stages';
import { SceneKeys } from './sceneKeys';

const FONT = 'system-ui, sans-serif';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.GameOver);
  }

  create(): void {
    const { width, height } = this.scale;
    const stage = getStageByIndex(runState.currentStageIndex);

    const prevBest = loadHighScore();
    recordHighScoreIfBest(runState.score);
    const { board, rank } = submitRunToLeaderboard(
      runState.score,
      runState.difficulty,
      runState.currentStageIndex,
    );
    const newRecord = runState.score > prevBest;

    void SFX.gameOver();

    // ── Background ──────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x08111a, 1).setDepth(0);

    // ── GAME OVER title ─────────────────────────────────────────────────────
    this.add
      .text(width / 2, height * 0.10, 'GAME OVER', {
        fontFamily: FONT, fontSize: '40px', color: '#ff6b6b',
      })
      .setOrigin(0.5);

    // ── Stage + Score ────────────────────────────────────────────────────────
    if (stage) {
      this.add
        .text(width / 2, height * 0.19, stage.displayName, {
          fontFamily: FONT, fontSize: '17px', color: '#7aa6c8',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.25, `Score  ${runState.score.toLocaleString()}`, {
        fontFamily: FONT, fontSize: '24px', color: '#e8f4ff',
      })
      .setOrigin(0.5);

    // ── Rank / Record badge ──────────────────────────────────────────────────
    const badgeColor = newRecord ? '#ffd700' : '#a8d8a8';
    let badgeText = '';
    if (newRecord) {
      badgeText = rank !== null ? `★ NEW RECORD — Ranked #${rank}!` : '★ NEW RECORD!';
    } else if (rank !== null) {
      badgeText = `Ranked  #${rank}  on this device`;
    }
    if (badgeText) {
      this.add
        .text(width / 2, height * 0.31, badgeText, {
          fontFamily: FONT, fontSize: '17px', color: badgeColor,
        })
        .setOrigin(0.5);
    }

    // ── Run time ─────────────────────────────────────────────────────────────
    this.add
      .text(width / 2, height * 0.36, `Run time  ${formatTimeMs(runState.runElapsedMs)}`, {
        fontFamily: FONT, fontSize: '15px', color: '#5c7a92',
      })
      .setOrigin(0.5);

    // ── Leaderboard panel ────────────────────────────────────────────────────
    this.add
      .text(width / 2, height * 0.42, '— TOP RUNS —', {
        fontFamily: FONT, fontSize: '13px', color: '#4a6a8a',
      })
      .setOrigin(0.5);

    const rows = board.slice(0, 7);
    rows.forEach((entry, i) => {
      const isThisRun = rank !== null && i + 1 === rank && entry.score === runState.score;
      const color = isThisRun ? '#ffd700' : '#6a9abf';
      const prefix = isThisRun ? `▶ ${i + 1}.` : `${i + 1}.`;
      this.add
        .text(width / 2, height * 0.455 + i * height * 0.048, `${prefix}  ${formatLeaderboardRow(entry)}`, {
          fontFamily: FONT,
          fontSize: '13px',
          color,
        })
        .setOrigin(0.5);
    });

    // ── 3 Action buttons ─────────────────────────────────────────────────────
    const btnY = height * 0.875;
    const bw = 158;
    const bh = 52;
    const gap = (width - bw * 3) / 4;

    const makeBtn = (label: string, x: number, accent: number, onPress: () => void): void => {
      const bg = this.add
        .rectangle(x, btnY, bw, bh, 0x0e1e2e, 0.95)
        .setStrokeStyle(2, accent, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);
      const txt = this.add
        .text(x, btnY, label, {
          fontFamily: FONT, fontSize: '18px', color: '#cfe9ff',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(11);
      const fire = (): void => { void ensureAudioUnlocked(); onPress(); };
      bg.on('pointerdown', fire);
      txt.on('pointerdown', fire);
      bg.on('pointerover', () => bg.setFillStyle(accent, 0.18));
      bg.on('pointerout', () => bg.setFillStyle(0x0e1e2e, 0.95));
    };

    const x1 = gap + bw / 2;
    const x2 = gap * 2 + bw * 1.5;
    const x3 = gap * 3 + bw * 2.5;

    makeBtn('CONTINUE', x1, 0x44aa66, () => this.doContinue());
    makeBtn('RETRY', x2, 0x5588cc, () => this.doRetry());
    makeBtn('LOBBY', x3, 0x887755, () => this.doLobby());

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    this.add
      .text(width / 2, height * 0.936, 'C — continue  ·  R — retry  ·  T — lobby', {
        fontFamily: FONT, fontSize: '13px', color: '#3a5068',
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    kb?.once('keydown-C', () => { void ensureAudioUnlocked(); this.doContinue(); });
    kb?.once('keydown-R', () => { void ensureAudioUnlocked(); this.doRetry(); });
    kb?.once('keydown-T', () => { void ensureAudioUnlocked(); this.doLobby(); });
    kb?.once('keydown-ENTER', () => { void ensureAudioUnlocked(); this.doContinue(); });
  }

  private doContinue(): void {
    // Resume same stage: restore lives & bombs, keep score/power/stage
    runState.lives = 2;
    runState.bombs = 2;
    writeRunSnapshot(runState.toSnapshot());
    startSceneAfterFrame(this, SceneKeys.Game);
  }

  private doRetry(): void {
    runState.resetForNewRun(runState.selectedShipId);
    startSceneAfterFrame(this, SceneKeys.ShipSelect);
  }

  private doLobby(): void {
    clearRunCheckpoint();
    startSceneAfterFrame(this, SceneKeys.Title);
  }
}
