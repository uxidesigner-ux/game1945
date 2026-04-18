import Phaser from 'phaser';
import {
  ensureAudioUnlocked,
  isSfxMuted,
  loadSfxPreferenceFromStorage,
  persistSfxPreferenceToStorage,
  SFX,
  toggleSfxMuted,
} from '../audio/proceduralSfx';
import { TextureKeys } from '../core/textureKeys';
import { runState } from '../core/RunState';
import { enemyGunnerByType, waveEnemySpawnByType } from '../data/enemies';
import { bossPhaseIndex, getBossDefinition, type BossDefinition } from '../data/bosses';
import { PickupKind, PICKUP_CHANCE_ENERGY_CORE, PICKUP_CHANCE_POWER } from '../data/pickups';
import { energyCoreScoreAt, SCORE_GRUNT_KILL } from '../data/scoring';
import { getShipCombat } from '../data/ships/combatStats';
import type { PrimaryPattern } from '../data/ships/combatStats';
import { resolvePrimaryStats, type ResolvedPrimary } from '../data/ships/powerLevel';
import { OrdnanceKind, specialWeaponStats } from '../data/ships/specialWeapons';
import type { ShipId } from '../data/ships/types';
import { prefersReducedMotion } from '../core/motionPreference';
import { difficultyTuning } from '../data/difficulty';
import { getStageByIndex } from '../data/stages';
import { getWaveScript } from '../data/waves';
import type { WaveEnemyType } from '../data/waves/types';
import { PlayerShip } from '../entities/PlayerShip';
import { steerHomingMissile } from '../systems/homingMissile';
import { WaveDirector } from '../systems/WaveDirector';
import { HUD } from '../ui/HUD';
import { SceneKeys } from './sceneKeys';

export class GameScene extends Phaser.Scene {
  private hud?: HUD;
  private player?: PlayerShip;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private waveDirector!: WaveDirector;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private keyX?: Phaser.Input.Keyboard.Key;
  private keyB?: Phaser.Input.Keyboard.Key;
  private chargeWasHeld = false;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private lastFireTime = -99999;
  private enemiesAlive = 0;
  private waveHint?: Phaser.GameObjects.Text;

  private bossDef?: BossDefinition;
  private bossSprite?: Phaser.Physics.Arcade.Sprite;
  private bossHp = 0;
  private bossPbOverlap?: Phaser.Physics.Arcade.Collider;
  private bossPlOverlap?: Phaser.Physics.Arcade.Collider;
  private bossNextAimed = 0;
  private bossNextBurst = 0;
  private bossFirePhase: number | null = null;
  /** Ensures a single boss spawn per GameScene after the wave script finishes. */
  private bossRoundScheduled = false;

  private paused = false;
  private pauseBg?: Phaser.GameObjects.Rectangle;
  private pauseTxt?: Phaser.GameObjects.Text;
  private pauseResumeBg?: Phaser.GameObjects.Rectangle;
  private pauseResumeLbl?: Phaser.GameObjects.Text;
  private keyP?: Phaser.Input.Keyboard.Key;
  private keyV?: Phaser.Input.Keyboard.Key;
  private diffTune = difficultyTuning(runState.difficulty);

  /** First finger on playfield (touch only); second finger ignored until release. */
  private touchSteerPointerId: number | null = null;
  private touchTargetX = 0;
  private touchTargetY = 0;
  private bombUiBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private chargeUiBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private pauseUiBounds = new Phaser.Geom.Rectangle(0, 0, 0, 0);
  private uiChargeHeld = false;
  private uiBombQueued = false;
  private mobileUiDestroyables: Phaser.GameObjects.GameObject[] = [];

  private readonly onPointerDownGame = (pointer: Phaser.Input.Pointer): void => {
    this.game.canvas?.focus();
    void ensureAudioUnlocked();
    pointer.updateWorldPoint(this.cameras.main);
    if (!pointer.wasTouch) return;
    if (this.pointHitsMobileChrome(pointer.worldX, pointer.worldY)) return;
    if (this.touchSteerPointerId !== null) return;
    this.touchSteerPointerId = pointer.id;
    this.touchTargetX = pointer.worldX;
    this.touchTargetY = pointer.worldY;
  };

  private readonly onPointerMoveGame = (pointer: Phaser.Input.Pointer): void => {
    if (this.touchSteerPointerId !== pointer.id || !pointer.isDown) return;
    pointer.updateWorldPoint(this.cameras.main);
    if (this.pointHitsMobileChrome(pointer.worldX, pointer.worldY)) return;
    this.touchTargetX = pointer.worldX;
    this.touchTargetY = pointer.worldY;
  };

