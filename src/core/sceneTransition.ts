import type Phaser from 'phaser';

/**
 * `scene.start` is unreliable when called synchronously from overlap/input/timers
 * in some Phaser 3.x builds. Defer one tick so the scene manager finishes its queue.
 */
export function startSceneAfterFrame(
  scene: Phaser.Scene,
  key: string,
  /** ms to wait; default ~1 frame at 60fps */
  delayMs = 16,
): void {
  scene.time.delayedCall(delayMs, () => {
    scene.scene.start(key);
  });
}
