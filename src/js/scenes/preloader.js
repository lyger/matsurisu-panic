import Phaser from "phaser";
import { HEIGHT, PUBLIC_PATH } from "../globals";
import store from "../store";
import Curtains from "./curtains";
import Title from "./title";

const SKINS = ["normal"];
const EQUIPMENT = ["glasses", "catears", "cattail", "glowstick"];
const CHARACTER_PREFIXES = SKINS.map((skin) => "matsuri-" + skin).concat(
  EQUIPMENT.map((equipment) => "equipment-" + equipment)
);
const MATSURISU = ["normal", "light", "fever"];

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
      this.load.spritesheet(
        `matsurisu-${risuType}-land`,
        PUBLIC_PATH + `/images/matsurisu-${risuType}-land.png`,
        {
          frameWidth: 150,
          frameHeight: 150,
        }
      );
    });
    this.load.image(
      "matsurisu-normal-die",
      PUBLIC_PATH + "/images/matsurisu-normal-die.png"
    );

    CHARACTER_PREFIXES.forEach((prefix) => {
      this.load.spritesheet(
        `${prefix}-idle`,
        PUBLIC_PATH + `/images/${prefix}-idle.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `${prefix}-left`,
        PUBLIC_PATH + `/images/${prefix}-left.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `${prefix}-right`,
        PUBLIC_PATH + `/images/${prefix}-right.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `${prefix}-down-left`,
        PUBLIC_PATH + `/images/${prefix}-down-left.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
      this.load.spritesheet(
        `${prefix}-down-right`,
        PUBLIC_PATH + `/images/${prefix}-down-right.png`,
        {
          frameWidth: 225,
          frameHeight: 300,
        }
      );
    });

    this.load.spritesheet(
      `matsurisu-preview`,
      PUBLIC_PATH + `/images/matsurisu-preview.png`,
      {
        frameWidth: 114,
        frameHeight: 150,
        margin: 1,
        spacing: 2,
      }
    );
  }

  loadTitle() {
    this.load.image(
      "title-background",
      PUBLIC_PATH + "/images/title-background.png"
    );
    this.load.spritesheet(
      "title-start-buttons",
      PUBLIC_PATH + "/images/title-start-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "title-side-buttons",
      PUBLIC_PATH + "/images/title-side-buttons.png",
      {
        frameWidth: 120,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "title-credit-buttons",
      PUBLIC_PATH + "/images/title-credit-buttons.png",
      {
        frameWidth: 240,
        frameHeight: 50,
      }
    );
    this.load.image(
      "title-sparkles",
      PUBLIC_PATH + "/images/title-sparkles.png"
    );
    this.load.image("title-logo", PUBLIC_PATH + "/images/title-logo.png");
    this.load.image("title-matsuri", PUBLIC_PATH + "/images/title-matsuri.png");
    this.load.image(
      "title-ebifrion",
      PUBLIC_PATH + "/images/title-ebifrion.png"
    );
    this.load.image(
      "title-matsurisu1",
      PUBLIC_PATH + "/images/title-matsurisu1.png"
    );
    this.load.image(
      "title-matsurisu2",
      PUBLIC_PATH + "/images/title-matsurisu2.png"
    );
    this.load.image(
      "title-matsurisu3",
      PUBLIC_PATH + "/images/title-matsurisu3.png"
    );
  }

  loadModals() {
    this.load.image("modal-blank", PUBLIC_PATH + "/images/modal-blank.png");
    this.load.spritesheet(
      "modal-close-buttons",
      PUBLIC_PATH + "/images/modal-close-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "modal-nav-buttons",
      PUBLIC_PATH + "/images/modal-nav-buttons.png",
      {
        frameWidth: 63,
        frameHeight: 66,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "modal-toggle-buttons",
      PUBLIC_PATH + "/images/modal-toggle-buttons.png",
      {
        frameWidth: 160,
        frameHeight: 60,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "modal-clear-buttons",
      PUBLIC_PATH + "/images/modal-clear-buttons.png",
      {
        frameWidth: 255,
        frameHeight: 60,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.image("controls-info", PUBLIC_PATH + "/images/controls-info.png");
    this.load.image(
      "sound-slider-frame",
      PUBLIC_PATH + "/images/sound-slider-frame.png"
    );
    this.load.image(
      "sound-slider-gauge",
      PUBLIC_PATH + "/images/sound-slider-gauge.png"
    );
    this.load.image(
      "sound-slider-knob",
      PUBLIC_PATH + "/images/sound-slider-knob.png"
    );
  }

  loadStage() {
    this.load.image(
      "stage-background",
      PUBLIC_PATH + "/images/stage-background.png"
    );
    this.load.image(
      "stage-background-fever",
      PUBLIC_PATH + "/images/stage-background-fever.png"
    );
    this.load.image(
      "stage-progress",
      PUBLIC_PATH + "/images/stage-progress.png"
    );

    this.load.image(
      "stage-scoreboard",
      PUBLIC_PATH + "/images/stage-scoreboard.png"
    );
    this.load.image(
      "stage-scoreboard-life",
      PUBLIC_PATH + "/images/stage-scoreboard-life.png"
    );

    this.load.image(
      "fever-spotlight-green",
      PUBLIC_PATH + "/images/fever-spotlight-green.png"
    );
    this.load.image(
      "fever-spotlight-yellow",
      PUBLIC_PATH + "/images/fever-spotlight-yellow.png"
    );
    this.load.spritesheet(
      "fever-wheel",
      PUBLIC_PATH + "/images/fever-wheel.png",
      {
        frameWidth: 380,
        frameHeight: 380,
        margin: 1,
        spacing: 2,
      }
    );

    this.load.spritesheet(
      "pause-button",
      PUBLIC_PATH + "/images/pause-button.png",
      {
        frameWidth: 60,
        frameHeight: 65,
        margin: 1,
        spacing: 2,
      }
    );

    this.load.spritesheet(
      "mute-button",
      PUBLIC_PATH + "/images/mute-button.png",
      {
        frameWidth: 60,
        frameHeight: 65,
        margin: 1,
        spacing: 2,
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

  loadResults() {
    this.load.image(
      "results-background",
      PUBLIC_PATH + "/images/results-background.png"
    );
    this.load.image(
      "results-frames",
      PUBLIC_PATH + "/images/results-frames.png"
    );
    this.load.image(
      "results-illustration",
      PUBLIC_PATH + "/images/results-illustration.png"
    );
    this.load.image(
      "results-tweet-button",
      PUBLIC_PATH + "/images/results-tweet-button.png"
    );
    this.load.spritesheet(
      "results-self-world-buttons",
      PUBLIC_PATH + "/images/results-self-world-buttons.png",
      {
        frameWidth: 60,
        frameHeight: 64,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "results-return-buttons",
      PUBLIC_PATH + "/images/results-return-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.image("results-level", PUBLIC_PATH + "/images/results-level.png");
    this.load.image("results-new", PUBLIC_PATH + "/images/results-new.png");

    this.load.image(
      "tweet-confirm-modal",
      PUBLIC_PATH + "/images/tweet-confirm-modal.png"
    );
    this.load.spritesheet(
      "tweet-confirm-buttons",
      PUBLIC_PATH + "/images/tweet-confirm-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 125,
        margin: 1,
        spacing: 2,
      }
    );
    this.load.spritesheet(
      "tweet-language-buttons",
      PUBLIC_PATH + "/images/tweet-language-buttons.png",
      {
        frameWidth: 160,
        frameHeight: 60,
        margin: 1,
        spacing: 2,
      }
    );
  }

  loadPause() {
    this.load.image(
      "pause-screen-logo",
      PUBLIC_PATH + "/images/pause-screen-logo.png"
    );
    this.load.spritesheet(
      "pause-screen-buttons",
      PUBLIC_PATH + "/images/pause-screen-buttons.png",
      {
        frameWidth: 230,
        frameHeight: 81,
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
    this.load.spritesheet(
      "particle-speed",
      PUBLIC_PATH + "/images/particle-speed.png",
      { frameWidth: 100, frameHeight: 100 }
    );
    this.load.spritesheet(
      "particle-bunny",
      PUBLIC_PATH + "/images/particle-bunny.png",
      { frameWidth: 128, frameHeight: 128 }
    );
    this.load.image(
      "extra-balloons",
      PUBLIC_PATH + "/images/extra-balloons.png"
    );
    this.load.image("extra-fever", PUBLIC_PATH + "/images/extra-fever.png");
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
    this.load.audio("win-music", [
      PUBLIC_PATH + "/audio/Win-Music.ogg",
      PUBLIC_PATH + "/audio/Win-Music.mp3",
    ]);

    this.load.audio("matsurisu-catch", [
      PUBLIC_PATH + "/audio/Matsurisu_Catch.ogg",
      PUBLIC_PATH + "/audio/Matsurisu_Catch.mp3",
    ]);
    this.load.audio("matsurisu-low-catch", [
      PUBLIC_PATH + "/audio/Low_Catch.ogg",
      PUBLIC_PATH + "/audio/Low_Catch.mp3",
    ]);
    [1, 2, 3, 4, 5].forEach((num) => {
      this.load.audio(`air-catch-${num}`, [
        PUBLIC_PATH + `/audio/High_Catch_${num}.ogg`,
        PUBLIC_PATH + `/audio/High_Catch_${num}.mp3`,
      ]);
    });
    this.load.audio("matsurisu-drop", [
      PUBLIC_PATH + "/audio/Matsurisu_Drop.ogg",
      PUBLIC_PATH + "/audio/Matsurisu_Drop.mp3",
    ]);
    this.load.audio("coin-catch", [
      PUBLIC_PATH + "/audio/Coin_Catch.ogg",
      PUBLIC_PATH + "/audio/Coin_Catch.mp3",
    ]);
    this.load.audio("coin-drop", [
      PUBLIC_PATH + "/audio/Coin_Drop.ogg",
      PUBLIC_PATH + "/audio/Coin_Drop.mp3",
    ]);
    this.load.audio("powerup-catch", [
      PUBLIC_PATH + "/audio/Powerup_Catch.ogg",
      PUBLIC_PATH + "/audio/Powerup_Catch.mp3",
    ]);
    this.load.audio("powerup-drop", [
      PUBLIC_PATH + "/audio/Powerup_Drop.ogg",
      PUBLIC_PATH + "/audio/Powerup_Drop.mp3",
    ]);
    this.load.audio("ebifrion-catch", [
      PUBLIC_PATH + "/audio/Ebifrion_Catch.ogg",
      PUBLIC_PATH + "/audio/Ebifrion_Catch.mp3",
    ]);
    this.load.audio("ebifrion-drop", [
      PUBLIC_PATH + "/audio/Ebifrion_Drop.ogg",
      PUBLIC_PATH + "/audio/Ebifrion_Drop.mp3",
    ]);

    this.load.audio("walk", [
      PUBLIC_PATH + "/audio/Walk.ogg",
      PUBLIC_PATH + "/audio/Walk.mp3",
    ]);
    this.load.audio("crawl", [
      PUBLIC_PATH + "/audio/Crawl.ogg",
      PUBLIC_PATH + "/audio/Crawl.mp3",
    ]);
    this.load.audio("slide", [
      PUBLIC_PATH + "/audio/Slide.ogg",
      PUBLIC_PATH + "/audio/Slide.mp3",
    ]);
    this.load.audio("jump", [
      PUBLIC_PATH + "/audio/Jump.ogg",
      PUBLIC_PATH + "/audio/Jump.mp3",
    ]);
    this.load.audio("jump-boosted", [
      PUBLIC_PATH + "/audio/Jump_Boosted.ogg",
      PUBLIC_PATH + "/audio/Jump_Boosted.mp3",
    ]);

    ["balloon", "bunny", "stim"].forEach((sound) => {
      this.load.audio(`${sound}-start`, [
        PUBLIC_PATH + `/audio/${sound}-start.ogg`,
        PUBLIC_PATH + `/audio/${sound}-start.mp3`,
      ]);
      this.load.audio(`${sound}-timeout`, [
        PUBLIC_PATH + `/audio/${sound}-timeout.ogg`,
        PUBLIC_PATH + `/audio/${sound}-timeout.mp3`,
      ]);
    });

    this.load.audio("shop-buy", [
      PUBLIC_PATH + "/audio/Buy.ogg",
      PUBLIC_PATH + "/audio/Buy.mp3",
    ]);

    this.load.audio("menu-open", [
      PUBLIC_PATH + "/audio/Open.ogg",
      PUBLIC_PATH + "/audio/Open.mp3",
    ]);
    this.load.audio("menu-click", [
      PUBLIC_PATH + "/audio/Click.ogg",
      PUBLIC_PATH + "/audio/Click.mp3",
    ]);
    this.load.audio("menu-no", [
      PUBLIC_PATH + "/audio/No.ogg",
      PUBLIC_PATH + "/audio/No.mp3",
    ]);

    this.load.audio("stage-full-combo", [
      PUBLIC_PATH + "/audio/Round-End.ogg",
      PUBLIC_PATH + "/audio/Round-End.mp3",
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
    this.loadTitle();
    this.loadModals();
    this.loadStage();
    this.loadShop();
    this.loadResults();
    this.loadPause();
    this.loadItems();
    this.loadSounds();
  }

  createAnimations() {
    const makeCharacterAnimations = (baseName) => {
      this.anims.create({
        key: baseName + ".idle.left",
        frames: [{ key: baseName + "-idle", frame: 0 }],
        frameRate: 10,
      });
      this.anims.create({
        key: baseName + ".idle.right",
        frames: [{ key: baseName + "-idle", frame: 1 }],
        frameRate: 10,
      });
      this.anims.create({
        key: baseName + ".run.left",
        frames: this.anims.generateFrameNumbers(baseName + "-left", {
          frames: [0, 1, 2, 3],
        }),
        frameRate: 10,
        repeat: -1,
      });
      this.anims.create({
        key: baseName + ".run.right",
        frames: this.anims.generateFrameNumbers(baseName + "-right", {
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

    CHARACTER_PREFIXES.forEach((prefix) => {
      makeCharacterAnimations(prefix);
    });

    MATSURISU.forEach((risuType) => {
      this.anims.create({
        key: `matsurisu-${risuType}.fall`,
        frames: this.anims.generateFrameNumbers(`matsurisu-${risuType}`, {
          frames: [0, 1],
        }),
        frameRate: 5,
        repeat: -1,
      });
      this.anims.create({
        key: `matsurisu-${risuType}.stand`,
        frames: this.anims.generateFrameNumbers(`matsurisu-${risuType}-land`, {
          frames: [1, 2],
        }),
        frameRate: 5,
        repeat: -1,
      });
    });

    this.anims.create({
      key: "matsurisu-preview.blink",
      frames: this.anims.generateFrameNumbers("matsurisu-preview", {
        frames: [0, 1],
      }),
      frameRate: 5,
      repeat: -1,
    });
  }

  create() {
    this.game.sound.mute = store.getState().settings.mute;
    this.createAnimations();
    this.scene.add("Curtains", Curtains, false);
    this.scene.bringToTop("Curtains");
    this.scene.add("Title", Title, true);
  }
}
