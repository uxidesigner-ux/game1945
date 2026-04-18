import Phaser from 'phaser';
import { SceneKeys } from './sceneKeys';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    // Placeholder: later load spritesheets/audio. For step 0–1 we use generated textures.
  }

  create(): void {
    this.scene.start(SceneKeys.Title);
  }
}
