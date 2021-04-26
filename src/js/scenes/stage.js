import Phaser from "phaser";
import { DEPTH, GROUNDHEIGHT, HEIGHT, WIDTH } from "../globals";
import Player from "../components/player";
import Dropper from "../components/dropper";
import Scoreboard from "../components/scoreboard";
import ButtonFactory from "../components/uibutton";
import sendTweet from "../twitter";
import { PauseScreen } from "./uiscenes";
import store from "../store";
import Shop from "./shop";
import Results from "./results";
import { addCurtainsTransition } from "./curtains";
import DebugCursor from "../components/debugcursor";

const GAME_START_DELAY = 1000;
const GAME_END_DELAY = 1000;
const EFFECT_FADE_DURATION = 5000;
const EFFECT_BLINK_DURATION = 500;

const PauseButton = ButtonFactory("pause-button", true);

export default class Stage extends Phaser.Scene {
  create() {
    new DebugCursor(this);
    store.dispatch({ type: "stage.increaseLevel" });
    store.dispatch({ type: "score.resetCombo" });

    this.startBgm(GAME_START_DELAY / 2000);

    this.background = this.add
      .image(WIDTH / 2, HEIGHT / 2, "stage-background")
      .setDepth(DEPTH.BGBACK);
    this.matsuri = new Player(this);
    this.dropper = new Dropper(this);
    this.scoreboard = new Scoreboard(this, 45);
    this.effects = [];

    this.createPlayerCollisions();
    this.createGroundCollisions();

    this.events.once("global.gameOver", this.loseStage, this);

    this.events.once("dropper.done", () => {
      this.time.delayedCall(GAME_END_DELAY, () => this.winStage());
    });

    this.pauseButton = new PauseButton(this, {
      x: 45,
      y: 45,
      keys: ["esc"],
      default: 0,
      over: 1,
      down: 1,
      downCallback: () => this.pauseGame(),
    }).setActive(false);
    this.add.existing(this.pauseButton);

    this.muteButton = this.add
      .sprite(675, 45, "mute-button", 0)
      .setDepth(DEPTH.UIFRONT)
      .setInteractive(this.input.makePixelPerfect());
    this.muteButton.on("pointerdown", this.toggleMute, this);

    this.game.events.on("blur", this.pauseGame, this);
    this.events.on("destroy", () => {
      this.game.events.removeListener("blur", this.pauseGame, this);
    });

    this.events.on("stage.addEffect", this.addEffect, this);
    this.events.on("resume", this.pauseButton.show, this.pauseButton);

    this.time.delayedCall(GAME_START_DELAY, () => {
      this.events.emit("dropper.start");
      this.pauseButton.setActive(true);
    });

    if (this.anims.paused) this.anims.resumeAll();

    const debugKey = this.input.keyboard.addKey("z", true, false);
    debugKey.on("down", () => {
      this.winStage();

      // POSTING TWEET
      // this.game.renderer.snapshotArea(200, 600, 300, 300, function (image) {
      //   const imgData = /base64,(.+)/.exec(image.src)[1];
      //   sendTweet(
      //     "Test tweet with media again",
      //     imgData,
      //     console.log,
      //     console.log
      //   );
      // });
    });
  }

