import Phaser from 'phaser';
import { TextureKeys } from '../core/textureKeys';
import { runState } from '../core/RunState';
import { bossPhaseIndex, getBossDefinition, type BossDefinition } from '../data/bosses';
import { PickupKind, PICKUP_CHANCE_ENERGY_CORE, PICKUP_CHANCE_POWER } from '../data/pickups';
import { SCORE_ENERGY_CORE, SCORE_GRUNT_KILL } from '../data/scoring';
import { getShipCombat } from '../data/ships/combatStats';
import type { PrimaryPattern } from '../data/ships/combatStats';
import { resolvePrimaryStats, type ResolvedPrimary } from '../data/ships/powerLevel';
import { OrdnanceKind, specialWeaponStats } from '../data/ships/specialWeapons';
import type { ShipId } from '../data/ships/types';
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
  private keyXWasDown = false;
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

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1520, 1).setDepth(0);

    const stage = getStageByIndex(runState.currentStageIndex);
    this.waveDirector = new WaveDirector(getWaveScript(stage?.waveScriptId ?? 'stage1_waves'));

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
    this.hud.sync(runState);

    this.waveHint = this.add
      .text(
        width / 2,
        height * 0.1,
        'Clear hostiles & boss — move · SPACE · X charge · B bomb (clears foe shots)',
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

    kb.on('keydown-R', () => this.scene.start(SceneKeys.Result));
    kb.on('keydown-G', () => this.scene.start(SceneKeys.GameOver));
    kb.on('keydown-M', () => this.scene.start(SceneKeys.MVPClear));
    kb.on('keydown-T', () => this.scene.start(SceneKeys.Title));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb.off('keydown-R');
      kb.off('keydown-G');
      kb.off('keydown-M');
      kb.off('keydown-T');
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

  private teardownBoss(): void {
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

  private onPlayerRamBoss(): void {
    const p = this.player;
    if (!p || !this.bossSprite?.active) return;
    if (!p.tryBeginHit(this.time.now)) return;
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
      this.bossFirePhase = ph;
      this.bossNextBurst = time + 450;
    }

    const aimedMs = def.aimedIntervalMs[ph];
    const burstMs = def.burstIntervalMs[ph];
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

  private clearEnemyBullets(): void {
    this.enemyBullets.clear(true, true);
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
      return;
    }
    if (kind === PickupKind.EnergyCore) {
      runState.score += SCORE_ENERGY_CORE;
    }
  }

  private onEnemyBulletHitPlayer(bullet: Phaser.Physics.Arcade.Sprite): void {
    const p = this.player;
    if (!p || !bullet.active) return;
    bullet.destroy();
    if (!p.tryBeginHit(this.time.now)) return;
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
    const time = this.time.now;
    const ds = dt / 1000;
    const stats = getShipCombat(runState.selectedShipId);
    const primary = resolvePrimaryStats(stats, runState.selectedShipId, runState.powerLevel);
    const width = this.scale.width;
    const height = this.scale.height;
    const margin = 20;

    const xDown = !!this.keyX?.isDown;
    const ch = specialWeaponStats.charge;
    if (xDown) {
      runState.charge01 = Math.min(1, runState.charge01 + ch.fillPerSecond * ds);
    } else {
      if (this.keyXWasDown && runState.charge01 >= ch.minRelease) {
        this.fireChargeWeapon(runState.selectedShipId);
        runState.charge01 = 0;
      } else {
        runState.charge01 = Math.max(0, runState.charge01 - ch.decayPerSecond * ds);
      }
    }
    this.keyXWasDown = xDown;

    if (this.keyB && Phaser.Input.Keyboard.JustDown(this.keyB)) {
      this.tryBomb(runState.selectedShipId);
    }

    this.player?.updateMovement(
      ds,
      {
        left: !!this.cursors?.left.isDown || this.wasd.A.isDown,
        right: !!this.cursors?.right.isDown || this.wasd.D.isDown,
        up: !!this.cursors?.up.isDown || this.wasd.W.isDown,
        down: !!this.cursors?.down.isDown || this.wasd.S.isDown,
      },
      stats.moveSpeed,
      { minX: margin, maxX: width - margin, minY: margin, maxY: height - margin },
    );

    this.player?.refreshBlink(time);

    if (this.keySpace?.isDown && time - this.lastFireTime >= primary.cooldownMs) {
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

    this.hud?.sync(runState);
  }

  private firePrimary(primary: ResolvedPrimary): void {
    const p = this.player?.sprite;
    if (!p) return;
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
      const role = (e.getData('enemyRole') as string) ?? 'grunt';
      let next = e.getData('nextEnemyShot') as number | undefined;
      if (next === undefined) {
        const initial =
          role === 'turret'
            ? time + Phaser.Math.Between(500, 900)
            : time + Phaser.Math.Between(900, 1600);
        e.setData('nextEnemyShot', initial);
        continue;
      }
      if (time < next) continue;
      const ang = Phaser.Math.Angle.Between(e.x, e.y + 12, px, py);
      const spd = role === 'raider' ? 252 : role === 'turret' ? 205 : 230;
      this.spawnEnemyBullet(e.x, e.y + 14, ang, spd);
      const again =
        role === 'turret'
          ? time + Phaser.Math.Between(1500, 2200)
          : role === 'raider'
            ? time + Phaser.Math.Between(2200, 3400)
            : time + Phaser.Math.Between(2600, 4000);
      e.setData('nextEnemyShot', again);
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

    if (t === 'grunt') {
      const e = this.enemies.create(x, y, TextureKeys.Grunt) as Phaser.Physics.Arcade.Sprite;
      this.finalizeSpawnedEnemy(e, 'grunt', 72, 108, 20, 6, 6);
      return;
    }
    if (t === 'turret') {
      const e = this.enemies.create(x, y, TextureKeys.EnemyTurret) as Phaser.Physics.Arcade.Sprite;
      this.finalizeSpawnedEnemy(e, 'turret', 30, 44, 26, 3, 10);
      return;
    }
    const e = this.enemies.create(x, y, TextureKeys.EnemyRaider) as Phaser.Physics.Arcade.Sprite;
    e.setData('wobble', Phaser.Math.FloatBetween(0, Math.PI * 2));
    this.finalizeSpawnedEnemy(e, 'raider', 85, 102, 18, 7, 5);
  }

  private finalizeSpawnedEnemy(
    e: Phaser.Physics.Arcade.Sprite,
    role: string,
    vyMin: number,
    vyMax: number,
    hit: number,
    offX: number,
    offY: number,
  ): void {
    e.setDepth(41);
    e.setData('enemyRole', role);
    e.setVelocity(0, Phaser.Math.Between(vyMin, vyMax));
    const body = e.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(hit, hit);
    body.setOffset(offX, offY);
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
