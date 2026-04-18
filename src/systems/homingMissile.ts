import Phaser from 'phaser';

export function steerHomingMissile(
  missile: Phaser.Physics.Arcade.Sprite,
  enemies: Phaser.Physics.Arcade.Group,
  boss: Phaser.Physics.Arcade.Sprite | null | undefined,
  speed: number,
  turnRateRadPerSec: number,
  dt: number,
): void {
  const body = missile.body as Phaser.Physics.Arcade.Body;
  let nearest: Phaser.Physics.Arcade.Sprite | undefined;
  let best = Infinity;

  if (boss?.active) {
    const d = Phaser.Math.Distance.Squared(missile.x, missile.y, boss.x, boss.y);
    if (d < best) {
      best = d;
      nearest = boss;
    }
  }

  for (const ch of enemies.getChildren()) {
    const e = ch as Phaser.Physics.Arcade.Sprite;
    if (!e.active) continue;
    const d = Phaser.Math.Distance.Squared(missile.x, missile.y, e.x, e.y);
    if (d < best) {
      best = d;
      nearest = e;
    }
  }

  if (!nearest) return;

  const cur = Math.atan2(body.velocity.y, body.velocity.x);
  const target = Math.atan2(nearest.y - missile.y, nearest.x - missile.x);
  let diff = Phaser.Math.Angle.Wrap(target - cur);
  const maxTurn = turnRateRadPerSec * dt;
  diff = Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
  const next = cur + diff;
  body.setVelocity(Math.cos(next) * speed, Math.sin(next) * speed);
}
