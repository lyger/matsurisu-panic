import Phaser from "phaser";
import Player from "../components/player";
import Dropper from "../components/dropper";
import sendTweet from "../twitter";
import { DEPTH, HEIGHT, PLAYERHEIGHT, WIDTH } from "../globals";
import Scoreboard from "../components/scoreboard";
import { GameOver, PauseScreen, WinScreen } from "./uiscenes";
import store from "../store";
import Shop from "./shop";

const GAME_END_DELAY = 1000;
const EFFECT_FADE_DURATION = 5000;
const EFFECT_BLINK_DURATION = 500;

export default class Stage extends Phaser.Scene {
  createPlayerCollisions() {
    this.physics.add.overlap(
      this.matsuri.hitBox,
      this.dropper.matsurisu,
      (player, matsurisu) => {
        const coords = {
          x: matsurisu.x,
          y: matsurisu.y,
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
    const ground = this.add.rectangle(WIDTH / 2, PLAYERHEIGHT + 300, 720, 300);
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
  }

  create() {
    store.dispatch({ type: "stage.increaseLevel" });
    store.dispatch({ type: "score.resetCombo" });

    this.background = this.add
      .image(WIDTH / 2, HEIGHT / 2, "stage-background")
      .setDepth(DEPTH.BGBACK);
    this.matsuri = new Player(this);
    this.dropper = new Dropper(this);
    this.scoreboard = new Scoreboard(this);
    this.effects = [];

    this.createPlayerCollisions();
    this.createGroundCollisions();

    this.events.once("global.gameOver", this.gameOver, this);

    this.events.once("dropper.done", () => {
      this.time.delayedCall(GAME_END_DELAY, this.winStage, undefined, this);
    });

    this.game.events.on("blur", this.pauseGame, this);
    this.events.on("destroy", () => {
      this.game.events.removeListener("blur", this.pauseGame, this);
    });

    this.events.on("stage.addEffect", this.addEffect, this);

    this.events.emit("dropper.start");

    const debugKey = this.input.keyboard.addKey("z", true, false);
    debugKey.on("down", () => {
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

  gameOver() {
    console.log("DEBUG game over");
    this.scene.pause(this.scene.key);
    this.scene.add("GameOver", GameOver);
    this.scene.launch("GameOver");
    this.scene.moveAbove("Stage", "GameOver");
  }

  pauseGame() {
    if (this.scene.isPaused(this.scene.key)) return;
    this.scene.add("PauseScreen", PauseScreen);
    this.scene.launch("PauseScreen");
    this.scene.pause(this.scene.key);
  }

  winStage() {
    // this.scene.pause(this.scene.key);
    // this.scene.add("WinScreen", WinScreen);
    // this.scene.launch("WinScreen");
    // this.scene.moveAbove("Stage", "WinScreen");
    this.events.emit("stage.clearEffects");
    this.scene.add("Shop", Shop, true);
    this.scene.remove(this.scene.key);
  }

  alignEffects() {
    Phaser.Actions.GridAlign(this.effects, {
      width: -1,
      height: 1,
      cellWidth: -110,
      cellHeight: 110,
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
