import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { MVPClearScene } from './scenes/MVPClearScene';
import { PreloadScene } from './scenes/PreloadScene';
import { ResultScene } from './scenes/ResultScene';
import { ShipSelectScene } from './scenes/ShipSelectScene';
import { TitleScene } from './scenes/TitleScene';

/** Fixed vertical resolution; FIT scales to desktop window. */
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: document.body,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0a0e14',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  title: 'VORTEX STRIKERS',
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    ShipSelectScene,
    GameScene,
    ResultScene,
    GameOverScene,
    MVPClearScene,
  ],
});
