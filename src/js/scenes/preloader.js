import Phaser from "phaser";
import { HEIGHT, PUBLIC_PATH } from "../globals";
import { StartScreen } from "./uiscenes";

const SKINS = ["placeholder"];
const MATSURISU = ["normal"];

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    const progressBar = this.add.graphics();
    this.load.on("progress", function (value) {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 0.5);
      progressBar.fillRect(200, HEIGHT / 2 - 5, 320 * value, 10);
    });

    this.load.on("complete", function () {
      progressBar.destroy();
    });

    this.load.spritesheet(
      "controls",
      PUBLIC_PATH + "/images/control_buttons.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet("ui", PUBLIC_PATH + "/images/ui_buttons.png", {
      frameWidth: 200,
      frameHeight: 100,
    });

    this.load.spritesheet("powerups", PUBLIC_PATH + "/images/powerups.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    MATSURISU.forEach((risuType) => {
      this.load.spritesheet(
        `matsurisu-${risuType}`,
        PUBLIC_PATH + `/images/matsurisu-${risuType}.png`,
        {
          frameWidth: 100,
          frameHeight: 100,
        }
      );
    });

    SKINS.forEach((skin) => {
      this.load.spritesheet(
        `matsuri-${skin}`,
        PUBLIC_PATH + `/images/matsuri-${skin}.png`,
        {
          frameWidth: 150,
          frameHeight: 200,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-arms-up`,
        PUBLIC_PATH + `/images/matsuri-${skin}-arms-up.png`,
        {
          frameWidth: 150,
          frameHeight: 200,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-arms-down`,
        PUBLIC_PATH + `/images/matsuri-${skin}-arms-down.png`,
        {
          frameWidth: 150,
          frameHeight: 200,
        }
      );
      this.load.image(`win-${skin}`, PUBLIC_PATH + `/images/win-${skin}.png`);
    });
  }

  createAnimations() {
    const makeMatsuriAnimations = (baseName) => {
      this.anims.create({
        key: baseName + ".idle",
        frames: [{ key: baseName, frame: 0 }],
        frameRate: 10,
      });
      this.anims.create({
        key: baseName + ".run",
        frames: this.anims.generateFrameNumbers(baseName, {
          frames: [0, 1, 2, 3],
        }),
        frameRate: 10,
        repeat: -1,
      });
    };

    SKINS.forEach((skin) => {
      makeMatsuriAnimations(`matsuri-${skin}`);
      makeMatsuriAnimations(`matsuri-${skin}-arms-up`);
      makeMatsuriAnimations(`matsuri-${skin}-arms-down`);
    });

    MATSURISU.forEach((skin) => {
      this.anims.create({
        key: `matsurisu-${skin}.fall`,
        frames: this.anims.generateFrameNumbers(`matsurisu-${skin}`, {
          frames: [0, 1],
        }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  create() {
    this.createAnimations();
    this.scene.add("Start", StartScreen, true);
  }
}
