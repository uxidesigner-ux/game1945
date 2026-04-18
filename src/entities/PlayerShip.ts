import Phaser from 'phaser';

const INVULN_MS = 2200;

export class PlayerShip {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private invulnerableUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string) {
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setDepth(50);
    this.sprite.setDrag(0, 0);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(22, 22);
    body.setOffset(7, 10);
  }

  updateMovement(
    deltaSeconds: number,
    input: { left: boolean; right: boolean; up: boolean; down: boolean },
    moveSpeed: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ): void {
    let vx = 0;
    let vy = 0;
    if (input.left) vx -= 1;
    if (input.right) vx += 1;
    if (input.up) vy -= 1;
    if (input.down) vy += 1;
    if (vx !== 0 && vy !== 0) {
      const inv = 1 / Math.SQRT2;
      vx *= inv;
      vy *= inv;
    }
    const step = moveSpeed * deltaSeconds;
    this.sprite.x += vx * step;
    this.sprite.y += vy * step;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x, bounds.minX, bounds.maxX);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y, bounds.minY, bounds.maxY);
    this.sprite.setVelocity(0, 0);
  }

  refreshBlink(time: number): void {
    if (time < this.invulnerableUntil) {
      const phase = Math.floor(time / 100) % 2;
      this.sprite.setAlpha(phase === 0 ? 0.35 : 0.95);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  tryBeginHit(time: number): boolean {
    if (time < this.invulnerableUntil) return false;
    this.invulnerableUntil = time + INVULN_MS;
    return true;
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnerableUntil;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