  createPlayerCollisions() {
    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.matsurisu,
      (player, matsurisu) => {
        const state = store.getState();
        const isLow = matsurisu.y >= state.stage.matsurisu.lowCatchY;
        const isHigh = matsurisu.y <= state.stage.matsurisu.highCatchY;
        const coords = {
          x: matsurisu.x,
          y: matsurisu.y,
          isLow,
          isHigh,
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.catch", coords);
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.money,
      (player, money) => {
        const coords = {
          x: money.x,
          y: money.y,
        };
        money.destroy();
        this.events.emit("money.catch", coords);
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.powerup,
      (player, powerup) => {
        const target = powerup.getData("target");
        const data = {
          x: powerup.x,
          y: powerup.y,
          target,
        };
        store.dispatch({
          type: "player.setPowerup",
          payload: target,
        });
        powerup.destroy();
        this.events.emit("powerup.catch", data);
      }
    );

    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.ebifrion,
      (player, ebifrion) => {
        const data = {
          x: ebifrion.x,
          y: ebifrion.y,
          rotation: ebifrion.rotation,
        };
        ebifrion.destroy();
        this.events.emit("ebifrion.catch", data);
      }
    );
  }

  createGroundCollisions() {
    const ground = this.add
      .rectangle(WIDTH / 2, GROUNDHEIGHT, 720, 300)
      .setOrigin(0.5, 0);
    this.physics.add.existing(ground, true);

    this.physics.add.collider(
      ground,
      this.dropper.matsurisu,
      (ground, matsurisu) => {
        const coords = {
          x: matsurisu.x,
          y: matsurisu.y,
        };
        matsurisu.destroy();
        this.events.emit("matsurisu.drop", coords);
      }
    );

    this.physics.add.collider(ground, this.dropper.money, (ground, money) => {
      const coords = {
        x: money.x,
        y: money.y,
      };
      money.destroy();
      this.events.emit("money.drop", coords);
    });

    this.physics.add.collider(
      ground,
      this.dropper.powerup,
      (ground, powerup) => {
        const data = {
          x: powerup.x,
          y: powerup.y,
          target: powerup.getData("target"),
        };
        powerup.destroy();
        this.events.emit("powerup.drop", data);
      }
    );

    this.physics.add.collider(
      ground,
      this.dropper.ebifrion,
      (ground, ebifrion) => {
        const coords = {
          x: ebifrion.x,
          y: ebifrion.y,
          rotation: ebifrion.rotation,
        };
        ebifrion.destroy();
        this.events.emit("ebifrion.drop", coords);
      }
    );

    this.physics.add.collider(ground, this.matsuri.bodySprite);
    this.physics.add.collider(ground, this.matsuri.armSprite);
  }

  startBgm(delay) {
    this.bgm = this.sound.add("matsuri-samba", {
      loop: true,
      volume: 0.1,
    });
    this.bgm.play({ delay });
  }

  fadeBgm(duration) {
    this.tweens.add({
      targets: this.bgm,
      volume: 0.0,
      duration,
      onComplete: () => this.bgm.destroy(),
    });
  }

  toggleMute() {
    const isMuted = this.game.sound.mute;
    this.game.sound.mute = !isMuted;
    this.muteButton.setFrame(isMuted ? 0 : 1);
  }

  loseStage() {
    this.matsuri.disable();
    this.dropper.pause();
    this.pauseButton.setActive(false);
    this.fadeBgm(1000);
    this.time.delayedCall(GAME_END_DELAY, () => this.gameOver());
  }

  pauseGame() {
    if (this.scene.systems.isTransitioning()) return;
    if (this.scene.isPaused(this.scene.key)) return;
    this.scene.add("PauseScreen", PauseScreen);
    this.scene.launch("PauseScreen");
    this.scene.pause(this.scene.key);
  }

  winStage() {
    this.events.emit("stage.clearEffects");
    this.pauseButton.setActive(false);
    this.fadeBgm(1000);
    const state = store.getState();
    if (state.stage.level === state.stage.maxLevel) {
      this.gameOver();
    } else {
      addCurtainsTransition({
        scene: this,
        targetKey: "Shop",
        targetClass: Shop,
        duration: 1000,
      });
    }
  }

  gameOver() {
    addCurtainsTransition({
      scene: this,
      targetKey: "Results",
      targetClass: Results,
      duration: 1000,
    });
  }

  alignEffects() {
    Phaser.Actions.GridAlign(this.effects, {
      width: -1,
      height: 1,
      cellWidth: -90,
      cellHeight: 90,
      position: Phaser.Display.Align.CENTER,
      x: 670,
      y: 120,
    });
  }

  addEffect({ texture, frame, duration }) {
    const newEffect = this.add
      .image(0, 0, texture, frame)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTH.UIFRONT)
      .setScale(0.75, 0.75);
    this.effects.push(newEffect);
    this.alignEffects();
    this.time.delayedCall(duration - EFFECT_FADE_DURATION, () => {
      this.tweens.add({
        targets: newEffect,
        alpha: 0,
        yoyo: true,
        duration: EFFECT_BLINK_DURATION,
        repeat:
          Math.floor(EFFECT_FADE_DURATION / (EFFECT_BLINK_DURATION * 2)) - 1,
        onComplete: (blinkTween) => {
          this.tweens.remove(blinkTween);
          this.tweens.add({
            targets: newEffect,
            alpha: 0,
            duration: EFFECT_BLINK_DURATION,
            repeat: 0,
            onComplete: (fadeTween) => {
              this.tweens.remove(fadeTween);
              this.effects.splice(this.effects.indexOf(newEffect), 1);
              newEffect.destroy();
              this.alignEffects();
            },
          });
        },
      });
    });
  }

  update(time) {
    this.matsuri.update(time);
    this.dropper.update(time);
  }
}
