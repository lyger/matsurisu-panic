import Phaser from "phaser";
import { HEIGHT, PUBLIC_PATH } from "../globals";
import Curtains from "./curtains";
import { StartScreen } from "./uiscenes";

const SKINS = ["normal"];
const MATSURISU = ["normal"];

export default class Preloader extends Phaser.Scene {
  constructor() {
    super("Preloader");
  }

  loadControls() {
    this.load.spritesheet(
      "controls-horizontal",
      PUBLIC_PATH + "/images/control-buttons-horizontal.png",
      {
        frameWidth: 140,
        frameHeight: 230,
      }
    );
    this.load.spritesheet(
      "controls-vertical",
      PUBLIC_PATH + "/images/control-buttons-vertical.png",
      {
        frameWidth: 280,
        frameHeight: 115,
      }
    );
    this.load.spritesheet(
      "controls-item",
      PUBLIC_PATH + "/images/control-buttons-item.png",
      {
        frameWidth: 160,
        frameHeight: 230,
      }
    );
  }

  loadCharacters() {
    MATSURISU.forEach((risuType) => {
      this.load.spritesheet(
        `matsurisu-${risuType}`,
        PUBLIC_PATH + `/images/matsurisu-${risuType}.png`,
        {
          frameWidth: 150,
          frameHeight: 150,
        }
      );
      this.load.image(
        `matsurisu-${risuType}-die`,
        PUBLIC_PATH + `/images/matsurisu-${risuType}-die.png`
      );
      this.load.spritesheet(
        `matsurisu-${risuType}-land`,
        PUBLIC_PATH + `/images/matsurisu-${risuType}-land.png`,
        {
          frameWidth: 150,
          frameHeight: 150,
        }
      );
    });

    SKINS.forEach((skin) => {
      this.load.spritesheet(
        `matsuri-${skin}`,
        PUBLIC_PATH + `/images/matsuri-${skin}.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-arms-up`,
        PUBLIC_PATH + `/images/matsuri-${skin}-arms-up.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-arms-down`,
        PUBLIC_PATH + `/images/matsuri-${skin}-arms-down.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-down-left`,
        PUBLIC_PATH + `/images/matsuri-${skin}-down-left.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `matsuri-${skin}-down-right`,
        PUBLIC_PATH + `/images/matsuri-${skin}-down-right.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      // this.load.image(`win-${skin}`, PUBLIC_PATH + `/images/win-${skin}.png`);
      this.load.image(
        `win-${skin}`,
        PUBLIC_PATH + `/images/win-placeholder.png`
      );
    });
  }

  loadStage() {
    this.load.image(
      "stage-background",
      PUBLIC_PATH + "/images/stage-background.png"
    );

    this.load.image(
      "stage-scoreboard",
      PUBLIC_PATH + "/images/stage-scoreboard.png"
    );
    this.load.image(
      "stage-scoreboard-life",
      PUBLIC_PATH + "/images/stage-scoreboard-life.png"
    );

    this.load.spritesheet(
      "pause-button",
      PUBLIC_PATH + "/images/pause-button.png",
      {
        frameWidth: 60,
        frameHeight: 65,
      }
    );

    this.load.spritesheet(
      "mute-button",
      PUBLIC_PATH + "/images/mute-button.png",
      {
        frameWidth: 60,
        frameHeight: 65,
      }
    );
  }

  loadShop() {
    this.load.image(
      "shop-background",
      PUBLIC_PATH + "/images/shop-background.png"
    );
    this.load.image(
      "shop-confirm-modal",
      PUBLIC_PATH + "/images/shop-confirm-modal.png"
    );
    this.load.image(
      "shop-confirm-arrow",
      PUBLIC_PATH + "/images/shop-confirm-arrow.png"
    );
    this.load.spritesheet(
      "shop-confirm-buttons",
      PUBLIC_PATH + "/images/shop-confirm-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "shop-frame",
      PUBLIC_PATH + "/images/shop-frames.png",
      {
        frameWidth: 280,
        frameHeight: 280,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "shop-done-buttons",
      PUBLIC_PATH + "/images/shop-done-buttons.png",
      {
        frameWidth: 300,
        frameHeight: 126,
        margin: 1,
        spacing: 2,
      }
    );
  }

  loadItems() {
    this.load.spritesheet("items", PUBLIC_PATH + "/images/items.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  loadSounds() {
    this.load.audio("matsuri-samba", [
      PUBLIC_PATH + "/audio/matsuri_de_samba.ogg",
      PUBLIC_PATH + "/audio/matsuri_de_samba.mp3",
    ]);
    this.load.audio("matsuri-jazz", [
      PUBLIC_PATH + "/audio/matsuri_jazz.ogg",
      PUBLIC_PATH + "/audio/matsuri_jazz.mp3",
    ]);
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

    this.loadControls();
    this.loadCharacters();
    this.loadStage();
    this.loadShop();
    this.loadItems();
    this.loadSounds();

    this.load.spritesheet("ui", PUBLIC_PATH + "/images/ui_buttons.png", {
      frameWidth: 200,
      frameHeight: 100,
    });

    this.load.spritesheet("powerups", PUBLIC_PATH + "/images/powerups.png", {
      frameWidth: 100,
      frameHeight: 100,
    });
  }

  createAnimations() {
    const makeMatsuriAnimations = (baseName) => {
      this.anims.create({
        key: baseName + ".idle.left",
        frames: [{ key: baseName, frame: 0 }],
        frameRate: 10,
      });
      this.anims.create({
        key: baseName + ".idle.right",
        frames: [{ key: baseName, frame: 0 }],
        frameRate: 10,
      });
      this.anims.create({
        key: baseName + ".run.left",
        frames: this.anims.generateFrameNumbers(baseName, {
          frames: [0, 1, 2, 3],
        }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: baseName + ".run.right",
        frames: this.anims.generateFrameNumbers(baseName, {
          frames: [0, 1, 2, 3],
        }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: baseName + "-down.idle.left",
        frames: [{ key: baseName + "-down-left", frame: 0 }],
        frameRate: 5,
      });
      this.anims.create({
        key: baseName + "-down.idle.right",
        frames: [{ key: baseName + "-down-right", frame: 0 }],
        frameRate: 5,
      });
      this.anims.create({
        key: baseName + "-down.run.left",
        frames: this.anims.generateFrameNumbers(baseName + "-down-left", {
          frames: [0, 1],
        }),
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: baseName + "-down.run.right",
        frames: this.anims.generateFrameNumbers(baseName + "-down-right", {
          frames: [0, 1],
        }),
        frameRate: 5,
        repeat: -1,
      });
    };

    SKINS.forEach((skin) => {
      makeMatsuriAnimations(`matsuri-${skin}`);
      // makeMatsuriAnimations(`matsuri-${skin}-arms-up`);
      // makeMatsuriAnimations(`matsuri-${skin}-arms-down`);
    });

    MATSURISU.forEach((skin) => {
      this.anims.create({
        key: `matsurisu-${skin}.fall`,
        frames: this.anims.generateFrameNumbers(`matsurisu-${skin}`, {
          frames: [0, 1],
        }),
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: `matsurisu-${skin}.stand`,
        frames: this.anims.generateFrameNumbers(`matsurisu-${skin}-land`, {
          frames: [1, 2],
        }),
        frameRate: 5,
        repeat: -1,
      });
    });
  }

  create() {
    this.createAnimations();
    this.scene.add("Curtains", Curtains, false);
    this.scene.bringToTop("Curtains");
    this.scene.add("Start", StartScreen, true);
  }
}