  private readonly onPointerUpGame = (pointer: Phaser.Input.Pointer): void => {
    if (this.touchSteerPointerId === pointer.id) {
      this.touchSteerPointerId = null;
    }
  };

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    loadSfxPreferenceFromStorage();
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1520, 1).setDepth(0);

    const stage = getStageByIndex(runState.currentStageIndex);
    this.diffTune = difficultyTuning(runState.difficulty);
    this.waveDirector = new WaveDirector(
      getWaveScript(stage?.waveScriptId ?? 'stage1_waves'),
      this.diffTune.waveTimingMul,
    );

    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 500,
      runChildUpdate: false,
    });
    this.enemyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 400,
      runChildUpdate: false,
    });
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 240,
      runChildUpdate: false,
    });
    this.pickups = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 80,
      runChildUpdate: false,
    });

    this.player = new PlayerShip(this, width / 2, height * 0.82, TextureKeys.Player);

    this.cursors = this.input.keyboard?.createCursorKeys();
    const kb = this.input.keyboard;
    if (!kb) {
      throw new Error('Keyboard plugin required');
    }
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyB = kb.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.keyP = kb.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyV = kb.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    kb.once('keydown', () => {
      this.game.canvas?.focus();
      void ensureAudioUnlocked();
    });

    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      (a, b) => {
        this.onBulletHitEnemy(a as Phaser.Physics.Arcade.Sprite, b as Phaser.Physics.Arcade.Sprite);
      },
    );

    this.physics.add.overlap(this.player.sprite, this.enemies, (playerObj, enemyObj) => {
      void playerObj;
      this.onPlayerRamEnemy(enemyObj as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.player.sprite, this.enemyBullets, (_p, bulletObj) => {
      this.onEnemyBulletHitPlayer(bulletObj as Phaser.Physics.Arcade.Sprite);
    });

    this.physics.add.overlap(this.player.sprite, this.pickups, (_p, pickupObj) => {
      this.onPickupCollected(pickupObj as Phaser.Physics.Arcade.Sprite);
    });

    this.hud = new HUD(this);
    this.hud.sync(runState, isSfxMuted());
    runState.stageElapsedMs = 0;

    this.waveHint = this.add
      .text(
        width / 2,
        height * 0.1,
        'Hostiles & boss — move · SPACE · X charge · B bomb · P / PAUSE btn · V SFX · touch: drag + auto fire',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#7aa6c8',
          align: 'center',
          wordWrap: { width: width * 0.92 },
        },
      )
      .setOrigin(0.5)
      .setDepth(120);

    this.setupMobileGameUi(width, height);

    this.input.on('pointerdown', this.onPointerDownGame);
    this.input.on('pointermove', this.onPointerMoveGame);
    this.input.on('pointerup', this.onPointerUpGame);

    kb.on('keydown-R', () => this.scene.start(SceneKeys.Result));
    kb.on('keydown-G', () => this.scene.start(SceneKeys.GameOver));
    kb.on('keydown-M', () => this.scene.start(SceneKeys.MVPClear));
    kb.on('keydown-T', () => this.scene.start(SceneKeys.Title));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.onPointerDownGame);
      this.input.off('pointermove', this.onPointerMoveGame);
      this.input.off('pointerup', this.onPointerUpGame);
      this.touchSteerPointerId = null;
      this.uiChargeHeld = false;
      this.uiBombQueued = false;
      for (const o of this.mobileUiDestroyables) {
        o.destroy();
      }
      this.mobileUiDestroyables = [];
      kb.off('keydown-R');
      kb.off('keydown-G');
      kb.off('keydown-M');
      kb.off('keydown-T');
      if (this.paused) {
        this.physics.resume();
        this.tweens.resumeAll();
      }
      this.hidePauseOverlay();
      this.playerBullets.clear(true, true);
      this.enemyBullets.clear(true, true);
      this.enemies.clear(true, true);
      this.pickups.clear(true, true);
      this.teardownBoss();
      this.player?.destroy();
      this.player = undefined;
      this.hud?.destroy();
      this.hud = undefined;
      this.waveHint?.destroy();
      this.waveHint = undefined;
    });
  }

  private pointHitsMobileChrome(wx: number, wy: number): boolean {
    return (
      Phaser.Geom.Rectangle.Contains(this.bombUiBounds, wx, wy) ||
      Phaser.Geom.Rectangle.Contains(this.chargeUiBounds, wx, wy) ||
      Phaser.Geom.Rectangle.Contains(this.pauseUiBounds, wx, wy)
    );
  }

  private ensureTouchSteerStillValid(): void {
    if (this.touchSteerPointerId === null) return;
    const ok = this.input.manager.pointers.some(
      (p) => p.id === this.touchSteerPointerId && p.isDown,
    );
    if (!ok) this.touchSteerPointerId = null;
  }

  private applyTouchSteer(
    deltaSeconds: number,
    moveSpeed: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ): void {
    const p = this.player?.sprite;
    if (!p) return;
    const dx = this.touchTargetX - p.x;
    const dy = this.touchTargetY - p.y;
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const step = Math.min(len, moveSpeed * deltaSeconds);
    const nx = dx / len;
    const ny = dy / len;
    p.x = Phaser.Math.Clamp(p.x + nx * step, bounds.minX, bounds.maxX);
    p.y = Phaser.Math.Clamp(p.y + ny * step, bounds.minY, bounds.maxY);
    p.setVelocity(0, 0);
  }

  private setupMobileGameUi(width: number, height: number): void {
    const touchDevice = this.sys.game.device.input.touch;
    const uiAlpha = touchDevice ? 0.74 : 0.36;
    const depth = 122;
    const bw = 112;
    const bh = 46;
    const y = height * 0.88;
    const chargeX = width * 0.19;
    const bombX = width * 0.81;

    this.chargeUiBounds.setTo(chargeX - bw / 2, y - bh / 2, bw, bh);
    this.bombUiBounds.setTo(bombX - bw / 2, y - bh / 2, bw, bh);

    const chargeBg = this.add
      .rectangle(chargeX, y, bw, bh, 0x1a2838, uiAlpha)
      .setStrokeStyle(2, 0x5c7a92, 0.92)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    const chargeLbl = this.add
      .text(chargeX, y, 'HOLD\nCHARGE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#cfe9ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    const bombBg = this.add
      .rectangle(bombX, y, bw, bh, 0x1a2838, uiAlpha)
      .setStrokeStyle(2, 0x5c7a92, 0.92)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    const bombLbl = this.add
      .text(bombX, y, 'BOMB', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.mobileUiDestroyables.push(chargeBg, chargeLbl, bombBg, bombLbl);

    chargeBg.on('pointerdown', () => {
      void ensureAudioUnlocked();
      this.uiChargeHeld = true;
    });
    chargeBg.on('pointerup', () => {
      this.uiChargeHeld = false;
    });
    chargeBg.on('pointerout', () => {
      this.uiChargeHeld = false;
    });

    bombBg.on('pointerdown', () => {
      void ensureAudioUnlocked();
      this.uiBombQueued = true;
    });

    const pauseW = 100;
    const pauseH = 40;
    const pauseX = width - 16 - pauseW / 2;
    const pauseY = 58;
    this.pauseUiBounds.setTo(pauseX - pauseW / 2, pauseY - pauseH / 2, pauseW, pauseH);

    const pauseBg = this.add
      .rectangle(pauseX, pauseY, pauseW, pauseH, 0x1a2838, uiAlpha)
      .setStrokeStyle(2, 0x5c7a92, 0.92)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    const pauseLbl = this.add
      .text(pauseX, pauseY, 'PAUSE', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#cfe9ff',
      })
      .setOrigin(0.5)
      .setDepth(depth + 1);

    this.mobileUiDestroyables.push(pauseBg, pauseLbl);

    const togglePause = (): void => {
      void ensureAudioUnlocked();
      this.setPaused(!this.paused);
    };
    pauseBg.on('pointerdown', togglePause);
    pauseLbl.setInteractive({ useHandCursor: true });
    pauseLbl.on('pointerdown', togglePause);
  }

  private teardownBoss(): void {
    this.hud?.setBossBar(false, '', 0, 1, 0);
    this.bossPbOverlap?.destroy();
    this.bossPlOverlap?.destroy();
    this.bossPbOverlap = undefined;
    this.bossPlOverlap = undefined;
    this.bossSprite?.destroy();
    this.bossSprite = undefined;
    this.bossDef = undefined;
    this.bossFirePhase = null;
  }

  private spawnBoss(def: BossDefinition): void {
    if (!this.player) return;
    this.teardownBoss();
    this.bossDef = def;
    this.bossHp = def.maxHp;
    const w = this.scale.width;
    const y = this.scale.height * def.enterYRatio;
    this.bossSprite = this.physics.add.sprite(w / 2, y, def.textureKey);
    this.bossSprite.setDepth(46);
    const bBody = this.bossSprite.body as Phaser.Physics.Arcade.Body;
    bBody.setAllowGravity(false);
    bBody.setSize(def.bodySize.w, def.bodySize.h);
    bBody.setOffset(def.bodyOffset.x, def.bodyOffset.y);

    const t = this.time.now;
    this.bossNextAimed = t + 700;
    this.bossNextBurst = t + 900;
    this.bossFirePhase = null;

    this.bossPbOverlap = this.physics.add.overlap(
      this.playerBullets,
      this.bossSprite,
      (bulletObj) => {
        this.onPlayerBulletHitBoss(bulletObj as Phaser.Physics.Arcade.Sprite);
      },
    );
    this.bossPlOverlap = this.physics.add.overlap(this.player.sprite, this.bossSprite, () => {
      this.onPlayerRamBoss();
    });

    this.waveHint?.setText(`Boss — ${def.displayName}`);
  }

  private onPlayerBulletHitBoss(bullet: Phaser.Physics.Arcade.Sprite): void {
    if (!bullet.active || !this.bossSprite?.active) return;
    bullet.destroy();
    this.applyBossDamage(1);
  }

  private applyPlayerHitFeedback(): void {
    void SFX.playerHurt();
    if (!this.paused && !prefersReducedMotion()) {
      this.cameras.main.shake(180, 0.0065);
    }
  }

  private onPlayerRamBoss(): void {
    const p = this.player;
    if (!p || !this.bossSprite?.active) return;
    if (!p.tryBeginHit(this.time.now)) return;
    this.applyPlayerHitFeedback();
    runState.lives -= 1;
    if (runState.lives <= 0) {
      this.scene.start(SceneKeys.GameOver);
    }
  }

  private applyBossDamage(n: number): void {
    if (!this.bossDef || !this.bossSprite?.active) return;
    this.bossHp -= n;
    if (this.bossHp <= 0) {
      this.destroyBossVictory();
    }
  }

  private destroyBossVictory(): void {
    if (!this.bossDef) return;
    const x = this.bossSprite?.x ?? 0;
    const y = this.bossSprite?.y ?? 0;
    runState.score += this.bossDef.scoreReward;
    this.rollPickupsOnKill(x, y);
    void SFX.bossDefeated();
    this.teardownBoss();
    this.scene.start(SceneKeys.Result);
  }

  private updateBoss(time: number): void {
    if (!this.bossDef || !this.bossSprite?.active) return;
    const def = this.bossDef;
    const w = this.scale.width;
    const margin = 80;
    let vx = this.bossSprite.getData('patrolVx') as number | undefined;
    if (vx === undefined) vx = def.patrolSpeed;
    if (this.bossSprite.x < margin) vx = Math.abs(def.patrolSpeed);
    if (this.bossSprite.x > w - margin) vx = -Math.abs(def.patrolSpeed);
    this.bossSprite.setData('patrolVx', vx);
    this.bossSprite.setVelocity(vx, 0);

    const ph = bossPhaseIndex(this.bossHp, def.maxHp);
    if (this.bossFirePhase !== ph) {
      const hadPhase = this.bossFirePhase !== null;
      this.bossFirePhase = ph;
      this.bossNextBurst = time + 450;
      if (hadPhase) {
        this.playBossPhaseShift(ph);
      }
    }

    const aimedMs = def.aimedIntervalMs[ph] * this.diffTune.bossIntervalMul;
    const burstMs = def.burstIntervalMs[ph] * this.diffTune.bossIntervalMul;
    const burstN = def.burstCount[ph];
    const burstSpread = def.burstSpreadDeg[ph];

    if (time >= this.bossNextAimed) {
      this.fireBossAimedShot();
      this.bossNextAimed = time + aimedMs;
    }

    if (burstMs > 0 && burstN > 0 && time >= this.bossNextBurst) {
      this.fireBossBurst(burstN, burstSpread);
      this.bossNextBurst = time + burstMs;
    }
  }

  private fireBossAimedShot(): void {
    if (!this.bossDef || !this.bossSprite?.active) return;
    const px = this.player?.sprite.x ?? this.bossSprite.x;
    const py = this.player?.sprite.y ?? this.scale.height;
    const cx = this.bossSprite.x;
    const cy = this.bossSprite.y + 24;
    const ang = Phaser.Math.Angle.Between(cx, cy, px, py);
    this.spawnEnemyBullet(cx, cy, ang, this.bossDef.aimedShotSpeed);
  }

  private fireBossBurst(count: number, spreadDeg: number): void {
    if (!this.bossDef || !this.bossSprite?.active) return;
    const cx = this.bossSprite.x;
    const cy = this.bossSprite.y + 30;
    const base = Math.PI / 2;
    const half = Phaser.Math.DegToRad(spreadDeg / 2);
    const stepRad = count > 1 ? Phaser.Math.DegToRad(spreadDeg / (count - 1)) : 0;
    const spd = this.bossDef.aimedShotSpeed * 0.9;
    for (let i = 0; i < count; i++) {
      const ang = base - half + i * stepRad;
      this.spawnEnemyBullet(cx, cy, ang, spd);
    }
  }

  private damageBossFromBomb(circles: ReadonlyArray<{ x: number; y: number; r: number }>): void {
    if (!this.bossDef || !this.bossSprite?.active) return;
    const bx = this.bossSprite.x;
    const by = this.bossSprite.y;
    const hitboxR = Math.max(this.bossDef.bodySize.w, this.bossDef.bodySize.h) * 0.55;
    for (const c of circles) {
      if (Phaser.Math.Distance.Between(bx, by, c.x, c.y) <= c.r + hitboxR) {
        this.applyBossDamage(this.bossDef.bombDamageChunk);
        break;
      }
    }
  }

  private playBossPhaseShift(phase: number): void {
    void phase;
    void SFX.bossPhase();
    if (!prefersReducedMotion()) {
      this.cameras.main.flash(160, 255, 210, 140);
    }
    const b = this.bossSprite;
    if (b?.active) {
      b.setTint(0xffc4a8);
      this.time.delayedCall(140, () => b.active && b.clearTint());
    }
  }

  private clearEnemyBullets(): void {
    this.enemyBullets.clear(true, true);
  }

  private showPauseOverlay(): void {
    if (this.pauseBg) return;
    const w = this.scale.width;
    const h = this.scale.height;
    this.pauseBg = this.add
      .rectangle(w / 2, h / 2, w, h, 0x05080c, 0.52)
      .setDepth(400)
      .setInteractive();
    this.pauseTxt = this.add
      .text(w / 2, h * 0.44, 'PAUSED\n\nP — resume · tap RESUME', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#e8f4ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(401);

    const resumeY = h * 0.62;
    this.pauseResumeBg = this.add
      .rectangle(w / 2, resumeY, 248, 56, 0x2a4a68, 0.96)
      .setStrokeStyle(2, 0x8ec8ff, 0.85)
      .setDepth(404)
      .setInteractive({ useHandCursor: true });
    this.pauseResumeLbl = this.add
      .text(w / 2, resumeY, 'RESUME', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#e8f4ff',
      })
      .setOrigin(0.5)
      .setDepth(405);

    const resume = (): void => {
      void ensureAudioUnlocked();
      this.setPaused(false);
    };
    this.pauseResumeBg.on('pointerdown', resume);
    this.pauseResumeLbl.setInteractive({ useHandCursor: true });
    this.pauseResumeLbl.on('pointerdown', resume);
  }

  private hidePauseOverlay(): void {
    this.pauseResumeBg?.destroy();
    this.pauseResumeLbl?.destroy();
    this.pauseResumeBg = undefined;
    this.pauseResumeLbl = undefined;
    this.pauseBg?.destroy();
    this.pauseTxt?.destroy();
    this.pauseBg = undefined;
    this.pauseTxt = undefined;
  }

  private setPaused(p: boolean): void {
    if (p === this.paused) return;
    this.paused = p;
    if (p) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.hidePauseOverlay();
    }
  }

  private rollPickupsOnKill(x: number, y: number): void {
    if (Math.random() < PICKUP_CHANCE_POWER) {
      this.spawnPickup(x, y, PickupKind.Power);
      return;
    }
    if (Math.random() < PICKUP_CHANCE_ENERGY_CORE) {
      this.spawnPickup(x, y, PickupKind.EnergyCore);
    }
  }

  private spawnPickup(x: number, y: number, kind: string): void {
    const tex = kind === PickupKind.Power ? TextureKeys.PickupPower : TextureKeys.PickupEnergy;
    const s = this.pickups.create(x, y, tex) as Phaser.Physics.Arcade.Sprite;
    s.setData('pickupKind', kind);
    s.setDepth(55);
    s.setVelocity(0, 52);
    const body = s.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(14, 14);
    body.setOffset(3, 3);
  }

  private onPickupCollected(pickup: Phaser.Physics.Arcade.Sprite): void {
    if (!pickup.active) return;
    const kind = pickup.getData('pickupKind') as string;
    pickup.destroy();
    if (kind === PickupKind.Power) {
      runState.powerLevel = Math.min(2, runState.powerLevel + 1);
      void SFX.pickupPower();
      return;
    }
    if (kind === PickupKind.EnergyCore) {
      runState.score += energyCoreScoreAt(runState.stageElapsedMs);
      void SFX.pickupCore();
    }
  }

  private onEnemyBulletHitPlayer(bullet: Phaser.Physics.Arcade.Sprite): void {
    const p = this.player;
    if (!p || !bullet.active) return;
    bullet.destroy();
    if (!p.tryBeginHit(this.time.now)) return;
    this.applyPlayerHitFeedback();
    runState.lives -= 1;
    if (runState.lives <= 0) {
      this.scene.start(SceneKeys.GameOver);
    }
  }

  private removeEnemy(enemy: Phaser.Physics.Arcade.Sprite, awardScore: boolean): void {
    if (!enemy.active) return;
    const { x, y } = enemy;
    if (awardScore) {
      runState.score += SCORE_GRUNT_KILL;
      this.rollPickupsOnKill(x, y);
    }
    enemy.destroy();
    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    this.tryCompleteWave();
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!bullet.active || !enemy.active) return;
    const kind = (bullet.getData('kind') as string | undefined) ?? OrdnanceKind.Primary;
    if (kind !== OrdnanceKind.Laser) {
      bullet.destroy();
    }
    this.removeEnemy(enemy, true);
  }

  private onPlayerRamEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const p = this.player;
    if (!p || !enemy.active) return;
    if (!p.tryBeginHit(this.time.now)) return;
    this.applyPlayerHitFeedback();
    this.removeEnemy(enemy, false);
    runState.lives -= 1;
    if (runState.lives <= 0) {
      this.scene.start(SceneKeys.GameOver);
      return;
    }
    this.tryCompleteWave();
  }

  private tryCompleteWave(): void {
    if (!this.waveDirector.doneSpawning || this.enemiesAlive > 0) return;

    if (this.bossSprite?.active) return;

    const stage = getStageByIndex(runState.currentStageIndex);
    const bossDef = getBossDefinition(stage?.bossId);

    if (bossDef && !this.bossRoundScheduled) {
      this.bossRoundScheduled = true;
      this.spawnBoss(bossDef);
      return;
    }

    this.scene.start(SceneKeys.Result);
  }

  update(_t: number, dt: number): void {
    if (this.keyP && Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.setPaused(!this.paused);
    }
    if (this.keyV && Phaser.Input.Keyboard.JustDown(this.keyV)) {
      const m = toggleSfxMuted();
      persistSfxPreferenceToStorage(m);
    }
    if (this.paused) {
      this.ensureTouchSteerStillValid();
      this.hud?.sync(runState, isSfxMuted());
      if (this.bossSprite?.active && this.bossDef) {
        const ph = bossPhaseIndex(this.bossHp, this.bossDef.maxHp);
        this.hud?.setBossBar(true, this.bossDef.displayName, this.bossHp, this.bossDef.maxHp, ph);
      } else {
        this.hud?.setBossBar(false, '', 0, 1, 0);
      }
      return;
    }

    const time = this.time.now;
    runState.stageElapsedMs += dt;
    runState.runElapsedMs += dt;
    const ds = dt / 1000;
    const stats = getShipCombat(runState.selectedShipId);
    const primary = resolvePrimaryStats(stats, runState.selectedShipId, runState.powerLevel);
    const width = this.scale.width;
    const height = this.scale.height;
    const margin = 20;
    const bounds = { minX: margin, maxX: width - margin, minY: margin, maxY: height - margin };

    this.ensureTouchSteerStillValid();
    const touchSteering = this.touchSteerPointerId !== null;

    const chargeHeld = !!this.keyX?.isDown || this.uiChargeHeld;
    const ch = specialWeaponStats.charge;
    if (chargeHeld) {
      runState.charge01 = Math.min(1, runState.charge01 + ch.fillPerSecond * ds);
    } else {
      if (this.chargeWasHeld && runState.charge01 >= ch.minRelease) {
        this.fireChargeWeapon(runState.selectedShipId);
        runState.charge01 = 0;
      } else {
        runState.charge01 = Math.max(0, runState.charge01 - ch.decayPerSecond * ds);
      }
    }
    this.chargeWasHeld = chargeHeld;

    const bombKey = this.keyB && Phaser.Input.Keyboard.JustDown(this.keyB);
    if (bombKey || this.uiBombQueued) {
      this.uiBombQueued = false;
      this.tryBomb(runState.selectedShipId);
    }

    const kbLeft = !!this.cursors?.left.isDown || this.wasd.A.isDown;
    const kbRight = !!this.cursors?.right.isDown || this.wasd.D.isDown;
    const kbUp = !!this.cursors?.up.isDown || this.wasd.W.isDown;
    const kbDown = !!this.cursors?.down.isDown || this.wasd.S.isDown;
    const kbMove = kbLeft || kbRight || kbUp || kbDown;

    if (kbMove) {
      this.player?.updateMovement(
        ds,
        { left: kbLeft, right: kbRight, up: kbUp, down: kbDown },
        stats.moveSpeed,
        bounds,
      );
    } else if (touchSteering) {
      this.applyTouchSteer(ds, stats.moveSpeed, bounds);
    }

    this.player?.refreshBlink(time);

    const wantFire = !!this.keySpace?.isDown || touchSteering;
    if (wantFire && time - this.lastFireTime >= primary.cooldownMs) {
      this.firePrimary(primary);
      this.lastFireTime = time;
    }

    this.updateHomingMissiles(ds);
    this.updateRaiderMotion(time);
    this.updateEnemyGunners(time);
    this.updateBoss(time);

    this.waveDirector.trySpawn(time, (typ: WaveEnemyType) => this.spawnEnemy(typ));

    this.cullOffscreenBullets();
    this.cullOffscreenEnemyBullets();
    this.cullEscapedEnemies();
    this.cullPickups();

    this.hud?.sync(runState, isSfxMuted());

    if (this.bossSprite?.active && this.bossDef) {
      const ph = bossPhaseIndex(this.bossHp, this.bossDef.maxHp);
      this.hud?.setBossBar(true, this.bossDef.displayName, this.bossHp, this.bossDef.maxHp, ph);
    } else {
      this.hud?.setBossBar(false, '', 0, 1, 0);
    }
  }

  private firePrimary(primary: ResolvedPrimary): void {
    const p = this.player?.sprite;
    if (!p) return;
    void SFX.primaryFire();
    if (runState.selectedShipId === 'falcon' && primary.pattern.kind === 'forward' && runState.powerLevel >= 2) {
      this.spawnPrimaryBullet(p.x - 11, p.y - 24, 0, primary.bulletSpeed);
      this.spawnPrimaryBullet(p.x + 11, p.y - 24, 0, primary.bulletSpeed);
      return;
    }
    this.emitPrimaryPattern(p, primary.pattern, primary.bulletSpeed);
  }

  private emitPrimaryPattern(
    p: Phaser.Physics.Arcade.Sprite,
    pattern: PrimaryPattern,
    bulletSpeed: number,
  ): void {
    if (pattern.kind === 'forward') {
      this.spawnPrimaryBullet(p.x, p.y - 24, 0, bulletSpeed);
      return;
    }
    const half = pattern.spreadDeg / 2;
    const step = pattern.count > 1 ? pattern.spreadDeg / (pattern.count - 1) : 0;
    for (let i = 0; i < pattern.count; i++) {
      const ang = -half + i * step;
      this.spawnPrimaryBullet(p.x, p.y - 20, ang, bulletSpeed);
    }
  }

  private spawnPrimaryBullet(x: number, y: number, angleDeg: number, speed: number): void {
    const b = this.playerBullets.create(x, y, TextureKeys.BulletPlayer) as Phaser.Physics.Arcade.Sprite;
    b.setData('kind', OrdnanceKind.Primary);
    b.setDepth(60);
    const rad = Phaser.Math.DegToRad(angleDeg);
    const vx = Math.sin(rad) * speed;
    const vy = -Math.cos(rad) * speed;
    b.setVelocity(vx, vy);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(4, 14);
    body.setOffset(1, 2);
  }

  private fireChargeWeapon(shipId: ShipId): void {
    const p = this.player?.sprite;
    if (!p) return;
    void SFX.chargeRelease();
    if (shipId === 'falcon') {
      this.spawnChargeLaser(p.x, p.y - 30);
      return;
    }
    this.spawnChargeMissiles(p.x, p.y - 20);
  }

  private spawnChargeLaser(x: number, y: number): void {
    const speed = specialWeaponStats.charge.falcon.laserSpeed;
    const b = this.playerBullets.create(x, y, TextureKeys.ChargeLaser) as Phaser.Physics.Arcade.Sprite;
    b.setData('kind', OrdnanceKind.Laser);
    b.setDepth(62);
    b.setVelocity(0, -speed);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(8, 58);
    body.setOffset(2, 3);
  }

  private spawnChargeMissiles(x: number, y: number): void {
    const { missileCount, spreadDeg, missileSpeed, turnRateRadPerSec } = specialWeaponStats.charge.wyvern;
    const half = spreadDeg / 2;
    const step = missileCount > 1 ? spreadDeg / (missileCount - 1) : 0;
    for (let i = 0; i < missileCount; i++) {
      const ang = -half + i * step;
      const b = this.playerBullets.create(x, y, TextureKeys.HomingMissile) as Phaser.Physics.Arcade.Sprite;
      b.setData('kind', OrdnanceKind.Missile);
      b.setData('turnRate', turnRateRadPerSec);
      b.setData('speed', missileSpeed);
      b.setDepth(61);
      const rad = Phaser.Math.DegToRad(ang);
      const vx = Math.sin(rad) * missileSpeed;
      const vy = -Math.cos(rad) * missileSpeed;
      b.setVelocity(vx, vy);
      const body = b.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setSize(8, 14);
      body.setOffset(2, 2);
    }
  }

  private updateHomingMissiles(ds: number): void {
    const boss = this.bossSprite?.active ? this.bossSprite : null;
    this.playerBullets.children.iterate((ch) => {
      const s = ch as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      const kind = s.getData('kind') as string | undefined;
      if (kind !== OrdnanceKind.Missile) return true;
      const turn = s.getData('turnRate') as number;
      const spd = s.getData('speed') as number;
      steerHomingMissile(s, this.enemies, boss, spd, turn, ds);
      return true;
    });
  }

  private updateRaiderMotion(time: number): void {
    for (const ch of this.enemies.getChildren()) {
      const e = ch as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      if (e.getData('enemyRole') !== 'raider') continue;
      const w = e.getData('wobble') as number;
      const body = e.body as Phaser.Physics.Arcade.Body;
      const vy = body.velocity.y;
      const vx = Math.sin(time * 0.0028 + w) * 108;
      e.setVelocity(vx, vy);
    }
  }

  private updateEnemyGunners(time: number): void {
    const px = this.player?.sprite.x ?? this.scale.width / 2;
    const py = this.player?.sprite.y ?? this.scale.height * 0.82;
    for (const ch of this.enemies.getChildren()) {
      const e = ch as Phaser.Physics.Arcade.Sprite;
      if (!e.active) continue;
      const roleKey = (e.getData('enemyRole') as WaveEnemyType) ?? 'grunt';
      const g = enemyGunnerByType[roleKey] ?? enemyGunnerByType.grunt;
      const fm = this.diffTune.enemyFireMul;
      let next = e.getData('nextEnemyShot') as number | undefined;
      if (next === undefined) {
        e.setData(
          'nextEnemyShot',
          time + Phaser.Math.Between(g.firstDelayMin, g.firstDelayMax) * fm,
        );
        continue;
      }
      if (time < next) continue;
      const ang = Phaser.Math.Angle.Between(e.x, e.y + 12, px, py);
      this.spawnEnemyBullet(e.x, e.y + 14, ang, g.shotSpeed);
      e.setData('nextEnemyShot', time + Phaser.Math.Between(g.repeatMin, g.repeatMax) * fm);
    }
  }

  private spawnEnemyBullet(x: number, y: number, angleRad: number, speed: number): void {
    const b = this.enemyBullets.create(x, y, TextureKeys.BulletEnemy) as Phaser.Physics.Arcade.Sprite;
    b.setDepth(57);
    b.setVelocity(Math.cos(angleRad) * speed, Math.sin(angleRad) * speed);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(6, 12);
    body.setOffset(2, 3);
  }

  private tryBomb(shipId: ShipId): void {
    if (runState.bombs <= 0) return;
    const p = this.player?.sprite;
    if (!p) return;
    runState.bombs -= 1;

    let circles: { x: number; y: number; r: number }[];

    if (shipId === 'falcon') {
      const { forwardOffset, radius } = specialWeaponStats.bomb.falcon;
      const cx = p.x;
      const cy = p.y - forwardOffset;
      circles = [{ x: cx, y: cy, r: radius }];
      this.flashBomb(cx, cy, radius, 0x66ccff);
    } else {
      const { aheadY, radius, spreadX } = specialWeaponStats.bomb.wyvern;
      const baseY = p.y - aheadY;
      circles = [
        { x: p.x - spreadX, y: baseY, r: radius },
        { x: p.x, y: baseY, r: radius },
        { x: p.x + spreadX, y: baseY, r: radius },
      ];
      circles.forEach((c) => this.flashBomb(c.x, c.y, c.r, 0xffb347));
    }

    this.damageEnemiesInCircles(circles);
    this.damageBossFromBomb(circles);
    this.clearEnemyBullets();
    void SFX.bomb();
  }

  private flashBomb(cx: number, cy: number, radius: number, fill: number): void {
    const ring = this.add.circle(cx, cy, radius * 0.15, fill, 0.2).setStrokeStyle(4, 0xffffff, 0.85).setDepth(200);
    this.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });
  }

  private damageEnemiesInCircles(
    circles: ReadonlyArray<{ x: number; y: number; r: number }>,
  ): void {
    const victims = new Set<Phaser.Physics.Arcade.Sprite>();
    this.enemies.children.iterate((ch) => {
      const e = ch as Phaser.Physics.Arcade.Sprite;
      if (!e.active) return true;
      const hit = circles.some(
        (c) => Phaser.Math.Distance.Between(e.x, e.y, c.x, c.y) <= c.r,
      );
      if (hit) {
        victims.add(e);
      }
      return true;
    });
    victims.forEach((e) => this.removeEnemy(e, true));
  }

  private spawnEnemy(t: WaveEnemyType): void {
    const width = this.scale.width;
    const margin = 48;
    const x = Phaser.Math.Between(margin, width - margin);
    const y = -46;
    const prof = waveEnemySpawnByType[t];
    const e = this.enemies.create(x, y, prof.textureKey) as Phaser.Physics.Arcade.Sprite;
    if (t === 'raider') {
      e.setData('wobble', Phaser.Math.FloatBetween(0, Math.PI * 2));
    }
    e.setDepth(prof.depth);
    e.setData('enemyRole', t);
    e.setVelocity(0, Phaser.Math.Between(prof.vyMin, prof.vyMax));
    const body = e.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(prof.hitSize, prof.hitSize);
    body.setOffset(prof.offsetX, prof.offsetY);
    this.enemiesAlive += 1;
  }

  private cullOffscreenBullets(): void {
    const h = this.scale.height;
    const w = this.scale.width;
    this.playerBullets.children.iterate((ch) => {
      const s = ch as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      if (s.y < -80 || s.y > h + 50 || s.x < -40 || s.x > w + 40) {
        s.destroy();
      }
      return true;
    });
  }

  private cullOffscreenEnemyBullets(): void {
    const h = this.scale.height;
    const w = this.scale.width;
    this.enemyBullets.children.iterate((ch) => {
      const s = ch as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      if (s.y < -60 || s.y > h + 80 || s.x < -50 || s.x > w + 50) {
        s.destroy();
      }
      return true;
    });
  }

  private cullPickups(): void {
    const h = this.scale.height;
    this.pickups.children.iterate((ch) => {
      const s = ch as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      if (s.y > h + 40) {
        s.destroy();
      }
      return true;
    });
  }

  private cullEscapedEnemies(): void {
    const h = this.scale.height;
    this.enemies.children.iterate((ch) => {
      const e = ch as Phaser.Physics.Arcade.Sprite;
      if (!e.active) return true;
      if (e.y > h + 100) {
        e.destroy();
        this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
        this.tryCompleteWave();
      }
      return true;
    });
  }
}
