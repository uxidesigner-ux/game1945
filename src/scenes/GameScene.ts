import Phaser from 'phaser';
import { TextureKeys } from '../core/textureKeys';
import { runState } from '../core/RunState';
import { SCORE_GRUNT_KILL } from '../data/scoring';
import { getShipCombat, type ShipCombatStats } from '../data/ships/combatStats';
import { PlayerShip } from '../entities/PlayerShip';
import { WaveSpawner } from '../systems/WaveSpawner';
import { HUD } from '../ui/HUD';
import { SceneKeys } from './sceneKeys';

const WAVE_GRUNTS = 10;
const WAVE_SPAWN_INTERVAL_MS = 900;

export class GameScene extends Phaser.Scene {
  private hud?: HUD;
  private player?: PlayerShip;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keySpace?: Phaser.Input.Keyboard.Key;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private lastFireTime = -99999;
  private waveSpawner!: WaveSpawner;
  private enemiesAlive = 0;
  private waveHint?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Game);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0d1520, 1).setDepth(0);

    this.playerBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 400,
      runChildUpdate: false,
    });
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 200,
      runChildUpdate: false,
    });

    this.player = new PlayerShip(this, width / 2, height * 0.82, TextureKeys.Player);
    this.waveSpawner = new WaveSpawner(WAVE_GRUNTS, WAVE_SPAWN_INTERVAL_MS);

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

    this.hud = new HUD(this);
    this.hud.sync(runState);

    this.waveHint = this.add
      .text(width / 2, height * 0.1, 'Clear the wave — WASD/arrows move · SPACE fire', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#7aa6c8',
      })
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
      this.enemies.clear(true, true);
      this.player?.destroy();
      this.player = undefined;
      this.hud?.destroy();
      this.hud = undefined;
      this.waveHint?.destroy();
      this.waveHint = undefined;
    });
  }

  private onBulletHitEnemy(bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite): void {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();
    enemy.destroy();
    runState.score += SCORE_GRUNT_KILL;
    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    this.tryCompleteWave();
  }

  private onPlayerRamEnemy(enemy: Phaser.Physics.Arcade.Sprite): void {
    const p = this.player;
    if (!p || !enemy.active) return;
    if (!p.tryBeginHit(this.time.now)) return;
    enemy.destroy();
    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    runState.lives -= 1;
    if (runState.lives <= 0) {
      this.scene.start(SceneKeys.GameOver);
      return;
    }
    this.tryCompleteWave();
  }

  private tryCompleteWave(): void {
    if (!this.waveSpawner.doneSpawning || this.enemiesAlive > 0) return;
    this.scene.start(SceneKeys.Result);
  }

  update(_t: number, dt: number): void {
    const time = this.time.now;
    const ds = dt / 1000;
    const stats = getShipCombat(runState.selectedShipId);
    const width = this.scale.width;
    const height = this.scale.height;
    const margin = 20;

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

    if (this.keySpace?.isDown && time - this.lastFireTime >= stats.fireCooldownMs) {
      this.firePrimary(stats);
      this.lastFireTime = time;
    }

    this.waveSpawner.trySpawn(time, () => this.spawnGrunt());

    this.cullOffscreenBullets();
    this.cullEscapedEnemies();

    this.hud?.sync(runState);
  }

  private firePrimary(stats: ShipCombatStats): void {
    const p = this.player?.sprite;
    if (!p) return;
    const pattern = stats.primaryPattern;
    if (pattern.kind === 'forward') {
      this.spawnBullet(p.x, p.y - 24, 0, stats.bulletSpeed);
      return;
    }
    const half = pattern.spreadDeg / 2;
    const step = pattern.count > 1 ? pattern.spreadDeg / (pattern.count - 1) : 0;
    for (let i = 0; i < pattern.count; i++) {
      const ang = -half + i * step;
      this.spawnBullet(p.x, p.y - 20, ang, stats.bulletSpeed);
    }
  }

  private spawnBullet(x: number, y: number, angleDeg: number, speed: number): void {
    const b = this.playerBullets.create(x, y, TextureKeys.BulletPlayer) as Phaser.Physics.Arcade.Sprite;
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

  private spawnGrunt(): void {
    const width = this.scale.width;
    const margin = 48;
    const x = Phaser.Math.Between(margin, width - margin);
    const y = -40;
    const e = this.enemies.create(x, y, TextureKeys.Grunt) as Phaser.Physics.Arcade.Sprite;
    e.setDepth(40);
    e.setVelocity(0, Phaser.Math.Between(70, 110));
    const body = e.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(20, 20);
    body.setOffset(6, 6);
    this.enemiesAlive += 1;
  }

  private cullOffscreenBullets(): void {
    const h = this.scale.height;
    const w = this.scale.width;
    this.playerBullets.children.iterate((ch) => {
      const s = ch as Phaser.Physics.Arcade.Sprite;
      if (!s.active) return true;
      if (s.y < -50 || s.y > h + 50 || s.x < -30 || s.x > w + 30) {
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
