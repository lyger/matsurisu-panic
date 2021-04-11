import "../scss/app.scss";
import Phaser from "phaser";
import { WIDTH, HEIGHT } from "./globals";
import Preloader from "./scenes/preloader";
import Game from "./scenes/game";
import ScreenshotPlugin from "./screenshot";

const game = new Phaser.Game({
  parent: "phaser-root",
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  preserveDrawingBuffer: true,
  scale: {
    parent: "phaser-root",
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: "arcade", debug: true },
  plugins: {
    global: [
      {
        key: "ScreenshotPlugin",
        plugin: ScreenshotPlugin,
        start: true,
        mapping: "screenshot",
      },
    ],
  },
  backgroundColor: 0x00000,
  resolution: 1,
  scene: [Preloader, Game],
});
