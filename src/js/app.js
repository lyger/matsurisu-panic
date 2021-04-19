import "../scss/app.scss";
import Phaser from "phaser";
import { WIDTH, HEIGHT } from "./globals";
import Preloader from "./scenes/preloader";

const game = new Phaser.Game({
  parent: "phaser-root",
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  scale: {
    parent: "phaser-root",
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 5,
  },
  physics: { default: "arcade", arcade: { debug: false } },
  backgroundColor: 0x00000,
  resolution: 1,
  scene: Preloader,
});
